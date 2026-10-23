import {read} from './store';import {LANGS} from './dict';
// ===== Ngôn ngữ đang BẬT trên website (Cài đặt trang → "Ngôn ngữ website") =====
// Lưu ở site.json → info.langs dạng "vi,en,ja". Tiếng Việt là ngôn ngữ gốc nên luôn bật. Chưa cấu hình = bật tất cả.
// Trang quản trị vẫn sửa được mọi ngôn ngữ (để chuẩn bị bản dịch trước khi bật).
export const activeLangs=()=>{const raw=(read('site.json',{}).info||{}).langs;if(raw==null||!String(raw).trim())return LANGS.slice();
 const v=String(raw).split(/[,\s]+/).map(s=>s.trim().toLowerCase());return LANGS.filter(l=>l==='vi'||v.includes(l))};
export const isActive=l=>activeLangs().includes(l);
