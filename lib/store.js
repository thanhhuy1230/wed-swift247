import fs from 'fs';import path from 'path';
const d=path.join(process.cwd(),'data');
// Nơi lưu dữ liệu: MySQL nếu .env.local có MYSQL_DATABASE (xem lib/mysql-store.mjs), ngược lại là các file JSON trong data/.
// Giao diện read/write giữ nguyên nên toàn bộ phần còn lại của website không phải thay đổi.
const useDb=!!process.env.MYSQL_DATABASE;
const db=()=>{const g=globalThis.__swiftDB;return g&&g.ready?g:null};
const offline=()=>{throw new Error('Chưa kết nối được MySQL'+(globalThis.__swiftDB?.error?` (${globalThis.__swiftDB.error})`:'')+' – chưa thể lưu. Kiểm tra MySQL đã bật và thông tin MYSQL_* trong .env.local.')};
const readFile=(n,def)=>{try{return JSON.parse(fs.readFileSync(path.join(d,n),'utf8'))}catch{return def}};
export const read=(n,def)=>{const g=db();if(!g)return readFile(n,def); // MySQL chưa sẵn sàng: tạm hiển thị bản file
 const s=g.get(n);if(s==null)return def;try{return JSON.parse(s)}catch{return def}};
// ghi an toàn: ghi file tạm rồi đổi tên, tránh hỏng dữ liệu khi mất điện/ghi đồng thời
export const write=(n,v)=>{if(useDb){const g=db();if(!g)offline();g.set(n,JSON.stringify(v));return}
 const f=path.join(d,n),t=f+'.'+process.pid+'.tmp';fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(t,JSON.stringify(v,null,2));fs.renameSync(t,f)};
// Xóa 1 mục (vd revisions/vi/7.json)
export const remove=n=>{if(useDb){const g=db();if(!g)offline();g.del(n);return}try{fs.unlinkSync(path.join(d,n))}catch{}};
// Liệt kê các mục trực tiếp trong 1 thư mục (vd 'previews') → [{name, size, mtime}]
export const list=dir=>{if(useDb){const g=db();return g?g.list(dir):[]}
 const p=path.join(d,dir);try{return fs.readdirSync(p).map(f=>{const st=fs.statSync(path.join(p,f));return st.isFile()?{name:f,size:st.size,mtime:st.mtimeMs}:null}).filter(Boolean)}catch{return[]}};
// Tên file theo ngôn ngữ: tiếng Việt giữ nguyên (posts.json), ngôn ngữ khác thêm hậu tố (posts.en.json)
export const fname=(n,l)=>!l||l==='vi'?n:n.replace(/\.json$/,'.'+l+'.json');
