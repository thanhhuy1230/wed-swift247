'use client';import {useState,useEffect,useRef} from 'react';import {usePathname} from 'next/navigation';import {switchLang} from '@/lib/actions';import {Languages,Check,ChevronDown} from 'lucide-react';
import {LANGS,LANG_NAME,LANG_SHORT,HREFLANG,D} from '@/lib/dict';import {track} from '@/lib/ga';
// Chọn ngôn ngữ (VI · EN · JA · KO · ZH). Đổi xong chuyển tới URL của ngôn ngữ mới (?hl=xx) – trang bài viết/trang nội dung
// chuyển đúng sang bản dịch cùng id; chưa có bản dịch thì về trang danh sách tương ứng.
export default function LangSwitch({lang,className='',langs=LANGS,off=[]}){const p=usePathname(),[busy,setB]=useState(false),[open,setO]=useState(false),box=useRef(null),t=D[lang]||D.vi;
 useEffect(()=>{if(!open)return;const c=e=>{if(!box.current?.contains(e.target))setO(false)},k=e=>{if(e.key==='Escape')setO(false)};
  document.addEventListener('pointerdown',c);document.addEventListener('keydown',k);return()=>{document.removeEventListener('pointerdown',c);document.removeEventListener('keydown',k)}},[open]);
 async function go(l){setO(false);if(l===lang||busy)return;setB(true);track('language_change',{language:l,previous_language:lang});
  try{const sp=new URLSearchParams(location.search),id=sp.get('id')||'';const d=await switchLang(l,p+(p.startsWith('/admin')?'':(()=>{sp.delete('hl');const q=sp.toString();return q?'?'+q:''})()),id);
   d?location.assign(d+(d.includes('#')?'':location.hash)):location.reload()}catch{setB(false)}}
 return(<div className={'lsw '+(open?'open ':'')+className} ref={box}>
  <button type="button" className="lsw-b" aria-haspopup="listbox" aria-expanded={open} aria-label={`${t.langLabel}: ${LANG_NAME[lang]}`} disabled={busy} onClick={()=>setO(!open)}>
   <Languages size={15} aria-hidden="true"/><b>{LANG_SHORT[lang]}</b><ChevronDown size={14} aria-hidden="true"/></button>
  {open&&<ul className="lsw-m" role="listbox" aria-label={t.langLabel}>{langs.map(k=><li key={k} role="option" aria-selected={k===lang}>
   <button type="button" lang={HREFLANG[k]} onClick={()=>go(k)} className={k===lang?'on':''}><span className="lsw-c">{LANG_SHORT[k]}</span><span>{LANG_NAME[k]}</span>{off.includes(k)&&<em className="lsw-off">đang tắt</em>}{k===lang&&<Check size={15}/>}</button></li>)}</ul>}
 </div>)}
