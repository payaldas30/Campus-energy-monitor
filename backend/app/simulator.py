"""Synthetic energy-data generator.

Produces realistic per-zone power readings: a daily occupancy cycle, weekday vs.
weekend differences, sensor noise, and a set of deliberately injected anomalies.
Used both to seed the historical window and to stream new readings live.
"""

import math
import random
from datetime import datetime, timedelta

from . import config

_rng = random.Random(42)


def occupancy_factor(hour, occ, is_weekend, weekend_factor):
    occ_start, occ_end = occ
    if occ_start <= hour < occ_end:
        mid = (occ_start + occ_end) / 2
        width = (occ_end - occ_start) / 2
        factor = 1.0 - 0.3 * ((hour - mid) / width) ** 2
    else:
        factor = 0.15
    if is_weekend:
        factor *= weekend_factor
    return max(factor, 0.1)


def generate_kw(zone_id, cfg, ts: datetime, seed_start: datetime | None = None):
    hour = ts.hour + ts.minute / 60
    is_weekend = ts.weekday() >= 5
    factor = occupancy_factor(hour, cfg["occ"], is_weekend, cfg["weekend_factor"])
    kw = cfg["base_kw"] + (cfg["peak_kw"] - cfg["base_kw"]) * factor
    kw += _rng.gauss(0, cfg["base_kw"] * 0.06)

    # Apply injected anomalies (only within the seeded historical window).
    if seed_start is not None:
        day_offset = (ts.date() - seed_start.date()).days
        for a_zone, a_day, a_hour, a_dur, a_extra in config.INJECTED_ANOMALIES:
            if a_zone == zone_id and day_offset == a_day and a_hour <= hour < a_hour + a_dur:
                kw += a_extra

    return max(kw, 0.5)


def seed_rows():
    """Generate the full historical window as (ts_iso, zone_id, kw) tuples.

    History ends at the most recent 15-min boundary before 'now' so the live
    feed can continue seamlessly from there.
    """
    now = datetime.now().replace(second=0, microsecond=0)
    now = now - timedelta(minutes=now.minute % config.INTERVAL_MIN)
    seed_start = now - timedelta(days=config.SEED_DAYS)

    rows = []
    steps = int(config.SEED_DAYS * 24 * 60 / config.INTERVAL_MIN)
    for i in range(steps):
        ts = seed_start + timedelta(minutes=i * config.INTERVAL_MIN)
        for zone_id, cfg in config.ZONES.items():
            kw = generate_kw(zone_id, cfg, ts, seed_start=seed_start)
            rows.append((ts.isoformat(), zone_id, kw))
    return rows


def next_live_batch(last_ts: datetime):
    """Given the last stored timestamp, produce readings for the next interval."""
    ts = last_ts + timedelta(minutes=config.INTERVAL_MIN)
    batch = []
    for zone_id, cfg in config.ZONES.items():
        kw = generate_kw(zone_id, cfg, ts)  # no injected anomalies in live feed
        batch.append((ts.isoformat(), zone_id, round(kw, 2)))
    return ts, batch
