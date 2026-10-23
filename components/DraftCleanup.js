'use client';import {useState,useTransition} from 'react';import {useRouter} from 'next/navigation';import {Trash2,Loader2,Pencil,Eye} from 'lucide-react';import {LANG_SHORT} from '@/lib/dict';
// ===== Cài đặt trang → Bài viết & tin tức → Dọn dẹp bản nháp & phiên bản (giảm dung lượng lưu trữ) =====
const kb=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
const fmt=d=>d?new Date(d).toLocaleString('vi-VN'):'';
export default function DraftCleanup({data,action}){const router=useRouter(),[busy,start]=useTransition(),[msg,setMsg]=useState(''),[sel,setSel]=useState([]),[stats,setStats]=useState(data.stats);
 const run=(kind,keys,ask)=>{if(!confirm(ask+'\n\nThao tác này không thể hoàn tác.'))return;start(async()=>{try{const r=await action(kind,keys);setMsg(r.msg);setStats(r.stats);setSel([]);router.refresh()}catch{setMsg('Không thực hiện được – vui lòng đăng nhập lại và thử lại.')}})};
 const D=data.drafts,all=sel.length===D.length&&D.length>0,tg=k=>setSel(s=>s.includes(k)?s.filter(x=>x!==k):[...s,k]);
 return(<div className="dc">
  <p className="sa-tip">Bản nháp và các phiên bản cũ được lưu riêng để bạn có thể quay lại khi cần. Khi không còn dùng, xóa bớt để giảm dung lượng lưu trữ. <b>Bài đang Public và bản đang hiển thị trên website không bao giờ bị xóa ở đây.</b></p>
  <div className="dc-sum"><div><b>{D.length}</b><small>Bài nháp chưa từng đăng</small></div><div><b>{data.pending.length}</b><small>Bài Public có bản nháp chờ đăng</small></div><div><b>{stats.revCount}</b><small>Phiên bản đang lưu ({kb(stats.revBytes)})</small></div><div><b>{data.oldRevs}</b><small>Phiên bản cũ có thể xóa</small></div><div><b>{stats.prevCount}</b><small>Bản xem trước tạm ({kb(stats.prevBytes)})</small></div></div>
  {msg&&<p className="ok dc-msg" role="status">{msg}</p>}
  <div className="dc-acts">
   <div className="dc-a"><p><b>Xóa phiên bản cũ</b><small>Mỗi bài chỉ giữ bản đang đăng và bản mới nhất.</small></p><button type="button" className="btn r" disabled={busy||!data.oldRevs} onClick={()=>run('old',[],`Xóa ${data.oldRevs} phiên bản cũ của tất cả bài viết?`)}><Trash2 size={15}/> Xóa phiên bản cũ</button></div>
   <div className="dc-a"><p><b>Xóa bản nháp chờ đăng của bài đang Public</b><small>Bỏ các chỉnh sửa chưa Public, giữ đúng bản đang hiển thị.</small></p><button type="button" className="btn r" disabled={busy||!data.pending.length} onClick={()=>run('pending',[],`Bỏ toàn bộ chỉnh sửa chưa đăng của ${data.pending.length} bài đang Public?`)}><Trash2 size={15}/> Xóa bản chờ đăng</button></div>
   <div className="dc-a"><p><b>Xóa bản xem trước tạm & file thừa</b><small>Bản xem trước tự xóa sau 6 giờ; nút này xóa ngay, kèm phiên bản của bài đã bị xóa.</small></p><button type="button" className="btn r" disabled={busy} onClick={()=>run('temp',[],'Xóa toàn bộ bản xem trước tạm và file thừa?')}><Trash2 size={15}/> Dọn file tạm</button></div>
  </div>
  <h3 className="au-h">Bài nháp chưa từng đăng ({D.length}) <small>– mọi ngôn ngữ</small></h3>
  {D.length?<><div className="tw"><table className="dc-list"><thead><tr><th><input type="checkbox" checked={all} onChange={()=>setSel(all?[]:D.map(x=>x.key))} aria-label="Chọn tất cả"/></th><th>Tiêu đề</th><th>Ngôn ngữ</th><th>Sửa lần cuối</th><th>Số phiên bản</th><th></th></tr></thead><tbody>
    {D.map(x=><tr key={x.key}><td><input type="checkbox" checked={sel.includes(x.key)} onChange={()=>tg(x.key)} aria-label={'Chọn '+x.title}/></td><td>{x.title}</td><td>{LANG_SHORT[x.l]}</td><td>{fmt(x.updated)}</td><td>{x.revs}</td>
     <td style={{whiteSpace:'nowrap'}}><a className="btn g" style={{padding:'5px 10px'}} href={`/admin/edit?id=${x.id}&hl=${x.l}`} title="Sửa"><Pencil size={13}/></a> <a className="btn g" style={{padding:'5px 10px'}} href={`/admin/preview?id=${x.id}&hl=${x.l}`} target="_blank" rel="noopener" title="Xem trước"><Eye size={13}/></a> <button type="button" className="btn r" style={{padding:'5px 10px'}} disabled={busy} onClick={()=>run('posts',[x.key],`Xóa bài nháp “${x.title}” và toàn bộ phiên bản?`)} title="Xóa"><Trash2 size={13}/></button></td></tr>)}
   </tbody></table></div>
   <div className="au-r"><button type="button" className="btn r" disabled={busy||!sel.length} onClick={()=>run('posts',sel,`Xóa ${sel.length} bài nháp đã chọn?`)}><Trash2 size={15}/> Xóa {sel.length||''} bài đã chọn</button><button type="button" className="btn r" disabled={busy} onClick={()=>run('posts',[],`Xóa TẤT CẢ ${D.length} bài nháp chưa từng đăng (mọi ngôn ngữ)?`)}><Trash2 size={15}/> Xóa tất cả bài nháp</button>{busy&&<span><Loader2 size={16} className="spin"/> Đang xử lý…</span>}</div></>
  :<p className="meta">Không có bài nháp nào.</p>}
 </div>)}
