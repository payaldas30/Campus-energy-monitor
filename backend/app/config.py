"""Shared configuration: zone definitions and simulation parameters.

These are the single source of truth for both the simulator (which generates
readings) and the analytics (which builds baselines from them).
"""

# Each zone has a typical standby load, a peak load, how much it runs on
# weekends relative to weekdays, and its occupied-hours window.
ZONES = {
    "admin": {
        "name": "Admin block",
        "base_kw": 8, "peak_kw": 22, "weekend_factor": 0.35, "occ": (9, 18),
        "color": "#38BFA1",
    },
    "labs": {
        "name": "Academic labs",
        "base_kw": 10, "peak_kw": 35, "weekend_factor": 0.20, "occ": (8, 20),
        "color": "#5AA9E6",
    },
    "hostel": {
        "name": "Hostel",
        "base_kw": 14, "peak_kw": 26, "weekend_factor": 1.05, "occ": (6, 23),
        "color": "#C084E0",
    },
    "library": {
        "name": "Library",
        "base_kw": 6, "peak_kw": 18, "weekend_factor": 0.55, "occ": (8, 22),
        "color": "#E8A33D",
    },
}

# History seeded on first startup.
SEED_DAYS = 14
# Interval represented by each reading (minutes). 15 min matches how utilities
# define demand-charge windows.
INTERVAL_MIN = 15
# How often the live simulator emits the next interval (seconds of wall-clock
# time per simulated 15-min step). Lower = faster demo.
LIVE_TICK_SECONDS = 3

# Anomaly detection threshold (z-score above baseline mean).
Z_THRESHOLD = 2.5

# Deliberately injected anomalies in the seeded history so the detector has
# something real to catch during the demo.
# (zone_id, day_offset_from_seed_start, start_hour, duration_hours, extra_kw)
INJECTED_ANOMALIES = [
    ("labs", 3, 1, 5, 18),      # AC left running overnight in an empty lab
    ("hostel", 7, 14, 3, 10),   # water heater fault, abnormal draw
    ("library", 10, 23, 4, 9),  # lighting left on after closing
]

DB_PATH = "energy.db"
