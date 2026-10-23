import {NextResponse} from 'next/server';
// Đa ngôn ngữ chuẩn SEO: mỗi ngôn ngữ có URL riêng dạng ?hl=en|ja|ko|zh (tiếng Việt = URL gốc).
// Middleware đọc ?hl, chuyển cho trang qua header x-lang và ghi nhớ lựa chọn bằng cookie.
const LANGS=['vi','en','ja','ko','zh'];
export function middleware(req){const h=new Headers(req.headers);h.delete('x-lang');h.delete('x-search');h.set('x-path',req.nextUrl.pathname);h.set('x-search',req.nextUrl.search);
 const hl=req.nextUrl.searchParams.get('hl');
 if(!hl||!LANGS.includes(hl))return NextResponse.next({request:{headers:h}});
 h.set('x-lang',hl);const res=NextResponse.next({request:{headers:h}});
 if(req.cookies.get('lang')?.value!==hl)res.cookies.set('lang',hl,{path:'/',maxAge:31536000,sameSite:'lax'});
 return res}
export const config={matcher:['/((?!_next/|api/|uploads/|brand/|banner/|icon.svg|robots.txt|sitemap.xml).*)']};
