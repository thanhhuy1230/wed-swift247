'use client';import Field from './Field';
const swap=(a,i,d)=>{const r=[...a],j=i+d;if(j<0||j>=r.length)return a;[r[i],r[j]]=[r[j],r[i]];return r};
// Danh sách con (menu xổ xuống): mỗi dòng gồm Tên + Link
function Sub({value,onChange}){const rows=Array.isArray(value)?value:[];
 const set=(i,k,v)=>onChange(rows.map((x,j)=>j===i?{...x,[k]:v}:x));
 return(<div className="sub" style={{gridColumn:'1/-1'}}><small><b>Menu con (xổ xuống)</b> – để trống nếu mục này không có menu con</small>
 {rows.map((r,i)=>(<div className="subrow" key={i}><Field label="Tên mục con" value={r.label||''} onChange={v=>set(i,'label',v)}/><Field label="Liên kết" value={r.href||''} onChange={v=>set(i,'href',v)}/><div className="rb"><button type="button" className="btn g" onClick={()=>onChange(swap(rows,i,-1))}>↑</button><button type="button" className="btn g" onClick={()=>onChange(swap(rows,i,1))}>↓</button><button type="button" className="btn r" onClick={()=>onChange(rows.filter((_,j)=>j!==i))}>Xóa</button></div></div>))}
 <button type="button" className="btn g" onClick={()=>onChange([...rows,{}])}>+ Thêm mục con</button></div>)}
// Danh sách dòng (điều khiển từ bên ngoài: rows + onChange) – thêm/xóa/sắp xếp đều áp dụng cho ngôn ngữ đang chỉnh sửa
export default function ListEditor({fields,rows,onChange,blank={},name}){
 const set=(i,k,v)=>onChange(rows.map((x,j)=>j===i?{...x,[k]:v}:x));
 return(<div>{rows.map((r,i)=>{const h=r.title||r.label||r.name||r.q||r.kicker;return(<div id={name?`f-${name}-${i}`:undefined} className={'row'+(r.on==='0'?' off':'')} key={i}><b>#{i+1}{h?' – '+h:''}{r.on==='0'&&<em className="row-off"> (đang tắt)</em>}</b><div className="grid2">{fields.map(([k,l,t,o])=>t==='sub'?<Sub key={k} value={r[k]} onChange={v=>set(i,k,v)}/>:<Field key={k} fid={name?`f-${name}-${i}-${k}`:undefined} label={l} type={t} opts={o} value={r[k]||''} onChange={v=>set(i,k,v)}/>)}</div><div className="rb"><button type="button" className="btn g" onClick={()=>onChange(swap(rows,i,-1))} aria-label="Lên">↑</button><button type="button" className="btn g" onClick={()=>onChange(swap(rows,i,1))} aria-label="Xuống">↓</button><button type="button" className="btn r" onClick={()=>{if(confirm('Xóa mục này? (Chỉ có hiệu lực sau khi bấm Lưu)'))onChange(rows.filter((_,j)=>j!==i))}}>Xóa</button></div></div>)})}
 {!rows.length&&<p className="meta">Chưa có mục nào.</p>}
 <button type="button" className="btn" onClick={()=>onChange([...rows,{...blank}])}>+ Thêm mục</button></div>)}
