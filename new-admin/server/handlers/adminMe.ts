import { getAdminEmail } from '../auth';

/** Tells the admin app whether the visitor is signed in. */
export async function GET(request: Request) {
  const email = await getAdminEmail(request.headers);
  return Response.json({ email }, { headers: { 'cache-control': 'no-store' } });
}
