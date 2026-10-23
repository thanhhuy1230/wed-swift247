// Lấy mã video YouTube (11 ký tự) từ mọi dạng link: watch?v=, youtu.be/, embed/, shorts/, live/
export const ytId=u=>(String(u||'').match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/)||[])[1]||String(u||'').trim();
