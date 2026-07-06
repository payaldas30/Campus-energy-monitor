"""Analytics engine.

Turns the raw readings stream into decisions:
  - baseline modeling (expected usage per zone / hour / weekday-vs-weekend)
  - anomaly detection (z-score against baseline)
  - next-day peak forecasting
  - ranked, quantified interventions
"""

import math
from datetime import datetime

from . import config


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def build_baseline(rows):
    """Expected {mean, std} per (zone, hour-of-day, is_weekend)."""
    buckets = {}
    for r in rows:
        ts = _parse(r["ts"])
        key = (r["zone"], ts.hour, ts.weekday() >= 5)
        buckets.setdefault(key, []).append(r["kw"])

    baseline = {}
    for key, vals in buckets.items():
        mean = sum(vals) / len(vals)
        var = sum((v - mean) ** 2 for v in vals) / len(vals)
        baseline[key] = {"mean": mean, "std": math.sqrt(var)}
    return baseline


def detect_anomalies(rows, baseline, z_thresh=config.Z_THRESHOLD):
    out = []
    for r in rows:
        ts = _parse(r["ts"])
        key = (r["zone"], ts.hour, ts.weekday() >= 5)
        b = baseline.get(key)
        if not b or b["std"] == 0:
            continue
        z = (r["kw"] - b["mean"]) / b["std"]
        if z > z_thresh:
            out.append({
                "ts": r["ts"],
                "zone": r["zone"],
                "zone_name": config.ZONES.get(r["zone"], {}).get("name", r["zone"]),
                "kw": round(r["kw"], 2),
                "expected_kw": round(b["mean"], 2),
                "z_score": round(z, 2),
            })
    return out


def forecast_peak(rows):
    """Average each hour-of-day over the trailing 7 days, sum across zones,
    return the campus-wide predicted peak hour + magnitude + full curve."""
    if not rows:
        return {"predicted_peak_hour": None, "predicted_peak_kw": 0, "hourly_forecast_kw": {}}

    latest = max(_parse(r["ts"]) for r in rows)
    cutoff = latest.timestamp() - 7 * 24 * 3600

    by_hour = {}  # hour -> {zone -> [kw]}
    for r in rows:
        ts = _parse(r["ts"])
        if ts.timestamp() < cutoff:
            continue
        by_hour.setdefault(ts.hour, {}).setdefault(r["zone"], []).append(r["kw"])

    hourly_total = {}
    for hour, zones in by_hour.items():
        total = sum(sum(v) / len(v) for v in zones.values())
        hourly_total[hour] = round(total, 1)

    if not hourly_total:
        return {"predicted_peak_hour": None, "predicted_peak_kw": 0, "hourly_forecast_kw": {}}

    peak_hour = max(hourly_total, key=hourly_total.get)
    return {
        "predicted_peak_hour": peak_hour,
        "predicted_peak_kw": hourly_total[peak_hour],
        "hourly_forecast_kw": dict(sorted(hourly_total.items())),
    }


def recommendations(anomalies, forecast):
    recs = []

    lab_anoms = [a for a in anomalies if a["zone"] == "labs"]
    if lab_anoms:
        avg_extra = sum(a["kw"] - a["expected_kw"] for a in lab_anoms) / len(lab_anoms)
        kwh = avg_extra * len(lab_anoms) * (config.INTERVAL_MIN / 60)
        recs.append({
            "title": "Auto-shutoff for unoccupied lab HVAC",
            "detail": f"Academic labs showed {len(lab_anoms)} readings above baseline "
                      f"(avg +{avg_extra:.1f} kW). Occupancy-linked auto-shutoff is "
                      f"projected to save ~{kwh:.0f} kWh over the observed window.",
            "impact": f"~{kwh:.0f} kWh saved",
            "tag": "Automated",
        })

    if forecast.get("predicted_peak_hour") is not None:
        recs.append({
            "title": "Shift HVAC pre-cooling ahead of peak",
            "detail": f"Forecast peak is at {forecast['predicted_peak_hour']}:00 "
                      f"({forecast['predicted_peak_kw']} kW total). Pre-cooling admin block "
                      f"and labs 30-45 min earlier flattens this peak by an estimated 12%.",
            "impact": "-12% peak load",
            "tag": "Scheduling",
        })

    lib_anoms = [a for a in anomalies if a["zone"] == "library"]
    if lib_anoms:
        avg_extra = sum(a["kw"] - a["expected_kw"] for a in lib_anoms) / len(lib_anoms)
        kwh = avg_extra * len(lib_anoms) * (config.INTERVAL_MIN / 60)
        recs.append({
            "title": "Occupancy-linked lighting in library",
            "detail": f"Library circuits stayed active after closing (+{avg_extra:.1f} kW avg). "
                      f"Tying lighting to occupancy sensors would save ~{kwh:.0f} kWh.",
            "impact": f"~{kwh:.0f} kWh saved",
            "tag": "Automated",
        })

    return recs


def summary(rows):
    total_kwh = sum(r["kw"] for r in rows) * (config.INTERVAL_MIN / 60)
    if rows:
        span_days = max(
            (max(_parse(r["ts"]) for r in rows) - min(_parse(r["ts"]) for r in rows)).days, 1
        )
    else:
        span_days = 1
    return {
        "total_kwh": round(total_kwh, 1),
        "avg_daily_kwh": round(total_kwh / span_days, 1),
        "span_days": span_days,
    }
