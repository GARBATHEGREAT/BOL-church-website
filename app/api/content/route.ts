import{env}from'cloudflare:workers';

export const dynamic='force-dynamic';

const noStoreHeaders={
 'Cache-Control':'no-store, no-cache, must-revalidate, max-age=0',
 'CDN-Cache-Control':'no-store',
 'Vercel-CDN-Cache-Control':'no-store'
};

export async function GET(){
 try{
  await ensureEventColumns();await ensureEventMedia();
  const[s,v,e,m,c]=await Promise.all([
   env.DB.prepare('SELECT key,value FROM settings').all(),
   env.DB.prepare('SELECT * FROM sermons WHERE published=1 ORDER BY featured DESC,id DESC LIMIT 12').all(),
   env.DB.prepare("SELECT * FROM events WHERE published=1 AND event_date>=date('now') ORDER BY event_date LIMIT 12").all(),
   env.DB.prepare('SELECT * FROM event_media ORDER BY event_id,sort_order,id').all(),
   env.DB.prepare('SELECT * FROM content_items WHERE visible=1 ORDER BY section,sort_order,id').all()
  ]);
  const mediaByEvent=new Map<number,any[]>();for(const item of m.results as any[]){const list=mediaByEvent.get(item.event_id)||[];list.push(item);mediaByEvent.set(item.event_id,list)}
  return Response.json({settings:Object.fromEntries((s.results as any[]).map(x=>[x.key,x.value])),sermons:v.results,events:(e.results as any[]).map(event=>({...event,media:mediaByEvent.get(event.id)||[]})),contentItems:c.results},{headers:noStoreHeaders});
 }catch{
  return Response.json({settings:{youtube_channel:'https://youtube.com/@bread_of_life_dcm'},sermons:[],events:[],contentItems:[]},{headers:noStoreHeaders});
 }
}
async function ensureEventMedia(){await env.DB.prepare("CREATE TABLE IF NOT EXISTS event_media(id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER NOT NULL,media_type TEXT NOT NULL,url TEXT NOT NULL,storage_key TEXT NOT NULL DEFAULT '',caption TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL)").run();await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_event_media_event ON event_media(event_id,sort_order,id)').run()}

async function ensureEventColumns(){
 for(const sql of ["ALTER TABLE events ADD COLUMN description text NOT NULL DEFAULT ''","ALTER TABLE events ADD COLUMN image_url text NOT NULL DEFAULT ''"]){
  try{await env.DB.prepare(sql).run()}catch{}
 }
}
