import {redirect} from 'next/navigation';
export default function C({params}){redirect('/news?cat='+params.cat)}
