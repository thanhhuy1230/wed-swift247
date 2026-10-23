import Link from 'next/link';import {getSite} from '@/lib/site';import {getLang} from '@/lib/lang';import {D} from '@/lib/dict';import {langAlternates} from '@/lib/i18n';import {SITE} from '@/lib/db';import {promos} from '@/lib/promo';import Promos from '@/components/Promos';import {TicketPercent} from 'lucide-react';
export const dynamic='force-dynamic';
// Trang "Tất cả khuyến mãi": toàn bộ ưu đãi đang áp dụng + chương trình đã kết thúc. Mỗi ưu đãi mở chi tiết qua #km-<mã>.
export function generateMetadata(){const lang=getLang(),t=D[lang],alt=langAlternates('/khuyen-mai',lang);return{title:t.promoPageT,description:t.promoPageD,alternates:alt,openGraph:{url:alt.canonical,title:t.promoPageT,description:t.promoPageD}}}
export default function KM(){const lang=getLang(),t=D[lang],s=getSite(lang),i=s.info,all=promos(s.hero||[]),act=all.filter(x=>x.status!=='ended'),end=all.filter(x=>x.status==='ended');
 const ld={'@context':'https://schema.org','@type':'ItemList',name:t.promoPageT,itemListElement:act.map((x,k)=>({'@type':'ListItem',position:k+1,item:{'@type':'Offer',name:x.title,description:x.terms||x.title,url:SITE+'/khuyen-mai#'+x.id,...(x.code?{sku:x.code}:{}),seller:{'@type':'Organization',name:i.name}}}))};
 return(<main><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  <section className="kmh"><div className="wrap"><nav className="bc" aria-label="breadcrumb"><Link href="/">{t.home}</Link> / <span>{t.pTab}</span></nav>
   <h1><TicketPercent size={34}/>{t.promoPageT}</h1><p>{t.promoPageD}</p><span className="kmh-n">{t.promoCount(act.length)}</span></div></section>
  <section className="sec promo-sec km-all"><div className="wrap"><Promos items={act} ended={end} info={i} lang={lang} filter/></div></section></main>)}
