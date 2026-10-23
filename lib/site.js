import {read,write,fname} from './store';import {getLang} from './lang';import {SHARED} from './schema';
const D={info:{},menu:[],banners:[],hero:[],services:[],steps:[],videos:[],reviews:[],partners:[],footerLinks:[],stats:[],rates:[],faq:[],modes:[],postCats:[],postChecks:[]};
// Tiếng Việt: data/site.json (chứa cả mục dùng chung). Ngôn ngữ khác: data/site.<lang>.json (chữ + danh sách riêng).
// Các mục "dùng chung" (logo, màu, hotline, mạng xã hội, GA...) luôn nằm trong site.json và áp dụng cho mọi ngôn ngữ.
export const getSite=(l=getLang())=>{const b=read('site.json',{});
 if(l==='vi')return{...D,...b,info:{...(b.info||{})}};
 const e=read(fname('site.json',l),{}),en=l!=='en'?read(fname('site.json','en'),{}):{},bi=b.info||{},ei=e.info||{},xi=en.info||{},info={};
 // mục chưa dịch: lấy bản tiếng Anh, sau đó mới đến tiếng Việt
 for(const k of new Set([...Object.keys(bi),...Object.keys(ei),...Object.keys(xi)]))info[k]=SHARED.has(k)?bi[k]:(k in ei?ei[k]:k in xi?xi[k]:bi[k]);
 const lists=Object.fromEntries(Object.keys(D).filter(k=>k!=='info').map(k=>[k,Array.isArray(e[k])?e[k]:Array.isArray(en[k])?en[k]:(b[k]||[])]));
 return{...D,...lists,info}};
export const saveInfo=(l,v)=>{const b=read('site.json',{});b.info=b.info||{};
 if(l==='vi'){Object.assign(b.info,v);write('site.json',b);return}
 const f=fname('site.json',l),e=read(f,{});e.info=e.info||{};
 for(const[k,x]of Object.entries(v)){if(SHARED.has(k))b.info[k]=x;else e.info[k]=x}
 write('site.json',b);write(f,e)};
export const saveList=(l,k,a)=>{const f=fname('site.json',l),s=read(f,{});s[k]=a;write(f,s)};
