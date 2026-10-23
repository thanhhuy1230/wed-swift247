import {LANGS,HREFLANG} from './dict';import {activeLangs} from './langs';
const SITE=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');
// URL tuyệt đối (Next.js bỏ mất ?hl khi đường dẫn tương đối là '/'), dùng cho canonical & hreflang
const abs=p=>SITE+p;
// URL theo ngôn ngữ: tiếng Việt giữ nguyên, ngôn ngữ khác thêm ?hl=xx
export const withHl=(path,l)=>!l||l==='vi'?path:path+(path.includes('?')?'&':'?')+'hl='+l;
// map = {vi:'/duong-dan', en:'/path', ...} – chỉ những ngôn ngữ CÓ bản riêng. Không truyền map = trang có ở mọi ngôn ngữ cùng đường dẫn.
export function langAlternates(path,lang,map){
 const on=activeLangs(),m0=map||Object.fromEntries(on.map(l=>[l,path])),m=Object.fromEntries(Object.entries(m0).filter(([l])=>on.includes(l))),languages={};
 for(const l of on)if(m[l])languages[HREFLANG[l]]=abs(withHl(m[l],l));
 const def=m.vi?abs(m.vi):m.en?abs(withHl(m.en,'en')):undefined;if(def)languages['x-default']=def;
 return{canonical:abs(withHl(m[lang]||path,m[lang]?lang:(m.en?'en':'vi'))),languages}}
