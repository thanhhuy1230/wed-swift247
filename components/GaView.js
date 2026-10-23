'use client';import {useEffect} from 'react';import {track} from '@/lib/ga';
// Gửi 1 sự kiện GA4 khi trang được mở (vd: view_item trên trang chi tiết dịch vụ). Chờ gtag sẵn sàng tối đa ~5 giây.
export default function GaView({name,params}){useEffect(()=>{let n=0;const go=()=>{if(typeof window.gtag==='function')track(name,params);else if(n++<20)t=setTimeout(go,250)};let t=setTimeout(go,0);return()=>clearTimeout(t)},[name]);return null}
