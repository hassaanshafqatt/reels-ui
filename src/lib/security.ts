import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

/**
 * Rate limiting middleware
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  resetTime?: number;
} {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: userLimit.resetTime };
  }

  // Increment counter
  userLimit.count++;
  return { allowed: true };
}

/**
 * Enhanced API key verification with additional security checks
 */
export function verifyApiKey(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  const apiKey = request.headers.get('x-api-key');
  const userAgent = request.headers.get('user-agent');
  const origin = request.headers.get('origin');

  // Check if API key exists
  if (!apiKey) {
    return { valid: false, error: 'Missing API key' };
  }

  // Check if API key matches environment variable
  if (apiKey !== process.env.API_KEY) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Additional security checks for production
  if (process.env.NODE_ENV === 'production') {
    // Check for suspicious user agents
    if (!userAgent || userAgent.length < 10) {
      return { valid: false, error: 'Invalid user agent' };
    }

    // Check for allowed origins (if configured)
    if (process.env.ALLOWED_ORIGINS) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
      if (origin && !allowedOrigins.includes(origin)) {
        return { valid: false, error: 'Origin not allowed' };
      }
    }
  }

  return { valid: true };
}

/**
 * Input validation utilities
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE || '10485760'); // 10MB default

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize} bytes`,
    };
  }

  // Check file type
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/aac'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only audio files are allowed.',
    };
  }

  return { valid: true };
}

/**
 * Security headers middleware
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': process.env.CSP_HEADER || "default-src 'self'",
  };
}

/**
 * Comprehensive API security middleware
 */
export async function apiSecurityMiddleware(
  request: NextRequest,
  options: {
    requireApiKey?: boolean;
    rateLimit?: boolean;
    allowedMethods?: string[];
  } = {}
): Promise<{ success: boolean; response?: NextResponse; error?: string }> {
  const {
    requireApiKey = true,
    rateLimit = true,
    allowedMethods = ['GET', 'POST'],
  } = options;

  // Check HTTP method
  if (!allowedMethods.includes(request.method)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Method ${request.method} not allowed` },
        { status: 405, headers: getSecurityHeaders() }
      ),
    };
  }

  // Rate limiting
  if (rateLimit) {
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      const resetTime = Math.ceil(
        (rateLimitResult.resetTime! - Date.now()) / 1000
      );
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Rate limit exceeded', resetIn: resetTime },
          {
            status: 429,
            headers: {
              ...getSecurityHeaders(),
              'Retry-After': resetTime.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime!.toString(),
            },
          }
        ),
      };
    }
  }

  // API key verification
  if (requireApiKey) {
    const apiKeyResult = verifyApiKey(request);
    if (!apiKeyResult.valid) {
      return {
        success: false,
        response: NextResponse.json(
          { error: apiKeyResult.error },
          { status: 401, headers: getSecurityHeaders() }
        ),
      };
    }
  }

  return { success: true };
}
