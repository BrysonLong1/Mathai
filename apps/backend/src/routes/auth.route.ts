// apps/backend/src/routes/auth.route.ts
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db.js';
import { strongPassword, hash, compareHash } from '../lib/password.js';
// option A: namespace import (works everywhere)
import * as crypto from 'node:crypto';
// or: import * as crypto from 'crypto';

import { sendVerifyEmail } from '../lib/email.js';
import { signToken } from '../lib/jwt.js';
import rateLimit from '@fastify/rate-limit';

export default async function auth(app: FastifyInstance) {
  // Rate limit auth endpoints (5-7 attempts / 15m)
  await app.register(rateLimit, {
    max: 7,
    timeWindow: '15 minutes',
    keyGenerator: (req) => `${req.ip}:${(req.body as any)?.email ?? 'anon'}`,
  });

  app.post('/auth/register', async (req, reply) => {
    const { email, password } = (req.body as any) ?? {};
    if (!email || !password) return reply.code(400).send({ error: 'email and password required' });
    if (!strongPassword(password)) return reply.code(400).send({ error: 'weak_password' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.code(409).send({ error: 'email_in_use' });

    const user = await prisma.user.create({
      data: { email, passwordHash: await hash(password) },
      select: { id: true, email: true },
    });

    // Create verify code (6-digit) hashed and expiring
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.emailVerification.create({
      data: { userId: user.id, codeHash, expiresAt },
    });

    await sendVerifyEmail(user.email, code);

    return { ok: true, message: 'verify_sent' };
  });

  app.post('/auth/verify-email', async (req, reply) => {
    const { email, code } = (req.body as any) ?? {};
    if (!email || !code) return reply.code(400).send({ error: 'email and code required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(404).send({ error: 'not_found' });

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const rec = await prisma.emailVerification.findFirst({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!rec || rec.codeHash !== codeHash) return reply.code(400).send({ error: 'invalid_code' });

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
      prisma.emailVerification.update({ where: { id: rec.id }, data: { used: true } }),
    ]);

    return { ok: true };
  });

  app.post('/auth/login', async (req, reply) => {
    const { email, password } = (req.body as any) ?? {};
    if (!email || !password) return reply.code(400).send({ error: 'email and password required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ error: 'invalid' });
    const ok = await compareHash(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: 'invalid' });
    if (!user.emailVerified) return reply.code(403).send({ error: 'email_not_verified' });

    const token = signToken({ uid: user.id });
    reply.setCookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true };
  });
}
