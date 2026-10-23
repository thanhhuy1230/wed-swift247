// Gửi sự kiện Google Analytics 4 (an toàn khi chưa cài GA hoặc bị trình chặn quảng cáo chặn)
export const track=(name,params={})=>{try{if(typeof window!=='undefined'&&typeof window.gtag==='function')window.gtag('event',name,params)}catch{}};
