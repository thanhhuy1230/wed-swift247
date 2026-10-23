// ===== Danh sách mục kiểm tra của trang "Rà soát bài viết" (chỉ dữ liệu – dùng được cả ở trình duyệt) =====
// Quản trị: Cài đặt trang → Bài viết & tin tức → "Mục kiểm tra khi rà soát" (thêm / xóa / sửa / bật-tắt / sắp xếp).
// Mỗi mục: label (tên hiện, {n} = giá trị), group (nhóm), type (loại kiểm tra), field (trường áp dụng), value (tham số), on ('1' bật / '0' tắt).
export const CHECK_TYPES=[
 ['missing','Trường còn trống (chọn trường bên dưới)'],
 ['len','Độ dài trường ngoài khoảng (Giá trị: min-max ký tự, vd 30-60)'],
 ['minWords','Nội dung ít hơn N từ (Giá trị: N)'],
 ['maxWords','Nội dung nhiều hơn N từ (Giá trị: N)'],
 ['noH2','Nội dung chưa có tiêu đề H2'],
 ['minImgs','Ít hơn N ảnh trong nội dung (Giá trị: N, mặc định 1)'],
 ['imgAlt','Có ảnh trong nội dung thiếu alt'],
 ['minInternal','Ít hơn N liên kết nội bộ (Giá trị: N, mặc định 1)'],
 ['minExternal','Ít hơn N liên kết ra ngoài (Giá trị: N, mặc định 1)'],
 ['lowSeo','Điểm SEO dưới N (Giá trị: N, mặc định 60)'],
 ['kwTitle','Tiêu đề SEO không chứa từ khóa chính'],
 ['badCat','Chuyên mục không hợp lệ (đã xóa / đổi mã)'],
 ['dupTitle','Trùng tiêu đề với bài khác'],
 ['noTrans','Chưa dịch đủ các ngôn ngữ đang bật'],
 ['old','Lâu chưa cập nhật – quá N ngày (Giá trị: N, mặc định 365)'],
 ['contains','Có chứa cụm từ (Giá trị: các cụm cách nhau bằng dấu ;) – tìm thông tin cũ cần sửa'],
 ['notContains','Không chứa cụm từ (Giá trị: các cụm cách nhau bằng dấu ;)'],
 ['draft','Đang là bản nháp'],
 ['noindex','Đang ẩn khỏi Google (noindex)']];
export const CHECK_FIELDS=[['title','Tiêu đề'],['excerpt','Mô tả ngắn (sapo)'],['content','Nội dung bài'],['cover','Ảnh bìa'],['coverAlt','Alt ảnh bìa'],['seoTitle','Tiêu đề SEO'],['seoDesc','Mô tả SEO'],['keyword','Từ khóa chính'],['slug','Đường dẫn (slug)']];
export const CHECK_GROUPS=['Nội dung','SEO','Hình ảnh','Khác'];
const C=(label,group,type,field='',value='')=>({label,group,type,field,value,on:'1'});
export const DEFAULT_CHECKS=[
 C('Thiếu mô tả ngắn (sapo)','Nội dung','missing','excerpt'),C('Nội dung < {n} từ','Nội dung','minWords','','300'),C('Chưa có tiêu đề H2','Nội dung','noH2'),C('Chưa có liên kết nội bộ','Nội dung','minInternal','','1'),
 C('Thiếu tiêu đề SEO','SEO','missing','seoTitle'),C('Tiêu đề SEO dài/ngắn (chuẩn {n})','SEO','len','seoTitle','30-60'),C('Thiếu mô tả SEO','SEO','missing','seoDesc'),C('Mô tả SEO dài/ngắn (chuẩn {n})','SEO','len','seoDesc','120-160'),C('Thiếu từ khóa chính','SEO','missing','keyword'),C('Điểm SEO < {n}','SEO','lowSeo','','60'),
 C('Thiếu ảnh bìa','Hình ảnh','missing','cover'),C('Ảnh bìa thiếu mô tả (alt)','Hình ảnh','missing','coverAlt'),C('Chưa có ảnh trong nội dung','Hình ảnh','minImgs','','1'),C('Ảnh trong bài thiếu alt','Hình ảnh','imgAlt'),
 C('Chuyên mục không hợp lệ','Khác','badCat'),C('Trùng tiêu đề với bài khác','Khác','dupTitle'),C('Chưa dịch đủ ngôn ngữ','Khác','noTrans')];
