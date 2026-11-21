// Admin sign-in: email + password, signed 30-day session cookie. No external identity provider.
import { env } from './env';

export const ADMIN_EMAIL = () => (env.ADMIN_EMAIL || '').toLowerCase();
const COOKIE = 'bol_admin_session';
const enc = new TextEncoder();
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const secure = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '');

function b64(value: string) { return btoa(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function unb64(value: string) { return atob(value.replace(/-/g, '+').replace(/_/g, '/')); }

async function signature(value: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.ADMIN_SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value)))));
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminSession(email: string) {
  const payload = b64(JSON.stringify({ email: email.toLowerCase(), expires: Date.now() + SESSION_SECONDS * 1000 }));
  return payload + '.' + await signature(payload);
}

export async function getAdminEmail(requestHeaders: Headers): Promise<string | null> {
  if (!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 16) return null;
  const cookie = requestHeaders.get('cookie') || '';
  const token = cookie.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(await signature(payload), sig)) return null;
  try {
    const data = JSON.parse(unb64(payload));
    return data.expires > Date.now() && typeof data.email === 'string' ? data.email : null;
  } catch { return null; }
}
export async function isAdmin(requestHeaders: Headers) { return !!await getAdminEmail(requestHeaders); }

export const sessionCookie = (token: string) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure()}`;
export const clearSessionCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure()}`;

export async function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || b64(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(actualSalt), iterations: 210000 }, material, 256);
  return actualSalt + '.' + b64(String.fromCharCode(...new Uint8Array(bits)));
}
export async function verifyPassword(password: string, stored: string) {
  const [salt] = stored.split('.');
  return !!salt && safeEqual(await hashPassword(password, salt), stored);
}
