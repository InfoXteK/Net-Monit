# Net-monit V11.3.3

**Self-Hosted Network and Infrastructure Monitoring Platform**

Copyright (c) 2024–2026 Abdullah · [abuabdullah.be@outlook.com](mailto:abuabdullah.be@outlook.com)

---

## What is Net-monit?

Net-monit is a self-hosted, on-premises network and infrastructure monitoring solution. It runs on your own server or machine and requires no cloud connectivity or third-party services.

### Core Features

- **Speed Testing**
  - WAN speed test (built-in, measures your route to Cloudflare DXB)
  - PC speed test (browser-based, from your machine to Cloudflare)
  - Live gauge showing download (green) and upload (purple) with Mbps updates
  - Rate-limit handling: backs off when test servers throttle, reports "rate-limited" transparently

- **Network Scanning**
  - TCP port scan (22, 3389, common services)
  - UDP port scan (DNS, SNMP, NTP, TFTP, mDNS, SSDP)
  - Device type detection via SNMP
  - Gapless port inventory from version 5086 through V11.3.3

- **Device Monitoring**
  - Ping (ICMP response)
  - SNMP (device info, interfaces, disk usage)
  - SSH (remote command execution)
  - PowerShell (Windows remote management)
  - HTTP/HTTPS (URL availability)
  - Disk usage and service/task status

- **Alerting**
  - Multi-level escalation (L1/L2/L3) per device
  - Email, SMS, and voice-call alerts
  - Configurable thresholds and notification timing
  - Audit log of all alerts and actions

- **Administration**
  - Multi-user with role-based access (Admin/Viewer)
  - Per-user dashboard layout and preferences
  - SMTP configuration for email alerts
  - Encrypted credential storage (AES)
  - Backup and restore (export/import device configuration)

- **Licensing**
  - 30-day free trial (no key needed)
  - Offline Ed25519-signed keys (V11.0)
  - Device-bound: tied to the installation's Device ID and Activation Code
  - Vendor-issued: completely free, request via [abuabdullah.be@outlook.com](mailto:abuabdullah.be@outlook.com) or [infoxtek.com](https://infoxtek.com)
  - No phone-home or cloud authentication

---

## What's New in V11.3.3

### Thresholds (site metrics fixed)

- **Websites now have their own thresholds.** Settings > Thresholds and the per-device Notify window used to show device metrics (CPU, memory, disk) for a website. A website now shows: **Response time (ms)**, **SSL certificate expires in (days)**, **SSL handshake time (ms)**, **DNS lookup time (ms)** and **TCP connect time (ms)**.
- **Every metric row explains itself:** unit, which direction triggers an alert, the **allowed minimum and maximum**, the **recommended warning and critical values**, what a healthy value looks like, and a one-line meaning. **Fill recommended values** applies them in one click.
- **SSL days left alerts when the number falls below the threshold** (default warning 30 days, critical 7).
- **Impossible values are refused** with a clear message (warning above critical, number out of range), on every screen and on the server.
- **Alert messages show names and units**, e.g. "Response time (ms): 1346.0, threshold 1000 ms".
- A site's own **"Warn if slower than (ms)"** now sets that site's response-time warning.

### Fixes found on the way

- **SMS and voice-call alerts now work.** Since V8.5 any alert for a device with SMS or call numbers failed with an internal error before it was sent.
- **Setup wizard:** a failed optional Python install now shows the error instead of spinning forever.

## What Was New in V11.0

### Licensing (Complete Redesign)

- **Cryptographically signed keys**: Ed25519 asymmetric signatures. The app can *verify* a key but cannot *create* one.
- **Stronger security**: V10.9 and earlier shipped the signing secret in every installation, so anyone with the files could forge a key. V11.0 contains only the public key.
- **Strict migration**: Keys from V10.9 and earlier are rejected. Customers must request new keys with the new Device ID and Activation Code.
- **Long keys**: New keys start with `NM1-` and are ~127 characters with dashes. Customers paste them (not type them).

### Speed Test Improvements

- **Rate-limit handling** (HTTP 429/503): backs off, uses fewer connections, retires streams, and reports "rate-limited" instead of "connection errors".
- **Live gauge**: Built-in test (default) shows a live needle for both download and upload, with one-second smoothing.
- **Default is built-in**: The fast, gauge-enabled Cloudflare test (default `speedtest.engine: builtin`). The optional `speedtest-cli` library can still be used with `engine: auto`, but it has no live gauge.

### Service and Setup

- **Windows service fix (V11.0)**: The service now gets proper null streams at startup, logs all crashes to `logs\service.log`, and stops (for Windows recovery action) if the web server dies.
- **Guide updates**: Activation page rewritten (step-by-step for sending Device ID + Activation Code to vendor). Setup Guide has new troubleshooting section "Service installed but dashboard not opening".

### Documentation

- **Product Owner Guide**: New (owner-only), covers key rotation, passphrase protection, and backup procedures.
- **Admin Guide**: New section on licensing and the Ed25519 scheme.
- **Setup Guide**: Activation section rewritten with vendor contact info (email + website + 4–7 business day turnaround).

---

## Quick Start

### Windows

```bat
REM Right-click Setup.bat and choose "Run as administrator"
Setup.bat
```

Installs to `C:\NetMonit-V11.3.1`, registers `Net_Monit_V111` Windows service, opens http://localhost:50111.

### Linux

```bash
chmod +x setup.sh
sudo bash setup.sh
```

Installs to `/opt/netmonit-v111`, registers `netmonit-v111.service`, opens http://localhost:50111.

### Manual (any OS)

```bash
pip install -r requirements.txt
python app.py
# Or:  NETMON_PORT=50111 python app.py
```

Dashboard: **http://localhost:50111** (or whatever port you configured)

Default login: **admin@email.com** / **Admin@54321$** — change immediately on first login.

---

## Licensing

### For Customers

1. On the **License** page (or **Settings > License**), copy your **Device ID** and **Activation Code**.
2. Send both values to [abuabdullah.be@outlook.com](mailto:abuabdullah.be@outlook.com) or submit a request at [infoxtek.com](https://infoxtek.com).
3. You will receive your license key within **4–7 business days**. **The license is completely free.**
4. Paste the key (it starts with `NM1-` and is about 127 characters) into the Activation page and click **Activate License**.

A license is tied to one installation. If you reinstall or move to a new folder, you need a new key.

### For Product Owners

The License Key Generator is **owner-only**; never ship it to customers. It holds the private signing key.

```bash
# Windows
LicenseKeyGenerator.bat

# Command-line (generate a key for Device ID + Activation Code)
LicenseKeyGenerator-Python.bat DEVICEID ACTIVATIONCODE

# Protect the key with a passphrase
python LicenseKeyGenerator.py --protect-key

# Create a new key pair (voids all old keys)
python LicenseKeyGenerator.py --rotate-keys --app-dir "C:\path\to\Net-monit-V11.3.1"
```

See **DOC-ProductOwner-Guide** for setup, key rotation, and disaster recovery.

---

## Architecture

**Backend**: Flask + SQLite (local database, no external dependencies)

**Frontend**: Jinja2 server-rendered templates + vanilla JavaScript (no build step)

**Data**: Configuration in `config.yaml`, database in `data/monitor.db` (encrypted credentials)

**Deployment**: Windows service (`pythonw.exe` + `install_service.py`) or Linux systemd (`netmonit-v111.service`)

---

## Project Structure

```
Net-monit-V11.3.1/
├── app.py                              Main Flask application
├── config.yaml                         Configuration (port, email, monitoring intervals, etc.)
├── requirements.txt                    Python dependencies
├── install_service.py                  Windows service installer + service lifecycle
├── Setup.bat                           Windows setup launcher
├── setup.sh                            Linux setup launcher
├── Uninstall.bat / Uninstall.sh        Removal scripts
├── monitor/
│   ├── license.py                      Licensing engine (verify-only, Ed25519 public key)
│   ├── threshold_meta.py               Metric catalogue: units, ranges, recommended values (V11.3.1)
│   ├── database.py                     SQLite schema and data layer
│   ├── auth.py                         Authentication and session management
│   ├── scheduler.py                    Polling scheduler for device checks
│   ├── email_notifier.py               Email alert delivery
│   ├── alerts.py                       Alert state machine and escalation
│   ├── config_manager.py               Configuration read/write
│   ├── crypto.py                       Credential encryption (AES)
│   └── checkers/                       Device check modules
│       ├── ping_check.py
│       ├── snmp_check.py
│       ├── ssh_check.py
│       ├── powershell_check.py
│       ├── disk_usage_check.py
│       ├── url_check.py
│       ├── speedtest_check.py          WAN/PC speed testing (built-in engine)
│       └── network_scan.py             TCP + UDP port scanning
├── templates/                          Jinja2 HTML templates
│   ├── base.html                       Base layout (header, sidebar, footer)
│   ├── dashboard.html
│   ├── devices.html
│   ├── settings.html
│   ├── admin.html
│   ├── activation.html                 License activation page
│   ├── speedtest.html                  Speed test UI and results
│   └── networkscan.html                Network scan UI and results
├── static/
│   ├── css/
│   │   ├── base.css                    Global styles
│   │   └── [component].css
│   └── js/
│       ├── threshold_ui.js             Shared threshold table (V11.3.1)
│       ├── base.js                     Global scripts
│       └── [component].js
├── docs/
│   ├── DOC-Setup-Guide.md / .docx
│   ├── DOC-User-Guide.md / .docx
│   ├── DOC-Admin-Guide.md / .docx
│   ├── DOC-Service-Task-Monitoring-Guide.md / .docx
│   └── CLAUDE.md                       Architecture and development history (13 lessons)
└── scripts/
    ├── windows/
    │   ├── Setup-Windows.ps1           GUI setup wizard (7 pages)
    │   └── (installer scripts)
    └── linux/
        ├── netmonit-v111.service       systemd unit file
        └── install-dependencies.sh
```

---

## Configuration

Edit `config.yaml` to customize:

- **Port**: `server: port: 50111`
- **Email alerts**: `smtp: host, port, username, password`
- **Speed test**: `speedtest: engine: builtin` (default) or `auto` (use speedtest-cli library if available)
- **Speed test target**: `speedtest: targets:` for nearby LibreSpeed-compatible servers (optional)
- **Monitoring intervals**: `scheduler: polling_interval_seconds, alert_check_interval_seconds`

---

## Documentation

| Document | Format | Purpose |
|----------|--------|---------|
| DOC-Setup-Guide | Markdown + Word | Installation, configuration, upgrading from older versions, troubleshooting |
| DOC-User-Guide | Markdown + Word | Dashboard overview, monitoring devices, managing alerts, dashboard layout |
| DOC-Admin-Guide | Markdown + Word | User management, SMTP, audit log, licensing, licensing background |
| DOC-Service-Task-Monitoring-Guide | Markdown + Word | Windows services and scheduled tasks monitoring |
| CLAUDE.md | Markdown | Architecture decisions, design patterns, 13 lessons for future development |
| DOC-ProductOwner-Guide | Markdown + Word (owner-only) | Key generation, key rotation, passphrase protection, disaster recovery |

---

## Support and Licensing

**Questions or issues?** Contact [abuabdullah.be@outlook.com](mailto:abuabdullah.be@outlook.com) or visit [infoxtek.com](https://infoxtek.com).

**License**: Each installation requires a free license key, tied to its Device ID and Activation Code. 30-day trial available without a key.

---

© 2024–2026 Abdullah  
[abuabdullah.be@outlook.com](mailto:abuabdullah.be@outlook.com)  
[infoxtek.com](https://infoxtek.com)
