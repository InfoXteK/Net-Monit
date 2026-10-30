/* Net-monit GitHub Pages demo: in-browser stand-in for the Flask API.
   The UI (HTML/CSS/JS) is the REAL V11.3 app. Only /api/* is simulated here.
   State lives in sessionStorage (per tab) so it survives page navigation. */
(function () {
"use strict";
const realFetch = window.fetch.bind(window);
const KEY = "nmdemo_state_v1", SES = "netmon_session", ROLE = "netmon_role", EML = "netmon_email";
const TSK = new Set(["ts","last_checked","triggered_ts","acknowledged_ts","resolved_ts","server_time","created_ts","updated_ts","ack_until_ts"]);
const now = () => Date.now() / 1000;
const R = (a, b) => a + Math.random() * (b - a);
const clone = o => JSON.parse(JSON.stringify(o));
let C = null;
const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { "Content-Type": "application/json" } });
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(C)); } catch (e) {} };

function shift(o, d) {
  if (Array.isArray(o)) o.forEach(x => shift(x, d));
  else if (o && typeof o === "object") for (const k in o) { if (TSK.has(k) && typeof o[k] === "number") o[k] += d; else shift(o[k], d); }
}
const ready = (async () => {
  try { const s = sessionStorage.getItem(KEY); if (s) { C = JSON.parse(s); return; } } catch (e) {}
  const j = await (await realFetch("data/api.json")).json();
  const d = now() - j.__captured; delete j.__captured; shift(j, d);
  C = j; C.__next = { alert: 100, job: 1, scan: 10, spd: 100, aud: 100 }; C.__jobs = {}; C.__notify = {};
  // first visit: sign in as admin so every page is explorable immediately
  if (!sessionStorage.getItem(SES) && !sessionStorage.getItem("nm_demo_out")) {
    sessionStorage.setItem(SES, "demo-session"); sessionStorage.setItem(ROLE, "admin"); sessionStorage.setItem(EML, "admin@email.com");
  }
  save();
})();

const META = () => C["/api/threshold-meta"];
const devs = () => C["/api/devices"];
const rows = () => C["/api/status"].devices;
const admin = h => (h && h["X-Session-Token"] === "demo-session");
function audit(a, t, d) { C["/api/audit?limit=300"].unshift({ action: a, actor: "admin@email.com", detail: d || "", id: C.__next.aud++, target: t || "-", ts: now() }); C["/api/audit?limit=200"] = C["/api/audit?limit=300"]; }

/* ---------- threshold engine (same layering as the real app) ---------- */
function eff(d, k) {
  const m = META().metrics[k] || {}; let e = { warning: m.warning, critical: m.critical, enabled: true, lower_is_worse: !!m.lower_is_worse }, src = "global";
  const g = (C["/api/settings/thresholds"] || {})[k]; if (g) { Object.assign(e, g); src = "global"; }
  const sc = C["/api/settings/thresholds/scoped"] || {};
  [["method", d.method], ["type", d.type]].forEach(([kind, key]) => { const r = ((sc[kind] || {})[key] || {})[k]; if (r) { Object.assign(e, r); src = kind; } });
  const dn = ((C.__notify[d.id || d.device_id] || {}).thresholds || {})[k]; if (dn && (dn.warning != null || dn.critical != null || dn.enabled != null)) { Object.assign(e, dn); src = "device override"; }
  return { e, src, ov: dn || {} };
}
function state(v, t) {
  if (v == null || t.enabled === false) return "ok";
  if (t.lower_is_worse) return (t.critical != null && v <= t.critical) ? "critical" : (t.warning != null && v <= t.warning) ? "warning" : "ok";
  return (t.critical != null && v >= t.critical) ? "critical" : (t.warning != null && v >= t.warning) ? "warning" : "ok";
}
function reeval() {
  const open = C["/api/alerts/active?limit=300"];
  rows().forEach(r => {
    if (r.status === "offline" || r.status === "unknown") return;
    const keys = (META().methods[r.method] || []).filter(k => typeof r.metrics[k] === "number");
    let worst = "ok";
    keys.forEach(k => {
      const { e } = eff(r, k), s = state(r.metrics[k], e), m = META().metrics[k] || {};
      if (s === "critical" || (s === "warning" && worst !== "critical")) worst = s;
      let a = open.find(x => x.device_id === r.device_id && x.metric === k && x.status !== "resolved");
      if (s === "ok") { if (a) { a.status = "resolved"; a.resolved_by = "system"; a.resolved_ts = now(); } return; }
      const msg = `${m.label || k}: ${(+r.metrics[k]).toFixed(1)}, threshold ${s === "critical" ? e.critical : e.warning} ${m.unit || ""}`.trim();
      if (!a) open.push({ id: C.__next.alert++, device_id: r.device_id, device_name: r.name, device_host: r.host, metric: k, severity: s, message: msg, status: "open", triggered_ts: now(), acknowledged_by: null, acknowledged_ts: null, resolved_by: null, resolved_ts: null, ack_until_ts: null });
      else { if (a.severity !== s) { a.severity = s; a.status = "open"; } a.message = msg; }
    });
    r.status = worst === "ok" ? "ok" : worst;
  });
  C["/api/alerts/active?limit=300"] = open.filter(x => x.status !== "resolved" || now() - (x.resolved_ts || 0) < 3600);
}
function jitter() {
  rows().forEach(r => {
    if (r.status === "offline") return;
    for (const k in r.metrics) { const v = r.metrics[k]; if (typeof v !== "number" || ["ssl_days_left", "status_code", "uptime_ticks", "total_gb", "content_size_kb"].includes(k)) continue;
      let n = v + v * R(-0.015, 0.015) + R(-0.2, 0.2); if (k.endsWith("_pct")) n = Math.min(100, Math.max(0, n)); r.metrics[k] = Math.max(0, +n.toFixed(2)); }
    r.last_checked = now();
  });
}
function mkMetrics(m) {
  if (m === "url") return { response_ms: Math.round(R(250, 600)), status_code: 200, ssl_days_left: 80, ssl_handshake_ms: 90, dns_ms: 15, connect_ms: 35, content_size_kb: 120, ssl_status: "ok" };
  const b = { latency_ms: +R(2, 9).toFixed(1), packet_loss_pct: 0 };
  if (["snmp", "powershell", "ssh"].includes(m)) b.cpu_pct = +R(10, 40).toFixed(1);
  if (["powershell", "ssh"].includes(m)) { b.memory_pct = +R(30, 60).toFixed(1); b.disk_pct = +R(30, 60).toFixed(1); }
  if (m === "disk_usage") return { disk_pct: +R(30, 60).toFixed(1), free_gb: 800, total_gb: 2000, latency_ms: 4 };
  return b;
}
function addDevice(d) {
  const i = devs().findIndex(x => x.id === d.id);
  if (i >= 0) { devs()[i] = Object.assign(devs()[i], d); const r = rows().find(x => x.device_id === d.id); if (r) { r.name = d.name; r.host = d.host; r.type = d.type; r.method = d.method; } return; }
  devs().push(d);
  rows().push({ device_id: d.id, name: d.name, type: d.type, method: d.method, host: d.host, status: "ok", last_checked: now(), last_error: null, metrics: mkMetrics(d.method), tile_position: rows().length, tile_hidden: false, tile_size: "normal", tile_col: 0, tile_row: 0 });
}
function status(h) {
  jitter(); reeval();
  const adm = admin(h), out = clone(C["/api/status"]);
  out.devices.forEach(r => { if (!adm) { r.host = "*** (admin only)"; delete r.last_error; } });
  out.devices.sort((a, b) => a.tile_position - b.tile_position);
  const vis = out.devices.filter(r => !r.tile_hidden), s = { total: vis.length };
  ["ok", "warning", "critical", "offline"].forEach(k => s[k] = vis.filter(r => r.status === k).length);
  out.summary = s; out.server_time = now(); out.role = adm ? "admin" : null; out.license = C["/api/license/status"];
  return out;
}
function thrView(id) {
  const d = devs().find(x => x.id === id), r = rows().find(x => x.device_id === id); if (!d || !r) return null;
  const T = { network: "Network device", router: "Router", switch: "Switch", firewall: "Firewall", wireless: "Wireless AP", windows: "Windows server", linux: "Linux server", vmware: "VMware host", nas: "NAS / Storage", printer: "Printer", ups: "UPS", camera: "IP Camera", other: "Other" };
  const M = { ping: "Ping (ICMP)", snmp: "SNMP", powershell: "PowerShell (Windows)", ssh: "SSH (Linux)", disk_usage: "Disk / Shared folder", url: "Website (URL)" };
  return { device: { host: d.host, id: id, last_checked: r.last_checked, last_error: r.last_error, method: d.method, method_label: M[d.method] || d.method, name: d.name, poll_interval_seconds: d.poll_interval_seconds || 30, status: r.status, type: d.type, type_label: T[d.type] || d.type },
    metrics: (META().methods[d.method] || []).map(k => { const m = META().metrics[k], x = eff(d, k); return { key: k, label: m.label, unit: m.unit, lower_is_worse: !!m.lower_is_worse, effective: { warning: x.e.warning, critical: x.e.critical, enabled: x.e.enabled !== false }, override: x.ov, source: x.src }; }) };
}
function validate(th) {
  for (const k in th) { const m = META().metrics[k] || {}, t = th[k], w = t.warning, c = t.critical; if (w == null && c == null) continue;
    for (const v of [w, c]) if (v != null && (isNaN(+v) || +v < m.min || +v > m.max)) return `${m.label || k}: value must be between ${m.min} and ${m.max} ${m.unit || ""}.`;
    if (w != null && c != null) { if (m.lower_is_worse ? +w <= +c : +w >= +c) return `${m.label || k}: ${m.lower_is_worse ? "warning must be above critical" : "warning must be below critical"}.`; } }
  return null;
}
const GEN = { "/api/settings/smtp": 1, "/api/settings/sms-gateway": 1, "/api/settings/call-gateway": 1, "/api/settings/organisation": 1, "/api/settings/notifications": 1, "/api/settings/escalation-defaults": 1, "/api/settings/offline-detection": 1, "/api/admin/appearance": 1, "/api/prefs/theme": 1, "/api/prefs/accent-color": 1, "/api/prefs/bg-color": 1, "/api/prefs/bg-image": 1, "/api/dashboard/view-mode": 1 };

/* ---------- simulated jobs ---------- */
function spdJob(id) {
  const j = C.__jobs["s" + id]; if (!j) return { error: "Speed test job not found" };
  const t = now() - j.t0, p = { engine: "builtin", target: "Cloudflare DXB", rtt_ms: j.rtt };
  if (t < 2) return { id, status: "running", phase: "ping", progress: Object.assign({ mbps: null, elapsed_sec: t }, p) };
  if (t < 9) return { id, status: "running", phase: "download", progress: Object.assign({ mbps: +(j.dl * Math.min(1, (t - 2) / 2) * R(.93, 1.05)).toFixed(2), elapsed_sec: t }, p) };
  if (t < 15) return { id, status: "running", phase: "upload", progress: Object.assign({ mbps: +(j.ul * Math.min(1, (t - 9) / 2) * R(.93, 1.05)).toFixed(2), elapsed_sec: t }, p) };
  if (!j.saved) { j.saved = 1; const r = { download_mbps: j.dl, upload_mbps: j.ul, latency_ms: j.rtt, jitter_ms: j.jit, isp: "Etisalat UAE", public_ip: "203.0.113.24", server: "Cloudflare DXB", method_used: "builtin", elapsed_sec: 15, local_ip: "10.0.1.100", hostname: "NM-SERVER", test_source: "server", ts: now(), id: C.__next.spd++ };
    C["/api/speedtest/history?limit=30"].unshift(r); C["/api/speedtest/history?limit=1"] = [r]; C["/api/speedtest/history"] = C["/api/speedtest/history?limit=30"]; audit("speedtest", "wan", `DL=${j.dl} UL=${j.ul}`); save(); }
  return { id, status: "done", phase: "upload", progress: null, result: C["/api/speedtest/history?limit=1"][0] };
}
const POOL = [["Windows server", [135, 445, 3389], []], ["Linux server", [22, 80, 443], [123]], ["Router / Firewall", [22, 443], [53, 161]], ["Printer", [80, 9100], [161]], ["NAS", [22, 80, 445], [161]], ["Switch", [22, 443], [161]]];
function scanResult(sub) {
  const b = (sub.split("/")[0] || "10.0.1.0").split(".").slice(0, 3).join("."), n = 5 + Math.floor(R(0, 5)), used = new Set(), h = [];
  while (h.length < n) { const o = 2 + Math.floor(R(0, 240)); if (used.has(o)) continue; used.add(o); const p = POOL[Math.floor(R(0, POOL.length))];
    h.push({ ip: `${b}.${o}`, hostname: "", mac: Array.from({ length: 6 }, () => Math.floor(R(0, 255)).toString(16).padStart(2, "0")).join(":").toUpperCase(), vendor: "", open_ports: p[1], udp_ports: p[2], port_details: p[1].map(x => ({ port: x, proto: "tcp", service: "" })).concat(p[2].map(x => ({ port: x, proto: "udp", service: "" }))), device_type: p[0], reachable: true }); }
  h.sort((a, c) => +a.ip.split(".")[3] - +c.ip.split(".")[3]);
  return { subnet: sub, hosts_found: h, total_scanned: 254, hosts_alive: h.length, duration_sec: 12.6, port_scan: true, udp_scan: true, tcp_probed: [22, 80, 443, 445, 3389], udp_probed: [53, 123, 161] };
}
function scanJob(id) {
  const j = C.__jobs["n" + id]; if (!j) return C["/api/networkscan/status/1"];
  const t = now() - j.t0; if (t < 6) return { id, subnet: j.sub, status: "running", created_ts: j.t0, updated_ts: now() };
  if (!j.res) { j.res = scanResult(j.sub); C["/api/networkscan/history"].unshift({ created_ts: j.t0, id, status: "done", subnet: j.sub, updated_ts: now() }); audit("network_scan", j.sub, "found=" + j.res.hosts_alive); save(); }
  return { id, subnet: j.sub, status: "done", result: j.res, created_ts: j.t0, updated_ts: now() };
}

/* ---------- router ---------- */
async function handle(method, url, body, h) {
  await ready;
  const u = new URL(url, location.href), p = u.pathname.replace(/^.*?(\/api\/)/, "/api/"), full = p + u.search, adm = admin(h);
  let m;
  if (method === "GET") {
    if (p === "/api/auth/check") return J(adm ? { logged_in: true, role: "admin", email: "admin@email.com" } : { logged_in: false, role: null, email: null });
    if (p === "/api/status") return J(status(h));
    if (p === "/api/system/info") return J(Object.assign(clone(C[p]), { port: 50114, version: "11.3 (demo)", hostname: "demo-host", license: C["/api/license/status"] }));
    if (p === "/api/alerts/active") { jitter(); reeval(); return J(clone(C["/api/alerts/active?limit=300"])); }
    if (p === "/api/alerts/count") { reeval(); return J({ open: C["/api/alerts/active?limit=300"].filter(a => a.status !== "resolved").length }); }
    if (p === "/api/alerts") return J(clone(C["/api/alerts/active?limit=300"]));
    if (p === "/api/devices") return J(adm ? devs() : devs().map(d => ({ id: d.id, name: d.name, type: d.type, method: d.method })));
    if ((m = p.match(/^\/api\/devices\/([^/]+)\/thresholds$/))) { const v = thrView(decodeURIComponent(m[1])); return v ? J(v) : J({ ok: false, error: "Unknown device." }, 404); }
    if ((m = p.match(/^\/api\/devices\/([^/]+)\/notify$/))) { const id = decodeURIComponent(m[1]); if (!C.__notify[id]) C.__notify[id] = Object.assign(clone(C["/api/devices/win-sql-01/notify"]), { device_id: id, thresholds: {} }); return J(C.__notify[id]); }
    if ((m = p.match(/^\/api\/history\/([^/]+)\/(.+)$/))) { const k = `/api/history/${m[1]}/${m[2]}`; return J(C[k] || []); }
    if (p === "/api/urlmonitor/results") { reeval(); return J(rows().filter(r => r.method === "url").map(r => { const d = devs().find(x => x.id === r.device_id) || {}, o = clone(r); o.url_config = d.url_config || {}; o.poll_interval_seconds = d.poll_interval_seconds || 60; o.device_id = r.device_id;
      [["ssl_days_left", "ssl_state"], ["response_ms", "response_state"]].forEach(([mk, rk]) => { if (r.metrics[mk] != null) o[rk] = state(r.metrics[mk], eff(r, mk).e); }); return o; })); }
    if (p === "/api/speedtest/history") return J(C["/api/speedtest/history?limit=30"].slice(0, +(u.searchParams.get("limit") || 50)));
    if ((m = p.match(/^\/api\/speedtest\/status\/(\d+)$/))) return J(spdJob(+m[1]));
    if ((m = p.match(/^\/api\/networkscan\/status\/(\d+)$/))) return J(scanJob(+m[1]));
    if (p === "/api/admin/generate-token") return J({ token: Math.random().toString(36).slice(2, 8).toUpperCase() + "a" + Math.floor(R(10, 99)) });
    if (p === "/api/admin/config/export") return J({ demo: true, note: "Exported from the browser demo", devices: devs(), thresholds: C["/api/settings/thresholds"], organisation: C["/api/settings/organisation"] });
    const hit = C[full] !== undefined ? C[full] : C[p] !== undefined ? C[p] : null;
    return J(hit === null ? {} : clone(hit));
  }
  const b = body || {};
  if (p === "/api/auth/login") { if (!b.email || !b.token) return J({ ok: false, error: "Email and token required" }, 400); sessionStorage.removeItem("nm_demo_out"); return J({ ok: true, session: "demo-session", role: "admin" }); }
  if (p === "/api/auth/logout") { sessionStorage.setItem("nm_demo_out", "1"); return J({ ok: true }); }
  if (/^\/api\/auth\//.test(p)) return J({ ok: true, message: "Demo: no email is sent." });
  if (!adm && !/urlmonitor\/check|submit-client-result/.test(p)) return J({ error: "Login required" }, 401);
  if (p === "/api/devices" && method === "POST") { for (const f of ["id", "name", "type", "method", "host"]) if (!b[f]) return J({ error: "Missing fields: {'" + f + "'}" }, 400); addDevice(b); audit("add_device", b.id); save(); return J({ ok: true }); }
  if ((m = p.match(/^\/api\/devices\/([^/]+)$/))) { const id = decodeURIComponent(m[1]);
    if (method === "PUT") { b.id = id; addDevice(b); audit("edit_device", id); save(); return J({ ok: true }); }
    if (method === "DELETE") { C["/api/devices"] = devs().filter(d => d.id !== id); C["/api/status"].devices = rows().filter(r => r.device_id !== id); C["/api/alerts/active?limit=300"] = C["/api/alerts/active?limit=300"].filter(a => a.device_id !== id); audit("delete_device", id); save(); return J({ ok: true }); } }
  if ((m = p.match(/^\/api\/devices\/([^/]+)\/test$/))) { const d = devs().find(x => x.id === decodeURIComponent(m[1])), r = rows().find(x => x.device_id === decodeURIComponent(m[1])); const ok = !!r && r.status !== "offline"; return J({ ok, status: ok ? "pass" : "fail", detail: ok ? `${d.method.toUpperCase()} check OK (demo)` : "Request timed out (demo)" }); }
  if ((m = p.match(/^\/api\/devices\/([^/]+)\/thresholds$/)) && method === "POST") { const id = decodeURIComponent(m[1]); const e = validate(b.thresholds || {}); if (e) return J({ ok: false, error: e, errors: [e] }, 400); const n = C.__notify[id] || (C.__notify[id] = Object.assign(clone(C["/api/devices/win-sql-01/notify"]), { device_id: id })); n.thresholds = b.thresholds || {}; audit("set_device_thresholds", id); reeval(); save(); return J({ ok: true, overrides: Object.keys(n.thresholds).length }); }
  if ((m = p.match(/^\/api\/devices\/([^/]+)\/notify$/)) && method === "POST") { const id = decodeURIComponent(m[1]); C.__notify[id] = Object.assign(C.__notify[id] || clone(C["/api/devices/win-sql-01/notify"]), b, { device_id: id }); save(); return J({ ok: true }); }
  if ((m = p.match(/^\/api\/alerts\/(\d+)\/(acknowledge|resolve)$/))) { const a = C["/api/alerts/active?limit=300"].find(x => x.id === +m[1]); if (a) { if (m[2] === "resolve") { a.status = "resolved"; a.resolved_by = "admin@email.com"; a.resolved_ts = now(); } else { a.status = "acknowledged"; a.acknowledged_by = "admin@email.com"; a.acknowledged_ts = now(); } audit("alert_" + m[2], a.device_id); save(); } return J({ ok: true }); }
  if ((m = p.match(/^\/api\/tiles\/([^/]+)\/(hide|show|size)$/))) { const r = rows().find(x => x.device_id === decodeURIComponent(m[1])); if (r) { if (m[2] === "size") r.tile_size = b.size || "normal"; else r.tile_hidden = m[2] === "hide"; save(); } return J({ ok: true }); }
  if (p === "/api/tiles/order") { (b.order || b.device_ids || []).forEach((id, i) => { const r = rows().find(x => x.device_id === id); if (r) r.tile_position = i; }); save(); return J({ ok: true }); }
  if (p === "/api/dashboard/layout") { C[p] = b.layout || b; (Array.isArray(C[p]) ? C[p] : []).forEach(it => { const r = rows().find(x => x.device_id === it.device_id); if (r) { r.tile_position = it.position; r.tile_hidden = !!it.hidden; r.tile_size = it.size || "normal"; r.tile_col = it.col || 0; r.tile_row = it.row || 0; } }); save(); return J({ ok: true }); }
  if (p === "/api/settings/thresholds") { const e = validate(b); if (e) return J({ ok: false, error: e, errors: [e] }, 400); C[p] = b; audit("update_thresholds", "global"); reeval(); save(); return J({ ok: true }); }
  if (p === "/api/settings/thresholds/scoped") { const e = validate(b.thresholds || {}); if (e) return J({ ok: false, error: e, errors: [e] }, 400); const s = C[p]; (s[b.kind] = s[b.kind] || {}); if (Object.keys(b.thresholds || {}).length) s[b.kind][b.key] = b.thresholds; else delete s[b.kind][b.key]; const n = devs().filter(d => d[b.kind] === b.key).length; audit("set_scoped_thresholds", b.kind + ":" + b.key); reeval(); save(); return J({ ok: true, count: n, overrides_removed: 0, devices_changed: 0, cleared_scope: !Object.keys(b.thresholds || {}).length }); }
  if (/\/apply(-all)?$/.test(p)) { audit("apply", p); save(); return J({ ok: true, count: devs().length, applied: devs().length, changed: devs().length }); }
  if (/test(-email)?$/.test(p) || /gateway\/test$/.test(p)) return J({ ok: true, message: "Demo: nothing was sent. The real app sends this through your SMTP / gateway." });
  if (p === "/api/speedtest/run-async" || p === "/api/speedtest/run") { const id = C.__next.job++, j = { t0: now(), dl: +R(190, 340).toFixed(1), ul: +R(70, 140).toFixed(1), rtt: +R(8, 20).toFixed(1), jit: +R(1, 5).toFixed(1) }; C.__jobs["s" + id] = j; save(); if (p.endsWith("/run")) { await new Promise(r => setTimeout(r, 4000)); j.t0 -= 20; return J(spdJob(id).result || {}); } return J({ job_id: id, status: "started" }); }
  if (p === "/api/speedtest/submit-client-result") { const r = Object.assign({ isp: "Your ISP", public_ip: "", server: "Cloudflare", method_used: "browser", test_source: "browser", local_ip: "", hostname: "", ts: now(), id: C.__next.spd++ }, b); C["/api/speedtest/history?limit=30"].unshift(r); C["/api/speedtest/history?limit=1"] = [r]; save(); return J({ ok: true, result: r }); }
  if (p === "/api/speedtest/history" && method === "DELETE") { C["/api/speedtest/history?limit=30"] = []; C["/api/speedtest/history?limit=1"] = []; save(); return J({ ok: true }); }
  if (p === "/api/urlmonitor/check") { const ok = !/fail|down|bad/i.test(b.url || ""); return J({ reachable: ok, host: b.url, status_code: ok ? 200 : 503, response_ms: Math.round(R(180, 700)), dns_ms: Math.round(R(8, 30)), connect_ms: Math.round(R(20, 80)), ssl_handshake_ms: Math.round(R(60, 160)), ssl_days_left: Math.round(R(20, 200)), ssl_status: "ok", content_size_kb: +R(20, 300).toFixed(1), warnings: [], error: ok ? null : "HTTP 503 (demo)" }); }
  if (p === "/api/networkscan/scan") { if (!b.subnet) return J({ error: "subnet is required (e.g. 192.168.1.0/24)" }, 400); const id = C.__next.scan++; C.__jobs["n" + id] = { t0: now(), sub: b.subnet }; save(); return J({ scan_id: id, status: "started", subnet: b.subnet }); }
  if (p === "/api/networkscan/add-devices") { let n = 0; (b.hosts || []).forEach(x => { const ip = x.ip || x; if (!devs().some(d => d.host === ip)) { addDevice({ id: "scan-" + ip.replace(/\./g, "-"), name: x.hostname || ("Host " + ip), host: ip, type: "other", method: "ping", poll_interval_seconds: 30 }); n++; } }); audit("scan_add_devices", "-", n + " added"); save(); return J({ ok: true, added: n }); }
  if (p === "/api/license/activate") { const k = (b.license_key || "").trim(); if (!k) return J({ ok: false, message: "License key is required" }, 400); if (/^NM1-[A-Za-z0-9-]{60,}$/.test(k)) { C["/api/license/status"].state = "licensed"; audit("license_activate", "-", "success"); save(); return J({ ok: true, message: "License activated (demo)." }); } return J({ ok: false, message: "Invalid license key. Real keys start with NM1- and are about 127 characters (Ed25519-signed, verified offline)." }, 400); }
  if (p === "/api/admin/users") { const e = (b.email || "").trim().toLowerCase(); if (!e || !b.token) return J({ ok: false, error: "Email and token required" }, 400); const us = C[p], x = us.find(u => u.email === e); if (x) x.role = b.role; else us.push({ active: 1, email: e, id: us.length + 2, role: b.role || "user" }); audit("add_user", e); save(); return J({ ok: true }); }
  if ((m = p.match(/^\/api\/admin\/users\/(.+?)(\/token|\/email)?$/))) { const e = decodeURIComponent(m[1]); if (method === "DELETE") { C["/api/admin/users"] = C["/api/admin/users"].filter(u => u.email !== e); audit("delete_user", e); save(); } return J({ ok: true }); }
  if (p === "/api/admin/config/import") return J({ ok: true, message: "Demo: import accepted (not applied)." });
  if (p === "/api/settings/custom-placeholders" || /custom-placeholders\//.test(p)) { const L = C["/api/settings/custom-placeholders"]; const k = decodeURIComponent((p.split("/custom-placeholders/")[1] || b.key || "")); if (method === "DELETE") C["/api/settings/custom-placeholders"] = L.filter(x => x.key !== k); else { const x = L.find(i => i.key === (b.key || k)); if (x) Object.assign(x, b); else if (Array.isArray(L)) L.push(b); } save(); return J({ ok: true }); }
  if (/notification-templates\/[^/]+\/preview$/.test(p)) return J({ ok: true, subject: (b.subject_template || "Alert").replace(/\{[^}]+\}/g, "…"), body: (b.body_template || "").replace(/\{[^}]+\}/g, "…") });
  if (/notification-templates\//.test(p)) { save(); return J({ ok: true }); }
  if (GEN[p]) { const cur = C[p]; if (cur && typeof cur === "object" && !Array.isArray(cur)) Object.assign(cur, b); else C[p] = b; if (/^\/api\/settings/.test(p)) audit("update_" + p.split("/").pop(), "-"); save(); return J({ ok: true, logo_path: "" }); }
  save(); return J({ ok: true });
}

window.fetch = function (input, init) {
  const url = typeof input === "string" ? input : input.url;
  if (!/^\/api\/|^api\/|^https?:\/\/[^/]*\/api\//.test(url) || /^https?:\/\/(?!(?:localhost|127\.|[^/]*github\.io))/.test(url)) return realFetch(input, init);
  const method = ((init && init.method) || (typeof input === "object" && input.method) || "GET").toUpperCase();
  let body = null; try { body = init && init.body ? JSON.parse(init.body) : null; } catch (e) {}
  const hd = {}; const H = (init && init.headers) || {}; (H instanceof Headers ? [...H.entries()] : Object.entries(H)).forEach(([k, v]) => hd[k.replace(/^x-session-token$/i, "X-Session-Token")] = v);
  return handle(method, url, body, hd).catch(e => J({ error: "Demo error: " + e.message }, 500));
};

/* ---------- demo banner ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const b = document.createElement("div");
  b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#d97706;color:#000;font:600 12px system-ui,sans-serif;padding:5px 10px;text-align:center";
  b.innerHTML = 'LIVE DEMO · simulated data in your browser, nothing is sent anywhere · Sign in with any email + token · <a href="https://github.com/MohamedAbdullahKhan/Net-Monit" style="color:#000">Get the real app</a> · <a href="#" id="nm-reset" style="color:#000">Reset demo</a>';
  document.body.appendChild(b);
  document.getElementById("nm-reset").onclick = e => { e.preventDefault(); sessionStorage.clear(); location.href = "index.html"; };
});
})();
