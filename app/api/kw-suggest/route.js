import {isAdmin} from '@/lib/auth';import {suggest} from '@/lib/kwsuggest';
export const dynamic='force-dynamic';
// GET /api/kw-suggest?q=giao hàng&lang=vi  (chỉ quản trị)
export async function GET(req){if(!isAdmin())return Response.json({error:'Hết phiên đăng nhập'},{status:401});const u=new URL(req.url);
 try{return Response.json(await suggest(u.searchParams.get('q'),u.searchParams.get('lang')||'vi'))}catch(e){return Response.json({error:'Không lấy được gợi ý từ Google: '+e.message,items:[]},{status:502})}}
