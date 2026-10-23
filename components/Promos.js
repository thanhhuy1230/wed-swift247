'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
import Link from 'next/link';
import {TicketPercent,Copy,Check,CalendarClock,X,ArrowRight,Link2,Flame,CircleCheck,Clock3} from 'lucide-react';
import {D} from '@/lib/dict';import {track} from '@/lib/ga';import {imgList} from '@/lib/promo';

// ===== Mục Khuyến mãi =====
// • Thẻ voucher dạng vé (cuống giá trị + đường răng cưa) – sao chép mã ngay trên thẻ.
// • "Xem chi tiết" mở hộp thoại <dialog> (Esc/nút Đóng/bấm nền để đóng). Mỗi ưu đãi có địa chỉ riêng #km-<mã>
//   → gửi link cho khách là mở thẳng chi tiết ưu đãi đó.
// • Trang chủ hiện tối đa `limit` thẻ + nút "Xem tất cả khuyến mãi" dẫn sang /khuyen-mai.

function useCopy(){const [c,setC]=useState('');
 const copy=async(text,id,meta)=>{try{await navigator.clipboard.writeText(text);setC(id);setTimeout(()=>setC(x=>x===id?'':x),1800);if(meta)track('select_promotion',meta)}catch{}};
 return [c,copy]}

function Card({x,t,onOpen,copied,copy}){const img=imgList(x)[0],end=x.status==='ended';
 return(<article className={'pc'+(end?' end':'')} aria-labelledby={x.id+'-t'}>
  <div className="pc-m">{img&&<img src={img} alt="" loading="lazy" decoding="async" width="640" height="273"/>}
   {x.big&&<b className="pc-v">{x.big}</b>}
   {end?<span className="pc-f off">{t.promoEnded}</span>:x.ending&&<span className="pc-f"><Flame size={13}/>{t.promoSoon}</span>}</div>
  <div className="pc-b">
   {x.kicker&&<p className="pc-k">{x.kicker}</p>}
   <h3 id={x.id+'-t'}>{x.title}</h3>
   {x.terms&&<p className="pc-d">{x.terms}</p>}
   <div className="pc-meta">{x.expiry&&<span><CalendarClock size={14}/>{t.vExp} {x.expiry}</span>}{!end&&x.left!=null&&<span className={'pc-l'+(x.ending?' hot':'')}><Clock3 size={14}/>{t.promoLeft(x.left)}</span>}</div>
   <div className="pc-a">
    {x.code&&<button type="button" className="pc-code" disabled={end} onClick={()=>copy(x.code,x.id,{promotion_id:x.code,promotion_name:x.title,creative_slot:'promo_card'})} aria-label={t.copyCode+' '+x.code}>
     <span>{x.code}</span>{copied===x.id?<Check size={15}/>:<Copy size={15}/>}</button>}
    <button type="button" className="pc-more" onClick={()=>onOpen(x)} aria-haspopup="dialog">{t.promoDetail}<ArrowRight size={15}/></button>
   </div>
  </div></article>)}

function Detail({x,t,info,onClose,copied,copy}){const ref=useRef(null),img=imgList(x)[0],end=x.status==='ended';
 useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal?.();return()=>{try{d?.close()}catch{}}},[]);
 const link=()=>copy(location.origin+location.pathname+location.search+'#'+x.id,'link-'+x.id);
 return(<dialog ref={ref} className="pd" aria-labelledby="pd-t" onClose={onClose} onClick={e=>{if(e.target===ref.current)ref.current.close()}}>
  <div className="pd-in">
   <button type="button" className="pd-x" onClick={()=>ref.current.close()} aria-label={t.promoClose}><X size={20}/></button>
   <div className="pd-h">{img&&<img src={img} alt={x.alt||''} width="960" height="410"/>}
    <div className="pd-ht"><p className="badge b-v"><TicketPercent size={15}/><span>{t.vBadge}</span>{x.kicker&&<><i aria-hidden="true"/>{x.kicker}</>}</p>
     <h2 id="pd-t">{x.title}</h2></div>
    {x.big&&<b className="pd-v">{x.big}</b>}</div>
   <div className="pd-b">
    {x.code&&<div className="pd-code"><div><small>{t.vCode}</small><b>{x.code}</b></div>
     <button type="button" className="pill" disabled={end} onClick={()=>copy(x.code,x.id,{promotion_id:x.code,promotion_name:x.title,creative_slot:'promo_detail'})}>{copied===x.id?<><Check size={16}/>{t.copied}</>:<><Copy size={16}/>{t.copyCode}</>}</button></div>}
    <dl className="pd-dt">
     {x.start&&<div><dt>{t.promoFrom}</dt><dd>{x.start}</dd></div>}
     {x.expiry&&<div><dt>{t.vExp}</dt><dd>{x.expiry}{end?<em className="off">{t.promoEnded}</em>:x.left!=null&&<em className={x.ending?'hot':''}>{t.promoLeft(x.left)}</em>}</dd></div>}
    </dl>
    {x.terms&&<section><h3>{t.promoTerms}</h3><p>{x.terms}</p></section>}
    {x.points?.length>0&&<section><h3>{t.promoHow}</h3><ul className="pd-pts">{x.points.map((p,k)=><li key={k}><CircleCheck size={17}/>{p}</li>)}</ul></section>}
   </div>
   <div className="pd-f">
    {!end&&<a className="pill" href={x.btnHref||info.bookingUrl||'#'} onClick={()=>ref.current?.close()} data-ga="select_promotion" data-ga-label={x.code||x.title}>{x.btn||t.promoUse}<ArrowRight size={16}/></a>}
    <button type="button" className="pill alt" onClick={link}>{copied==='link-'+x.id?<><Check size={16}/>{t.copied}</>:<><Link2 size={16}/>{t.promoShare}</>}</button>
   </div>
  </div></dialog>)}

export default function Promos({items=[],info,lang='vi',limit=0,ended=[],filter=false}){
 const t=D[lang]||D.vi,[open,setOpen]=useState(null),[copied,copy]=useCopy(),[f,setF]=useState('all');
 const every=[...items,...ended];
 const show=useCallback(x=>{setOpen(x);if(history.replaceState)history.replaceState(null,'','#'+x.id);track('view_promotion',{promotion_id:x.code||x.id,promotion_name:x.title})},[]);
 const close=useCallback(()=>{setOpen(null);if(/^#km-/.test(location.hash)&&history.replaceState)history.replaceState(null,'',location.pathname+location.search)},[]);
 // mở thẳng chi tiết khi URL có #km-...
 useEffect(()=>{const h=()=>{const x=every.find(p=>'#'+p.id===location.hash);if(x)setOpen(x)};h();addEventListener('hashchange',h);return()=>removeEventListener('hashchange',h)},[every.length]);// eslint-disable-line
 let list=f==='soon'?items.filter(x=>x.ending):items;
 const more=limit>0&&list.length>limit;if(limit>0)list=list.slice(0,limit);
 const soonN=items.filter(x=>x.ending).length;
 return(<>
  {filter&&items.length>0&&soonN>0&&<div className="cats pf-f" role="group">{[['all',t.promoFAll,items.length],['soon',t.promoSoon,soonN]].map(([k,l,n])=><button key={k} type="button" className={f===k?'on':''} aria-pressed={f===k} onClick={()=>setF(k)}>{l} <em>{n}</em></button>)}</div>}
  {list.length?<div className="pcs rv-s">{list.map(x=><Card key={x.id} x={x} t={t} onOpen={show} copied={copied} copy={copy}/>)}</div>:<p className="meta pc-none">{t.promoNone}</p>}
  {limit>0&&(more||items.length>0)&&<div className="pc-all"><Link className="pill" href="/khuyen-mai">{t.promoAll(items.length)}<ArrowRight size={16}/></Link></div>}
  {ended.length>0&&<><h2 className="pc-eh">{t.promoEndedH}</h2><div className="pcs">{ended.map(x=><Card key={x.id} x={x} t={t} onOpen={show} copied={copied} copy={copy}/>)}</div></>}
  {open&&<Detail key={open.id} x={open} t={t} info={info} onClose={close} copied={copied} copy={copy}/>}
 </>)}
