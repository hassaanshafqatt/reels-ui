import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Helper function to verify API key for external services only
async function verifyApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  // Check if API key matches the one in environment variables
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return false;
  }

  return true;
}

// GET - Serve audio file by filename
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
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
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error('Audio file serving error:', error);
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
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    const { filename } = await params;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
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

    console.log(`Audio file deleted: ${filename} by external service`);

    return NextResponse.json({
      success: true,
      message: 'Audio file deleted successfully',
      filename: filename
    });

  } catch (error) {
    console.error('Audio deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete audio file' },
      { status: 500 }
    );
  }
}
