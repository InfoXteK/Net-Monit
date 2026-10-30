/* Demo helper layer: bottom bar, Explain mode, Page guide drawer, scenarios. Works on every demo page. */
(function () {
"use strict";
const G = window.GUIDE, $ = id => document.getElementById(id);
const name = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
const PG = G.pages[name] || G.pages.index, TAGS = ["BUTTON", "A", "LABEL", "H1", "H2", "H3", "H4", "SPAN", "TH", "DIV"];
const el = (t, h, a) => { const e = document.createElement(t); if (h) e.innerHTML = h; Object.assign(e, a || {}); return e; };
const txt = n => n.textContent.replace(/\s+/g, " ").trim();
function matches(n, sel) { try { return sel[0] === "~" ? (TAGS.includes(n.tagName) && txt(n).includes(sel.slice(1)) && txt(n).length < sel.length + 24) : n.matches(sel); } catch (e) { return false; } }
function resolve(t) { for (let n = t; n && n !== document.body; n = n.parentElement) for (const s of PG.sections) for (const it of s.items) if (matches(n, it[0])) return { n, it }; return null; }
function findNode(sel) { if (sel[0] !== "~") return document.querySelector(sel); return [...document.querySelectorAll("button,a,label,h1,h2,h3,h4,th,span")].find(n => matches(n, sel)); }

/* bar */
const bar = el("div", "", { id: "nmBar" }), hint = el("div", "", { id: "nmHint" }), pop = el("div", "", { id: "nmPop" }), dr = el("div", "", { id: "nmDrawer" });
bar.innerHTML = '<span class="b">LIVE DEMO</span><span class="t">Simulated data in your browser. Nothing is sent anywhere.</span><label>Scenario <select id="nmScen"><option value="">Pick a guided scenario...</option>' + Object.entries(G.scenarios).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("") + '</select></label><button id="nmGo">Go</button><button id="nmEx" title="Click any element to read what it does">Explain mode: off</button><button id="nmPg">Page guide</button><a href="../index.html">About this demo</a><a href="#" id="nmReset">Reset demo</a>';
document.body.append(hint, pop, dr, bar);
const fit = () => document.documentElement.style.setProperty("--nmH", bar.offsetHeight + "px"); fit(); addEventListener("resize", fit);

/* explain mode */
let ex = false, last = null;
$("nmEx").onclick = () => { ex = !ex; $("nmEx").textContent = "Explain mode: " + (ex ? "ON - click anything" : "off"); $("nmEx").classList.toggle("on", ex); pop.style.display = "none"; if (!ex && last) last.classList.remove("nm-ex"); };
document.addEventListener("mouseover", e => { if (!ex || e.target.closest("#nmBar,#nmDrawer,#nmPop")) return; const r = resolve(e.target); if (last) last.classList.remove("nm-ex"); last = r && r.n; if (last) last.classList.add("nm-ex"); }, true);
document.addEventListener("click", e => {
  if (!ex || e.target.closest("#nmBar,#nmDrawer,#nmPop")) { if (!e.target.closest("#nmPop")) pop.style.display = "none"; return; }
  e.preventDefault(); e.stopPropagation();
  const r = resolve(e.target), x = Math.min(e.clientX + 12, innerWidth - 360), y = Math.min(e.clientY + 12, innerHeight - 200);
  pop.innerHTML = r ? `<b>${r.it[1]}</b>${r.it[2]}<br><a id="nmMore">Open the Page guide</a>` : "<b>No explanation for this element</b>It is part of the real interface. Open the Page guide for everything on this page.<br><a id=\"nmMore\">Open the Page guide</a>";
  pop.style.cssText += `;display:block;left:${x}px;top:${y}px`; $("nmMore").onclick = () => { pop.style.display = "none"; drawer(); };
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") { pop.style.display = "none"; dr.style.display = "none"; } });

/* page guide */
function drawer() {
  dr.style.display = "flex";
  dr.innerHTML = `<div class="h"><h3>${PG.title}: every option explained</h3><p>${PG.intro}</p><input id="nmQ" placeholder="Search this page..."><select id="nmJump">${Object.entries(G.pages).map(([k, v]) => `<option value="${k}"${k === name ? " selected" : ""}>Jump to: ${v.title}</option>`).join("")}</select></div><div class="c" id="nmC"></div>`;
  const draw = q => { q = (q || "").toLowerCase(); $("nmC").innerHTML = PG.sections.map(s => { const it = s.items.filter(i => !q || (i[1] + i[2]).toLowerCase().includes(q)); return it.length ? `<h4>${s.h}</h4>` + it.map(i => `<div class="i" data-s="${i[0].replace(/"/g, "&quot;")}"><b>${i[1]}</b><span>${i[2]}</span></div>`).join("") : ""; }).join("") || "<p>No match.</p>"; };
  draw(); $("nmQ").oninput = e => draw(e.target.value);
  $("nmJump").onchange = e => { location.href = e.target.value === "index" ? "index.html" : e.target.value + ".html"; };
  $("nmC").onclick = e => { const i = e.target.closest(".i"); if (!i) return; const n = findNode(i.dataset.s); if (n) { n.scrollIntoView({ block: "center", behavior: "smooth" }); n.classList.remove("nm-flash"); void n.offsetWidth; n.classList.add("nm-flash"); } };
}
$("nmPg").onclick = () => { dr.style.display === "flex" ? (dr.style.display = "none") : drawer(); };
$("nmReset").onclick = e => { e.preventDefault(); sessionStorage.clear(); location.href = "index.html"; };

/* scenarios */
const go = k => { const s = G.scenarios[k]; if (!s) return; sessionStorage.setItem("nm_scen", k); if ((location.pathname.split("/").pop() || "index.html") !== s.page) location.href = s.page; else run(k); };
$("nmGo").onclick = () => { const k = $("nmScen").value; k ? go(k) : alert("Pick a scenario first."); };
function set(id, v) { const e = $(id); if (e) { e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); } }
function run(k) {
  const s = G.scenarios[k]; hint.innerHTML = '<button title="Close">&times;</button>' + s.hint; hint.style.display = "block"; hint.querySelector("button").onclick = () => { hint.style.display = "none"; };
  hint.style.bottom = bar.offsetHeight + "px"; sessionStorage.removeItem("nm_scen"); $("nmScen").value = k;
  setTimeout(() => {
    if (k === "adddevice") { set("f-id", "demo-ap-03"); set("f-name", "Warehouse AP 3"); set("f-host", "10.0.2.13"); set("f-type", "wireless"); set("f-method", "ping"); }
    if (k === "scan") set("ns-subnet", "192.168.50.0/24");
    if (k === "site") set("quick-url", "https://infoxtek.com");
    if (k === "license") set("lic-key-input", ("NM1-" + "DEMOKEY".repeat(20)).slice(0, 106));
    if (k === "tour") $("nmEx").click();
  }, 700);
}
const q = new URLSearchParams(location.search).get("scenario"), pend = sessionStorage.getItem("nm_scen");
if (q && G.scenarios[q]) go(q); else if (pend && G.scenarios[pend]) run(pend);
})();
