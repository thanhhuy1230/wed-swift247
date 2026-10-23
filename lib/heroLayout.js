// ===== Bố cục banner trang chủ (kéo – thả trong Cài đặt trang → "Bố cục banner") =====
// Banner được chia thành lưới 12 cột × nhiều hàng. Mỗi ô có: vị trí (x = cột bắt đầu, y = hàng bắt đầu),
// kích thước (w = số cột, h = số hàng), tỉ lệ phóng to/thu nhỏ (sc, %), căn chữ (al), căn dọc (va), ẩn (hide), ẩn trên điện thoại (hm).
// Lưu dạng chuỗi JSON trong site.json → info.heroLayout (dùng chung mọi ngôn ngữ). Để trống = bố cục gốc của website.
// Trên điện thoại (≤ 960px) các ô tự xếp thành 1 cột theo thứ tự: trên → dưới, trái → phải.
export const COLS = 12;
export const BOXES = [
  { k: 'track', n: 'Ô tra cứu đơn hàng', c: '#2563eb',
    d: 'Khung trắng có 2 tab: Tra cứu đơn hàng và Đăng nhập / Đăng ký (cá nhân – doanh nghiệp). Khi khách chuyển sang tab Đăng nhập, khung tự rộng ra.',
    e: 'Chữ, link & độ rộng 2 tab: Nội dung trang chủ → “Khung Tra cứu / Đăng nhập – Đăng ký”.' },
  { k: 'badge', n: 'Huy hiệu', c: '#d97706',
    d: 'Dòng chữ nhỏ có viền tròn phía trên tiêu đề. Slide khuyến mãi hiện nhãn “Voucher”.',
    e: 'Banner chủ → “Dòng nhỏ phía trên (huy hiệu)”.' },
  { k: 'title', n: 'Tiêu đề lớn', c: '#db2777',
    d: 'Câu tiêu đề chính của slide đang hiển thị.',
    e: 'Banner chủ / Khuyến mãi → “Tiêu đề lớn” / “Tên ưu đãi”.' },
  { k: 'text', n: 'Mô tả / Vé voucher', c: '#7c3aed',
    d: 'Banner chủ: đoạn mô tả ngắn. Slide khuyến mãi: vé voucher (giá trị, mã, hạn dùng).',
    e: 'Banner chủ → “Mô tả ngắn”. Khuyến mãi → “Giá trị voucher”, “Mã voucher”…' },
  { k: 'points', n: 'Điểm nổi bật', c: '#059669',
    d: 'Các thẻ nhỏ có dấu tích. Mỗi dòng trong ô “Điểm nổi bật” là 1 thẻ. Slide khuyến mãi không có phần này.',
    e: 'Banner chủ → “Điểm nổi bật – mỗi dòng 1 ý”.' },
  { k: 'buttons', n: 'Nút bấm', c: '#ea580c',
    d: 'Nút chính (nền trắng) và nút phụ (viền trắng) của slide.',
    e: 'Banner chủ → “Chữ nút chính”, “Link nút chính”, “Chữ nút phụ”…' },
  { k: 'tabs', n: 'Tab nhóm', c: '#0891b2',
    d: 'Hai nút chuyển nhóm “Trang chủ” và “Khuyến mãi”. Chỉ hiện khi có cả hai nhóm.',
    e: 'Tiêu đề & mô tả các mục → “Tên tab banner”.' },
  { k: 'slides', n: 'Thanh chọn slide', c: '#4f46e5',
    d: 'Các nút chọn từng banner của nhóm đang xem, có vạch chạy thời gian.',
    e: 'Tên trên mỗi nút là “Tiêu đề lớn” của từng banner.' },
];
export const BOX = Object.fromEntries(BOXES.map(b => [b.k, b]));
// Bố cục mặc định – giống bố cục gốc: ô tra cứu bên trái, chữ bên phải, thanh chọn ở dưới
export const DEFAULT = {
  track: { x: 1, y: 1, w: 5, h: 9, va: 'c' },
  badge: { x: 6, y: 1, w: 7, h: 1 },
  title: { x: 6, y: 2, w: 7, h: 3 },
  text: { x: 6, y: 5, w: 7, h: 2 },
  points: { x: 6, y: 7, w: 7, h: 2 },
  buttons: { x: 6, y: 9, w: 7, h: 1 },
  tabs: { x: 1, y: 11, w: 4, h: 1, va: 'c' },
  slides: { x: 5, y: 11, w: 8, h: 1, va: 'c' },
};
const int = (v, d, a, b) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
// Chuẩn hóa: luôn trả về đủ 8 ô với giá trị hợp lệ
export function normalize(o) {
  const src = (o && typeof o === 'object' && o.boxes && typeof o.boxes === 'object') ? o.boxes : (o || {}), out = {};
  for (const { k } of BOXES) {
    const d = DEFAULT[k], b = src[k] && typeof src[k] === 'object' ? src[k] : {};
    const w = int(b.w, d.w, 1, COLS), x = int(b.x, d.x, 1, COLS - w + 1);
    out[k] = { x, y: int(b.y, d.y, 1, 60), w, h: int(b.h, d.h, 1, 20), sc: int(b.sc, 100, 50, 200),
      al: ['l', 'c', 'r'].includes(b.al) ? b.al : 'l', va: ['t', 'c', 'b'].includes(b.va) ? b.va : (d.va || 't'),
      hide: !!b.hide, hm: !!b.hm };
  }
  return out;
}
// Đọc từ chuỗi đã lưu. Trống / lỗi → null (website dùng bố cục gốc)
export function parse(raw) {
  if (!raw || !String(raw).trim()) return null;
  try { return normalize(JSON.parse(raw)); } catch { return null; }
}
export const stringify = L => JSON.stringify({ v: 1, boxes: L });
export const defaults = () => normalize(DEFAULT);
// Số hàng cần dùng
export const rowsOf = L => Math.max(1, ...BOXES.filter(b => !L[b.k].hide).map(b => L[b.k].y + L[b.k].h - 1));
// Hai ô có chồng lên nhau không
export const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const collides = (L, k, r) => BOXES.some(b => b.k !== k && !L[b.k].hide && overlap(r, L[b.k]));
// Thứ tự trên điện thoại: trên → dưới, trái → phải
export const mobileOrder = L => BOXES.map(b => b.k).filter(k => !L[k].hide && !L[k].hm).sort((a, b) => L[a].y - L[b].y || L[a].x - L[b].x);
