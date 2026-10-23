import './globals.css';import Script from 'next/script';import Header from '@/components/Header';import Footer from '@/components/Footer';import Anim from '@/components/Anim';import GaEvents from '@/components/GaEvents';import Fabs from '@/components/Fabs';import {headers} from 'next/headers';import {SITE} from '@/lib/db';import {getSite} from '@/lib/site';import {getLang} from '@/lib/lang';import {D,OG_LOCALE,LANGS,HREFLANG} from '@/lib/dict';import {langAlternates} from '@/lib/i18n';import {activeLangs} from '@/lib/langs';import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
const gaOk=v=>/^G-[A-Z0-9]{4,16}$/i.test(String(v||'').trim())?String(v).trim().toUpperCase():'';
const hex=(v,d)=>/^#[0-9a-f]{3,8}$/i.test(String(v||''))?v:d;
// Icon website (favicon): Quản trị → Thông tin chung → “Icon website / favicon”. Để trống = icon mặc định /brand/favicon.svg.
// Thêm ?v=… theo đường dẫn ảnh để trình duyệt không giữ icon cũ trong bộ nhớ đệm.
const favicons=u=>{const f=String(u||'').trim()||'/brand/favicon.svg',v=f+(f.includes('?')?'&':'?')+'v='+Math.abs([...f].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7)).toString(36),raster=!/\.svg(\?|$)/i.test(f);
 return{icon:[{url:v}],shortcut:[{url:v}],...(raster?{apple:[{url:v}]}:{})}};
export function generateMetadata(){const lang=getLang(),{info:i}=getSite(lang);const img=i.ogImage?[{url:i.ogImage,width:1200,height:630,alt:i.name}]:[];
 const ver={};if(i.gscVerify)ver.google=i.gscVerify;if(i.bingVerify)ver.other={'msvalidate.01':i.bingVerify};
 return{metadataBase:new URL(SITE),title:{default:`${i.name} - ${i.tagline}`,template:`%s | ${i.name}`},description:i.seoDesc,applicationName:i.name,
  openGraph:{type:'website',siteName:i.name,title:`${i.name} - ${i.tagline}`,description:i.seoDesc,locale:OG_LOCALE[lang],alternateLocale:activeLangs().filter(l=>l!==lang).map(l=>OG_LOCALE[l]),images:img},
  twitter:{card:'summary_large_image',title:`${i.name} - ${i.tagline}`,description:i.seoDesc,images:img.map(x=>x.url)},
  icons:favicons(i.favicon),robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1}},formatDetection:{telephone:false},verification:ver}}
export const viewport={themeColor:'#a82a8a',width:'device-width',initialScale:1};
export default function L({children}){const H=headers(),xl=H.get('x-lang'),xp=H.get('x-path')||'/',ON=activeLangs();
// Link ?hl=xx của ngôn ngữ đã TẮT → chuyển về bản tiếng Việt (giữ các tham số khác) để không có trang trùng lặp
if(xl&&!xp.startsWith('/admin')&&!ON.includes(xl)){const q=new URLSearchParams(H.get('x-search')||'');q.delete('hl');const s=q.toString();redirect(xp+(s?'?'+s:''))}
const lang=getLang(),t=D[lang],s=getSite(lang),i=s.info,GA=gaOk(i.gaId)||gaOk(process.env.NEXT_PUBLIC_GA_ID),home=headers().get('x-path')==='/',ha=home&&langAlternates('/',lang);
// GA4: Consent Mode v2 (chỉ đo lường, không quảng cáo), gắn ngôn ngữ trang để lọc báo cáo theo VI/EN/JA/KO/ZH. Chuyển trang SPA được GA4 tự ghi nhận (enhanced measurement – lịch sử trình duyệt).
const gaInit=`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('set','user_properties',{site_language:'${lang}'});gtag('config','${GA}',{site_language:'${lang}',content_group:location.pathname==='/'?'home':location.pathname.split('/')[1]});`;
return(<html lang={HREFLANG[lang]||lang} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('th');if(t)document.documentElement.dataset.theme=t}catch(e){}var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion:reduce)').matches){d.classList.add('ja');setTimeout(function(){if(!d.classList.contains('anim-ready'))d.classList.remove('ja')},3500)}"}}/><style>{`:root{--p:${hex(i.colorP,'#a82a8a')};--s:${hex(i.colorS,'#e8553d')}}`}</style>
{ha&&<><link rel="canonical" href={ha.canonical}/>{Object.entries(ha.languages).map(([k,u])=><link key={k} rel="alternate" hrefLang={k} href={u}/>)}<meta property="og:url" content={ha.canonical}/></>}
{GA&&<link rel="preconnect" href="https://www.googletagmanager.com"/>}</head><body>
{GA&&<><Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive"/><Script id="ga" strategy="afterInteractive">{gaInit}</Script><GaEvents/></>}
{i.announce&&(i.announceUrl?<a className="ann" href={i.announceUrl}>{i.announce}</a>:<div className="ann">{i.announce}</div>)}<Anim/><Header info={i} menu={s.menu} lang={lang} langs={ON}/>{children}<Footer s={s} lang={lang}/><Fabs zalo={i.zalo} hotline={i.hotline} zaloLabel={t.zalo} callLabel={t.callHotline} admin={xp.startsWith('/admin')}/></body></html>)}
