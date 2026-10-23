'use client';import {useEffect} from 'react';import {usePathname} from 'next/navigation';
// ===== Hiệu ứng khi cuộn trang (nhẹ, mượt, thân thiện SEO) =====
// • Nội dung LUÔN có sẵn trong HTML; chỉ ẩn để chạy hiệu ứng khi trình duyệt có JS (lớp .ja trên <html>) và
//   khách không bật "giảm chuyển động". Bot/không JS → thấy toàn bộ nội dung ngay.
// • .rv (trồi lên) · .rv-l (trượt từ trái) · .rv-r (từ phải) · .rv-z (phóng to) · .rv-s (các phần tử con lần lượt hiện).
// • Ảnh banner trôi chậm (parallax) – dùng transform + rAF. Header giữ NGUYÊN kích thước khi cuộn (không thu gọn), không còn thanh tiến trình trên cùng.
export default function Anim(){const path=usePathname();
 useEffect(()=>{const root=document.documentElement;root.classList.add('anim-ready');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const els=[...document.querySelectorAll('.rv,.rv-l,.rv-r,.rv-z,.rv-s')];
  document.querySelectorAll('.rv-s').forEach(g=>[...g.children].forEach((c,k)=>c.style.setProperty('--d',Math.min(k,8)*85+'ms')));
  if(reduce||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  els.forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)el.classList.add('in');else io.observe(el)});
  return()=>io.disconnect()},[path]);
 useEffect(()=>{const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;let raf=0,last=-1;
  const tick=()=>{raf=0;const y=scrollY;if(y===last)return;last=y;
   root.classList.toggle('scrolled',y>12);
   if(!reduce){const hb=document.querySelector('.hero:not(.hero-ed) .hbgs');if(hb&&y<innerHeight*1.2)hb.style.transform=`translate3d(0,${(y*.28).toFixed(1)}px,0)`}};
  const on=()=>{if(!raf)raf=requestAnimationFrame(tick)};tick();addEventListener('scroll',on,{passive:true});addEventListener('resize',on);
  return()=>{removeEventListener('scroll',on);removeEventListener('resize',on);cancelAnimationFrame(raf)}},[path]);
 return null}
