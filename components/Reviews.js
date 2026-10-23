'use client';import {useState} from 'react';import {ChevronLeft,ChevronRight,Quote} from 'lucide-react';import {D} from '@/lib/dict';
const Av=({x,c})=>x.img?<img src={x.img} alt={x.name} className={c}/>:<span className={c+' av'}>{(x.name||'?')[0]}</span>;
export default function Reviews({items,lang='vi'}){const t=D[lang]||D.vi,[i,setI]=useState(0),n=items.length,r=items[i];if(!r)return null;
 return(<div className="rev"><div className="rev-main" key={i}><Av x={r} c="rimg"/><div><h3>{r.name}</h3><em>{r.date}</em>{(r.text||'').split('\n').map((t,k)=><p key={k}>{t}</p>)}<Quote className="q" size={56}/></div></div>
 <div className="rev-th"><button aria-label={t.prev} onClick={()=>setI((i+n-1)%n)}><ChevronLeft/></button><div>{items.map((x,k)=><button key={k} className={k===i?'on':''} onClick={()=>setI(k)} aria-label={x.name}><Av x={x} c="th"/></button>)}</div><button aria-label={t.next} onClick={()=>setI((i+1)%n)}><ChevronRight/></button></div></div>)}
