import{env}from'cloudflare:workers';
import{isAdmin}from'../../../admin-auth';

const IMAGE_MAX=8*1024*1024,VIDEO_MAX=100*1024*1024;
const IMAGE_TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif']);
const VIDEO_TYPES=new Set(['video/mp4','video/webm','video/quicktime']);

export async function POST(request:Request){
 if(!await isAdmin(request.headers))return Response.json({error:'Your admin session has expired. Please sign in again.'},{status:403});
 const form=await request.formData();
 const file=form.get('file')||form.get('image');
 if(!(file instanceof File))return Response.json({error:'Choose a photo or video first.'},{status:400});
 const type=IMAGE_TYPES.has(file.type)?'image':VIDEO_TYPES.has(file.type)?'video':'';
 if(!type)return Response.json({error:'Use JPG, PNG, WebP, GIF, MP4, WebM or MOV.'},{status:400});
 if(file.size>(type==='image'?IMAGE_MAX:VIDEO_MAX))return Response.json({error:type==='image'?'Images must be smaller than 8 MB.':'Videos must be smaller than 100 MB.'},{status:400});
 const extension=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
 const key=`church/${type}s/${Date.now()}-${crypto.randomUUID()}.${extension}`;
 await env.MEDIA.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
 return Response.json({url:`/media/${key.split('/').map(encodeURIComponent).join('/')}`,key,type,name:file.name});
}
