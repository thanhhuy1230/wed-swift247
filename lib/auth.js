import crypto from 'crypto';import {cookies} from 'next/headers';
const sig=()=>crypto.createHmac('sha256',process.env.AUTH_SECRET||'dev').update('admin').digest('hex');
export const isAdmin=()=>cookies().get('s')?.value===sig();
export const setSession=()=>cookies().set('s',sig(),{httpOnly:true,sameSite:'lax',path:'/',maxAge:604800});
export const clearSession=()=>cookies().delete('s');
