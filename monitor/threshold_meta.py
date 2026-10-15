# =============================================================================
# Net-monit V11.2 -- Threshold metric catalogue (single source of truth)
# Copyright (c) 2024-2026 Abdullah | InfoXtek.com
# =============================================================================
"""
threshold_meta.py

ONE place that says which metrics exist, what they mean, which monitoring method produces them, which
direction is "bad", the allowed range and the recommended warning/critical values.

Used by:
  * monitor/alerts.py          -> DEFAULT_THRESHOLDS, the list of evaluated metrics, alert wording
  * app.py                     -> GET /api/threshold-meta (the Settings and Devices pages render from it)
                                  and server-side validation of every threshold save
  * monitor/email_notifier.py  -> human metric names and units in alert emails

Before V11.2 the Settings screens kept their own copies of the six DEVICE metrics, had no entry for
sites (method "url") and fell back to showing device metrics (CPU, memory, disk ...) for a website.
Add a metric HERE and every screen, the alert engine and the validation pick it up.

Fields per metric
  label, unit          shown in the UI and in alert text ("Response time", "ms")
  group                "device" | "site"
  lower_is_worse       True when a SMALLER value is the bad one (SSL days left). Default False.
  min, max             allowed range for a threshold value (UI hint + server validation)
  warning, critical    recommended / built-in default values
  good                 one sentence: what a healthy value looks like
  hint                 one sentence: what the metric means and what a bad value usually points to
"""

METRICS = {
    # ---------------------------------------------------------------- device metrics (unchanged values)
    "latency_ms": dict(
        label="Latency", unit="ms", group="device", min=1, max=10000, warning=100, critical=300,
        good="under 50 ms on a LAN, under 150 ms across a WAN",
        hint="Ping round-trip time to the device. High = congested link, overloaded device or a long path."),
    "packet_loss_pct": dict(
        label="Packet loss", unit="%", group="device", min=0, max=100, warning=5, critical=20,
        good="0 %",
        hint="Share of ping packets that got no reply. Anything above 0 on a wired link deserves a look."),
    "cpu_pct": dict(
        label="CPU usage", unit="%", group="device", min=1, max=100, warning=75, critical=90,
        good="under 60 % on average",
        hint="Processor load. Sustained high load = a runaway process or an under-sized machine."),
    "memory_pct": dict(
        label="Memory usage", unit="%", group="device", min=1, max=100, warning=80, critical=95,
        good="under 70 %",
        hint="RAM in use. Near 100 % the system starts swapping and slows down or kills processes."),
    "disk_pct": dict(
        label="Disk usage", unit="%", group="device", min=1, max=100, warning=80, critical=95,
        good="under 75 %",
        hint="Space used on the monitored disk or share. A full disk stops databases, logs and updates."),
    "bandwidth_pct": dict(
        label="Bandwidth usage", unit="%", group="device", min=1, max=100, warning=70, critical=90,
        good="under 60 % of the link speed",
        hint="Interface utilisation. Sustained high values mean the link is close to saturation."),
    # ---------------------------------------------------------------- site (website / URL) metrics
    "response_ms": dict(
        label="Response time", unit="ms", group="site", min=1, max=60000, warning=1000, critical=5000,
        good="under 500 ms",
        hint="Time until the site starts answering (DNS + connect + TLS + server think time, redirects included). "
             "High = slow or overloaded server, heavy page, or a poor network path."),
    "ssl_days_left": dict(
        label="SSL certificate expires in", unit="days", group="site", lower_is_worse=True,
        min=1, max=825, warning=30, critical=7,
        good="more than 30 days",
        hint="Days until the site's certificate expires. ALERTS WHEN THE VALUE FALLS BELOW the threshold. "
             "At 0 the certificate is expired and browsers block the site."),
    "ssl_handshake_ms": dict(
        label="SSL handshake time", unit="ms", group="site", min=1, max=30000, warning=500, critical=1500,
        good="under 300 ms",
        hint="Time to negotiate the encrypted connection after it opens. High = distant or overloaded server/proxy, "
             "or very heavy TLS settings."),
    "dns_ms": dict(
        label="DNS lookup time", unit="ms", group="site", min=1, max=10000, warning=300, critical=1000,
        good="under 100 ms",
        hint="Time to turn the site name into an IP address. High = slow or failing DNS server."),
    "connect_ms": dict(
        label="TCP connect time", unit="ms", group="site", min=1, max=30000, warning=300, critical=1000,
        good="under 100 ms in the same region, under 300 ms overseas",
        hint="Time to open the network connection to the server. Pure network distance/congestion; "
             "high with a fast server = a network path problem."),
}

# Metrics offered per monitoring method (the screens show ONLY these). Unknown method -> device metrics.
DEVICE_METRICS = [k for k, m in METRICS.items() if m["group"] == "device"]
SITE_METRICS = [k for k, m in METRICS.items() if m["group"] == "site"]
METHOD_METRICS = {
    "ping":       ["latency_ms", "packet_loss_pct"],
    "snmp":       ["latency_ms", "packet_loss_pct", "cpu_pct", "bandwidth_pct"],
    "powershell": ["latency_ms", "packet_loss_pct", "cpu_pct", "memory_pct", "disk_pct", "bandwidth_pct"],
    "ssh":        ["latency_ms", "packet_loss_pct", "cpu_pct", "memory_pct", "disk_pct"],
    "disk_usage": ["disk_pct", "latency_ms"],
    "url":        ["response_ms", "ssl_days_left", "ssl_handshake_ms", "dns_ms", "connect_ms"],
}
ALL_KEYS = list(METRICS.keys())


def default_thresholds() -> dict:
    """{metric: {warning, critical[, lower_is_worse]}} -- what alerts.DEFAULT_THRESHOLDS is built from."""
    out = {}
    for k, m in METRICS.items():
        d = {"warning": m["warning"], "critical": m["critical"]}
        if m.get("lower_is_worse"):
            d["lower_is_worse"] = True
        out[k] = d
    return out


def metrics_for_method(method: str) -> list:
    return list(METHOD_METRICS.get(method or "", DEVICE_METRICS))


def label(metric: str) -> str:
    m = METRICS.get(metric)
    return m["label"] if m else metric.replace("_", " ")


def unit(metric: str) -> str:
    m = METRICS.get(metric)
    return m["unit"] if m else ""


def label_with_unit(metric: str) -> str:
    m = METRICS.get(metric)
    return f"{m['label']} ({m['unit']})" if m else metric.replace("_", " ")


def _num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return v
    return int(f) if f == int(f) else round(f, 1)


def format_threshold(metric: str, value) -> str:
    """'1000 ms' for higher-is-worse, 'below 30 days' for lower-is-worse. '' when value is None."""
    if value is None:
        return ""
    m = METRICS.get(metric) or {}
    u = f" {m['unit']}" if m.get("unit") else ""
    pre = "below " if m.get("lower_is_worse") else ""
    return f"{pre}{_num(value)}{u}"


def format_value(metric: str, value) -> str:
    m = METRICS.get(metric) or {}
    u = f" {m['unit']}" if m.get("unit") else ""
    return f"{_num(value)}{u}"


def public_catalogue() -> dict:
    """What GET /api/threshold-meta returns."""
    return {"metrics": METRICS, "methods": METHOD_METRICS,
            "device_metrics": DEVICE_METRICS, "site_metrics": SITE_METRICS}


def validate_thresholds(thresholds) -> tuple:
    """
    Check a {metric: {enabled, warning, critical, wait_sec}} dict from the UI.
    Returns (cleaned, errors). Unknown metric keys are passed through untouched (older configs may hold them).
    A value is rejected when it is not a number, is outside the metric's allowed range, or the warning is on
    the wrong side of the critical for that metric's direction.
    """
    errors = []
    if thresholds is None:
        return {}, errors
    if not isinstance(thresholds, dict):
        return {}, ["Thresholds must be an object of metric settings."]
    cleaned = {}
    for key, row in thresholds.items():
        if key not in METRICS or not isinstance(row, dict):
            cleaned[key] = row
            continue
        m = METRICS[key]
        out = dict(row)
        vals = {}
        for fld in ("warning", "critical"):
            if row.get(fld) in (None, ""):
                out.pop(fld, None)
                continue
            try:
                f = float(row[fld])
                if f != f or f in (float("inf"), float("-inf")):
                    raise ValueError
            except (TypeError, ValueError):
                errors.append(f"{m['label']}: {fld} must be a number.")
                continue
            if f < m["min"] or f > m["max"]:
                errors.append(f"{m['label']}: {fld} {_num(f)} is outside the allowed range "
                              f"{m['min']} to {m['max']} {m['unit']}.")
                continue
            vals[fld] = f
            out[fld] = int(f) if f == int(f) else f
        if "warning" in vals and "critical" in vals:
            w, c = vals["warning"], vals["critical"]
            if m.get("lower_is_worse"):
                if w < c:
                    errors.append(f"{m['label']}: warning ({_num(w)}) must be higher than critical ({_num(c)}) "
                                  f"because this metric alerts when the value falls BELOW the threshold.")
            elif w > c:
                errors.append(f"{m['label']}: warning ({_num(w)}) must be lower than critical ({_num(c)}).")
        if row.get("wait_sec") not in (None, ""):
            try:
                if int(row["wait_sec"]) < 0:
                    raise ValueError
            except (TypeError, ValueError):
                errors.append(f"{m['label']}: wait (sec) must be 0 or more.")
        cleaned[key] = out
    return cleaned, errors
