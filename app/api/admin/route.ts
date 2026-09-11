import{env}from'cloudflare:workers';
import{ADMIN_EMAIL,hashPassword,isAdmin}from'../../admin-auth';

const SECTIONS=new Set(['hero_slides','word_slides','pastors','communities','visit_slides']);

export async function GET(){
 if(!await isAdmin())return Response.json({error:'Forbidden'},{status:403});
 await ensureDefaultContent();
 const[settings,submissions,sermons,events,contentItems,adminRows]=await Promise.all([
  env.DB.prepare('SELECT key,value FROM settings ORDER BY key').all(),
  env.DB.prepare('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 250').all(),
  env.DB.prepare('SELECT * FROM sermons ORDER BY featured DESC,id DESC').all(),
  env.DB.prepare('SELECT * FROM events ORDER BY event_date ASC').all(),
  env.DB.prepare('SELECT * FROM content_items ORDER BY section,sort_order,id').all(),
  env.DB.prepare("SELECT key FROM settings WHERE key LIKE 'admin_user:%' ORDER BY key").all()
 ]);
 const admins=[ADMIN_EMAIL,...adminRows.results.map((row:any)=>String(row.key).slice(11))];
 return Response.json({settings:settings.results,submissions:submissions.results,sermons:sermons.results,events:events.results,contentItems:contentItems.results,admins:[...new Set(admins)]});
}

export async function POST(req:Request){
 if(!await isAdmin())return Response.json({error:'Forbidden'},{status:403});
 const x=await req.json() as Record<string,any>,now=new Date().toISOString();
 if(x.action==='setting')await saveSetting(String(x.key),String(x.value),now);
 else if(x.action==='settings_bulk'){
  const values=x.values&&typeof x.values==='object'?x.values:{};
  for(const[key,value]of Object.entries(values))await saveSetting(key,String(value),now);
 }else if(x.action==='sermon'){
  await env.DB.prepare('INSERT INTO sermons(youtube_id,title,pastor,duration,published,featured,created_at) VALUES(?,?,?,?,1,?,?)').bind(youtubeId(x.youtubeId),text(x.title),text(x.pastor),text(x.duration),x.featured?1:0,now).run();
 }else if(x.action==='edit_sermon'){
  await env.DB.prepare('UPDATE sermons SET youtube_id=?,title=?,pastor=?,duration=?,featured=? WHERE id=?').bind(youtubeId(x.youtubeId),text(x.title),text(x.pastor),text(x.duration),x.featured?1:0,Number(x.id)).run();
 }else if(x.action==='toggle_sermon')await env.DB.prepare('UPDATE sermons SET published=? WHERE id=?').bind(x.visible?1:0,Number(x.id)).run();
 else if(x.action==='event')await env.DB.prepare('INSERT INTO events(title,event_date,event_time,location,published) VALUES(?,?,?,?,1)').bind(text(x.title),text(x.eventDate),text(x.eventTime),text(x.location)).run();
 else if(x.action==='edit_event')await env.DB.prepare('UPDATE events SET title=?,event_date=?,event_time=?,location=? WHERE id=?').bind(text(x.title),text(x.eventDate),text(x.eventTime),text(x.location),Number(x.id)).run();
 else if(x.action==='toggle_event')await env.DB.prepare('UPDATE events SET published=? WHERE id=?').bind(x.visible?1:0,Number(x.id)).run();
 else if(x.action==='status')await env.DB.prepare('UPDATE submissions SET status=? WHERE id=?').bind(text(x.status),Number(x.id)).run();
 else if(x.action==='delete_sermon')await env.DB.prepare('DELETE FROM sermons WHERE id=?').bind(Number(x.id)).run();
 else if(x.action==='delete_event')await env.DB.prepare('DELETE FROM events WHERE id=?').bind(Number(x.id)).run();
 else if(x.action==='content_create')await createContent(x,now);
 else if(x.action==='content_update')await updateContent(x,now);
 else if(x.action==='content_delete')await env.DB.prepare('DELETE FROM content_items WHERE id=?').bind(Number(x.id)).run();
 else if(x.action==='content_toggle')await env.DB.prepare('UPDATE content_items SET visible=?,updated_at=? WHERE id=?').bind(x.visible?1:0,now,Number(x.id)).run();
 else if(x.action==='content_move')await moveContent(Number(x.id),Number(x.direction)||0,now);
 else if(x.action==='admin_add'){
  const email=text(x.email,254).toLowerCase(),password=String(x.password||'');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return Response.json({error:'Enter a valid email address.'},{status:400});
  if(password.length<10)return Response.json({error:'Password must contain at least 10 characters.'},{status:400});
  await saveSetting('admin_user:'+email,await hashPassword(password),now);
 }else if(x.action==='admin_delete'){
  const email=text(x.email,254).toLowerCase();
  if(email===ADMIN_EMAIL)return Response.json({error:'The primary administrator cannot be removed.'},{status:400});
  await env.DB.prepare('DELETE FROM settings WHERE key=?').bind('admin_user:'+email).run();
 }
 else return Response.json({error:'Unknown action'},{status:400});
 return Response.json({ok:true});
}

async function createContent(x:Record<string,any>,now:string){
 const section=text(x.section,40);if(!SECTIONS.has(section))throw new Error('Invalid section');
 const order=await env.DB.prepare('SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM content_items WHERE section=?').bind(section).first<{next_order:number}>();
 await env.DB.prepare('INSERT INTO content_items(section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)').bind(section,text(x.title),text(x.subtitle),text(x.description),text(x.body,5000),text(x.imageUrl,2000),text(x.buttonText),text(x.buttonUrl,2000),text(x.contactLinks,2000),order?.next_order||0,now,now).run();
}

async function updateContent(x:Record<string,any>,now:string){
 await env.DB.prepare('UPDATE content_items SET title=?,subtitle=?,description=?,body=?,image_url=?,button_text=?,button_url=?,contact_links=?,updated_at=? WHERE id=?').bind(text(x.title),text(x.subtitle),text(x.description),text(x.body,5000),text(x.imageUrl,2000),text(x.buttonText),text(x.buttonUrl,2000),text(x.contactLinks,2000),now,Number(x.id)).run();
}

async function moveContent(id:number,direction:number,now:string){
 const item=await env.DB.prepare('SELECT id,section,sort_order FROM content_items WHERE id=?').bind(id).first<any>();if(!item||!direction)return;
 const operator=direction<0?'<':'>';const order=direction<0?'DESC':'ASC';
 const neighbour=await env.DB.prepare(`SELECT id,sort_order FROM content_items WHERE section=? AND sort_order ${operator} ? ORDER BY sort_order ${order},id ${order} LIMIT 1`).bind(item.section,item.sort_order).first<any>();if(!neighbour)return;
 await env.DB.batch([
  env.DB.prepare('UPDATE content_items SET sort_order=?,updated_at=? WHERE id=?').bind(neighbour.sort_order,now,item.id),
  env.DB.prepare('UPDATE content_items SET sort_order=?,updated_at=? WHERE id=?').bind(item.sort_order,now,neighbour.id)
 ]);
}

async function ensureDefaultContent(){
 const count=await env.DB.prepare('SELECT COUNT(*) AS total FROM content_items').first<{total:number}>();if(Number(count?.total)>0)return;
 const now=new Date().toISOString();
 const defaults:any[][]=[
  ['hero_slides','Encounter God. Discover purpose.','Welcome home','A place to belong. A people becoming like Christ.','','https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=2000&q=88','Plan your visit','#visit','',0],
  ['word_slides','Growing in the Word','Worship together','We gather around Scripture, prayer and fellowship.','','/assets/images/ministry/family-05.webp','','','',0],
  ['word_slides','One family in Christ','Faith in community','Every generation has a place to learn, worship and belong.','','/assets/images/ministry/family-06.webp','','','',1],
  ['pastors','Head Pastor','Head Pastor','Leading Bread of Life Divine Covenant Ministry with faith, love and a heart for people.','','/assets/images/ministry/leader.webp','','','',0],
  ['pastors','Pastor','Teaching & Pastoral Care','Teaching God’s Word and caring for the ministry family.','','/assets/images/ministry/pastor.webp','','','',1],
  ['communities','Church Family','Growing together','A caring community where every generation can grow in Christ.','','/assets/images/ministry/family-01.webp','Connect with us','#contact','',0],
  ['communities','Women & Families','Faith for every season','Meaningful fellowship, discipleship and practical support.','','/assets/images/ministry/family-02.webp','Learn more','#contact','',1],
  ['communities','Youth','Bold in faith','Helping a generation discover faith, confidence and purpose.','','/assets/images/ministry/family-03.webp','Learn more','#contact','',2],
  ['communities','Outreach','Love in action','Serving our neighbours and sharing Christ beyond our walls.','','/assets/images/ministry/family-04.webp','Get involved','#contact','',3],
  ['visit_slides','Come as you are','Your first Sunday','You are welcome here. Our church family is ready to receive you.','','/assets/images/ministry/family-03.webp','Let us know you’re coming','#contact','',0],
  ['visit_slides','A place to belong','Worship with us','Bring your family and experience worship, the Word and warm fellowship.','','/assets/images/ministry/family-04.webp','Plan your visit','#contact','',1],
  ['visit_slides','Grow with us','One family in Christ','Take your next step in faith with people who will walk beside you.','','/assets/images/ministry/family-06.webp','Connect with us','#contact','',2]
 ];
 await env.DB.batch(defaults.map(d=>env.DB.prepare('INSERT INTO content_items(section,title,subtitle,description,body,image_url,button_text,button_url,contact_links,sort_order,visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)').bind(...d,now,now)));
}

async function saveSetting(key:string,value:string,now:string){await env.DB.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(key.slice(0,80),value.slice(0,4000),now).run()}
function youtubeId(value:any){const raw=String(value||'').trim();return raw.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/)?.[1]||raw}
function text(value:any,max=1000){return String(value??'').trim().slice(0,max)}
