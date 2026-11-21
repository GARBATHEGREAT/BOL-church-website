// Copies the public content of the live site (and the photos it uses) into this project's database.
// Usage: npm run import:live   (optionally: LIVE_URL=https://breadoflifedcm.org)
// Note: only what the public API exposes is copied. Form submissions and extra admin logins are private
// and are not included; hidden items, past events and sermons beyond the 12 newest are not exposed publicly.
import { DB, ensureSchema } from '../server/db';
import { MEDIA, typeFromKey } from '../server/storage';

const LIVE = (process.env.LIVE_URL || 'https://breadoflifedcm.org').replace(/\/$/, '');
const now = new Date().toISOString();

async function main() {
  await ensureSchema();
  const res = await fetch(`${LIVE}/api/content?import=${Date.now()}`);
  if (!res.ok) throw new Error(`Live site returned ${res.status}`);
  // The live proxy rewrites photo links to the old platform's address; store them as local /media/ paths.
  const data: any = JSON.parse(JSON.stringify(await res.json()).replaceAll('https://breadoflifedcm.gandjtechhub.chatgpt.site/media/', '/media/'));

  const stmts = [];
  for (const [key, value] of Object.entries<string>(data.settings || {})) {
    if (key.startsWith('admin_user:')) continue;
    stmts.push(DB.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(key, String(value), now));
  }
  for (const s of data.sermons || [])
    stmts.push(DB.prepare('INSERT OR REPLACE INTO sermons(id,youtube_id,title,pastor,duration,published,featured,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(s.id, s.youtube_id, s.title, s.pastor, s.duration, s.published ?? 1, s.featured ?? 0, s.created_at || now));
  for (const e of data.events || [])
    stmts.push(DB.prepare('INSERT OR REPLACE INTO events(id,title,event_date,event_time,location,description,image_url,published) VALUES(?,?,?,?,?,?,?,?)').bind(e.id, e.title, e.event_date, e.event_time, e.location || '', e.description || '', e.image_url || '', e.published ?? 1));
  for (const c of data.contentItems || [])
    stmts.push(DB.prepare('INSERT OR REPLACE INTO content_items(id,section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(c.id, c.section, c.title || '', c.subtitle || '', c.description || '', c.body || '', c.image_url || '', c.button_text || '', c.button_url || '', c.contact_links || '', c.sort_order ?? 0, c.visible ?? 1, c.created_at || now, c.updated_at || now));
  for (const g of data.galleryMedia || [])
    stmts.push(DB.prepare('INSERT OR REPLACE INTO gallery_media(id,media_type,url,storage_key,caption,sort_order,visible,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(g.id, g.media_type, g.url, g.storage_key || '', g.caption || '', g.sort_order ?? 0, g.visible ?? 1, g.created_at || now));
  if (stmts.length) await DB.batch(stmts);

  // Download every uploaded photo/video the content refers to (/media/<key>).
  const media = new Set<string>(JSON.stringify(data).match(/\/media\/[^"\\\s]+/g) || []);
  let ok = 0, failed = 0;
  for (const url of media) {
    const key = decodeURIComponent(url.replace(/^\/media\//, ''));
    try {
      const r = await fetch(LIVE + url);
      if (!r.ok) throw new Error(String(r.status));
      await MEDIA.put(key, new Uint8Array(await r.arrayBuffer()), { httpMetadata: { contentType: r.headers.get('content-type') || typeFromKey(key) } });
      ok++;
    } catch (e) { failed++; console.warn('Could not copy', url, (e as Error).message); }
  }
  console.log(`Imported ${Object.keys(data.settings || {}).length} settings, ${(data.sermons || []).length} sermons, ${(data.events || []).length} events, ${(data.contentItems || []).length} content items, ${(data.galleryMedia || []).length} gallery items. Media copied: ${ok}, failed: ${failed}.`);
}
main().catch(e => { console.error(e); process.exit(1); });
