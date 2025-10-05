// apps/backend/src/env.ts
import 'dotenv/config';

function must(v: string | undefined, name: string): string {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function parsePort(v: string | undefined, fallback = 8080): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const ENV = {
  // Server
  PORT: parsePort(process.env.PORT, 8080),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  // Database
  DATABASE_URL: must(process.env.DATABASE_URL, 'DATABASE_URL'),

  // Auth
  JWT_SECRET: must(process.env.JWT_SECRET, 'JWT_SECRET'),
  COOKIE_SECRET: must(process.env.COOKIE_SECRET, 'COOKIE_SECRET'),

  // Stripe
  STRIPE_SECRET_KEY: must(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'),
  PRICE_ID_1: must(process.env.PRICE_ID_1, 'PRICE_ID_1'),
  PRICE_ID_5: must(process.env.PRICE_ID_5, 'PRICE_ID_5'),
  PRICE_ID_100: must(process.env.PRICE_ID_100, 'PRICE_ID_100'),

  // Email (SendGrid)
  SENDGRID_API_KEY: must(process.env.SENDGRID_API_KEY, 'SENDGRID_API_KEY'),
  FROM_EMAIL: must(process.env.FROM_EMAIL, 'FROM_EMAIL'),
};

export type Env = typeof ENV;

