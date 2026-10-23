// ===== Lưu dữ liệu website trong MySQL (thay cho các file JSON trong data/) =====
// Bật khi .env.local có MYSQL_DATABASE. Không đặt → website dùng file JSON như cũ.
//
// Bảng (tự tạo nếu chưa có, nằm chung database với các bảng wp_* của WordPress, không đụng tới chúng):
//   web_posts  – bài viết, mỗi dòng = 1 bài của 1 ngôn ngữ (lang + id)
//   web_pages  – trang nội dung, cùng cấu trúc
//   web_kv     – phần còn lại: cài đặt trang (site*.json), khách liên hệ, phiên bản nháp, bản xem trước…
//
// Cách chạy: khi server khởi động, toàn bộ dữ liệu được nạp từ MySQL vào bộ nhớ đệm; mỗi trang đọc từ bộ đệm
// (nhanh, giữ nguyên toàn bộ code hiện có). Mọi thao tác lưu trong admin ghi xuống MySQL ngay.
// Sửa trực tiếp trong MySQL (Workbench…) → website tự nhận sau tối đa MYSQL_REFRESH_SECONDS giây (mặc định 5).
import mysql from 'mysql2/promise';

export const TABLES = { posts: 'web_posts', pages: 'web_pages' };
const KV = 'web_kv';
const DOC = /^(posts|pages)(?:\.([a-z]{2}))?\.json$/;      // posts.json, posts.en.json, pages.ja.json…
export const docOf = n => { const m = String(n).match(DOC); return m ? { kind: m[1], lang: m[2] || 'vi' } : null; };
export const docName = (kind, lang) => lang === 'vi' ? `${kind}.json` : `${kind}.${lang}.json`;

// Trường của bài/trang ↔ cột MySQL. Giá trị không vừa cột (sai kiểu, quá dài…) được giữ nguyên trong cột extra (JSON),
// trường lạ cũng vào extra → đọc ra giống hệt dữ liệu đã ghi.
const S = n => ({ t: 's', n }), TXT = { t: 's', n: 65535 }, LONG = { t: 's', n: Infinity };
const FIELDS = [
  ['date', 'date', { t: 'd' }], ['updated', 'updated', { t: 'd' }], ['cat', 'cat', S(100)], ['title', 'title', S(500)],
  ['slug', 'slug', S(255)], ['excerpt', 'excerpt', TXT], ['cover', 'cover', S(1000)], ['coverAlt', 'cover_alt', S(500)],
  ['content', 'content', LONG], ['seoTitle', 'seo_title', S(500)], ['seoDesc', 'seo_desc', TXT], ['keyword', 'keyword', S(255)],
  ['noindex', 'noindex', { t: 'b' }], ['status', 'status', S(20)], ['pubRev', 'pub_rev', { t: 'i' }],
];
const KNOWN = new Set(['id', ...FIELDS.map(f => f[0])]);
const isoToSql = v => { if (typeof v !== 'string') return null; const d = new Date(v);
  return !isNaN(d) && d.toISOString() === v ? v.slice(0, 23).replace('T', ' ') : null; };
const sqlToIso = v => v == null ? null : String(v).replace(' ', 'T').padEnd(23, '.000').slice(0, 23) + 'Z';
const fits = (spec, v) => spec.t === 's' ? typeof v === 'string' && [...v].length <= spec.n
  : spec.t === 'b' ? typeof v === 'boolean' : spec.t === 'i' ? Number.isInteger(v) && Math.abs(v) < 2 ** 31 : isoToSql(v) !== null;

const ROW_COLS = ['lang', 'id', 'pos', ...FIELDS.map(f => f[1]), 'extra'];
export function toRow(lang, pos, o) {
  const extra = {}, id = typeof o.id === 'string' && o.id.length <= 64 ? o.id : (extra.id = o.id, String(o.id).slice(0, 64));
  const row = [lang, id, pos];
  for (const [k, , spec] of FIELDS) {
    if (!(k in o) || o[k] === undefined) { row.push(null); continue; }
    if (fits(spec, o[k])) row.push(spec.t === 'd' ? isoToSql(o[k]) : spec.t === 'b' ? (o[k] ? 1 : 0) : o[k]);
    else { row.push(null); extra[k] = o[k]; }
  }
  for (const k of Object.keys(o)) if (!KNOWN.has(k) && o[k] !== undefined) extra[k] = o[k];
  row.push(Object.keys(extra).length ? JSON.stringify(extra) : null);
  return row;
}
export function fromRow(r) {
  const o = { id: r.id };
  for (const [k, c, spec] of FIELDS) {
    const v = r[c]; if (v == null) continue;
    o[k] = spec.t === 'd' ? sqlToIso(v) : spec.t === 'b' ? !!Number(v) : spec.t === 'i' ? Number(v) : v;
  }
  if (r.extra) { try { Object.assign(o, JSON.parse(r.extra)); } catch {} }
  return o;
}

export const SCHEMA = [
  ...Object.values(TABLES).map(t => `CREATE TABLE IF NOT EXISTS \`${t}\` (
  lang VARCHAR(8) NOT NULL COMMENT 'vi, en, ja, ko, zh',
  id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'mã nội bộ – các bản dịch dùng chung',
  pos INT NOT NULL DEFAULT 0 COMMENT 'thứ tự trong danh sách',
  date DATETIME(3) NULL COMMENT 'ngày đăng (UTC)', updated DATETIME(3) NULL COMMENT 'ngày cập nhật (UTC)',
  cat VARCHAR(100) NULL, title VARCHAR(500) NULL, slug VARCHAR(255) NULL, excerpt TEXT NULL,
  cover VARCHAR(1000) NULL, cover_alt VARCHAR(500) NULL, content LONGTEXT NULL,
  seo_title VARCHAR(500) NULL, seo_desc TEXT NULL, keyword VARCHAR(255) NULL, noindex TINYINT(1) NULL,
  status VARCHAR(20) NULL COMMENT 'published | draft', pub_rev INT NULL COMMENT 'phiên bản đang đăng',
  extra LONGTEXT NULL COMMENT 'trường khác (JSON)',
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (lang, id), KEY k_slug (lang, slug), KEY k_status (lang, status, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`),
  `CREATE TABLE IF NOT EXISTS \`${KV}\` (
  name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'vd site.json, leads.json, revisions/vi/7.json',
  data LONGTEXT NOT NULL COMMENT 'nội dung JSON',
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export function config(env = process.env) {
  if (!env.MYSQL_DATABASE) return null;
  return { host: env.MYSQL_HOST || '127.0.0.1', port: +(env.MYSQL_PORT || 3306), user: env.MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || '', database: env.MYSQL_DATABASE, charset: 'utf8mb4_unicode_ci',
    dateStrings: true, timezone: 'Z', supportBigNumbers: true, connectionLimit: 5, waitForConnections: true };
}
export const createPool = cfg => mysql.createPool(cfg);
export async function ensureSchema(pool) { for (const q of SCHEMA) await pool.query(q); }

// Đọc toàn bộ: trả về Map tên → {s: chuỗi JSON, m: thời điểm sửa (ms), rows?: Map id → chữ ký dòng}
export async function loadAll(pool) {
  const out = new Map();
  const [kv] = await pool.query(`SELECT name, data, updated_at FROM ${KV}`);
  for (const r of kv) out.set(r.name, { s: r.data, m: Date.parse(sqlToIso(r.updated_at)) });
  for (const [kind, t] of Object.entries(TABLES)) {
    const [rows] = await pool.query(`SELECT ${ROW_COLS.join(',')}, updated_at FROM \`${t}\` ORDER BY lang, pos, id`);
    const by = new Map();
    for (const r of rows) { if (!by.has(r.lang)) by.set(r.lang, []); by.get(r.lang).push(r); }
    for (const [lang, rs] of by) {
      const list = rs.map(fromRow), sig = new Map();
      list.forEach((o, i) => sig.set(o.id, JSON.stringify(toRow(lang, i, o))));
      out.set(docName(kind, lang), { s: JSON.stringify(list), m: Math.max(...rs.map(r => Date.parse(sqlToIso(r.updated_at)))), rows: sig });
    }
  }
  return out;
}
// Chữ ký thay đổi của cả 3 bảng – dùng để phát hiện dữ liệu bị sửa từ bên ngoài website
export async function signature(pool) {
  const q = t => `SELECT COUNT(*) c, IFNULL(MAX(updated_at),'') m FROM \`${t}\``;
  const parts = [];
  for (const t of [...Object.values(TABLES), KV]) { const [[r]] = await pool.query(q(t)); parts.push(r.c + '@' + r.m); }
  return parts.join('|');
}

// Ghi 1 "tài liệu" xuống MySQL. prev = chữ ký các dòng đã có (để chỉ ghi dòng thay đổi). Trả về chữ ký mới.
export async function persist(pool, name, value, prev) {
  const d = docOf(name);
  if (!d) {
    if (value === undefined) await pool.query(`DELETE FROM ${KV} WHERE name=?`, [name]);
    else await pool.query(`INSERT INTO ${KV} (name, data, updated_at) VALUES (?, ?, NOW(3)) ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=NOW(3)`, [name, value]);
    return null;
  }
  const t = TABLES[d.kind], list = value === undefined ? [] : JSON.parse(value), next = new Map(), changed = [];
  if (!Array.isArray(list)) throw new Error(`${name}: dữ liệu phải là danh sách`);
  const seen = new Set();
  list.forEach((o, i) => {
    const row = toRow(d.lang, i, o || {}); if (seen.has(row[1])) throw new Error(`${name}: trùng mã "${row[1]}"`); seen.add(row[1]);
    const sig = JSON.stringify(row); next.set(row[1], sig); if (!prev || prev.get(row[1]) !== sig) changed.push(row);
  });
  const gone = prev ? [...prev.keys()].filter(id => !next.has(id)) : null;
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    if (gone === null) {  // chưa biết trạng thái cũ → đồng bộ toàn bộ
      const ids = [...next.keys()];
      if (ids.length) await c.query(`DELETE FROM \`${t}\` WHERE lang=? AND id NOT IN (?)`, [d.lang, ids]);
      else await c.query(`DELETE FROM \`${t}\` WHERE lang=?`, [d.lang]);
    } else if (gone.length) await c.query(`DELETE FROM \`${t}\` WHERE lang=? AND id IN (?)`, [d.lang, gone]);
    const upd = ROW_COLS.slice(2).map(k => `${k}=VALUES(${k})`).join(',');
    for (let i = 0; i < changed.length; i += 50) {
      const part = changed.slice(i, i + 50);
      await c.query(`INSERT INTO \`${t}\` (${ROW_COLS.join(',')}) VALUES ? ON DUPLICATE KEY UPDATE ${upd}`, [part]);
    }
    await c.commit();
  } catch (e) { await c.rollback().catch(() => {}); throw e; } finally { c.release(); }
  return next;
}

// ===== Khởi động trong server Next.js (gọi từ instrumentation.js) =====
// Bộ đệm nằm ở globalThis.__swiftDB để mọi phần của Next.js (trang, API, server action) dùng chung.
export async function startStore() {
  const cfg = config(); if (!cfg) return;
  const g = globalThis.__swiftDB || (globalThis.__swiftDB = { ready: false });
  if (g.started) return; g.started = true;
  const pool = createPool(cfg), every = Math.max(1, +(process.env.MYSQL_REFRESH_SECONDS || 5)) * 1000;
  let cache = new Map(), queue = Promise.resolve(), pending = 0, sig = '', failed = new Set();
  const log = (...a) => console.log('[mysql]', ...a);
  const flush = name => { pending++;
    queue = queue.then(async () => {
      const e = cache.get(name);
      try { const rows = await persist(pool, name, e ? e.s : undefined, e && e.rows);
        if (e && rows) e.rows = rows; failed.delete(name); sig = await signature(pool);
      } catch (err) { failed.add(name); console.error('[mysql] LỖI ghi', name, '-', err.message, '(sẽ thử lại)'); }
    }).finally(() => pending--); };
  Object.assign(g, {
    get: n => { const e = cache.get(n); return e ? e.s : null; },
    set: (n, s) => { const old = cache.get(n); cache.set(n, { s, m: Date.now(), rows: old && old.rows }); flush(n); },
    del: n => { if (!cache.has(n)) return; cache.delete(n); flush(n); },
    list: dir => { const p = dir.replace(/\/?$/, '/'); const out = [];
      for (const [n, e] of cache) if (n.startsWith(p) && !n.slice(p.length).includes('/')) out.push({ name: n.slice(p.length), size: Buffer.byteLength(e.s), mtime: e.m });
      return out; },
  });
  const load = async () => { const c = await loadAll(pool); sig = await signature(pool); cache = c; };
  for (let i = 1; ; i++) {  // MySQL chưa bật → thử lại, trong lúc đó website tạm đọc file JSON (không cho lưu)
    try { await ensureSchema(pool); await load(); break; }
    catch (err) { g.error = err.message; console.error(`[mysql] Chưa kết nối được (${err.code || err.message}) – thử lại sau 5 giây…`); await new Promise(r => setTimeout(r, 5000)); }
  }
  g.ready = true; g.error = null;
  log(`Đã kết nối ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database} – ${cache.size} mục dữ liệu.`);
  setInterval(async () => {
    try {
      for (const n of [...failed]) flush(n);                         // thử ghi lại phần bị lỗi
      if (pending || failed.size) return;
      const s = await signature(pool);
      if (s !== sig && !pending && !failed.size) { await load(); log('Phát hiện dữ liệu thay đổi trong MySQL → đã nạp lại.'); }
    } catch (err) { console.error('[mysql] Lỗi kiểm tra thay đổi:', err.message); }
  }, every).unref();
}
