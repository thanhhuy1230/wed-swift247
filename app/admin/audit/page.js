import {redirect} from 'next/navigation';import {isAdmin} from '@/lib/auth';import {getLang} from '@/lib/lang';import {all,catList} from '@/lib/db';import {LANGS,LANG_NAME,LANG_SHORT} from '@/lib/dict';import {auditPosts,checkGroups} from '@/lib/audit';import AdminNav from '@/components/AdminNav';import AuditTable from '@/components/AuditTable';
export const dynamic='force-dynamic';export const metadata={robots:{index:false},title:'Rà soát bài viết'};
// ===== Rà soát bài viết: thống kê tổng, lọc bài thiếu nội dung, phân loại theo chuyên mục, tìm kiếm theo từng phần bài =====
export default function Audit(){if(!isAdmin())redirect('/admin/login');const lang=getLang(),{rows,checks}=auditPosts(lang),C=catList(lang);
 const byLang=LANGS.map(l=>{const a=all(l);return{l,n:a.length,pub:a.filter(p=>p.status==='published').length}});
 return(<div className="adm wrap wide"><AdminNav cur="audit"/>
  <div className="bar" style={{margin:'14px 0 6px'}}><h2 style={{margin:0}}>Rà soát bài viết – {LANG_NAME[lang]}</h2><a href="/admin/site#postChecks" className="btn g">⚙ Sửa mục kiểm tra & chuyên mục</a></div>
  <div className="au-lg" aria-label="Số bài theo ngôn ngữ">{byLang.map(x=><span key={x.l} className={x.l===lang?'on':''}><b>{LANG_SHORT[x.l]}</b> {x.n} bài · {x.pub} đã đăng</span>)}</div>
  <AuditTable rows={rows} cats={C} issues={checks.map(c=>[c.id,c.label,c.group,c.type])} groups={checkGroups(checks)} langShort={LANG_SHORT}/>
 </div>)}
