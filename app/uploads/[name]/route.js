import fs from 'fs';import path from 'path';
const T={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm'};
// Hỗ trợ Range (tua/phát video trên Safari & iOS cần có)
export async function GET(req,{params}){const n=path.basename(params.name),f=path.join(process.cwd(),'data','uploads',n);
 if(!fs.existsSync(f))return new Response('404',{status:404});
 const st=fs.statSync(f),type=T[path.extname(n).toLowerCase()]||'application/octet-stream',h={'content-type':type,'x-content-type-options':'nosniff',...(type==='image/svg+xml'?{'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"}:{}),'cache-control':'public,max-age=31536000','accept-ranges':'bytes'};
 const m=/bytes=(\d*)-(\d*)/.exec(req.headers.get('range')||'');
 if(m&&(m[1]||m[2])){let a=m[1]?+m[1]:st.size-+m[2],b=m[1]&&m[2]?+m[2]:st.size-1;b=Math.min(b,st.size-1);
  if(a>b||a>=st.size)return new Response('416',{status:416,headers:{'content-range':`bytes */${st.size}`}});
  const buf=Buffer.alloc(b-a+1),fd=fs.openSync(f,'r');fs.readSync(fd,buf,0,buf.length,a);fs.closeSync(fd);
  return new Response(buf,{status:206,headers:{...h,'content-range':`bytes ${a}-${b}/${st.size}`,'content-length':String(buf.length)}})}
 return new Response(fs.readFileSync(f),{headers:{...h,'content-length':String(st.size)}})}
