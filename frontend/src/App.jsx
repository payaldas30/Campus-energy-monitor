import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import {
  Activity, AlertTriangle, TrendingUp, Zap, Leaf, ChevronRight,
  WifiOff, Wifi, Sun, Moon,
} from "lucide-react";
import {
  fetchZones, fetchHistory, fetchSummary, fetchAnomalies,
  fetchRecommendations, connectLive,
} from "./api";

/* ── helpers ──────────────────────────────────────────────────── */
const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
};

function getInitialTheme() {
  const saved = localStorage.getItem("sem-theme");
  if (saved) return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/* ── App ──────────────────────────────────────────────────────── */
export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [recs, setRecs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [lastTs, setLastTs] = useState(null);
  const [error, setError] = useState(null);

  const zoneIdRef = useRef(null);
  zoneIdRef.current = zoneId;
  const zone = zones.find((z) => z.id === zoneId);

  /* Apply theme to <html> + persist */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.background = "var(--bg-page)";
    document.body.style.background = "var(--bg-page)";
    localStorage.setItem("sem-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  /* Initial data load */
  useEffect(() => {
    (async () => {
      try {
        const [zs, sm, an, rc] = await Promise.all([
          fetchZones(), fetchSummary(), fetchAnomalies(), fetchRecommendations(),
        ]);
        setZones(zs);
        setZoneId(zs[0]?.id ?? null);
        setSummary(sm);
        setAnomalies(an);
        setRecs(rc);
      } catch {
        setError("Could not reach the backend. Is it running on port 8000?");
      }
    })();
  }, []);

  /* History per zone */
  useEffect(() => {
    if (!zoneId) return;
    fetchHistory(zoneId, 48).then(setHistory).catch(() => {});
  }, [zoneId]);

  /* Live WebSocket readings */
  const handleReading = useCallback((msg) => {
    setLastTs(msg.ts);
    const zid = zoneIdRef.current;
    const r = msg.readings.find((x) => x.zone === zid);
    if (!r) return;
    setHistory((prev) => {
      const next = [...prev, { ts: msg.ts, zone: zid, kw: r.kw }];
      return next.slice(-192);
    });
  }, []);

  useEffect(() => {
    let ws, retry;
    const open = () => {
      ws = connectLive(handleReading);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        retry = setTimeout(open, 2000);
      };
    };
    open();
    return () => {
      clearTimeout(retry);
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [handleReading]);

  const chartData = useMemo(
    () => history.map((h) => ({ label: fmtTime(h.ts), kw: h.kw })),
    [history]
  );

  /* Error state */
  if (error) {
    return (
      <div style={s.errorWrap}>
        <WifiOff size={40} color="#E2574C" />
        <p style={{ marginTop: 16, fontSize: 15, color: "var(--text-primary)" }}>{error}</p>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Start it with <code style={s.code}>uvicorn app.main:app --reload</code> in the backend folder.
        </p>
      </div>
    );
  }

  /* Chart axis/grid colours derived from CSS vars (read at render time) */
  const axisColor = "var(--text-secondary)";
  const gridColor = "var(--chart-grid)";
  const axisLineColor = "var(--chart-axis)";

  return (
    <div style={s.page}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Leaf size={22} color="#38BFA1" />
          <div>
            <h1 style={s.h1}>Campus energy monitor</h1>
            <p style={s.sub}>Live feed &middot; {zones.length} zones &middot; 15-min analytics baseline</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Connection badge */}
          <div style={s.connBadge}>
            {connected
              ? <Wifi size={14} color="#38BFA1" />
              : <WifiOff size={14} color="#E2574C" />}
            <span style={{ fontSize: 12, color: connected ? "#38BFA1" : "#E2574C" }}>
              {connected ? "Live" : "Reconnecting"}
            </span>
            {lastTs && (
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                &middot; {fmtTime(lastTs)}
              </span>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={s.themeBtn}
            aria-label="Toggle theme"
          >
            {theme === "dark"
              ? <Sun size={16} color="#E8A33D" />
              : <Moon size={16} color="#5AA9E6" />}
          </button>
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────── */}
      <div style={s.kpiRow}>
        <Kpi icon={Zap} label="14-day total" accent="#38BFA1"
          value={summary ? `${summary.total_kwh.toLocaleString()} kWh` : "…"}
          sub={summary ? `~${summary.avg_daily_kwh.toLocaleString()} kWh/day avg` : ""} />
        <Kpi icon={TrendingUp} label="Forecast peak" accent="#E8A33D"
          value={summary?.forecast_peak_hour != null ? `${summary.forecast_peak_kw} kW` : "…"}
          sub={summary?.forecast_peak_hour != null ? `at ${summary.forecast_peak_hour}:00` : ""} />
        <Kpi icon={AlertTriangle} label="Anomalies flagged" accent="#E2574C"
          value={summary ? `${summary.anomaly_count}` : "…"}
          sub="z-score > 2.5 vs baseline" />
        <Kpi icon={Activity} label="Zones monitored" accent="#5AA9E6"
          value={`${zones.length}`}
          sub="sub-metered" />
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div style={s.grid}>
        {/* Zone usage chart */}
        <Panel title="Zone usage — live">
          <div style={s.zoneBtns}>
            {zones.map((z) => (
              <button key={z.id} onClick={() => setZoneId(z.id)} style={{
                ...s.zoneBtn,
                background: zoneId === z.id ? "var(--bg-zone-active)" : "transparent",
                borderColor: zoneId === z.id ? z.color : "var(--border)",
                color: zoneId === z.id ? "var(--text-primary)" : "var(--text-secondary)",
              }}>
                {z.name}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label"
                tick={{ fill: axisColor, fontSize: 10 }} tickLine={false}
                axisLine={{ stroke: axisLineColor }}
                interval={Math.max(Math.floor(chartData.length / 6), 0)} />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }} tickLine={false}
                axisLine={{ stroke: axisLineColor }} unit=" kW" width={55} />
              <Tooltip contentStyle={s.tooltip}
                labelStyle={{ color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-secondary)" }} />
              <Area type="monotone" dataKey="kw"
                fill={zone?.color || "#38BFA1"} fillOpacity={0.12}
                stroke="none" name="Usage area" />
              <Line type="monotone" dataKey="kw"
                stroke={zone?.color || "#38BFA1"} strokeWidth={2}
                dot={false} name="Actual usage (kW)" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        {/* Side column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Anomalies by zone">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={anomalies?.by_zone || []} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <XAxis dataKey="name"
                  tick={{ fill: axisColor, fontSize: 9 }} tickLine={false}
                  axisLine={{ stroke: axisLineColor }} interval={0} />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 10 }} tickLine={false}
                  axisLine={false} width={26} allowDecimals={false} />
                <Tooltip contentStyle={s.tooltip} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(anomalies?.by_zone || []).map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Ranked interventions">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recs.map((r, i) => (
                <div key={i} style={s.recCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                      {r.title}
                    </span>
                    <span style={s.recImpact}>{r.impact}</span>
                  </div>
                  <p style={s.recDetail}>{r.detail}</p>
                  <span style={s.recTag}>{r.tag} <ChevronRight size={11} /></span>
                </div>
              ))}
              {recs.length === 0 && (
                <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>No interventions yet.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */
function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={s.kpi}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ background: `${accent}1F`, borderRadius: 7, padding: 5, display: "flex" }}>
          <Icon size={14} color={accent} />
        </div>
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <div style={s.kpiValue}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={s.panel}>
      <h3 style={s.panelTitle}>{title}</h3>
      {children}
    </div>
  );
}

/* ── Styles (using CSS vars for all theme-sensitive values) ───── */
const mono = "'IBM Plex Mono', ui-monospace, monospace";

const s = {
  page: {
    fontFamily: "'Inter', system-ui, sans-serif",
    background: "var(--bg-page)",
    color: "var(--text-primary)",
    minHeight: "100vh",
    padding: "28px 24px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 24, flexWrap: "wrap", gap: 12,
  },
  h1: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 20, fontWeight: 600, margin: 0,
    color: "var(--text-primary)",
  },
  sub: { fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" },
  connBadge: {
    display: "flex", alignItems: "center", gap: 6,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 999, padding: "6px 12px",
  },
  themeBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 36, height: 36,
    background: "var(--toggle-bg)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    cursor: "pointer",
    outline: "none",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  kpiRow: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12, marginBottom: 20,
  },
  kpi: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12, padding: "14px 16px",
  },
  kpiValue: { fontFamily: mono, fontSize: 19, fontWeight: 500, color: "var(--text-primary)" },
  grid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 },
  panel: {
    background: "var(--bg-panel)",
    border: "1px solid var(--border-panel)",
    borderRadius: 14, padding: 18,
  },
  panelTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13.5, fontWeight: 600,
    margin: "0 0 14px",
    color: "var(--text-panel-title)",
  },
  zoneBtns: { display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  zoneBtn: {
    border: "1px solid",
    borderRadius: 8, padding: "6px 12px",
    fontSize: 12.5, cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s, color 0.2s",
  },
  tooltip: {
    background: "var(--tooltip-bg)",
    border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 12,
  },
  recCard: {
    background: "var(--bg-rec)",
    border: "1px solid var(--border)",
    borderRadius: 10, padding: "10px 12px",
  },
  recImpact: { fontFamily: mono, fontSize: 11, color: "#38BFA1", whiteSpace: "nowrap" },
  recDetail: { fontSize: 11.5, color: "var(--text-secondary)", margin: "6px 0 0", lineHeight: 1.5 },
  recTag: {
    display: "inline-flex", alignItems: "center", gap: 3,
    marginTop: 8, fontSize: 10.5, color: "#5AA9E6",
    background: "var(--bg-panel)",
    border: "1px solid var(--border-panel)",
    borderRadius: 999, padding: "2px 8px",
  },
  errorWrap: {
    fontFamily: "'Inter', system-ui, sans-serif",
    background: "var(--bg-page)",
    color: "var(--text-primary)",
    minHeight: "100vh",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: 24,
  },
  code: {
    background: "var(--bg-code)",
    padding: "2px 6px", borderRadius: 4,
    fontFamily: mono, fontSize: 12,
  },
};
