// apps/backend/src/routes/matches.route.ts
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db.js';
import { stripe, PRICE_MAP } from '../lib/stripe.js';
import { judgeAnswer } from '../lib/judge.js';
import { verifyToken } from '../lib/jwt.js';

function requireUser(req: any) {
  const token = req.cookies?.session;
  if (!token) throw new Error('unauthorized');
  const { uid } = verifyToken<{ uid: string }>(token);
  return uid;
}

const LOBBY_WAIT_MS = 5 * 60 * 1000;
const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;

export default async function matches(app: FastifyInstance) {

  // Create or join a lobby (entryFee: 1|5|100)
  app.post('/matches/lobby', async (req, reply) => {
    try {
      const uid = requireUser(req);
      const { entryFee } = (req.body as any) ?? {};
      if (![1,5,100].includes(Number(entryFee))) return reply.code(400).send({ error: 'bad_fee' });

      // Pick a random problem (or use a queue)
      const count = await prisma.problem.count();
      if (count === 0) return reply.code(400).send({ error: 'no_problems' });
      const skip = Math.floor(Math.random() * count);
      const [problem] = await prisma.problem.findMany({ take: 1, skip });

      // Find existing lobby with same fee and space, or create new one
      let match = await prisma.match.findFirst({
        where: {
          state: 'LOBBY',
          entryFee: Number(entryFee),
          players: { some: {} },
          lobbyDeadline: { gt: new Date() },
        },
        include: { players: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!match || match.players.length >= MAX_PLAYERS) {
        match = await prisma.match.create({
          data: {
            problemId: problem.id,
            entryFee: Number(entryFee),
            state: 'LOBBY',
            lobbyDeadline: new Date(Date.now() + LOBBY_WAIT_MS),
          },
          include: { players: true },
        });
      }

      // Create (or reuse) Stripe Customer for user
      let user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user) return reply.code(401).send({ error: 'unauth' });
      if (!user.stripeCustomerId) {
        const cust = await stripe.customers.create({ email: user.email });
        user = await prisma.user.update({
          where: { id: uid },
          data: { stripeCustomerId: cust.id },
        });
      }

      // Create a PaymentIntent with manual capture (not charged yet)
      const priceId = PRICE_MAP[Number(entryFee)];
      const pi = await stripe.paymentIntents.create({
        amount: Number(entryFee) * 100, // if NOT using prices; or use prices with line items
        currency: 'usd',
        customer: user.stripeCustomerId!,
        capture_method: 'manual',
        automatic_payment_methods: { enabled: true },
        metadata: { matchId: match.id, userId: uid, entryFee: String(entryFee) },
      });

      // Add player to match
      const playersCount = await prisma.matchPlayer.count({ where: { matchId: match.id } });
      if (playersCount >= MAX_PLAYERS) return reply.code(409).send({ error: 'lobby_full' });

      await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          userId: uid,
          stripePaymentIntentId: pi.id,
        },
      });

      return reply.send({
        matchId: match.id,
        clientSecret: pi.client_secret, // confirm() from client one-click
        lobbyDeadline: match.lobbyDeadline,
      });
    } catch (e: any) {
      req.log.error(e);
      return reply.code(400).send({ error: e.message ?? 'bad_request' });
    }
  });

  // Poll lobby status or start (server will also run a background worker)
  app.get('/matches/:id/status', async (req, reply) => {
    const { id } = req.params as any;
    const m = await prisma.match.findUnique({
      where: { id },
      include: { players: true, problem: true },
    });
    if (!m) return reply.code(404).send({ error: 'not_found' });
    return {
      state: m.state,
      players: m.players.length,
      maxPlayers: MAX_PLAYERS,
      minPlayers: MIN_PLAYERS,
      lobbyDeadline: m.lobbyDeadline,
      problem: m.state !== 'LOBBY' ? { id: m.problemId, prompt: m.problem.prompt, codeTemplate: m.problem.codeTemplate } : null,
    };
  });

  // Background tick (every 5–10s) – you can call this from a cron or setInterval on server start
  app.post('/matches/tick', async (_req, reply) => {
    const now = new Date();

    // Start matches that have >=2 players OR hit deadline with >=2 players
    const lobbies = await prisma.match.findMany({
      where: { state: 'LOBBY', lobbyDeadline: { lte: new Date(now.getTime() + 2000) } },
      include: { players: true },
    });

    for (const m of lobbies) {
      if (m.players.length >= MIN_PLAYERS) {
        // CAPTURE all PIs (charge now)
        for (const mp of m.players) {
          try {
            const pi = await stripe.paymentIntents.retrieve(mp.stripePaymentIntentId);
            if (pi.status === 'requires_capture') {
              await stripe.paymentIntents.capture(pi.id);
            }
            await prisma.matchPlayer.update({ where: { id: mp.id }, data: { paymentCaptured: true } });
          } catch (err) {
            // If any capture fails, you could cancel the match and refund others
          }
        }
        await prisma.match.update({
          where: { id: m.id },
          data: { state: 'ACTIVE', startedAt: now },
        });
      } else {
        // Not enough players: cancel PIs and mark cancel → clients redirect to practice
        for (const mp of m.players) {
          try { await stripe.paymentIntents.cancel(mp.stripePaymentIntentId); } catch {}
        }
        await prisma.match.update({
          where: { id: m.id },
          data: { state: 'CANCELLED' },
        });
      }
    }

    return { ok: true, checked: lobbies.length };
  });

  // Submit answers (your existing logic)
  app.post('/submissions', async (req, reply) => {
    const { matchId, answerText } = (req.body as any) ?? {};
    if (!matchId || typeof answerText !== 'string') {
      return reply.code(400).send({ error: 'matchId and answerText required' });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { problem: true },
    });
    if (!match) return reply.code(404).send({ error: 'Match not found' });
    if (match.state !== 'ACTIVE') return reply.code(409).send({ error: 'not_active' });

    const correct = judgeAnswer(answerText, {
      type: match.problem.type as 'numeric' | 'string',
      answer: match.problem.answer,
      tolerance: match.problem.tolerance ?? undefined,
      aliases: match.problem.aliases ?? undefined,
    });

    const sub = await prisma.submission.create({
      data: {
        code: answerText,
        correct,
        durationMs: match.startedAt ? Math.max(0, Date.now() - match.startedAt.getTime()) : 0,
        matchId: match.id,
      },
      select: { id: true, correct: true, durationMs: true },
    });

    // First correct ends the match + payout
    if (correct && !match.endedAt) {
      await prisma.match.update({
        where: { id: match.id },
        data: { endedAt: new Date(), winnerSubmissionId: sub.id, state: 'ENDED' },
      });

      // Prize pool = sum(entryFee) * players; platform takes 20%, 80% → winner
      const players = await prisma.matchPlayer.findMany({ where: { matchId: match.id }, include: { user: true } });
      const pool = players.length * match.entryFee * 100;
      const platform = Math.round(pool * 0.20);
      const winnerTake = pool - platform;

      // Identify winner user by their submission
      // (If you track who submitted, you can store userId on submission; otherwise map via session)
      // For now this is left as a TODO unless you already attach userId to Submission.

      // TODO: lookup winner's user + stripeConnectId
      // if (winnerStripeConnectId) {
      //   await stripe.transfers.create({
      //     amount: winnerTake,
      //     currency: 'usd',
      //     destination: winnerStripeConnectId,
      //     metadata: { matchId: match.id },
      //   });
      // }

      return reply.send({ correct: true, winner: true, submissionId: sub.id });
    }

    return reply.send({ correct, winner: false, submissionId: sub.id });
  });
}


