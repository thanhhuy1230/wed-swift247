import {isAdmin} from '@/lib/auth';import {getSite} from '@/lib/site';import {all} from '@/lib/db';import {allPages} from '@/lib/pages';import {allLeads} from '@/lib/leads';
export const dynamic='force-dynamic';
export async function GET(){if(!isAdmin())return new Response('no',{status:401});
 const d=new Date().toISOString().slice(0,10);
 return new Response(JSON.stringify({site:getSite(),posts:all(),pages:allPages(),leads:allLeads()},null,2),{headers:{'content-type':'application/json','content-disposition':`attachment; filename="backup-${d}.json"`}})}
