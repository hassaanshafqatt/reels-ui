import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { verifyApiKey } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Verify API key for cleanup operations
    const apiKeyResult = verifyApiKey(request);
    if (!apiKeyResult.valid) {
      return NextResponse.json(
        { error: apiKeyResult.error || 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');

    if (!existsSync(uploadsDir)) {
      return NextResponse.json({
        success: true,
        message: 'No uploads directory found',
        cleanedFiles: [],
      });
    }

    const files = await readdir(uploadsDir);
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cleanedFiles: string[] = [];

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
          cleanedFiles.push(file);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedFiles.length} files`,
      cleanedFiles,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to cleanup files' },
      { status: 500 }
    );
  }
}
