# Bread of Life admin (standalone)

A self-hosted replacement for the ChatGPT-hosted admin and data API. It keeps every feature of the old
admin (all tabs) and adds the **Announcement** tab. **Not deployed yet** – it runs locally for testing.

## What is in here
| Path | What it does |
| --- | --- |
| `web/` | The admin app (React + Vite). Same screens as before. Served at `/admin`. |
| `server/handlers/` | Admin, upload, public content, contact-form and media endpoints. |
| `server/db.ts` | SQLite (libSQL). A local file now, Turso in production. |
| `server/storage.ts` | Photos/videos. A local folder now, Vercel Blob in production. |
| `server/auth.ts` | Email + password sign-in with a signed 30-day cookie. No ChatGPT login. |
| `scripts/import-live.ts` | Copies the live site's content and photos into this database. |
| `scripts/smoke-test.ts` | 42 end-to-end checks of every admin and public action. |
| `vercel/handler.ts` | The one file Vercel will run in production (copied in at deploy time). |

## Run it locally
```powershell
cd new-admin
npm install
copy .env.example .env      # then edit .env (email, password, secret)
npm run import:live         # copy current content + photos from breadoflifedcm.org
npm run dev:api             # API on http://localhost:8787
npm run dev:web             # admin on http://localhost:5173/admin
npm test                    # run all checks (uses a throwaway database)
```
Open http://localhost:5173/admin and sign in with the email and password from `.env`.
The public pages at http://localhost:5173/home.html read from this local backend.

## What the import cannot copy
Only what the live public API exposes is imported. **Form submissions (messages) and extra admin logins
cannot be exported** from the old platform; hidden items, past events and sermons beyond the 12 newest are
not exposed either. Re-add extra admins from Admin → Administrators. (Old messages stay in the old admin
until you copy any you need.)

## Deploying later (checklist – do not do until approved)
1. Create a **Turso** database (free) → set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel.
2. Create a **Vercel Blob** store → set `BLOB_READ_WRITE_TOKEN` and `BLOB_PUBLIC_URL`.
3. Set `ADMIN_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_SESSION_SECRET` (long random) in Vercel.
4. Copy `vercel/handler.ts` to `api/server.ts`; remove `api/content.js` and `api/submissions.js` (old proxies).
5. In `vercel.json`: rewrite `/api/:path*` and `/media/:path*` to `/api/server`; build the admin
   (`cd new-admin && npm ci && npm run build`) into `public/admin/`; rewrite `/admin/:path*` to `/admin/index.html`.
6. Run `npm run import:live` once against the production database, deploy a **preview**, test, then merge.
