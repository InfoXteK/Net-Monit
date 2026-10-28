# Net-monit GitHub Pages Live Demo -- Claude Reference (V11.4, preview port 50114)

Replaces the earlier hand-written mock (wrong: built from the README only). This version is built from the REAL V11.3 + patch-05 code.

## Approach
GitHub Pages is static, so Flask cannot run. Instead:
1. The real app was run locally with a seeded estate (17 devices, seeded alerts, speed test history, scan history, audit log).
2. Every real page (/, /devices, /settings, /alerts, /speedtest, /urlmonitor, /networkscan, /admin, /about, /activation) was rendered by Flask and saved as static HTML. Links rewritten to *.html.
3. The real static/css and static/js are copied unchanged (only absolute links rewritten).
4. 146 real API responses were recorded into data/api.json (same JSON shapes as the real backend).
5. static/js/demo-shim.js replaces window.fetch for /api/* and acts as the backend in the browser. State lives in sessionStorage (survives page navigation, resets per tab or via "Reset demo" in the orange bar).

## What works (simulated by the shim)
- Auto signed in as admin on first load. Login form accepts any email + token. Logout gives the real read-only viewer behaviour (host masked "*** (admin only)").
- Dashboard: real tiles, live metric jitter on every poll, severity filters, categories, grid/list, edit/resize/hide, quick add.
- Alert engine: same layering as the real app (built-in default < global < method < type < device override) and the same lower-is-worse rule for SSL days. Changing thresholds raises or clears alerts live. Acknowledge and Resolve work.
- Thresholds: global, per type/method scoped, per device, with range and warning-vs-critical validation.
- Devices: add, edit, delete, test, notify/escalation settings.
- Sites (URL monitor): results table, on-demand check (simulated; a URL containing fail, down or bad returns 503).
- Speed test: WAN test is a simulated job (ping, download, upload phases, live gauge, saved to history). PC (browser) test is the REAL browser test against Cloudflare and posts its result to the demo history.
- Network scan: simulated job (about 6 s), results table, add to devices.
- Settings: SMTP, SMS/call gateway, organisation, notification templates, escalation, offline detection save into demo state; test buttons answer that nothing was sent.
- Admin: users add/delete, generate token, audit log (records demo actions), config export downloads demo JSON.
- License: demo Device ID DEMO-7F3A91C2E4B05D68, Activation Code DEMO-A1B2C3D4. A key must match NM1- plus 60 or more letters/digits/dashes to "activate". Real Ed25519 verification is NOT in the demo.

## Not real / limits
No real ping, SNMP, SSH, PowerShell, scanning, email, SMS or voice. Nothing leaves the browser except PC speed test traffic to Cloudflare. Logo and background uploads are not persisted. Data resets with Reset demo or a new tab.

## Files
*.html pages, static/ (real css/js + demo-shim.js + favicon.svg), data/api.json, .nojekyll, tools/ (seed_capture.py, build_demo.py, demo-shim.js: rebuild recipe; paths point at the build sandbox and must be edited elsewhere).

## Tested
jsdom against a local static server on port 50114: all 10 pages render real data (17 tiles, summary 10 healthy / 4 warning / 2 critical / 1 offline), no JS errors except jsdom lacking canvas (speed gauge needs a real browser). Backend flows tested: add/delete device, threshold validation, threshold-triggered alert, acknowledge, speed job phases, scan start, license good/bad, viewer masking, user add. NOT tested in a real browser or on GitHub Pages itself.

## Deploy (GitHub Pages)
1. In repo Net-Monit create folder docs/ and put ALL contents of Net-monit-Demo-V11.4 in it (pages, static/, data/, .nojekyll; tools/ optional).
2. Settings > Pages > Deploy from a branch > main > /docs > Save.
3. Open https://mohamedabdullahkhan.github.io/Net-Monit/ after 1-2 minutes.
4. Local preview: cd into the folder, run python -m http.server 50114, open http://localhost:50114/ (file:// will not work).

## Findings in the real project (not fixed, for V11.5)
1. README says default login admin@email.com / Admin@54321$. Wrong since V10.0: the first-run token is random, in data/FIRST-RUN-ADMIN-TOKEN.txt.
2. Templates reference /static/img/favicon.svg but static/img does not exist in the install: 404 on every page. The demo ships its own favicon.
3. Logo SVG upload issue from the earlier CVE addendum is still open.
4. App version string is 11.3 (about page, system info) while README says V11.3.1.
