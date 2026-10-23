// Khuyến mãi: chuẩn hóa dữ liệu, tính trạng thái theo ngày (giờ Việt Nam), tạo mã neo để mở thẳng chi tiết (#km-SWIFT100K).
// Thuần dữ liệu – dùng được ở cả server lẫn client. Trạng thái được tính ở server rồi truyền xuống để không lệch khi hydrate.
const parse=v=>{const m=String(v||'').trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);if(!m)return null;
 const d=Date.UTC(+m[3],+m[2]-1,+m[1]);return isNaN(d)?null:d};
// "hôm nay" theo múi giờ Việt Nam (UTC+7), làm tròn về 00:00
const today=()=>{const n=Date.now()+7*36e5;return Math.floor(n/864e5)*864e5};
export const slugCode=(x,k)=>'km-'+(String(x.code||x.title||'p'+k).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'p'+k);
export function promos(list=[]){const now=today();
 return list.map((x,k)=>{const end=parse(x.expiry);
  const left=end==null?null:Math.round((end-now)/864e5);
  const status=end!=null&&left<0?'ended':'active';
  return{...x,id:slugCode(x,k),left,status,ending:status==='active'&&left!=null&&left<=7,
   points:String(x.detail||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}})
 .sort((a,b)=>(a.status==='ended')-(b.status==='ended'))}
export const activeP=list=>promos(list).filter(x=>x.status!=='ended');
// danh sách ảnh của một mục (trường imgs nhiều dòng + trường img cũ)
export const imgList=x=>{const a=String(x.imgs||'').split(/\r?\n|,(?=\s*\/|\s*https?:)/).map(s=>s.trim()).filter(Boolean);if(x.img&&!a.includes(x.img))a.unshift(x.img);return a};
