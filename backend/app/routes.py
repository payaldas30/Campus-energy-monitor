"""
Two new analytics endpoints:
  GET /api/analytics?zone=<id>&period=24h|7d|14d
  GET /api/alerts?zone=all|<id>&severity=all|mild|moderate|severe
"""

from fastapi import Query
from . import analytics as ana, config, database


def register(app):

    @app.get("/api/analytics")
    def analytics_detail(
        zone: str = Query("all"),
        period: str = Query("14d"),
    ):
        # period → hours
        hours_map = {"24h": 24, "7d": 168, "14d": 336}
        hours = hours_map.get(period, 336)

        rows = database.get_all()

        # Filter to the requested period
        if rows:
            from datetime import datetime
            latest = max(datetime.fromisoformat(r["ts"]) for r in rows)
            cutoff_ts = latest.timestamp() - hours * 3600
            rows = [r for r in rows if datetime.fromisoformat(r["ts"]).timestamp() >= cutoff_ts]

        # Filter to zone if requested
        zone_rows = rows if zone == "all" else [r for r in rows if r["zone"] == zone]

        baseline = ana.build_baseline(rows)

        # ── 1. Baseline vs actual (per-zone, per-reading) ─────────────
        baseline_actual = []
        for r in zone_rows:
            from datetime import datetime
            ts = datetime.fromisoformat(r["ts"])
            key = (r["zone"], ts.hour, ts.weekday() >= 5)
            b = baseline.get(key)
            baseline_actual.append({
                "ts": r["ts"],
                "zone": r["zone"],
                "zone_name": config.ZONES.get(r["zone"], {}).get("name", r["zone"]),
                "kw": r["kw"],
                "expected_kw": round(b["mean"], 2) if b else None,
                "expected_upper": round(b["mean"] + b["std"], 2) if b else None,
                "expected_lower": round(max(b["mean"] - b["std"], 0), 2) if b else None,
            })

        # ── 2. Load curve by hour-of-day ──────────────────────────────
        from collections import defaultdict
        # {zone -> {hour -> [kw]}}
        hour_buckets = defaultdict(lambda: defaultdict(list))
        for r in rows:
            from datetime import datetime
            ts = datetime.fromisoformat(r["ts"])
            hour_buckets[r["zone"]][ts.hour].append(r["kw"])

        load_curve = []
        for h in range(24):
            point = {"hour": h, "label": f"{h:02d}:00"}
            for zid, zconf in config.ZONES.items():
                vals = hour_buckets[zid][h]
                point[zid] = round(sum(vals) / len(vals), 2) if vals else 0
            load_curve.append(point)

        # ── 3. Weekday vs weekend ─────────────────────────────────────
        wd_buckets = defaultdict(lambda: defaultdict(list))   # zone -> hour -> [kw] weekday
        we_buckets = defaultdict(lambda: defaultdict(list))   # zone -> hour -> [kw] weekend
        for r in rows:
            from datetime import datetime
            ts = datetime.fromisoformat(r["ts"])
            if ts.weekday() >= 5:
                we_buckets[r["zone"]][ts.hour].append(r["kw"])
            else:
                wd_buckets[r["zone"]][ts.hour].append(r["kw"])

        weekday_vs_weekend = []
        for h in range(24):
            point = {"hour": h, "label": f"{h:02d}:00"}
            for zid in config.ZONES:
                wd = wd_buckets[zid][h]
                we = we_buckets[zid][h]
                point[f"{zid}_weekday"] = round(sum(wd) / len(wd), 2) if wd else 0
                point[f"{zid}_weekend"] = round(sum(we) / len(we), 2) if we else 0
            weekday_vs_weekend.append(point)

        # ── 4. Zone contribution (share over period) ──────────────────
        zone_totals = defaultdict(float)
        for r in rows:
            zone_totals[r["zone"]] += r["kw"]
        grand_total = sum(zone_totals.values()) or 1

        zone_contribution = [
            {
                "zone": zid,
                "name": config.ZONES[zid]["name"],
                "color": config.ZONES[zid]["color"],
                "total_kwh": round(zone_totals[zid] * (config.INTERVAL_MIN / 60), 1),
                "pct": round(zone_totals[zid] / grand_total * 100, 1),
            }
            for zid in config.ZONES
        ]

        # ── 5. Forecast hourly curve ──────────────────────────────────
        fc = ana.forecast_peak(rows)
        forecast_curve = [
            {"hour": h, "label": f"{h:02d}:00", "kw": kw}
            for h, kw in sorted(fc["hourly_forecast_kw"].items())
        ]

        # Contribution stacked (for stacked area, last N points)
        # Build per-zone hourly totals for stacked area chart
        stacked_points = defaultdict(lambda: defaultdict(list))
        for r in rows:
            from datetime import datetime
            ts = datetime.fromisoformat(r["ts"])
            stacked_points[r["ts"]][r["zone"]] = r["kw"]

        # Sample max 96 points for the stacked chart (every hour)
        sorted_ts = sorted(stacked_points.keys())
        step = max(1, len(sorted_ts) // 96)
        stacked_area = []
        for ts_key in sorted_ts[::step]:
            pt = {"ts": ts_key}
            for zid in config.ZONES:
                pt[zid] = round(stacked_points[ts_key].get(zid, 0), 2)
            stacked_area.append(pt)

        return {
            "baseline_actual": baseline_actual[-192:],   # last 192 points for chart
            "load_curve": load_curve,
            "weekday_vs_weekend": weekday_vs_weekend,
            "zone_contribution": zone_contribution,
            "forecast_curve": forecast_curve,
            "stacked_area": stacked_area,
            "peak_hour": fc.get("predicted_peak_hour"),
            "peak_kw": fc.get("predicted_peak_kw"),
        }

    @app.get("/api/alerts")
    def alerts_list(
        zone: str = Query("all"),
        severity: str = Query("all"),
    ):
        rows = database.get_all()
        baseline = ana.build_baseline(rows)
        detected = ana.detect_anomalies(rows, baseline)

        # Classify severity
        def classify(z_score):
            if z_score >= 4.0:   return "severe"
            if z_score >= 3.0:   return "moderate"
            return "mild"

        enriched = []
        for a in detected:
            sev = classify(a["z_score"])
            pct_over = round((a["kw"] - a["expected_kw"]) / max(a["expected_kw"], 0.1) * 100, 1)
            # Match to recommendation tag
            rec_link = None
            if a["zone"] == "labs":
                rec_link = "Auto-shutoff for unoccupied lab HVAC"
            elif a["zone"] == "library":
                rec_link = "Occupancy-linked lighting in library"

            # Plain-language label
            from datetime import datetime
            ts = datetime.fromisoformat(a["ts"])
            hour = ts.hour
            if 0 <= hour < 6:
                time_ctx = "overnight"
            elif 6 <= hour < 9:
                time_ctx = "early morning"
            elif 9 <= hour < 17:
                time_ctx = "daytime"
            elif 17 <= hour < 21:
                time_ctx = "evening"
            else:
                time_ctx = "late night"

            label = f"{time_ctx.capitalize()} spike in {a['zone_name']}"

            enriched.append({
                **a,
                "severity": sev,
                "pct_over": pct_over,
                "color": config.ZONES.get(a["zone"], {}).get("color", "#888"),
                "rec_link": rec_link,
                "label": label,
                "status": "new",   # UI manages state client-side
            })

        # Filter zone
        if zone != "all":
            enriched = [e for e in enriched if e["zone"] == zone]

        # Filter severity
        if severity != "all":
            enriched = [e for e in enriched if e["severity"] == severity]

        # Sort: newest first, then by z_score desc within same timestamp
        enriched.sort(key=lambda x: (x["ts"], x["z_score"]), reverse=True)

        return {
            "total": len(enriched),
            "alerts": enriched[:100],   # cap at 100
            "severity_counts": {
                "severe":   sum(1 for e in enriched if e["severity"] == "severe"),
                "moderate": sum(1 for e in enriched if e["severity"] == "moderate"),
                "mild":     sum(1 for e in enriched if e["severity"] == "mild"),
            },
        }
