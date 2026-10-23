import crypto from 'crypto';import {read,write,remove,list} from './store';import {LANGS} from './dict';
// ===== Phiên bản (bản nháp) của bài viết =====
// Mỗi lần bấm "Lưu bản nháp" → thêm 1 phiên bản mới (không ghi đè bản cũ), lưu riêng ở data/revisions/<ngôn ngữ>/<id bài>.json
// Bài đang đăng (posts.json) chỉ thay đổi khi bấm "Public". post.pubRev = số phiên bản đang hiển thị trên website.
const MAX=50; // tối đa 50 phiên bản / bài (tự bỏ bản cũ nhất, không bao giờ bỏ bản đang đăng)
const safe=s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'');
const rf=(l,id)=>`revisions/${LANGS.includes(l)?l:'vi'}/${safe(id)}.json`;
export const FIELDS=['title','slug','cat','cover','coverAlt','excerpt','content','seoTitle','seoDesc','keyword','noindex'];
export const pick=o=>Object.fromEntries(FIELDS.map(k=>[k,k==='noindex'?!!o[k]:String(o[k]??'')]));
const same=(a,b)=>JSON.stringify(pick(a))===JSON.stringify(pick(b));
export const revs=(l,id)=>id?read(rf(l,id),[]):[];
const saveRevs=(l,id,a)=>{if(a.length)write(rf(l,id),a);else remove(rf(l,id))};
// Thêm phiên bản mới; trả về {rev, created:false} nếu nội dung giống hệt bản mới nhất
export function addRev(l,id,data,{pubRev=0,note=''}={}){const a=revs(l,id),last=a[a.length-1];
 if(last&&same(last.data,data))return{rev:last.rev,created:false};
 const rev=(last?last.rev:0)+1;a.push({rev,at:new Date().toISOString(),note:String(note||'').slice(0,120),data:pick(data)});
 while(a.length>MAX){const i=a.findIndex(r=>r.rev!==pubRev);if(i<0)break;a.splice(i,1)}
 saveRevs(l,id,a);return{rev,created:true}}
export const getRev=(l,id,rev)=>revs(l,id).find(r=>r.rev===+rev);
export const delRevs=(l,id,pred)=>{const a=revs(l,id),b=a.filter(r=>!pred(r));saveRevs(l,id,b);return a.length-b.length};
export const dropAll=(l,id)=>saveRevs(l,id,[]);
// Trạng thái hiển thị cho quản trị
export function stateOf(p,l){if(!p)return{k:'new',t:'Bài mới'};const a=revs(l,p.id),last=a[a.length-1];
 if(p.status!=='published')return p.pubRev?{k:'draft',t:'Nháp – đã gỡ khỏi website',last}:{k:'draft',t:'Nháp – chưa từng đăng',last};
 const pending=!!last&&last.rev!==(p.pubRev||0)&&(!p.pubRev?!same(last.data,p):true);
 return pending?{k:'pending',t:'Đã Public · có bản nháp chờ đăng',last}:{k:'public',t:'Public',last}}

// ===== Bản xem trước tạm (nút "Xem trước" khi đang sửa, chưa cần lưu) =====
export function stagePreview(l,data,id=''){const t=crypto.randomBytes(9).toString('hex');write(`previews/${t}.json`,{l,id,at:Date.now(),data:pick(data)});cleanPreviews(6*3600e3);return t}
export const getPreview=t=>read(`previews/${safe(t)}.json`,null);
export function cleanPreviews(age=0){let n=0;for(const f of list('previews')){if(Date.now()-f.mtime>=age){remove(`previews/${f.name}`);n++}}return n}

// ===== Thống kê / dọn dẹp (Cài đặt trang → Bài viết & tin tức → Dọn dẹp bản nháp) =====
export function storageStats(){let revFiles=0,revCount=0,revBytes=0,prevCount=0,prevBytes=0;
 for(const l of LANGS)for(const f of list(`revisions/${l}`)){revFiles++;revBytes+=f.size;revCount+=read(`revisions/${l}/${f.name}`,[]).length}
 for(const f of list('previews')){prevCount++;prevBytes+=f.size}
 return{revFiles,revCount,revBytes,prevCount,prevBytes}}
// Xóa toàn bộ file phiên bản của 1 ngôn ngữ không còn bài tương ứng (bài đã bị xóa)
export function orphanClean(l,ids){let n=0;for(const f of list(`revisions/${l}`)){const id=f.name.replace(/\.json$/,'');if(!ids.has(id)){remove(`revisions/${l}/${f.name}`);n++}}return n}
