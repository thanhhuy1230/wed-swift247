'use client';import {useEffect,useRef,useState} from 'react';import {Phone} from 'lucide-react';
// Nút gọi + Zalo nổi ở góc màn hình. Nhấn giữ rồi kéo để dời chỗ (máy tính & điện thoại); vị trí được nhớ trên máy người xem.
// Bấm bình thường (không kéo) vẫn gọi điện / mở Zalo như cũ. Trang quản trị mặc định đặt cao hơn để không che thanh nút lưu.
const KEY='fabPos',M=8;
export default function Fabs({zalo,hotline,zaloLabel,callLabel,admin}){
 const ref=useRef(null),st=useRef(null),moved=useRef(false),[pos,setPos]=useState(null),[drag,setDrag]=useState(false);
 const k=KEY+(admin?'Adm':'');
 const clamp=p=>{const el=ref.current;if(!el||!p)return p;const w=el.offsetWidth,h=el.offsetHeight;
  return{x:Math.min(Math.max(M,p.x),innerWidth-w-M),y:Math.min(Math.max(M,p.y),innerHeight-h-M)}};
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem(k)||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))setPos(clamp(p))}catch{}
  const r=()=>setPos(p=>clamp(p));addEventListener('resize',r);return()=>removeEventListener('resize',r)},[k]);
 // Theo dõi chuột/ngón tay trên toàn cửa sổ trong lúc kéo (con trỏ có thể rời khỏi nút khi kéo nhanh)
 const down=e=>{if(e.button!==undefined&&e.button!==0)return;const r=ref.current.getBoundingClientRect();
  st.current={sx:e.clientX,sy:e.clientY,x:innerWidth-r.right,y:innerHeight-r.bottom};moved.current=false;
  const mv=ev=>{const s=st.current;if(!s)return;const dx=ev.clientX-s.sx,dy=ev.clientY-s.sy;
   if(!moved.current&&Math.hypot(dx,dy)<6)return;if(!moved.current){moved.current=true;setDrag(true)}
   ev.preventDefault();setPos(clamp({x:s.x-dx,y:s.y-dy}))};
  const upf=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',upf);removeEventListener('pointercancel',upf);
   st.current=null;setDrag(false);if(moved.current)setPos(p=>{try{localStorage.setItem(k,JSON.stringify(p))}catch{}return p})};
  addEventListener('pointermove',mv,{passive:false});addEventListener('pointerup',upf);addEventListener('pointercancel',upf)};
 // sau khi kéo thì không mở link
 const click=e=>{if(moved.current){e.preventDefault();e.stopPropagation();moved.current=false}};
 // nhấp đúp vào khoảng trống quanh nút → về vị trí mặc định
 const reset=()=>{setPos(null);try{localStorage.removeItem(k)}catch{}};
 if(!zalo&&!hotline)return null;
 const style=pos?{'--fx':pos.x+'px','--fy':pos.y+'px'}:undefined;
 return(<div ref={ref} className={'fabs'+(drag?' drag':'')+(admin?' adm':'')} style={style} onPointerDown={down} onDragStart={e=>e.preventDefault()} onClickCapture={click} onDoubleClick={e=>{if(e.target===ref.current)reset()}}>
  {hotline&&<a className="fab" href={`tel:${hotline.replace(/\s/g,'')}`} aria-label={callLabel} draggable={false}><Phone/></a>}
  {zalo&&<a className="fab z" href={`https://zalo.me/${zalo.replace(/\D/g,'')}`} target="_blank" rel="noopener" aria-label={zaloLabel} draggable={false}>Zalo</a>}
  {admin&&<span className="fabs-tip" aria-hidden="true">Giữ và kéo để di chuyển</span>}
 </div>)}
