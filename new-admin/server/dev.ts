// Local API server: node server/dev.ts  (listens on API_PORT, default 8787)
import http from 'node:http';
import { route } from './routes';

const port = Number(process.env.API_PORT || 8787);

http.createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);
  const origin = `http://${req.headers.host || 'localhost:' + port}`;
  const request = new Request(origin + (req.url || '/'), {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body
  });
  const response = await route(request);
  if (!response) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{"error":"Not found"}'); return; }
  const headers: Record<string, string | string[]> = {};
  response.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
  const cookies = response.headers.getSetCookie?.() || [];
  if (cookies.length) headers['set-cookie'] = cookies;
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.log(`Church API running at http://localhost:${port}`));
