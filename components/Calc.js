'use client';
import {useState,useEffect,useMemo,useRef} from 'react';
import {Calculator,MapPin,LocateFixed,Package,Route,Loader2,CircleCheck,Info,ArrowRight,Map as MapIc,Navigation,ExternalLink} from 'lucide-react';
import {D,LOCALE} from '@/lib/dict';import {track} from '@/lib/ga';import {PROVINCES,REGION,byCode,roadKm,haversine,nearest} from '@/lib/vn';

// ===== Bảng tính cước V3: theo địa chỉ người gửi → người nhận =====
// Cước = (giá kg đầu + kg tiếp theo × giá/kg) × hệ số vùng (theo quãng đường) + phụ phí khu vực xã/vùng xa + phụ phí km nội tỉnh.
// Khối lượng tính cước = max(khối lượng thực, D×R×C ÷ hệ số quy đổi).
// Quãng đường: nếu định vị được địa chỉ (OpenStreetMap) thì tính theo tọa độ thật, không thì theo trung tâm tỉnh/thành.
const num=(v,d)=>{const x=parseFloat(String(v??'').replace(/[^\d.]/g,''));return isFinite(x)&&x>=0?x:d};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const isXa=a=>/(^|[\s,])(xa(?!\s+lo)|thon|ap|huyen)\s/i.test(norm(a)+' ');
const geoCache=new Map();
// Google Maps: không cần API key – link tìm kiếm / chỉ đường chính thức (api=1) và bản đồ nhúng output=embed
const gq=p=>{const pr=byCode(p.prov);if(p.gps)return p.gps.lat.toFixed(6)+','+p.gps.lng.toFixed(6);return [p.addr.trim(),pr&&pr[1],'Việt Nam'].filter(Boolean).join(', ')};
const gSearch=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(gq(p));
const gDir=(a,b)=>`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(gq(a))}&destination=${encodeURIComponent(gq(b))}&travelmode=driving`;
const gEmbed=(a,b)=>`https://maps.google.com/maps?saddr=${encodeURIComponent(gq(a))}&daddr=${encodeURIComponent(gq(b))}&hl=vi&output=embed`;
async function geocode(q,prov){const k=q+'|'+prov;if(geoCache.has(k))return geoCache.get(k);
 const u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&accept-language=vi&q='+encodeURIComponent(q+', '+prov+', Việt Nam');
 const r=await fetch(u,{headers:{Accept:'application/json'}});const j=r.ok?await r.json():[];const v=j[0]?{lat:+j[0].lat,lng:+j[0].lon,name:j[0].display_name}:null;geoCache.set(k,v);return v}

function Party({id,title,v,set,t,lang,geoOn}){
 const [busy,setBusy]=useState(false),[err,setErr]=useState('');
 const locate=()=>{track('use_location',{field:id});if(!navigator.geolocation){setErr(t.cGeoNo);return}setBusy(true);setErr('');
  navigator.geolocation.getCurrentPosition(async p=>{const {latitude:la,longitude:lo}=p.coords,np=nearest(la,lo);let addr=v.addr;
   if(geoOn){try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=vi&lat=${la}&lon=${lo}`);if(r.ok){const j=await r.json();if(j.display_name)addr=j.display_name.split(',').slice(0,4).join(',').trim()}}catch{}}
   set({...v,prov:np?np[0]:v.prov,addr,area:isXa(addr)?'xa':'phuong',gps:{lat:la,lng:lo},manual:false});setBusy(false)},
   ()=>{setErr(t.cGeoNo);setBusy(false)},{enableHighAccuracy:true,timeout:10000})};
 return(<fieldset className="cp">
  <legend><MapPin size={17}/> {title}</legend>
  <label htmlFor={id+'-p'}>{t.cProv}</label>
  <select id={id+'-p'} value={v.prov} onChange={e=>set({...v,prov:e.target.value,gps:null})} required>
   <option value="">{t.cProvPh}</option>
   {['B','T','N'].map(r=><optgroup key={r} label={REGION[lang]?.[r]||REGION.vi[r]}>{PROVINCES.filter(p=>p[2]===r).map(p=><option key={p[0]} value={p[0]}>{p[1]}</option>)}</optgroup>)}
  </select>
  <label htmlFor={id+'-a'}>{t.cAddr}</label>
  <input id={id+'-a'} value={v.addr} maxLength={160} placeholder={t.cAddrPh} autoComplete={id==='snd'?'street-address':'off'}
   onChange={e=>{const a=e.target.value;set({...v,addr:a,gps:null,area:v.manual?v.area:(isXa(a)?'xa':'phuong')})}}/>
  <div className="cp-row">
   <select aria-label={t.cArea} value={v.area} onChange={e=>set({...v,area:e.target.value,manual:true})}><option value="phuong">{t.cAreaP}</option><option value="xa">{t.cAreaX}</option></select>
   <button type="button" className="cp-gps" onClick={locate} disabled={busy}>{busy?<Loader2 size={15} className="spin"/>:<LocateFixed size={15}/>} {t.cGeo}</button>
  </div>
  {v.prov&&<a className="cp-gm" href={gSearch(v)} target="_blank" rel="noopener noreferrer"><MapIc size={14}/> {t.gmOpen} <ExternalLink size={12}/></a>}
  {err&&<small className="cp-err" role="alert">{err}</small>}
 </fieldset>)}

export default function Calc({rates,cfg={},note,bookingUrl,label,lang='vi'}){
 const t=D[lang]||D.vi,L=LOCALE[lang]||'vi-VN',money=x=>Math.round(x/500)*500,fmt=x=>money(x).toLocaleString(L)+t.cur;
 const C={f:[1,num(cfg.calcF2,1.25),num(cfg.calcF3,1.6),num(cfg.calcF4,2)],km2:num(cfg.calcKm2,300),km3:num(cfg.calcKm3,800),
  remote:num(cfg.calcRemote,15000),pickRemote:num(cfg.calcPickRemote,10000),free:num(cfg.calcIntraFree,20),perKm:num(cfg.calcIntraKm,2500),div:num(cfg.calcVolDiv,6000)||6000,geo:cfg.calcGeo!=='0'};
 const [si,setSi]=useState(0),[w,setW]=useState(1),[dim,setDim]=useState({l:'',w:'',h:''});
 const [snd,setSnd]=useState({prov:'HCM',addr:'',area:'phuong',gps:null,manual:false}),[rcv,setRcv]=useState({prov:'',addr:'',area:'phuong',gps:null,manual:false});
 const [pts,setPts]=useState({a:null,b:null}),[geoSt,setGeoSt]=useState(''),[map,setMap]=useState(false);const tm=useRef();
 const r=rates[si]||rates[0];

 // định vị địa chỉ để tính quãng đường thật (trễ 1,2s sau khi ngừng gõ – tuân thủ giới hạn 1 truy vấn/giây của OpenStreetMap)
 useEffect(()=>{if(!C.geo)return;clearTimeout(tm.current);
  const need=[snd,rcv].some(p=>p.addr.trim().length>5&&p.prov&&!p.gps);if(!need){setPts({a:snd.gps,b:rcv.gps});setGeoSt(snd.gps&&rcv.gps?'ok':'');return}
  setGeoSt('busy');
  tm.current=setTimeout(async()=>{try{
   const one=async p=>p.gps||(p.addr.trim().length>5&&p.prov?await geocode(p.addr.trim(),byCode(p.prov)[1]):null);
   const a=await one(snd);await new Promise(x=>setTimeout(x,1100));const b=await one(rcv);
   const okA=a&&haversine([0,0,0,a.lat,a.lng],byCode(snd.prov))<150,okB=b&&haversine([0,0,0,b.lat,b.lng],byCode(rcv.prov))<150; // bỏ kết quả sai tỉnh
   setPts({a:okA?a:null,b:okB?b:null});setGeoSt(okA&&okB?'ok':'fb')}catch{setGeoSt('fb')}},1200);
  return()=>clearTimeout(tm.current)},[snd.addr,snd.prov,snd.gps,rcv.addr,rcv.prov,rcv.gps,C.geo]);// eslint-disable-line

 const res=useMemo(()=>{const A=byCode(snd.prov),B=byCode(rcv.prov);if(!A||!B||!r)return null;
  const exact=!!(pts.a&&pts.b),km=exact?Math.max(1,Math.round(haversine([0,0,0,pts.a.lat,pts.a.lng],[0,0,0,pts.b.lat,pts.b.lng])*1.3)):roadKm(A,B);
  const same=A[0]===B[0],z=same?0:km<=C.km2?1:km<=C.km3?2:3;
  const kg=Math.max(.1,+w||.1),vol=(+dim.l||0)*(+dim.w||0)*(+dim.h||0)/C.div,cw=Math.max(kg,vol),extra=Math.max(0,Math.ceil(cw)-1);
  const main=((+r.base||0)+extra*(+r.perKg||0))*C.f[z];
  const intra=same&&exact&&km>C.free?(km-C.free)*C.perKm:0;
  const rem=(rcv.area==='xa'?C.remote:0)+(snd.area==='xa'?C.pickRemote:0);
  const max=num(r.maxKm,0),over=max>0&&km>max;
  return{km,z,exact,cw,vol,main,intra,rem,total:main+intra+rem,over,max,same,reg:A[2]===B[2]}},[snd,rcv,pts,w,dim,r,C.km2,C.km3,C.free,C.perKm,C.div,C.remote,C.pickRemote,C.f[1],C.f[2],C.f[3]]);// eslint-disable-line

 const zoneName=res?[t.z1,t.z2,t.z3,t.z4][res.z]:'';
 // GA4: ghi nhận 1 lần mỗi báo giá khác nhau (sau 1,5s ngừng thay đổi)
 const qKey=res?[snd.prov,rcv.prov,r?.name,Math.round(res.total/1000)].join('|'):'';
 useEffect(()=>{if(!qKey)return;const x=setTimeout(()=>track('calc_quote',{service:r?.name,zone:res.z+1,distance_km:res.km,value:Math.round(res.total),currency:'VND',exact:res.exact}),1500);return()=>clearTimeout(x)},[qKey]);// eslint-disable-line
 const book=useMemo(()=>{if(!bookingUrl)return'';try{const u=new URL(bookingUrl,typeof location!=='undefined'?location.origin:'http://x');
  if(res){u.searchParams.set('from',snd.prov);u.searchParams.set('to',rcv.prov);u.searchParams.set('weight',String(res.cw.toFixed(1)));u.searchParams.set('service',r.name||'')}
  return bookingUrl.startsWith('/')?u.pathname+u.search:u.toString()}catch{return bookingUrl}},[bookingUrl,res,snd.prov,rcv.prov,r]);

 return(<div className="calc">
  <form className="calc-f" onSubmit={e=>e.preventDefault()}>
   <h3><Calculator size={22}/> {t.calcH}</h3>
   <div className="cp2"><Party id="snd" title={t.cSender} v={snd} set={setSnd} t={t} lang={lang} geoOn={C.geo}/><Party id="rcv" title={t.cRecv} v={rcv} set={setRcv} t={t} lang={lang} geoOn={C.geo}/></div>
   <fieldset className="cp cp-g"><legend><Package size={17}/> {t.cGoods}</legend>
    <label htmlFor="c-svc">{t.calcSvc}</label>
    <select id="c-svc" value={si} onChange={e=>setSi(+e.target.value)}>{rates.map((x,k)=><option key={k} value={k}>{x.name}</option>)}</select>
    <label htmlFor="c-w">{t.calcW} (kg)</label>
    <div className="cw"><input id="c-w" type="number" min="0.1" max="500" step="0.1" inputMode="decimal" value={w} onChange={e=>setW(e.target.value)}/><input type="range" min="0.5" max="30" step="0.5" value={Math.min(30,+w||0.5)} onChange={e=>setW(e.target.value)} aria-label={t.calcW}/></div>
    <span className="lbl">{t.cDim}</span>
    <div className="cd">{[['l',t.cL],['w',t.cW],['h',t.cH]].map(([k,l])=><input key={k} type="number" min="0" max="300" inputMode="numeric" placeholder={l} aria-label={l+' (cm)'} value={dim[k]} onChange={e=>setDim({...dim,[k]:e.target.value})}/>)}</div>
   </fieldset>
  </form>
  <div className="calc-r" aria-live="polite">
   {!res?<><small>{t.calcEst}</small><p className="cr-empty">{t.cEmpty}</p></>:<>
    <small>{t.calcEst}</small><strong>{fmt(res.total)}</strong><span className="cr-eta">{r.eta}</span>
    <dl className="cr-d">
     <div><dt><Route size={15}/> {t.cDist}</dt><dd>~{res.km.toLocaleString(L)} km · {zoneName}</dd></div>
     <div><dt>{t.cCw}</dt><dd>{(Math.round(res.cw*10)/10).toLocaleString(L)} kg{res.vol>(+w||0)?' '+t.cVolUsed:''}</dd></div>
     <div><dt>{t.cMain}</dt><dd>{fmt(res.main)}</dd></div>
     {res.intra>0&&<div><dt>{t.cIntra}</dt><dd>{fmt(res.intra)}</dd></div>}
     {res.rem>0&&<div><dt>{t.cRemote}</dt><dd>{fmt(res.rem)}</dd></div>}
    </dl>
    <p className="cr-src">{geoSt==='busy'?<><Loader2 size={13} className="spin"/> {t.cLocating}</>:res.exact?<><CircleCheck size={13}/> {t.cExact}</>:<><Info size={13}/> {t.cApprox}</>}</p>
    {res.over&&<p className="cr-warn" role="alert">{t.cOver(res.max)}</p>}</>}
   {res&&<a className="cr-gm" data-ga="view_route" href={gDir(snd,rcv)} target="_blank" rel="noopener noreferrer"><Navigation size={15}/> {t.gmRoute} <ExternalLink size={12}/></a>}
   <em>{note}</em>
   {book&&<a className="note" href={book} onClick={()=>res&&track('begin_checkout',{currency:'VND',value:Math.round(res.total),items:[{item_name:r?.name,item_category:'shipping',quantity:1,price:Math.round(res.total)}]})}>{label||t.book} <ArrowRight size={16}/></a>}
  </div>
  {res&&<div className="cmap">
   <button type="button" className="cmap-t" aria-expanded={map} aria-controls="cmap-f" onClick={()=>setMap(!map)}><MapIc size={17}/> {map?t.gmHide:t.gmShow}</button>
   {map&&<div className="cmap-f" id="cmap-f"><iframe src={gEmbed(snd,rcv)} title={t.gmTitle} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div>}
  </div>}</div>)}
