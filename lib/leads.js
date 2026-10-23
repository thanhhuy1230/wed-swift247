import {read,write} from './store';
export const allLeads=()=>read('leads.json',[]);
export const saveLeads=a=>write('leads.json',a);
