import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db.js';
// apps/backend/src/routes/grade.route.ts
import { runPython } from '../services/pythonRunner';      // ✅ works with tsx



export default async function grade(app: FastifyInstance) {
  // Grade either short answers (NUMERIC/STRING) or CODE
  app.post('/grade', async (req, reply) => {
    const body = req.body as {
      problemId: string;
      kind: 'NUMERIC' | 'STRING' | 'CODE';
      submission: string; // for CODE: full editor contents
    };

    if (!body?.problemId || !body?.kind) {
      return reply.code(400).send({ error: 'Missing problemId/kind' });
    }
    const problem = await prisma.problem.findUnique({ where: { id: body.problemId } });
    if (!problem) return reply.code(404).send({ error: 'Problem not found' });

    // Simple non-code grading
    if (body.kind !== 'CODE') {
      const correct = checkSimple(problem, body.submission ?? '');
      return reply.send({ correct, message: correct ? 'Correct' : 'Incorrect' });
    }

    // CODE grading: run with harness
    try {
      const result = await runPython(problem, body.submission);
      return reply.send(result);
    } catch (e: any) {
      return reply.code(400).send({ error: String(e?.message || e) });
    }
  });
}

function checkSimple(
  problem: { type: string; answer: string; tolerance: number | null },
  submission: string
) {
  if (problem.type === 'NUMERIC') {
    const tol = problem.tolerance ?? 1e-6;
    const got = Number(submission);
    const want = Number(problem.answer);
    if (!Number.isFinite(got) || !Number.isFinite(want)) return false;
    return Math.abs(got - want) <= tol;
  }
  // STRING: trim & case-insensitive compare; allow aliases if you want
  return String(submission).trim().toLowerCase() === String(problem.answer).trim().toLowerCase();
}
