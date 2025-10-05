// apps/backend/src/routes/practice.route.ts
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db.js';
import { grade } from '../lib/grader.js';

export default async function practice(app: FastifyInstance) {
  // POST /practice/submit
  // body: { problemId: string, response: string }
  app.post('/practice/submit', async (req, reply) => {
    const body = req.body as { problemId?: string; response?: string };
    if (!body?.problemId) {
      return reply.code(400).send({ error: 'problemId is required' });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: body.problemId },
    });

    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    const result = grade({
      problem,
      responseText: body.response ?? '',
    });

    return {
      problemId: problem.id,
      type: problem.type,
      result,
    };
  });
}
