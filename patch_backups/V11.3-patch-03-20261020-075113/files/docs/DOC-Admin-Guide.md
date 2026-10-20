# Net-monit V11.3 — Admin Guide

This guide covers day-to-day administration: configuring alerts, adding monitored devices/services, managing users, and using the Admin panel. For installation, see the Setup Guide. For a plain end-user walkthrough of the dashboard, see the User Guide.

## 1. Signing in

Log in with your admin account at `http://<server>:50113`. Admin accounts can see the Admin panel (top nav) and every Settings tab; regular user accounts see the dashboard and monitoring pages but not user management or SMTP/escalation configuration.

## 2. Adding devices to monitor

**Devices page** (network hardware and servers):
1. Click **Add Device**.
2. Give it an ID, name, and host (IP or hostname).
3. Pick a **method**:
   - **Ping** — simple reachability + latency + packet loss. No credentials needed.
   - **SNMP** — for switches/routers/printers that expose SNMP. Needs a community string.
   - **PowerShell** — for Windows servers: CPU/memory/disk usage, over WinRM. Needs a Windows username/password with remote-management rights on the target, and "Remote" checked if this isn't the machine Net-monit itself runs on.
   - **SSH** — the Linux equivalent of PowerShell: CPU/memory/disk over an SSH connection. Needs a username + password or private key path.
   - **Shared drive** — free-space monitoring on a Windows UNC path or a Linux mount point.
4. **New in V8.2 — Watch services / scheduled tasks:** if you picked SSH or PowerShell, an extra section appears letting you list service names (Windows: as shown in `services.msc`, e.g. `Spooler`; Linux: systemd unit names, e.g. `nginx`) and/or scheduled task names (Windows: full Task Scheduler path, e.g. `\Backup\NightlyBackup`; Linux: systemd timer name) to watch on that same host. This reuses the SSH/PowerShell credentials you already entered above — no separate login needed. **Any single watched service or task that's stopped/failed marks the whole device Critical.** This is only offered for SSH/PowerShell devices, since those are the only methods with a credential path to actually query the host's services/tasks.
5. Click **Test** before saving to confirm the connection and credentials actually work.
6. Save.

**Sites Monitor page** (URLs / web applications):
1. Go to **Sites Monitor** (separate from the Devices page — URLs and network devices are managed on their own dedicated pages).
2. Add a URL, expected HTTP status (default 200), and whether to verify the SSL certificate.
3. Net-monit will track response time, HTTP status code, page size, and SSL certificate expiry (an expiring/expired cert can affect the site's overall status, not just show as a side note).

You can also quickly add either kind of device from the **Dashboard** itself via **+ Add Tile**, which offers the same options in a lighter-weight modal — useful when you just want to get something onto the dashboard fast without leaving it.

## 3. Alerting — how it works and how to tune it

### 3.1 Thresholds

Every numeric metric (CPU%, memory%, disk%, latency, packet loss, and — new in V8.2 — website response time) has a **warning** and **critical** threshold. There's a sensible built-in default for each; override globally (Settings) or per-device (device edit form) if a particular server or site needs different limits.

### 3.2 Alert trigger mode — NEW in V8.2

This is the feature for controlling *when* the first alert email actually fires, separate from thresholds (which control *whether* something counts as a problem at all). Found in **Settings → Escalation** (global default) and in each device's **Notify** modal (per-device override).

- **Immediate** (default): the moment a device/site crosses a threshold or goes offline, an email goes out. This is how every version before V8.2 behaved, and it's still the default so upgrading doesn't silently change your alert timing.
- **Wait to confirm, then alert**: no email on the very first detection. Instead, the problem has to still be present once your **Level 1 escalation time** has elapsed (see below) before anything gets emailed. A brief blip — say, 5 seconds of packet loss on a site that then recovers on its own — still shows up in the **Alert Event Log**, it just never reaches anyone's inbox. If it's *still* broken once L1 time passes, exactly one email fires at that point, and escalation continues from there exactly as it would in Immediate mode.

**Example matching what most people want:** set the global mode to "Wait to confirm", and set Level 1 to 30 seconds. A device that blips for a few seconds and recovers generates no email at all (just a log entry); a device that's actually down for 30+ seconds generates exactly one confirmed alert email, with Level 2/3 escalation continuing on top if it stays down even longer.

### 3.3 Escalation levels (L1/L2/L3)

Each level has its own delay (seconds since the problem started) and its own list of email recipients — so, for example, Level 1 might notify the on-call engineer after 30 seconds, Level 2 might add the team lead after 10 minutes, and Level 3 might add management after 30 minutes. Toggle each level on/off independently. **"Apply to all devices"** pushes your current L1/L2/L3 timers, email lists, and alert trigger mode out to every device at once (per-device threshold overrides are left alone by this button — it only touches timing/emails/trigger mode).

### 3.4 Acknowledging vs. resolving

In the **Alert Event Log**:
- **Acknowledge** — "I've seen this, stop escalating it for now." Suppresses further escalation emails for that specific device+metric until the end of the current day (23:59:59), after which it automatically reopens as a fresh incident if the problem is still there.
- **Resolve** — manually marks it closed. If the underlying problem is actually still happening, the next monitoring poll will simply detect it again and reopen a new incident — resolving doesn't "silence" anything ongoing, it just clears the current entry.

## 4. Network Scan

Sweeps a subnet (e.g. `192.168.1.0/24`) for live hosts: ping, common-port probing to guess device type, reverse-DNS hostname, and MAC address + vendor lookup. Use **Add** on any discovered host to promote it into a monitored Device without re-typing its IP.

**On MAC/vendor detection:** Net-monit reads your machine's own ARP table to find MAC addresses (this doesn't require any special permissions, unlike a raw packet capture). A device that hasn't exchanged any network traffic with this machine yet may not have a MAC visible on the first scan — re-scanning after those devices have been pinged usually resolves it. Vendor names come from a built-in list of common manufacturer prefixes (a few hundred entries covering the vendors people actually run into on a LAN — Cisco, HP, Dell, Netgear, Ubiquiti, Apple, and so on) rather than the complete official registry, so an unusual or newer device may show a MAC with no vendor name attached; that's expected, not a malfunction.

**TCP and UDP ports (V10.7).** Each host's open ports are labelled with their type: `22/tcp` (blue) is a TCP port that accepted a connection, `161/udp` (orange) is a UDP port that **answered**. UDP has no handshake, so Net-monit sends a small standard request for each of DNS (53), TFTP (69), NTP (123), NetBIOS (137), SNMP (161, read-only, community `public`), UPnP/SSDP (1900) and mDNS (5353) and lists the port only if a valid reply comes back. A silent port may still be open (a firewall, or a service that does not reply to strangers), so silence is never reported as "open". Tick or untick **Check UDP ports too** before scanning; it adds a few seconds. Expand a host to see the TCP and UDP groups, and which ports were checked. A device that answers SNMP is classified as *Network Device (SNMP)*. The filter box matches port numbers, service names, `tcp` and `udp`.

## 5. Dashboard layout (for your own view)

The Dashboard's Edit Mode (drag tiles, resize, hide/show, switch Grid/List view and column density) is **saved per admin account**, so your layout doesn't affect what other users see, and correctly persists across refreshes and logins as of V8.2.

## 6. User management (Admin panel)

Create/edit/deactivate accounts, assign the `admin` or `user` role. Regular users can view dashboards and monitoring pages but can't touch SMTP, escalation, or user management. The **audit log** in the Admin panel records administrative actions (user changes, settings changes) with who/what/when.

## 7. SMTP configuration

Settings → SMTP: host, port, credentials, and the "from" address alert emails will be sent from. Send a test email after saving to confirm delivery before relying on it — some networks block outbound mail ports by default, which is the most common reason alert emails silently never arrive.

## 8. Backups

Everything that matters lives in two places: `config.yaml` (devices, SMTP, thresholds, escalation defaults) and `data/monitor.db` (users, alert history, per-user dashboard layout, license state). Back up both together, on the same schedule — they're not useful independently of each other.


## Speed test engine, rate limiting and service-mode notes (V10.9)

- **Default engine is the built-in test** (`speedtest.engine: builtin`). It shows the live gauge (green download, purple upload), reports which server it measured against, and runs fine as a Windows service. The optional third-party `speedtest-cli` library is used only if you set `engine: auto` in `config.yaml`; it has no live gauge, picks its own server (which can be in another country -- for example Frankfurt from Dubai), and needs a console that a service does not have.
- **Do not edit `speedtest_check.py` to fake console streams.** Such an edit changes the whole service process and can stop the dashboard from being served.
- **Rate limiting (HTTP 429).** The default test server (Cloudflare) limits how much one public IP may transfer. When it answers 429 the test now waits, uses fewer connections, and tells you plainly in the status line ("rate-limited this network ... can read low"). If the server refuses everything, the test says "rate-limiting" instead of "no internet". Wait 5-10 minutes between tests; several tests back to back lower every result after the first.
- **Use a nearby server you control** for repeatable results: see `speedtest.targets` in `config.yaml` (LibreSpeed-compatible; Setup Guide has the steps).

## Licensing (V11.0)

- **How a license works.** Net-monit checks a signed key offline; there is no license server and no internet access needed. The key is tied to the exact **Device ID** and **Activation Code** shown on **Settings -> License** (or the Activation page). Change the PC, the install folder or reinstall and those values change, so the key must be re-issued by your vendor.
- **Activating.** Sign in as Admin, open the Activation page, paste the whole key (it starts with `NM1-`, about 127 characters with dashes), click **Activate License**. Only Admins can activate.
- **Keys from V10.9 and earlier no longer work.** An upgraded installation holding an old key shows **"New license key required"** and runs in restricted mode until a new key is entered. Collect the Device ID and Activation Code of the *new* installation and request keys *before* switching over.
- **Why the change.** Earlier versions shipped the secret that makes keys inside every installation. V11.0 ships only a public verification key, so a customer (or anyone with the files) cannot create a key.

## Alert thresholds: which metric applies to what (V11.1; screens changed in V11.2)

Thresholds decide when a device or website moves from **Healthy** to **Warning** or **Critical** and an alert is sent. Each kind of monitored item has its own metrics -- a website is never measured by CPU or disk, and a ping device is never measured by SSL days.

**Where to set them**
1. **Settings > Thresholds** -- *global defaults* for every device and site. Two tables: **Device metrics** and **Website (site) metrics**.
2. **Settings > Thresholds > Per-device / per-site overrides** -- shows what is *actually active* for each device or site (bold = overridden for that one); **Edit** opens its thresholds window.
3. **Devices > Notify** (devices only) -- the same window, showing only the metrics that apply to that device's monitoring method.
4. **Sites page > Edit site** -- *Warn if slower than (ms)* and the SSL warn-days set that one site's *response-time warning* and *SSL warning*. They are the lowest layer: anything set in Settings > Thresholds wins.

**Order of precedence** (highest wins): per-device thresholds window, then per-device override, then global (Settings > Thresholds), then the site's own fields, then the built-in recommended values.

**Reading the table (V11.2).** Each row shows the metric name, its unit, **Enabled**, **Warning** and **Critical** (and **Wait** in the Notify windows). Next to every metric name is a small **!** button. **Point at it** and the details stay visible while the pointer stays on the button or on the box; **click it** to pin the box open, then close it with the **X** (or press Esc). The box explains what the metric means, which direction raises an alert, the **allowed minimum and maximum**, the **recommended warning and critical values** and what a **healthy** value looks like. Empty Warning/Critical boxes show the recommended value in grey -- leave a box blank to use it. *Fill recommended values* sets them all. For every metric except SSL days, a **higher** number is worse. For **SSL certificate expires in (days)**, a **lower** number is worse (marked "alerts when below" in the table), so the warning must be **higher** than the critical (30 and 7). The server refuses saves that break these rules and says which metric is wrong.

**Apply to all devices / Apply to all sites (V11.2).** Under each table in *Settings > Thresholds* there is an **Apply to all devices** button (device metrics) and an **Apply to all sites** button (website metrics). It takes the values currently in that table, saves them as the new default **and removes every per-device / per-site override of those metrics**, so every monitor in that category uses them. Per-metric *Wait* times are kept. The other category is not touched. A confirmation box appears first; the action is written to the Audit log. **Save all defaults** only saves the defaults and leaves overrides in place.

**Layout and live effect (V11.3 patch 02).** The *Device metrics* and *Website metrics* tables sit **side by side** (they stack only on narrow screens). Values you save or apply here are used by the monitoring engine on its very next check -- no restart. The order of precedence, lowest to highest, is: built-in recommended values, the website's own *Warn if slower than* / *SSL warn days* from the Sites page, **these global values**, then any per-monitor override from that monitor's **Notify** window. The **SSL Days** colour on the Sites page follows the same thresholds.

**Overrides list (V11.2).** *Per-device / per-site threshold overrides* is grouped into two collapsible categories, **Devices** and **Sites**. Each monitor shows its active thresholds as small chips; bold = overridden for that monitor.

**Apply wait & cooldown to all (V11.2).** The *Alert trigger mode* (wait seconds) and *Repeat-alert cooldown* settings have three buttons: **All devices & sites**, **Devices only**, **Sites only**. They are on *Settings > Escalation* and inside every **Notify** window. They copy the values shown on screen (no need to save first) to the chosen monitors and change **only** these timing fields -- emails, SMS/call numbers, escalation levels and thresholds stay as they are. In "Wait to confirm" mode the wait seconds become each monitor's Level 1 time and any per-metric wait override is removed so the new wait really applies. A confirmation box appears first; the action is written to the Audit log.

### Website (site) metrics

| Metric | Unit | Alerts when | Allowed range | Recommended warning / critical | Healthy | What it means |
|---|---|---|---|---|---|---|
| Response time | ms | value **rises above** the threshold | 1 to 60000 ms | 1000 / 5000 ms | under 500 ms | Time until the site starts answering (DNS + connect + TLS + server think time, redirects included). High = slow or overloaded server, heavy page, or a poor network path. |
| SSL certificate expires in | days | value **falls below** the threshold | 1 to 825 days | 30 / 7 days | more than 30 days | Days until the site's certificate expires. ALERTS WHEN THE VALUE FALLS BELOW the threshold. At 0 the certificate is expired and browsers block the site. |
| SSL handshake time | ms | value **rises above** the threshold | 1 to 30000 ms | 500 / 1500 ms | under 300 ms | Time to negotiate the encrypted connection after it opens. High = distant or overloaded server/proxy, or very heavy TLS settings. |
| DNS lookup time | ms | value **rises above** the threshold | 1 to 10000 ms | 300 / 1000 ms | under 100 ms | Time to turn the site name into an IP address. High = slow or failing DNS server. |
| TCP connect time | ms | value **rises above** the threshold | 1 to 30000 ms | 300 / 1000 ms | under 100 ms in the same region, under 300 ms overseas | Time to open the network connection to the server. Pure network distance/congestion; high with a fast server = a network path problem. |

How the site timings are taken: *Response time* is the total time until the site starts answering. *DNS*, *TCP connect* and *SSL handshake* come from one extra connection made at each check, so you can tell **where** a slow site is slow (name lookup, network distance, or encryption setup). If that extra connection cannot be made, those three values are simply skipped for that check; they never mark a working site as down. An **expired** certificate marks the site down.

### Device metrics

| Metric | Unit | Alerts when | Allowed range | Recommended warning / critical | Healthy | What it means |
|---|---|---|---|---|---|---|
| Latency | ms | value **rises above** the threshold | 1 to 10000 ms | 100 / 300 ms | under 50 ms on a LAN, under 150 ms across a WAN | Ping round-trip time to the device. High = congested link, overloaded device or a long path. |
| Packet loss | % | value **rises above** the threshold | 0 to 100 % | 5 / 20 % | 0 % | Share of ping packets that got no reply. Anything above 0 on a wired link deserves a look. |
| CPU usage | % | value **rises above** the threshold | 1 to 100 % | 75 / 90 % | under 60 % on average | Processor load. Sustained high load = a runaway process or an under-sized machine. |
| Memory usage | % | value **rises above** the threshold | 1 to 100 % | 80 / 95 % | under 70 % | RAM in use. Near 100 % the system starts swapping and slows down or kills processes. |
| Disk usage | % | value **rises above** the threshold | 1 to 100 % | 80 / 95 % | under 75 % | Space used on the monitored disk or share. A full disk stops databases, logs and updates. |
| Bandwidth usage | % | value **rises above** the threshold | 1 to 100 % | 70 / 90 % | under 60 % of the link speed | Interface utilisation. Sustained high values mean the link is close to saturation. |

Which device metrics each method offers: ping -- latency, packet loss; SNMP -- latency, packet loss, CPU, bandwidth; SSH -- latency, packet loss, CPU, memory, disk; PowerShell -- all six; disk usage -- disk, latency.

**Alert wording.** Alerts now name the metric with its unit, for example *Response time (ms)*, value `1346`, threshold `1000 ms`; and for SSL *SSL certificate expires in (days)*, threshold `below 30 days`. SMS and voice-call alerts use the same names (SMS text is capped at 160 characters).
