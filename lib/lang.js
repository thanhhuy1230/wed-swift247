import {cookies,headers} from 'next/headers';import {LANGS} from './dict';import {activeLangs} from './langs';
// Ngôn ngữ đang xem: 1) tham số ?hl=xx trên URL (middleware chuyển thành header x-lang – để Google lập chỉ mục từng ngôn ngữ),
// 2) cookie 'lang' (khách đã chọn trước đó), 3) mặc định tiếng Việt. Dùng chung cho website và trang quản trị.
// Phía khách chỉ nhận ngôn ngữ đang bật (ngôn ngữ đã tắt → tiếng Việt); trang quản trị nhận mọi ngôn ngữ.
export const getLang=()=>{const H=headers(),ok=(H.get('x-path')||'').startsWith('/admin')?LANGS:activeLangs(),h=H.get('x-lang');if(ok.includes(h))return h;const c=cookies().get('lang')?.value;return ok.includes(c)?c:'vi'};
