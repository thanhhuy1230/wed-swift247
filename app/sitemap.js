import {all,SITE} from '@/lib/db';import {allPages} from '@/lib/pages';import {LANGS,HREFLANG} from '@/lib/dict';import {withHl} from '@/lib/i18n';import {getSite} from '@/lib/site';import {svcHref} from '@/lib/services';import {activeLangs} from '@/lib/langs';
export const dynamic='force-dynamic';
// Sơ đồ trang đa ngôn ngữ: mỗi URL kèm danh sách bản ngôn ngữ khác (hreflang) – Google hiểu đúng VI/EN/JA/KO/ZH.
// Chỉ liệt kê nội dung đã đăng và KHÔNG đặt noindex; bài/trang chỉ khai báo những ngôn ngữ đã có bản dịch riêng.
export default function s(){const d=x=>new Date(x.updated||x.date||Date.now()),out=[];
 const add=(map,extra)=>{const languages=Object.fromEntries(Object.entries(map).map(([l,p])=>[HREFLANG[l],SITE+withHl(p,l)]));
  if(map.vi)languages['x-default']=SITE+map.vi;
  for(const[l,p]of Object.entries(map))out.push({url:SITE+withHl(p,l),alternates:{languages},...extra})};
 const ON=activeLangs(),every=p=>Object.fromEntries(ON.map(l=>[l,p]));
 add(every('/'),{changeFrequency:'daily',priority:1});add(every('/news'),{changeFrequency:'daily',priority:.8});add(every('/khuyen-mai'),{changeFrequency:'daily',priority:.8});add(every('/cau-hoi-thuong-gap'),{changeFrequency:'monthly',priority:.6});
 const group=(get,prefix,freq,pri)=>{const ids=new Map();
  for(const l of ON)for(const p of get(l))if(p.status==='published'&&!p.noindex){const g=ids.get(p.id)||{map:{},last:p};g.map[l]=prefix+p.slug;if(d(p)>d(g.last))g.last=p;ids.set(p.id,g)}
  for(const g of ids.values())add(g.map,{lastModified:d(g.last),changeFrequency:freq,priority:pri})};
 (getSite('vi').services||[]).forEach((_,k)=>add(every(svcHref(k)),{changeFrequency:'monthly',priority:.9}));
 group(allPages,'/p/','monthly',.6);group(all,'/post/','weekly',.7);
 return out}
