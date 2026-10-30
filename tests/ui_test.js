const {JSDOM,VirtualConsole}=require('jsdom');const base='http://localhost:50114/demo/';
async function load(path){const d=await JSDOM.fromURL(base+path,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:new VirtualConsole(),beforeParse(w){w.fetch=(u,o)=>fetch(new URL(u,w.location.href),o);w.Response=Response;w.Headers=Headers;w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.sessionStorage.setItem('netmon_session','demo-session');w.sessionStorage.setItem('netmon_role','admin');w.sessionStorage.setItem('netmon_email','admin@email.com')}});await new Promise(r=>setTimeout(r,2800));return d.window}
const clk=(w,e)=>e.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,clientX:50,clientY:50}));
(async()=>{
 let w=await load('devices.html');clk(w,w.document.getElementById('nmEx'));clk(w,w.document.getElementById('f-method'));
 console.log('EXPLAIN f-method ->',w.document.getElementById('nmPop').textContent.slice(0,110));
 clk(w,w.document.getElementById('nmEx'));clk(w,w.document.getElementById('nmPg'));console.log('GUIDE drawer items:',w.document.querySelectorAll('#nmC .i').length,'| title:',w.document.querySelector('#nmDrawer h3').textContent);
 w=await load('devices.html?scenario=adddevice');console.log('SCEN adddevice prefill:',w.document.getElementById('f-id').value,'|',w.document.getElementById('f-host').value,'| hint:',w.document.getElementById('nmHint').textContent.slice(0,40));
 clk(w,w.document.getElementById('btn-add-device'));await new Promise(r=>setTimeout(r,1500));
 const st=await (await w.fetch('/api/status',{headers:{'X-Session-Token':'demo-session'}})).json();console.log('device added to status:',st.devices.some(d=>d.device_id==='demo-ap-03'));
 w=await load('activation.html?scenario=license');clk(w,w.document.getElementById('activate-btn'));await new Promise(r=>setTimeout(r,1500));console.log('LICENSE result:',w.document.body.textContent.match(/activated[^.]{0,30}|Invalid[^.]{0,40}/i)?.[0]);
 w=await load('urlmonitor.html?scenario=site');console.log('SCEN site quick-url:',w.document.getElementById('quick-url').value);
 process.exit(0)})();
