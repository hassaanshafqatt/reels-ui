import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, stat, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { sessionOperations } from '@/lib/database';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

// File tracking for cleanup
const fileAccessTracker = new Map<string, { lastAccessed: Date; accessCount: number }>();

// Helper function to calculate file hash
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
      if (file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a') || file.endsWith('.aac')) {
        const filePath = path.join(uploadsDir, file);
        const fileBuffer = await readFile(filePath);
        const fileHash = await calculateFileHash(fileBuffer);
        if (fileHash === targetHash) {
          return file;
        }
      }
    }
  } catch (error) {
    console.error('Error checking for duplicate files:', error);
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
      if (file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a') || file.endsWith('.aac')) {
        const filePath = path.join(uploadsDir, file);
        const stats = await stat(filePath);
        const fileAge = now.getTime() - stats.mtime.getTime();

        // Delete files older than max age
        if (fileAge > maxAge) {
          await unlink(filePath);
          cleanedCount++;
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleanup completed: ${cleanedCount} files removed`);
    }
  } catch (error) {
    console.error('Error during file cleanup:', error);
  }
}

// Helper function to verify JWT token
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// Helper function to verify auth
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  
  if (!payload || !payload.userId) {
    return null;
  }

  // Verify session exists
  const session = sessionOperations.findByToken(token);
  if (!session) {
    return null;
  }

  return { id: payload.userId, email: payload.email };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload MP3, WAV, M4A, or AAC files.' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` 
      }, { status: 413 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Convert file to buffer and calculate hash
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileHash = await calculateFileHash(buffer);

    // Check if file with same content already exists
    const existingFile = await findExistingFileByHash(fileHash, uploadsDir);

    let uniqueFilename: string;
    let filePath: string;

    if (existingFile) {
      // Use existing file
      uniqueFilename = existingFile;
      filePath = path.join(uploadsDir, uniqueFilename);
      console.log(`Duplicate file detected, using existing: ${uniqueFilename}`);
    } else {
      // Create new file
      const fileExtension = path.extname(audioFile.name);
      uniqueFilename = `${randomUUID()}${fileExtension}`;
      filePath = path.join(uploadsDir, uniqueFilename);

      // Save the new file
      await writeFile(filePath, buffer);
      console.log(`New audio file uploaded: ${uniqueFilename}, size: ${audioFile.size} bytes`);
    }

    // Run cleanup in background (don't await to avoid blocking response)
    cleanupOldFiles(uploadsDir).catch(error => {
      console.error('Background cleanup error:', error);
    });

    // Generate streamable URL using hostname from environment
    const hostname = process.env.PUBLIC_HOSTNAME || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const streamableUrl = `${hostname}/api/uploads/audio/${uniqueFilename}`;

    console.log(`Streamable URL: ${streamableUrl}`);

    return NextResponse.json({
      success: true,
      filename: uniqueFilename,
      originalName: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      url: streamableUrl,
      isDuplicate: !!existingFile
    });

  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    );
  }
}
