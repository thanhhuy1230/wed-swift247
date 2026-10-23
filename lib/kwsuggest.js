// ===== Gợi ý từ khóa từ Google (dữ liệu gợi ý tự động khi gõ tìm kiếm – Google Autocomplete) =====
// Đây là các cụm từ người dùng THẬT hay gõ trên Google. Google không công bố số lượt tìm cho từng gợi ý –
// muốn biết lượng tìm kiếm hãy dùng Google Keyword Planner; muốn biết từ khóa bài đang có lượt hiển thị hãy dùng Search Console.
const cache=new Map(),TTL=24*3600e3,GL={vi:'vn',en:'us',ja:'jp',ko:'kr',zh:'cn'},HL={vi:'vi',en:'en',ja:'ja',ko:'ko',zh:'zh-CN'};
// Mở rộng thêm vài kiểu tìm kiếm phổ biến để có nhiều gợi ý hơn
const EXT={vi:['',' giá',' là gì',' ở đâu',' tốt nhất',' gần đây','cách '],en:['',' price',' near me',' best','how to ']};
async function one(q,lang){const u=`https://suggestqueries.google.com/complete/search?client=firefox&ie=utf-8&oe=utf-8&hl=${HL[lang]||'vi'}&gl=${GL[lang]||'vn'}&q=${encodeURIComponent(q)}`;
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),4000);
 try{const r=await fetch(u,{signal:ctl.signal,headers:{'user-agent':'Mozilla/5.0','accept':'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);
  const buf=await r.arrayBuffer();let txt=new TextDecoder('utf-8').decode(buf);if(txt.includes('\ufffd'))txt=new TextDecoder('latin1').decode(buf);const j=JSON.parse(txt);return Array.isArray(j[1])?j[1]:[]}
 finally{clearTimeout(t)}}
export async function suggest(q,lang='vi'){q=String(q||'').trim().toLowerCase().slice(0,80);if(q.length<2)return{items:[],q};
 const k=lang+'|'+q,c=cache.get(k);if(c&&Date.now()-c.at<TTL)return c.v;
 const ext=EXT[lang]||[''],res=await Promise.allSettled(ext.map(e=>one(e.endsWith(' ')?e+q:q+e,lang)));
 if(res.every(r=>r.status==='rejected'))throw new Error(String(res[0].reason&&res[0].reason.message||'Không kết nối được Google'));
 const seen=new Set(),items=[];for(const r of res)if(r.status==='fulfilled')for(const s of r.value){const x=String(s).trim();if(x&&!seen.has(x.toLowerCase())){seen.add(x.toLowerCase());items.push(x)}}
 const v={q,items:items.slice(0,24)};cache.set(k,{at:Date.now(),v});if(cache.size>500)cache.delete(cache.keys().next().value);return v}
