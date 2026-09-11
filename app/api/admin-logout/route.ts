import{clearSessionCookie}from'../../admin-auth';
export async function GET(request:Request){return new Response(null,{status:302,headers:{location:new URL('/admin',request.url).toString(),'set-cookie':clearSessionCookie(),'cache-control':'no-store'}})}
