import{env}from'cloudflare:workers';
import{isAdmin}from'../../../admin-auth';

const MAX_BYTES=8*1024*1024;
const TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif']);

export async function POST(request:Request){
 if(!await isAdmin(request.headers))return Response.json({error:'Your admin session has expired. Please sign in again.'},{status:403});
 const form=await request.formData();
 const file=form.get('image');
 if(!(file instanceof File))return Response.json({error:'Choose an image first.'},{status:400});
 if(!TYPES.has(file.type))return Response.json({error:'Use JPG, PNG, WebP or GIF.'},{status:400});
 if(file.size>MAX_BYTES)return Response.json({error:'Image must be smaller than 8 MB.'},{status:400});
 const extension=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
 const key=`church/${Date.now()}-${crypto.randomUUID()}.${extension}`;
 await env.MEDIA.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
 return Response.json({url:`/media/${encodeURIComponent(key)}`});
}
