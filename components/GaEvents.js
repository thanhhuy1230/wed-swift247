'use client';import {useEffect} from 'react';import {track} from '@/lib/ga';
// Theo dõi chuyển đổi tự động cho toàn site (GA4) bằng 1 bộ lắng nghe duy nhất – không cần sửa từng nút:
// • gọi hotline, Zalo, email, tải app (Google Play / App Store), mở Google Maps
// • phần tử có data-ga="ten_su_kien" (+ data-ga-label, data-ga-location, data-ga-type → content_type/item_id) – vd nút Đặt giao hàng, Đăng nhập
// • gửi form tư vấn (generate_lead), tìm kiếm bài viết (search)
export default function GaEvents(){useEffect(()=>{
 const click=e=>{const el=e.target.closest('a,button,[data-ga]');if(!el)return;const h=el.getAttribute('href')||'',loc=el.closest('[data-ga-area],header,footer,section')?.getAttribute('data-ga-area')||el.closest('header')&&'header'||el.closest('footer')&&'footer'||el.closest('section')?.id||'page';
  if(el.dataset.ga){const lb=el.dataset.gaLabel||el.textContent.trim().slice(0,80),pr={label:lb,location:el.dataset.gaLocation||loc};if(el.dataset.gaType){pr.content_type=el.dataset.gaType;pr.item_id=lb}if(h&&h.startsWith('/'))pr.link_url=h;track(el.dataset.ga,pr);return}
  if(h.startsWith('tel:'))track('click_call',{location:loc});
  else if(/zalo\.me/.test(h))track('click_zalo',{location:loc});
  else if(h.startsWith('mailto:'))track('click_email',{location:loc});
  else if(/play\.google\.com/.test(h))track('click_app_download',{store:'google_play',location:loc});
  else if(/apps\.apple\.com|apple\.com\/.*app-store/.test(h))track('click_app_download',{store:'app_store',location:loc});
  else if(/google\.[a-z.]+\/maps|maps\.google\./.test(h))track('view_map',{location:loc})};
 const submit=e=>{const f=e.target;if(!(f instanceof HTMLFormElement))return;
  if(f.classList.contains('ct-f')){const s=f.querySelector('[name=service]');track('generate_lead',{form:'contact',service:s?.value||''})}
  else if(f.classList.contains('sbar')){const q=f.querySelector('[name=q]');track('search',{search_term:(q?.value||'').slice(0,80),search_type:'news'})}};
 document.addEventListener('click',click,{capture:true});document.addEventListener('submit',submit,{capture:true});
 return()=>{document.removeEventListener('click',click,{capture:true});document.removeEventListener('submit',submit,{capture:true})}},[]);return null}
