import Link from 'next/link';import {Search,ChevronLeft,ChevronRight} from 'lucide-react';import {published,cats,catList,norm} from '@/lib/db';import {postCfg} from '@/lib/postcfg';import {getLang} from '@/lib/lang';import {D} from '@/lib/dict';import {langAlternates} from '@/lib/i18n';import Cards from '@/components/Cards';
export const dynamic='force-dynamic';
export function generateMetadata({searchParams:s}){const lang=getLang(),t=D[lang],c=postCfg(lang),ct=s.cat&&catList(lang).find(x=>x.key===s.cat);const alt=langAlternates('/news',lang),title=s.q?t.searchTitle(s.q):ct?ct.name+' – '+(c.title||t.news):(c.title||t.news),description=(ct&&ct.desc)||c.desc||undefined;return{title,description,alternates:alt,openGraph:{url:alt.canonical,title,description},robots:s.q||s.cat||s.page?{index:false,follow:true}:undefined}}
export default function N({searchParams:sp}){const lang=getLang(),t=D[lang],C=cats(lang),cfg=postCfg(lang),PER=cfg.perPage,ct=catList(lang).find(x=>x.key===sp.cat),q=(sp.q||'').trim(),cat=sp.cat||'';let a=published(lang);
 if(cat)a=a.filter(p=>p.cat===cat);
 if(q){const ks=norm(q).split(/\s+/);a=a.filter(p=>{const h=norm(p.title+' '+p.excerpt+' '+p.content.replace(/<[^>]+>/g,' '));return ks.every(k=>h.includes(k))})}
 const pages=Math.max(1,Math.ceil(a.length/PER)),cur=Math.min(Math.max(1,+sp.page||1),pages);
 const u=o=>{const p=new URLSearchParams();if(q)p.set('q',q);if(cat)p.set('cat',cat);Object.entries(o).forEach(([k,v])=>v&&p.set(k,v));const s=p.toString();return '/news'+(s?'?'+s:'')};
 const nums=[...Array(pages)].map((_,i)=>i+1).filter(n=>n===1||n===pages||Math.abs(n-cur)<=1);
 return(<main className="wrap"><h1 className="t" style={{margin:'32px 0 18px'}}>{cfg.title||t.news}</h1>{cfg.intro&&<p className="news-intro">{cfg.intro}</p>}
 <form className="sbar" action="/news"><Search size={20}/><input name="q" defaultValue={q} placeholder={t.searchPh} aria-label={t.sr}/>{cat&&<input type="hidden" name="cat" value={cat}/>}<button className="pill sm">{t.search}</button></form>
 <div className="cats"><Link href={u({cat:''}).replace(/cat=[^&]*&?/,'')} className={!cat?'on':''}>{t.all}</Link>{Object.entries(C).map(([k,v])=><Link key={k} href={`/news?${q?`q=${encodeURIComponent(q)}&`:''}cat=${k}`} className={cat===k?'on':''}>{v}</Link>)}</div>
 {ct&&ct.desc&&<p className="news-cd">{ct.desc}</p>}<p className="meta" style={{margin:'14px 0'}}>{q?t.found(a.length,q):t.count(a.length)}</p>
 <Cards posts={a.slice((cur-1)*PER,cur*PER)} lang={lang}/>
 {pages>1&&<nav className="pg" aria-label={t.pagination}>{cur>1&&<Link href={u({page:cur-1})} aria-label={t.prevPage}><ChevronLeft size={18}/></Link>}{nums.map((n,i)=><span key={n} style={{display:'contents'}}>{i>0&&n-nums[i-1]>1&&<em>…</em>}<Link href={u({page:n>1?n:''})} className={n===cur?'on':''}>{n}</Link></span>)}{cur<pages&&<Link href={u({page:cur+1})} aria-label={t.nextPage}><ChevronRight size={18}/></Link>}</nav>}</main>)}
