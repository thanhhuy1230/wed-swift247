'use client';import {useState} from 'react';import {Sparkles,BarChart3,Loader2,ExternalLink,Info} from 'lucide-react';
// ===== Công cụ chọn từ khóa chính theo dữ liệu thật của Google =====
// 1) Gợi ý tự động của Google (cụm từ người dùng hay gõ)  2) Search Console: từ khóa bài đang có lượt hiển thị  3) Link Keyword Planner / Trends
const pct=x=>(x*100).toFixed(1)+'%';
export default function KeywordTools({value,seed,onPick,lang='vi',pageUrl='',published=false}){
 const [sg,setSg]=useState(null),[sgL,setSgL]=useState(false),[gs,setGs]=useState(null),[gsL,setGsL]=useState(false);
 const q=(value||seed||'').trim();
 async function loadSg(){if(q.length<2){setSg({error:'Nhập từ khóa hoặc tiêu đề trước (ít nhất 2 ký tự).',items:[]});return}setSgL(true);
  try{const r=await fetch(`/api/kw-suggest?lang=${lang}&q=${encodeURIComponent(q)}`);setSg(await r.json())}catch{setSg({error:'Không kết nối được máy chủ.',items:[]})}finally{setSgL(false)}}
 async function loadGs(){setGsL(true);try{const r=await fetch(`/api/gsc?days=28&page=${encodeURIComponent(pageUrl)}`);setGs(await r.json())}catch{setGs({error:'Không kết nối được máy chủ.',rows:[]})}finally{setGsL(false)}}
 return(<div className="kwt">
  <div className="kwt-b">
   <button type="button" className="btn g" onClick={loadSg} disabled={sgL}>{sgL?<Loader2 size={15} className="spin"/>:<Sparkles size={15}/>} Gợi ý từ Google</button>
   {published&&<button type="button" className="btn g" onClick={loadGs} disabled={gsL}>{gsL?<Loader2 size={15} className="spin"/>:<BarChart3 size={15}/>} Từ khóa thật (Search Console)</button>}
   <a className="lnk" href={`https://trends.google.com/trends/explore?geo=VN&q=${encodeURIComponent(q)}`} target="_blank" rel="noopener">Google Trends <ExternalLink size={12}/></a>
   <a className="lnk" href="https://ads.google.com/aw/keywordplanner/home" target="_blank" rel="noopener">Keyword Planner (lượng tìm kiếm) <ExternalLink size={12}/></a>
  </div>
  {sg&&<div className="kwt-p"><b>Gợi ý tự động của Google cho “{sg.q||q}”</b><small>Cụm từ người dùng thật hay gõ trên Google. Google không công bố lượng tìm kiếm cho từng gợi ý – bấm để dùng làm từ khóa chính.</small>
   {sg.error?<p className="warn">{sg.error}</p>:sg.items.length?<div className="kwt-c">{sg.items.map(x=><button type="button" key={x} className={'au-m'+(x===value?' on':'')} onClick={()=>onPick(x)}>{x}</button>)}</div>:<p className="meta">Google không có gợi ý cho cụm này – thử cụm ngắn hơn.</p>}</div>}
  {gs&&<div className="kwt-p"><b>Từ khóa bài này đang hiển thị trên Google (Search Console, 28 ngày{gs.from?`: ${gs.from} → ${gs.to}`:''})</b>
   {!gs.status?.configured?<p className="warn"><Info size={14}/> Chưa kết nối Search Console. Thêm khóa service account vào <code>.env.local</code> (GSC_CREDENTIALS) và nhập thuộc tính ở Cài đặt trang → SEO &amp; Analytics. Xem hướng dẫn trong README.</p>
   :gs.error?<p className="warn">{gs.error}</p>:gs.rows.length?<div className="tw"><table><thead><tr><th>Từ khóa</th><th>Lượt bấm</th><th>Lượt hiển thị</th><th>CTR</th><th>Vị trí TB</th><th></th></tr></thead><tbody>
    {gs.rows.map(r=><tr key={r.q}><td>{r.q}</td><td>{r.clicks}</td><td>{r.imp}</td><td>{pct(r.ctr)}</td><td>{r.pos.toFixed(1)}</td><td><button type="button" className="btn g" style={{padding:'4px 10px'}} onClick={()=>onPick(r.q)}>Dùng</button></td></tr>)}</tbody></table></div>
   :<p className="meta">Chưa có dữ liệu – bài mới cần vài ngày đến vài tuần để Google thu thập và hiển thị.</p>}</div>}
 </div>)}
