export default {
  async scheduled(_event: unknown, _env: unknown, _ctx: unknown): Promise<void> {
    console.log('Run scheduled batch orchestration here.');
  },
  async fetch(): Promise<Response> {
    return new Response('keyword-metrics-worker');
  }
};
