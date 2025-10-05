import { prisma } from './db.js';

export async function resolveWinnerIfFirst(matchId: string, submissionId: string) {
  const updated = await prisma.match.updateMany({
    where: { id: matchId, winnerSubmissionId: null },
    data: { winnerSubmissionId: submissionId, endedAt: new Date() }
  });
  return updated.count === 1; // true => you won the race
}
