import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import {
  Activity, AlertTriangle, TrendingUp, Zap, Leaf, ChevronRight,
  WifiOff, Sun, Moon, LogOut, Bell, BarChart2, Sparkles, Menu, X,
} from "lucide-react";
import {
  fetchZones, fetchHistory, fetchSummary, fetchAnomalies,
  fetchRecommendations, connectLive,
} from "./api";
import { SignIn, SignUp } from "./AuthPages";
import AnalyticsTab from "./AnalyticsTab";
import AlertsTab from "./AlertsTab";

/* ── helpers ──────────────────────────────────────────────── */
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
function getInitialUser() {
  try { return JSON.parse(localStorage.getItem("sem-user")); } catch { return null; }
}

/* ── useWindowSize hook ───────────────────────────────────── */
function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

/* ── Greeting helper ──────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── KPI Card ─────────────────────────────────────────────── */
function Kpi({ icon: Icon, label, value, sub, accent, delay = 0 }) {
  return (
    <div className="kpi-card" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `${accent}18`, border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={15} color={accent} />
        </div>
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.3 }}>
          {label}
        </span>
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4,
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: accent, flexShrink: 0 }} />
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Panel wrapper ────────────────────────────────────────── */
function Panel({ title, children, icon: Icon, accent, delay = 0 }) {
  return (
    <div className="panel" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {Icon && (
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: `${accent || "#39D98A"}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={12} color={accent || "#39D98A"} />
          </div>
        )}
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13.5, fontWeight: 600, margin: 0, color: "var(--text-panel-title)",
        }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── Custom chart tooltip ─────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--tooltip-bg)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)", fontSize: 12,
    }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 4, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--text-primary)", fontWeight: 600 }}>
          {p.value?.toFixed(2)} kW
        </p>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MOBILE DRAWER
══════════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "alerts",    label: "Alerts",    icon: AlertTriangle },
];

function MobileDrawer({ open, onClose, activeNav, setActiveNav, user, theme, toggleTheme, onLogout }) {
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  // Close on ESC
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div className="mobile-menu-backdrop open" onClick={onClose} />

      {/* Drawer */}
      <nav className="mobile-drawer">
        {/* Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #39D98A, #22D3EE)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={16} color="#080C10" fill="#080C10" />
            </div>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
            }}>EnergyIQ</span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", display: "flex",
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        {NAV_ITEMS.map(({ id, label, icon: NavIcon }) => (
          <button
            key={id}
            className={`mobile-nav-item ${activeNav === id ? "active" : ""}`}
            onClick={() => { setActiveNav(id); onClose(); }}
          >
            <NavIcon size={16} />
            {label}
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom actions */}
        <div style={{
          borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 12,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {/* User info */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px",
            background: "var(--bg-panel)", borderRadius: 10,
            border: "1px solid var(--border)",
          }}>
            <div className="user-avatar" style={{ flexShrink: 0 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {user?.name ?? "User"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.email ?? ""}</div>
            </div>
          </div>

          {/* Theme + logout row */}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="theme-btn" onClick={toggleTheme} style={{ flex: 1, width: "auto", height: 40, borderRadius: 10 }} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={15} color="#F0B429" /> : <Moon size={15} color="#58A6FF" />}
            </button>
            <button className="logout-btn" onClick={onLogout} style={{ flex: 3, justifyContent: "center" }}>
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
function Dashboard({ user, theme, toggleTheme, onLogout }) {
  const width = useWindowSize();
  const isMobile  = width <= 768;
  const isTablet  = width <= 1024;

  const [zones, setZones]       = useState([]);
  const [zoneId, setZoneId]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [recs, setRecs]         = useState([]);
  const [connected, setConnected] = useState(false);
  const [lastTs, setLastTs]     = useState(null);
  const [error, setError]       = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const zoneIdRef = useRef(null);
  zoneIdRef.current = zoneId;
  const zone = zones.find((z) => z.id === zoneId);

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

  useEffect(() => {
    if (!zoneId) return;
    fetchHistory(zoneId, 48).then(setHistory).catch(() => {});
  }, [zoneId]);

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
      ws.onopen  = () => setConnected(true);
      ws.onclose = () => { setConnected(false); retry = setTimeout(open, 2000); };
    };
    open();
    return () => { clearTimeout(retry); if (ws) { ws.onclose = null; ws.close(); } };
  }, [handleReading]);

  const chartData = useMemo(
    () => history.map((h) => ({ label: fmtTime(h.ts), kw: h.kw })),
    [history]
  );

  const axisColor     = "var(--text-secondary)";
  const gridColor     = "var(--chart-grid)";
  const axisLineColor = "var(--chart-axis)";
  const chartHeight   = isMobile ? 210 : 280;
  const barHeight     = isMobile ? 130 : 150;

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  /* Error state */
  if (error) {
    return (
      <div style={{
        background: "var(--bg-page)", color: "var(--text-primary)", minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: 24,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, animation: "float 3s ease-in-out infinite",
        }}>
          <WifiOff size={28} color="#FF6B6B" />
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: 10 }}>Connection Error</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 400, lineHeight: 1.7 }}>{error}</p>
        <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 10 }}>
          Run:{" "}
          <code style={{
            background: "var(--bg-card)", padding: "2px 8px", borderRadius: 6,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
          }}>uvicorn app.main:app --reload</code>
        </p>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "var(--bg-page)", color: "var(--text-primary)", minHeight: "100vh",
    }}>
      {/* ── Mobile Drawer ─────────────────────────────────── */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
      />

      {/* ── Sticky Header ─────────────────────────────────── */}
      <header className="main-header">
        <div className="header-left">
          {/* Hamburger — mobile only */}
          {isMobile && (
            <button className="hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          )}

          {/* Logo */}
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "linear-gradient(135deg, #39D98A, #22D3EE)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Zap size={17} color="#080C10" fill="#080C10" />
          </div>

          {/* Brand text */}
          <div className={isMobile ? "" : ""}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1,
            }}>EnergyIQ</div>
            {!isMobile && (
              <div className="header-logo-text" style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                Campus Monitor · {zones.length} zones
              </div>
            )}
          </div>

          {/* Nav pills — tablet/desktop only */}
          {!isMobile && (
            <nav className="nav-pills" style={{ marginLeft: isMobile ? 0 : 16 }}>
              {NAV_ITEMS.map(({ id, label, icon: NavIcon }) => (
                <button
                  key={id}
                  className="nav-pill"
                  onClick={() => setActiveNav(id)}
                  style={{
                    background: activeNav === id
                      ? "linear-gradient(135deg, rgba(57,217,138,0.15), rgba(34,211,238,0.1))"
                      : "transparent",
                    border: activeNav === id ? "1px solid rgba(57,217,138,0.3)" : "1px solid transparent",
                    color: activeNav === id ? "#39D98A" : "var(--text-secondary)",
                    position: "relative",
                  }}
                >
                  <NavIcon size={13} />
                  {!isTablet && <span className="nav-label">{label}</span>}
                  {/* anomaly badge on Alerts pill */}
                  {id === "alerts" && (summary?.anomaly_count ?? 0) > 0 && (
                    <span style={{
                      position:"absolute", top:-4, right:-4,
                      minWidth:16, height:16, borderRadius:99,
                      background:"#FF6B6B", color:"#fff",
                      fontSize:9, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      padding:"0 3px", border:"1.5px solid var(--bg-page)",
                    }}>{summary.anomaly_count > 99 ? "99+" : summary.anomaly_count}</span>
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="header-right">
          {/* Live badge */}
          <div className={`conn-badge ${connected ? "live" : ""}`}>
            {connected
              ? <><div className="live-dot" /><span style={{ color: "#39D98A", fontWeight: 500 }}>Live</span></>
              : <><div className="offline-dot" /><span style={{ color: "#FF6B6B" }}>Off</span></>}
            {lastTs && !isMobile && (
              <span className="conn-ts" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                · {fmtTime(lastTs)}
              </span>
            )}
          </div>

          {/* Notification bell */}
          <button
            className="notif-btn"
            aria-label="Notifications"
          >
            <Bell size={15} color="var(--text-secondary)" />
            {(summary?.anomaly_count ?? 0) > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                width: 7, height: 7, borderRadius: "50%",
                background: "#FF6B6B", border: "1.5px solid var(--bg-page)",
                animation: "pulse-dot 2s ease infinite",
              }} />
            )}
          </button>

          {/* Theme toggle */}
          <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={15} color="#F0B429" /> : <Moon size={15} color="#58A6FF" />}
          </button>

          {/* Avatar — desktop only */}
          {!isMobile && (
            <div className="user-avatar" title={user?.name}>{initials}</div>
          )}

          {/* Logout — desktop only */}
          {!isMobile && (
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={13} />
              <span className="logout-label">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Page body ─────────────────────────────────────── */}
      <div className="page-container">

        {/* ── Tab content switch ─────────────────────── */}
        {activeNav === "analytics" && (
          <>
            <div style={{ marginBottom:20 }}>
              <h2 style={{
                fontFamily:"'Space Grotesk',sans-serif", fontSize: isMobile ? 18 : 22,
                fontWeight:700, color:"var(--text-primary)", margin:"0 0 4px",
              }}>Analytics</h2>
              <p style={{ fontSize:13, color:"var(--text-muted)" }}>
                Patterns, baselines, and load curves — the investigative view.
              </p>
            </div>
            <AnalyticsTab isMobile={isMobile} />
          </>
        )}
        {activeNav === "alerts" && (
          <>
            <div style={{ marginBottom:20 }}>
              <h2 style={{
                fontFamily:"'Space Grotesk',sans-serif", fontSize: isMobile ? 18 : 22,
                fontWeight:700, color:"var(--text-primary)", margin:"0 0 4px",
              }}>Alerts</h2>
              <p style={{ fontSize:13, color:"var(--text-muted)" }}>
                Individual anomaly events — prioritised and actionable.
              </p>
            </div>
            <AlertsTab isMobile={isMobile} />
          </>
        )}

        {/* ── Dashboard tab content ──────────────────── */}
        {activeNav === "dashboard" && (<>
        {/* Welcome strip */}
        <div className="welcome-strip">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ animation: "float 3s ease-in-out infinite" }}>
              <Sparkles size={16} color="#39D98A" />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600, fontSize: isMobile ? 13.5 : 15,
              }}>
                {getGreeting()}, {user?.name?.split(" ")[0] ?? "Admin"} 👋
              </span>
              {!isMobile && (
                <span style={{ marginLeft: 12, fontSize: 12.5, color: "var(--text-secondary)" }}>
                  Your campus is running{" "}
                  <span style={{ color: "#39D98A", fontWeight: 500 }}>efficiently today</span>.
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", flexShrink: 0 }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: isMobile ? "short" : "long",
              month: "short", day: "numeric",
            })}
          </div>
        </div>

        {/* ── KPI row ───────────────────────────────────── */}
        <div className="kpi-row">
          <Kpi icon={Zap} label="14-day total" accent="#39D98A" delay={0}
            value={summary ? `${summary.total_kwh.toLocaleString()} kWh` : "—"}
            sub={summary ? `~${summary.avg_daily_kwh.toLocaleString()} kWh/day` : ""} />
          <Kpi icon={TrendingUp} label="Forecast peak" accent="#F0B429" delay={80}
            value={summary?.forecast_peak_hour != null ? `${summary.forecast_peak_kw} kW` : "—"}
            sub={summary?.forecast_peak_hour != null ? `at ${summary.forecast_peak_hour}:00` : ""} />
          <Kpi icon={AlertTriangle} label="Anomalies" accent="#FF6B6B" delay={160}
            value={summary ? `${summary.anomaly_count}` : "—"}
            sub="z-score > 2.5" />
          <Kpi icon={Activity} label="Zones" accent="#58A6FF" delay={240}
            value={`${zones.length}`}
            sub="sub-metered live" />
        </div>

        {/* ── Main grid ─────────────────────────────────── */}
        <div className="main-grid">

          {/* Zone usage chart */}
          <Panel title="Zone usage — live" icon={BarChart2} accent="#39D98A" delay={0}>
            {/* Zone selector */}
            <div style={{
              display: "flex", gap: 7, marginBottom: 14,
              flexWrap: "wrap", overflowX: isMobile ? "auto" : "visible",
              paddingBottom: isMobile ? 2 : 0,
            }}>
              {zones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => setZoneId(z.id)}
                  className="zone-btn"
                  style={{
                    background: zoneId === z.id ? `${z.color}18` : "transparent",
                    borderColor: zoneId === z.id ? z.color : "var(--border)",
                    color: zoneId === z.id ? z.color : "var(--text-secondary)",
                    boxShadow: zoneId === z.id ? `0 0 10px ${z.color}25` : "none",
                    flexShrink: 0,
                  }}
                >
                  {z.name}
                </button>
              ))}
            </div>

            {/* Chart */}
            {chartData.length === 0 ? (
              <div className="skeleton" style={{ width: "100%", height: chartHeight }} />
            ) : (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 8, left: isMobile ? -20 : -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={zone?.color || "#39D98A"} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={zone?.color || "#39D98A"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label"
                    tick={{ fill: axisColor, fontSize: isMobile ? 9 : 10 }} tickLine={false}
                    axisLine={{ stroke: axisLineColor }}
                    interval={Math.max(Math.floor(chartData.length / (isMobile ? 4 : 6)), 0)} />
                  <YAxis
                    tick={{ fill: axisColor, fontSize: isMobile ? 9 : 11 }} tickLine={false}
                    axisLine={{ stroke: axisLineColor }} unit=" kW"
                    width={isMobile ? 44 : 55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="kw" fill="url(#areaGrad)" stroke="none" />
                  <Line type="monotone" dataKey="kw"
                    stroke={zone?.color || "#39D98A"} strokeWidth={2.5}
                    dot={false} name="Actual usage (kW)" isAnimationActive />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Panel>

          {/* Side column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Anomalies chart */}
            <Panel title="Anomalies by zone" icon={AlertTriangle} accent="#FF6B6B" delay={100}>
              {!anomalies ? (
                <div className="skeleton" style={{ height: barHeight }} />
              ) : (
                <ResponsiveContainer width="100%" height={barHeight}>
                  <BarChart data={anomalies?.by_zone || []} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                    <XAxis dataKey="name"
                      tick={{ fill: axisColor, fontSize: isMobile ? 8 : 9 }} tickLine={false}
                      axisLine={{ stroke: axisLineColor }} interval={0} />
                    <YAxis
                      tick={{ fill: axisColor, fontSize: isMobile ? 9 : 10 }} tickLine={false}
                      axisLine={false} width={26} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={32}>
                      {(anomalies?.by_zone || []).map((e, i) => (
                        <Cell key={i} fill={e.color} fillOpacity={0.85}
                          style={{ filter: `drop-shadow(0 2px 6px ${e.color}40)` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            {/* Recommendations */}
            <Panel title="Smart interventions" icon={Sparkles} accent="#A78BFA" delay={200}>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {recs.map((r, i) => (
                  <div key={i} className="rec-card" style={{ animationDelay: `${i * 80}ms` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                        {r.title}
                      </span>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#39D98A",
                        whiteSpace: "nowrap", background: "rgba(57,217,138,0.08)",
                        border: "1px solid rgba(57,217,138,0.2)", borderRadius: 6, padding: "2px 6px",
                        flexShrink: 0,
                      }}>{r.impact}</span>
                    </div>
                    <p style={{
                      fontSize: 11, color: "var(--text-secondary)", margin: "5px 0 7px", lineHeight: 1.55,
                    }}>{r.detail}</p>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      fontSize: 10, color: "#58A6FF",
                      background: "rgba(88,166,255,0.06)", border: "1px solid rgba(88,166,255,0.2)",
                      borderRadius: 999, padding: "2px 8px",
                    }}>
                      {r.tag} <ChevronRight size={9} />
                    </span>
                  </div>
                ))}
                {recs.length === 0 && (
                  <p style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: "14px 0" }}>
                    No interventions detected
                  </p>
                )}
              </div>
            </Panel>
          </div>
        </div>

        </>)}

        {/* ── Footer ────────────────────────────────────── */}
        <div className="dash-footer">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
            <Leaf size={12} color="#39D98A" />
            <span>EnergyIQ Campus Monitor © 2025</span>
          </div>
          {!isMobile && (
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              FastAPI · React · WebSockets
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════════ */
export default function App() {
  const [theme, setTheme]     = useState(getInitialTheme);
  const [user, setUser]       = useState(getInitialUser);
  const [authPage, setAuthPage] = useState("signin");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.background = "var(--bg-page)";
    document.body.style.background = "var(--bg-page)";
    localStorage.setItem("sem-theme", theme);
  }, [theme]);

  const toggleTheme  = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const handleSignIn = (u) => { localStorage.setItem("sem-user", JSON.stringify(u)); setUser(u); };
  const handleSignUp = (u) => { localStorage.setItem("sem-user", JSON.stringify(u)); setUser(u); };
  const handleLogout = () => { localStorage.removeItem("sem-user"); setUser(null); setAuthPage("signin"); };

  if (!user) {
    return authPage === "signup"
      ? <SignUp onSignUp={handleSignUp} onGoSignIn={() => setAuthPage("signin")} />
      : <SignIn onSignIn={handleSignIn} onGoSignUp={() => setAuthPage("signup")} />;
  }
  return (
    <Dashboard
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
    />
  );
}
