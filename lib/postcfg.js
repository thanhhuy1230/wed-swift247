import {getSite} from './site';import {getLang} from './lang';
// Cấu hình trang Tin tức & trang bài viết (Cài đặt trang → "Trang Tin tức & bài viết"). Ô trống = giá trị mặc định.
const num=(v,d,min=0,max=60)=>{const n=parseInt(String(v??'').trim(),10);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):d};
const flag=(v,d=true)=>{const x=String(v??'').trim().toLowerCase();return x===''?d:!['0','no','off','false','ẩn','an','khong','không'].includes(x)};
export const postCfg=(l=getLang())=>{const i=getSite(l).info||{};return{
 title:String(i.newsPageTitle||'').trim(),desc:String(i.newsPageDesc||'').trim(),intro:String(i.newsIntro||'').trim(),
 perPage:num(i.newsPerPage,9,3,60),homeCount:num(i.homeNewsCount,6,0,24),related:num(i.relatedCount,3,0,12),
 toc:flag(i.postToc),share:flag(i.postShare),readTime:flag(i.postReadTime),cta:flag(i.postCta,false),ctaText:String(i.postCtaText||'').trim(),
 minWords:num(i.auditMinWords,300,0,5000),minScore:num(i.auditMinScore,60,0,100)}};
