import {headers} from 'next/headers';

export const ADMIN_EMAIL='garbajohn101@gmail.com';

export async function isAdmin(){
 if(process.env.NODE_ENV==='development')return true;
 return((await headers()).get('oai-authenticated-user-email')||'').toLowerCase()===ADMIN_EMAIL;
}
