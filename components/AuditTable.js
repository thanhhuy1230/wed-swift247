'use client';import {useMemo,useState,useRef} from 'react';import {Search,Pencil,ExternalLink,Download,X,FileText,CheckCircle2,AlertTriangle,PenLine,Gauge} from 'lucide-react';
// Bảng rà soát (lọc tức thì phía trình duyệt): tìm theo từng phần bài · lọc chuyên mục / trạng thái / mục còn thiếu · sắp xếp · xuất CSV.
const FIELDS=[['all','Tất cả các phần'],['title','Tiêu đề'],['content','Nội dung bài'],['excerpt','Mô tả ngắn (sapo)'],['seoTitle','Tiêu đề SEO'],['seoDesc','Mô tả SEO'],['keyword','Từ khóa chính'],['slug','Đường dẫn (slug)'],['coverAlt','Alt ảnh bìa']];
const SORTS=[['new','Mới nhất'],['old','Cũ nhất'],['issues','Thiếu nhiều nhất'],['scoreAsc','Điểm tối ưu SEO thấp → cao'],['scoreDesc','Điểm tối ưu SEO cao → thấp'],['words','Ít chữ nhất'],['title','Tiêu đề A → Z']];
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const grade=s=>s>=80?'good':s>=55?'warn':'bad';
const fmt=d=>d?new Date(d).toLocaleDateString('vi-VN'):'';
export default function AuditTable({rows,cats,issues,groups,langShort}){
 const CN=Object.fromEntries(cats.map(c=>[c.key,c.name])),IL=Object.fromEntries(issues.map(([k,l])=>[k,l])),IT=Object.fromEntries(issues.map(([k,,,t])=>[k,t]));
 const label=k=>IL[k]||k;
 // Bấm ô thống kê / dòng chuyên mục → tự lướt xuống phần kết quả
 const res=useRef(null),go=()=>setTimeout(()=>res.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}),60);
 const [q,setQ]=useState(''),[field,setField]=useState('all'),[cat,setCat]=useState(''),[status,setStatus]=useState(''),[miss,setMiss]=useState([]),[mode,setMode]=useState('any'),[health,setHealth]=useState(''),[sort,setSort]=useState('new');
 const toggle=k=>setMiss(m=>m.includes(k)?m.filter(x=>x!==k):[...m,k]);
 const reset=()=>{setQ('');setField('all');setCat('');setStatus('');setMiss([]);setHealth('');setSort('new')};
 // Thống kê tổng (không phụ thuộc bộ lọc)
 const S=useMemo(()=>{const n=rows.length,pub=rows.filter(r=>r.status==='published').length,ok=rows.filter(r=>!r.issues.length).length,avg=n?Math.round(rows.reduce((a,r)=>a+r.score,0)/n):0,
  cnt=Object.fromEntries(issues.map(([k])=>[k,rows.filter(r=>r.issues.includes(k)).length])),
  byCat=[...cats.map(c=>c.key),...[...new Set(rows.map(r=>r.cat))].filter(k=>!CN[k])].map(k=>{const a=rows.filter(r=>r.cat===k);return{k,name:CN[k]||`(không hợp lệ: ${k||'trống'})`,n:a.length,pub:a.filter(r=>r.status==='published').length,ok:a.filter(r=>!r.issues.length).length,avg:a.length?Math.round(a.reduce((x,r)=>x+r.score,0)/a.length):0}});
  return{n,pub,draft:n-pub,ok,need:n-ok,avg,cnt,byCat}},[rows]);
 const list=useMemo(()=>{const ks=norm(q).split(/\s+/).filter(Boolean);
  let a=rows.filter(r=>{if(cat&&r.cat!==cat)return false;if(status==='noindex'?!r.noindex:status&&r.status!==status)return false;
   if(health==='ok'&&r.issues.length)return false;if(health==='need'&&!r.issues.length)return false;
   if(miss.length&&!(mode==='all'?miss.every(k=>r.issues.includes(k)):miss.some(k=>r.issues.includes(k))))return false;
   if(ks.length){const h=norm(field==='all'?Object.values(r.f).join(' '):r.f[field]);if(!ks.every(k=>h.includes(k)))return false}return true});
  const by={new:(x,y)=>y.date.localeCompare(x.date),old:(x,y)=>x.date.localeCompare(y.date),issues:(x,y)=>y.issues.length-x.issues.length,scoreAsc:(x,y)=>x.score-y.score,scoreDesc:(x,y)=>y.score-x.score,words:(x,y)=>x.words-y.words,title:(x,y)=>x.title.localeCompare(y.title,'vi')}[sort];
  return [...a].sort(by)},[rows,q,field,cat,status,miss,mode,health,sort]);
 // Đoạn trích quanh từ khóa tìm thấy (khi tìm trong nội dung/sapo/...)
 const snip=r=>{if(!q.trim())return null;const k=norm(q.trim().split(/\s+/)[0]),src=field==='all'?(['content','excerpt','seoDesc','seoTitle','keyword','coverAlt'].map(x=>r.f[x]).find(v=>norm(v).includes(k))||''):r.f[field];if(!src||field==='title')return null;const i=norm(src).indexOf(k);if(i<0)return null;const s=Math.max(0,i-50);return(s?'…':'')+src.slice(s,i+k.length+70)+'…'};
 function csv(){const H=['Tiêu đề','Chuyên mục','Trạng thái','Ngày đăng','Số từ','Số ảnh','Điểm SEO','Số mục thiếu','Các mục thiếu','Chưa dịch','Đường dẫn'];
  const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const body=list.map(r=>[r.title,CN[r.cat]||r.cat,r.status==='published'?'Đã đăng':'Nháp',fmt(r.date),r.words,r.imgs,r.score,r.issues.length,r.issues.map(label).join('; '),r.missLangs.map(l=>langShort[l]).join(' '),'/post/'+r.slug].map(esc).join(','));
  const b=new Blob(['\ufeff'+[H.map(esc).join(','),...body].join('\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='ra-soat-bai-viet.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 const active=q||cat||status||miss.length||health;
 const Card=({icon,n,l,cls,on,onClick})=><button type="button" className={'au-c '+(cls||'')+(on?' on':'')} onClick={()=>{onClick();go()}}>{icon}<b>{n}</b><span>{l}</span></button>;
 return(<div className="au">
  <div className="au-cards">
   <Card icon={<FileText size={20}/>} n={S.n} l="Tổng số bài" on={!active} onClick={reset}/>
   <Card icon={<CheckCircle2 size={20}/>} n={S.pub} l="Đã đăng" cls="good" on={status==='published'} onClick={()=>setStatus(status==='published'?'':'published')}/>
   <Card icon={<PenLine size={20}/>} n={S.draft} l="Bản nháp" on={status==='draft'} onClick={()=>setStatus(status==='draft'?'':'draft')}/>
   <Card icon={<CheckCircle2 size={20}/>} n={S.ok} l="Đầy đủ, không thiếu gì" cls="good" on={health==='ok'} onClick={()=>setHealth(health==='ok'?'':'ok')}/>
   <Card icon={<AlertTriangle size={20}/>} n={S.need} l="Cần bổ sung" cls="bad" on={health==='need'} onClick={()=>setHealth(health==='need'?'':'need')}/>
   <Card icon={<Gauge size={20}/>} n={S.avg+'/100'} l="Điểm tối ưu SEO TB" cls={grade(S.avg)} onClick={()=>setSort('scoreAsc')}/>
  </div>

  <h3 className="au-h">Phân loại theo chuyên mục</h3>
  <div className="tw"><table className="au-cat"><thead><tr><th>Chuyên mục</th><th>Tổng</th><th>Đã đăng</th><th>Nháp</th><th>Đầy đủ</th><th>Cần bổ sung</th><th>Tối ưu SEO TB</th></tr></thead>
   <tbody>{S.byCat.map(c=><tr key={c.k} className={cat===c.k?'on':''} onClick={()=>{setCat(cat===c.k?'':c.k);go()}} style={{cursor:'pointer'}} title="Bấm để lọc theo chuyên mục"><td><b>{c.name}</b></td><td>{c.n}</td><td>{c.pub}</td><td>{c.n-c.pub}</td><td>{c.ok}</td><td>{c.n-c.ok}</td><td>{c.n?<span className={'chip '+grade(c.avg)}>{c.avg}</span>:'–'}</td></tr>)}</tbody></table></div>

  <h3 className="au-h">Bài viết còn thiếu <small>– bấm để lọc, chọn được nhiều mục · <a href="/admin/site#postChecks">thêm / sửa / xóa mục kiểm tra</a></small></h3>{!issues.length&&<p className="meta">Chưa có mục kiểm tra nào đang bật – thêm ở Cài đặt trang → Bài viết &amp; tin tức → Mục kiểm tra khi rà soát.</p>}
  <div className="au-miss">{groups.map(g=><div key={g} className="au-mg"><span className="au-gl">{g}</span>{issues.filter(x=>x[2]===g).map(([k])=><button key={k} type="button" className={'au-m'+(miss.includes(k)?' on':'')+(S.cnt[k]?'':' zero')} onClick={()=>toggle(k)} aria-pressed={miss.includes(k)}>{label(k)} <em>{S.cnt[k]}</em></button>)}</div>)}
   {miss.length>0&&<button type="button" className="au-go" onClick={go}>Xem {list.length} bài khớp ↓</button>}{miss.length>1&&<div className="au-mode">Khi chọn nhiều mục: <label><input type="radio" checked={mode==='any'} onChange={()=>setMode('any')}/> thiếu <b>bất kỳ</b> mục nào</label> <label><input type="radio" checked={mode==='all'} onChange={()=>setMode('all')}/> thiếu <b>tất cả</b> các mục</label></div>}</div>

  <div className="au-f">
   <div className="au-s"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm bài viết (gõ có dấu hoặc không dấu)…" aria-label="Từ khóa tìm kiếm"/>{q&&<button type="button" onClick={()=>setQ('')} aria-label="Xóa từ khóa"><X size={16}/></button>}</div>
   <label><small>Tìm trong</small><select value={field} onChange={e=>setField(e.target.value)}>{FIELDS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
   <label><small>Chuyên mục</small><select value={cat} onChange={e=>setCat(e.target.value)}><option value="">Tất cả chuyên mục</option>{S.byCat.map(c=><option key={c.k} value={c.k}>{c.name} ({c.n})</option>)}</select></label>
   <label><small>Trạng thái</small><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tất cả</option><option value="published">Đã đăng</option><option value="draft">Nháp</option><option value="noindex">Ẩn khỏi Google (noindex)</option></select></label>
   <label><small>Sắp xếp</small><select value={sort} onChange={e=>setSort(e.target.value)}>{SORTS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
  </div>
  <div className="au-r" ref={res}><span role="status" aria-live="polite">Tìm thấy <b>{list.length}</b> / {S.n} bài</span>{active&&<button type="button" className="btn g" onClick={reset}><X size={14}/> Xóa bộ lọc</button>}<button type="button" className="btn g" onClick={csv} disabled={!list.length}><Download size={14}/> Xuất Excel (CSV)</button></div>

  <div className="tw"><table className="au-t"><thead><tr><th>Bài viết</th><th>Chuyên mục</th><th>Trạng thái</th><th>Số từ</th><th>SEO</th><th>Còn thiếu</th><th></th></tr></thead><tbody>
   {list.map(r=>{const sn=snip(r);return(<tr key={r.id}>
    <td className="au-ti">{r.cover?<img src={r.cover} alt="" loading="lazy"/>:<span className="au-noimg">Không ảnh</span>}<div><b>{r.title}</b><small>{fmt(r.date)}{r.updated&&r.updated.slice(0,10)!==r.date.slice(0,10)?' · sửa '+fmt(r.updated):''} · /post/{r.slug}</small>{sn&&<small className="au-sn">{sn}</small>}</div></td>
    <td>{CN[r.cat]||<span className="chip bad">Không hợp lệ</span>}</td>
    <td>{r.status==='published'?<span className="chip good">Đã đăng</span>:<span className="chip">Nháp</span>}{r.noindex&&<span className="chip warn" title="Không cho Google lập chỉ mục">noindex</span>}</td>
    <td>{r.words}</td><td><span className={'chip '+grade(r.score)}>{r.score}</span></td>
    <td>{r.issues.length?<ul className="au-is">{r.issues.map(k=><li key={k}>{label(k)}{IT[k]==='noTrans'?': '+r.missLangs.map(l=>langShort[l]).join(', '):''}</li>)}</ul>:<span className="chip good">✓ Đầy đủ</span>}</td>
    <td className="au-a"><a className="btn" href={`/admin/edit?id=${r.id}`} title="Sửa bài"><Pencil size={14}/></a>{r.status==='published'&&<a className="btn g" href={`/post/${r.slug}`} target="_blank" rel="noopener" title="Xem bài trên website"><ExternalLink size={14}/></a>}</td>
   </tr>)})}
   {!list.length&&<tr><td colSpan="7" style={{textAlign:'center',padding:30}}>Không có bài viết nào khớp bộ lọc.</td></tr>}
  </tbody></table></div>
 </div>)}
