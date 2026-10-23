import {getSite} from './site';import {slugify} from './seo';import {imgList} from './promo';
// ===== Trang chi tiết dịch vụ: /dich-vu/<slug> =====
// Slug dùng chung cho mọi ngôn ngữ (lấy theo tên tiếng Việt cùng vị trí, hoặc ô "Đường dẫn" nếu admin nhập) → đổi ngôn ngữ vẫn đúng trang, hreflang chuẩn.
const viList=()=>getSite('vi').services||[];
export const svcSlug=k=>{const v=viList()[k]||{};return slugify(v.slug||v.title)||'dich-vu-'+(k+1)};
export const svcHref=k=>'/dich-vu/'+svcSlug(k);
export const svcList=lang=>(getSite(lang).services||[]).map((x,k)=>({...x,k,slug:svcSlug(k),url:'/dich-vu/'+svcSlug(k),img:imgList(x)[0]||'',imgs:imgList(x),pts:String(x.points||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}));
export const svcBySlug=(slug,lang)=>svcList(lang).find(x=>x.slug===slug);
