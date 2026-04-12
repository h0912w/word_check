import type { Env } from './types.js';
import { runBatch } from './batchRunner.js';

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(runBatch(env));
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', name: 'keyword-metrics-worker' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Manual trigger endpoint for testing / QA
    if (url.pathname === '/trigger' && request.method === 'POST') {
      ctx.waitUntil(runBatch(env));
      return new Response(
        JSON.stringify({ status: 'triggered' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response('keyword-metrics-worker', { status: 200 });
  },
};
