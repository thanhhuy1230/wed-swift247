import {read,write,fname} from './store';import {getLang} from './lang';import {CATS_L,LANGS,FALLBACK} from './dict';import {activeLangs} from './langs';
// Mọi hàm mặc định dùng ngôn ngữ đang chọn (getLang) – truyền l để chỉ định ngôn ngữ khác.
export const all=(l=getLang())=>read(fname('posts.json',l),[]);
export const save=(a,l=getLang())=>write(fname('posts.json',l),a);
// Phía khách: ngôn ngữ chưa dịch đủ (ja/ko/zh) hiển thị thêm bài tiếng Anh chưa có bản dịch (đánh dấu fb='en' để đặt canonical về bản gốc).
export const pub=(l=getLang())=>{const own=all(l),f=FALLBACK[l];if(!f||!activeLangs().includes(f))return own;const ids=new Set(own.map(p=>p.id));return[...own,...all(f).filter(p=>!ids.has(p.id)).map(p=>({...p,fb:f}))]};
export const published=(l=getLang())=>pub(l).filter(p=>p.status==='published').sort((a,b)=>b.date.localeCompare(a.date));
export const bySlug=(s,l=getLang())=>pub(l).find(p=>p.slug===s);
// Các bản ngôn ngữ của cùng 1 bài (cùng id) đã đăng & cho phép lập chỉ mục: {vi:'/post/a', en:'/post/b'}
export const postVersions=id=>Object.fromEntries(activeLangs().map(l=>[l,all(l).find(p=>p.id===id&&p.status==='published'&&!p.noindex)]).filter(x=>x[1]).map(([l,p])=>[l,'/post/'+p.slug]));
export const slugify=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// Chuyên mục bài viết: quản lý ở Cài đặt trang → "Chuyên mục bài viết". Mã chuyên mục lấy từ bản tiếng Việt (site.json);
// ngôn ngữ khác chỉ dịch tên theo cùng mã (thiếu thì dùng tên mặc định / tên tiếng Việt). Chưa cấu hình → dùng danh sách mặc định.
const ckey=k=>slugify(k);
const catRows=l=>{const r=read(l==='vi'?'site.json':fname('site.json',l),{}).postCats;return Array.isArray(r)?r.filter(x=>x&&ckey(x.key)):[]};
export const catList=(l=getLang())=>{const base=catRows('vi');
 if(!base.length)return Object.entries(CATS_L[l]||CATS_L.vi).map(([key,name])=>({key,name,desc:''}));
 const own=l==='vi'?base:catRows(l),seen=new Set(),out=[];
 for(const x of base){const key=ckey(x.key);if(seen.has(key))continue;seen.add(key);const o=own.find(y=>ckey(y.key)===key)||{};
  out.push({key,name:String(o.name||'').trim()||(CATS_L[l]||{})[key]||String(x.name||'').trim()||key,desc:String(o.desc||(l==='vi'?x.desc:'')||'').trim()})}
 return out};
export const cats=(l=getLang())=>Object.fromEntries(catList(l).map(c=>[c.key,c.name]));
export const SITE=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
export const NAME=process.env.NEXT_PUBLIC_SITE_NAME||'Swift247';
export const norm=t=>(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
export const readTime=h=>Math.max(1,Math.round((h||'').replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length/200));
