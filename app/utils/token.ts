/**
 * Client-side JWT utilities.
 * Decodes without the jsonwebtoken library (safe for browser/localStorage).
 */

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  status: string;
  role: string;
  exp: number;
  iss: string;
  aud: string;
}

/** Decode the payload of a JWT without verifying signature (client-side only). */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

/** Returns true if the token is structurally valid and not expired. */
export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  return Date.now() < payload.exp * 1000;
}

/** Get the stored token from localStorage (safe: returns null on SSR). */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Remove the stored token (logout helper). */
export function clearStoredToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem("token");
}
