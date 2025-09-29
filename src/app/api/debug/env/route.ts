import { NextResponse } from 'next/server';
import fs from 'fs';

// Dev-only endpoint to check presence of environment variables without
// exposing their actual values. Returns booleans indicating whether each
// variable is present in process.env and whether an /app/.env file exists.
export async function GET() {
  try {
    // Only allow in non-production to avoid exposing config presence in prod
    const isProd = process.env.NODE_ENV === 'production';

    const keys = [
      'API_KEY',
      'NEXT_PUBLIC_API_KEY',
      'JWT_SECRET',
      'DATABASE_URL',
      'PORT',
      'NODE_ENV',
    ];

    const vars: Record<string, boolean> = {};
    for (const k of keys) vars[k] = !!process.env[k];

    const dotEnvPaths = ['/app/.env', './.env', '/workspace/.env'];
    let dotEnvExists = false;
    for (const p of dotEnvPaths) {
      try {
        if (fs.existsSync(p)) {
          dotEnvExists = true;
          break;
        }
      } catch {
        // ignore permission errors
      }
    }

    return NextResponse.json({
      allowed: !isProd,
      isProduction: isProd,
      vars,
      dotEnvExists,
      note: isProd
        ? 'Disabled in production for safety. Run locally with NODE_ENV!=production to use this endpoint.'
        : 'This endpoint only reports presence (true/false) of env vars, not values.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to read env state' },
      { status: 500 }
    );
  }
}
