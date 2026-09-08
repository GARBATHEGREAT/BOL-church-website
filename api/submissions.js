const BACKEND = 'https://breadoflifedcm.gandjtechhub.chatgpt.site';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const upstream = await fetch(`${BACKEND}/api/submissions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request.body || {})
    });
    const body = await upstream.text();
    response.status(upstream.status).setHeader('content-type', 'application/json').send(body);
  } catch {
    response.status(502).json({ error: 'Submission service unavailable' });
  }
}
