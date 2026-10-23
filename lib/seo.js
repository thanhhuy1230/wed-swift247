// ===== Thư viện SEO dùng chung (chạy được cả ở trình duyệt lẫn máy chủ – KHÔNG import fs/next ở đây) =====

export const slugify = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ENT = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
export const plain = h => String(h || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&(nbsp|amp|lt|gt|quot|#39);/g, m => ENT[m]).replace(/\s+/g, ' ').trim();
export const wordsOf = t => (String(t || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
export const countWords = h => wordsOf(plain(h)).length;
export const cut = (t, n) => { t = String(t || '').trim(); if (t.length <= n) return t; const c = t.slice(0, n - 1); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 20)).replace(/[\s,.;:-]+$/, '') + '…'; };
// Mô tả tự động (khi tác giả chưa nhập): lấy đoạn đầu của bài
export const autoDesc = (h, n = 155) => cut(plain(h), n);

const attr = (tag, name) => { const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i')); return m ? (m[2] ?? m[3] ?? '') : null; };

// Phân tích cấu trúc bài: tiêu đề, ảnh, liên kết
export function parse(html, host = '') {
  html = String(html || '');
  const heads = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => ({ l: +m[1], t: plain(m[2]) }));
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => ({ alt: (attr(m[0], 'alt') || '').trim(), src: attr(m[0], 'src') || '' }));
  const links = [...html.matchAll(/<a\b[^>]*>/gi)].map(m => attr(m[0], 'href') || '').filter(Boolean);
  const internal = links.filter(h => /^(\/(?!\/)|#)/.test(h) || (host && h.includes(host)));
  const external = links.filter(h => /^https?:/i.test(h) && !(host && h.includes(host)));
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => plain(m[1])).filter(Boolean);
  return { heads, imgs, internal, external, paras };
}

// Chấm điểm SEO kiểu Yoast/RankMath: trả về {score 0-100, checks:[{id,lv:'good'|'warn'|'bad',t}], stats}
export function analyze({ title = '', slug = '', keyword = '', seoTitle = '', seoDesc = '', excerpt = '', content = '', cover = '', coverAlt = '' }, host = '') {
  const checks = []; let got = 0, max = 0;
  const add = (id, lv, t, w = 1) => { checks.push({ id, lv, t }); max += w; got += lv === 'good' ? w : lv === 'warn' ? w * .5 : 0; };
  const kw = String(keyword || '').trim().toLowerCase();
  const T = (seoTitle || title).trim(), Dd = (seoDesc || '').trim();
  const text = plain(content), words = wordsOf(text), n = words.length, P = parse(content, host);
  const lc = s => String(s || '').toLowerCase();

  // --- Tiêu đề & mô tả ---
  const tl = T.length;
  add('tl', tl >= 30 && tl <= 60 ? 'good' : tl >= 20 && tl <= 70 ? 'warn' : 'bad',
    tl ? `Tiêu đề SEO dài ${tl} ký tự – ${tl >= 30 && tl <= 60 ? 'chuẩn (30–60)' : tl < 30 ? 'hơi ngắn, nên 30–60 ký tự' : 'quá dài, Google sẽ cắt (nên ≤ 60)'}.` : 'Chưa có tiêu đề.', 2);
  const dl = Dd.length;
  add('dl', dl >= 120 && dl <= 160 ? 'good' : dl >= 70 && dl <= 180 ? 'warn' : 'bad',
    dl ? `Meta description dài ${dl} ký tự – ${dl >= 120 && dl <= 160 ? 'chuẩn (120–160)' : dl < 120 ? 'hơi ngắn, nên 120–160 ký tự' : 'quá dài, sẽ bị cắt (nên ≤ 160)'}.` : 'Chưa nhập Meta description – Google sẽ tự lấy đoạn bất kỳ trong bài.', 2);
  const sl = String(slug || '').length;
  add('sl', !sl ? 'bad' : sl <= 60 ? 'good' : sl <= 90 ? 'warn' : 'bad', !sl ? 'Chưa có đường dẫn (slug).' : sl <= 60 ? `Đường dẫn ngắn gọn (${sl} ký tự).` : `Đường dẫn dài ${sl} ký tự – nên rút gọn còn ≤ 60.`);

  // --- Từ khóa chính ---
  const kws = slugify(kw);
  if (!kw) add('kw', 'warn', 'Chưa nhập từ khóa chính – nhập để kiểm tra mật độ và vị trí từ khóa.', 2);
  else {
    add('kw-t', lc(T).includes(kw) ? 'good' : 'bad', lc(T).includes(kw) ? 'Từ khóa chính có trong tiêu đề.' : 'Từ khóa chính chưa xuất hiện trong tiêu đề SEO.', 2);
    add('kw-d', lc(Dd).includes(kw) ? 'good' : 'bad', lc(Dd).includes(kw) ? 'Từ khóa chính có trong Meta description.' : 'Từ khóa chính chưa có trong Meta description.');
    add('kw-s', kws && String(slug).includes(kws) ? 'good' : 'warn', kws && String(slug).includes(kws) ? 'Từ khóa chính có trong đường dẫn.' : 'Nên đưa từ khóa chính vào đường dẫn (slug).');
    const first = words.slice(0, 100).join(' ');
    add('kw-f', first.includes(kw) ? 'good' : 'bad', first.includes(kw) ? 'Từ khóa chính xuất hiện trong 100 từ đầu.' : 'Hãy đưa từ khóa chính vào đoạn mở đầu (100 từ đầu).', 2);
    const hs = P.heads.filter(h => h.l >= 2 && h.l <= 3);
    add('kw-h', hs.some(h => lc(h.t).includes(kw)) ? 'good' : 'warn', hs.some(h => lc(h.t).includes(kw)) ? 'Từ khóa chính có trong ít nhất một tiêu đề H2/H3.' : 'Nên dùng từ khóa chính (hoặc biến thể) trong ít nhất một tiêu đề H2/H3.');
    const kn = wordsOf(kw).length || 1; let c = 0, src = ' ' + words.join(' ') + ' ', k = ' ' + wordsOf(kw).join(' ') + ' ';
    for (let i = src.indexOf(k); i >= 0; i = src.indexOf(k, i + k.length - 1)) c++;
    const dens = n ? (c * kn / n * 100) : 0;
    add('kw-n', !n ? 'bad' : dens >= .5 && dens <= 2.5 ? 'good' : dens > 3.5 || c === 0 ? 'bad' : 'warn',
      c === 0 ? 'Từ khóa chính chưa xuất hiện trong nội dung.' : `Từ khóa xuất hiện ${c} lần (mật độ ${dens.toFixed(1)}%) – ${dens >= .5 && dens <= 2.5 ? 'hợp lý (0,5–2,5%)' : dens < .5 ? 'hơi ít, nên 0,5–2,5%' : 'hơi nhiều, tránh nhồi nhét từ khóa'}.`, 2);
    const withAlt = P.imgs.filter(i => i.alt);
    if (P.imgs.length) add('kw-i', withAlt.some(i => lc(i.alt).includes(kw)) ? 'good' : 'warn', withAlt.some(i => lc(i.alt).includes(kw)) ? 'Có ảnh dùng từ khóa chính trong mô tả (alt).' : 'Nên có ít nhất 1 ảnh có mô tả (alt) chứa từ khóa chính.');
  }

  // --- Nội dung ---
  add('len', n >= 600 ? 'good' : n >= 300 ? 'warn' : 'bad', `Bài dài ${n} từ – ${n >= 600 ? 'tốt cho SEO (≥ 600 từ)' : n >= 300 ? 'đạt tối thiểu, nên viết từ 600 từ trở lên' : 'quá ngắn (nên ≥ 300 từ – khuyến nghị chung, tốt nhất ≥ 600)'}.`, 2);
  const h2 = P.heads.filter(h => h.l === 2).length;
  add('h2', n < 300 ? (h2 ? 'good' : 'warn') : h2 >= 2 ? 'good' : h2 === 1 ? 'warn' : 'bad', h2 >= 2 ? `Có ${h2} tiêu đề H2 chia bố cục rõ ràng.` : h2 === 1 ? 'Mới có 1 tiêu đề H2 – nên chia bài thành ít nhất 2–3 phần.' : 'Chưa có tiêu đề H2 – hãy chia bài thành các mục có tiêu đề.');
  let skip = false, seen2 = false; for (const h of P.heads) { if (h.l === 2) seen2 = true; if (h.l === 3 && !seen2) skip = true; if (h.l === 1) skip = true; }
  if (P.heads.length) add('hs', skip ? 'warn' : 'good', skip ? 'Cấu trúc tiêu đề chưa chuẩn (H3 đứng trước H2, hoặc có H1 – tiêu đề bài đã là H1).' : 'Cấu trúc tiêu đề H2 → H3 đúng thứ tự.');
  const long = P.paras.filter(p => wordsOf(p).length > 150).length;
  add('para', long ? 'warn' : 'good', long ? `${long} đoạn văn quá dài (> 150 từ) – hãy tách nhỏ cho dễ đọc.` : 'Độ dài đoạn văn hợp lý, dễ đọc.');
  const sents = text.split(/[.!?…]+\s/).filter(Boolean), longS = sents.filter(s => wordsOf(s).length > 25).length;
  if (sents.length >= 5) add('sent', longS / sents.length > .25 ? 'warn' : 'good', longS / sents.length > .25 ? `${Math.round(longS / sents.length * 100)}% câu quá dài (> 25 từ) – nên viết câu ngắn hơn.` : 'Độ dài câu dễ đọc.');

  // --- Hình ảnh & liên kết ---
  const miss = P.imgs.filter(i => !i.alt).length;
  add('img', !P.imgs.length ? (cover ? 'warn' : 'bad') : miss ? 'bad' : 'good', !P.imgs.length ? 'Bài chưa có ảnh minh họa trong nội dung.' : miss ? `${miss}/${P.imgs.length} ảnh thiếu mô tả (alt) – bấm vào ảnh trong khung soạn thảo để thêm.` : `Tất cả ${P.imgs.length} ảnh đều có mô tả (alt).`);
  add('cov', cover ? (coverAlt.trim() ? 'good' : 'warn') : 'warn', cover ? (coverAlt.trim() ? 'Ảnh bìa có mô tả alt.' : 'Ảnh bìa chưa có mô tả alt.') : 'Chưa có ảnh bìa – ảnh bìa dùng làm ảnh chia sẻ Facebook/Zalo.');
  add('int', P.internal.length ? 'good' : 'warn', P.internal.length ? `Có ${P.internal.length} liên kết nội bộ.` : 'Chưa có liên kết nội bộ – hãy dẫn tới 1–3 bài/trang liên quan trong website.');
  add('ext', P.external.length ? 'good' : 'warn', P.external.length ? `Có ${P.external.length} liên kết ra nguồn bên ngoài.` : 'Nên có 1 liên kết tới nguồn uy tín bên ngoài để tăng độ tin cậy.', .5);

  const order = { bad: 0, warn: 1, good: 2 };
  checks.sort((a, b) => order[a.lv] - order[b.lv]);
  return { score: max ? Math.round(got / max * 100) : 0, checks, stats: { words: n, h2, imgs: P.imgs.length, internal: P.internal.length, external: P.external.length } };
}
export const grade = s => s >= 80 ? ['Tốt', 'good'] : s >= 55 ? ['Khá – cần cải thiện', 'warn'] : ['Cần cải thiện', 'bad'];

// ===== Xử lý HTML bài viết trước khi hiển thị (máy chủ) =====
// - gắn id cho H2/H3 (mục lục + liên kết neo), lazy-load ảnh, liên kết ngoài mở tab mới + rel an toàn, bảng cuộn ngang trên điện thoại
export function enhance(html, host = '') {
  const used = new Set(), toc = [];
  let out = String(html || '').replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (m, l, a, inner) => {
    const t = plain(inner); if (!t) return m;
    let id = attr('<x' + a + '>', 'id'); if (!id) { id = slugify(t).slice(0, 60) || 'muc'; let b = id, i = 2; while (used.has(id)) id = b + '-' + i++; a += ` id="${id}"`; }
    used.add(id); toc.push({ l: +l, id, t });
    return `<h${l}${a}>${inner}</h${l}>`;
  });
  out = out.replace(/<img\b([^>]*?)\/?>/gi, (m, a) => {
    if (!/\salt\s*=/i.test(a)) a += ' alt=""';
    if (!/\sloading\s*=/i.test(a)) a += ' loading="lazy"';
    if (!/\sdecoding\s*=/i.test(a)) a += ' decoding="async"';
    return `<img${a}>`;
  });
  out = out.replace(/<a\b([^>]*)>/gi, (m, a) => {
    const h = attr(m, 'href') || '';
    if (/^https?:/i.test(h) && !(host && h.includes(host))) {
      a = a.replace(/\s(target|rel)\s*=\s*("[^"]*"|'[^']*')/gi, '') + ' target="_blank" rel="noopener noreferrer"';
    }
    return `<a${a}>`;
  });
  out = out.replace(/<table/gi, '<div class="tw"><table').replace(/<\/table>/gi, '</table></div>');
  return { html: out, toc };
}
