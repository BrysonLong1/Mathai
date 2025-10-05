// apps/backend/src/lib/password.ts
import * as bcrypt from 'bcrypt';

/**
 * Check if password is strong:
 * - at least 12 characters
 * - contains lowercase, uppercase, number, and special character
 */
export function strongPassword(pw: string): boolean {
  return (
    typeof pw === 'string' &&
    pw.length >= 12 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

/**
 * Hash a password with bcrypt
 */
export async function hash(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

/**
 * Compare a password with its hash
 */
export async function compareHash(pw: string, h: string): Promise<boolean> {
  return bcrypt.compare(pw, h);
}
