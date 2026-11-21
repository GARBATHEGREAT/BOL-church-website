// A tiny D1-compatible wrapper over libSQL (SQLite), so the original admin SQL
// (prepare / bind / all / first / run / batch) works unchanged.
// Local development uses a file database; production uses Turso (TURSO_DATABASE_URL).
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Client, type InValue } from '@libsql/client';

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL || 'file:./data/church.db';
  if (url.startsWith('file:')) {
    const file = url.slice(5);
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
  return client;
}

function toObject(columns: string[], row: ArrayLike<unknown>) {
  const out: Record<string, unknown> = {};
  columns.forEach((c, i) => (out[c] = row[i]));
  return out;
}

export class Statement {
  private args: InValue[] = [];
  constructor(readonly sql: string) {}
  bind(...values: unknown[]) {
    this.args = values.map(v => (v === undefined ? null : (v as InValue)));
    return this;
  }
  toRequest() { return { sql: this.sql, args: this.args }; }
  async all<T = any>() {
    const rs = await getClient().execute(this.toRequest());
    return { results: rs.rows.map(r => toObject(rs.columns, r as any)) as T[] };
  }
  async first<T = any>(column?: string): Promise<T | null> {
    const rs = await getClient().execute(this.toRequest());
    if (!rs.rows.length) return null;
    const obj = toObject(rs.columns, rs.rows[0] as any);
    return (column ? obj[column] : obj) as T;
  }
  async run() {
    const rs = await getClient().execute(this.toRequest());
    return { success: true, meta: { last_row_id: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected } };
  }
}

export const DB = {
  prepare: (sql: string) => new Statement(sql),
  async batch(statements: Statement[]) {
    const rs = await getClient().batch(statements.map(s => s.toRequest()), 'write');
    return rs.map(r => ({ results: r.rows.map(row => toObject(r.columns, row as any)) }));
  }
};

const SCHEMA = [
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

let ready: Promise<void> | null = null;
/** Creates tables on first use. Safe to call repeatedly. */
export function ensureSchema() {
  ready ??= (async () => {
    await getClient().batch(SCHEMA.map(sql => ({ sql, args: [] })), 'write');
  })();
  return ready;
}
