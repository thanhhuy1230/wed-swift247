'use client';import {useState,useEffect,useMemo} from 'react';
import {INFO,LISTS,INFO_GROUPS,SHARED,POST_SECTIONS,SHARED_LISTS} from '@/lib/schema';import {DEFAULT_CHECKS} from '@/lib/checks';import DraftCleanup from './DraftCleanup';import {saveSection} from '@/lib/actions';import {LANG_NAME} from '@/lib/dict';
import Field from './Field';import ListEditor from './ListEditor';import HeroLayoutEditor from './HeroLayoutEditor';import {Save,Check,AlertTriangle,Loader2,LayoutTemplate,CornerUpLeft} from 'lucide-react';

// Trang Cài đặt: danh sách mục bên trái – bấm vào thì nội dung hiện bên phải – mỗi mục có nút Lưu riêng.
// Mọi chỉnh sửa/thêm/xóa chỉ áp dụng cho ngôn ngữ đang chọn (lang).
const META=Object.fromEntries(INFO.map(([k,l,t])=>[k,{l,t}]));
const SECTIONS=[
 ...INFO_GROUPS.filter(([k])=>!POST_SECTIONS.has(k)&&k!=='heroLayout'&&k!=='authBox').map(([k,l,keys])=>({k,l,type:'info',keys,grp:'Cài đặt chung'})),
 // Bố cục banner kéo – thả: đứng đầu nhóm "Nội dung trang chủ"
 ...INFO_GROUPS.filter(([k])=>k==='heroLayout').map(([k,l,keys])=>({k,l,type:'info',keys,grp:'Nội dung trang chủ',layout:true})),
 // Khung tra cứu / đăng nhập – đăng ký trên banner
 ...INFO_GROUPS.filter(([k])=>k==='authBox').map(([k,l,keys])=>({k,l,type:'info',keys,grp:'Nội dung trang chủ'})),
 ...LISTS.filter(([k])=>!POST_SECTIONS.has(k)).map(([k,l,fields])=>({k,l,type:'list',fields,grp:'Nội dung trang chủ'})),
 // Nhóm "Bài viết & tin tức": cấu hình trang Tin tức / trang bài viết + quản lý chuyên mục
 ...INFO_GROUPS.filter(([k])=>POST_SECTIONS.has(k)).map(([k,l,keys])=>({k,l,type:'info',keys,grp:'Bài viết & tin tức'})),
 ...LISTS.filter(([k])=>POST_SECTIONS.has(k)).map(([k,l,fields])=>({k,l,type:'list',fields,grp:'Bài viết & tin tức'})),
 {k:'drafts',l:'Dọn dẹp bản nháp & phiên bản',type:'custom',grp:'Bài viết & tin tức'}];
const snap=(s,v)=>s.type==='custom'?'':s.type==='info'?JSON.stringify(s.keys.map(k=>v.info[k]??'')):JSON.stringify(v.lists[s.k]||[]);

export default function SiteAdmin({lang,info,lists,cleanup,cleanupAction}){
 const [v,setV]=useState({info:{...info},lists:{...lists}});
 const [base,setBase]=useState(()=>Object.fromEntries(SECTIONS.map(s=>[s.k,snap(s,{info,lists})])));
 const [cur,setCur]=useState(SECTIONS[0].k);
 const [st,setSt]=useState({}); // trạng thái lưu theo từng mục: saving | ok | err
 const [back,setBack]=useState(null); // đến từ Bố cục banner (nhấp đúp vào ô) → hiện nút quay lại
 // Nhấp đúp vào 1 ô trong Bố cục banner → mở đúng mục cài đặt, cuộn tới ô nhập và tô sáng
 const jump=(k,fid)=>{if(!SECTIONS.some(x=>x.k===k))return;setBack(cur);setCur(k);history.pushState(null,'','#'+k);
  let n=0;const f=()=>{const el=document.getElementById(fid)||document.getElementById(fid.replace(/-[^-]+$/,''));if(!el){if(n++<20)setTimeout(f,60);return}
   el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
   const i=el.matches('input,textarea,select')?el:el.querySelector('input:not([type=file]):not([type=checkbox]),textarea,select');i&&setTimeout(()=>i.focus({preventScroll:true}),350);
   setTimeout(()=>el.classList.remove('flash'),2600)};setTimeout(f,40)};
 // Mở đúng mục khi có #ten-muc trên URL (vd /admin/site#postChecks từ trang Rà soát)
 useEffect(()=>{const h=()=>{const k=decodeURIComponent(location.hash.slice(1));if(SECTIONS.some(x=>x.k===k))setCur(k)};h();addEventListener('hashchange',h);return()=>removeEventListener('hashchange',h)},[]);
 const s=SECTIONS.find(x=>x.k===cur);
 const dirty=useMemo(()=>Object.fromEntries(SECTIONS.map(x=>[x.k,snap(x,v)!==base[x.k]])),[v,base]);
 const anyDirty=Object.values(dirty).some(Boolean);

 useEffect(()=>{if(!anyDirty)return;const h=e=>{e.preventDefault();e.returnValue=''};addEventListener('beforeunload',h);return()=>removeEventListener('beforeunload',h)},[anyDirty]);
 const setInfo=(k,x)=>setV(p=>({...p,info:{...p.info,[k]:x}}));
 const setList=(k,rows)=>setV(p=>({...p,lists:{...p.lists,[k]:rows}}));
 const flag=(k,x)=>setSt(p=>({...p,[k]:x}));

 async function save(sec){
  flag(sec.k,'saving');
  try{
   const data=sec.type==='info'?Object.fromEntries(sec.keys.map(k=>[k,v.info[k]??''])):(v.lists[sec.k]||[]);
   const r=await saveSection(lang,sec.type,sec.k,data);
   if(!r?.ok)throw 0;
   // đồng bộ lại đúng dữ liệu máy chủ đã lưu (đã bỏ dòng trống)
   const nv=sec.type==='info'?{...v,info:{...v.info,...r.data}}:{...v,lists:{...v.lists,[sec.k]:r.data}};
   setV(nv);setBase(b=>({...b,[sec.k]:snap(sec,nv)}));flag(sec.k,'ok');setTimeout(()=>setSt(p=>p[sec.k]==='ok'?{...p,[sec.k]:''}:p),3500);
  }catch{flag(sec.k,'err')}
 }

 const groups=[...new Set(SECTIONS.map(x=>x.grp))];
 const stt=st[cur];
 return(<div className="sa">
  <nav className="sa-l" aria-label="Các mục cài đặt">
   {groups.map(g=><div key={g}><div className="sa-h">{g}</div>{SECTIONS.filter(x=>x.grp===g).map(x=>(
    <button key={x.k} type="button" className={'sa-i'+(cur===x.k?' on':'')} aria-current={cur===x.k?'page':undefined} onClick={()=>{setCur(x.k);setBack(null);history.replaceState(null,'','#'+x.k)}}>{x.layout&&<LayoutTemplate size={15} className="sa-ic"/>}
     <span>{x.l}</span>{x.type==='list'&&<em>{(v.lists[x.k]||[]).length}</em>}{x.type==='custom'&&cleanup&&cleanup.drafts.length>0&&<em>{cleanup.drafts.length}</em>}{dirty[x.k]&&<i className="dot" title="Có thay đổi chưa lưu"/>}
    </button>))}</div>)}
  </nav>
  <section className="sa-r" key={cur} aria-label={s.l}>
   <header className="sa-t"><h3>{s.l}</h3><span className="lb">{LANG_NAME[lang]}</span></header>
   {back&&back!==cur&&<button type="button" className="sa-back" onClick={()=>{const b=back;setBack(null);setCur(b);history.replaceState(null,'','#'+b)}}><CornerUpLeft size={16}/> Quay lại {SECTIONS.find(x=>x.k===back)?.l}</button>}
   {s.grp==='Bài viết & tin tức'&&<p className="sa-tip">Quản lý bài viết: <a href="/admin">Danh sách bài viết</a> · <a href="/admin/audit">Rà soát bài viết</a> (thống kê, lọc bài thiếu nội dung, tìm kiếm theo chuyên mục / từng phần bài).</p>}
   {s.type==='custom'?<DraftCleanup data={cleanup} action={cleanupAction}/>:s.layout?<HeroLayoutEditor value={v.info.heroLayout||''} onChange={x=>setInfo('heroLayout',x)} info={v.info} lists={v.lists} lang={lang} onJump={jump}/>:s.type==='info'?<div className="grid2">{s.keys.map(k=><div key={k} id={'f-'+k} className={['area','langs','imgs'].includes(META[k].t)?'span2':''}><Field label={META[k].l} type={META[k].t} value={v.info[k]??''} onChange={x=>setInfo(k,x)}/>{SHARED.has(k)&&<small className="shr">Dùng chung cho mọi ngôn ngữ</small>}</div>)}</div>
   :<>{SHARED_LISTS.has(s.k)&&<p className="sa-tip">Danh sách này <b>dùng chung cho mọi ngôn ngữ</b>. Mỗi mục hiện thành 1 nút lọc trong trang Rà soát bài viết, kèm số bài đang mắc. Đặt Trạng thái = Tắt để tạm ẩn mà không xóa. {s.k==='postChecks'&&<button type="button" className="btn g" style={{padding:'4px 10px',fontSize:13}} onClick={()=>{if(confirm('Khôi phục danh sách mục kiểm tra mặc định? (Chỉ có hiệu lực sau khi bấm Lưu)'))setList(s.k,DEFAULT_CHECKS.map(x=>({...x})))}}>Khôi phục mặc định</button>}</p>}<ListEditor name={s.k} fields={s.fields} rows={v.lists[s.k]||[]} onChange={rows=>setList(s.k,rows)} blank={s.k==='postChecks'?{on:'1',group:'Nội dung',type:'missing'}:{}}/></>}
   {s.type!=='custom'&&<div className="sa-save">
    <button type="button" className="btn" disabled={stt==='saving'} onClick={()=>save(s)}>{stt==='saving'?<><Loader2 size={16} className="spin"/> Đang lưu...</>:<><Save size={16}/> Lưu mục này</>}</button>
    <span className={'sa-m '+(stt||'')} role="status" aria-live="polite">{stt==='ok'&&<><Check size={16}/> Đã lưu ({LANG_NAME[lang]}). Tải lại trang chủ để xem.</>}{stt==='err'&&<><AlertTriangle size={16}/> Lưu không được – thử lại hoặc đăng nhập lại.</>}{!stt&&dirty[s.k]&&'Có thay đổi chưa lưu'}</span>
   </div>}
  </section>
 </div>);
}
