'use client';
import {useState,useMemo,useRef} from 'react';import {Play,Search,X,ListVideo} from 'lucide-react';import {D} from '@/lib/dict';import {ytId} from '@/lib/yt';import {track} from '@/lib/ga';
// ===== Thư viện video: trình phát bên trái + danh sách & ô tìm kiếm bên phải =====
// • Tìm có dấu hoặc không dấu, theo tiêu đề và mô tả. Enter = phát kết quả đầu tiên.
// • Chỉ tải iframe YouTube khi khách bấm phát (nhẹ trang, tốt cho tốc độ/SEO).
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
export default function Videos({items=[],lang='vi'}){
 const t=D[lang]||D.vi,[i,setI]=useState(0),[on,setOn]=useState(false),[q,setQ]=useState(''),box=useRef(null);
 const list=useMemo(()=>{const k=norm(q).trim().split(/\s+/).filter(Boolean);return items.map((x,n)=>({...x,n})).filter(x=>!k.length||k.every(w=>norm(x.title+' '+(x.desc||'')).includes(w)))},[items,q]);
 const v=items[i];if(!v)return null;const vid=ytId(v.url);
 const play=x=>track('video_start',{video_title:x.title,video_url:x.url,video_provider:'youtube'});
 const pick=n=>{setI(n);setOn(true);play(items[n]);box.current?.scrollIntoView({behavior:'smooth',block:'nearest'})};
 return(<div className="vl">
  <div className="vl-main" ref={box}>
   <div className="player">{on?<iframe src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`} allow="autoplay;encrypted-media;fullscreen;picture-in-picture" allowFullScreen title={v.title}/>
    :<button type="button" onClick={()=>{setOn(true);play(v)}} aria-label={t.play+': '+v.title}><img src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`} alt={v.title} width="480" height="360" loading="lazy" decoding="async"/><span className="pl-b"><Play size={30} fill="#fff"/></span></button>}</div>
   <h3>{v.title}</h3>{v.desc&&<p className="vl-d">{v.desc}</p>}
  </div>
  <aside className="vl-side" aria-label={t.vList}>
   <div className="vl-h"><ListVideo size={18}/><b>{t.vList}</b><em>{q?`${list.length}/${items.length}`:items.length}</em></div>
   <form className="vl-s" role="search" onSubmit={e=>{e.preventDefault();if(q.trim())track('search',{search_term:q.trim().slice(0,80),search_type:'video'});if(list[0])pick(list[0].n)}}>
    <Search size={17} aria-hidden="true"/>
    <input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder={t.vSearch} aria-label={t.vSearch} enterKeyHint="search"/>
    {q&&<button type="button" onClick={()=>setQ('')} aria-label={t.vClear}><X size={16}/></button>}
   </form>
   <ol className="vl-l">
    {list.map(x=><li key={x.n}><button type="button" className={x.n===i?'on':''} aria-current={x.n===i?'true':undefined} onClick={()=>pick(x.n)}>
     <span className="vl-th"><img src={`https://i.ytimg.com/vi/${ytId(x.url)}/mqdefault.jpg`} alt="" width="320" height="180" loading="lazy" decoding="async"/>{x.n===i&&<i>{on?t.vNow:t.vSel}</i>}</span>
     <span className="vl-t">{x.title}</span></button></li>)}
    {!list.length&&<li className="vl-0">{t.vNone(q)} <button type="button" onClick={()=>setQ('')}>{t.vClear}</button></li>}
   </ol>
  </aside></div>)}
