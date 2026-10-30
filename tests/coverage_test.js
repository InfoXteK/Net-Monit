const {JSDOM,VirtualConsole}=require('jsdom');const base='http://localhost:50114/';const errs=[];
async function load(path,pre){const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(path+': '+(e.detail&&e.detail.message||e.message).slice(0,120)));
 const d=await JSDOM.fromURL(base+path,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.fetch=(u,o)=>fetch(new URL(u,w.location.href),o);w.Response=Response;w.Headers=Headers;w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});if(pre)pre(w)}});
 await new Promise(r=>setTimeout(r,3000));return d.window}
(async()=>{
 const pre=w=>{w.sessionStorage.setItem('netmon_session','demo-session');w.sessionStorage.setItem('netmon_role','admin');w.sessionStorage.setItem('netmon_email','admin@email.com')};
 let w=await load('index.html',pre);console.log('landing items:',w.document.querySelector('#nItems').textContent,'| ref blocks:',w.document.querySelectorAll('.ref').length,'| scenario cards:',w.document.querySelectorAll('#scen .card').length,'| sample link:',w.document.querySelector('#scen a').href);
 let tot=0,miss=[];
 for(const p of ['index','devices','alerts','settings','speedtest','urlmonitor','networkscan','admin','activation','about']){
  w=await load('demo/'+(p==='index'?'index.html':p+'.html'),pre);if(p==='settings'){[...w.document.querySelectorAll('button')].find(b=>/Thresholds/.test(b.textContent)).click();await new Promise(r=>setTimeout(r,1500))}const G=w.GUIDE.pages[p],d=w.document;
  let n=0,m=[];const TAGS=['BUTTON','A','LABEL','H1','H2','H3','H4','SPAN','TH','DIV'];
  G.sections.forEach(s=>s.items.forEach(([sel,l])=>{n++;let ok;try{ok=sel[0]==='~'?[...d.querySelectorAll('button,a,label,h1,h2,h3,h4,th,span,div')].some(e=>{const t=e.textContent.replace(/\s+/g,' ').trim();return t.includes(sel.slice(1))&&t.length<sel.length+24}):!!d.querySelector(sel)}catch(e){ok=false}if(!ok)m.push(sel)}));
  tot+=n;miss.push(p+': '+(n-m.length)+'/'+n+(m.length?' MISSING '+m.join(' '):''));
  w.close()}
 console.log(miss.join('\n'));console.log('total items',tot,'| JS errors:',errs.filter(e=>!/canvas|getContext/.test(e)).slice(0,8));process.exit(0)})();
