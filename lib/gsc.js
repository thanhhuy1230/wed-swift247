import crypto from 'crypto';import {getSite} from './site';import {SITE} from './db';
// ===== Google Search Console API – từ khóa THẬT mà bài viết đang có lượt hiển thị trên Google =====
// Cấu hình (an toàn – khóa bí mật chỉ nằm ở máy chủ, không lưu trong dữ liệu website):
//   .env.local: GSC_CREDENTIALS='{...nội dung file JSON của service account...}'
//            hoặc GSC_CLIENT_EMAIL=...  +  GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
//   Thuộc tính Search Console: Cài đặt trang → SEO & Analytics → "Search Console – thuộc tính" (vd: sc-domain:swift247.vn hoặc https://swift247.vn/), hoặc biến GSC_SITE.
function creds(){try{if(process.env.GSC_CREDENTIALS){const j=JSON.parse(process.env.GSC_CREDENTIALS);return{email:j.client_email,key:j.private_key}}}catch{}
 const email=process.env.GSC_CLIENT_EMAIL,key=(process.env.GSC_PRIVATE_KEY||'').replace(/\\n/g,'\n');return email&&key?{email,key}:null}
export const gscProperty=()=>String(getSite('vi').info.gscSite||process.env.GSC_SITE||'').trim()||(SITE.startsWith('http')&&!/yourdomain/.test(SITE)?SITE.replace(/\/?$/,'/'):'');
export const gscStatus=()=>{const c=creds(),p=gscProperty();return{configured:!!(c&&p),hasKey:!!c,property:p,email:c?c.email:''}};
let tok=null;
const b64=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
async function token(){if(tok&&tok.exp>Date.now()+60e3)return tok.v;const c=creds();if(!c)throw new Error('Chưa cấu hình khóa service account (GSC_CREDENTIALS).');
 const now=Math.floor(Date.now()/1000),un=b64({alg:'RS256',typ:'JWT'})+'.'+b64({iss:c.email,scope:'https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const sig=crypto.createSign('RSA-SHA256').update(un).sign(c.key).toString('base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:un+'.'+sig})});
 const j=await r.json();if(!r.ok)throw new Error('Google từ chối đăng nhập: '+(j.error_description||j.error||r.status));tok={v:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000};return tok.v}
const cache=new Map();
const day=d=>new Date(Date.now()-d*864e5).toISOString().slice(0,10);
// page: URL đầy đủ của bài (để trống = toàn website). days: số ngày gần nhất (dữ liệu Search Console trễ ~2–3 ngày)
export async function gscQueries({page='',days=28,limit=25}={}){const prop=gscProperty();if(!prop)throw new Error('Chưa nhập thuộc tính Search Console.');
 const k=prop+'|'+page+'|'+days+'|'+limit,c=cache.get(k);if(c&&Date.now()-c.at<3600e3)return c.v;
 const body={startDate:day(days+2),endDate:day(2),dimensions:['query'],rowLimit:limit,dataState:'final'};
 if(page)body.dimensionFilterGroups=[{filters:[{dimension:'page',operator:'contains',expression:page.replace(/^https?:\/\/[^/]+/,'').replace(/\?.*$/,'')}]}];
 const r=await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/searchAnalytics/query`,{method:'POST',headers:{authorization:'Bearer '+await token(),'content-type':'application/json'},body:JSON.stringify(body)});
 const j=await r.json();if(!r.ok)throw new Error(r.status===403?`Service account chưa được cấp quyền trong Search Console cho “${prop}”. Thêm email ${creds().email} làm người dùng của thuộc tính.`:(j.error&&j.error.message)||'Lỗi Search Console '+r.status);
 const v={property:prop,from:body.startDate,to:body.endDate,rows:(j.rows||[]).map(x=>({q:x.keys[0],clicks:x.clicks,imp:x.impressions,ctr:x.ctr,pos:x.position}))};cache.set(k,{at:Date.now(),v});return v}
