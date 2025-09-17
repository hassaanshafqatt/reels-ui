import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { sessionOperations } from '@/lib/database';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

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

    // Generate unique filename
    const fileExtension = path.extname(audioFile.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Convert file to buffer and save
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate streamable URL using hostname from environment
    const hostname = process.env.PUBLIC_HOSTNAME || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const streamableUrl = `${hostname}/api/uploads/audio/${uniqueFilename}`;

    console.log(`Audio file uploaded: ${uniqueFilename}, size: ${audioFile.size} bytes`);
    console.log(`Streamable URL: ${streamableUrl}`);

    return NextResponse.json({
      success: true,
      filename: uniqueFilename,
      originalName: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      url: streamableUrl
    });

  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    );
  }
}
