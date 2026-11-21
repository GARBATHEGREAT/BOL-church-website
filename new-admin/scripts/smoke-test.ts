// End-to-end check of every admin and public API action against a throwaway database.
// Usage: npm test
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const PORT = 8799, BASE = `http://localhost:${PORT}`;
const EMAIL = process.env.ADMIN_EMAIL!, PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD!;
fs.rmSync('./data/test.db', { force: true });
fs.rmSync('./data/test-media', { recursive: true, force: true });

const server = spawn(process.execPath, ['--import', 'tsx', 'server/dev.ts'], {
  env: { ...process.env, API_PORT: String(PORT), TURSO_DATABASE_URL: 'file:./data/test.db', MEDIA_DIR: './data/test-media' },
  stdio: ['ignore', 'pipe', 'inherit']
});

let cookie = '', passed = 0, failed = 0;
const ok = (name: string, cond: any, extra = '') => { cond ? passed++ : failed++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`); };

async function call(path: string, init: RequestInit = {}, auth = true) {
  const headers = new Headers(init.headers);
  if (auth && cookie) headers.set('cookie', cookie);
  const r = await fetch(BASE + path, { ...init, headers, redirect: 'manual' });
  const set = r.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  return r;
}
const post = (body: any) => call('/api/admin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const getAdmin = async () => (await call('/api/admin')).json() as Promise<any>;

async function waitUp() {
  for (let i = 0; i < 40; i++) { try { await fetch(BASE + '/api/content'); return; } catch { await new Promise(r => setTimeout(r, 250)); } }
  throw new Error('API did not start');
}

async function main() {
  await waitUp();

  // --- access control
  ok('admin data is refused without login', (await call('/api/admin', {}, false)).status === 403);
  ok('upload is refused without login', (await call('/api/admin/upload', { method: 'POST' }, false)).status === 403);
  ok('wrong password is refused', (await call('/api/admin-login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: 'nope' }) }, false)).status === 401);
  ok('/api/admin/me is signed out', (await (await call('/api/admin/me', {}, false)).json() as any).email === null);

  // --- login
  const login = await call('/api/admin-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) }, false);
  ok('correct login works and sets a cookie', login.status === 200 && cookie.startsWith('bol_admin_session='));
  ok('/api/admin/me shows the signed-in email', (await (await call('/api/admin/me')).json() as any).email === EMAIL.toLowerCase());

  // --- dashboard data + seeded defaults
  let d = await getAdmin();
  ok('dashboard returns all collections', ['settings', 'submissions', 'sermons', 'events', 'galleryMedia', 'contentItems', 'admins'].every(k => k in d));
  ok('default site content is created on an empty database', d.contentItems.length >= 12);
  ok('announcement flyers are seeded (4)', d.contentItems.filter((c: any) => c.section === 'announcement_slides').length === 4);

  // --- settings
  await post({ action: 'setting', key: 'test_key', value: 'one' });
  await post({ action: 'settings_bulk', values: { announce_version: 'v1', announce_account_number: '1016540285', announce_enabled: '1' } });
  d = await getAdmin();
  const s = Object.fromEntries(d.settings.map((x: any) => [x.key, x.value]));
  ok('single setting saved', s.test_key === 'one');
  ok('bulk settings (announcement) saved', s.announce_account_number === '1016540285' && s.announce_version === 'v1');
  const pub: any = await (await call('/api/content', {}, false)).json();
  ok('public content API shows saved settings', pub.settings.announce_account_number === '1016540285');

  // --- sermons
  await post({ action: 'sermon', youtubeId: 'https://youtu.be/dQw4w9WgXcQ', title: 'Test sermon', pastor: 'Pastor T', duration: '10 min', featured: true });
  d = await getAdmin(); const sermon = d.sermons.find((x: any) => x.title === 'Test sermon');
  ok('sermon added (YouTube id extracted)', sermon && sermon.youtube_id === 'dQw4w9WgXcQ');
  await post({ action: 'edit_sermon', id: sermon.id, youtubeId: 'dQw4w9WgXcQ', title: 'Edited', pastor: 'P', duration: '5', featured: false });
  await post({ action: 'toggle_sermon', id: sermon.id, visible: false });
  d = await getAdmin(); ok('sermon edited and hidden', d.sermons.find((x: any) => x.id === sermon.id)?.title === 'Edited' && d.sermons.find((x: any) => x.id === sermon.id)?.published === 0);
  await post({ action: 'delete_sermon', id: sermon.id });
  d = await getAdmin(); ok('sermon deleted', !d.sermons.some((x: any) => x.id === sermon.id));

  // --- events
  await post({ action: 'event', title: 'Test event', eventDate: '2099-01-01', eventTime: '5 PM', location: 'Hall', description: 'Desc', imageUrl: '' });
  d = await getAdmin(); const ev = d.events.find((x: any) => x.title === 'Test event'); ok('event added', !!ev);
  await post({ action: 'edit_event', id: ev.id, title: 'Event 2', eventDate: '2099-01-02', eventTime: '6 PM', location: 'Hall', description: 'D', imageUrl: '' });
  ok('event shows on the public site', ((await (await call('/api/content', {}, false)).json()) as any).events.some((x: any) => x.title === 'Event 2'));
  await post({ action: 'toggle_event', id: ev.id, visible: false });
  ok('hidden event leaves the public site', !((await (await call('/api/content', {}, false)).json()) as any).events.some((x: any) => x.title === 'Event 2'));
  await post({ action: 'delete_event', id: ev.id });

  // --- content items (hero/pastors/announcement flyers etc.)
  await post({ action: 'content_create', section: 'announcement_slides', title: 'New flyer', imageUrl: '/x.jpg' });
  d = await getAdmin(); let slides = d.contentItems.filter((c: any) => c.section === 'announcement_slides'); const nf = slides.find((c: any) => c.title === 'New flyer');
  ok('flyer added', !!nf && slides.length === 5);
  await post({ action: 'content_update', id: nf.id, title: 'Renamed flyer', subtitle: '', description: '', body: '', imageUrl: '/y.jpg', buttonText: '', buttonUrl: '', contactLinks: '' });
  await post({ action: 'content_move', id: nf.id, direction: -1 });
  d = await getAdmin(); slides = d.contentItems.filter((c: any) => c.section === 'announcement_slides');
  ok('flyer renamed and moved up', slides.find((c: any) => c.id === nf.id)?.title === 'Renamed flyer' && slides.findIndex((c: any) => c.id === nf.id) === slides.length - 2);
  await post({ action: 'content_toggle', id: nf.id, visible: false });
  ok('hidden flyer is not public', !((await (await call('/api/content', {}, false)).json()) as any).contentItems.some((c: any) => c.id === nf.id));
  await post({ action: 'content_delete', id: nf.id });
  d = await getAdmin(); ok('flyer deleted', !d.contentItems.some((c: any) => c.id === nf.id));
  ok('invalid content section is rejected', (await post({ action: 'content_create', section: 'nope', title: 'x' })).status >= 400);

  // --- uploads + media
  const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
  const form = new FormData(); form.append('file', new File([png], 'dot.png', { type: 'image/png' }));
  const up = await call('/api/admin/upload', { method: 'POST', body: form }); const upj: any = await up.json();
  ok('image upload works', up.status === 200 && upj.url?.startsWith('/media/church/images/'), JSON.stringify(upj));
  const media = await call(upj.url, {}, false);
  ok('uploaded image is served at /media/', media.status === 200 && media.headers.get('content-type') === 'image/png');
  const badForm = new FormData(); badForm.append('file', new File(['hi'], 'a.txt', { type: 'text/plain' }));
  ok('non-image upload is rejected', (await call('/api/admin/upload', { method: 'POST', body: badForm })).status === 400);
  ok('path traversal in /media is blocked', (await call('/media/..%2F..%2F.env', {}, false)).status === 404);

  // --- gallery
  await post({ action: 'gallery_media_add', mediaType: 'image', url: upj.url, storageKey: upj.key, caption: 'cap' });
  d = await getAdmin(); const gm = d.galleryMedia[0]; ok('gallery item added', !!gm);
  await post({ action: 'gallery_media_toggle', id: gm.id, visible: false });
  ok('hidden gallery item leaves the public site', ((await (await call('/api/content', {}, false)).json()) as any).galleryMedia.length === 0);
  await post({ action: 'gallery_media_delete', id: gm.id });
  d = await getAdmin(); ok('gallery item deleted (and file removed)', d.galleryMedia.length === 0 && (await call(upj.url, {}, false)).status === 404);

  // --- messages from the public contact form
  ok('contact form rejects empty submissions', (await call('/api/submissions', { method: 'POST', body: JSON.stringify({ name: '' }) }, false)).status === 400);
  ok('contact form saves a message', (await call('/api/submissions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'prayer', name: 'Ada', contact: '0800', message: 'Please pray' }) }, false)).status === 201);
  d = await getAdmin(); const sub = d.submissions[0]; ok('message appears in the admin', sub?.name === 'Ada');
  await post({ action: 'status', id: sub.id, status: 'done' });
  d = await getAdmin(); ok('message status updated', d.submissions[0].status === 'done');

  // --- extra administrators
  ok('short admin password is rejected', (await post({ action: 'admin_add', email: 'b@example.com', password: 'short' })).status === 400);
  await post({ action: 'admin_add', email: 'second@example.com', password: 'a-long-password-123' });
  d = await getAdmin(); ok('second admin added', d.admins.includes('second@example.com'));
  const keep = cookie; cookie = '';
  const l2 = await call('/api/admin-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'second@example.com', password: 'a-long-password-123' }) }, false);
  ok('second admin can sign in', l2.status === 200);
  ok('admin password hashes are not leaked publicly', !JSON.stringify(await (await call('/api/content', {}, false)).json()).includes('admin_user'));
  cookie = keep;
  ok('primary admin cannot be removed', (await post({ action: 'admin_delete', email: EMAIL })).status === 400);
  await post({ action: 'admin_delete', email: 'second@example.com' });
  d = await getAdmin(); ok('second admin removed', !d.admins.includes('second@example.com'));

  // --- logout + tampering
  const tampered = cookie.slice(0, -3) + 'abc';
  ok('forged session cookie is refused', (await call('/api/admin', { headers: { cookie: tampered } }, false)).status === 403);
  const out = await call('/api/admin-logout'); ok('logout redirects to /admin', out.status === 302);

  console.log(`\n${passed} passed, ${failed} failed`);
}

main().catch(e => { console.error(e); failed++; }).finally(() => { server.kill(); process.exit(failed ? 1 : 0); });
