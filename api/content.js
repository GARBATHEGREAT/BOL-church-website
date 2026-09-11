const BACKEND = 'https://breadoflifedcm.gandjtechhub.chatgpt.site';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const upstream = await fetch(`${BACKEND}/api/content`);
    const body = await upstream.json();
    if (Array.isArray(body.contentItems)) body.contentItems = body.contentItems.map(item => ({
      ...item,
      image_url: typeof item.image_url === 'string' && item.image_url.startsWith('/media/')
        ? BACKEND + item.image_url
        : item.image_url
    }));
    response.status(upstream.status).json(body);
  } catch {
    response.status(502).json({ error: 'Content service unavailable' });
  }
}
