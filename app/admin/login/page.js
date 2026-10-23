import {login} from '@/lib/actions';import {Lock} from 'lucide-react';
export const metadata={robots:{index:false},title:'Đăng nhập quản trị'};
export default function L({searchParams}){return(<form action={login} className="adm f" style={{maxWidth:360}}><h2><Lock size={20}/> Quản trị</h2>{searchParams.e&&<p style={{color:'#dc2626'}}>{searchParams.e==='2'?'Nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút':'Sai mật khẩu'}</p>}<input type="password" name="p" placeholder="Mật khẩu" required/><button className="btn">Đăng nhập</button></form>)}
