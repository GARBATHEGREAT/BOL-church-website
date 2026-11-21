// One routing table used by the local dev server now and by the Vercel functions later.
import * as admin from './handlers/admin';
import * as adminLogin from './handlers/adminLogin';
import * as adminLogout from './handlers/adminLogout';
import * as adminMe from './handlers/adminMe';
import * as upload from './handlers/upload';
import * as content from './handlers/content';
import * as submissions from './handlers/submissions';
import * as media from './handlers/media';

type Handler = (request: Request) => Promise<Response> | Response;
type Module = Partial<Record<'GET' | 'POST', Handler>>;

const exact: Record<string, Module> = {
  '/api/admin': admin,
  '/api/admin/me': adminMe,
  '/api/admin/upload': upload,
  '/api/admin-login': adminLogin,
  '/api/admin-logout': adminLogout,
  '/api/content': content,
  '/api/submissions': submissions
};

export async function route(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const mod: Module | undefined = pathname.startsWith('/media/') ? (media as Module) : exact[pathname.replace(/\/$/, '')];
  if (!mod) return null;
  const handler = mod[request.method as 'GET' | 'POST'];
  if (!handler) return new Response('Method not allowed', { status: 405 });
  try { return await handler(request); }
  catch (error) {
    console.error(pathname, error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
