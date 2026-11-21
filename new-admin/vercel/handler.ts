// Vercel entry point (NOT active yet). At deploy time this is copied to <repo>/api/server.ts
// and vercel.json rewrites /api/* and /media/* to it. See ../README.md.
import { route } from '../server/routes';

export default {
  async fetch(request: Request) {
    return (await route(request)) ?? Response.json({ error: 'Not found' }, { status: 404 });
  }
};
