import fs from 'fs';import path from 'path';import {isAdmin} from '@/lib/auth';
const IMG=['.png','.jpg','.jpeg','.webp','.gif','.svg','.avif'],VID=['.mp4','.webm'];
export async function POST(req){if(!isAdmin())return new Response('no',{status:401});
 const f=(await req.formData()).get('file');if(!f)return new Response('bad',{status:400});const ext=path.extname(f.name||'').toLowerCase();
 const ok=IMG.includes(ext)?f.size<=8e6:VID.includes(ext)?f.size<=40e6:false;if(!ok)return new Response('bad',{status:400});
 const d=path.join(process.cwd(),'data','uploads');fs.mkdirSync(d,{recursive:true});const n=Date.now()+ext;
 fs.writeFileSync(path.join(d,n),Buffer.from(await f.arrayBuffer()));return Response.json({url:'/uploads/'+n})}
