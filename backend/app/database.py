"""SQLite persistence layer.

Deliberately uses the standard-library sqlite3 module (no ORM) to keep the
dependency list tiny and the data layer easy to read. The data volume here is
small enough that this is more than fast enough.
"""

import sqlite3
import threading
from contextlib import contextmanager

from .config import DB_PATH

# One connection shared across the app; SQLite serializes writes and the demo
# workload is light, so a single lock-guarded connection is simplest and safe.
_conn = sqlite3.connect(DB_PATH, check_same_thread=False)
_conn.row_factory = sqlite3.Row
_lock = threading.Lock()


@contextmanager
def _cursor():
    with _lock:
        cur = _conn.cursor()
        try:
            yield cur
            _conn.commit()
        finally:
            cur.close()


def init_db():
    with _cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS readings (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                ts        TEXT NOT NULL,   -- ISO 8601 timestamp
                zone      TEXT NOT NULL,   -- zone id
                kw        REAL NOT NULL
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_zone_ts ON readings (zone, ts)")


def is_empty() -> bool:
    with _cursor() as cur:
        cur.execute("SELECT COUNT(*) AS n FROM readings")
        return cur.fetchone()["n"] == 0


def insert_reading(ts: str, zone: str, kw: float):
    with _cursor() as cur:
        cur.execute(
            "INSERT INTO readings (ts, zone, kw) VALUES (?, ?, ?)", (ts, zone, round(kw, 2))
        )


def insert_many(rows):
    """rows: iterable of (ts, zone, kw)."""
    with _cursor() as cur:
        cur.executemany(
            "INSERT INTO readings (ts, zone, kw) VALUES (?, ?, ?)",
            [(ts, zone, round(kw, 2)) for ts, zone, kw in rows],
        )


def get_history(zone: str, hours: int):
    """Most recent `hours` of readings for one zone, oldest-first."""
    limit = max(hours * 4, 4)  # 4 readings per hour at 15-min resolution
    with _cursor() as cur:
        cur.execute(
            "SELECT ts, zone, kw FROM readings WHERE zone = ? ORDER BY ts DESC LIMIT ?",
            (zone, limit),
        )
        rows = [dict(r) for r in cur.fetchall()]
    return list(reversed(rows))


def get_all():
    """All readings, oldest-first — used to build baselines and analytics."""
    with _cursor() as cur:
        cur.execute("SELECT ts, zone, kw FROM readings ORDER BY ts ASC")
        return [dict(r) for r in cur.fetchall()]


def get_latest_ts():
    with _cursor() as cur:
        cur.execute("SELECT ts FROM readings ORDER BY ts DESC LIMIT 1")
        row = cur.fetchone()
        return row["ts"] if row else None
