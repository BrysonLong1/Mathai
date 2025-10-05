// apps/backend/src/routes/problems.route.ts
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db.js';

export default async function problems(app: FastifyInstance) {
  // GET /problems?kind=code|all
  app.get('/problems', async (req) => {
    const q = (req.query ?? {}) as { kind?: string };
    const where =
      q.kind?.toLowerCase() === 'code'
        ? { codeTemplate: { not: null } }
        : undefined;

    return prisma.problem.findMany({
      where,
      orderBy: { prompt: 'asc' },
    });
  });

  // One sample (any)
  app.get('/problems/sample', async () => {
    const first = await prisma.problem.findFirst();
    return first ?? null;
  });
}



