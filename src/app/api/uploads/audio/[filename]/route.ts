import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
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
