// 34 tỉnh, thành phố sau sắp xếp đơn vị hành chính (hiệu lực 01/07/2025).
// [mã, tên, miền (B/T/N), vĩ độ, kinh độ] – tọa độ trung tâm hành chính, dùng để ước tính quãng đường giữa 2 tỉnh.
export const PROVINCES=[
 ['HN','Hà Nội','B',21.028,105.854],['HP','Hải Phòng','B',20.845,106.688],['QNI','Quảng Ninh','B',20.951,107.080],
 ['BN','Bắc Ninh','B',21.273,106.194],['HY','Hưng Yên','B',20.646,106.051],['NB','Ninh Bình','B',20.251,105.975],
 ['PT','Phú Thọ','B',21.322,105.402],['TN','Thái Nguyên','B',21.594,105.848],['TQ','Tuyên Quang','B',21.823,105.214],
 ['LCA','Lào Cai','B',21.722,104.911],['CB','Cao Bằng','B',22.666,106.258],['LS','Lạng Sơn','B',21.853,106.761],
 ['LCH','Lai Châu','B',22.396,103.458],['DB','Điện Biên','B',21.386,103.023],['SL','Sơn La','B',21.327,103.914],
 ['TH','Thanh Hóa','T',19.807,105.776],['NA','Nghệ An','T',18.679,105.681],['HT','Hà Tĩnh','T',18.343,105.906],
 ['QT','Quảng Trị','T',17.469,106.622],['HUE','Huế','T',16.464,107.590],['DN','Đà Nẵng','T',16.054,108.202],
 ['QNG','Quảng Ngãi','T',15.120,108.792],['GL','Gia Lai','T',13.776,109.224],['KH','Khánh Hòa','T',12.238,109.197],
 ['DL','Đắk Lắk','T',12.668,108.038],['LD','Lâm Đồng','T',11.940,108.458],
 ['HCM','TP. Hồ Chí Minh','N',10.776,106.701],['DNA','Đồng Nai','N',10.957,106.843],['TNI','Tây Ninh','N',10.535,106.413],
 ['CT','Cần Thơ','N',10.034,105.788],['VL','Vĩnh Long','N',10.254,105.972],['DT','Đồng Tháp','N',10.360,106.364],
 ['AG','An Giang','N',10.012,105.081],['CM','Cà Mau','N',9.177,105.150]];
export const REGION={vi:{B:'Miền Bắc',T:'Miền Trung',N:'Miền Nam'},en:{B:'North',T:'Central',N:'South'}};
export const byCode=c=>PROVINCES.find(p=>p[0]===c);
const R=x=>x*Math.PI/180;
// Khoảng cách đường chim bay (km)
export const haversine=(a,b)=>{const dLat=R(b[3]-a[3]),dLng=R(b[4]-a[4]),h=Math.sin(dLat/2)**2+Math.cos(R(a[3]))*Math.cos(R(b[3]))*Math.sin(dLng/2)**2;return 6371*2*Math.asin(Math.sqrt(h))};
// Quãng đường bộ ước tính ≈ chim bay × 1,3 (đường bộ VN uốn theo địa hình)
export const roadKm=(a,b)=>a&&b?Math.round(haversine(a,b)*1.3):0;
// Tỉnh gần nhất theo tọa độ GPS
export const nearest=(lat,lng)=>{let best=null,d=1e9;for(const p of PROVINCES){const x=haversine([0,0,0,lat,lng],p);if(x<d){d=x;best=p}}return best};
