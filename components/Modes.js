'use client';import {useState,useEffect,useId} from 'react';import Icon from './Icon';import {Check,ArrowRight} from 'lucide-react';
// 4 hình thức giao nhận: rê chuột / chạm / bàn phím → bảng chi tiết bên phải đổi theo (máy tính);
// trên điện thoại chi tiết mở ngay bên dưới thẻ đang chọn (dạng xổ xuống). Tự chuyển lần lượt khi khách chưa tương tác.
function Detail({m,bookingUrl,label}){const pts=String(m.points||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 return(<><div className="md-h"><span className="md-i"><Icon name={m.icon} size={26}/></span><div><b>{m.title}</b><small>{m.text}</small></div></div>
  {m.detail&&<p className="md-p">{m.detail}</p>}
  {pts.length>0&&<ul className="md-l">{pts.map((x,k)=><li key={k}><Check size={15}/>{x}</li>)}</ul>}
  {bookingUrl&&<a className="md-a" href={bookingUrl} data-ga="begin_booking" data-ga-label={m.title} data-ga-location="delivery_options">{label} <ArrowRight size={15}/></a>}</>)}
export default function Modes({items=[],bookingUrl,label,title,hint}){const [a,setA]=useState(0),[h,setH]=useState(false),uid=useId();
 useEffect(()=>{if(h||items.length<2||matchMedia('(prefers-reduced-motion:reduce)').matches)return;const x=setInterval(()=>setA(v=>(v+1)%items.length),4200);return()=>clearInterval(x)},[h,items.length]);
 const m=items[a]||{};
 return(<div className="mds" onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
  <div className="mds-l">{title&&<h3 className="mds-t">{title}</h3>}{hint&&<p className="mds-hint">{hint}</p>}
   <ul className="modes" role="tablist" aria-orientation="vertical">{items.map((x,k)=><li key={k}>
    <button type="button" role="tab" id={uid+'t'+k} aria-selected={k===a} aria-controls={uid+'p'} className={k===a?'on':''} onMouseEnter={()=>setA(k)} onFocus={()=>{setH(true);setA(k)}} onClick={()=>{setH(true);setA(k)}}>
     <span className="mi"><Icon name={x.icon} size={26}/></span><span className="mt"><b>{x.title}</b><small>{x.text}</small></span></button>
    {k===a&&(x.detail||x.points)&&<div className="md md-in">{/* chi tiết dạng xổ xuống – chỉ hiện trên điện thoại */}<Detail m={x} bookingUrl={bookingUrl} label={label}/></div>}</li>)}</ul></div>
  {(m.detail||m.points)&&<div className="md md-side" role="tabpanel" id={uid+'p'} aria-labelledby={uid+'t'+a} key={a}><Detail m={m} bookingUrl={bookingUrl} label={label}/></div>}
 </div>)}
