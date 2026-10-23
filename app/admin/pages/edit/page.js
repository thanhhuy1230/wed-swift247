import {redirect} from 'next/navigation';import {isAdmin} from '@/lib/auth';import {allPages} from '@/lib/pages';import {SITE} from '@/lib/db';import {getLang} from '@/lib/lang';import {savePage} from '@/lib/actions';import PostForm from '@/components/PostForm';import AdminNav from '@/components/AdminNav';
export const dynamic='force-dynamic';export const metadata={robots:{index:false},title:'Soạn trang nội dung'};
export default function E({searchParams}){if(!isAdmin())redirect('/admin/login');const lang=getLang(),p=allPages(lang).find(x=>x.id===searchParams.id)||{};
return(<div className="adm wrap wide"><AdminNav cur="pages"/><PostForm key={lang+(p.id||'new')} kind="page" action={savePage} item={p} lang={lang} siteUrl={SITE}/></div>)}
