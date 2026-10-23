import {ArrowRight} from 'lucide-react';import {D} from '@/lib/dict';import {withHl} from '@/lib/i18n';
// ===== Mục "Dịch vụ của chúng tôi" (trang chủ) =====
// Thẻ gọn: chỉ ẢNH + TÊN dịch vụ – dành tối đa không gian cho ảnh. Toàn bộ thông tin (mô tả, thời gian, điểm nổi bật, nút đặt hàng)
// nằm ở trang chi tiết /dich-vu/<slug> (nút "Tìm hiểu thêm"), tốt cho SEO vì mỗi dịch vụ có 1 URL riêng.
export default function Services({items=[],lang='vi'}){const t=D[lang]||D.vi;
 return(<div className="svs rv-s">{items.map(x=>{const href=withHl(x.url,lang);
  return(<article key={x.k} className="sv2" aria-labelledby={'sv-'+x.k}>
   <a className="sv2-m" href={href} tabIndex={-1} aria-hidden="true" data-ga="select_service" data-ga-type="service" data-ga-label={x.title}>{x.img?<img src={x.img} alt={x.alt||x.title} loading="lazy" decoding="async" width="800" height="600"/>:<span className="sv2-ph"/>}</a>
   <div className="sv2-b"><h3 id={'sv-'+x.k}><a href={href} data-ga="select_service" data-ga-type="service" data-ga-label={x.title}>{x.title}</a></h3>
    <a className="sv2-l" href={href} data-ga="select_service" data-ga-type="service" data-ga-label={x.title} aria-label={t.svcMore+': '+x.title}>{t.svcMore}<ArrowRight size={15}/></a></div>
  </article>)})}</div>)}
