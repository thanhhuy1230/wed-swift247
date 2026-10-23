import {notFound} from 'next/navigation';import {CircleCheck,Clock,ArrowRight} from 'lucide-react';import {svcList,svcBySlug} from '@/lib/services';import {langAlternates,withHl} from '@/lib/i18n';import {SITE} from '@/lib/db';import {getSite} from '@/lib/site';import {getLang} from '@/lib/lang';import {D,OG_LOCALE,HREFLANG} from '@/lib/dict';import {cut} from '@/lib/seo';import Icon from '@/components/Icon';import Services from '@/components/Services';import GaView from '@/components/GaView';
// ===== Trang chi tiết dịch vụ (nút "Tìm hiểu thêm" trên thẻ dịch vụ ở trang chủ) =====
// Chuẩn SEO: 1 thẻ H1, title/description riêng, canonical + hreflang 5 ngôn ngữ, Open Graph/Twitter, JSON-LD Service + BreadcrumbList, liên kết nội bộ tới dịch vụ khác.
export const dynamic='force-dynamic';
const L={vi:{eta:'Thời gian giao',pts:'Điểm nổi bật',other:'Dịch vụ khác',info:'Xem thêm thông tin chi tiết'},en:{eta:'Delivery time',pts:'Highlights',other:'Other services',info:'More details'},ja:{eta:'配達時間',pts:'特長',other:'その他のサービス',info:'詳細情報を見る'},ko:{eta:'배송 시간',pts:'주요 특징',other:'다른 서비스',info:'자세한 정보 보기'},zh:{eta:'配送时间',pts:'服务亮点',other:'其他服务',info:'查看详细信息'}};
const abs=u=>!u?undefined:/^https?:/.test(u)?u:SITE+u;
const ogImg=(x,i)=>x.img&&!/\.svg(\?|$)/i.test(x.img)?x.img:i.ogImage;
const descOf=(x,i)=>x.seoDesc?cut(x.seoDesc,160):cut([x.desc,String(x.detail||'').replace(/\s+/g,' ')].filter(Boolean).join(' ')||i.seoDesc,158);
export function generateMetadata({params}){const lang=getLang(),x=svcBySlug(params.slug,lang);if(!x)return{};const i=getSite(lang).info,t=x.seoTitle||x.title,d=descOf(x,i),alt=langAlternates(x.url,lang),im=ogImg(x,i),images=im?[{url:im,alt:x.alt||x.title}]:[];
 return{title:t,description:d,alternates:alt,openGraph:{type:'website',url:alt.canonical,title:`${t} | ${i.name}`,description:d,locale:OG_LOCALE[lang],images},twitter:{card:'summary_large_image',title:`${t} | ${i.name}`,description:d,images:images.map(z=>z.url)}}}
export default function SvcPage({params}){const lang=getLang(),t=D[lang]||D.vi,l=L[lang]||L.vi,x=svcBySlug(params.slug,lang);if(!x)notFound();const s=getSite(lang),i=s.info,all=svcList(lang),others=all.filter(z=>z.slug!==x.slug),
 url=SITE+withHl(x.url,lang),book=x.href&&x.href!=='#'?x.href:(i.bookingUrl||'/#contact'),paras=String(x.detail||'').split(/\r?\n\s*\r?\n|\r?\n/).map(z=>z.trim()).filter(Boolean);
const ld={'@context':'https://schema.org','@graph':[
 {'@type':'Service','@id':url+'#service',name:x.title,description:descOf(x,i),url,image:x.imgs.map(abs),serviceType:'Courier',category:i.servicesTitle||t.sTab,areaServed:{'@type':'Country',name:'Vietnam'},inLanguage:HREFLANG[lang],provider:{'@type':'Organization','@id':SITE+'/#org',name:i.name,url:SITE,telephone:i.hotline||undefined},
  ...(x.pts.length?{hasOfferCatalog:{'@type':'OfferCatalog',name:l.pts,itemListElement:x.pts.map(p=>({'@type':'Offer',itemOffered:{'@type':'Service',name:p}}))}}:{})},
 {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:t.home,item:SITE+withHl('/',lang)},{'@type':'ListItem',position:2,name:i.servicesTitle||t.sTab,item:SITE+withHl('/',lang)+'#services'},{'@type':'ListItem',position:3,name:x.title,item:url}]}]};
return(<><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/><GaView name="view_item" params={{content_type:'service',item_id:x.slug,item_name:x.title,site_language:lang}}/>
<article className="svd wrap" aria-labelledby="svd-t">
 <nav className="bc" aria-label="breadcrumb"><a href={withHl('/',lang)}>{t.home}</a> › <a href={withHl('/',lang)+'#services'}>{i.servicesTitle||t.sTab}</a> › <span aria-current="page">{x.title}</span></nav>
 <div className="svd-h">
  <div className="svd-g">{x.imgs.length?x.imgs.map((src,j)=><figure key={j} className={j?'svd-th':'svd-main'}><img src={src} alt={j?`${x.alt||x.title} – ${j+1}`:(x.alt||x.title)} width="1200" height="900" loading={j?'lazy':'eager'} fetchPriority={j?undefined:'high'} decoding="async"/></figure>):<figure className="svd-main svd-ph"/>}</div>
  <div className="svd-i">
   <span className="svd-ic"><Icon name={x.icon} size={28}/></span>
   <h1 id="svd-t">{x.title}</h1>
   {x.eta&&<p className="svd-eta"><Clock size={17}/><span>{l.eta}: <b>{x.eta}</b></span></p>}
   {x.desc&&<p className="svd-d">{x.desc}</p>}
   {x.pts.length>0&&<><h2 className="svd-st">{l.pts}</h2><ul className="svd-p">{x.pts.map((p,j)=><li key={j}><CircleCheck size={17}/>{p}</li>)}</ul></>}
   <div className="cta"><a className="pill" href={book} data-ga="begin_booking" data-ga-location="service_page" data-ga-label={x.title}>{x.btn||i.bookingLabel||t.book}<ArrowRight size={16}/></a><a className="pill alt" href={withHl('/',lang)+'#contact'} data-ga="click_consult" data-ga-label={x.title}>{t.consult}</a></div>
  </div>
 </div>
 {(paras.length>0||x.more)&&<div className="svd-body body">{paras.map((p,j)=><p key={j}>{p}</p>)}{x.more&&<p><a className="sv2-l" href={x.more}>{l.info}<ArrowRight size={15}/></a></p>}</div>}
</article>
{others.length>0&&<section className="sec soft" aria-labelledby="svd-o"><div className="wrap"><h2 className="t" id="svd-o">{l.other}</h2><Services items={others} lang={lang}/></div></section>}</>)}
