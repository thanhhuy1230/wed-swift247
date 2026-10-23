'use client';
import {useState,useEffect,useMemo,useRef,useDeferredValue} from 'react';
import {CheckCircle2,AlertTriangle,XCircle,Wand2,Monitor,Smartphone,Search,RotateCcw,Save,Eye,Send,Undo2} from 'lucide-react';
import Field from './Field';import KeywordTools from './KeywordTools';import HtmlEditor from './HtmlEditor';
import {analyze,grade,slugify,autoDesc,cut} from '@/lib/seo';

// ===== Form soạn bài / trang nội dung chuẩn SEO =====
// - Tự tạo slug từ tiêu đề, đếm ký tự tiêu đề/mô tả bằng thanh màu, xem trước kết quả Google (máy tính + điện thoại)
// - Chấm điểm SEO trực tiếp khi gõ (từ khóa chính, mật độ, H2/H3, ảnh alt, liên kết nội bộ, độ dài, độ dễ đọc...)
// - Tự lưu bản nháp trong trình duyệt (khôi phục khi lỡ đóng tab), cảnh báo khi rời trang chưa lưu

const Bar=({n,lo,hi,max})=>{const p=Math.min(100,n/max*100),c=!n?'#9ca3af':n>=lo&&n<=hi?'#16a34a':n<lo?'#f59e0b':'#dc2626';return <span className="cbar" aria-hidden="true"><i style={{width:p+'%',background:c}}/></span>};
const IC={good:<CheckCircle2 size={17}/>,warn:<AlertTriangle size={17}/>,bad:<XCircle size={17}/>};

function Ring({v,lv}){const r=34,c=2*Math.PI*r;return(<svg className={'ring '+lv} viewBox="0 0 80 80" width="84" height="84" role="img" aria-label={`Điểm tối ưu SEO ${v}/100`}><circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="8"/><circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-v/100)} transform="rotate(-90 40 40)" style={{transition:'stroke-dashoffset .5s'}}/><text x="40" y="46" textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor">{v}</text></svg>)}

export default function PostForm({kind='post',action,item={},lang='vi',cats={},siteUrl='',actions=null,state='new'}){
 const fref=useRef(null),[pv,setPv]=useState(false);
 // Nút Xem trước: gửi nội dung đang gõ lên máy chủ (lưu tạm, KHÔNG tạo phiên bản) rồi mở tab xem trước
 const preview=async()=>{if(!actions)return;const w=window.open('about:blank','_blank');setPv(true);try{const t=await actions.preview(new FormData(fref.current)),u='/admin/preview?t='+t;if(w)w.location.href=u;else location.href=u}catch{if(w)w.close();alert('Không tạo được bản xem trước, vui lòng thử lại.')}finally{setPv(false)}};
 const isPost=kind==='post',base=isPost?'/post/':'/p/',host=siteUrl.replace(/^https?:\/\//,'').replace(/\/$/,'');
 const init=useMemo(()=>({title:item.title||'',slug:item.slug||'',cat:item.cat||Object.keys(cats)[0]||'',cover:item.cover||'',coverAlt:item.coverAlt||'',excerpt:item.excerpt||'',content:item.content||'',keyword:item.keyword||'',seoTitle:item.seoTitle||'',seoDesc:item.seoDesc||'',noindex:!!item.noindex,status:item.status||'published'}),[]); // eslint-disable-line
 const [v,setV]=useState(init),[touched,setTouched]=useState(!!item.slug),[ek,setEk]=useState(0),[draft,setDraft]=useState(null),[dev,setDev]=useState('d'),[sub,setSub]=useState(false);
 const set=(k,x)=>setV(o=>({...o,[k]:x})),key=`draft:${kind}:${lang}:${item.id||'new'}`,dirty=useRef(false),last=useRef(JSON.stringify(init));
 const onTitle=t=>setV(o=>({...o,title:t,slug:touched?o.slug:slugify(t).slice(0,70)}));

 // Bản nháp tự lưu
 useEffect(()=>{try{const d=JSON.parse(localStorage.getItem(key)||'null');if(d&&JSON.stringify(d.v)!==last.current)setDraft(d)}catch{}},[]); // eslint-disable-line
 useEffect(()=>{const s=JSON.stringify(v);dirty.current=s!==last.current;if(!dirty.current||sub)return;const t=setTimeout(()=>{try{localStorage.setItem(key,JSON.stringify({v,at:Date.now()}))}catch{}},1500);return()=>clearTimeout(t)},[v,sub]); // eslint-disable-line
 useEffect(()=>{const f=e=>{if(dirty.current&&!sub){e.preventDefault();e.returnValue=''}};addEventListener('beforeunload',f);return()=>removeEventListener('beforeunload',f)},[sub]);
 const restore=()=>{setV(draft.v);setTouched(true);setEk(k=>k+1);setDraft(null)};
 const drop=()=>{try{localStorage.removeItem(key)}catch{}setDraft(null)};

 const dc=useDeferredValue(v.content),dv=useMemo(()=>({...v,content:dc}),[v,dc]);
 const A=useMemo(()=>analyze({...dv,slug:v.slug||slugify(v.title)},host),[dv,host]); // eslint-disable-line
 const [gl,gc]=grade(A.score);
 const T=v.seoTitle||v.title,D=v.seoDesc||v.excerpt||autoDesc(dc,160);
 const bad=A.checks.filter(c=>c.lv==='bad').length,warn=A.checks.filter(c=>c.lv==='warn').length;

 return(<form ref={fref} action={actions?actions.save:action} className="f pf" style={{marginTop:14}} onSubmit={()=>{setSub(true);try{localStorage.removeItem(key)}catch{}}}>
  <h2 style={{margin:0}}>{item.id?(isPost?'Sửa bài':'Sửa trang'):(isPost?'Viết bài mới':'Thêm trang mới')}</h2>
  {actions&&<p className="meta" style={{margin:0}}>Quy trình: soạn → <b>Lưu bản nháp</b> (mỗi lần lưu là 1 phiên bản mới, không ghi đè) → <b>Xem trước</b> → <b>Public</b> để đăng lên trang chính thức. Bài đang Public chỉ thay đổi khi bạn bấm Public.</p>}
  <input type="hidden" name="id" defaultValue={item.id}/><input type="hidden" name="lang" value={lang}/>
  {draft&&<div className="warn pf-draft" role="status"><span>Có bản nháp tự lưu lúc {new Date(draft.at).toLocaleString('vi-VN')} chưa được đăng.</span><span><button type="button" className="btn" onClick={restore}><RotateCcw size={14}/> Khôi phục</button> <button type="button" className="btn g" onClick={drop}>Bỏ qua</button></span></div>}

  <label className="fl"><small>Tiêu đề {isPost?'bài viết':'trang'} (H1) *</small><input name="title" value={v.title} onChange={e=>onTitle(e.target.value)} placeholder="Tiêu đề hấp dẫn, có chứa từ khóa chính" required maxLength={150}/></label>
  <label className="fl"><small>Đường dẫn (slug) – tự tạo từ tiêu đề, không dấu</small>
   <span className="slugbox"><code>{host||'domain'}{base}</code><input name="slug" value={v.slug} onChange={e=>{setTouched(true);set('slug',e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))}} onBlur={e=>set('slug',slugify(e.target.value))} placeholder="tu-dong-tao-tu-tieu-de" maxLength={90}/></span>
   {touched&&<button type="button" className="lnk" onClick={()=>{setTouched(false);set('slug',slugify(v.title).slice(0,70))}}><Wand2 size={13}/> Tạo lại từ tiêu đề</button>}</label>

  {isPost&&<div className="grid2"><label className="fl"><small>Chuyên mục</small><select name="cat" value={v.cat} onChange={e=>set('cat',e.target.value)}>{Object.entries(cats).map(([k,x])=><option key={k} value={k}>{x}</option>)}</select></label>
   {actions?<input type="hidden" name="status" value="draft"/>:<label className="fl"><small>Trạng thái</small><select name="status" value={v.status} onChange={e=>set('status',e.target.value)}><option value="published">Đăng ngay</option><option value="draft">Lưu nháp</option></select></label>}</div>}
  {isPost&&<div className="grid2"><Field name="cover" label="Ảnh bìa (tải lên hoặc dán link) – nên 1200×630" type="img" value={v.cover} onChange={x=>set('cover',x)}/>
   <label className="fl"><small>Mô tả ảnh bìa (alt) – cho SEO &amp; người khiếm thị</small><input name="coverAlt" value={v.coverAlt} onChange={e=>set('coverAlt',e.target.value)} placeholder="Mô tả ngắn nội dung ảnh" maxLength={150}/></label></div>}
  <label className="fl"><small>Mô tả ngắn (hiện ở danh sách tin, dùng làm Meta description nếu để trống)</small><textarea name="excerpt" rows={2} value={v.excerpt} onChange={e=>set('excerpt',e.target.value)} maxLength={300}/></label>

  <HtmlEditor key={ek} name="content" value={v.content} rows={isPost?14:16} placeholder="Viết nội dung ở đây... Dùng Tiêu đề lớn (H2) / vừa (H3) để chia bố cục – tiêu đề bài ở trên đã là H1." onChange={x=>set('content',x)}/>

  <fieldset className="seo"><legend><Search size={15} style={{verticalAlign:'-2px'}}/> SEO – tối ưu cho tìm kiếm</legend>
   <p className="seo-note"><b>Điểm tối ưu SEO</b> chấm theo các quy tắc SEO phổ biến (vị trí từ khóa, độ dài tiêu đề/mô tả, bố cục, ảnh alt, liên kết…) – <b>không phải điểm Google chấm</b> và không đảm bảo thứ hạng. Các ngưỡng như mật độ từ khóa hay số từ là khuyến nghị chung, Google không quy định. Google xếp hạng chủ yếu theo mức độ hữu ích của nội dung.</p>
   <div className="seo-top"><div className="seo-score"><Ring v={A.score} lv={gc}/><div><b className={'gl '+gc}>{gl}</b><small>{bad?`${bad} lỗi `:''}{warn?`${warn} cần cải thiện`:''}{!bad&&!warn?'Không còn lỗi':''}<br/>{A.stats.words} từ · {A.stats.h2} H2 · {A.stats.imgs} ảnh</small></div></div>
    <label className="fl" style={{flex:1}}><small>Từ khóa chính (focus keyword)</small><input name="keyword" value={v.keyword} onChange={e=>set('keyword',e.target.value)} placeholder="vd: giao hàng hỏa tốc" maxLength={80}/><span className="shr">Dùng để kiểm tra bài đã đặt từ khóa đúng chỗ chưa (Google không đọc ô này). Mỗi bài nên tập trung 1 từ khóa chính – chọn theo dữ liệu thật bằng các nút bên dưới.</span></label></div>
   <KeywordTools value={v.keyword} seed={v.title} onPick={x=>set('keyword',x)} lang={lang} pageUrl={isPost&&item.slug?base+item.slug:''} published={item.status==='published'&&!!item.slug}/>

   <div className="serp-h"><b>Xem trước trên Google</b><span><button type="button" className={'tbb'+(dev==='d'?' on':'')} onClick={()=>setDev('d')} aria-label="Máy tính" title="Máy tính"><Monitor size={16}/></button><button type="button" className={'tbb'+(dev==='m'?' on':'')} onClick={()=>setDev('m')} aria-label="Điện thoại" title="Điện thoại"><Smartphone size={16}/></button></span></div>
   <div className={'serp '+dev}><div className="su"><span className="sf">{(host||'D')[0].toUpperCase()}</span><span><b>{host||'domain'}</b><small>{(siteUrl||'https://domain')+base+(v.slug||slugify(v.title)||'duong-dan')}</small></span></div>
    <div className="st">{cut(T,60)||'Tiêu đề bài viết'}</div><div className="sd">{cut(D,160)||'Mô tả bài viết sẽ hiển thị ở đây.'}</div></div>

   <label className="fl"><small>Tiêu đề SEO (meta title) – để trống = dùng tiêu đề bài</small>
    <input name="seoTitle" value={v.seoTitle} onChange={e=>set('seoTitle',e.target.value)} placeholder={v.title||'Tiêu đề hiển thị trên Google'} maxLength={120}/>
    <span className="cnt"><Bar n={T.length} lo={30} hi={60} max={80}/><em>{T.length}/60</em></span></label>
   <label className="fl"><small>Mô tả SEO (meta description)</small>
    <textarea name="seoDesc" rows={2} value={v.seoDesc} onChange={e=>set('seoDesc',e.target.value)} placeholder="Tóm tắt hấp dẫn 120–160 ký tự, có từ khóa chính và lời kêu gọi hành động" maxLength={300}/>
    <span className="cnt"><Bar n={(v.seoDesc||'').length} lo={120} hi={160} max={200}/><em>{(v.seoDesc||'').length}/160</em><button type="button" className="lnk" onClick={()=>set('seoDesc',autoDesc(v.content||v.excerpt,158))}><Wand2 size={13}/> Tự tạo từ nội dung</button></span></label>
   <label className="chk1"><input type="checkbox" name="noindex" value="1" checked={v.noindex} onChange={e=>set('noindex',e.target.checked)}/> Không cho Google lập chỉ mục {isPost?'bài':'trang'} này (noindex)</label>

   <ul className="chk" aria-label="Danh sách kiểm tra SEO">{A.checks.map(c=><li key={c.id} className={'c-'+c.lv}>{IC[c.lv]}<span>{c.t}</span></li>)}</ul>
  </fieldset>

  <div className="pf-bar sticky"><span className={'chip '+gc} title="Điểm tối ưu SEO theo quy tắc chung (không phải điểm của Google)">Tối ưu SEO {A.score}/100</span>
   {!isPost&&<select name="status" value={v.status} onChange={e=>set('status',e.target.value)}><option value="published">Đăng ngay</option><option value="draft">Lưu nháp</option></select>}
   {actions?<><span className="sp"/>
    <button type="button" className="btn g" onClick={preview} disabled={pv} title="Xem bài sẽ hiển thị thế nào trên website và Google (không cần lưu)"><Eye size={16}/> {pv?'Đang mở…':'Xem trước'}</button>
    <button className="btn" formAction={actions.save} title="Lưu thành phiên bản mới, chưa đăng"><Save size={16}/> Lưu bản nháp</button>
    <button className="btn pub" formAction={actions.publish} onClick={e=>{if(!confirm(state==='public'||state==='pending'?'Đăng nội dung này thay cho bản đang hiển thị trên website?':'Đăng bài này lên trang chính thức?'))e.preventDefault()}} title="Đăng lên trang chính thức"><Send size={16}/> Public</button>
    {(state==='public'||state==='pending')&&<button className="btn r" formAction={actions.unpublish} formNoValidate onClick={e=>{if(!confirm('Gỡ bài khỏi website (chuyển về Nháp)?'))e.preventDefault()}} title="Gỡ bài khỏi website"><Undo2 size={16}/> Gỡ xuống nháp</button>}
   </>:<button className="btn"><Save size={16}/> {isPost?'Lưu bài':'Lưu trang'}</button>}</div>
 </form>)}
