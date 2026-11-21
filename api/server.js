var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/handlers/admin.ts
var admin_exports = {};
__export(admin_exports, {
  GET: () => GET,
  POST: () => POST
});

// server/db.ts
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
var client = null;
function getClient() {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL || "file:./data/church.db";
  if (url.startsWith("file:")) {
    const file = url.slice(5);
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || void 0 });
  return client;
}
function toObject(columns, row) {
  const out = {};
  columns.forEach((c, i) => out[c] = row[i]);
  return out;
}
var Statement = class {
  constructor(sql) {
    this.sql = sql;
  }
  args = [];
  bind(...values) {
    this.args = values.map((v) => v === void 0 ? null : v);
    return this;
  }
  toRequest() {
    return { sql: this.sql, args: this.args };
  }
  async all() {
    const rs = await getClient().execute(this.toRequest());
    return { results: rs.rows.map((r) => toObject(rs.columns, r)) };
  }
  async first(column) {
    const rs = await getClient().execute(this.toRequest());
    if (!rs.rows.length) return null;
    const obj = toObject(rs.columns, rs.rows[0]);
    return column ? obj[column] : obj;
  }
  async run() {
    const rs = await getClient().execute(this.toRequest());
    return { success: true, meta: { last_row_id: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected } };
  }
};
var DB = {
  prepare: (sql) => new Statement(sql),
  async batch(statements) {
    const rs = await getClient().batch(statements.map((s) => s.toRequest()), "write");
    return rs.map((r) => ({ results: r.rows.map((row) => toObject(r.columns, row)) }));
  }
};
var SCHEMA = [
  `CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS submissions(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, contact TEXT NOT NULL, message TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)`,
  `CREATE TABLE IF NOT EXISTS sermons(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, youtube_id TEXT NOT NULL, title TEXT NOT NULL, pastor TEXT NOT NULL, duration TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 1, featured INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title TEXT NOT NULL, event_date TEXT NOT NULL, event_time TEXT NOT NULL, location TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 1)`,
  `CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)`,
  `CREATE TABLE IF NOT EXISTS content_items(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, section TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', subtitle TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '', button_text TEXT NOT NULL DEFAULT '', button_url TEXT NOT NULL DEFAULT '', contact_links TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_section_order ON content_items(section, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_section_visible ON content_items(section, visible)`,
  `CREATE TABLE IF NOT EXISTS gallery_media(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, media_type TEXT NOT NULL CHECK(media_type IN ('image','video')), url TEXT NOT NULL, storage_key TEXT NOT NULL DEFAULT '', caption TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)`
];
var ready = null;
function ensureSchema() {
  ready ??= (async () => {
    await getClient().batch(SCHEMA.map((sql) => ({ sql, args: [] })), "write");
  })();
  return ready;
}

// server/storage.ts
import fs2 from "node:fs/promises";
import path2 from "node:path";
var MEDIA_DIR = () => path2.resolve(process.env.MEDIA_DIR || "./data/media");
var useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
var blobBase = () => {
  const explicit = (process.env.BLOB_PUBLIC_URL || "").replace(/\/$/, "");
  if (explicit) return explicit;
  const id = (process.env.BLOB_STORE_ID || "").replace(/^store_/i, "").toLowerCase();
  return id ? `https://${id}.public.blob.vercel-storage.com` : "";
};
function safeKey(key) {
  const clean = key.replace(/\\/g, "/").split("/").filter((p) => p && p !== "." && p !== "..").join("/");
  if (!clean) throw new Error("Invalid media key");
  return clean;
}
var TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  svg: "image/svg+xml"
};
var typeFromKey = (key) => TYPES[key.split(".").pop()?.toLowerCase() || ""] || "application/octet-stream";
var MEDIA = {
  async put(key, data, options) {
    const k = safeKey(key);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (useBlob()) {
      const { put } = await import("@vercel/blob");
      await put(k, Buffer.from(bytes), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: options?.httpMetadata?.contentType });
      return;
    }
    const file = path2.join(MEDIA_DIR(), k);
    await fs2.mkdir(path2.dirname(file), { recursive: true });
    await fs2.writeFile(file, bytes);
  },
  async get(key) {
    const k = safeKey(key);
    if (useBlob()) {
      const base = blobBase();
      if (!base) return null;
      const r = await fetch(`${base}/${k.split("/").map(encodeURIComponent).join("/")}`);
      if (!r.ok || !r.body) return null;
      return { body: r.body, contentType: r.headers.get("content-type") || typeFromKey(k) };
    }
    try {
      const bytes = await fs2.readFile(path2.join(MEDIA_DIR(), k));
      return { body: new Uint8Array(bytes), contentType: typeFromKey(k) };
    } catch {
      return null;
    }
  },
  async delete(key) {
    const k = safeKey(key);
    if (useBlob()) {
      const base = blobBase();
      const { del } = await import("@vercel/blob");
      if (base) await del(`${base}/${k}`);
      return;
    }
    await fs2.rm(path2.join(MEDIA_DIR(), k), { force: true });
  }
};

// server/env.ts
var env = {
  DB,
  MEDIA,
  get ADMIN_EMAIL() {
    return process.env.ADMIN_EMAIL || "";
  },
  get ADMIN_BOOTSTRAP_PASSWORD() {
    return process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
  },
  get ADMIN_SESSION_SECRET() {
    return process.env.ADMIN_SESSION_SECRET || "";
  }
};

// server/auth.ts
var ADMIN_EMAIL = () => (env.ADMIN_EMAIL || "").toLowerCase();
var COOKIE = "bol_admin_session";
var enc = new TextEncoder();
var SESSION_SECONDS = 60 * 60 * 24 * 30;
var secure = () => process.env.NODE_ENV === "production" ? "; Secure" : "";
function b64(value) {
  return btoa(value).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function unb64(value) {
  return atob(value.replace(/-/g, "+").replace(/_/g, "/"));
}
async function signature(value) {
  const key = await crypto.subtle.importKey("raw", enc.encode(env.ADMIN_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value)))));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function createAdminSession(email) {
  const payload = b64(JSON.stringify({ email: email.toLowerCase(), expires: Date.now() + SESSION_SECONDS * 1e3 }));
  return payload + "." + await signature(payload);
}
async function getAdminEmail(requestHeaders) {
  if (!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 16) return null;
  const cookie = requestHeaders.get("cookie") || "";
  const token = cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(await signature(payload), sig)) return null;
  try {
    const data = JSON.parse(unb64(payload));
    return data.expires > Date.now() && typeof data.email === "string" ? data.email : null;
  } catch {
    return null;
  }
}
async function isAdmin(requestHeaders) {
  return !!await getAdminEmail(requestHeaders);
}
var sessionCookie = (token) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure()}`;
var clearSessionCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure()}`;
async function hashPassword(password, salt) {
  const actualSalt = salt || b64(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(actualSalt), iterations: 21e4 }, material, 256);
  return actualSalt + "." + b64(String.fromCharCode(...new Uint8Array(bits)));
}
async function verifyPassword(password, stored) {
  const [salt] = stored.split(".");
  return !!salt && safeEqual(await hashPassword(password, salt), stored);
}

// server/importLive.ts
var IMPORT_SOURCE = "https://breadoflifedcm.org";
var OLD_BACKEND_MEDIA = "https://breadoflifedcm.gandjtechhub.chatgpt.site/media/";
async function importLive(source = IMPORT_SOURCE) {
  await ensureSchema();
  const base = source.replace(/\/$/, "");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const res = await fetch(`${base}/api/content?import=${Date.now()}`);
  if (!res.ok) throw new Error(`The old site returned ${res.status}`);
  const data = JSON.parse(JSON.stringify(await res.json()).replaceAll(OLD_BACKEND_MEDIA, "/media/"));
  if (!data || typeof data !== "object" || !data.settings) throw new Error("The old site did not return site content.");
  const stmts = [
    DB.prepare("DELETE FROM content_items"),
    DB.prepare("DELETE FROM settings WHERE key = 'announce_slides_initialized'"),
    // flyers are re-created fresh the next time the admin opens
    DB.prepare("DELETE FROM sermons"),
    DB.prepare("DELETE FROM events"),
    DB.prepare("DELETE FROM gallery_media")
  ];
  for (const [key, value] of Object.entries(data.settings || {})) {
    if (key.startsWith("admin_user:")) continue;
    stmts.push(DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(key, String(value), now));
  }
  for (const s of data.sermons || [])
    stmts.push(DB.prepare("INSERT OR REPLACE INTO sermons(id,youtube_id,title,pastor,duration,published,featured,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(s.id, s.youtube_id, s.title, s.pastor, s.duration, s.published ?? 1, s.featured ?? 0, s.created_at || now));
  for (const e of data.events || [])
    stmts.push(DB.prepare("INSERT OR REPLACE INTO events(id,title,event_date,event_time,location,description,image_url,published) VALUES(?,?,?,?,?,?,?,?)").bind(e.id, e.title, e.event_date, e.event_time, e.location || "", e.description || "", e.image_url || "", e.published ?? 1));
  for (const c of data.contentItems || [])
    stmts.push(DB.prepare("INSERT INTO content_items(section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(c.section, c.title || "", c.subtitle || "", c.description || "", c.body || "", c.image_url || "", c.button_text || "", c.button_url || "", c.contact_links || "", c.sort_order ?? 0, c.visible ?? 1, c.created_at || now, c.updated_at || now));
  for (const g of data.galleryMedia || [])
    stmts.push(DB.prepare("INSERT OR REPLACE INTO gallery_media(id,media_type,url,storage_key,caption,sort_order,visible,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(g.id, g.media_type, g.url, g.storage_key || "", g.caption || "", g.sort_order ?? 0, g.visible ?? 1, g.created_at || now));
  await DB.batch(stmts);
  const media = new Set(JSON.stringify(data).match(/\/media\/[^" ]+/g) || []);
  let copied = 0, failed = 0;
  for (const url of media) {
    const key = decodeURIComponent(url.replace(/^\/media\//, ""));
    try {
      const r = await fetch(base + url);
      if (!r.ok) throw new Error(String(r.status));
      await MEDIA.put(key, new Uint8Array(await r.arrayBuffer()), { httpMetadata: { contentType: r.headers.get("content-type") || typeFromKey(key) } });
      copied++;
    } catch (e) {
      failed++;
      console.warn("Could not copy", url, e.message);
    }
  }
  return {
    settings: Object.keys(data.settings || {}).length,
    sermons: (data.sermons || []).length,
    events: (data.events || []).length,
    contentItems: (data.contentItems || []).length,
    gallery: (data.galleryMedia || []).length,
    mediaCopied: copied,
    mediaFailed: failed
  };
}

// server/handlers/admin.ts
var SECTIONS = /* @__PURE__ */ new Set(["hero_slides", "word_slides", "pastors", "communities", "visit_slides", "stories", "announcement_slides"]);
async function GET(request) {
  await ensureSchema();
  if (!await isAdmin(request.headers)) return Response.json({ error: "Your admin session has expired. Please sign in again." }, { status: 403 });
  await ensureDefaultContent();
  await ensureEventColumns();
  await ensureGalleryMedia();
  await ensureStoriesContent();
  await ensureAnnouncementContent();
  const [settings, submissions, sermons, events, galleryMedia, contentItems, adminRows] = await Promise.all([
    env.DB.prepare("SELECT key,value FROM settings ORDER BY key").all(),
    env.DB.prepare("SELECT * FROM submissions ORDER BY created_at DESC LIMIT 250").all(),
    env.DB.prepare("SELECT * FROM sermons ORDER BY featured DESC,id DESC").all(),
    env.DB.prepare("SELECT * FROM events ORDER BY event_date ASC").all(),
    env.DB.prepare("SELECT * FROM gallery_media ORDER BY sort_order,id").all(),
    env.DB.prepare("SELECT * FROM content_items ORDER BY section,sort_order,id").all(),
    env.DB.prepare("SELECT key FROM settings WHERE key LIKE 'admin_user:%' ORDER BY key").all()
  ]);
  const admins = [ADMIN_EMAIL(), ...adminRows.results.map((row) => String(row.key).slice(11))];
  return Response.json({ settings: settings.results, submissions: submissions.results, sermons: sermons.results, events: events.results, galleryMedia: galleryMedia.results, contentItems: contentItems.results, admins: [...new Set(admins)] });
}
async function POST(req) {
  await ensureSchema();
  if (!await isAdmin(req.headers)) return Response.json({ error: "Your admin session has expired. Please sign in again." }, { status: 403 });
  const x = await req.json(), now = (/* @__PURE__ */ new Date()).toISOString();
  if (x.action === "import_live") {
    try {
      return Response.json({ ok: true, summary: await importLive() });
    } catch (e) {
      return Response.json({ error: String(e?.message || "Import failed.") }, { status: 502 });
    }
  } else if (x.action === "setting") await saveSetting(String(x.key), String(x.value), now);
  else if (x.action === "settings_bulk") {
    const values = x.values && typeof x.values === "object" ? x.values : {};
    for (const [key, value] of Object.entries(values)) await saveSetting(key, String(value), now);
  } else if (x.action === "sermon") {
    await env.DB.prepare("INSERT INTO sermons(youtube_id,title,pastor,duration,published,featured,created_at) VALUES(?,?,?,?,1,?,?)").bind(youtubeId(x.youtubeId), text(x.title), text(x.pastor), text(x.duration), x.featured ? 1 : 0, now).run();
  } else if (x.action === "edit_sermon") {
    await env.DB.prepare("UPDATE sermons SET youtube_id=?,title=?,pastor=?,duration=?,featured=? WHERE id=?").bind(youtubeId(x.youtubeId), text(x.title), text(x.pastor), text(x.duration), x.featured ? 1 : 0, Number(x.id)).run();
  } else if (x.action === "toggle_sermon") await env.DB.prepare("UPDATE sermons SET published=? WHERE id=?").bind(x.visible ? 1 : 0, Number(x.id)).run();
  else if (x.action === "event") {
    await ensureEventColumns();
    await env.DB.prepare("INSERT INTO events(title,event_date,event_time,location,description,image_url,published) VALUES(?,?,?,?,?,?,1)").bind(text(x.title), text(x.eventDate), text(x.eventTime), text(x.location), text(x.description, 4e3), text(x.imageUrl, 2e3)).run();
  } else if (x.action === "edit_event") {
    await ensureEventColumns();
    await env.DB.prepare("UPDATE events SET title=?,event_date=?,event_time=?,location=?,description=?,image_url=? WHERE id=?").bind(text(x.title), text(x.eventDate), text(x.eventTime), text(x.location), text(x.description, 4e3), text(x.imageUrl, 2e3), Number(x.id)).run();
  } else if (x.action === "gallery_media_add") {
    await ensureGalleryMedia();
    const mediaType = x.mediaType === "video" ? "video" : "image";
    if (!text(x.url, 2e3)) return Response.json({ error: "Invalid gallery media." }, { status: 400 });
    if (mediaType === "video") {
      const count = await env.DB.prepare("SELECT COUNT(*) total FROM gallery_media WHERE media_type='video'").first();
      if (Number(count?.total) >= 10) return Response.json({ error: "The gallery already has the maximum of 10 videos." }, { status: 400 });
    }
    const order = await env.DB.prepare("SELECT COALESCE(MAX(sort_order),-1)+1 next_order FROM gallery_media").first();
    await env.DB.prepare("INSERT INTO gallery_media(media_type,url,storage_key,caption,sort_order,visible,created_at) VALUES(?,?,?,?,?,1,?)").bind(mediaType, text(x.url, 2e3), text(x.storageKey, 1e3), text(x.caption, 500), order?.next_order || 0, now).run();
  } else if (x.action === "gallery_media_delete") {
    await ensureGalleryMedia();
    const item = await env.DB.prepare("SELECT storage_key FROM gallery_media WHERE id=?").bind(Number(x.id)).first();
    if (item?.storage_key) await env.MEDIA.delete(item.storage_key);
    await env.DB.prepare("DELETE FROM gallery_media WHERE id=?").bind(Number(x.id)).run();
  } else if (x.action === "gallery_media_toggle") {
    await ensureGalleryMedia();
    await env.DB.prepare("UPDATE gallery_media SET visible=? WHERE id=?").bind(x.visible ? 1 : 0, Number(x.id)).run();
  } else if (x.action === "toggle_event") await env.DB.prepare("UPDATE events SET published=? WHERE id=?").bind(x.visible ? 1 : 0, Number(x.id)).run();
  else if (x.action === "status") await env.DB.prepare("UPDATE submissions SET status=? WHERE id=?").bind(text(x.status), Number(x.id)).run();
  else if (x.action === "delete_sermon") await env.DB.prepare("DELETE FROM sermons WHERE id=?").bind(Number(x.id)).run();
  else if (x.action === "delete_event") await env.DB.prepare("DELETE FROM events WHERE id=?").bind(Number(x.id)).run();
  else if (x.action === "content_create") await createContent(x, now);
  else if (x.action === "content_update") await updateContent(x, now);
  else if (x.action === "content_delete") await env.DB.prepare("DELETE FROM content_items WHERE id=?").bind(Number(x.id)).run();
  else if (x.action === "content_toggle") await env.DB.prepare("UPDATE content_items SET visible=?,updated_at=? WHERE id=?").bind(x.visible ? 1 : 0, now, Number(x.id)).run();
  else if (x.action === "content_move") await moveContent(Number(x.id), Number(x.direction) || 0, now);
  else if (x.action === "admin_add") {
    const email = text(x.email, 254).toLowerCase(), password = String(x.password || "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 10) return Response.json({ error: "Password must contain at least 10 characters." }, { status: 400 });
    await saveSetting("admin_user:" + email, await hashPassword(password), now);
  } else if (x.action === "admin_delete") {
    const email = text(x.email, 254).toLowerCase();
    if (email === ADMIN_EMAIL()) return Response.json({ error: "The primary administrator cannot be removed." }, { status: 400 });
    await env.DB.prepare("DELETE FROM settings WHERE key=?").bind("admin_user:" + email).run();
  } else return Response.json({ error: "Unknown action" }, { status: 400 });
  return Response.json({ ok: true });
}
async function createContent(x, now) {
  const section = text(x.section, 40);
  if (!SECTIONS.has(section)) throw new Error("Invalid section");
  const order = await env.DB.prepare("SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM content_items WHERE section=?").bind(section).first();
  await env.DB.prepare("INSERT INTO content_items(section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)").bind(section, text(x.title), text(x.subtitle), text(x.description), text(x.body, 5e3), text(x.imageUrl, 2e3), text(x.buttonText), text(x.buttonUrl, 2e3), text(x.contactLinks, 2e3), order?.next_order || 0, now, now).run();
}
async function updateContent(x, now) {
  await env.DB.prepare("UPDATE content_items SET title=?,subtitle=?,description=?,body=?,image_url=?,button_text=?,button_url=?,contact_links=?,updated_at=? WHERE id=?").bind(text(x.title), text(x.subtitle), text(x.description), text(x.body, 5e3), text(x.imageUrl, 2e3), text(x.buttonText), text(x.buttonUrl, 2e3), text(x.contactLinks, 2e3), now, Number(x.id)).run();
}
async function moveContent(id, direction, now) {
  const item = await env.DB.prepare("SELECT id,section,sort_order FROM content_items WHERE id=?").bind(id).first();
  if (!item || !direction) return;
  const operator = direction < 0 ? "<" : ">";
  const order = direction < 0 ? "DESC" : "ASC";
  const neighbour = await env.DB.prepare(`SELECT id,sort_order FROM content_items WHERE section=? AND sort_order ${operator} ? ORDER BY sort_order ${order},id ${order} LIMIT 1`).bind(item.section, item.sort_order).first();
  if (!neighbour) return;
  await env.DB.batch([
    env.DB.prepare("UPDATE content_items SET sort_order=?,updated_at=? WHERE id=?").bind(neighbour.sort_order, now, item.id),
    env.DB.prepare("UPDATE content_items SET sort_order=?,updated_at=? WHERE id=?").bind(item.sort_order, now, neighbour.id)
  ]);
}
async function ensureDefaultContent() {
  const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM content_items").first();
  if (Number(count?.total) > 0) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const defaults = [
    ["hero_slides", "Encounter God. Discover purpose.", "Welcome home", "A place to belong. A people becoming like Christ.", "", "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=2000&q=88", "Plan your visit", "#visit", "", 0],
    ["word_slides", "Growing in the Word", "Worship together", "We gather around Scripture, prayer and fellowship.", "", "/assets/images/ministry/family-05.webp", "", "", "", 0],
    ["word_slides", "One family in Christ", "Faith in community", "Every generation has a place to learn, worship and belong.", "", "/assets/images/ministry/family-06.webp", "", "", "", 1],
    ["pastors", "Head Pastor", "Head Pastor", "Leading Bread of Life Divine Covenant Ministry with faith, love and a heart for people.", "", "/assets/images/ministry/leader.webp", "", "", "", 0],
    ["pastors", "Pastor", "Teaching & Pastoral Care", "Teaching God\u2019s Word and caring for the ministry family.", "", "/assets/images/ministry/pastor.webp", "", "", "", 1],
    ["communities", "Church Family", "Growing together", "A caring community where every generation can grow in Christ.", "", "/assets/images/ministry/family-01.webp", "Connect with us", "#contact", "", 0],
    ["communities", "Women & Families", "Faith for every season", "Meaningful fellowship, discipleship and practical support.", "", "/assets/images/ministry/family-02.webp", "Learn more", "#contact", "", 1],
    ["communities", "Youth", "Bold in faith", "Helping a generation discover faith, confidence and purpose.", "", "/assets/images/ministry/family-03.webp", "Learn more", "#contact", "", 2],
    ["communities", "Outreach", "Love in action", "Serving our neighbours and sharing Christ beyond our walls.", "", "/assets/images/ministry/family-04.webp", "Get involved", "#contact", "", 3],
    ["visit_slides", "Come as you are", "Your first Sunday", "You are welcome here. Our church family is ready to receive you.", "", "/assets/images/ministry/family-03.webp", "Let us know you\u2019re coming", "#contact", "", 0],
    ["visit_slides", "A place to belong", "Worship with us", "Bring your family and experience worship, the Word and warm fellowship.", "", "/assets/images/ministry/family-04.webp", "Plan your visit", "#contact", "", 1],
    ["visit_slides", "Grow with us", "One family in Christ", "Take your next step in faith with people who will walk beside you.", "", "/assets/images/ministry/family-06.webp", "Connect with us", "#contact", "", 2]
  ];
  await env.DB.batch(defaults.map((d) => env.DB.prepare("INSERT INTO content_items(section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)").bind(...d, now, now)));
}
async function ensureEventColumns() {
  for (const sql of ["ALTER TABLE events ADD COLUMN description text NOT NULL DEFAULT ''", "ALTER TABLE events ADD COLUMN image_url text NOT NULL DEFAULT ''"]) {
    try {
      await env.DB.prepare(sql).run();
    } catch {
    }
  }
}
async function ensureGalleryMedia() {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS gallery_media(id INTEGER PRIMARY KEY AUTOINCREMENT,media_type TEXT NOT NULL CHECK(media_type IN ('image','video')),url TEXT NOT NULL,storage_key TEXT NOT NULL DEFAULT '',caption TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,visible INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL)").run();
}
async function ensureStoriesContent() {
  const marker = await env.DB.prepare("SELECT value FROM settings WHERE key='stories_collection_initialized'").first();
  if (marker) return;
  const rows = await env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('story_quote','story_person')").all();
  const legacy = Object.fromEntries(rows.results.map((x) => [x.key, x.value])), now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO content_items(section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)").bind("stories", text(legacy.story_person || "A ministry family"), "Member testimony", text(legacy.story_quote || "I found more than a church\u2014I found people who prayed with me, stood beside my family and helped me grow in faith."), "", "", "", "", "", 0, now, now),
    env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES('stories_collection_initialized','1',?) ON CONFLICT(key) DO UPDATE SET value='1',updated_at=excluded.updated_at").bind(now)
  ]);
}
async function ensureAnnouncementContent() {
  const marker = await env.DB.prepare("SELECT value FROM settings WHERE key='announce_slides_initialized'").first();
  if (marker) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const flyers = [
    ["Crusade flyer: Let There Be Light (navy and gold)", "/assets/images/crusade/crusade-1.jpg"],
    ["Crusade flyer (blue)", "/assets/images/crusade/crusade-2.jpg"],
    ["Crusade flyer (light)", "/assets/images/crusade/crusade-3.jpg"],
    ["Crusade flyer (gold border)", "/assets/images/crusade/crusade-4.jpg"]
  ];
  await env.DB.batch([
    ...flyers.map((f, i) => env.DB.prepare("INSERT INTO content_items(section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)").bind("announcement_slides", f[0], "", "", "", f[1], "", "", "", i, now, now)),
    env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES('announce_slides_initialized','1',?) ON CONFLICT(key) DO UPDATE SET value='1',updated_at=excluded.updated_at").bind(now)
  ]);
}
async function saveSetting(key, value, now) {
  await env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(key.slice(0, 80), value.slice(0, 4e3), now).run();
}
function youtubeId(value) {
  const raw = String(value || "").trim();
  return raw.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/)?.[1] || raw;
}
function text(value, max = 1e3) {
  return String(value ?? "").trim().slice(0, max);
}

// server/handlers/adminLogin.ts
var adminLogin_exports = {};
__export(adminLogin_exports, {
  POST: () => POST2
});
async function POST2(request) {
  await ensureSchema();
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase(), password = String(body.password || "");
  let valid = !!ADMIN_EMAIL() && email === ADMIN_EMAIL() && !!env.ADMIN_BOOTSTRAP_PASSWORD && password === env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!valid) {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key=?").bind("admin_user:" + email).first();
    if (row?.value) valid = await verifyPassword(password, row.value);
  }
  if (!valid) return Response.json({ error: "Incorrect email address or password." }, { status: 401 });
  return Response.json({ ok: true }, { headers: { "set-cookie": sessionCookie(await createAdminSession(email)), "cache-control": "no-store" } });
}

// server/handlers/adminLogout.ts
var adminLogout_exports = {};
__export(adminLogout_exports, {
  GET: () => GET2
});
async function GET2(request) {
  return new Response(null, {
    status: 302,
    headers: { location: new URL("/admin", request.url).toString(), "set-cookie": clearSessionCookie(), "cache-control": "no-store" }
  });
}

// server/handlers/adminMe.ts
var adminMe_exports = {};
__export(adminMe_exports, {
  GET: () => GET3
});
async function GET3(request) {
  const email = await getAdminEmail(request.headers);
  return Response.json({ email }, { headers: { "cache-control": "no-store" } });
}

// server/handlers/upload.ts
var upload_exports = {};
__export(upload_exports, {
  POST: () => POST3
});
var IMAGE_MAX = 8 * 1024 * 1024;
var VIDEO_MAX = 100 * 1024 * 1024;
var IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
var VIDEO_TYPES = /* @__PURE__ */ new Set(["video/mp4", "video/webm", "video/quicktime"]);
async function POST3(request) {
  if (!await isAdmin(request.headers)) return Response.json({ error: "Your admin session has expired. Please sign in again." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file") || form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "Choose a photo or video first." }, { status: 400 });
  const type = IMAGE_TYPES.has(file.type) ? "image" : VIDEO_TYPES.has(file.type) ? "video" : "";
  if (!type) return Response.json({ error: "Use JPG, PNG, WebP, GIF, MP4, WebM or MOV." }, { status: 400 });
  if (file.size > (type === "image" ? IMAGE_MAX : VIDEO_MAX)) return Response.json({ error: type === "image" ? "Images must be smaller than 8 MB." : "Videos must be smaller than 100 MB." }, { status: 400 });
  const extension = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const key = `church/${type}s/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ url: `/media/${key.split("/").map(encodeURIComponent).join("/")}`, key, type, name: file.name });
}

// server/handlers/content.ts
var content_exports = {};
__export(content_exports, {
  GET: () => GET4,
  dynamic: () => dynamic
});
var dynamic = "force-dynamic";
var noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store"
};
async function GET4() {
  try {
    await ensureSchema();
    await ensureEventColumns2();
    await ensureGalleryMedia2();
    const [s, v, e, g, c] = await Promise.all([
      env.DB.prepare("SELECT key,value FROM settings WHERE key NOT LIKE 'admin_user:%'").all(),
      env.DB.prepare("SELECT * FROM sermons WHERE published=1 ORDER BY featured DESC,id DESC LIMIT 12").all(),
      env.DB.prepare("SELECT * FROM events WHERE published=1 AND event_date>=date('now') ORDER BY event_date LIMIT 12").all(),
      env.DB.prepare("SELECT * FROM gallery_media WHERE visible=1 ORDER BY sort_order,id").all(),
      env.DB.prepare("SELECT * FROM content_items WHERE visible=1 ORDER BY section,sort_order,id").all()
    ]);
    return Response.json({ settings: Object.fromEntries(s.results.map((x) => [x.key, x.value])), sermons: v.results, events: e.results, galleryMedia: g.results, contentItems: c.results }, { headers: noStoreHeaders });
  } catch {
    return Response.json({ settings: { youtube_channel: "https://youtube.com/@bread_of_life_dcm" }, sermons: [], events: [], contentItems: [] }, { headers: noStoreHeaders });
  }
}
async function ensureGalleryMedia2() {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS gallery_media(id INTEGER PRIMARY KEY AUTOINCREMENT,media_type TEXT NOT NULL,url TEXT NOT NULL,storage_key TEXT NOT NULL DEFAULT '',caption TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,visible INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL)").run();
}
async function ensureEventColumns2() {
  for (const sql of ["ALTER TABLE events ADD COLUMN description text NOT NULL DEFAULT ''", "ALTER TABLE events ADD COLUMN image_url text NOT NULL DEFAULT ''"]) {
    try {
      await env.DB.prepare(sql).run();
    } catch {
    }
  }
}

// server/handlers/submissions.ts
var submissions_exports = {};
__export(submissions_exports, {
  POST: () => POST4
});
async function POST4(req) {
  try {
    await ensureSchema();
    const x = await req.json();
    if (!x.name?.trim() || !x.contact?.trim()) return Response.json({ error: "Required fields missing" }, { status: 400 });
    await env.DB.prepare("INSERT INTO submissions(type,name,contact,message,status,created_at) VALUES(?,?,?,?,?,?)").bind((x.type || "question").slice(0, 30), x.name.trim().slice(0, 120), x.contact.trim().slice(0, 160), (x.message || "").trim().slice(0, 4e3), "new", (/* @__PURE__ */ new Date()).toISOString()).run();
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save message" }, { status: 500 });
  }
}

// server/handlers/media.ts
var media_exports = {};
__export(media_exports, {
  GET: () => GET5
});
async function GET5(request) {
  const pathname = new URL(request.url).pathname.replace(/^\/(api\/)?media\//, "");
  const key = pathname.split("/").map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  }).join("/");
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Media not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff"
    }
  });
}

// server/routes.ts
var exact = {
  "/api/admin": admin_exports,
  "/api/admin/me": adminMe_exports,
  "/api/admin/upload": upload_exports,
  "/api/admin-login": adminLogin_exports,
  "/api/admin-logout": adminLogout_exports,
  "/api/content": content_exports,
  "/api/submissions": submissions_exports
};
async function route(request) {
  const { pathname } = new URL(request.url);
  const mod = pathname.startsWith("/media/") || pathname.startsWith("/api/media/") ? media_exports : exact[pathname.replace(/\/$/, "")];
  if (!mod) return null;
  const handler = mod[request.method];
  if (!handler) return new Response("Method not allowed", { status: 405 });
  try {
    return await handler(request);
  } catch (error) {
    console.error(pathname, error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// vercel/entry.ts
async function handle(request) {
  return await route(request) ?? Response.json({ error: "Not found" }, { status: 404 });
}
var config = { maxDuration: 30 };
var GET6 = handle;
var POST5 = handle;
export {
  GET6 as GET,
  POST5 as POST,
  config
};
