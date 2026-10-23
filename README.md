# Swift News (Next.js 14)
1. `npm install`  2. sửa `.env.local` (mật khẩu admin, GA ID, domain)  3. `npm run dev` → http://localhost:3000, quản trị tại /admin
Triển khai: `npm run build && npm start` trên VPS/Node (dữ liệu lưu trong thư mục `data/`, không dùng được trên Vercel serverless).
SEO: metadata, Open Graph, JSON-LD, sitemap.xml (gồm cả trang nội dung), robots.txt. Google Analytics: đặt NEXT_PUBLIC_GA_ID.

## Song ngữ Việt – Anh (VI | EN)
- Khách bấm nút **VI | EN** trên thanh đầu trang để đổi ngôn ngữ (lưu bằng cookie). Toàn bộ website (trang chủ, tin tức, trang nội dung, form, bảng tính cước…) đổi theo.
- Trang quản trị dùng **cùng nút VI | EN**: đang ở ngôn ngữ nào thì mọi thao tác **thêm / sửa / xóa / lưu** chỉ áp dụng cho ngôn ngữ đó (có dòng thông báo "Đang chỉnh sửa nội dung …" ở đầu trang).
- Dữ liệu: tiếng Việt giữ nguyên `data/site.json`, `posts.json`, `pages.json`; tiếng Anh nằm ở `data/site.en.json`, `posts.en.json`, `pages.en.json` (đã có sẵn nội dung mẫu).
- Mục **dùng chung** (logo, màu sắc, hotline, email, mạng xã hội, link tải app, QR, Analytics, Zalo) lưu ở `site.json` và áp dụng cho cả 2 ngôn ngữ – trong admin có ghi chú "Dùng chung cho cả 2 ngôn ngữ".
- Bài viết / trang nội dung có nút **Sao chép sang ngôn ngữ kia** (biểu tượng ngôn ngữ ở cuối dòng). Bản sao giữ nguyên mã nội bộ nên khi khách đang đọc bài và đổi ngôn ngữ, website chuyển đúng sang bản dịch của bài đó (nếu chưa có bản dịch thì về trang Tin tức / Trang chủ).
- Lưu ý SEO: ngôn ngữ chọn bằng cookie nên Google chỉ lập chỉ mục bản tiếng Việt (mặc định). Cần bản tiếng Anh có link riêng (/en/...) thì có thể nâng cấp sau.

## Quản trị (/admin)
- **Bài viết**: viết tin tức bằng **trình soạn thảo kiểu Word** (kiểu đoạn/tiêu đề, cỡ chữ, đậm/nghiêng/gạch chân, màu chữ & tô nền, căn lề, danh sách, thụt lề, liên kết, chèn ảnh, bảng, trích dẫn, xóa định dạng, xem/sửa mã HTML; dán từ Word được làm sạch tự động).
- **Trang nội dung** (mới): tạo trang dịch vụ, chính sách… tại `/p/ten-trang` (đã có sẵn 8 trang mẫu). Dán link vào Menu / Chân trang.
- **Khách liên hệ** (mới): xem khách gửi form "Đăng ký tư vấn", đánh dấu đã xử lý, xóa. Đặt `LEAD_WEBHOOK_URL` trong `.env.local` để nhận thông báo tức thì (Slack/Discord/Make/Zapier).
- **Cài đặt trang**: giao diện 2 cột – danh sách mục ở bên trái, bấm vào thì nội dung hiện bên phải, **mỗi mục có nút "Lưu mục này" riêng** (mục có thay đổi chưa lưu hiện chấm cam). Gồm: logo, màu, hotline, banner, **menu (có menu con xổ xuống)**, **dịch vụ (kèm mô tả hiện khi rê chuột)**, tính năng, các bước, video, nhận xét, bảng giá, FAQ, đối tác, chân trang, SEO, GA, thanh thông báo, nút Zalo. Có nút **Tải bản sao lưu (JSON)**.

### Menu xổ xuống
Cài đặt trang → "Menu" → mỗi mục có phần **Menu con**. Có menu con thì mục đó tự hiện mũi tên và danh sách xổ xuống (rê chuột trên máy tính, bấm mũi tên trên điện thoại).

### Thẻ "Dịch vụ của chúng tôi"
Cài đặt trang → "Dịch vụ" → ô **Mô tả chi tiết**. Rê chuột (hoặc chạm trên điện thoại) vào thẻ sẽ hiện mô tả; để trống thì thẻ không đổi.

## Bảo mật
Đổi `ADMIN_PASSWORD` và `AUTH_SECRET` trước khi đưa lên mạng (admin hiện cảnh báo nếu còn mặc định). Đăng nhập sai quá 8 lần/15 phút sẽ bị khóa tạm; form tư vấn có chống spam (ô bẫy bot + giới hạn 5 lần/giờ/IP).
Sao lưu: copy thư mục `data/` (toàn bộ nội dung, khách liên hệ và ảnh).

## Bản nâng cấp V2
**Banner hợp nhất (trang chủ)**
- Ảnh hoặc **video nền (MP4/WebM)** phủ kín toàn khung banner, nằm *dưới* chữ và ô tra cứu (có lớp phủ gradient để chữ luôn rõ). Cài ở Cài đặt trang → Banner đầu trang (ô "Ảnh nền" / "Video nền").
- Mục **Dịch vụ của chúng tôi** đã được đưa vào banner dạng slide xoay vòng; thanh chọn nhanh phía dưới banner có thanh tiến trình, dừng khi rê chuột, vuốt/phím ← → để chuyển. Dịch vụ có thể có ảnh nền riêng.
- Ô tra cứu: nhớ 5 mã tra gần nhất, nút dán nhanh từ clipboard; link tra cứu hỗ trợ `{code}` (vd `https://site.vn/track/{code}`).
- Đã **xóa** khối số liệu (2.000.000+ …).
- Nút **Đăng nhập** nằm sát nút **Đặt giao hàng** (đổi link ở Cài đặt trang → Màu sắc & nút bấm → Link Đăng nhập).
- Khối **Hướng dẫn** mới (các bước + 4 hình thức giao nhận có hiệu ứng khi rê chuột + video & danh sách video), có thể thêm ảnh linh vật ở Tiêu đề & mô tả → "Ảnh linh vật".

**Soạn bài chuẩn SEO** (Bài viết & Trang nội dung)
- Slug tự tạo không dấu từ tiêu đề; từ khóa chính; xem trước Google (máy tính/điện thoại); đếm ký tự meta title/description.
- Chấm điểm SEO trực tiếp (0–100): từ khóa trong tiêu đề/mô tả/slug/100 từ đầu/H2-H3, mật độ từ khóa, độ dài bài, cấu trúc H2→H3, ảnh alt (bấm vào ảnh trong khung soạn để sửa alt), liên kết nội bộ/ngoài, độ dài đoạn & câu.
- Tự lưu nháp trong trình duyệt, cảnh báo khi rời trang chưa lưu, tự đảm bảo slug không trùng, tự tạo mô tả nếu để trống, tùy chọn noindex.
- Phía khách: canonical, Open Graph/Twitter, JSON-LD NewsArticle (dateModified, author, publisher, wordCount…), breadcrumb, mục lục tự động, id cho H2/H3, ảnh lazy-load, link ngoài `noopener`, sitemap có lastmod & bỏ trang noindex. Danh sách bài trong admin hiển thị điểm SEO.

## Bản nâng cấp V3 (Swift247)
**Logo**
- Logo đầu trang đổi sang Swift247: `public/brand/swift247-logo.svg`; chân trang dùng bản trắng `swift247-logo-white.svg`; favicon `app/icon.svg`; ảnh chia sẻ MXH `public/brand/og-swift247.png` (1200×630).
- Có file logo chính thức: Cài đặt trang → Thông tin chung → **Logo đầu trang** / **Logo chân trang** (tải SVG/PNG nền trong suốt), hoặc ghi đè 2 file trong `public/brand/`.

**Banner: tách riêng "Ưu đãi & voucher" và "Dịch vụ của chúng tôi"**
- Thanh 2 tab ngay dưới banner: tab vàng = voucher, tab trắng = dịch vụ. Mỗi slide có nhãn loại ("Voucher ưu đãi" / "Dịch vụ") nên khách không nhầm.
- Voucher hiển thị dạng vé: giá trị, **mã voucher + nút Sao chép mã**, hạn dùng, điều kiện. Hết các voucher thì banner tự chuyển sang tab Dịch vụ (và ngược lại).
- Link `/#voucher` và `/#services` mở đúng tab (đã thêm mục menu "Ưu đãi").
- **Nhiều ảnh nền cho mỗi slide**, phủ kín toàn khung, tự chuyển cảnh (mờ dần + zoom/lia chậm). Quản trị: Cài đặt trang → "Banner – Ưu đãi & voucher" / "Banner – Dịch vụ của chúng tôi" → ô **Ảnh nền banner** (chọn nhiều file một lần, sắp xếp ↑↓, xóa). Khuyên dùng ảnh 1920×820, WebP/JPG ≤ 300KB.
- 8 ảnh minh họa mẫu ở `public/banner/` (SVG) – thay bằng ảnh thật của công ty khi có.

**Tính cước theo địa chỉ người gửi → người nhận**
- Chọn tỉnh/thành (34 tỉnh, thành sau sắp xếp 2025) + địa chỉ cụ thể + khu vực (phường / xã – vùng xa) cho cả người gửi và người nhận; nút **Vị trí hiện tại** tự điền.
- Địa chỉ được định vị qua OpenStreetMap để tính **km thực tế**; không định vị được thì tính theo trung tâm tỉnh. Tắt bằng cách đặt ô "Định vị địa chỉ" = 0.
- Công thức: (giá kg đầu + kg tiếp × giá/kg) × hệ số vùng (nội tỉnh / nội vùng / liên vùng / liên miền theo km) + phụ phí xã/vùng xa + phụ phí km vượt nội tỉnh. Khối lượng tính cước = max(cân thực, D×R×C ÷ 6000).
- Chỉnh mọi hệ số ở Cài đặt trang → **Cách tính cước (theo địa chỉ)**; mỗi dịch vụ trong Bảng giá có thêm ô **Phạm vi tối đa (km)**. Nút Đặt giao hàng gửi kèm `?from=&to=&weight=&service=`.

**SEO**
- Một thẻ H1 cố định (tên + khẩu hiệu), tiêu đề slide dùng H2; ảnh banner có alt, width/height (chống nhảy bố cục), ảnh đầu `fetchpriority=high`, ảnh sau chỉ tải khi sắp hiện.
- JSON-LD Organization + WebSite + danh mục dịch vụ (OfferCatalog); Open Graph/Twitter có ảnh 1200×630; robots chặn `/admin` và `/api/`.
- Nhớ đặt `NEXT_PUBLIC_SITE_URL` trong `.env.local` đúng tên miền thật (canonical, sitemap, Open Graph dùng giá trị này).
- Nâng Next.js lên 14.2.35 (vá lỗ hổng bảo mật 12/2025).

## Bản nâng cấp V4
- **Khối "Những tính năng nổi trội"**: thay khung điện thoại trơn bằng màn hình ứng dụng mô phỏng (thanh trạng thái, logo, ô tra mã vận đơn, thẻ đơn đang giao có tuyến đường chạy, 4 nút nhanh, voucher lấy từ banner, thanh điều hướng) + 2 nhãn nổi. Thuần HTML/CSS, có chế độ tối. File: `components/AppPhone.js`.
- **Google Maps** (không cần API key): mỗi ô Người gửi/Người nhận có link "Xem trên Google Maps"; kết quả có "Chỉ đường trên Google Maps" và nút "Xem tuyến đường trên bản đồ" (bản đồ nhúng chỉ tải khi bấm). Mục Liên hệ có link chỉ đường + bản đồ văn phòng.
- **Thư viện video** (mục riêng `#videos`): trình phát bên trái, bên phải là danh sách video có ảnh thu nhỏ + ô tìm kiếm (gõ có dấu/không dấu, Enter để phát kết quả đầu). Thêm video ở Cài đặt trang → Video YouTube (có ô Mô tả & Ngày đăng cho SEO – dữ liệu cấu trúc VideoObject).
- **Hiệu ứng cuộn toàn site**: trồi lên / trượt trái-phải / phóng to / hiện lần lượt, gạch chân tiêu đề tự kéo dài, thanh tiến trình cuộn, header thu gọn khi cuộn, banner trôi chậm (parallax). Nội dung chỉ bị ẩn để chạy hiệu ứng khi trình duyệt có JS; Google/bot và người bật "giảm chuyển động" luôn thấy đầy đủ nội dung.
  Dùng cho phần tử mới: thêm class `rv`, `rv-l`, `rv-r`, `rv-z` hoặc `rv-s` (cho nhóm phần tử con).

## Bản nâng cấp V5
- **Tin tức mới nhất** gọn hơn: thẻ nhỏ (4 thẻ/hàng trên máy tính, ảnh 16:9), tiêu đề & mô tả tối đa 2 dòng; bài chưa có ảnh hiện nền gradient + logo. (Sửa lỗi ảnh tin tức bị biến thành khung điện thoại đen do trùng tên class.)
- **Gộp "Đặt giao hàng với chúng tôi" + "Video giới thiệu"** thành một khối: các bước (trái) · hình thức giao nhận (phải) · thư viện video bên dưới trong cùng khung. Menu "Video" vẫn nhảy đúng tới phần video.
- **Hình thức giao nhận**: rê chuột / chạm vào từng loại → bảng chi tiết bên cạnh đổi theo (mô tả, các điểm nổi bật, nút Đặt giao hàng); trên điện thoại chi tiết xổ xuống ngay dưới mục đang chọn. Sửa nội dung ở Cài đặt trang → Hình thức giao nhận → ô "Chi tiết" và "Điểm nổi bật (mỗi dòng 1 ý)".
- **Banner gọn mắt hơn**: lớp phủ đậm hơn phía chữ, ảnh dồn sang phải; nhãn + dòng phụ gộp thành 1 nhãn; vé voucher nhỏ gọn (giá trị, mã + Sao chép, hạn dùng & điều kiện 1 khối); tab nhóm và các mục nằm cùng một hàng.
- Sửa lỗi CSS khiến nhiều nút/chữ không nhận đúng cỡ chữ (`font: … inherit` không hợp lệ).

## Bản nâng cấp V6
**5 ngôn ngữ: Tiếng Việt · English · 日本語 · 한국어 · 简体中文**
- Nút chọn ngôn ngữ dạng danh sách xổ xuống (header & trang quản trị). Toàn bộ giao diện, banner, dịch vụ, bảng tính cước, hình thức giao nhận, FAQ… đã dịch sẵn sang Nhật, Hàn, Trung (`data/site.ja.json`, `site.ko.json`, `site.zh.json`, chữ giao diện trong `lib/dict.js`).
- Bài viết & trang nội dung chưa dịch sang Nhật/Hàn/Trung sẽ tạm hiện bản tiếng Anh (canonical trỏ về bản tiếng Anh nên không bị trùng lặp nội dung). Muốn dịch: Quản trị → Bài viết / Trang nội dung → chọn ngôn ngữ đích ở ô cạnh nút "Sao chép" → chuyển sang ngôn ngữ đó để dịch và đăng.
- Phông chữ riêng cho tiếng Nhật/Hàn/Trung (dùng font hệ thống, không tải thêm).

**SEO đa ngôn ngữ**
- Mỗi ngôn ngữ có URL riêng: tiếng Việt = URL gốc, ngôn ngữ khác thêm `?hl=en|ja|ko|zh` (vd `/news?hl=ja`). Google lập chỉ mục được cả 5 bản.
- Mỗi trang có `canonical` + `hreflang` (vi, en, ja, ko, zh-Hans, x-default); `<html lang>` và `og:locale` đúng ngôn ngữ; sitemap.xml khai báo đủ các bản ngôn ngữ.
- Xác minh Google Search Console / Bing: Cài đặt trang → SEO & Analytics → dán mã xác minh.

**Google Analytics 4**
- Cài đặt trang → SEO & Analytics → "Mã đo lường" (G-XXXXXXX) – hoặc `NEXT_PUBLIC_GA_ID` trong `.env.local`. Mã được kiểm tra định dạng trước khi chèn.
- Consent Mode v2 (chỉ đo lường, tắt quảng cáo), gắn ngôn ngữ (`site_language`) để lọc báo cáo theo từng thứ tiếng.
- Sự kiện chuyển đổi tự động: `track_order` (tra cứu đơn), `calc_quote` (báo giá), `begin_checkout` / `begin_booking` (bấm Đặt giao hàng), `generate_lead` (gửi form tư vấn), `select_promotion` (sao chép mã / bấm voucher), `select_service`, `video_start`, `search` (bài viết & video), `click_call`, `click_zalo`, `click_email`, `click_app_download`, `view_map`, `view_route`, `use_location`, `language_change`, `login_click`.
- Gợi ý: trong GA4 → Quản trị → Sự kiện, đánh dấu `generate_lead`, `begin_checkout`, `click_call`, `click_zalo` là **sự kiện chính (key event)**.

**Đối tác & nút tải app**
- Khối đối tác dạng thẻ đều nhau (logo xám → màu khi rê chuột). Tải logo chính thức của từng đối tác ở Cài đặt trang → Đối tác.
- Nút Google Play / App Store hai dòng ("Tải trên" + tên kho). Có thể tải biểu tượng/huy hiệu chính thức ở Cài đặt trang → Mạng xã hội & tải ứng dụng.

### Video (cập nhật)
- Thay video mẫu bằng 5 video hướng dẫn về Vietjet Air trên YouTube (đặt vé trên app & website, check-in online, hướng dẫn bay lần đầu, check-in tiếng Anh). Tiêu đề/mô tả đã viết sẵn cho cả 5 ngôn ngữ.
- Một số video là của kênh bên ngoài, không phải kênh chính thức của Vietjet – nên xem lại và thay bằng video từ kênh chính thức Vietjet (youtube.com/@VietjetOfficial) hoặc video của chính Swift247 khi có: Cài đặt trang → Video YouTube.

## Bản nâng cấp V7.2
- **Bỏ dòng mô tả** dưới tiêu đề "Khuyến mãi đang diễn ra" và "Dịch vụ của chúng tôi" (trang chủ).
- **Thẻ dịch vụ gọn**: chỉ còn ẢNH (khung 4:3, lớn hơn trước) + TÊN dịch vụ + "Tìm hiểu thêm". Toàn bộ thông tin (thời gian giao, mô tả, điểm nổi bật, nút đặt hàng, nội dung chi tiết) chuyển sang **trang chi tiết riêng `/dich-vu/<slug>`**.
  - Quản trị: Cài đặt trang → Dịch vụ → các ô mới **Đường dẫn**, **Nội dung chi tiết** (mỗi dòng 1 đoạn), **Tiêu đề SEO**, **Mô tả SEO**. Ảnh thẻ nên tỉ lệ 4:3 (vd 1200×900).
  - SEO: 1 thẻ H1, title/description riêng, canonical + hreflang 5 ngôn ngữ, Open Graph/Twitter, JSON-LD `Service` + `BreadcrumbList`, breadcrumb, liên kết nội bộ "Dịch vụ khác"; các trang này đã có trong `sitemap.xml` (sitemap nay tạo động nên bài/dịch vụ mới xuất hiện ngay).
- **Tin tức mới nhất**: thẻ chỉ còn ẢNH + LOẠI TIN + TIÊU ĐỀ; ảnh hiển thị **trọn vẹn, không bị cắt** (khung vuông, ảnh khác tỉ lệ nằm trên nền mờ của chính ảnh). Áp dụng cho trang chủ, /news và "Bài viết liên quan".
- **"Những tính năng nổi trội"** chuyển xuống ngay sau mục Tin tức (link menu `/#about` vẫn đúng).
- **Google Analytics 4** – sự kiện mới: `select_service` (bấm thẻ dịch vụ), `select_content` (content_type=news, bấm tin tức), `view_item` (mở trang chi tiết dịch vụ), `begin_booking` (location=service_page), `click_consult`. Các sự kiện có `content_type`, `item_id`, `link_url` để lập báo cáo. Chỉ cần đặt mã `G-…` ở `.env.local` (NEXT_PUBLIC_GA_ID) hoặc Cài đặt trang → Google Analytics.

## Bản nâng cấp V7.3
- **Tin tức**: mỗi hàng 3 thẻ trên máy tính (2 thẻ trên máy tính bảng, 1 thẻ trên điện thoại) – ảnh lớn hơn, tiêu đề cỡ chữ to hơn và thoáng hơn. Áp dụng cho trang chủ, /news, chuyên mục và "Bài viết liên quan". Trang chủ hiện 6 tin = 2 hàng đầy đủ.

## Bản nâng cấp V7.4 – Rà soát & quản lý bài viết
**Trang Rà soát bài viết** (`/admin/audit`, nút "Rà soát bài viết" trên thanh quản trị):
- Thống kê: tổng số bài, đã đăng, nháp, bài đầy đủ, bài cần bổ sung, điểm SEO trung bình; số bài theo từng ngôn ngữ. Bấm vào ô thống kê để lọc nhanh.
- **Phân loại theo chuyên mục**: bảng số bài / đã đăng / nháp / đầy đủ / cần bổ sung / SEO trung bình của từng chuyên mục (bấm dòng để lọc).
- **Lọc bài còn thiếu** (17 mục, chia nhóm Nội dung · SEO · Hình ảnh · Khác), mỗi mục hiện số bài đang thiếu: ảnh bìa, alt ảnh bìa, ảnh trong bài, alt ảnh trong bài, sapo, nội dung quá ngắn, H2, liên kết nội bộ, tiêu đề SEO, độ dài tiêu đề SEO, mô tả SEO, độ dài mô tả SEO, từ khóa chính, điểm SEO thấp, chuyên mục không hợp lệ, trùng tiêu đề, chưa dịch đủ ngôn ngữ. Chọn nhiều mục: thiếu *bất kỳ* hoặc thiếu *tất cả*.
- **Tìm kiếm** có dấu/không dấu, chọn phạm vi: tất cả, tiêu đề, nội dung, sapo, tiêu đề SEO, mô tả SEO, từ khóa, slug, alt ảnh bìa (hiện đoạn trích chứa từ khóa). Lọc theo chuyên mục, trạng thái (đã đăng / nháp / noindex); sắp xếp theo ngày, số mục thiếu, điểm SEO, số từ, tên.
- **Xuất Excel (CSV)** danh sách đang lọc. Mỗi dòng có nút Sửa / Xem bài.

**Cài đặt trang → nhóm mới "Bài viết & tin tức"**:
- *Trang Tin tức & bài viết*: tiêu đề + mô tả SEO + đoạn giới thiệu trang Tin tức, số bài mỗi trang, số tin ở trang chủ, số bài liên quan, bật/tắt mục lục – nút chia sẻ – thời gian đọc – khung "Đặt giao hàng / Tư vấn" cuối bài, ngưỡng rà soát (số từ tối thiểu, điểm SEO tối thiểu).
- *Chuyên mục bài viết*: thêm / đổi tên / xóa chuyên mục, mô tả chuyên mục (hiện trên /news?cat=… và dùng làm meta description). Mã chuyên mục đặt ở bản tiếng Việt; ngôn ngữ khác chỉ dịch tên theo cùng mã. Đổi mã hoặc xóa chuyên mục → bài cũ hiện cảnh báo "Chuyên mục không hợp lệ" trong trang Rà soát để sửa lại.

## Bản nâng cấp V7.5 – Bật / tắt ngôn ngữ
- **Cài đặt trang → Cài đặt chung → "Ngôn ngữ website"**: tích chọn ngôn ngữ muốn hiện (VI · EN · JA · KO · ZH). Tiếng Việt là ngôn ngữ gốc nên luôn bật. Bấm "Lưu mục này" là áp dụng ngay cho mọi ngôn ngữ.
- Ngôn ngữ đang tắt: ẩn khỏi nút chọn ngôn ngữ; bỏ khỏi sitemap, hreflang, Open Graph, dữ liệu cấu trúc; link cũ `?hl=…` chuyển (307) về bản tiếng Việt, giữ nguyên các tham số khác; khách đã lưu cookie ngôn ngữ đó sẽ xem tiếng Việt; ngôn ngữ dự phòng (bài tiếng Anh hiện ở JA/KO/ZH) cũng tắt theo nếu tiếng Anh bị tắt.
- Trang quản trị vẫn chọn được mọi ngôn ngữ (có nhãn **“đang tắt”**) để dịch trước rồi bật sau; nội dung không bị xóa. Trang Rà soát chỉ tính "Chưa dịch đủ ngôn ngữ" theo các ngôn ngữ đang bật.
- Chỉ còn 1 ngôn ngữ → nút chọn ngôn ngữ trên website tự ẩn.

## Bản nâng cấp V7.6
- **Rà soát bài viết**: bấm vào ô thống kê (Tổng số bài, Đã đăng, Bản nháp, Đầy đủ, Cần bổ sung, Điểm SEO TB) hoặc một dòng chuyên mục → trang tự lướt xuống danh sách kết quả. Khi chọn các nút "Bài viết còn thiếu" có nút nổi **“Xem N bài khớp ↓”**.
- **Mục kiểm tra tùy chỉnh**: Cài đặt trang → Bài viết & tin tức → **Mục kiểm tra khi rà soát** (dùng chung mọi ngôn ngữ). Thêm / xóa / sửa / sắp xếp / Bật-Tắt từng mục; mỗi mục gồm Tên hiển thị (`{n}` = giá trị), Nhóm, Loại kiểm tra, Trường áp dụng, Giá trị. Có nút **Khôi phục mặc định** (17 mục ban đầu).
  - 19 loại kiểm tra: trường còn trống, độ dài trường ngoài khoảng, ít/nhiều hơn N từ, chưa có H2, ít hơn N ảnh, ảnh thiếu alt, ít hơn N liên kết nội bộ / liên kết ngoài, điểm SEO dưới N, tiêu đề SEO thiếu từ khóa, chuyên mục không hợp lệ, trùng tiêu đề, chưa dịch đủ, lâu chưa cập nhật (N ngày), có chứa / không chứa cụm từ (vd tìm bài còn ghi "63 tỉnh"), bản nháp, noindex.
- Link `/admin/site#ten-muc` mở thẳng mục cài đặt tương ứng.

## Bản nâng cấp V7.7
- Trang quản trị (Bài viết, Rà soát, Trang nội dung, Khách liên hệ, Cài đặt trang, trang soạn bài) dùng **toàn bộ chiều ngang màn hình** thay vì dồn giữa.
- Cài đặt trang: menu bên trái rộng hơn, cao hết màn hình; khung bên phải chiếm phần còn lại, các ô nhập tự dàn 2–4 cột theo độ rộng màn hình (ô nhiều dòng, ảnh vẫn chiếm cả hàng).
- V7.8: các mục cài đặt dạng khối (Ngôn ngữ website, ô nhiều dòng, nhiều ảnh) chiếm hết chiều ngang khung bên phải; 5 thẻ ngôn ngữ dàn đều trên một hàng.

## Bản nâng cấp V7.9 – Nháp, phiên bản, xem trước & Public
**Trang soạn bài** (thanh nút dưới cùng):
- **Xem trước**: mở tab mới hiển thị bài *đúng như trên website* (cùng giao diện, mục lục, ảnh, khung kêu gọi…) **và như trên Google** (tiêu đề, đường dẫn, mô tả) – dùng ngay nội dung đang gõ, không cần lưu. Bản xem trước tạm tự xóa sau 6 giờ; trang xem trước có `noindex`, khách không truy cập được.
- **Lưu bản nháp**: mỗi lần lưu tạo **1 phiên bản mới** (#1, #2, #3…), không ghi đè bản cũ. Nếu nội dung không đổi thì không tạo bản trùng. Tối đa 50 phiên bản/bài (tự bỏ bản cũ nhất, không bao giờ bỏ bản đang đăng).
- **Public**: đăng nội dung đang sửa lên trang chính thức (có hỏi xác nhận). Bài đang Public **chỉ thay đổi trên website khi bấm Public** – lưu nháp không ảnh hưởng khách.
- **Gỡ xuống nháp**: ẩn bài đang Public khỏi website.
- **Lịch sử phiên bản**: xem thời gian lưu, phiên bản nào đang đăng / mới nhất; Mở để sửa tiếp, Xem trước, Xóa từng phiên bản; trong trang xem trước của một phiên bản có nút **Public phiên bản này** (dùng để khôi phục bản cũ).
- Trạng thái bài: **Nháp** · **Public** · **Public · có bản nháp chưa đăng** (hiện ở danh sách bài và đầu trang soạn).
- Phiên bản lưu riêng ở `data/revisions/<ngôn ngữ>/<id>.json` (không làm nặng posts.json); bản xem trước tạm ở `data/previews/`.

**Cài đặt trang → Bài viết & tin tức → Dọn dẹp bản nháp & phiên bản**: thống kê số bài nháp, bài có bản chờ đăng, số phiên bản & dung lượng; nút **Xóa phiên bản cũ** (giữ bản đang đăng + mới nhất), **Xóa bản chờ đăng của bài Public**, **Dọn file tạm**; danh sách bài nháp chưa từng đăng (mọi ngôn ngữ) với nút Sửa / Xem trước / **Xóa từng bài**, **Xóa bài đã chọn**, **Xóa tất cả bài nháp**. Bài đang Public và bản đang hiển thị không bao giờ bị xóa ở đây.

## Bản nâng cấp V8.0 – Từ khóa theo dữ liệu thật của Google
Trong trang soạn bài, dưới ô **Từ khóa chính**:
1. **Gợi ý từ Google** – lấy các cụm từ người dùng thật hay gõ (Google Autocomplete), theo ngôn ngữ đang soạn, mở rộng thêm các dạng “… giá”, “… là gì”, “… ở đâu”, “cách …”. Bấm 1 gợi ý để dùng làm từ khóa chính. *Lưu ý: Google không công bố lượng tìm kiếm cho gợi ý; đây là dịch vụ gợi ý công khai, không phải API chính thức nên có thể bị giới hạn nếu gọi quá nhiều (kết quả được lưu đệm 24 giờ).*
2. **Từ khóa thật (Search Console)** – với bài đã Public: bảng các truy vấn mà bài đang có lượt hiển thị trên Google trong 28 ngày (lượt bấm, lượt hiển thị, CTR, vị trí trung bình), bấm **Dùng** để chọn làm từ khóa chính. Dữ liệu lưu đệm 1 giờ.
3. Link nhanh **Google Trends** (so sánh độ phổ biến) và **Keyword Planner** (lượng tìm kiếm hằng tháng).

**Làm rõ điểm SEO**: đổi tên thành **“Điểm tối ưu SEO”** kèm ghi chú: chấm theo quy tắc SEO phổ biến, *không phải điểm Google chấm*; mật độ từ khóa và số từ là khuyến nghị chung. Đã **bỏ thẻ `meta keywords`** (Google bỏ qua thẻ này) ở trang bài viết và trang nội dung.

### Kết nối Google Search Console (khoảng 10 phút, làm 1 lần)
1. Xác minh tên miền trong [Search Console](https://search.google.com/search-console) (có thể dùng ô *mã xác minh* ở Cài đặt trang → SEO & Analytics).
2. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo dự án → **APIs & Services → Library** → bật **Google Search Console API**.
3. **IAM & Admin → Service Accounts → Create service account** → vào tài khoản vừa tạo → **Keys → Add key → JSON** → tải file JSON về.
4. Trong Search Console → **Cài đặt → Người dùng và quyền → Thêm người dùng**: nhập email `…@….iam.gserviceaccount.com` của service account, quyền **Bị hạn chế** (chỉ đọc) là đủ.
5. Mở `.env.local`, thêm `GSC_CREDENTIALS='…nội dung file JSON trên 1 dòng…'`, khởi động lại website.
6. Cài đặt trang → SEO & Analytics → **Search Console – thuộc tính**: nhập `sc-domain:tenmien.vn` (thuộc tính miền) hoặc `https://tenmien.vn/` (thuộc tính tiền tố URL) – phải đúng loại đã xác minh ở bước 1.
Khóa bí mật chỉ nằm trên máy chủ (`.env.local`), không lưu trong dữ liệu website hay file sao lưu.

## Bản nâng cấp V8.1 – Phân biệt rõ 2 loại bản nháp
- Trang **Bài viết** có các nút lọc kèm số lượng: **Tất cả** · **Nháp – chưa từng đăng** · **Đã Public · có bản nháp chờ đăng** · **Public**.
- Bài có bản nháp chờ đăng hiện thêm dòng “Đang hiển thị: bản #… · Nháp mới nhất: #… (thời gian lưu)”.
- Mỗi dòng có nút 👁 **Xem trước bản nháp** (bài nháp, hoặc bản nháp mới nhất của bài đã Public) và ↗ **Xem bài đang hiển thị** (bài đã Public).
- Bài bị “Gỡ xuống nháp” hiện là **Nháp – đã gỡ khỏi website** để không nhầm với bài chưa từng đăng.

## Nhập dữ liệu WordPress (swift247.sql)
- Đã nạp từ file `swift247.sql` (WordPress + Polylang + Yoast): **243 bài tiếng Việt** (227 đăng, 16 nháp) vào `data/posts.json`, **12 bài tiếng Anh** (9 đăng) vào `data/posts.en.json`, **11 trang VI + 6 trang EN** vào `data/pages*.json`. Bài/trang/cài đặt sẵn có của website giữ nguyên.
- Mỗi bản ghi nhập có `id` dạng `wp<ID>` và `"source": "wordpress"`. Bài có bản dịch (Polylang) dùng chung id → nút đổi ngôn ngữ nhảy đúng bản dịch.
- Giữ: tiêu đề, slug, ngày đăng/cập nhật, ảnh đại diện + alt, tiêu đề SEO / mô tả SEO / từ khóa chính (Yoast). Bảng TablePress và FAQ (WPSM Accordion) được chuyển thành HTML. Link nội bộ cũ `swift247.vn/<slug>/` → `/post/<slug>` hoặc `/p/<slug>`.
- Chuyên mục WP → chuyên mục hiện có: Khuyến mãi → `khuyen-mai`; bài có "hướng dẫn/cách/lưu ý…" → `huong-dan`; Thông tin, CPN trong nước → `van-chuyen`; Tin tức–Sự kiện, News, Tuyển dụng… → `cong-ty`.
- Nhập dạng **nháp** (không hiện ra ngoài, xem lại trong admin): bài Nhận xét khách hàng & Hình ảnh (bài phụ của theme cũ); trang trùng nội dung trang đang có (tiêu đề `[WP] …`, slug `…-wp`); trang dựng bằng bố cục theme cũ (Về chúng tôi, Hỗ trợ, About us, Support).
- Ảnh vẫn trỏ về `https://swift247.vn/wp-content/uploads/…`. Nếu đưa website này lên tên miền swift247.vn thì cần chép thư mục `wp-content/uploads` lên kho ảnh/CDN rồi chạy lại: `python3 tools/import-wp.py swift247.sql --media-base https://<kho-anh>/uploads/` (cần `pip install phpserialize`). Lệnh chỉ thay các bản ghi `wp…` và tự sao lưu vào `data/backup-before-wp-import-*/`, nhưng sẽ ghi đè các bài `wp…` đã sửa trong admin.

## Dùng MySQL thay cho file JSON
Khi `.env.local` có `MYSQL_DATABASE`, website đọc và ghi toàn bộ nội dung trong MySQL; không có thì dùng file JSON trong `data/` như cũ.
- **Bảng** (tự tạo trong database `swift247`, nằm cạnh các bảng `wp_*` của WordPress và không đụng tới chúng):
  `web_posts` (bài viết, 1 dòng = 1 bài của 1 ngôn ngữ), `web_pages` (trang nội dung), `web_kv` (cài đặt trang `site*.json`, khách liên hệ `leads.json`, phiên bản nháp `revisions/…`, bản xem trước `previews/…`). Ảnh tải lên vẫn ở `data/uploads/`.
- **Lần đầu:** điền `MYSQL_USER` / `MYSQL_PASSWORD` trong `.env.local` → `npm install` → `npm run db:check` (thử kết nối, tạo bảng) → `npm run db:import` (chép dữ liệu từ `data/` vào MySQL; đã có dữ liệu thì phải thêm `-- --force` mới ghi đè) → `npm run build` → `npm start`.
- **Hoạt động:** khi server khởi động, dữ liệu được nạp từ MySQL vào bộ nhớ; mọi lần Lưu/Public/Xóa trong admin ghi xuống MySQL ngay. Sửa trực tiếp trong MySQL Workbench thì website tự nhận sau tối đa `MYSQL_REFRESH_SECONDS` giây (mặc định 5).
- **MySQL tắt / sai mật khẩu:** server vẫn chạy, cứ 5 giây thử kết nối lại (xem log `[mysql]`); trong lúc đó website tạm hiển thị dữ liệu từ file JSON và **không cho lưu** trong admin (báo lỗi rõ ràng) để tránh lệch dữ liệu.
- **Sao lưu:** `npm run db:export` xuất toàn bộ dữ liệu trong MySQL ra thư mục `data-export-<thời gian>/` (cùng định dạng `data/`). Hoặc dùng Workbench → Server → Data Export.
- Trong Workbench, ngày giờ ở cột `date` / `updated` là giờ UTC (giờ Việt Nam = UTC + 7). Trường lạ hoặc giá trị không vừa cột được giữ trong cột `extra` (JSON).

## Bản nâng cấp V10
**Bố cục banner trang chủ kéo – thả** (Cài đặt trang → Nội dung trang chủ → **Bố cục banner (kéo – thả)**)
- Khung chỉnh hiển thị đúng banner thật; mỗi phần là 1 ô có số và màu: ① Ô tra cứu đơn hàng · ② Huy hiệu · ③ Tiêu đề lớn · ④ Mô tả / Vé voucher · ⑤ Điểm nổi bật · ⑥ Nút bấm · ⑦ Tab nhóm · ⑧ Thanh chọn slide (bảng "Chú thích các ô" giải thích từng ô và nơi sửa nội dung).
- **Kéo** ô để đổi chỗ (khung xanh = đặt được, đỏ = đè lên ô khác), **kéo góc phải dưới** để đổi kích thước theo lưới 12 cột, **nhấp đúp** để nhảy tới đúng ô nhập nội dung của phần đó (ô được tô sáng, có nút "Quay lại"). Nhấp đúp vào nền trống → sửa ảnh nền.
- Chọn 1 ô để chỉnh: **to / nhỏ** 50–200% (chữ và chi tiết phóng theo), rộng / cao, căn chữ trái – giữa – phải, vị trí trên – giữa – dưới, **ẩn ô**, **ẩn trên điện thoại**. Phím mũi tên dời ô, Shift + mũi tên đổi kích thước. Có Hoàn tác, Về bố cục gốc, Xem trên điện thoại.
- Chọn "Xem slide" để xem và chỉnh khi đang hiện banner khuyến mãi. Bố cục dùng chung cho mọi ngôn ngữ; trên điện thoại các ô tự xếp 1 cột theo thứ tự trên → dưới, trái → phải.
- Chưa lưu bố cục (hoặc bấm "Về bố cục gốc" rồi Lưu) → trang chủ giữ nguyên bố cục gốc.

**Nút gọi / Zalo nổi**: nhấn giữ và kéo để dời chỗ (máy tính & điện thoại), vị trí được nhớ trên máy; nhấp đúp vào khoảng trống cạnh nút để về chỗ cũ. Trong trang quản trị nút mặc định nằm cao hơn để không che thanh nút Lưu / Public.

**Trang xem trước bài viết**: bỏ thanh tiến trình đọc ở mép trên.
