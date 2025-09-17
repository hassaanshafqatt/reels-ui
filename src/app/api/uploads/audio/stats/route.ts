import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Helper function to verify API key
async function verifyApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  // Check if API key matches the one in environment variables
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Verify API key for stats operations
    const isValidApiKey = await verifyApiKey(request);
    if (!isValidApiKey) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');

    if (!existsSync(uploadsDir)) {
      return NextResponse.json({
        totalFiles: 0,
        totalSize: 0,
        files: [],
        oldestFile: null,
        newestFile: null
      });
    }

    const files = await readdir(uploadsDir);
    const audioFiles = files.filter(file =>
      file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a') || file.endsWith('.aac')
    );

    let totalSize = 0;
    let oldestFile = null;
    let newestFile = null;
    const fileStats = [];

    for (const file of audioFiles) {
      const filePath = path.join(uploadsDir, file);
      const stats = await stat(filePath);

      totalSize += stats.size;

      const fileInfo = {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        age: Date.now() - stats.mtime.getTime()
      };

      fileStats.push(fileInfo);

      if (!oldestFile || stats.mtime < oldestFile.modified) {
        oldestFile = fileInfo;
      }

      if (!newestFile || stats.mtime > newestFile.modified) {
        newestFile = fileInfo;
      }
    }

    return NextResponse.json({
      totalFiles: audioFiles.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      files: fileStats,
      oldestFile,
      newestFile,
      cleanupThreshold: '24 hours'
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get file statistics' },
      { status: 500 }
    );
  }
}