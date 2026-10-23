// Mục lục tự động từ H2/H3 (tốt cho SEO: tạo liên kết neo, Google có thể hiện "Chuyển đến mục")
export default function Toc({items=[],title='Mục lục'}){if(items.length<3)return null;
 return(<details className="toc" open><summary>{title}</summary><ol>{items.map(h=><li key={h.id} className={h.l===3?'l3':''}><a href={'#'+h.id}>{h.t}</a></li>)}</ol></details>)}
