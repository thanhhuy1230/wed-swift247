// Công cụ dữ liệu MySQL cho website Swift247. Chạy trong thư mục swift-news:
//   npm run db:check     – thử kết nối MySQL, tạo bảng nếu chưa có, đếm dữ liệu
//   npm run db:import    – chép dữ liệu từ các file JSON trong data/ vào MySQL (lần đầu chuyển sang MySQL)
//   npm run db:export    – xuất dữ liệu đang có trong MySQL ra thư mục data-export-<thời gian>/ (sao lưu, cùng định dạng data/)
// Thông tin kết nối lấy từ .env.local (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE).
import fs from 'fs'; import path from 'path';
import { config, createPool, ensureSchema, loadAll, persist, TABLES } from '../lib/mysql-store.mjs';

const root = process.cwd(), DATA = path.join(root, 'data');
for (const f of ['.env', '.env.local']) {   // đọc .env.local giống Next.js
  try {
    for (const line of fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if (!m || line.trim().startsWith('#')) continue;
      let v = m[2]; if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
      if (process.env[m[1]] === undefined || f === '.env.local') process.env[m[1]] = v;
    }
  } catch {}
}
const cmd = process.argv[2], force = process.argv.includes('--force');
const cfg = config();
if (!cfg) { console.error('Chưa có MYSQL_DATABASE trong .env.local – xem hướng dẫn trong README (mục "Dùng MySQL").'); process.exit(1); }
const pool = createPool(cfg);
const count = async () => {
  const out = {};
  for (const t of [...Object.values(TABLES), 'web_kv']) {
    const [r] = await pool.query(`SELECT ${t === 'web_kv' ? "'' lang" : 'lang'}, COUNT(*) n FROM \`${t}\` GROUP BY 1`);
    out[t] = Object.fromEntries(r.map(x => [x.lang || 'tổng', x.n]));
  }
  return out;
};
const walk = (dir, pre = '') => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (e.name === 'uploads' || e.name.startsWith('backup') ? [] : walk(path.join(dir, e.name), pre + e.name + '/'))
    : e.name.endsWith('.json') ? [pre + e.name] : []) : [];

try {
  console.log(`MySQL: ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
  await ensureSchema(pool);
  if (cmd === 'check') {
    console.log('Kết nối OK. Bảng web_posts, web_pages, web_kv đã sẵn sàng.');
    console.log(JSON.stringify(await count(), null, 2));
  } else if (cmd === 'import') {
    const c = await count(), has = Object.values(c).some(x => Object.keys(x).length);
    if (has && !force) {
      console.error('MySQL đã có dữ liệu website:', JSON.stringify(c), '\nChạy lại kèm --force nếu chắc chắn muốn GHI ĐÈ bằng dữ liệu trong data/ (npm run db:import -- --force).');
      process.exit(1);
    }
    const files = walk(DATA); let n = 0;
    for (const f of files) {
      const raw = fs.readFileSync(path.join(DATA, f), 'utf8'); let v;
      try { v = JSON.parse(raw); } catch { console.warn('  Bỏ qua (JSON lỗi):', f); continue; }
      await persist(pool, f, JSON.stringify(v), null); n++;
      console.log('  ✓', f, Array.isArray(v) ? `(${v.length})` : '');
    }
    console.log(`Đã chép ${n} file vào MySQL.`); console.log(JSON.stringify(await count(), null, 2));
    console.log('Ảnh tải lên (data/uploads/) vẫn để trong thư mục data/uploads như cũ.');
  } else if (cmd === 'export') {
    const all = await loadAll(pool), dir = path.join(root, 'data-export-' + new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19));
    for (const [n, e] of all) { const f = path.join(dir, n); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(JSON.parse(e.s), null, 2)); }
    console.log(`Đã xuất ${all.size} file vào ${dir}`);
  } else {
    console.log('Dùng: npm run db:check | npm run db:import | npm run db:export');
  }
} catch (e) {
  console.error('LỖI:', e.code || '', e.message);
  if (e.code === 'ER_ACCESS_DENIED_ERROR') console.error('→ Sai MYSQL_USER / MYSQL_PASSWORD trong .env.local');
  if (e.code === 'ECONNREFUSED') console.error('→ MySQL chưa chạy hoặc sai MYSQL_HOST / MYSQL_PORT');
  if (e.code === 'ER_BAD_DB_ERROR') console.error('→ Chưa có database ' + cfg.database);
  process.exitCode = 1;
} finally { await pool.end(); }
