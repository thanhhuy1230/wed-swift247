import {read,write,fname} from './store';import {getLang} from './lang';import {LANGS,FALLBACK} from './dict';import {activeLangs} from './langs';
export const allPages=(l=getLang())=>read(fname('pages.json',l),[]);
export const savePages=(a,l=getLang())=>write(fname('pages.json',l),a);
// Phía khách: ngôn ngữ chưa dịch (ja/ko/zh) dùng tạm trang tiếng Anh chưa có bản dịch (fb='en' → canonical về bản tiếng Anh)
export const pubPages=(l=getLang())=>{const own=allPages(l),f=FALLBACK[l];if(!f||!activeLangs().includes(f))return own;const ids=new Set(own.map(p=>p.id));return[...own,...allPages(f).filter(p=>!ids.has(p.id)).map(p=>({...p,fb:f}))]};
export const pageBySlug=(s,l=getLang())=>pubPages(l).find(p=>p.slug===s);
export const pageVersions=id=>Object.fromEntries(activeLangs().map(l=>[l,allPages(l).find(p=>p.id===id&&p.status==='published'&&!p.noindex)]).filter(x=>x[1]).map(([l,p])=>[l,'/p/'+p.slug]));
