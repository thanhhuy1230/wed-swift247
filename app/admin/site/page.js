import {redirect} from 'next/navigation';import {isAdmin} from '@/lib/auth';import {getSite} from '@/lib/site';import {getLang} from '@/lib/lang';import {INFO,LISTS,SHARED_LISTS} from '@/lib/schema';import SiteAdmin from '@/components/SiteAdmin';import AdminNav from '@/components/AdminNav';import {all} from '@/lib/db';import {LANGS} from '@/lib/dict';import {revs,stateOf,storageStats} from '@/lib/revisions';import {cleanupDrafts} from '@/lib/actions';
export const dynamic='force-dynamic';export const metadata={robots:{index:false},title:'Cài đặt trang'};
export default function S(){if(!isAdmin())redirect('/admin/login');const lang=getLang(),s=getSite(lang);
// Dữ liệu cho mục "Dọn dẹp bản nháp": bài nháp chưa đăng (mọi ngôn ngữ), bài Public có bản nháp chờ, dung lượng
const drafts=[],pending=[];let oldRevs=0;for(const l of LANGS)for(const p of all(l)){const R=revs(l,p.id),st=stateOf(p,l),last=R[R.length-1];oldRevs+=R.filter(r=>r.rev!==(last&&last.rev)&&r.rev!==(p.pubRev||0)).length;const row={key:l+':'+p.id,l,id:p.id,title:p.title||'(chưa có tiêu đề)',updated:p.updated||p.date||'',revs:R.length};if(st.k==='draft')drafts.push(row);else if(st.k==='pending')pending.push({...row,extra:R.filter(r=>r.rev!==p.pubRev).length})}
const cleanup={drafts,pending,oldRevs,stats:storageStats()};
const info=Object.fromEntries(INFO.map(([k])=>[k,s.info[k]||'']));
const vi=getSite('vi'),lists=Object.fromEntries(LISTS.map(([k])=>[k,(SHARED_LISTS.has(k)?vi[k]:s[k])||[]]));
return(<div className="adm wrap wide"><AdminNav cur="site"/><div className="bar" style={{margin:'14px 0'}}><h2 style={{margin:0}}>Cài đặt giao diện &amp; nội dung</h2><a href="/api/backup" className="btn g">⬇ Tải bản sao lưu (JSON)</a></div>
<SiteAdmin key={lang} lang={lang} info={info} lists={lists} cleanup={cleanup} cleanupAction={cleanupDrafts}/></div>)}
