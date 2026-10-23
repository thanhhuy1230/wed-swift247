// Chạy 1 lần khi server Next.js khởi động: nếu có cấu hình MySQL thì kết nối và nạp dữ liệu (lib/mysql-store.mjs)
export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'){
  if(!process.env.MYSQL_DATABASE)return;
  const {startStore}=await import('./lib/mysql-store.mjs');
  await Promise.race([startStore(),new Promise(r=>setTimeout(r,15000))]); // MySQL chưa bật: không chặn server quá 15 giây, tiếp tục thử kết nối ngầm
 }
}
