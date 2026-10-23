import {redirect} from 'next/navigation';import Link from 'next/link';import {isAdmin} from '@/lib/auth';import {getLang} from '@/lib/lang';import {all,cats,SITE} from '@/lib/db';import {getRev,getPreview,stateOf} from '@/lib/revisions';import {publishRev} from '@/lib/actions';import {autoDesc,cut,analyze,grade} from '@/lib/seo';import PostArticle from '@/components/PostArticle';
export const dynamic='force-dynamic';export const metadata={robots:{index:false,follow:false},title:'Xem trước bài viết'};
// ===== Xem trước bài viết đúng như trên website + như trên Google, trước khi Public =====
// /admin/preview?t=<mã>          : nội dung đang gõ (chưa lưu) – từ nút "Xem trước" trong trang soạn bài
// /admin/preview?id=<id>&rev=<n> : một phiên bản đã lưu (lịch sử phiên bản)
export default function Preview({searchParams:sp}){if(!isAdmin())redirect('/admin/login');
 let lang=getLang(),id=sp.id||'',data=null,label='',rev=0;
 if(sp.t){const t=getPreview(sp.t);if(t){lang=t.l||lang;id=t.id||'';data=t.data;label='Nội dung đang chỉnh sửa (chưa lưu)'}}
 else if(id&&sp.rev){const r=getRev(lang,id,sp.rev);if(r){data=r.data;rev=r.rev;label=`Phiên bản #${r.rev} – lưu lúc ${new Date(r.at).toLocaleString('vi-VN')}`}}
 else if(id){const p0=all(lang).find(x=>x.id===id);if(p0){data=p0;label=p0.status==='published'?'Bản đang đăng':'Bản nháp hiện tại'}}
 if(!data)return(<div className="adm wrap"><p className="warn">Không tìm thấy bản xem trước (có thể đã hết hạn hoặc đã bị xóa). <Link href="/admin">← Về danh sách bài</Link></p></div>);
 const live=all(lang).find(x=>x.id===id),st=stateOf(live,lang),p={...live,...data,id,date:live&&live.status==='published'?live.date:undefined,updated:undefined},
  host=SITE.replace(/^https?:\/\//,'').replace(/\/$/,''),T=p.seoTitle||p.title||'(chưa có tiêu đề)',Dd=p.seoDesc||p.excerpt||autoDesc(p.content||'',160),url=`${SITE}/post/${p.slug||'duong-dan'}`,score=analyze(p,host).score,isLive=live&&live.status==='published'&&rev&&live.pubRev===rev;
 return(<>
  <div className="pv-bar" role="region" aria-label="Thanh xem trước">
   <span className="pv-tag">XEM TRƯỚC</span><span className="pv-l"><b>{label}</b><small>Trạng thái bài: {st.t}{isLive?' · đây là bản đang hiển thị':''} · khách chưa thấy trang này</small></span>
   <span className={'chip '+grade(score)[1]}>SEO {score}/100</span>
   {id&&<Link className="btn g" href={`/admin/edit?id=${id}${rev?'&rev='+rev:''}`}>← Quay lại sửa</Link>}
   {id&&rev>0&&!isLive&&<form action={publishRev}><input type="hidden" name="lang" value={lang}/><input type="hidden" name="id" value={id}/><input type="hidden" name="rev" value={rev}/><button className="btn">Public phiên bản này</button></form>}
   {sp.t&&<span className="pv-n">Muốn đăng? Quay lại trang sửa, bấm <b>Lưu bản nháp</b> hoặc <b>Public</b>.</span>}
  </div>
  <section className="pv-g wrap" aria-label="Xem trước trên Google"><h2>Hiển thị trên Google</h2>
   <div className="serp d"><div className="su"><span className="sf">{(host||'D')[0].toUpperCase()}</span><span><b>{host}</b><small>{url}</small></span></div><div className="st">{cut(T,60)}</div><div className="sd">{cut(Dd,160)}</div></div>
   {p.noindex&&<p className="warn">Bài đang đặt <b>noindex</b> – Google sẽ không hiển thị bài này.</p>}
  </section>
  <article className="art pv-art"><PostArticle p={p} lang={lang} url={url}/></article></>)}
