import { env } from '../env';

/** Serves uploaded photos and videos: /media/church/images/<file> */
export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname.replace(/^\/(api\/)?media\//, '');
  const key = pathname.split('/').map(p => { try { return decodeURIComponent(p); } catch { return p; } }).join('/');
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Media not found', { status: 404 });
  return new Response(object.body as BodyInit, {
    headers: {
      'content-type': object.contentType,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff'
    }
  });
}
