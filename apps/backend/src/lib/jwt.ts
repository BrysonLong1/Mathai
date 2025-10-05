// apps/backend/src/lib/jwt.ts
import * as jwt from 'jsonwebtoken';
import { ENV } from '../env.js';

export function signToken(payload: object) {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });
}
export function verifyToken<T>(token: string): T {
  return jwt.verify(token, ENV.JWT_SECRET) as T;
}