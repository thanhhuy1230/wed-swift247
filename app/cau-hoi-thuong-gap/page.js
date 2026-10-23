import {notFound} from 'next/navigation';import {getSite} from '@/lib/site';import {getLang} from '@/lib/lang';import {D,OG_LOCALE,HREFLANG} from '@/lib/dict';import {langAlternates,withHl} from '@/lib/i18n';import {SITE} from '@/lib/db';
export const dynamic='force-dynamic';
// Trang "Câu hỏi thường gặp": nội dung lấy từ mục FAQ trong Quản trị → Cài đặt, hiển thị giống các trang /p/... (link ở chân trang).
const PATH='/cau-hoi-thuong-gap';
export function generateMetadata(){const lang=getLang(),s=getSite(lang),i=s.info,t=i.faqTitle||'FAQ',d=(s.faq||[]).slice(0,3).map(f=>f.q).join(' ').slice(0,160),alt=langAlternates(PATH,lang);
 return{title:t,description:d,alternates:alt,openGraph:{type:'website',url:alt.canonical,title:t,description:d,locale:OG_LOCALE[lang]},twitter:{card:'summary_large_image',title:t,description:d}}}
export default function FAQ(){const lang=getLang(),t=D[lang],s=getSite(lang),i=s.info,faq=s.faq||[];if(!faq.length)notFound();
 const ld={'@context':'https://schema.org','@graph':[{'@type':'FAQPage',url:SITE+withHl(PATH,lang),inLanguage:HREFLANG[lang],mainEntity:faq.map(f=>({'@type':'Question',name:f.q,acceptedAnswer:{'@type':'Answer',text:f.a}}))}]};
 return(<article className="art"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/><h1>{i.faqTitle||'FAQ'}</h1>
  <div className="faq">{faq.map((f,k)=><details key={k} open={k===0}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
  <div className="cta">{i.bookingUrl&&<a className="pill" href={i.bookingUrl}>{i.bookingLabel||t.book}</a>}<a className="pill alt" href="/#contact">{t.consult}</a></div></article>)}
