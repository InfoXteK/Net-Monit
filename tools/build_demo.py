import json,re,os,shutil
SRC='/home/claude/work'; ROOT='/mnt/user-data/outputs/Net-monit-GitHub-Pages'; OUT=ROOT+'/docs/demo'
shutil.rmtree(ROOT,ignore_errors=True); os.makedirs(OUT+'/static/js'); os.makedirs(OUT+'/static/css'); os.makedirs(OUT+'/static/img'); os.makedirs(OUT+'/data')
cap=json.load(open('/home/claude/cap/api.json')); pg=json.load(open('/home/claude/cap/pages.json'))
cap['__captured']=max(r['last_checked'] for r in cap['/api/status']['devices'] if r.get('last_checked'))
txt=json.dumps(cap).replace('A34C99977046A123','DEMO-7F3A91C2E4B05D68').replace('1EF76FE562F078DB','DEMO-A1B2C3D4').replace('"hostname": "vm"','"hostname": "demo-host"')
open(OUT+'/data/api.json','w').write(txt)
PAGES='devices|settings|alerts|admin|activation|speedtest|urlmonitor|networkscan|about'
def fix(s):
    s=re.sub(r'(["\'`])/static/',r'\1static/',s)
    s=re.sub(r'(["\'`])/('+PAGES+r')(?=[#?"\'`])',r'\1\2.html',s)
    s=re.sub(r'((?:href|action|location\.href\s*=)\s*=?\s*["\'])/(?=["\'#])',r'\1index.html',s)
    return s
for n,(code,h) in pg.items():
    assert code==200,(n,code)
    h=fix(h)
    h=h.replace('</body>','<link rel="stylesheet" href="static/css/demo-guide.css"><script src="static/js/guide-data.js"></script><script src="static/js/demo-guide.js"></script></body>',1)
    h=h.replace('<head>','<head>\n<script src="static/js/demo-shim.js"></script>',1) if '<head>' in h else '<script src="static/js/demo-shim.js"></script>'+h
    open(f'{OUT}/{n}.html','w').write(h)
for f in os.listdir(SRC+'/static/js'): open(f'{OUT}/static/js/{f}','w').write(fix(open(f'{SRC}/static/js/{f}').read()))
shutil.copy(SRC+'/static/css/style.css',OUT+'/static/css/style.css')
sh=open('/home/claude/demo-shim.js').read()
a=sh.index('/* ---------- demo banner'); b=sh.index('})();',a)
open(OUT+'/static/js/demo-shim.js','w').write(sh[:a]+sh[b:])
G='/home/claude/guide/'
shutil.copy(G+'demo-guide.css',OUT+'/static/css/'); shutil.copy(G+'demo-guide.js',OUT+'/static/js/'); shutil.copy('/home/claude/guide-data.js',OUT+'/static/js/')
shutil.copy(G+'landing.html',ROOT+'/docs/index.html')
open(OUT+'/static/img/favicon.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#2563eb"/><path d="M4 18h6l3-8 5 14 3-9h7" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')
open(ROOT+'/docs/.nojekyll','w').close()
print(sorted(os.listdir(OUT)))
