import {isAdmin} from '@/lib/auth';import {gscQueries,gscStatus} from '@/lib/gsc';
export const dynamic='force-dynamic';
// GET /api/gsc?page=/post/abc&days=28  (chỉ quản trị) – từ khóa thật từ Google Search Console
export async function GET(req){if(!isAdmin())return Response.json({error:'Hết phiên đăng nhập'},{status:401});const u=new URL(req.url),st=gscStatus();
 if(!st.configured)return Response.json({status:st,rows:[]});
 try{return Response.json({status:st,...await gscQueries({page:u.searchParams.get('page')||'',days:Math.min(480,Math.max(7,+u.searchParams.get('days')||28)),limit:Math.min(100,+u.searchParams.get('limit')||25)})})}
 catch(e){return Response.json({status:st,error:e.message,rows:[]},{status:502})}}
