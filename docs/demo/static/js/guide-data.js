/* Net-monit demo: explanation catalogue. Item = [selector, label, explanation].
   selector: "#id", ".class" or "~Visible button text". Used by Explain mode, Page guide and the landing page. */
(function () {
const P = (title, intro, sections) => ({ title, intro, sections: sections.map(([h, items]) => ({ h, items })) });
window.GUIDE = { pages: {

index: P("Dashboard", "The live wall of every monitored device and site. Each tile is one monitor and refreshes automatically (about every 10 seconds in the real app). Colour tells you state at a glance: green healthy, amber warning, red critical, grey offline.", [
 ["Summary bar", [
  ["#summary-bar", "Summary counters", "Counts of Healthy, Warning, Critical and Offline monitors and the total. Click a counter to filter the tiles to that severity; click again to clear."]]],
 ["Infrastructure Overview cards", [
  ["#io-cards", "Overview cards", "Top row: latest WAN speed (download, upload, ping, ISP from the Speed Test history), devices online/total and apps/sites online/total. Only monitors with 'Show on Infrastructure Overview dashboard' ticked are counted."]]],
 ["Category tabs", [
  ["~General", "General tab (All)", "Shows every monitor regardless of kind. The number is how many tiles match."],
  ["~Network", "Network tab", "Routers, switches, wireless APs and anything checked by Ping or SNMP."],
  ["~Firewall", "Firewall tab", "Devices whose type is Firewall."],
  ["~Windows", "Windows tab", "Windows servers and anything checked by PowerShell."],
  ["~Linux", "Linux tab", "Linux servers and anything checked by SSH."],
  ["~URL", "URL tab", "Websites and web apps (HTTP/HTTPS checks)."]]],
 ["View controls", [
  ["#btn-view-grid", "Grid view", "Card layout. Per-user setting, remembered on the server."],
  ["#btn-view-list", "List view", "Compact one-line-per-monitor table. Good for large estates."],
  ["#grid-density-row", "Grid density 2/3/4/5/Auto", "Choose how many tiles per row. Auto fits as many as the screen allows."],
  ["#btn-edit-layout", "Edit layout", "Admin only. Unlocks drag-and-drop ordering, resizing and hiding of tiles. Nothing is saved until you press Save."],
  ["#btn-add-tile", "Add tile", "Quick-add: attach an existing device or create a new one without leaving the dashboard."],
  ["#btn-save-layout", "Save layout", "Stores tile order, size and hidden state for your user."],
  ["~Reset", "Reset layout", "Puts every tile back to default order and size."],
  ["~Cancel", "Cancel edit", "Leaves edit mode and discards unsaved layout changes."],
  ["#show-hidden-btn", "Show all (hidden tiles)", "Temporarily reveals tiles you hid, so you can unhide them."]]],
 ["Tiles", [
  [".device-card", "Device tile", "One monitor. Shows name, host (admin only), type badge, status, live metrics and last-checked time. Click for details and per-device threshold settings. Right-click for the tile menu."],
  [".device-type-badge", "Type badge", "The device type (Router, Linux server, Website...) chosen when the monitor was added."],
  [".metric-grid", "Metrics", "The values the check collected: latency, packet loss, CPU, memory, disk, bandwidth, or for sites response time and SSL days left. Coloured by the thresholds that apply to this monitor."],
  [".device-error", "Error line", "The last error the check reported (admin only), for example a timeout or an HTTP 503."],
  [".tile-drag-handle", "Drag handle (edit mode)", "Drag a tile onto another to reorder."],
  [".tile-resize-handle", "Resize handle (edit mode)", "Drag the corner to make a tile wider or taller."],
  [".tile-size-presets", "Size presets (edit mode)", "One-click small / normal / large tile sizes."],
  [".tile-remove-btn", "Hide / remove (edit mode)", "Hides the tile from your dashboard. The monitor keeps running and alerting."]]],
 ["Quick add and device settings", [
  ["#qa-tab-existing", "Existing Device tab", "Tick devices that are already monitored to show them on the dashboard."],
  ["#qa-tab-new", "New Device tab", "Create and start monitoring a new device in one step."],
  ["#qa-kind", "Type", "Device, Server, Website or Shared drive. The fields below change to match."],
  ["#qa-id", "ID", "Unique short key, letters/numbers/dashes. Cannot be changed later."],
  ["#qa-name", "Display name", "The name shown on the tile and in alerts."],
  ["#qa-host", "Host / IP / URL", "What to check: an IP or DNS name, or a full URL for a site."],
  ["#qa-path", "Path (UNC or mount)", "Shared-folder check only: \\\\server\\share on Windows or a mount path on Linux."],
  ["#qa-submit", "Add & monitor", "Saves the device and starts polling it immediately."],
  ["#ds-modal", "Device settings window", "Opened from a tile. Shows the effective warning/critical thresholds for this device and where each value comes from (global, type, method or device override), and lets you override them."]]]
]),

devices: P("Devices", "Where monitors are created, edited and tuned. Admin only. Every device has a check method, a poll interval and its own notification and escalation rules.", [
 ["Add or edit a device", [
  ["#f-id", "Device ID", "Unique key used internally and in alerts. Letters, numbers, dashes. Fixed after creation."],
  ["#f-name", "Display name", "Friendly name shown on tiles, alerts and emails."],
  ["#f-host", "Host / IP address", "What the check connects to."],
  ["#f-interval", "Poll interval (sec)", "How often the device is checked. Lower is faster detection but more load."],
  ["#f-type", "Device type", "Network device, Router, Switch, Firewall, Wireless AP, Windows server, Linux server, VMware host, NAS, Printer, UPS, IP camera, Other. Decides the dashboard tab and which thresholds are offered."],
  ["#f-method", "Check method", "Ping (ICMP): up/down + latency + loss. SNMP: adds CPU, bandwidth, interfaces. PowerShell: Windows CPU/memory/disk/services/tasks. SSH: Linux CPU/memory/disk. Disk/Shared folder: free space of a drive share. Extra credential fields appear for SNMP, SSH, PowerShell and disk."],
  ["#f-show-dashboard", "Show on Infrastructure Overview", "Counts this monitor in the dashboard overview cards."],
  ["#btn-add-device", "Add device", "Saves the monitor and starts polling. Becomes Save changes when editing."],
  ["#btn-cancel-edit", "Cancel edit", "Abandons the edit and clears the form."]]],
 ["Monitored devices list", [
  ["#dev-group", "Group by", "Group the list by nothing, type or method. Counts shown per group."],
  [".device-list-row", "Device row", "Edit loads the device into the form above. Test runs one check now. Notify opens notification and escalation settings. Delete removes the monitor and its history."],
  ["~All devices & sites", "Scope: all", "Filter the list to every monitor."],
  ["~Devices only", "Scope: devices", "Hide websites."],
  ["~Sites only", "Scope: sites", "Show websites only."]]],
 ["Notify window (per device)", [
  ["#nm-enabled", "Notifications enabled", "Master switch for alerts about this device."],
  ["#nm-notify-emails", "Notify emails", "Extra recipients for this device only, besides the admin/support/manager groups."],
  ["#nm-trigger-mode", "Alert trigger mode", "Wait to confirm (default): alert only if the problem lasts N seconds, which filters blips. Immediate: alert on the first bad check."],
  ["#nm-wait-sec", "Seconds, then alert", "How long a problem must persist before the alert is sent."],
  ["#nm-notify-mode", "Repeat-alert cooldown", "Whether and how often the same alert is repeated while it stays unresolved."],
  ["#nm-cooldown-sec", "Seconds between repeat alerts", "Minimum gap between repeats."],
  ["#nm-esc-levels", "Active levels", "How many escalation levels (L1 to L3) are used. Each level has its own email, SMS and call numbers and its own delay before it fires."]]]
]),

alerts: P("Alerts", "Live list of open problems raised by the threshold engine. An alert opens when a metric crosses warning or critical, or a device goes offline, and closes by itself when the value recovers.", [
 ["Filters", [
  ["~Open", "Open", "Alerts that need attention: active plus acknowledged."],
  ["~Active", "Active", "Not yet acknowledged by anyone."],
  ["~Acknowledged", "Acknowledged", "Someone took ownership. Repeat emails are paused for this alert."],
  ["~Resolved", "Resolved", "Closed manually or recovered on their own."],
  ["#al-search", "Search", "Filter by device name, host or message text."],
  ["#al-severity", "Severity", "Show only warning, critical or offline alerts."]]],
 ["Actions", [
  ["~Acknowledge", "Acknowledge", "Marks the alert as seen by you and silences repeats. It stays open until the problem is fixed or you resolve it."],
  ["~Resolve", "Resolve", "Closes the alert manually and sends a recovery notice if recovery emails are on."]]]
]),

settings: P("Settings", "All system configuration in one place, in tabs. Most tabs are admin only. Changes apply on the next check cycle; nothing needs a restart.", [
 ["Email / SMTP", [
  ["#s-enabled", "SMTP Enabled", "Master switch for email alerts."],
  ["#s-host", "SMTP Host", "Your mail server, for example smtp-mail.outlook.com."],
  ["#s-port", "Port", "587 for STARTTLS, 465 for SSL, 25 for plain."],
  ["#s-tls", "Use TLS", "Encrypt the connection to the mail server. Keep on."],
  ["#s-username", "Username", "Mailbox login."],
  ["#s-password", "Password", "Stored encrypted (AES) in the database, never shown again."],
  ["#s-from", "From address", "Sender shown on alert emails."],
  ["#s-resend", "Resend interval (min)", "Default minimum time between repeats of the same alert."],
  ["#s-admin-emails", "Admin emails", "Receive ALL alerts (To line)."],
  ["#s-support-emails", "Support group", "Receive alerts from escalation level 2 onward."],
  ["#s-manager-emails", "Manager group", "Receive alerts from escalation level 3."],
  ["#btn-save-smtp", "Save SMTP", "Stores the mail settings."],
  ["#btn-test-warn", "Send test warning", "Sends a sample warning email to the admin group to prove delivery."],
  ["#btn-test-crit", "Send test critical", "Sends a sample critical email."]]],
 ["Notifications (global rules)", [
  ["#n-send-warn", "Send on Warning", "Email when a metric reaches warning."],
  ["#n-send-crit", "Send on Critical", "Email when a metric reaches critical."],
  ["#n-send-recov", "Send on Recovery", "Email when the problem clears."],
  ["#n-send-offline", "Send on Offline", "Email when a device stops responding."],
  ["#n-resend-warn", "Re-send warning every (min)", "Repeat interval while a warning persists."],
  ["#n-resend-crit", "Re-send critical every (min)", "Repeat interval while critical persists."],
  ["#od-retries", "Re-checks before giving up", "Offline detection: how many extra attempts before a failed check counts."],
  ["#od-delay", "Seconds between re-checks", "Wait between those attempts."],
  ["#od-confirm", "Failed checks in a row to confirm Offline", "Consecutive failed cycles needed before the device is declared Offline. Prevents false offline alerts from one lost packet."],
  ["#btn-save-notif", "Save", "Stores the global notification rules."]]],
 ["Escalation", [
  ["#esc-g-trigger-mode", "Alert trigger mode (default)", "Default for every device: wait to confirm or immediate."],
  ["#esc-g-wait-sec", "Seconds, then alert", "Default confirmation delay."],
  ["#esc-g-notify-mode", "Repeat-alert cooldown", "Default repeat behaviour."],
  ["#esc-g-cooldown-sec", "Seconds between repeats", "Default gap between repeats."],
  ["#btn-save-esc-global", "Save defaults", "Stores the defaults used by devices without their own settings."],
  ["#btn-apply-esc-all", "Apply to all devices", "Overwrites every device's own escalation settings with these defaults."]]],
 ["Notification Templates", [
  ["~+ Add new", "Custom placeholder", "Create your own {variable} (key, value, description) usable in every template, for example {site_name}."],
  ["#tmpl-subject", "Subject", "Email subject for this state (warning, critical, recovery, offline). Supports {placeholders}."],
  ["#tmpl-text", "Plain-text body", "Text version of the email."],
  ["#tmpl-html", "HTML body", "Formatted version of the email."],
  ["#tmpl-enabled", "Template enabled", "Turn off to use the built-in default for this state."],
  ["~Reset to default", "Reset to default", "Restores the built-in template."]]],
 ["Thresholds", [
  ["#thr-tab-devices", "Devices tab", "Warning and critical limits for latency, packet loss, CPU, memory, disk and bandwidth."],
  ["#thr-tab-sites", "Sites tab", "Limits for websites: response time, SSL certificate days left, SSL handshake, DNS and TCP connect time."],
  ["#thr-scope", "Scope", "Global (everything), or one device type, or one check method. More specific scopes beat global; a per-device override beats all."],
  ["~Fill recommended", "Fill recommended values", "Loads the recommended warning and critical value for every row."],
  ["#thr-root", "Threshold rows", "Each row shows the unit, the direction (alerts above, or for SSL days below), the allowed range, the recommended values and what healthy looks like. Impossible values are refused."]]],
 ["Monitors, Users, Logs", [
  ["#tab-users", "Users", "Add admin or viewer accounts. Viewers see tiles but not hosts, credentials or settings."],
  ["#su-token", "Access token", "The user's password. 8+ characters with upper, lower and a number. Generate makes a strong one."],
  ["#tab-audit", "Audit", "Who did what: user actions and system events, newest first."],
  ["#tab-alerts", "Alert Log", "History of every alert with counts of critical, warning, recovered and emailed."]]],
 ["License, Appearance, SMS & Call, Organisation", [
  ["#tab-license", "License", "Shows trial days left or licensed state, your Device ID and Activation Code, and the box to paste a key."],
  ["#theme-switcher-settings", "Theme", "Dark or light. Per user."],
  ["#accent-picker-settings", "Accent colour", "Colour of buttons and highlights. Per user."],
  ["#bg-color-picker-settings", "Background colour", "Page background colour. Per user."],
  ["#bg-image-file", "Background image", "Optional picture behind the dashboard."],
  ["#sms-enabled", "SMS enabled", "Send SMS through your own HTTP gateway."],
  ["#sms-preset", "SMS preset", "Fills URL, method and body for common gateways."],
  ["#sms-url", "SMS URL / body / headers", "Where and how the gateway is called. Placeholders {to} and {message} are filled per alert."],
  ["#sms-test-phone", "SMS test number", "Sends a test message to prove the gateway works."],
  ["#call-enabled", "Voice call enabled", "Place a voice call for critical alerts through an HTTP gateway."],
  ["#org-name", "Organisation name", "Shown in the header and on emails."],
  ["#org-logo-file", "Organisation logo", "PNG/JPG shown in the header."]]]
]),

speedtest: P("Speed Test", "Measures internet speed two ways and keeps a history.", [
 ["Tests", [
  ["#run-btn", "Test WAN Speed", "Runs from the Net-monit server to Cloudflare: ping, then download (green needle), then upload (purple). Shows live Mbps. If the test servers throttle (HTTP 429/503) it backs off and reports rate-limited."],
  ["#run-client-btn", "Test Your PC Speed", "Runs in your browser from your own computer to Cloudflare. Measures your path, not the server's. This one is real in the demo too."],
  ["#csv-btn", "Export CSV", "Downloads the whole history as a spreadsheet file."],
  ["#purge-btn", "Purge Logs", "Deletes the history after confirmation."]]],
 ["Results", [
  ["~WAN Telemetry", "WAN Telemetry", "Table of past tests: time, source (server or browser), download, upload, latency, jitter, ISP and public IP."],
  ["~Diagnostics Activity Log", "Activity Log", "Step-by-step messages of the current or last test."]]]
]),

urlmonitor: P("Sites", "Website and web-app monitoring over HTTP/HTTPS, with SSL certificate tracking.", [
 ["Quick check", [
  ["#quick-url", "Site or IP to check", "Any URL or host. Nothing is saved."],
  ["#quick-status", "Expected status", "The HTTP code that counts as healthy, usually 200."],
  ["~Check Now", "Check Now", "Runs one check and shows status, response time, DNS, TCP connect, SSL handshake, SSL days left and size."]]],
 ["Monitored sites", [
  ["~+ Add Site", "Add Site", "Opens the form below to monitor a site permanently."],
  ["#m-url", "Site URL or IP", "Full URL including https://."],
  ["#m-name", "Display name", "Name on the tile and in alerts."],
  ["#m-status", "Expected HTTP status", "A different code (for example 401 for a login wall) counts as a failure."],
  ["#m-timeout", "Timeout (seconds)", "How long to wait before the check fails."],
  ["#m-kw", "Keyword must be present", "Optional text that must appear in the page. Catches a site that returns 200 but shows an error."],
  ["#m-maxms", "Warn if slower than (ms)", "Sets this site's response-time warning."],
  ["#m-poll", "Poll interval (seconds)", "How often the site is checked."],
  ["#m-ssl", "Check SSL certificate expiry", "Tracks days left on the certificate; alerts when below the threshold (default warning 30, critical 7)."],
  ["#m-show-dashboard", "Show on Infrastructure Overview", "Counts the site in the dashboard apps card."],
  ["~↻ Refresh", "Refresh", "Reloads the table now."]]]
]),

networkscan: P("Network Scan", "Discovers devices on a subnet and turns them into monitors.", [
 ["Scan configuration", [
  ["#ns-subnet", "Subnet to scan", "CIDR such as 192.168.1.0/24. Maximum /16."],
  ["~Auto-detect", "Auto-detect", "Fills in the subnet(s) of this server's network cards."],
  ["#ns-workers", "Max workers", "Parallel probes. More is faster but heavier on the network."],
  ["#ns-portscan", "Port scan (identify device type)", "Probes common TCP ports (22, 80, 443, 445, 3389...) and guesses the device type."],
  ["#ns-udpscan", "Check UDP ports too", "Also probes DNS, SNMP, NTP, TFTP, mDNS and SSDP."],
  ["#ns-btn", "Scan Network", "Starts the scan in the background and shows progress."]]],
 ["Results", [
  ["#ns-filter", "Filter", "Search results by IP, name, vendor or type."],
  ["#ns-chk-all", "Select all", "Tick every discovered host."],
  ["#ns-add-btn", "Add Selected to Monitoring", "Creates ping monitors for the ticked hosts, with a default method you choose."],
  ["#ns-add-method", "Default method for all", "Ping, SNMP, SSH and so on, applied to the hosts being added."],
  ["~Scan History", "Scan History", "Earlier scans. Open one to see its results again."]]]
]),

admin: P("Admin Panel", "Administration for admins: users, mail, groups, audit, system and backup.", [
 ["Users", [
  ["#au-email", "Email address", "Login name of the new user."],
  ["#au-role", "Role", "Admin: full control. Viewer: read-only dashboard, hosts hidden."],
  ["#au-token", "Access token", "Login secret, 8+ chars with upper, lower and number."],
  ["~🎲 Generate", "Generate", "Creates a strong random token."],
  ["~Add user & send welcome email", "Add user & send welcome email", "Creates the account and emails the credentials (needs SMTP)."]]],
 ["Email, groups, audit", [
  ["#ae-host", "SMTP settings", "Same mail settings as Settings > Email, edited here for convenience."],
  ["#ag-admin-emails", "Admin group", "Receives every alert."],
  ["#ag-support-emails", "Support group", "Receives escalation level 2 and above."],
  ["#ag-manager-emails", "Manager group", "Receives escalation level 3."],
  ["#btn-admin-save-groups", "Save groups", "Stores the three recipient lists."],
  ["~↻ Refresh", "Audit refresh", "Reloads the audit log."]]],
 ["System and backup", [
  ["~Default Appearance", "Default Appearance", "Default theme, accent, background colour and image for users who have not chosen their own."],
  ["#backup-include-users", "Include user accounts", "Adds users (emails, roles, token hashes) to the backup file."],
  ["~⬇ Download backup", "Download backup", "Exports devices, thresholds, notification settings and templates as one JSON file."],
  ["#backup-restore-file", "Restore file", "Choose a backup file made earlier."],
  ["~Restore from file", "Restore from file", "Imports the file and replaces current settings."]]]
]),

activation: P("License", "Activate your free licence key. Trial lasts 30 days without a key.", [
 ["Activation", [
  ["#lic-device-id", "Device ID", "Identifies this installation."],
  ["#lic-act-code", "Activation Code", "Second value tied to this installation."],
  ["#copy-both-btn", "Copy Both Values", "Copies Device ID and Activation Code so you can send them to the vendor (abuabdullah.be@outlook.com or infoxtek.com). The key arrives in 4 to 7 business days and is free."],
  ["#lic-key-input", "License key", "Paste the key. It starts with NM1- and is about 127 characters. Pasting is required, do not retype."],
  ["#activate-btn", "Activate License", "Verifies the Ed25519 signature offline. No internet or phone-home. Keys are bound to this Device ID, so a reinstall needs a new key."]]]
]),

about: P("About", "Version, patch level and owner details. The version line is what to quote when asking for support.", [["Info", [["h1", "Version", "Shows the Net-monit version and the list of patches applied to this installation."]]]])
},

scenarios: {
 tour: { label: "Dashboard tour", page: "index.html", hint: "<b>Dashboard tour</b> - turn on <b>Explain mode</b> (bottom bar), then click anything: tiles, filter counters, category tabs, view buttons. Try the red SQL Server tile, then the grey Gate Camera." },
 alertfire: { label: "Make an alert fire", page: "settings.html", hint: "<b>Make an alert fire</b> - open <b>Thresholds</b>, lower CPU warning/critical (for example 20/30) and Save. Then open <b>Alerts</b>: servers with CPU above that now raise alerts, using the same engine as the real app. Acknowledge one." },
 adddevice: { label: "Add a device", page: "devices.html", hint: "<b>Add a device</b> - the form is pre-filled. Press <b>Add device</b>, then open the Dashboard: the new tile is there. Use <b>Test</b> on its row, then <b>Delete</b> it." },
 badvalue: { label: "Refused threshold values", page: "settings.html", hint: "<b>Impossible values are refused</b> - in Settings > Thresholds set a warning higher than the critical value (or SSL days the wrong way round) and Save. You get a clear message, as in the real app." },
 site: { label: "Check a website", page: "urlmonitor.html", hint: "<b>Check a website</b> - press <b>Check Now</b>. Then type a URL containing the word <i>down</i> and check again to see a failing site (HTTP 503)." },
 speed: { label: "Run a speed test", page: "speedtest.html", hint: "<b>Speed test</b> - press <b>Test WAN Speed</b> to watch the simulated live gauge (ping, download, upload), or <b>Test Your PC Speed</b> for a real test from your browser." },
 scan: { label: "Scan the network", page: "networkscan.html", hint: "<b>Scan the network</b> - press <b>Scan Network</b>, wait about 6 seconds, tick some hosts and press <b>Add Selected to Monitoring</b>. They appear on the Dashboard." },
 license: { label: "Activate a license", page: "activation.html", hint: "<b>Activate a license</b> - a demo key is pasted for you. Press <b>Activate License</b>. Clear the box and type 'abc' to see the incomplete-key message." },
 viewer: { label: "See the Viewer role", page: "index.html", hint: "<b>Viewer role</b> - use the account menu to sign out. As a signed-out viewer, host addresses show as '*** (admin only)' and settings pages are hidden, as in the real app." }
}};
})();
