import Cookies from 'js-cookie';

export const TOKEN_COOKIE = 'auth_token';

// In-memory access token for the client (not persisted)
let accessToken: string | null = null;

/**
 * Get the client auth token. Primary source: cookie (js-cookie).
 * Fallback: localStorage 'token' for legacy support (only in browser).
 */
export function getAuthToken(): string | null {
  // Prefer in-memory access token set by AuthContext
  if (accessToken) return accessToken;

  try {
    const cookieToken = Cookies.get(TOKEN_COOKIE);
    if (cookieToken) return cookieToken;

    if (typeof window !== 'undefined' && window.localStorage) {
      const ls = localStorage.getItem('token');
      if (ls) return ls;
    }
  } catch {
    // ignore read errors
  }

  return null;
}

/**
 * Convenience to build headers for authenticated requests.
 * By default includes 'Content-Type: application/json'.
 */
export function getAuthHeaders(includeJson = true): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (includeJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function setAuthToken(token: string, opts?: { expiresDays?: number }) {
  try {
    Cookies.set(TOKEN_COOKIE, token, {
      expires: opts?.expiresDays ?? 7,
      sameSite: 'lax',
      path: '/',
    });
    // Also set legacy localStorage for older code paths (non-SSRed)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('token', token);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export function removeAuthToken() {
  try {
    Cookies.remove(TOKEN_COOKIE);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('token');
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

const clientAuth = {
  getAuthToken,
  getAuthHeaders,
  setAuthToken,
  removeAuthToken,
  setAccessToken: (t: string | null) => {
    accessToken = t;
  },
  getAccessToken: () => accessToken,
};

export default clientAuth;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}
