import os,sys,json,re,time,random
os.chdir('/home/claude/work'); sys.path.insert(0,'.')
random.seed(7)
import app as A
from monitor import database as db, config_manager as cm
tok=re.search(r'Token : (\S+)',open('data/FIRST-RUN-ADMIN-TOKEN.txt').read()).group(1)
c=A.app.test_client()
r=c.post('/api/auth/login',json={'email':'admin@email.com','token':tok}); S=r.get_json()['session']; H={'X-Session-Token':S}
# (id,name,host,type,method,status,metrics,err)
D=[("fw-edge-01","FortiGate Edge Firewall","10.0.0.1","firewall","snmp","ok",{"latency_ms":2.1,"packet_loss_pct":0,"cpu_pct":23,"bandwidth_pct":41,"in_mbps":182.4,"out_mbps":96.2,"uptime_ticks":812340000},None),
("core-sw-01","Core Switch 48p","10.0.0.2","switch","snmp","ok",{"latency_ms":1.4,"packet_loss_pct":0,"cpu_pct":18,"bandwidth_pct":35,"in_mbps":410.2,"out_mbps":388.7,"uptime_ticks":1203400000},None),
("rtr-wan-01","WAN Router DXB","10.0.0.3","router","ping","ok",{"latency_ms":8.7,"packet_loss_pct":0},None),
("ap-lobby","Wireless AP Lobby","10.0.2.11","wireless","ping","ok",{"latency_ms":4.2,"packet_loss_pct":0},None),
("ap-floor2","Wireless AP Floor 2","10.0.2.12","wireless","ping","warning",{"latency_ms":142.5,"packet_loss_pct":6},None),
("win-dc-01","Domain Controller","10.0.1.10","windows","powershell","ok",{"latency_ms":3.1,"packet_loss_pct":0,"cpu_pct":31,"memory_pct":58,"disk_pct":47,"services":[{"name":"NTDS","display":"Active Directory Domain Services","status":"Running"},{"name":"DNS","display":"DNS Server","status":"Running"}],"tasks":[]},None),
("win-sql-01","SQL Server Prod","10.0.1.20","windows","powershell","critical",{"latency_ms":5.6,"packet_loss_pct":0,"cpu_pct":93,"memory_pct":96,"disk_pct":82,"services":[{"name":"MSSQLSERVER","display":"SQL Server","status":"Running"},{"name":"SQLSERVERAGENT","display":"SQL Server Agent","status":"Stopped"}],"tasks":[]},None),
("lin-web-01","Linux Web Server","10.0.1.30","linux","ssh","ok",{"latency_ms":2.9,"packet_loss_pct":0,"cpu_pct":27,"memory_pct":64,"disk_pct":55},None),
("lin-bkp-01","Linux Backup Server","10.0.1.31","linux","ssh","warning",{"latency_ms":3.4,"packet_loss_pct":0,"cpu_pct":44,"memory_pct":71,"disk_pct":88},None),
("esx-01","VMware ESXi Host","10.0.1.40","vmware","ping","ok",{"latency_ms":2.2,"packet_loss_pct":0},None),
("nas-01","Synology NAS","10.0.1.50","nas","disk_usage","warning",{"disk_pct":86,"free_gb":412.0,"total_gb":3000.0,"latency_ms":3.8},None),
("prn-hr","HR Printer","10.0.3.21","printer","ping","ok",{"latency_ms":6.1,"packet_loss_pct":0},None),
("ups-dc","Datacenter UPS","10.0.0.9","ups","ping","ok",{"latency_ms":3.3,"packet_loss_pct":0},None),
("cam-gate","Gate Camera","10.0.4.5","camera","ping","offline",{"latency_ms":None,"packet_loss_pct":100},"Request timed out"),
("url-corp","Corporate Website","https://infoxtek.com","other","url","ok",{"response_ms":412,"status_code":200,"ssl_days_left":64,"ssl_handshake_ms":88,"dns_ms":14,"connect_ms":31,"content_size_kb":184.2,"ssl_status":"ok"},None),
("url-portal","Customer Portal","https://portal.example.ae","other","url","warning",{"response_ms":1346,"status_code":200,"ssl_days_left":12,"ssl_handshake_ms":140,"dns_ms":22,"connect_ms":55,"content_size_kb":512.7,"ssl_status":"warning"},None),
("url-api","Public API","https://api.example.ae/health","other","url","critical",{"response_ms":3480,"status_code":503,"ssl_days_left":4,"ssl_handshake_ms":160,"dns_ms":19,"connect_ms":47,"content_size_kb":0.4,"ssl_status":"critical"},"HTTP 503")]
for i,(did,n,h,t,m,st,mt,er) in enumerate(D):
    d={"id":did,"name":n,"host":h,"type":t,"method":m,"poll_interval_seconds":30}
    if m=="url": d["url_config"]={"expected_status":200,"timeout_sec":10,"check_ssl":True,"max_response_ms":1000,"ssl_warn_days":30}
    cm.add_or_update_device(d)
    db.upsert_device_status(did,n,t,m,h,st,mt,er)
    for k,v in mt.items():
        if isinstance(v,(int,float)):
            for j in range(24): db.record_metric(did,k,max(0,v*random.uniform(.85,1.12)),"ok")
for did,n,h,mtr,sev,msg in [("win-sql-01","SQL Server Prod","10.0.1.20","cpu_pct","critical","CPU %: 93.0, threshold 90 %"),("win-sql-01","SQL Server Prod","10.0.1.20","memory_pct","critical","Memory %: 96.0, threshold 95 %"),("ap-floor2","Wireless AP Floor 2","10.0.2.12","latency_ms","warning","Latency (ms): 142.5, threshold 100 ms"),("lin-bkp-01","Linux Backup Server","10.0.1.31","disk_pct","warning","Disk %: 88.0, threshold 85 %"),("url-portal","Customer Portal","https://portal.example.ae","ssl_days_left","warning","SSL certificate expires in (days): 12, threshold 30 days"),("url-api","Public API","https://api.example.ae/health","response_ms","critical","Response time (ms): 3480.0, threshold 3000 ms"),("cam-gate","Gate Camera","10.0.4.5","status","critical","Device is OFFLINE: Request timed out")]:
    db.upsert_active_alert(did,n,h,mtr,sev,msg)
for i in range(10): db.record_speedtest({"download_mbps":round(random.uniform(180,340),1),"upload_mbps":round(random.uniform(60,140),1),"latency_ms":round(random.uniform(8,22),1),"jitter_ms":round(random.uniform(1,6),1),"isp":"Etisalat UAE","public_ip":"203.0.113.24","server":"Cloudflare DXB","method_used":"builtin","elapsed_sec":24.5,"local_ip":"10.0.1.100","hostname":"NM-SERVER","test_source":"server" if i%3 else "browser"})
hosts=[("10.0.1.10","dc01.corp.local","Windows server",[53,88,135,389,445,3389],[53,123]),("10.0.1.20","sql01.corp.local","Windows server",[135,445,1433,3389],[]),("10.0.1.30","web01","Linux server",[22,80,443],[123]),("10.0.1.50","nas01","NAS",[22,80,443,445],[161]),("10.0.1.1","gw","Router / Firewall",[22,443],[53,161]),("10.0.1.77","","Printer",[80,9100],[161])]
res={"subnet":"10.0.1.0/24","hosts_found":[{"ip":i,"hostname":hn,"mac":"00:1A:2B:%02X:%02X:%02X"%(random.randint(0,255),random.randint(0,255),k),"vendor":"Dell Inc." if "Win" in t else "Generic","open_ports":p,"udp_ports":u,"port_details":[{"port":x,"proto":"tcp","service":""} for x in p]+[{"port":x,"proto":"udp","service":""} for x in u],"device_type":t,"reachable":True} for k,(i,hn,t,p,u) in enumerate(hosts)],"total_scanned":254,"hosts_alive":len(hosts),"duration_sec":18.4,"port_scan":True,"udp_scan":True,"tcp_probed":[22,80,443,445,3389],"udp_probed":[53,123,161]}
j=db.create_scan_job("10.0.1.0/24"); db.update_scan_job(j,"done",res)
for a,b,t in [("admin@email.com","add_device","fw-edge-01"),("admin@email.com","update_thresholds","server"),("admin@email.com","network_scan","10.0.1.0/24"),("admin@email.com","login","-")]: db.audit_log(a,b,t,"")
db.add_user("viewer@demo.local","user",A.auth._hash_token("demo") if hasattr(A.auth,"_hash_token") else "x") if False else None
# ---- capture
cap={}
def G(p):
    r=c.get(p,headers=H)
    try: cap[p]=r.get_json() if r.is_json else None
    except Exception: pass
    return r
al=[a["id"] for a in (G('/api/alerts/active?limit=300').get_json() or [])]
for p in ['/api/alerts/count','/api/alerts?limit=200','/api/status','/api/system/info','/api/devices','/api/prefs/theme','/api/prefs/accent-color','/api/prefs/bg-color','/api/prefs/bg-image','/api/admin/appearance','/api/appearance/defaults','/api/dashboard/layout','/api/dashboard/view-mode','/api/settings/smtp','/api/settings/sms-gateway','/api/settings/call-gateway','/api/settings/organisation','/api/settings/notifications','/api/settings/thresholds','/api/threshold-meta','/api/settings/escalation-defaults','/api/monitor-facets','/api/settings/thresholds/scoped','/api/settings/offline-detection','/api/settings/notification-templates','/api/settings/custom-placeholders','/api/admin/users','/api/admin/email-groups','/api/audit?limit=300','/api/audit?limit=200','/api/license/status','/api/speedtest/history?limit=30','/api/speedtest/history?limit=1','/api/speedtest/history','/api/urlmonitor/results','/api/networkscan/detect-subnets','/api/networkscan/history',f'/api/networkscan/status/{j}','/api/auth/check']:G(p)
for d in D:
    for p in (f'/api/devices/{d[0]}/notify',f'/api/devices/{d[0]}/thresholds'): G(p)
    for k in D and (d[6] or {}):
        if isinstance(d[6][k],(int,float)): G(f'/api/history/{d[0]}/{k}')
pages={}
for n,p in [('index','/'),('devices','/devices'),('settings','/settings'),('alerts','/alerts'),('speedtest','/speedtest'),('urlmonitor','/urlmonitor'),('networkscan','/networkscan'),('admin','/admin'),('about','/about'),('activation','/activation')]:
    r=c.get(p,headers=H,follow_redirects=False); pages[n]=(r.status_code,r.get_data(as_text=True))
os.makedirs('/home/claude/cap',exist_ok=True)
json.dump(cap,open('/home/claude/cap/api.json','w'))
json.dump(pages,open('/home/claude/cap/pages.json','w'))
print({k:v[0] for k,v in pages.items()}, len(cap),'api captures', 'scan_id',j)
