// Copies the public content of the live (old) site, and the photos it uses, into this database.
// Used by `npm run import:live` (local) and by the admin's "Import from old site" button (production).
import { DB, ensureSchema } from './db';
import { MEDIA, typeFromKey } from './storage';

export const IMPORT_SOURCE = 'https://breadoflifedcm.org';
const OLD_BACKEND_MEDIA = 'https://breadoflifedcm.gandjtechhub.chatgpt.site/media/';

export async function importLive(source = IMPORT_SOURCE) {
  await ensureSchema();
  const base = source.replace(/\/$/, '');
  const now = new Date().toISOString();
  const res = await fetch(`${base}/api/content?import=${Date.now()}`);
  if (!res.ok) throw new Error(`The old site returned ${res.status}`);
  // The old proxy rewrites photo links to the old platform's address; store them as local /media/ paths.
  const data: any = JSON.parse(JSON.stringify(await res.json()).replaceAll(OLD_BACKEND_MEDIA, '/media/'));
  if (!data || typeof data !== 'object' || !data.settings) throw new Error('The old site did not return site content.');

  const stmts = [
    DB.prepare("DELETE FROM content_items WHERE section != 'announcement_slides'"),
    DB.prepare('DELETE FROM sermons'),
    DB.prepare('DELETE FROM events'),
    DB.prepare('DELETE FROM gallery_media')
  ];
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
  await DB.batch(stmts);

  // Copy every uploaded photo/video the content refers to (/media/<key>).
  const media = new Set<string>(JSON.stringify(data).match(/\/media\/[^" ]+/g) || []);
  let copied = 0, failed = 0;
  for (const url of media) {
    const key = decodeURIComponent(url.replace(/^\/media\//, ''));
    try {
      const r = await fetch(base + url);
      if (!r.ok) throw new Error(String(r.status));
      await MEDIA.put(key, new Uint8Array(await r.arrayBuffer()), { httpMetadata: { contentType: r.headers.get('content-type') || typeFromKey(key) } });
      copied++;
    } catch (e) { failed++; console.warn('Could not copy', url, (e as Error).message); }
  }
  return {
    settings: Object.keys(data.settings || {}).length, sermons: (data.sermons || []).length, events: (data.events || []).length,
    contentItems: (data.contentItems || []).length, gallery: (data.galleryMedia || []).length, mediaCopied: copied, mediaFailed: failed
  };
}
