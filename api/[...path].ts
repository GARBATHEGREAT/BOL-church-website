// One Vercel function serves every data route: /api/content, /api/admin/*, /api/submissions, /media/*.
// The routing table and handlers live in new-admin/server.
import { route } from '../new-admin/server/routes';

async function handle(request: Request) {
  return (await route(request)) ?? Response.json({ error: 'Not found' }, { status: 404 });
}

export const GET = handle;
export const POST = handle;
