import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// File tracking for cleanup
const fileAccessTracker = new Map<
  string,
  {
    lastAccessed: Date;
    accessCount: number;
    scheduledDeletion?: NodeJS.Timeout;
  }
>();

// Helper function to verify API key for external services only
async function verifyApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  // Check if API key matches the one in environment variables
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return false;
  }

  return true;
}

// Helper function to schedule file deletion after first access
function scheduleFileDeletion(filename: string, filePath: string) {
  // Cancel any existing deletion timer
  const existingTracker = fileAccessTracker.get(filename);
  if (existingTracker?.scheduledDeletion) {
    clearTimeout(existingTracker.scheduledDeletion);
  }

  // Schedule deletion after 1 hour
  const deletionTimer = setTimeout(
    async () => {
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
        fileAccessTracker.delete(filename);
      } catch {
        // Failed to delete file - ignore in background
      }
    },
    60 * 60 * 1000
  ); // 1 hour

  fileAccessTracker.set(filename, {
    lastAccessed: new Date(),
    accessCount: (existingTracker?.accessCount || 0) + 1,
    scheduledDeletion: deletionTimer,
  });
}

// GET - Serve audio file by filename
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Validate filename to prevent directory traversal attacks
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Construct file path
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);
    const uint8Array = new Uint8Array(fileBuffer);

    // Track file access and schedule deletion
    scheduleFileDeletion(filename, filePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
      case '.m4a':
        contentType = 'audio/mp4';
        break;
      case '.aac':
        contentType = 'audio/aac';
        break;
    }

    // Return the file with appropriate headers
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour (reduced for cleanup)
        'Accept-Ranges': 'bytes',
        'X-File-Access-Count':
          fileAccessTracker.get(filename)?.accessCount?.toString() || '1',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to serve audio file' },
      { status: 500 }
    );
  }
}

// DELETE - Delete audio file by filename
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Verify API key for external services
    const isValidApiKey = await verifyApiKey(request);
    if (!isValidApiKey) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const { filename } = await params;

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Validate filename to prevent directory traversal attacks
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Construct file path
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete the file
    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'Audio file deleted successfully',
      filename: filename,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete audio file' },
      { status: 500 }
    );
  }
}
