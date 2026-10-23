import Link from 'next/link';import {cats} from '@/lib/db';import {D} from '@/lib/dict';
// Thẻ tin tức: chỉ ẢNH (hiện TRỌN ảnh, không cắt – ảnh khác tỉ lệ được đặt trên nền mờ của chính ảnh đó) + LOẠI TIN + TIÊU ĐỀ.
export default function Cards({posts,lang='vi'}){const C=cats(lang);return(<div className="grid rv-s">{posts.map(p=>(<Link key={p.id} href={`/post/${p.slug}`} className="card" data-ga="select_content" data-ga-type="news" data-ga-label={p.title}>
 {p.cover?<span className="cv" style={{'--bg':`url(${JSON.stringify(p.cover)})`}}><img src={p.cover} alt={p.coverAlt||p.title} loading="lazy" decoding="async" width="600" height="600"/></span>:<span className="cv ph"/>}
 <div><span className="tag">{C[p.cat]}</span><h3>{p.title}</h3></div></Link>))}{!posts.length&&<p>{(D[lang]||D.vi).noPosts}</p>}</div>)}
