import {redirect} from 'next/navigation';import Link from 'next/link';import {all,cats,SITE} from '@/lib/db';import {getLang} from '@/lib/lang';import {isAdmin} from '@/lib/auth';import {saveDraft,publishPost,unpublishPost,previewDraft,delRevision} from '@/lib/actions';import {revs,getRev,stateOf} from '@/lib/revisions';import PostForm from '@/components/PostForm';import AdminNav from '@/components/AdminNav';import {Eye,Pencil,Trash2,ExternalLink} from 'lucide-react';
export const dynamic='force-dynamic';export const metadata={robots:{index:false},title:'Soạn bài viết'};
// ===== Soạn bài: Nháp → Lưu bản nháp (mỗi lần lưu = 1 phiên bản mới) → Xem trước → Public =====
const MSG={saved:r=>`Đã lưu thành phiên bản #${r} (bản nháp – khách chưa thấy). Bấm “Xem trước” để kiểm tra, rồi “Public” để đăng.`,same:r=>`Không có thay đổi so với phiên bản #${r} – không tạo bản mới.`,published:r=>`Đã Public phiên bản #${r} – bài đang hiển thị trên website.`,unpublished:()=>'Đã gỡ bài xuống Nháp – khách không còn thấy bài này.',revdel:()=>'Đã xóa phiên bản.',err:()=>'Không thực hiện được – phiên bản không tồn tại.'};
const fmt=d=>new Date(d).toLocaleString('vi-VN');
export default function E({searchParams:sp}){if(!isAdmin())redirect('/admin/login');const lang=getLang(),live=all(lang).find(x=>x.id===sp.id),st=stateOf(live,lang),R=live?revs(lang,live.id):[];
 // Nội dung mở trong form: phiên bản được chọn (?rev=) › bản nháp mới nhất chưa đăng › bản đang đăng
 const pickRev=sp.rev?getRev(lang,sp.id,sp.rev):(st.k==='pending'?st.last:null),item=live?{...live,...(pickRev?pickRev.data:{})}:{},openRev=pickRev?pickRev.rev:(live&&live.pubRev)||(R.length?R[R.length-1].rev:0);
 const ok=sp.ok&&MSG[sp.ok];
 return(<div className="adm wrap wide"><AdminNav cur="posts"/>
  {ok&&<p className={sp.ok==='err'?'warn':'ok'} role="status">{MSG[sp.ok](sp.rev)}</p>}
  {live&&<div className="ps"><span className={'chip st-'+st.k}>{st.t}</span>
   <small>{pickRev?<>Đang sửa <b>phiên bản #{pickRev.rev}</b> (lưu lúc {fmt(pickRev.at)})</>:<>Đang sửa {live.status==='published'?'bản đang đăng':'bản nháp hiện tại'}</>}{live.pubRev?<> · Bản đang hiển thị trên website: <b>#{live.pubRev}</b></>:''}</small>
   {live.status==='published'&&<a className="btn g" href={`/post/${live.slug}`} target="_blank" rel="noopener"><ExternalLink size={14}/> Xem bài đang đăng</a>}</div>}
  {R.length>0&&<details className="rh" open={!!sp.rev}><summary>Lịch sử phiên bản ({R.length}) – mỗi lần “Lưu bản nháp” tạo 1 bản mới, không ghi đè bản cũ</summary><div className="tw"><table><thead><tr><th>#</th><th>Lưu lúc</th><th>Tiêu đề</th><th>Trạng thái</th><th></th></tr></thead><tbody>
   {[...R].reverse().map(r=>{const isPub=live.status==='published'&&r.rev===live.pubRev,isLast=r.rev===R[R.length-1].rev;return(<tr key={r.rev} className={r.rev===openRev?'cur':''}><td><b>#{r.rev}</b></td><td>{fmt(r.at)}</td><td>{r.data.title}</td>
    <td>{isPub&&<span className="chip st-public">Đang đăng</span>} {isLast&&<span className="chip st-pending">Mới nhất</span>} {r.rev===openRev&&<span className="chip">Đang mở</span>}</td>
    <td><div className="acts"><Link className="btn g" href={`/admin/edit?id=${live.id}&rev=${r.rev}`} title="Mở phiên bản này để sửa tiếp"><Pencil size={13}/> Mở</Link><a className="btn g" href={`/admin/preview?id=${live.id}&rev=${r.rev}`} target="_blank" rel="noopener"><Eye size={13}/> Xem trước</a>
     {!isPub&&<form action={delRevision}><input type="hidden" name="lang" value={lang}/><input type="hidden" name="id" value={live.id}/><input type="hidden" name="rev" value={r.rev}/><button className="btn r" title="Xóa phiên bản này"><Trash2 size={13}/></button></form>}</div></td></tr>)})}
  </tbody></table></div></details>}
  <PostForm key={lang+(live?live.id:'new')+(sp.rev||'')+(sp.ok||'')} kind="post" item={item} lang={lang} cats={cats(lang)} siteUrl={SITE} state={st.k}
   actions={{save:saveDraft,publish:publishPost,unpublish:unpublishPost,preview:previewDraft}}/></div>)}
