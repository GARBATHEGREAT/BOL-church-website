import{env}from'cloudflare:workers';

export const dynamic='force-dynamic';

const noStoreHeaders={
 'Cache-Control':'no-store, no-cache, must-revalidate, max-age=0',
 'CDN-Cache-Control':'no-store',
 'Vercel-CDN-Cache-Control':'no-store'
};

export async function GET(){
 try{
  await ensureEventColumns();
  const[s,v,e,c]=await Promise.all([
   env.DB.prepare('SELECT key,value FROM settings').all(),
   env.DB.prepare('SELECT * FROM sermons WHERE published=1 ORDER BY featured DESC,id DESC LIMIT 12').all(),
   env.DB.prepare("SELECT * FROM events WHERE published=1 AND event_date>=date('now') ORDER BY event_date LIMIT 12").all(),
   env.DB.prepare('SELECT * FROM content_items WHERE visible=1 ORDER BY section,sort_order,id').all()
  ]);
  return Response.json({settings:Object.fromEntries((s.results as any[]).map(x=>[x.key,x.value])),sermons:v.results,events:e.results,contentItems:c.results},{headers:noStoreHeaders});
 }catch{
  return Response.json({settings:{youtube_channel:'https://youtube.com/@bread_of_life_dcm'},sermons:[],events:[],contentItems:[]},{headers:noStoreHeaders});
 }
}

async function ensureEventColumns(){
 for(const sql of ["ALTER TABLE events ADD COLUMN description text NOT NULL DEFAULT ''","ALTER TABLE events ADD COLUMN image_url text NOT NULL DEFAULT ''"]){
  try{await env.DB.prepare(sql).run()}catch{}
 }
}
