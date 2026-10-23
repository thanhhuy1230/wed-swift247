'use client';
import {useState,useEffect,useRef,useCallback} from 'react';import Icon from './Icon';
import {Search,ArrowRight,ClipboardPaste,History,TicketPercent,Copy,Check,CalendarClock,Home,Sparkles,CircleCheck} from 'lucide-react';import {D} from '@/lib/dict';import {track} from '@/lib/ga';import AuthBox from './AuthBox';import {PackageSearch,UserRound} from 'lucide-react';

// ===== Banner V4 =====
// • Hai nhóm: "Trang chủ" (banner chủ – LUÔN hiện đầu tiên khi tải trang) và "Khuyến mãi" (voucher đang áp dụng).
// • "Dịch vụ của chúng tôi" đã chuyển xuống thành mục riêng bên dưới mục Khuyến mãi.
// • Mỗi slide có NHIỀU ảnh nền phủ kín khung banner, tự chuyển cảnh (crossfade + zoom/pan chậm). Ảnh/video luôn nằm DƯỚI chữ & ô tra cứu.
// • Chỉ tải ảnh của slide đang xem + slide kế tiếp (nhẹ trang, tốt cho Core Web Vitals / SEO).
const DELAY=7000;
const isVid=u=>/\.(mp4|webm)(\?|$)/i.test(u||'');
import {imgList} from '@/lib/promo';import {parse as parseLayout,BOXES,rowsOf,mobileOrder} from '@/lib/heroLayout';
const KB=['kb1','kb2','kb3','kb4'];

function Bg({s,on,load,first,dur}){
 const v=s.video&&isVid(s.video)?s.video:null,imgs=s.imgs,[j,setJ]=useState(0),n=imgs.length;
 // đổi ảnh bên trong slide: chia đều thời gian hiển thị slide cho các ảnh
 useEffect(()=>{if(!on){setJ(0);return}if(n<2||v)return;const t=setInterval(()=>setJ(x=>(x+1)%n),Math.max(2600,dur/n));return()=>clearInterval(t)},[on,n,v,dur]);
 return(<div className={'hbg'+(on?' on':'')+(!n&&!v?' plain':'')} aria-hidden={on?undefined:'true'}>
  {v?(on&&<video src={v} autoPlay muted loop playsInline preload="metadata" poster={imgs[0]||undefined}/>)
   :load&&imgs.map((src,k)=><img key={src+k} src={src} alt={k===0&&on?(s.alt||s.title||''):''} className={(k===j?'on ':'')+KB[k%KB.length]}
     width="1920" height="820" decoding="async" loading={first&&k===0?'eager':'lazy'} {...(first&&k===0?{fetchpriority:'high'}:{})}/>)}
 </div>);
}

function Ticket({s,t}){
 const [ok,setOk]=useState(false);
 const copy=async()=>{track('select_promotion',{promotion_id:s.code,promotion_name:s.title,creative_slot:'hero_copy_code'});try{await navigator.clipboard.writeText(s.code);setOk(true);setTimeout(()=>setOk(false),1800)}catch{}};
 return(<div className="tk-w"><div className="tk">
  {s.big&&<div className="tk-v">{s.big}</div>}
  <div className="tk-b">
   {s.code&&<div className="tk-c"><span>{t.vCode}</span><b>{s.code}</b><button type="button" onClick={copy} aria-label={t.copyCode+' '+s.code}>{ok?<><Check size={15}/> {t.copied}</>:<><Copy size={15}/> {t.copyCode}</>}</button></div>}
   {(s.expiry||s.terms)&&<p className="tk-e">{s.expiry&&<span><CalendarClock size={14}/> {t.vExp} {s.expiry}</span>}{s.terms&&<span className="tk-t">{s.terms}</span>}</p>}
  </div></div></div>);
}

export default function Hero({banners=[],promos=[],info,lang='vi',layout,edit}){
 const t=D[lang]||D.vi;
 // Bố cục tùy chỉnh (Cài đặt trang → Bố cục banner). Không có → bố cục gốc.
 const L=layout!==undefined?layout:parseLayout(info.heroLayout);
 // không cấu hình banner chủ → tự tạo 1 slide từ thông tin website để trang chủ luôn mở bằng banner chủ
 const home=(banners.length?banners:[{kicker:info.name,title:info.tagline,text:info.seoDesc,imgs:'/banner/home-hero.svg'}])
  .map(x=>({...x,kind:'home',imgs:imgList(x),pts:String(x.points||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean),
   btn:x.btn||info.bookingLabel||t.book,btnHref:x.btnHref||info.bookingUrl||'#'}));
 const groups=[
  {id:'home',label:info.homeTab||t.hTab,items:home},
  {id:'promo',label:info.promoTab||t.pTab,items:promos.map(x=>({...x,kind:'promo',imgs:imgList(x),btnHref:x.btnHref||'/khuyen-mai#'+x.id}))}
 ].filter(g=>g.items.length);
 const flat=groups.flatMap((g,gi)=>g.items.map((x,ii)=>({...x,gi,ii})));
 // luôn bắt đầu ở nhóm 0 (Trang chủ), slide 0 – mỗi lần tải lại trang đều thấy banner chủ trước
 const [g1,setG]=useState(0),[i1,setI]=useState(0),[pause,setP]=useState(false),[reduce,setR]=useState(false),[key,setK]=useState(0),[seen,setSeen]=useState(()=>new Set([0])),touch=useRef(null);
 // Trình chỉnh bố cục: slide do trình chỉnh chọn, không tự chuyển
 const g=edit?Math.min(edit.g||0,Math.max(0,groups.length-1)):g1,i=edit?Math.min(edit.i||0,Math.max(0,(groups[g]||{items:[]}).items.length-1)):i1;
 const G=groups.length,cur=groups[g]||{items:[]},n=cur.items.length,idx=flat.findIndex(x=>x.gi===g&&x.ii===i);
 const go=useCallback((gg,ii)=>{setG(gg);setI(ii);setK(x=>x+1)},[]);
 // tiếp theo: hết nhóm này thì chuyển sang nhóm kia (tab đổi theo để khách luôn biết đang xem mục nào)
 const next=useCallback(()=>{if(i+1<n)go(g,i+1);else if(G>1)go((g+1)%G,0);else go(g,0)},[i,n,g,G,go]);
 const prev=useCallback(()=>{if(i>0)go(g,i-1);else if(G>1){const pg=(g-1+G)%G;go(pg,groups[pg].items.length-1)}else go(g,n-1)},[i,n,g,G,go,groups]);
 useEffect(()=>{setR(matchMedia('(prefers-reduced-motion:reduce)').matches)},[]);
 useEffect(()=>{if(edit||flat.length<2||pause||reduce)return;const x=setTimeout(next,DELAY);return()=>clearTimeout(x)},[i,g,key,flat.length,pause,reduce,next,edit]);
 useEffect(()=>{if(idx<0)return;setSeen(p=>{const s=new Set(p);s.add(idx);s.add((idx+1)%flat.length);return s})},[idx,flat.length]);
 const s=cur.items[i]||{};

 // Tra cứu: nhớ mã đã tra, hỗ trợ link có {code}, dán nhanh từ clipboard
 const [code,setC]=useState(''),[rec,setRec]=useState([]);
 useEffect(()=>{try{setRec(JSON.parse(localStorage.getItem('rc')||'[]'))}catch{}},[]);
 const submit=e=>{const c=code.trim();if(!c){e.preventDefault();return}track('track_order',{location:'hero'});
  try{const r=[c,...rec.filter(x=>x!==c)].slice(0,5);localStorage.setItem('rc',JSON.stringify(r));setRec(r)}catch{}
  const u=info.trackUrl||'';if(u.includes('{code}')){e.preventDefault();window.open(u.replace('{code}',encodeURIComponent(c)),'_blank','noopener')}};
 const paste=async()=>{try{const x=(await navigator.clipboard.readText()).trim().slice(0,40);if(x)setC(x)}catch{}};
 const onKey=e=>{if(edit||e.target.closest('input,textarea'))return;if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')prev()};
 const ts=e=>{touch.current=e.touches[0].clientX},te=e=>{if(touch.current==null)return;const d=e.changedTouches[0].clientX-touch.current;touch.current=null;if(Math.abs(d)>50)(d<0?next:prev)()};
 const isP=s.kind==='promo',isH=s.kind==='home';
 // Khung tra cứu có 2 tab: Tra cứu đơn hàng | Đăng nhập – Đăng ký. Chuyển sang Đăng nhập thì khung rộng ra (authW) cho dễ nhìn.
 const authOn=String(info.authOn??'').trim()!=='0',[mode,setMode]=useState(()=>authOn&&String(info.authDefault||'').trim()==='auth'?'auth':'track'),isA=authOn&&mode==='auth';
 const px=(x,d)=>{const n=parseInt(x,10);return (n>=260&&n<=1000?n:d)+'px'};
 const boxVars={'--tw':px(info.trackW,420),'--aw':px(info.authW,540)};
 // Bố cục kéo – thả: khung rộng ra thì đẩy các ô nằm cạnh (tiêu đề, mô tả…) sang bên để không bị che
 const gridRef=useRef(null);
 useEffect(()=>{const root=gridRef.current;if(!root)return;
  const fit=()=>{const bx=[...root.querySelectorAll(':scope > .hbx')],tb=root.querySelector(':scope > .hbx-track');bx.forEach(b=>{b.style.marginLeft='';b.style.marginRight=''});
   if(!isA||!tb||innerWidth<=960)return;const cs=getComputedStyle(tb),aw=parseFloat(getComputedStyle(root).getPropertyValue('--aw'))||540,sc=parseFloat(cs.getPropertyValue('--sc'))||1;
   const r=tb.getBoundingClientRect(),grow=Math.max(0,Math.min(aw*sc,innerWidth-48)-r.width),al=tb.classList.contains('al-r')?'r':tb.classList.contains('al-c')?'c':'l';
   const gr=al==='l'?grow:al==='c'?grow/2:0,gl=al==='r'?grow:al==='c'?grow/2:0;
   for(const b of bx){if(b===tb)continue;const q=b.getBoundingClientRect();if(q.bottom<=r.top||q.top>=r.bottom)continue;
    if(gr&&q.left>=r.right-2)b.style.marginLeft=Math.min(gr,q.width*.45)+'px';else if(gl&&q.right<=r.left+2)b.style.marginRight=Math.min(gl,q.width*.45)+'px'}};
  const t=setTimeout(fit,0);addEventListener('resize',fit);return()=>{clearTimeout(t);removeEventListener('resize',fit)}},[isA,L]);

 // ----- Các ô của banner -----
 const trackForm=<form className={authOn?'trk':'track'} action={info.trackUrl&&!info.trackUrl.includes('{code}')?info.trackUrl:'#'} method="get" target="_blank" onSubmit={submit}><h2>{info.trackBoxTitle||t.trackTitle}</h2>
    <label>{info.trackBoxLabel||t.trackLabel}<span className="tin"><input name="code" required value={code} onChange={e=>setC(e.target.value)} autoComplete="off" inputMode="text" list="rc" maxLength={40}/><button type="button" className="pst" onClick={paste} aria-label={t.paste} title={t.paste}><ClipboardPaste size={17}/></button></span></label>
    <datalist id="rc">{rec.map(x=><option key={x} value={x}/>)}</datalist>
    <button className="pill"><Search size={18}/> {info.trackBoxBtn||t.trackBtn}</button>
    {rec.length>0&&<div className="rec" aria-label={t.recent}><History size={14}/>{rec.slice(0,3).map(x=><button type="button" key={x} onClick={()=>setC(x)}>{x}</button>)}</div>}</form>;
 const trackEl=!authOn?trackForm:<div className={'track tb'+(isA?' is-auth':'')}>
    <div className="tb-tabs" role="tablist" aria-label={t.tabTrack+' / '+t.tabAuth}>
     <button type="button" role="tab" id="tb-t1" aria-controls="tb-p" aria-selected={!isA} className={!isA?'on':''} onClick={()=>setMode('track')}><PackageSearch size={17}/>{info.tabTrack||t.tabTrack}</button>
     <button type="button" role="tab" id="tb-t2" aria-controls="tb-p" aria-selected={isA} className={isA?'on':''} onClick={()=>{setMode('auth');track('login_tab',{location:'hero_box'})}}><UserRound size={17}/>{info.tabAuth||t.tabAuth}</button></div>
    <div className="tb-p" id="tb-p" role="tabpanel" aria-labelledby={isA?'tb-t2':'tb-t1'} key={mode}>{isA?<AuthBox info={info} t={t} edit={edit}/>:trackForm}</div></div>;
 const badgeEl=isP?<p className="badge b-v"><TicketPercent size={16}/><span>{t.vBadge}</span>{s.kicker&&<><i aria-hidden="true"/>{s.kicker}</>}</p>
      :s.kicker?<p className="badge b-h"><Sparkles size={15}/><span>{s.kicker}</span></p>:null;
 const titleEl=<h2 className={'h-sl'+(isH?' h-home':'')}>{s.title}</h2>;
 const textEl=isP?<Ticket s={s} t={t}/>:s.text?<p className="sdesc">{s.text}</p>:null;
 const pointsEl=!isP&&s.pts?.length>0?<ul className="hpts">{s.pts.map((p,k)=><li key={k}><CircleCheck size={16}/>{p}</li>)}</ul>:null;
 const buttonsEl=<div className="hbtns">{s.btn&&<a className="note" href={s.btnHref||'#'} data-ga={isP?'select_promotion':'begin_booking'} data-ga-location="hero" data-ga-label={s.code||s.title}>{s.btn} <ArrowRight size={16}/></a>}
      {isH&&s.btn2&&<a className="note ghost" href={s.btn2Href||'#'}>{s.btn2}</a>}
      {isP&&<a className="note ghost" href={'#'+s.id}>{t.promoDetail}</a>}</div>;
 const tabsEl=G>1?<div className="hseg" role="tablist" aria-label={t.groupNav}>{groups.map((x,k)=><button key={x.id} type="button" role="tab" aria-selected={k===g} aria-controls="hero-panel" className={(k===g?'on ':'')+(x.id==='promo'?'sv-v':'sv-s')} onClick={()=>go(k,0)}>{x.id==='promo'?<TicketPercent size={17}/>:<Home size={17}/>}{x.label}{x.id==='promo'&&<em>{x.items.length}</em>}</button>)}</div>:null;
 const slidesEl=<div className={'hnav '+(cur.id==='promo'?'is-v':'is-s')} role="tablist" aria-label={cur.label}>
    {cur.items.map((x,k)=><button key={g+'-'+k} type="button" role="tab" aria-selected={k===i} aria-controls="hero-panel" className={k===i?'on':''} onClick={()=>go(g,k)} title={x.title}>
     <span className="hi">{x.kind==='promo'?<TicketPercent size={19}/>:x.icon?<Icon name={x.icon} size={19}/>:<Home size={19}/>}</span>
     <span className="hl">{x.title}{x.kind==='promo'&&x.code&&<small>{x.code}</small>}</span>
     {k===i&&flat.length>1&&<i className={'hpb'+(pause||reduce||edit?' stop':'')} key={key} style={{animationDuration:DELAY+'ms'}}/>}</button>)}</div>;
 const slideCls='slide '+(isP?'promo-s':'home-s');

 // ----- Bố cục tùy chỉnh: lưới 12 cột -----
 let main;
 if(L){const els={track:trackEl,badge:badgeEl,title:titleEl,text:textEl,points:pointsEl,buttons:buttonsEl,tabs:tabsEl,slides:slidesEl},SL=new Set(['badge','title','text','points','buttons']);
  const order=mobileOrder(L);
  main=<div ref={gridRef} className={'wrap hero-in hgrid'+(isA?' auth-on':'')+(edit?' hg-ed':'')} style={{'--rows':rowsOf(L)+(edit?edit.extraRows||0:0)}} id="hero-panel" role="group">
   {BOXES.map(({k},n)=>{const b=L[k];if(b.hide&&!edit)return null;const c=els[k];
    const style={'--gc':`${b.x} / span ${b.w}`,'--gr':`${b.y} / span ${b.h}`,'--sc':b.sc/100,'--o':order.indexOf(k),'--ad':(SL.has(k)?Math.max(0,order.indexOf(k))*0.07:0)+'s'};
    const cls='hbx hbx-'+k+(k==='track'&&isA?' auth-on':'')+' al-'+b.al+' va-'+b.va+(b.hm?' hm':'')+(b.hide?' is-hid':'');
    return(<div key={k} className={cls} style={style} data-hbox={k}><div className="hbx-in">{SL.has(k)?(c&&<div className={slideCls} key={g+'-'+i}><div className="stxt">{c}</div></div>):c}</div></div>)})}
  </div>}

 return(<section style={boxVars} className={'hero'+(L?' hero-g':'')+(edit?' hero-ed':'')} aria-roledescription="carousel" aria-label={info.name} onMouseEnter={()=>setP(true)} onMouseLeave={()=>setP(false)} onFocus={()=>setP(true)} onBlur={()=>setP(false)} onKeyDown={onKey} onTouchStart={edit?undefined:ts} onTouchEnd={edit?undefined:te}>
  {!edit&&<h1 className="sr">{info.name} – {info.tagline}</h1>}
  <div className="hbgs">{flat.map((x,k)=><Bg key={k} s={x} on={k===idx} load={seen.has(k)||!!edit} first={k===0} dur={DELAY}/>)}</div><div className="hshade" aria-hidden="true"/>
  {L?main:<>
  <div className={'wrap hero-in'+(isA?' auth-on':'')}>
   {trackEl}

   <div className={slideCls} key={g+'-'+i} id="hero-panel" role="tabpanel" aria-live={pause?'polite':'off'}><div className="stxt">
     {badgeEl}
     {titleEl}
     {isP?textEl:<>{textEl}{pointsEl}</>}
     {buttonsEl}</div></div></div>

  <div className="wrap hnav-w">
   {tabsEl}
   {slidesEl}</div></>}
 </section>)}
