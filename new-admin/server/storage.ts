// Media storage with the same small surface the original admin expected from R2:
// put / get / delete. Local development writes to a folder; production uses Vercel Blob.
import fs from 'node:fs/promises';
import path from 'node:path';

const MEDIA_DIR = () => path.resolve(process.env.MEDIA_DIR || './data/media');
const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
// Public address of the Blob store: explicit BLOB_PUBLIC_URL, or derived from BLOB_STORE_ID (store_<id>).
const blobBase = () => {
  const explicit = (process.env.BLOB_PUBLIC_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const id = (process.env.BLOB_STORE_ID || '').replace(/^store_/i, '').toLowerCase();
  return id ? `https://${id}.public.blob.vercel-storage.com` : '';
};

function safeKey(key: string) {
  const clean = key.replace(/\\/g, '/').split('/').filter(p => p && p !== '.' && p !== '..').join('/');
  if (!clean) throw new Error('Invalid media key');
  return clean;
}

export type MediaObject = { body: Uint8Array | ReadableStream; contentType: string };

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', svg: 'image/svg+xml'
};
export const typeFromKey = (key: string) => TYPES[key.split('.').pop()?.toLowerCase() || ''] || 'application/octet-stream';

export const MEDIA = {
  async put(key: string, data: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }) {
    const k = safeKey(key);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (useBlob()) {
      const { put } = await import('@vercel/blob');
      await put(k, Buffer.from(bytes), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: options?.httpMetadata?.contentType });
      return;
    }
    const file = path.join(MEDIA_DIR(), k);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
  },
  async get(key: string): Promise<MediaObject | null> {
    const k = safeKey(key);
    if (useBlob()) {
      const base = blobBase();
      if (!base) return null;
      const r = await fetch(`${base}/${k.split('/').map(encodeURIComponent).join('/')}`);
      if (!r.ok || !r.body) return null;
      return { body: r.body, contentType: r.headers.get('content-type') || typeFromKey(k) };
    }
    try {
      const bytes = await fs.readFile(path.join(MEDIA_DIR(), k));
      return { body: new Uint8Array(bytes), contentType: typeFromKey(k) };
    } catch { return null; }
  },
  async delete(key: string) {
    const k = safeKey(key);
    if (useBlob()) {
      const base = blobBase();
      const { del } = await import('@vercel/blob');
      if (base) await del(`${base}/${k}`);
      return;
    }
    await fs.rm(path.join(MEDIA_DIR(), k), { force: true });
  }
};
