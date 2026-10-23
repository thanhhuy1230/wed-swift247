'use client';
import {useState,useRef,useEffect,useLayoutEffect,useCallback,useMemo} from 'react';
import {Undo2,RotateCcw,Pencil,Eye,EyeOff,Smartphone,Monitor,AlignLeft,AlignCenter,AlignRight,ArrowUpToLine,ArrowDownToLine,FoldVertical,Minus,Plus,Grid3x3,MousePointerClick,Move,Maximize2,RefreshCw} from 'lucide-react';
import Hero from './Hero';
import {BOXES,BOX,COLS,parse,stringify,defaults,collides,mobileOrder} from '@/lib/heroLayout';
import {activeP,slugCode} from '@/lib/promo';

// ===== Bố cục banner trang chủ – kéo thả trực quan =====
// Hiển thị đúng banner thật (thu nhỏ theo khung), phủ lên trên là các ô có chú thích:
//   • Kéo ô để đổi chỗ · kéo góc phải dưới để đổi kích thước · nhấp đúp để tới ô chỉnh nội dung
//   • Chọn ô → bảng bên dưới chỉnh cỡ chữ, căn lề, ẩn/hiện; phím mũi tên dời ô, Shift + mũi tên đổi kích thước
const STAGE=1280,EXTRA=2;
const cum=(sizes,gap)=>{const s=[];let a=0;for(const v of sizes){s.push(a);a+=v+gap}return s};

export default function HeroLayoutEditor({value,onChange,info,lists,lang,onJump}){
 const saved=parse(value),[L,setL]=useState(()=>saved||defaults()),[hist,setHist]=useState([]),[sel,setSel]=useState('title');
 const [slide,setSlide]=useState('0:0'),[grid,setGrid]=useState(true),[phone,setPhone]=useState(false),[pv,setPv]=useState(0);
 const outer=useRef(null),inner=useRef(null),heroWrap=useRef(null),[scale,setScale]=useState(1),[m,setM]=useState(null),[drag,setDrag]=useState(null),[narrow,setNarrow]=useState(false);
 const custom=!!saved;

 // ----- dữ liệu banner giống trang chủ -----
 const banners=lists.banners||[],promoRows=lists.hero||[];
 const promos=useMemo(()=>activeP(promoRows).filter(x=>!String(x.hideHero||'').trim()),[promoRows]);
 const slides=useMemo(()=>{const h=(banners.length?banners:[{title:info.tagline||'Banner chủ'}]).map((x,k)=>({g:0,i:k,label:x.title||`Banner ${k+1}`,list:'banners',row:banners.length?k:-1}));
  const p=promos.map((x,k)=>({g:h.length?1:0,i:k,label:(x.title||x.code||`Khuyến mãi ${k+1}`),list:'hero',row:promoRows.findIndex((r,j)=>slugCode(r,j)===x.id)}));
  return[...h,...p]},[banners,promos,promoRows,info.tagline]);
 const [sg,si]=slide.split(':').map(Number),cs=slides.find(x=>x.g===sg&&x.i===si)||slides[0];

 // ----- thay đổi bố cục (có hoàn tác) -----
 const commit=useCallback(nl=>{setHist(h=>[...h.slice(-29),L]);setL(nl);onChange(stringify(nl))},[L,onChange]);
 const undo=()=>{if(!hist.length)return;const p=hist[hist.length-1];setHist(h=>h.slice(0,-1));setL(p);onChange(stringify(p))};
 const setBox=(k,patch)=>commit({...L,[k]:{...L[k],...patch}});
 const reset=()=>{if(!confirm('Đưa banner về bố cục gốc của website? (Có hiệu lực sau khi bấm “Lưu mục này”)'))return;setHist(h=>[...h,L]);const d=defaults();setL(d);onChange('')};

 // ----- đo khung & lưới -----
 useEffect(()=>{const el=outer.current;if(!el)return;const f=()=>{setScale(Math.min(1,el.clientWidth/STAGE));setNarrow(innerWidth<=960)};f();
  const ro=new ResizeObserver(f);ro.observe(el);addEventListener('resize',f);return()=>{ro.disconnect();removeEventListener('resize',f)}},[]);
 useEffect(()=>{const el=heroWrap.current;if(el)el.setAttribute('inert','')},[]);
 const measure=useCallback(()=>{const inn=inner.current,gEl=inn&&inn.querySelector('.hgrid');if(!gEl)return;
  const ir=inn.getBoundingClientRect(),sc=ir.width/STAGE||1,gr=gEl.getBoundingClientRect(),st=getComputedStyle(gEl);
  const cols=st.gridTemplateColumns.split(' ').map(parseFloat),rows=st.gridTemplateRows.split(' ').map(parseFloat);
  const cg=parseFloat(st.columnGap)||0,rg=parseFloat(st.rowGap)||0;
  const ox=(gr.left-ir.left)/sc+parseFloat(st.paddingLeft||0),oy=(gr.top-ir.top)/sc+parseFloat(st.paddingTop||0);
  const box={};inn.querySelectorAll('[data-hbox]').forEach(e=>{const r=e.getBoundingClientRect();box[e.dataset.hbox]={l:(r.left-ir.left)/sc,t:(r.top-ir.top)/sc,w:r.width/sc,h:r.height/sc}});
  setM({ox,oy,cols,rows,cg,rg,cx:cum(cols,cg),ry:cum(rows,rg),box,H:inn.offsetHeight})},[]);
 useLayoutEffect(()=>{measure();const id=requestAnimationFrame(measure);return()=>cancelAnimationFrame(id)},[L,slide,scale,measure,info,lists]);
 useEffect(()=>{const inn=inner.current;if(!inn)return;const ro=new ResizeObserver(()=>measure());ro.observe(inn);inn.querySelectorAll('[data-hbox]').forEach(e=>ro.observe(e));
  const t=setInterval(measure,1500);return()=>{ro.disconnect();clearInterval(t)}},[measure,L,slide]);

 // ô lưới → tọa độ khung
 const rowAt=(n)=>{if(!m)return{t:0,h:36};if(n<m.rows.length)return{t:m.ry[n],h:m.rows[n]};const last=m.rows.length-1,b=last>=0?m.ry[last]+m.rows[last]+m.rg:0;return{t:b+(n-m.rows.length)*(36+m.rg),h:36}};
 const rectOf=r=>{if(!m)return null;const c0=r.x-1,c1=Math.min(COLS,r.x+r.w-1)-1,a=rowAt(r.y-1),b=rowAt(r.y+r.h-2);
  return{l:m.ox+m.cx[c0],t:m.oy+a.t,w:m.cx[c1]+m.cols[c1]-m.cx[c0],h:b.t+b.h-a.t}};
 // vị trí chuột → ô lưới (cột, hàng tính từ 1)
 const cellAt=e=>{const ir=inner.current.getBoundingClientRect(),sc=ir.width/STAGE,px=(e.clientX-ir.left)/sc-m.ox,py=(e.clientY-ir.top)/sc-m.oy;
  let c=0;for(let k=0;k<COLS;k++)if(px>=m.cx[k]-m.cg/2)c=k;let r=0;for(let k=0;k<60;k++){if(py>=rowAt(k).t-m.rg/2)r=k;else break}
  return{c:c+1,r:r+1}};

 // ----- kéo / đổi kích thước -----
 const start=(e,k,mode)=>{if(!m||e.button>0)return;e.preventDefault();e.stopPropagation();setSel(k);const c=cellAt(e),b=L[k];
  e.currentTarget.setPointerCapture?.(e.pointerId);setDrag({k,mode,dc:c.c-b.x,dr:c.r-b.y,r:{x:b.x,y:b.y,w:b.w,h:b.h},moved:false,ok:true})};
 const move=e=>{if(!drag)return;const c=cellAt(e),b=L[drag.k];let r;
  if(drag.mode==='move'){const w=b.w,h=b.h;r={x:Math.min(COLS-w+1,Math.max(1,c.c-drag.dc)),y:Math.max(1,c.r-drag.dr),w,h}}
  else r={x:b.x,y:b.y,w:Math.min(COLS-b.x+1,Math.max(1,c.c-b.x+1)),h:Math.max(1,c.r-b.y+1)};
  const moved=drag.moved||r.x!==b.x||r.y!==b.y||r.w!==b.w||r.h!==b.h;setDrag({...drag,r,moved,ok:!collides(L,drag.k,r)})};
 const end=()=>{if(!drag)return;const d=drag;setDrag(null);if(d.moved&&d.ok)setBox(d.k,d.r)};
 const tryBox=(k,r)=>{const b={...L[k],...r};if(b.x<1||b.y<1||b.w<1||b.h<1||b.x+b.w-1>COLS)return false;if(collides(L,k,b))return false;setBox(k,r);return true};
 const key=(e,k)=>{const b=L[k],D={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(D){e.preventDefault();if(e.shiftKey)tryBox(k,{w:b.w+D[0],h:b.h+D[1]});else tryBox(k,{x:b.x+D[0],y:b.y+D[1]})}
  else if(e.key==='Enter'){e.preventDefault();jump(k)}};

 // ----- nhấp đúp → tới ô chỉnh nội dung -----
 const jump=k=>{const promo=cs&&cs.list==='hero',row=cs?cs.row:-1,list=cs?cs.list:'banners',F=(f)=>row>=0?`f-${list}-${row}-${f}`:`f-${list}-0`;
  const T={track:['colors','f-trackUrl'],tabs:['titles',promo?'f-promoTab':'f-homeTab'],slides:[list,F('title')],badge:[list,F('kicker')],title:[list,F('title')],
   text:[list,F(promo?'big':'text')],points:[list,promo?F('title'):F('points')],buttons:[list,F('btn')],bg:[list,F('imgs')]}[k];
  if(T)onJump(T[0],T[1])};

 const b=L[sel],meta=BOX[sel],ghost=drag&&rectOf(drag.r),order=mobileOrder(L);
 const num=k=>BOXES.findIndex(x=>x.k===k)+1;
 const AL=[['l','Trái',AlignLeft],['c','Giữa',AlignCenter],['r','Phải',AlignRight]],VA=[['t','Trên',ArrowUpToLine],['c','Giữa',FoldVertical],['b','Dưới',ArrowDownToLine]];

 return(<div className="hle">
  <div className="hle-help">
   <p><b>Cách dùng</b> – khung dưới là banner thật của trang chủ, mỗi ô có viền màu và tên:</p>
   <ul>
    <li><Move size={15}/> <b>Kéo</b> một ô để đổi chỗ (ô xanh = đặt được, ô đỏ = đang đè lên ô khác).</li>
    <li><Maximize2 size={15}/> <b>Kéo góc phải dưới</b> của ô để đổi kích thước (rộng / cao).</li>
    <li><MousePointerClick size={15}/> <b>Nhấp đúp</b> vào ô để tới chỗ sửa chữ / ảnh của ô đó. Nhấp đúp vào nền trống để sửa ảnh nền.</li>
    <li><Pencil size={15}/> <b>Bấm chọn</b> 1 ô rồi chỉnh ở bảng bên dưới: to nhỏ, căn lề, ẩn/hiện.</li>
   </ul>
   <p className="hle-st">{custom?<>Trang chủ đang dùng <b>bố cục tùy chỉnh</b>.</>:<>Trang chủ đang dùng <b>bố cục gốc</b>. Thay đổi bất kỳ ô nào rồi bấm <b>Lưu mục này</b> để áp dụng.</>} Thay đổi chỉ hiện ra ngoài website sau khi bấm <b>Lưu mục này</b>.</p>
  </div>

  <div className="hle-bar">
   <label className="hle-sl">Xem slide:<select value={slide} onChange={e=>setSlide(e.target.value)}>
    {[0,1].map(gg=>{const it=slides.filter(x=>x.g===gg);if(!it.length)return null;const gl=it[0].list==='hero'?(info.promoTab||'Khuyến mãi'):(info.homeTab||'Trang chủ');
     return<optgroup key={gg} label={gl}>{it.map(x=><option key={x.g+':'+x.i} value={x.g+':'+x.i}>{x.label}</option>)}</optgroup>})}</select></label>
   <button type="button" className={'btn g'+(grid?' on':'')} onClick={()=>setGrid(x=>!x)} aria-pressed={grid}><Grid3x3 size={15}/> Lưới</button>
   <button type="button" className="btn g" onClick={undo} disabled={!hist.length}><Undo2 size={15}/> Hoàn tác</button>
   <button type="button" className="btn g" onClick={reset}><RotateCcw size={15}/> Về bố cục gốc</button>
   <button type="button" className={'btn g'+(phone?' on':'')} onClick={()=>setPhone(x=>!x)} aria-pressed={phone}><Smartphone size={15}/> Xem trên điện thoại</button>
  </div>
  {narrow&&<p className="warn">Màn hình đang hẹp: hãy mở trang này trên máy tính (cửa sổ rộng hơn 960px) để kéo thả chính xác.</p>}

  <div className="hle-stage" ref={outer} style={{height:m?m.H*scale:420}}>
   <div className="hle-inner" ref={inner} style={{width:STAGE,transform:`scale(${scale})`}}>
    <div ref={heroWrap} className="hle-hero"><Hero banners={banners} promos={promos} info={info} lang={lang} layout={L} edit={{g:sg,i:si,extraRows:EXTRA}}/></div>
    {m&&<div className={'hle-ov'+(grid?' grid':'')+(drag?' busy':'')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onDoubleClick={e=>{if(e.target===e.currentTarget)jump('bg')}} onPointerDown={e=>{if(e.target===e.currentTarget)setSel(null)}}>
     {grid&&Array.from({length:COLS},(_,k)=><i key={k} className="hle-col" style={{left:m.ox+m.cx[k],width:m.cols[k],top:m.oy,height:rowAt(m.rows.length-1).t+rowAt(m.rows.length-1).h}}/>)}
     {BOXES.map(({k,n,c})=>{const r=m.box[k];if(!r)return null;const B=L[k],on=sel===k,dragging=drag&&drag.k===k;
      return(<div key={k} role="button" tabIndex={0} aria-label={`${num(k)}. ${n} – kéo để di chuyển, nhấp đúp để sửa nội dung`} aria-pressed={on}
       className={'hle-b'+(on?' sel':'')+(B.hide?' hid':'')+(dragging?' dragging':'')} style={{left:r.l,top:r.t,width:r.w,height:r.h,'--bc':c}}
       onPointerDown={e=>start(e,k,'move')} onDoubleClick={e=>{e.stopPropagation();jump(k)}} onKeyDown={e=>key(e,k)} onFocus={()=>setSel(k)}>
       <span className="hle-tag"><em>{num(k)}</em><i>{n}{B.hide&&' (đang ẩn)'}</i>{B.hm&&!B.hide&&<Smartphone size={12} aria-label="ẩn trên điện thoại"/>}</span>
       <span className="hle-rs" title="Kéo để đổi kích thước" onPointerDown={e=>start(e,k,'size')}/>
      </div>)})}
     {ghost&&drag.moved&&<div className={'hle-gh'+(drag.ok?'':' bad')} style={{left:ghost.l,top:ghost.t,width:ghost.w,height:ghost.h}}><span>{drag.ok?(drag.mode==='move'?'Thả để đặt ở đây':'Kích thước mới'):'Đè lên ô khác – không đặt được'}</span></div>}
    </div>}
   </div>
  </div>

  <div className="hle-low">
   {b&&meta?<div className="hle-ins" style={{'--bc':meta.c}}>
    <div className="hle-ih"><em>{num(sel)}</em><div><b>{meta.n}</b><p>{meta.d}</p><small>Sửa nội dung: {meta.e}</small></div>
     <button type="button" className="btn" onClick={()=>jump(sel)}><Pencil size={15}/> Sửa nội dung ô này</button></div>
    <div className="hle-ctl">
     <div className="hle-f"><span>To / nhỏ (chữ & chi tiết)</span><div className="hle-rg">
      <button type="button" className="btn g" onClick={()=>setBox(sel,{sc:Math.max(50,b.sc-10)})} aria-label="Nhỏ hơn"><Minus size={14}/></button>
      <input type="range" min="50" max="200" step="5" value={b.sc} onChange={e=>setBox(sel,{sc:+e.target.value})} aria-label="Tỉ lệ"/>
      <button type="button" className="btn g" onClick={()=>setBox(sel,{sc:Math.min(200,b.sc+10)})} aria-label="To hơn"><Plus size={14}/></button>
      <b className="hle-pc">{b.sc}%</b>{b.sc!==100&&<button type="button" className="lnk" onClick={()=>setBox(sel,{sc:100})}>về 100%</button>}</div></div>
     <div className="hle-f"><span>Khung ô (theo lưới 12 cột)</span><div className="hle-nums">
      <span>Rộng <button type="button" className="btn g" onClick={()=>tryBox(sel,{w:b.w-1})}><Minus size={13}/></button><b>{b.w}</b>/12 cột<button type="button" className="btn g" onClick={()=>tryBox(sel,{w:b.w+1})||tryBox(sel,{x:b.x-1,w:b.w+1})}><Plus size={13}/></button></span>
      <span>Cao <button type="button" className="btn g" onClick={()=>tryBox(sel,{h:b.h-1})}><Minus size={13}/></button><b>{b.h}</b> hàng<button type="button" className="btn g" onClick={()=>tryBox(sel,{h:b.h+1})}><Plus size={13}/></button></span>
     </div><small>Mẹo: chọn ô rồi dùng phím mũi tên để dời, Shift + mũi tên để đổi kích thước.</small></div>
     <div className="hle-f"><span>Căn chữ</span><div className="hle-seg">{AL.map(([v,l,I])=><button key={v} type="button" className={b.al===v?'on':''} onClick={()=>setBox(sel,{al:v})}><I size={15}/> {l}</button>)}</div></div>
     <div className="hle-f"><span>Vị trí trong khung</span><div className="hle-seg">{VA.map(([v,l,I])=><button key={v} type="button" className={b.va===v?'on':''} onClick={()=>setBox(sel,{va:v})}><I size={15}/> {l}</button>)}</div></div>
     <div className="hle-f"><span>Hiển thị</span><div className="hle-chk">
      <label><input type="checkbox" checked={b.hide} onChange={e=>{const v=e.target.checked;if(!v&&collides(L,sel,b)){alert('Ô này đang trùng chỗ với ô khác. Hãy dời ô kia ra trước khi hiện lại.');return}setBox(sel,{hide:v})}}/> {b.hide?<EyeOff size={15}/>:<Eye size={15}/>} Ẩn ô này</label>
      <label><input type="checkbox" checked={b.hm} onChange={e=>setBox(sel,{hm:e.target.checked})}/> <Smartphone size={15}/> Ẩn trên điện thoại</label></div></div>
    </div>
   </div>:<div className="hle-ins empty">Bấm vào một ô trong khung để chỉnh. Nhấp đúp để tới chỗ sửa nội dung.</div>}

   <div className="hle-leg"><b>Chú thích các ô</b>
    <ol>{BOXES.map(({k,n,c,d})=><li key={k}><button type="button" className={sel===k?'on':''} style={{'--bc':c}} onClick={()=>setSel(k)} onDoubleClick={()=>jump(k)} title={d}><em>{num(k)}</em><span>{n}</span>{L[k].hide&&<small>ẩn</small>}</button></li>)}</ol>
    <p><Smartphone size={14}/> Thứ tự trên điện thoại (xếp 1 cột): {order.map(k=>num(k)).join(' → ')||'—'}</p>
   </div>
  </div>

  {phone&&<div className="hle-ph"><div className="hle-phh"><Smartphone size={16}/> Trang chủ trên điện thoại – <b>bản đã lưu</b> (bấm Lưu mục này rồi Tải lại để xem thay đổi mới)
   <button type="button" className="btn g" onClick={()=>setPv(x=>x+1)}><RefreshCw size={14}/> Tải lại</button>
   <button type="button" className="btn g" onClick={()=>setPhone(false)}><Monitor size={14}/> Đóng</button></div>
   <iframe key={pv} src={lang==='vi'?'/':'/?hl='+lang} title="Trang chủ trên điện thoại" loading="lazy"/></div>}
 </div>)}
