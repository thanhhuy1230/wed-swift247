'use client';
import {useRef,useState,useEffect} from 'react';
import {Undo2,Redo2,Bold,Italic,Underline,Strikethrough,AlignLeft,AlignCenter,AlignRight,AlignJustify,List,ListOrdered,IndentIncrease,IndentDecrease,Link2,Unlink,ImagePlus,Table2,Minus,Quote,Eraser,Code2,Baseline,Highlighter,Subscript,Superscript} from 'lucide-react';

// ===== Trình soạn thảo kiểu Word (WYSIWYG): gõ và định dạng trực tiếp, kết quả lưu dạng HTML =====
// Không cần thư viện ngoài: dùng contentEditable + document.execCommand.

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ALLOW=new Set(['P','H2','H3','H4','UL','OL','LI','B','STRONG','I','EM','U','S','A','IMG','BR','TABLE','THEAD','TBODY','TR','TD','TH','BLOCKQUOTE','HR','SUB','SUP']);
const DROP=new Set(['SCRIPT','STYLE','META','LINK','HEAD','TITLE','XML','NOSCRIPT','IFRAME','OBJECT']);
// Làm sạch nội dung dán từ Word/web: giữ cấu trúc (tiêu đề, danh sách, bảng, đậm/nghiêng, link, ảnh), bỏ style/class rác
function cleanPaste(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const walk=n=>{
  if(n.nodeType===3)return esc(n.nodeValue);
  if(n.nodeType!==1)return '';
  if(DROP.has(n.tagName))return '';
  const inner=[...n.childNodes].map(walk).join('');
  let t=n.tagName;if(t==='H1'||t==='H5'||t==='H6')t='H2';
  if(!ALLOW.has(t)){return /^(DIV|SECTION|ARTICLE|PRE|FIGURE|TFOOT|CAPTION)$/.test(t)&&inner.trim()?`<p>${inner}</p>`:inner}
  const tag=t.toLowerCase();
  if(t==='BR'||t==='HR')return `<${tag}>`;
  if(t==='IMG'){const s=n.getAttribute('src')||'';return /^(https?:|\/|data:image\/)/i.test(s)?`<img src="${esc(s)}" alt="${esc(n.getAttribute('alt')||'')}">`:''}
  if(t==='A'){const h=n.getAttribute('href')||'';return /^(https?:|mailto:|tel:|\/|#)/i.test(h)?`<a href="${esc(h)}">${inner}</a>`:inner}
  if(t==='TD'||t==='TH'){const cs=n.getAttribute('colspan'),rs=n.getAttribute('rowspan');return `<${tag}${cs?` colspan="${esc(cs)}"`:''}${rs?` rowspan="${esc(rs)}"`:''}>${inner}</${tag}>`}
  return `<${tag}>${inner}</${tag}>`};
 return walk(doc.body);
}

const BLOCKS=[['p','Đoạn văn'],['h2','Tiêu đề lớn (H2)'],['h3','Tiêu đề vừa (H3)'],['h4','Tiêu đề nhỏ (H4)'],['blockquote','Trích dẫn']];
const SIZES=[['2','Nhỏ'],['3','Bình thường'],['5','Lớn'],['6','Rất lớn']];

function ColorBtn({title,icon,onPick,init}){
 const r=useRef();
 useEffect(()=>{const el=r.current;if(!el)return;const f=()=>onPick(el.value);el.addEventListener('change',f);return()=>el.removeEventListener('change',f)});
 return(<label className="tbb col" title={title}>{icon}<input ref={r} type="color" defaultValue={init} aria-label={title}/></label>);
}

export default function HtmlEditor({name,value='',rows=14,placeholder,onChange,onImageAlt}){
 const ed=useRef(),file=useRef(),saved=useRef(null),[html,setHtml]=useState(value),[src,setSrc]=useState(false),[busy,setB]=useState(false),[words,setW]=useState(0);
 const [f,setF]=useState({block:'p'});
 useEffect(()=>{onChange&&onChange(html)},[html]); // báo nội dung mới cho form cha (bảng chấm điểm SEO)

 // Nạp nội dung ban đầu (chỉ 1 lần – không điều khiển lại để con trỏ không bị nhảy)
 useEffect(()=>{
  const v=(value||'').trim();
  ed.current.innerHTML=v?(/<[a-z][\s\S]*>/i.test(v)?v:`<p>${esc(v)}</p>`):'<p><br></p>';
  try{document.execCommand('defaultParagraphSeparator',false,'p');document.execCommand('styleWithCSS',false,true)}catch{}
  count();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 const count=()=>setW(((ed.current?.innerText||'').trim().match(/\S+/g)||[]).length);
 const out=()=>{const h=ed.current.innerHTML;return /^(<p><br><\/p>|<br>|)$/.test(h.trim())?'':h};
 const sync=()=>{setHtml(out());count()};

 // Theo dõi vùng chọn để nút trên thanh công cụ sáng đúng trạng thái và nhớ vị trí con trỏ
 const upd=()=>{
  const q=c=>{try{return document.queryCommandState(c)}catch{return false}};
  let b='p';try{b=(document.queryCommandValue('formatBlock')||'p').toLowerCase().replace(/[<>]/g,'')}catch{}
  if(!BLOCKS.some(x=>x[0]===b))b='p';
  setF({b:q('bold'),i:q('italic'),u:q('underline'),s:q('strikeThrough'),sub:q('subscript'),sup:q('superscript'),ul:q('insertUnorderedList'),ol:q('insertOrderedList'),l:q('justifyLeft'),c:q('justifyCenter'),r:q('justifyRight'),j:q('justifyFull'),block:b});
 };
 useEffect(()=>{
  const h=()=>{const s=getSelection();if(s&&s.rangeCount&&ed.current&&ed.current.contains(s.anchorNode)){saved.current=s.getRangeAt(0).cloneRange();upd()}};
  document.addEventListener('selectionchange',h);return()=>document.removeEventListener('selectionchange',h);
 },[]);

 const restore=()=>{ed.current.focus();const s=getSelection();if(saved.current){s.removeAllRanges();s.addRange(saved.current)}};
 const exec=(c,v=null)=>{restore();try{document.execCommand('styleWithCSS',false,/^(justify|foreColor|hiliteColor|fontSize)/.test(c))}catch{}document.execCommand(c,false,v);sync();upd()};
 const block=t=>exec('formatBlock','<'+t+'>');

 const link=()=>{
  const sel=saved.current?saved.current.toString():'';
  let u=prompt('Dán đường link (https://...):','https://');if(!u||u==='https://')return;u=u.trim();
  if(/^javascript:/i.test(u))return;
  if(!/^(https?:|mailto:|tel:|\/|#)/i.test(u))u='https://'+u;
  restore();
  if(sel)document.execCommand('createLink',false,u);else document.execCommand('insertHTML',false,`<a href="${esc(u)}">${esc(u)}</a>`);
  sync();
 };
 const table=()=>{
  const v=prompt('Chèn bảng – nhập số cột x số dòng (ví dụ 3x4):','3x3');if(!v)return;
  const m=v.toLowerCase().replace(/[×,; ]/g,'x').match(/(\d+)\s*x\s*(\d+)/);if(!m)return;
  const c=Math.min(10,Math.max(1,+m[1])),r=Math.min(30,Math.max(1,+m[2]));
  const row=(t)=>`<tr>${Array.from({length:c},()=>`<${t}><br></${t}>`).join('')}</tr>`;
  restore();document.execCommand('insertHTML',false,`<table><tbody>${row('th')}${Array.from({length:r-1},()=>row('td')).join('')}</tbody></table><p><br></p>`);sync();
 };
 async function up(e){
  const fl=e.target.files[0];if(!fl)return;setB(true);
  const d=new FormData();d.append('file',fl);
  try{const x=await fetch('/api/upload',{method:'POST',body:d});
   if(x.ok){const {url}=await x.json();const alt=(prompt('Mô tả ảnh (alt) – quan trọng cho SEO và người khiếm thị. Nên có từ khóa tự nhiên:','')||'').trim();restore();document.execCommand('insertHTML',false,`<img src="${esc(url)}" alt="${esc(alt)}">`);sync()}
   else alert('Tải ảnh lỗi (jpg/png/webp/gif, ≤8MB)')}catch{alert('Tải ảnh lỗi (jpg/png/webp/gif, ≤8MB)')}
  setB(false);e.target.value='';
 }
 const paste=e=>{const h=e.clipboardData.getData('text/html');if(!h)return;e.preventDefault();document.execCommand('insertHTML',false,cleanPaste(h));sync()};
 const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();saved.current=getSelection().getRangeAt(0).cloneRange();link()}};
 const imgClick=e=>{const t=e.target;if(t.tagName!=='IMG')return;const a=prompt('Mô tả ảnh (alt) – để trống nếu ảnh chỉ trang trí:',t.getAttribute('alt')||'');if(a===null)return;t.setAttribute('alt',a.trim());sync()};
 const toggleSrc=()=>{
  if(src){ed.current.innerHTML=html.trim()||'<p><br></p>';count()}else setHtml(out());
  setSrc(!src);
 };

 const Tb=({t,on,act,children,dis})=><button type="button" className={'tbb'+(on?' on':'')} title={t} aria-label={t} aria-pressed={!!on} disabled={dis} onMouseDown={e=>e.preventDefault()} onClick={act}>{children}</button>;
 const S=()=><span className="sep" aria-hidden="true"/>;
 const z=16;

 return(<div className="he">
  <input type="hidden" name={name} value={html}/>
  <input ref={file} type="file" accept="image/*" hidden onChange={up}/>
  <div className="tbar" role="toolbar" aria-label="Thanh công cụ soạn thảo">
   <Tb t="Hoàn tác (Ctrl+Z)" act={()=>exec('undo')} dis={src}><Undo2 size={z}/></Tb><Tb t="Làm lại (Ctrl+Y)" act={()=>exec('redo')} dis={src}><Redo2 size={z}/></Tb><S/>
   <select className="tbs" title="Kiểu đoạn" value={f.block||'p'} disabled={src} onChange={e=>block(e.target.value)}>{BLOCKS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
   <select className="tbs sm" title="Cỡ chữ" defaultValue="3" disabled={src} onChange={e=>exec('fontSize',e.target.value)}>{SIZES.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select><S/>
   <Tb t="In đậm (Ctrl+B)" on={f.b} act={()=>exec('bold')} dis={src}><Bold size={z}/></Tb>
   <Tb t="In nghiêng (Ctrl+I)" on={f.i} act={()=>exec('italic')} dis={src}><Italic size={z}/></Tb>
   <Tb t="Gạch chân (Ctrl+U)" on={f.u} act={()=>exec('underline')} dis={src}><Underline size={z}/></Tb>
   <Tb t="Gạch ngang" on={f.s} act={()=>exec('strikeThrough')} dis={src}><Strikethrough size={z}/></Tb>
   <Tb t="Chỉ số dưới" on={f.sub} act={()=>exec('subscript')} dis={src}><Subscript size={z}/></Tb>
   <Tb t="Chỉ số trên" on={f.sup} act={()=>exec('superscript')} dis={src}><Superscript size={z}/></Tb>
   <ColorBtn title="Màu chữ" init="#d32f2f" icon={<Baseline size={z}/>} onPick={v=>exec('foreColor',v)}/>
   <ColorBtn title="Tô nền chữ (highlight)" init="#ffeb3b" icon={<Highlighter size={z}/>} onPick={v=>exec('hiliteColor',v)}/><S/>
   <Tb t="Căn trái" on={f.l} act={()=>exec('justifyLeft')} dis={src}><AlignLeft size={z}/></Tb>
   <Tb t="Căn giữa" on={f.c} act={()=>exec('justifyCenter')} dis={src}><AlignCenter size={z}/></Tb>
   <Tb t="Căn phải" on={f.r} act={()=>exec('justifyRight')} dis={src}><AlignRight size={z}/></Tb>
   <Tb t="Căn đều hai bên" on={f.j} act={()=>exec('justifyFull')} dis={src}><AlignJustify size={z}/></Tb><S/>
   <Tb t="Danh sách dấu đầu dòng" on={f.ul} act={()=>exec('insertUnorderedList')} dis={src}><List size={z}/></Tb>
   <Tb t="Danh sách đánh số" on={f.ol} act={()=>exec('insertOrderedList')} dis={src}><ListOrdered size={z}/></Tb>
   <Tb t="Giảm thụt lề" act={()=>exec('outdent')} dis={src}><IndentDecrease size={z}/></Tb>
   <Tb t="Tăng thụt lề" act={()=>exec('indent')} dis={src}><IndentIncrease size={z}/></Tb><S/>
   <Tb t="Chèn/sửa liên kết (Ctrl+K)" act={link} dis={src}><Link2 size={z}/></Tb>
   <Tb t="Gỡ liên kết" act={()=>exec('unlink')} dis={src}><Unlink size={z}/></Tb>
   <Tb t={busy?'Đang tải ảnh...':'Chèn ảnh'} act={()=>{if(!busy)file.current.click()}} dis={src}><ImagePlus size={z}/></Tb>
   <Tb t="Chèn bảng" act={table} dis={src}><Table2 size={z}/></Tb>
   <Tb t="Trích dẫn" on={f.block==='blockquote'} act={()=>block(f.block==='blockquote'?'p':'blockquote')} dis={src}><Quote size={z}/></Tb>
   <Tb t="Đường kẻ ngang" act={()=>exec('insertHorizontalRule')} dis={src}><Minus size={z}/></Tb><S/>
   <Tb t="Xóa định dạng" act={()=>{exec('removeFormat');exec('formatBlock','<p>')}} dis={src}><Eraser size={z}/></Tb>
   <Tb t="Xem/sửa mã HTML" on={src} act={toggleSrc}><Code2 size={z}/></Tb>
  </div>
  <div ref={ed} className="ed body" contentEditable suppressContentEditableWarning spellCheck data-ph={placeholder||'Nhập nội dung...'} style={{display:src?'none':'block',minHeight:rows*24}}
   onClick={imgClick} onInput={sync} onBlur={sync} onKeyUp={upd} onMouseUp={upd} onPaste={paste} onKeyDown={key}/>
  {src&&<textarea className="edsrc" rows={rows+4} value={html} onChange={e=>setHtml(e.target.value)} spellCheck={false} aria-label="Mã HTML"/>}
  <div className="edst"><span>{src?'Chế độ mã HTML – bấm nút mã (ngoặc nhọn) trên thanh công cụ để quay lại soạn thảo':`${words} từ`}</span><span>Ctrl+B đậm · Ctrl+I nghiêng · Ctrl+K liên kết · Bấm vào ảnh để sửa mô tả (alt)</span></div>
 </div>);
}
