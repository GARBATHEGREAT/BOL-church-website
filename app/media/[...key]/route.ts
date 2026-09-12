import{env}from'cloudflare:workers';

export async function GET(_request:Request,{params}:{params:Promise<{key:string[]}>}){
 const{key}=await params,storageKey=key.map(decodeURIComponent).join('/');
 const object=await env.MEDIA.get(storageKey);
 if(!object)return new Response('Media not found',{status:404});
 const headers=new Headers();object.writeHttpMetadata(headers);headers.set('etag',object.httpEtag);headers.set('cache-control','public, max-age=31536000, immutable');headers.set('x-content-type-options','nosniff');
 return new Response(object.body,{headers});
}
