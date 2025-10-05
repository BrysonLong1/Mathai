import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db.js';

export default async function leaderboard(app: FastifyInstance) {
  // last 20 finished matches that have a winner
  app.get('/leaderboard', async () => {
    const matches = await prisma.match.findMany({
      where: { winnerSubmissionId: { not: null } },
      orderBy: { endedAt: 'desc' },
      take: 20,
      include: {
        submissions: {
          where: { id: { equals: undefined as any } } // not needed, but keeps TS quiet if strict
        }
      }
    });

    // resolve winner submission to get the time
    const rows = await Promise.all(
      matches.map(async (m) => {
        const winner = m.winnerSubmissionId
          ? await prisma.submission.findUnique({
              where: { id: m.winnerSubmissionId }
            })
          : null;

        return {
          matchId: m.id,
          entryFee: m.entryFee,
          timeMs: winner?.durationMs ?? null,
          endedAt: m.endedAt ? m.endedAt.toISOString() : null,
        };
      })
    );

    return rows;
  });
}
