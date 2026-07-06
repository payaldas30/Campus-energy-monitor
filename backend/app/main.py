"""FastAPI application: REST endpoints + a WebSocket live feed.

On startup it seeds a historical window into SQLite (once), then a background
task advances a simulated clock, appends each new interval to the database, and
broadcasts it to every connected WebSocket client.
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from . import analytics, config, database, simulator


class ConnectionManager:
    """Tracks connected WebSocket clients and broadcasts messages to them."""

    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


async def live_feed_loop():
    """Advance the simulated clock and emit one new interval per tick."""
    while True:
        await asyncio.sleep(config.LIVE_TICK_SECONDS)
        latest = database.get_latest_ts()
        if not latest:
            continue
        ts, batch = simulator.next_live_batch(datetime.fromisoformat(latest))
        database.insert_many(batch)
        await manager.broadcast({
            "type": "reading",
            "ts": ts.isoformat(),
            "readings": [
                {"zone": z, "zone_name": config.ZONES[z]["name"], "kw": kw}
                for _ts, z, kw in batch
            ],
        })


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    if database.is_empty():
        database.insert_many(simulator.seed_rows())
    task = asyncio.create_task(live_feed_loop())
    yield
    task.cancel()


app = FastAPI(title="Smart Energy Monitor API", version="1.0.0", lifespan=lifespan)

# Allow the frontend dev server (and any origin, for hackathon convenience).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/zones")
def zones():
    return [
        {"id": zid, "name": cfg["name"], "color": cfg["color"]}
        for zid, cfg in config.ZONES.items()
    ]


@app.get("/api/history")
def history(zone: str, hours: int = 48):
    return database.get_history(zone, hours)


@app.get("/api/summary")
def summary():
    rows = database.get_all()
    forecast = analytics.forecast_peak(rows)
    baseline = analytics.build_baseline(rows)
    anomalies = analytics.detect_anomalies(rows, baseline)
    s = analytics.summary(rows)
    return {
        **s,
        "anomaly_count": len(anomalies),
        "forecast_peak_hour": forecast["predicted_peak_hour"],
        "forecast_peak_kw": forecast["predicted_peak_kw"],
    }


@app.get("/api/anomalies")
def anomalies():
    rows = database.get_all()
    baseline = analytics.build_baseline(rows)
    detected = analytics.detect_anomalies(rows, baseline)
    # counts per zone (for the bar chart) + the most recent few detail records
    counts = {zid: 0 for zid in config.ZONES}
    for a in detected:
        counts[a["zone"]] = counts.get(a["zone"], 0) + 1
    return {
        "total": len(detected),
        "by_zone": [
            {"zone": zid, "name": config.ZONES[zid]["name"],
             "color": config.ZONES[zid]["color"], "count": counts[zid]}
            for zid in config.ZONES
        ],
        "recent": sorted(detected, key=lambda a: a["ts"], reverse=True)[:10],
    }


@app.get("/api/forecast")
def forecast():
    return analytics.forecast_peak(database.get_all())


@app.get("/api/recommendations")
def recommendations():
    rows = database.get_all()
    baseline = analytics.build_baseline(rows)
    detected = analytics.detect_anomalies(rows, baseline)
    fc = analytics.forecast_peak(rows)
    return analytics.recommendations(detected, fc)


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # Keep the connection open; we don't expect inbound messages.
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)
