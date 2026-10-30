/* =============================================================================
   Net-monit V11.3 -- shared monitor filter bar (V11.3 patch 04)
   One small component used on Settings > Thresholds, Monitors, Escalation and Notifications.
   A bar offers: search text, TYPE (servers, network gear, firewalls, switches ...) and METHOD (ping, SSH,
   PowerShell, SNMP, shared folders ...). It filters every element inside its scope that carries
     data-mon-id  data-mon-name  data-mon-type  data-mon-method
   (table rows, in practice). It watches its scope, so rows re-rendered later are filtered again automatically.
   ============================================================================= */
const MonFilter = (function () {
  const TYPE_LABELS = { network: "Network device", router: "Router", switch: "Switch", firewall: "Firewall", wireless: "Wireless AP",
    windows: "Windows server", linux: "Linux server", vmware: "VMware host", nas: "NAS / Storage", printer: "Printer", ups: "UPS",
    camera: "IP Camera", other: "Other" };
  const METHOD_LABELS = { ping: "Ping (ICMP)", snmp: "SNMP", powershell: "PowerShell (Windows)", ssh: "SSH (Linux)",
    disk_usage: "Shared folders / disks", url: "Websites" };
  // Pseudo types: one choice that covers several real types ("all servers", "all network gear").
  const TYPE_GROUPS = { "@servers": { label: "Servers (all)", types: ["windows", "linux", "vmware"] },
                        "@network": { label: "Network gear (all)", types: ["network", "router", "switch", "wireless"] } };
  const bars = {};
  let _facets = null, _facetsAt = 0;
  const FACET_TTL_MS = 4000;      // the tabs call mount() every time they load; do not hit the server each time

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Pure: does a row (name/type/method) pass the filter state? (unit-tested) */
  function matches(state, row) {
    const q = (state.q || "").trim().toLowerCase();
    if (q && !(String(row.name || "").toLowerCase().includes(q) || String(row.type || "").toLowerCase().includes(q) ||
               String(row.method || "").toLowerCase().includes(q))) return false;
    if (state.type) {
      const g = TYPE_GROUPS[state.type];
      if (g ? !g.types.includes(row.type) : row.type !== state.type) return false;
    }
    if (state.method && row.method !== state.method) return false;
    return true;
  }

  async function loadFacets(force) {
    if (_facets && (!force || Date.now() - _facetsAt < FACET_TTL_MS)) return _facets;
    try {
      const r = await fetch("/api/monitor-facets", { headers: { "X-Session-Token": (typeof getSession === "function" ? getSession() : "") } });
      if (r.ok) { _facets = await r.json(); _facetsAt = Date.now(); }
    } catch (_) {}
    return _facets || { types: [], methods: [] };
  }

  function optionsHTML(facets, kind, current) {
    const rows = kind === "type" ? facets.types : facets.methods.filter(m => m.id !== "url" || true);
    let h = '<option value="">' + (kind === "type" ? "All types" : "All methods") + "</option>";
    if (kind === "type") {
      const have = (ids) => facets.types.filter(t => ids.includes(t.id)).reduce((n, t) => n + t.count, 0);
      Object.keys(TYPE_GROUPS).forEach(g => { const n = have(TYPE_GROUPS[g].types); if (n) h += '<option value="' + g + '"' + (current === g ? " selected" : "") + ">" + esc(TYPE_GROUPS[g].label) + " (" + n + ")</option>"; });
    }
    rows.forEach(x => { h += '<option value="' + esc(x.id) + '"' + (current === x.id ? " selected" : "") + ">" + esc(x.label || (kind === "type" ? TYPE_LABELS[x.id] : METHOD_LABELS[x.id]) || x.id) + " (" + x.count + ")</option>"; });
    return h;
  }

  function apply(id) {
    const b = bars[id]; if (!b) return;
    const scope = document.getElementById(b.scopeId); if (!scope) return;
    let shown = 0, total = 0;
    scope.querySelectorAll("[data-mon-id]").forEach(el => {
      total++;
      const ok = matches(b.state, { name: el.getAttribute("data-mon-name"), type: el.getAttribute("data-mon-type"), method: el.getAttribute("data-mon-method") });
      const want = ok ? "" : "none";
      if (el.style.display !== want) el.style.display = want;
      if (ok) shown++;
    });
    scope.querySelectorAll("[data-mon-box]").forEach(box => {            // a group heading disappears with its last visible row
      const any = [...box.querySelectorAll("[data-mon-id]")].some(el => el.style.display !== "none");
      const want = any ? "" : "none";
      if (box.style.display !== want) box.style.display = want;
    });
    const cnt = document.getElementById(id + "-count");
    const txt = total ? (shown === total ? total + " monitor" + (total === 1 ? "" : "s") : "Showing " + shown + " of " + total) : "";
    if (cnt && cnt.textContent !== txt) cnt.textContent = txt;
    return { shown, total };
  }

  async function mount(hostId, scopeId, opts) {
    const host = document.getElementById(hostId); if (!host) return;
    opts = opts || {};
    const facets = await loadFacets(true);
    const bar = bars[hostId] || (bars[hostId] = { state: { q: "", type: "", method: "" }, obs: null, timer: null, burst: [] });
    bar.scopeId = scopeId;
    const st = bar.state;
    if (!/\bmon-filter\b/.test(host.className || "")) host.className = ((host.className || "") + " mon-filter").trim();
    host.innerHTML =
      '<input type="search" id="' + hostId + '-q" placeholder="Search name, type or method" value="' + esc(st.q) + '" aria-label="Search monitors">' +
      '<select id="' + hostId + '-type" aria-label="Filter by type">' + optionsHTML(facets, "type", st.type) + "</select>" +
      '<select id="' + hostId + '-method" aria-label="Filter by method">' + optionsHTML(facets, "method", st.method) + "</select>" +
      '<button type="button" class="btn secondary small" id="' + hostId + '-clear">Clear</button>' +
      '<span class="mon-filter-count" id="' + hostId + '-count"></span>';
    const on = () => { st.q = document.getElementById(hostId + "-q").value; st.type = document.getElementById(hostId + "-type").value;
                       st.method = document.getElementById(hostId + "-method").value; apply(hostId); if (opts.onChange) opts.onChange(Object.assign({}, st)); };
    document.getElementById(hostId + "-q").addEventListener("input", on);
    document.getElementById(hostId + "-type").addEventListener("change", on);
    document.getElementById(hostId + "-method").addEventListener("change", on);
    document.getElementById(hostId + "-clear").addEventListener("click", () => { st.q = ""; st.type = ""; st.method = "";
      ["q", "type", "method"].forEach(k => { const e = document.getElementById(hostId + "-" + k); if (e) e.value = ""; });
      apply(hostId); if (opts.onChange) opts.onChange(Object.assign({}, st)); });
    const scope = document.getElementById(scopeId);
    if (scope && typeof MutationObserver === "function") {
      if (bar.obs) bar.obs.disconnect();
      // Re-filter when ROWS are re-rendered. Never react to the bar's own changes (its count label lives inside the same
      // tab): doing that made every tab with a bar re-trigger itself forever and froze the whole page (patch 04 bug).
      // The re-filter runs from a timer, not the microtask queue, so the browser can always paint and take input, and a
      // circuit breaker stops it for good if anything ever loops again.
      bar.obs = new MutationObserver((records) => {
        if (records.every(r => host.contains(r.target))) return;
        if (bar.timer) return;
        bar.timer = setTimeout(() => {
          bar.timer = null;
          const now = Date.now(); bar.burst = bar.burst.filter(t => now - t < 1000); bar.burst.push(now);
          if (bar.burst.length > 25) { bar.obs.disconnect(); if (typeof console !== "undefined") console.warn("MonFilter: too many re-renders, auto-refilter stopped for " + hostId); return; }
          apply(hostId);
        }, 0);
      });
      bar.obs.observe(scope, { childList: true, subtree: true });
    }
    apply(hostId);
  }

  /* Programmatic: e.g. choosing "All firewalls" in the threshold scope picker narrows the monitor list too. */
  function set(hostId, patch) {
    const b = bars[hostId]; if (!b) return;
    Object.assign(b.state, patch);
    const q = document.getElementById(hostId + "-q"), t = document.getElementById(hostId + "-type"), m = document.getElementById(hostId + "-method");
    if (q) q.value = b.state.q || ""; if (t) t.value = b.state.type || ""; if (m) m.value = b.state.method || "";
    apply(hostId);
  }
  function get(hostId) { return bars[hostId] ? Object.assign({}, bars[hostId].state) : null; }

  /* Row attributes for a device, to paste into a <tr ...> template. */
  function attrs(d) {
    return 'data-mon-id="' + esc(d.id || d.device_id) + '" data-mon-name="' + esc(d.name) + '" data-mon-type="' + esc(d.type || "") + '" data-mon-method="' + esc(d.method || "") + '"';
  }
  /* "Firewall - SSH (Linux)" caption under a monitor name. */
  function sub(d) {
    const t = TYPE_LABELS[d.type] || d.type || "", m = METHOD_LABELS[d.method] || d.method || "";
    return '<div class="mon-sub">' + esc([t, m].filter(Boolean).join("  \u00B7  ")) + "</div>";
  }

  return { matches, mount, apply, set, get, attrs, sub, loadFacets, TYPE_LABELS, METHOD_LABELS, TYPE_GROUPS };
})();
if (typeof module !== "undefined" && module.exports) module.exports = MonFilter;
