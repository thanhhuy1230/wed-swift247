'use client';
import {useState} from 'react';import {ChevronRight,User,Building2} from 'lucide-react';import {track} from '@/lib/ga';
// Tab "Đăng nhập / Đăng ký" trong khung tra cứu trên banner.
// Khách chọn Tài khoản cá nhân / doanh nghiệp → nhập số điện thoại → Tiếp tục: chuyển sang trang đăng nhập (link cài trong Quản trị).
// Mọi chữ & link sửa ở: Quản trị → Cài đặt trang → Khung Tra cứu / Đăng nhập – Đăng ký.
const v=(x,d)=>String(x??'').trim()||d;
export default function AuthBox({info:i,t,edit}){
 const codes=v(i.authCodes,'+84').split(/[,\s]+/).map(x=>x.trim()).filter(Boolean).map(x=>x.startsWith('+')?x:'+'+x);
 const biz=v(i.authBusiness,t.authBusiness),hasBiz=biz!=='-';
 const [type,setType]=useState('personal'),[cc,setCc]=useState(codes[0]||'+84'),[num,setNum]=useState(''),[ok,setOk]=useState(true),[err,setErr]=useState('');
 const submit=e=>{e.preventDefault();if(edit)return;
  const d=num.replace(/\D/g,'').replace(/^0+/,'');
  if(d.length<8||d.length>12){setErr(t.authErr);return}
  if(!ok){setErr(t.authNeedAgree);return}
  setErr('');
  const full=cc.replace(/\D/g,'')+d,local='0'+d;
  let u=v(type==='business'?(i.authUrlBusiness||i.authUrlPersonal):i.authUrlPersonal,'')||i.loginUrl||i.bookingUrl||'';
  if(!u)return;
  const has=/\{(phone|local|type)\}/.test(u);
  u=u.replace(/\{phone\}/g,encodeURIComponent(full)).replace(/\{local\}/g,encodeURIComponent(local)).replace(/\{type\}/g,type);
  if(!has){try{const x=new URL(u,location.href);x.searchParams.set('phone',full);x.searchParams.set('type',type);u=x.toString()}catch{}}
  track('login_click',{location:'hero_box',account_type:type});
  location.href=u};
 // câu đồng ý: {terms} và {privacy} → link
 const agree=v(i.authAgree,t.authAgree).split(/(\{terms\}|\{privacy\})/).map((p,k)=>p==='{terms}'?<a key={k} href={v(i.authTermsUrl,t.authTermsUrl)} target="_blank" rel="noopener">{v(i.authTerms,t.authTerms)}</a>:p==='{privacy}'?<a key={k} href={v(i.authPrivacyUrl,t.authPrivacyUrl)} target="_blank" rel="noopener">{v(i.authPrivacy,t.authPrivacy)}</a>:p);
 return(<form className="au" onSubmit={submit} noValidate>
  <h2>{v(i.authTitle,t.authTitle)}</h2>
  {hasBiz&&<div className="au-seg" role="radiogroup" aria-label={t.authType}>
   <button type="button" role="radio" aria-checked={type==='personal'} className={type==='personal'?'on':''} onClick={()=>setType('personal')}><User size={17}/>{v(i.authPersonal,t.authPersonal)}</button>
   <button type="button" role="radio" aria-checked={type==='business'} className={type==='business'?'on':''} onClick={()=>setType('business')}><Building2 size={17}/>{biz}</button></div>}
  <div className={'au-ph'+(err&&err===t.authErr?' bad':'')}>
   {codes.length>1?<select value={cc} onChange={e=>setCc(e.target.value)} aria-label={t.authCc}>{codes.map(c=><option key={c}>{c}</option>)}</select>:<span className="au-cc">{cc}</span>}
   <input type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16} value={num} onChange={e=>{setNum(e.target.value.replace(/[^\d\s.-]/g,''));if(err)setErr('')}} placeholder={v(i.authPhonePh,t.authPhonePh)} aria-label={v(i.authPhonePh,t.authPhonePh)} aria-invalid={err===t.authErr||undefined}/></div>
  {err&&<p className="au-er" role="alert">{err}</p>}
  <button className="pill au-go">{v(i.authBtn,t.authBtn)} <ChevronRight size={18}/></button>
  <label className="au-ag"><input type="checkbox" checked={ok} onChange={e=>{setOk(e.target.checked);if(e.target.checked&&err===t.authNeedAgree)setErr('')}}/><span>{agree}</span></label>
 </form>)}
