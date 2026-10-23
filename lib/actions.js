'use server';
import {redirect} from 'next/navigation';import {revalidatePath} from 'next/cache';import {headers,cookies} from 'next/headers';
import {all,save,slugify,bySlug,published} from './db';import {withHl} from './i18n';import {isAdmin,setSession,clearSession} from './auth';
import {saveInfo,saveList} from './site';import {allPages,savePages,pageBySlug,pubPages} from './pages';import {allLeads,saveLeads} from './leads';
import {autoDesc} from './seo';import {getLang} from './lang';import {LANGS} from './dict';import {INFO_GROUPS,LISTS,SHARED_LISTS} from './schema';import {activeLangs} from './langs';import {addRev,getRev,delRevs,dropAll,revs,stagePreview,cleanPreviews,orphanClean,storageStats} from './revisions';
const need=()=>{if(!isAdmin())redirect('/admin/login')};
// Ngôn ngữ của thao tác: ưu tiên ô ẩn "lang" trong form (đúng ngôn ngữ đang hiển thị trên màn hình), mặc định theo cookie
const L=fd=>{const v=fd&&fd.get&&fd.get('lang');return LANGS.includes(v)?v:getLang()};
const ip=()=>(headers().get('x-forwarded-for')||'').split(',')[0].trim()||'local';
const bucket=(m,k,ms,max)=>{const n=Date.now(),a=(m.get(k)||[]).filter(t=>n-t<ms);if(a.length>=max)return false;m.set(k,[...a,n]);return true};
const loginTry=new Map(),leadTry=new Map();

export async function login(fd){
 if(!bucket(loginTry,ip(),9e5,8))redirect('/admin/login?e=2'); // tối đa 8 lần sai / 15 phút
 if(fd.get('p')===(process.env.ADMIN_PASSWORD||'admin123')){loginTry.delete(ip());setSession();redirect('/admin')}
 redirect('/admin/login?e=1')}
export async function logout(){clearSession();redirect('/admin/login')}

// ===== Ngôn ngữ =====
// Đổi ngôn ngữ (lưu cookie). Trả về đường dẫn tương ứng ở ngôn ngữ mới (nếu trang hiện tại không có bản dịch), hoặc null = giữ nguyên trang.
export async function switchLang(l,path='/',id=''){
 if(!LANGS.includes(l))return null;
 if(!path.startsWith('/admin')&&!activeLangs().includes(l))return null; // ngôn ngữ đã tắt: khách không chuyển được
 const prev=getLang();cookies().set('lang',l,{path:'/',maxAge:31536000,sameSite:'lax'});
 const adm=path.startsWith('/admin'),out=p=>adm?p:withHl(p,l);
 let m;
 // bài viết / trang nội dung: chuyển sang bản dịch cùng id (ngôn ngữ chưa dịch thì dùng bản tiếng Anh nếu có)
 if((m=path.match(/^\/post\/([^/]+)/))){const p=bySlug(decodeURIComponent(m[1]),prev),q=p&&published(l).find(x=>x.id===p.id);return out(q?'/post/'+q.slug:'/news')}
 if((m=path.match(/^\/p\/([^/]+)/))){const p=pageBySlug(decodeURIComponent(m[1]),prev),q=p&&pubPages(l).find(x=>x.id===p.id&&x.status==='published');return out(q?'/p/'+q.slug:'/')}
 if(path==='/admin/edit'&&id)return all(l).some(x=>x.id===id)?'/admin/edit?id='+id:'/admin';
 if(path==='/admin/pages/edit'&&id)return allPages(l).some(x=>x.id===id)?'/admin/pages/edit?id='+id:'/admin/pages';
 return adm?null:out(path)}

// ===== Bài viết =====
// Làm sạch trường SEO + tự điền khi tác giả để trống (mô tả lấy từ nội dung), đảm bảo slug duy nhất
const txt=(v,n)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,n);
const uniq=(slug,id,list)=>{let s=slug||Date.now().toString(),b=s,i=2;while(list.some(p=>p.slug===s&&p.id!==id))s=b+'-'+i++;return s};
const seoFields=fd=>{const content=String(fd.get('content')||''),excerpt=txt(fd.get('excerpt'),300);
 return{excerpt:excerpt||autoDesc(content,160),content,seoTitle:txt(fd.get('seoTitle'),120),seoDesc:txt(fd.get('seoDesc'),300),keyword:txt(fd.get('keyword'),80),noindex:fd.get('noindex')==='1',status:fd.get('status')==='draft'?'draft':'published'}};
// ===== Bài viết: Nháp → Lưu thành phiên bản mới → Public =====
// • "Lưu bản nháp": luôn thêm 1 phiên bản mới (không ghi đè). Bài đang Public KHÔNG đổi trên website cho tới khi bấm "Public".
// • "Public": lưu phiên bản (nếu có thay đổi) rồi đưa phiên bản đó lên trang chính thức.
const postData=(fd,a,id)=>{const title=txt(fd.get('title'),150),{status,...seo}=seoFields(fd);
 return{title,slug:uniq(slugify(fd.get('slug')||title),id,a),cat:String(fd.get('cat')||''),cover:String(fd.get('cover')||''),coverAlt:txt(fd.get('coverAlt'),150),...seo}};
const back=(id,q)=>redirect(`/admin/edit?id=${id}&${q}`);
export async function saveDraft(fd){need();const l=L(fd),a=all(l),id=fd.get('id')||Date.now().toString(),d=postData(fd,a,id),now=new Date().toISOString();
 let i=a.findIndex(p=>p.id===id);
 if(i<0){a.push({id,date:now,updated:now,status:'draft',...d});i=a.length-1;save(a,l)}
 else if(a[i].status!=='published'){a[i]={...a[i],...d,updated:now};save(a,l)} // bài chưa từng đăng: cập nhật bản làm việc (vẫn ẩn)
 const r=addRev(l,id,d,{pubRev:a[i].pubRev||0,note:fd.get('note')});
 revalidatePath('/admin','layout');back(id,`ok=${r.created?'saved':'same'}&rev=${r.rev}`)}
const goLive=(l,a,i,d,rev)=>{const now=new Date().toISOString(),p=a[i],first=p.status!=='published'&&!p.pubRev;
 a[i]={...p,...d,slug:uniq(d.slug,p.id,a),status:'published',pubRev:rev,updated:now,date:first?now:(p.date||now)};save(a,l);revalidatePath('/','layout')};
export async function publishPost(fd){need();const l=L(fd),a=all(l),id=fd.get('id')||Date.now().toString(),d=postData(fd,a,id);
 let i=a.findIndex(p=>p.id===id);if(i<0){a.push({id,status:'draft',...d});i=a.length-1}
 const r=addRev(l,id,d,{pubRev:a[i].pubRev||0,note:'Public'});goLive(l,a,i,d,r.rev);back(id,`ok=published&rev=${r.rev}`)}
// Public một phiên bản đã lưu (từ trang xem trước / lịch sử phiên bản)
export async function publishRev(fd){need();const l=L(fd),id=fd.get('id'),rv=getRev(l,id,fd.get('rev')),a=all(l),i=a.findIndex(p=>p.id===id);
 if(!rv||i<0)back(id,'ok=err');goLive(l,a,i,rv.data,rv.rev);back(id,`ok=published&rev=${rv.rev}`)}
export async function unpublishPost(fd){need();const l=L(fd),id=fd.get('id'),a=all(l),i=a.findIndex(p=>p.id===id);
 if(i>=0){a[i]={...a[i],status:'draft'};save(a,l);revalidatePath('/','layout')}back(id,'ok=unpublished')}
export async function delRevision(fd){need();const l=L(fd),id=fd.get('id'),rev=+fd.get('rev'),p=all(l).find(x=>x.id===id);
 delRevs(l,id,r=>r.rev===rev&&r.rev!==(p&&p.pubRev));back(id,'ok=revdel')}
// Nút "Xem trước": lưu tạm nội dung đang gõ (chưa cần bấm Lưu) → trả mã để mở /admin/preview?t=…
export async function previewDraft(fd){need();const l=L(fd),a=all(l),id=fd.get('id')||'';return stagePreview(l,postData(fd,a,id||'preview'),id)}
// Giữ tương thích: form cũ gọi savePost → lưu nháp
export async function savePost(fd){return saveDraft(fd)}
export async function delPost(fd){need();const l=L(fd),id=fd.get('id');save(all(l).filter(p=>p.id!==id),l);dropAll(l,id);revalidatePath('/','layout');redirect('/admin')}

// ===== Dọn dẹp bản nháp (Cài đặt trang → Bài viết & tin tức) – trả về thông báo kết quả =====
export async function cleanupDrafts(kind,keys=[]){need();let n=0,m='';
 if(kind==='posts'){const want=new Set(keys);for(const l of LANGS){const a=all(l),keep=a.filter(p=>!(p.status!=='published'&&(!keys.length||want.has(l+':'+p.id))));
   for(const p of a)if(!keep.includes(p)){dropAll(l,p.id);n++}if(keep.length!==a.length)save(keep,l)}m=`Đã xóa ${n} bài nháp (kèm toàn bộ phiên bản).`}
 else if(kind==='old'){for(const l of LANGS)for(const p of all(l)){const r=revs(l,p.id),last=r[r.length-1];if(last)n+=delRevs(l,p.id,x=>x.rev!==last.rev&&x.rev!==(p.pubRev||0))}m=`Đã xóa ${n} phiên bản cũ (giữ bản đang đăng và bản mới nhất của mỗi bài).`}
 else if(kind==='pending'){for(const l of LANGS)for(const p of all(l))if(p.status==='published'&&p.pubRev)n+=delRevs(l,p.id,x=>x.rev!==p.pubRev);m=`Đã xóa ${n} bản nháp chưa đăng của các bài đang Public (giữ đúng bản đang hiển thị).`}
 else if(kind==='temp'){n=cleanPreviews(0);let o=0;for(const l of LANGS)o+=orphanClean(l,new Set(all(l).map(p=>p.id)));m=`Đã xóa ${n} bản xem trước tạm và ${o} file phiên bản của bài đã bị xóa.`}
 revalidatePath('/admin','layout');return{msg:m,n,stats:storageStats()}}

// ===== Trang nội dung =====
export async function savePage(fd){need();const l=L(fd);
 const a=allPages(l),id=fd.get('id'),title=txt(fd.get('title'),150);
 const d={title,slug:uniq(slugify(fd.get('slug')||title),id,a),updated:new Date().toISOString(),...seoFields(fd)};
 if(id){const i=a.findIndex(p=>p.id===id);if(i>=0)a[i]={...a[i],...d};else a.push({id,...d})}else a.push({id:Date.now().toString(),...d});
 savePages(a,l);revalidatePath('/','layout');redirect('/admin/pages')}
export async function delPage(fd){need();const l=L(fd);savePages(allPages(l).filter(p=>p.id!==fd.get('id')),l);revalidatePath('/','layout');redirect('/admin/pages')}

// Sao chép bài/trang sang ngôn ngữ khác (chọn ở ô "to"; giữ nguyên id để nút đổi ngôn ngữ ở website chuyển đúng sang bản dịch)
export async function copyItem(fd){need();const from=L(fd),to0=fd.get('to'),to=LANGS.includes(to0)&&to0!==from?to0:LANGS.find(x=>x!==from),kind=fd.get('kind'),id=fd.get('id'),back=kind==='page'?'/admin/pages':'/admin';
 const src=kind==='page'?allPages(from):all(from),dst=kind==='page'?allPages(to):all(to),it=src.find(x=>x.id===id);
 if(!it)redirect(back);
 if(dst.some(x=>x.id===id))redirect(back+'?c=exists&to='+to);
 const copy={...it,status:'draft'};if(dst.some(x=>x.slug===copy.slug))copy.slug+='-'+to;
 if(kind==='page')savePages([...dst,copy],to);else save([...dst,copy],to);
 revalidatePath('/','layout');redirect(back+'?c=ok&to='+to)}

// ===== Cài đặt trang: mỗi phần lưu riêng =====
// Tự bỏ dòng trống
const clean=r=>{if(Array.isArray(r))return r.map(clean).filter(x=>x&&Object.values(x).some(v=>Array.isArray(v)?v.length:String(v||'').trim()));
 if(r&&typeof r==='object'){const o={};for(const[k,v]of Object.entries(r))o[k]=Array.isArray(v)?clean(v):v;return o}return r};
// kind='info': data = {khóa: giá trị} của một nhóm; kind='list': data = mảng các dòng. Lưu vào đúng ngôn ngữ l.
export async function saveSection(l,kind,key,data){need();
 if(!LANGS.includes(l))return{ok:false};
 if(kind==='info'){const g=INFO_GROUPS.find(x=>x[0]===key);if(!g)return{ok:false};
  const v={};for(const k of g[2])v[k]=String((data||{})[k]??'');saveInfo(l,v);revalidatePath('/','layout');return{ok:true,data:v}}
 if(kind==='list'){if(!LISTS.some(x=>x[0]===key)||!Array.isArray(data))return{ok:false};
  const c=clean(data);saveList(SHARED_LISTS.has(key)?'vi':l,key,c);revalidatePath('/','layout');return{ok:true,data:c}}
 return{ok:false}}

// ===== Khách để lại thông tin tư vấn =====
export async function submitLead(fd){const lang=getLang();
 if(fd.get('website'))redirect('/?sent=1#contact'); // ô bẫy bot
 const name=String(fd.get('name')||'').trim().slice(0,100),phone=String(fd.get('phone')||'').replace(/[\s.\-()]/g,''),service=String(fd.get('service')||'').slice(0,120),message=String(fd.get('message')||'').trim().slice(0,1000);
 if(name.length<2||!/^\+?\d{9,15}$/.test(phone))redirect('/?e=1#contact');
 if(!bucket(leadTry,ip(),36e5,5))redirect('/?e=2#contact');
 const l={id:Date.now().toString(),date:new Date().toISOString(),name,phone,service,message,lang,status:'new'};
 saveLeads([l,...allLeads()].slice(0,5000));
 const w=process.env.LEAD_WEBHOOK_URL;
 if(w){try{await fetch(w,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:`Khách mới (${lang.toUpperCase()}): ${name} - ${phone}${service?' - '+service:''}${message?'\n'+message:''}`,...l})})}catch{}}
 redirect('/?sent=1#contact')}
export async function leadStatus(fd){need();saveLeads(allLeads().map(l=>l.id===fd.get('id')?{...l,status:fd.get('status')}:l));revalidatePath('/admin/leads');redirect('/admin/leads')}
export async function delLead(fd){need();saveLeads(allLeads().filter(l=>l.id!==fd.get('id')));redirect('/admin/leads')}
