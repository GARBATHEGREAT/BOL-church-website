// Bundled by esbuild into <repo>/api/server.js at deploy time (see vercel.json buildCommand).
// Vercel rewrites /api/* and /media/* to this single function; the original URL is preserved.
import { route } from '../server/routes';

async function handle(request: Request) {
  return (await route(request)) ?? Response.json({ error: 'Not found' }, { status: 404 });
}

export const GET = handle;
export const POST = handle;
