import {all,catList,SITE} from './db';import {analyze,parse,plain,wordsOf} from './seo';import {activeLangs} from './langs';import {read} from './store';import {DEFAULT_CHECKS,CHECK_GROUPS} from './checks';
// ===== Rà soát bài viết: chạy các "mục kiểm tra" cấu hình ở Cài đặt trang → Bài viết & tin tức → "Mục kiểm tra khi rà soát" =====
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const int=(v,d)=>{const n=parseInt(String(v??'').trim(),10);return Number.isFinite(n)?n:d};
const range=(v,d)=>{const m=String(v||'').match(/(\d+)\s*[-–—~]\s*(\d+)/);return m?[+m[1],+m[2]]:d};
const phrases=v=>String(v||'').split(/[;\n]/).map(s=>norm(s.trim())).filter(Boolean);
// Danh sách mục đang BẬT: [{id,label,group,type,field,value}]
export function getChecks(){const raw=read('site.json',{}).postChecks,list=Array.isArray(raw)?raw:DEFAULT_CHECKS;
 return list.filter(x=>x&&x.type&&String(x.on??'1')!=='0').map((x,k)=>({id:'c'+k,type:x.type,field:x.field||'',value:String(x.value||'').trim(),group:String(x.group||'').trim()||'Khác',
  label:String(x.label||'').trim().replace(/\{n\}/g,String(x.value||'').trim())||x.type}))}
export const checkGroups=checks=>{const g=[...new Set(checks.map(c=>c.group))];return[...CHECK_GROUPS.filter(x=>g.includes(x)),...g.filter(x=>!CHECK_GROUPS.includes(x))]};

export function auditPosts(lang){
 const posts=all(lang),checks=getChecks(),ck=new Set(catList(lang).map(c=>c.key)),host=SITE.replace(/^https?:\/\//,'').replace(/\/$/,''),ON=activeLangs(),now=Date.now();
 const ids=Object.fromEntries(ON.filter(l=>l!==lang).map(l=>[l,new Set(all(l).map(p=>p.id))]));
 const tcount={};for(const p of posts){const k=norm(p.title).trim();if(k)tcount[k]=(tcount[k]||0)+1}
 const rows=posts.map(p=>{const text=plain(p.content),words=wordsOf(text).length,P=parse(p.content,host),score=analyze(p,host).score,miss=ON.filter(l=>l!==lang&&!ids[l].has(p.id)),
  val=f=>f==='content'?text:f==='seoTitle'?String(p.seoTitle||'').trim():String(p[f]||'').trim(),body=norm(text+' '+(p.title||'')+' '+(p.excerpt||''));
  const hit=c=>{switch(c.type){
   case 'missing':if(c.field==='coverAlt'&&!String(p.cover||'').trim())return false; // chưa có ảnh bìa thì không tính thiếu alt
    return !!c.field&&!val(c.field);
   case 'len':{if(!c.field)return false;const v=c.field==='seoTitle'?String(p.seoTitle||p.title||'').trim():val(c.field);if(!v&&c.field!=='seoTitle')return false;const[a,b]=range(c.value,[0,1e9]);return v.length<a||v.length>b}
   case 'minWords':return words<int(c.value,300);
   case 'maxWords':return words>int(c.value,3000);
   case 'noH2':return !P.heads.some(h=>h.l===2);
   case 'minImgs':return P.imgs.length<int(c.value,1);
   case 'imgAlt':return P.imgs.some(i=>!i.alt);
   case 'minInternal':return P.internal.length<int(c.value,1);
   case 'minExternal':return P.external.length<int(c.value,1);
   case 'lowSeo':return score<int(c.value,60);
   case 'kwTitle':{const k=norm(p.keyword).trim();return !!k&&!norm(p.seoTitle||p.title).includes(k)}
   case 'badCat':return !ck.has(p.cat);
   case 'dupTitle':return tcount[norm(p.title).trim()]>1;
   case 'noTrans':return miss.length>0;
   case 'old':{const d=Date.parse(p.updated||p.date);return Number.isFinite(d)&&now-d>int(c.value,365)*864e5}
   case 'contains':{const ph=phrases(c.value);return ph.length>0&&ph.some(x=>body.includes(x))}
   case 'notContains':{const ph=phrases(c.value);return ph.length>0&&ph.some(x=>!body.includes(x))}
   case 'draft':return p.status!=='published';
   case 'noindex':return !!p.noindex;
   default:return false}};
  return{id:p.id,title:p.title||'(chưa có tiêu đề)',slug:p.slug||'',cat:p.cat||'',status:p.status==='published'?'published':'draft',noindex:!!p.noindex,date:p.date||'',updated:p.updated||'',
   words,imgs:P.imgs.length,score,issues:checks.filter(hit).map(c=>c.id),missLangs:miss,cover:p.cover||'',
   f:{title:p.title||'',excerpt:p.excerpt||'',content:text.slice(0,20000),seoTitle:p.seoTitle||'',seoDesc:p.seoDesc||'',keyword:p.keyword||'',slug:p.slug||'',coverAlt:p.coverAlt||''}}});
 return{rows,checks}}
