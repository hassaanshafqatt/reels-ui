import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, stat, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { logger, withErrorHandler, withLogging } from '@/lib/logger';
import { verifyAuth } from '@/lib/auth';
import { validateFileUpload, getSecurityHeaders } from '@/lib/security';


// File tracking for cleanup and security monitoring
const fileAccessTracker = new Map<string, {
  lastAccessed: Date;
  accessCount: number;
  uploadedBy: string;
  uploadTime: Date;
  fileHash: string;
  fileSize: number;
}>();

// Security configuration
const SECURITY_CONFIG = {
  maxFileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760'), // 10MB default
  allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'],
  allowedExtensions: ['.mp3', '.wav', '.m4a', '.aac'],
  maxFilesPerUser: 50, // Maximum files per user per hour
  suspiciousPatterns: [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /\.\./, // Directory traversal
    /\/\//, // Double slashes
  ],
  quarantineThreshold: 0.8, // 80% confidence for malware detection
};

// Rate limiting storage
const uploadRateLimit = new Map<string, { count: number; resetTime: number }>();

/**
 * Enhanced file validation with security checks
 */
async function validateAndSanitizeFile(file: File, userId: string): Promise<{
  valid: boolean;
  error?: string;
  sanitizedName?: string;
  securityScore?: number;
}> {
  // Basic validation using security utility
  const basicValidation = validateFileUpload(file);
  if (!basicValidation.valid) {
    return { valid: false, error: basicValidation.error };
  }

  // Additional security checks
  const fileName = file.name;
  const fileExtension = path.extname(fileName).toLowerCase();

  // Check for suspicious filename patterns
  for (const pattern of SECURITY_CONFIG.suspiciousPatterns) {
    if (pattern.test(fileName)) {
      logger.warn('Suspicious filename pattern detected', {
        userId,
        fileName,
        pattern: pattern.source,
      });
      return { valid: false, error: 'Invalid filename' };
    }
  }

  // Validate file extension matches MIME type
  if (!SECURITY_CONFIG.allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'File extension not allowed' };
  }

  // Sanitize filename
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 100); // Limit length

  // Basic malware detection (file entropy and pattern analysis)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const securityScore = await analyzeFileSecurity(buffer);

  if (securityScore > SECURITY_CONFIG.quarantineThreshold) {
    logger.warn('File flagged for potential malware', {
      userId,
      fileName: sanitizedName,
      securityScore,
      fileSize: file.size,
    });
    // In production, you might want to quarantine the file instead of rejecting
    return { valid: false, error: 'File flagged as potentially malicious' };
  }

  return {
    valid: true,
    sanitizedName,
    securityScore,
  };
}

/**
 * Analyze file for security threats
 */
async function analyzeFileSecurity(buffer: Buffer): Promise<number> {
  // Simple entropy calculation (high entropy might indicate encryption/compression)
  const entropy = calculateEntropy(buffer);

  // Check for suspicious byte patterns
  const suspiciousPatterns = [
    Buffer.from('MZ'), // Windows executable
    Buffer.from('ELF'), // Linux executable
    Buffer.from('#!/'), // Script shebang
    Buffer.from('<script'), // HTML script tag
  ];

  let patternScore = 0;
  for (const pattern of suspiciousPatterns) {
    if (buffer.includes(pattern)) {
      patternScore += 0.3;
    }
  }

  // Calculate final security score (0 = safe, 1 = suspicious)
  return Math.min(1, (entropy * 0.4) + patternScore);
}

/**
 * Calculate file entropy
 */
function calculateEntropy(buffer: Buffer): number {
  const byteCounts = new Array(256).fill(0);
  const length = buffer.length;

  // Count byte frequencies
  for (let i = 0; i < length; i++) {
    byteCounts[buffer[i]]++;
  }

  // Calculate entropy
  let entropy = 0;
  for (const count of byteCounts) {
    if (count > 0) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }
  }

  // Normalize to 0-1 range (8 bits max entropy)
  return entropy / 8;
}

/**
 * Check upload rate limits
 */
function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const userLimit = uploadRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // First upload or window expired
    uploadRateLimit.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (userLimit.count >= SECURITY_CONFIG.maxFilesPerUser) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Enhanced file hash calculation with metadata
 */
async function calculateFileHashWithMetadata(buffer: Buffer): Promise<{
  hash: string;
  size: number;
  mimeType?: string;
}> {
  const hash = createHash('sha256');
  hash.update(buffer);

  return {
    hash: hash.digest('hex'),
    size: buffer.length,
  };
}

// Simple hash helper (used to check for duplicates)
async function calculateFileHash(buffer: Buffer): Promise<string> {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

// Helper function to find existing file by hash
async function findExistingFileByHash(targetHash: string, uploadsDir: string): Promise<string | null> {
  try {
    const files = await readdir(uploadsDir);
    for (const file of files) {
      if (
        file.endsWith('.mp3') ||
        file.endsWith('.wav') ||
        file.endsWith('.m4a') ||
        file.endsWith('.aac')
      ) {
        const filePath = path.join(uploadsDir, file);
        const fileBuffer = await readFile(filePath);
        const fileHash = await calculateFileHash(fileBuffer);
        if (fileHash === targetHash) {
          return file;
        }
      }
    }
  } catch (err: unknown) {
    logger.warn('Error checking for duplicate files', { error: err instanceof Error ? err.message : String(err) });
  }
  return null;
}

// Helper function to cleanup old files
async function cleanupOldFiles(uploadsDir: string) {
  try {
    const files = await readdir(uploadsDir);
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleanedCount = 0;

    for (const file of files) {
      if (
        file.endsWith('.mp3') ||
        file.endsWith('.wav') ||
        file.endsWith('.m4a') ||
        file.endsWith('.aac')
      ) {
        const filePath = path.join(uploadsDir, file);
        const stats = await stat(filePath);
        const fileAge = now.getTime() - stats.mtime.getTime();

        // Delete files older than max age
        if (fileAge > maxAge) {
          await unlink(filePath);
          cleanedCount++;
          logger.info(`Cleaned up old file: ${file}`);
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Automatic cleanup completed: ${cleanedCount} files removed`);
    }

  } catch (err: unknown) {
    logger.error('Error during automatic file cleanup:', { error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Secure file upload handler
 */
async function handleSecureUpload(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      logger.warn('Unauthorized upload attempt', {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // Check rate limits
    if (!checkUploadRateLimit(user.id)) {
      logger.warn('Upload rate limit exceeded', { userId: user.id });
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please try again later.' },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Enhanced file validation
    const validation = await validateAndSanitizeFile(audioFile, user.id);
    if (!validation.valid) {
      logger.warn('File validation failed', {
        userId: user.id,
        error: validation.error,
        fileName: audioFile.name,
        fileSize: audioFile.size,
      });
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Convert file to buffer and calculate hash
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hashData = await calculateFileHashWithMetadata(buffer);

    // Check if file with same content already exists
    const existingFile = await findExistingFileByHash(hashData.hash, uploadsDir);

    let uniqueFilename: string;
    let filePath: string;
    let isDuplicate = false;

    if (existingFile) {
      // Use existing file
      uniqueFilename = existingFile;
      filePath = path.join(uploadsDir, uniqueFilename);
      isDuplicate = true;

      logger.info('Duplicate file detected, reusing existing file', {
        userId: user.id,
        hash: hashData.hash,
        filename: uniqueFilename,
      });
    } else {
      // Create new file
      const fileExtension = path.extname(validation.sanitizedName || audioFile.name);
      uniqueFilename = `${randomUUID()}${fileExtension}`;
      filePath = path.join(uploadsDir, uniqueFilename);

      // Save the new file
      await writeFile(filePath, buffer);

      logger.info('New file uploaded successfully', {
        userId: user.id,
        filename: uniqueFilename,
        originalName: validation.sanitizedName,
        size: hashData.size,
        hash: hashData.hash,
        securityScore: validation.securityScore,
      });
    }

    // Track file access for security monitoring
    fileAccessTracker.set(uniqueFilename, {
      lastAccessed: new Date(),
      accessCount: 1,
      uploadedBy: user.id,
      uploadTime: new Date(),
      fileHash: hashData.hash,
      fileSize: hashData.size,
    });

    // Run cleanup in background (don't await to avoid blocking response)
    cleanupOldFiles(uploadsDir).catch((err) => {
      logger.error('Background cleanup failed', { error: err instanceof Error ? err.message : String(err) });
    });

    // Generate secure streamable URL
    const hostname = process.env.PUBLIC_HOSTNAME || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const streamableUrl = `${hostname}/api/uploads/audio/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      filename: uniqueFilename,
      originalName: validation.sanitizedName || audioFile.name,
      size: hashData.size,
      type: audioFile.type,
      url: streamableUrl,
      isDuplicate,
      securityScore: validation.securityScore,
      uploadedAt: new Date().toISOString(),
    }, { headers: getSecurityHeaders() });

  } catch (err) {
    logger.error('File upload failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Export the secure upload handler with logging and error handling
export const POST = withErrorHandler(withLogging(handleSecureUpload));