import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import { ENV } from './env.js';
import problems from './routes/problems.route.js';
import matches from './routes/matches.route.js';
import practice from './routes/practice.route.js';
import grade from './routes/grade.route.js';

const app = Fastify({ logger: true });

(async () => {
  await app.register(cors, { origin: ENV.CORS_ORIGIN, credentials: false });
  await app.register(formbody);

  app.get('/health', async () => ({ ok: true }));

  await app.register(problems);
  await app.register(matches);
  await app.register(practice);
  await app.register(grade);          // <-- keep this here

  await app.listen({ port: ENV.PORT, host: '0.0.0.0' });
})().catch((err) => {
  app.log.error(err);
  process.exit(1);
});


