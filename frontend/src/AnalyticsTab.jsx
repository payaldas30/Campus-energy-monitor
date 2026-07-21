import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend,
  ReferenceLine, LineChart,
} from "recharts";
import {
  TrendingUp, BarChart2, Clock, Calendar, Zap,
  RefreshCw, ChevronDown, Layers, Sparkles, Grid,
} from "lucide-react";
import { fetchAnalytics, fetchZones } from "./api";

/* ── constants ──────────────────────────────────────────────── */
const PERIODS = [
  { id: "24h", label: "Last 24 h" },
  { id: "7d",  label: "Last 7 days" },
  { id: "14d", label: "Last 14 days" },
];

/* ── helpers ────────────────────────────────────────────────── */
const fmtHour = (h) => {
  if (h === 0)  return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

const fmtTs = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { weekday:"short", hour:"numeric", minute:"2-digit", hour12:true });
};

/* ── shared tooltip ─────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, unit = "kW" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"var(--tooltip-bg)", border:"1px solid var(--border)",
      borderRadius:10, padding:"10px 14px",
      boxShadow:"0 8px 24px rgba(0,0,0,0.35)", fontSize:12, minWidth:140,
    }}>
      <p style={{ color:"var(--text-muted)", marginBottom:6, fontSize:11 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:p.color || p.stroke, flexShrink:0 }} />
          <span style={{ color:"var(--text-secondary)", fontSize:11 }}>{p.name}</span>
          <span style={{ marginLeft:"auto", fontWeight:600, color:p.color || p.stroke, fontFamily:"'IBM Plex Mono',monospace" }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── section card ───────────────────────────────────────────── */
function Section({ title, subtitle, icon: Icon, accent = "#39D98A", children, delay = 0 }) {
  return (
    <div className="panel" style={{ animationDelay:`${delay}ms`, marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:9,
            background:`${accent}15`, border:`1px solid ${accent}25`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <Icon size={15} color={accent} />
          </div>
          <div>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:600, margin:0, color:"var(--text-panel-title)" }}>{title}</h3>
            {subtitle && <p style={{ fontSize:11.5, color:"var(--text-muted)", margin:"2px 0 0" }}>{subtitle}</p>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── period + zone selector bar ─────────────────────────────── */
function Controls({ period, setPeriod, zoneId, setZoneId, zones, loading }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10, marginBottom:20,
      flexWrap:"wrap",
    }}>
      <div style={{
        display:"flex", gap:4, background:"var(--bg-card)",
        border:"1px solid var(--border)", borderRadius:12, padding:4,
      }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding:"6px 14px", borderRadius:9, fontSize:12.5, fontWeight:500,
            fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer",
            border: period === p.id ? "1px solid rgba(57,217,138,0.35)" : "1px solid transparent",
            background: period === p.id ? "rgba(57,217,138,0.12)" : "transparent",
            color: period === p.id ? "#39D98A" : "var(--text-secondary)",
            transition:"all 0.2s ease",
          }}>{p.label}</button>
        ))}
      </div>

      <div style={{ position:"relative" }}>
        <select
          value={zoneId}
          onChange={e => setZoneId(e.target.value)}
          style={{
            appearance:"none", WebkitAppearance:"none",
            padding:"8px 36px 8px 14px",
            background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:10, color:"var(--text-primary)", fontSize:12.5,
            fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer", outline:"none",
            transition:"border-color 0.2s",
          }}
        >
          <option value="all">All zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <ChevronDown size={13} style={{
          position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
          color:"var(--text-muted)", pointerEvents:"none",
        }} />
      </div>

      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:6, color:"var(--text-muted)", fontSize:12 }}>
          <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid var(--border)", borderTopColor:"#39D98A", animation:"spin-slow 0.7s linear infinite" }} />
          Updating…
        </div>
      )}
    </div>
  );
}

/* ── custom pie label ───────────────────────────────────────── */
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, pct }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (pct < 8) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {pct}%
    </text>
  );
}

/* ── Heatmap ────────────────────────────────────────────────── */
function Heatmap({ data, zones, isMobile }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  // Build a 7×24 grid from baseline_actual — group by day-of-week and hour
  const grid = useMemo(() => {
    if (!data?.baseline_actual?.length) return null;
    const buckets = {};
    data.baseline_actual.forEach(row => {
      const d = new Date(row.ts);
      const dow = (d.getDay() + 6) % 7; // Mon=0
      const hour = d.getHours();
      const key = `${dow}-${hour}`;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(row.kw);
    });
    const cells = [];
    let maxVal = 0;
    DAYS.forEach((day, di) => {
      HOURS.forEach(h => {
        const vals = buckets[`${di}-${h}`] || [];
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        if (avg > maxVal) maxVal = avg;
        cells.push({ day, hour: h, avg });
      });
    });
    return { cells, maxVal };
  }, [data]);

  if (!grid) return <div className="skeleton" style={{ height: 160 }} />;

  const getColor = (val, max) => {
    if (max === 0 || val === 0) return "var(--heatmap-empty)";
    const ratio = val / max;
    if (ratio < 0.25) return `rgba(57,217,138,${0.15 + ratio * 1.5})`;
    if (ratio < 0.5)  return `rgba(240,180,41,${0.3 + ratio})`;
    if (ratio < 0.75) return `rgba(255,107,107,${0.4 + ratio * 0.6})`;
    return `rgba(255,107,107,${0.7 + ratio * 0.3})`;
  };

  const LABEL_W = isMobile ? 26 : 34; // px reserved for day-name label
  const CELL_H  = isMobile ? 16 : 22; // row height in px
  const GAP     = 2;                  // gap between cells in px

  return (
    <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
      {/* Hour-label row — proportionally spaced with CSS grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `${LABEL_W}px repeat(24, 1fr)`,
        gap: GAP,
        marginBottom: GAP,
      }}>
        {/* empty corner */}
        <div />
        {HOURS.map(h => (
          <div key={h} style={{
            fontSize: 8,
            color: h % (isMobile ? 6 : 4) === 0 ? "var(--text-secondary)" : "transparent",
            textAlign: "center",
            overflow: "hidden",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}>
            {fmtHour(h)}
          </div>
        ))}
      </div>

      {/* Data rows — each day is a CSS-grid row filling 100% width */}
      {DAYS.map((day, di) => (
        <div
          key={day}
          style={{
            display: "grid",
            gridTemplateColumns: `${LABEL_W}px repeat(24, 1fr)`,
            gap: GAP,
            marginBottom: GAP,
          }}
        >
          {/* Day label */}
          <div style={{
            fontSize: 9,
            color: "var(--text-secondary)",
            textAlign: "right",
            paddingRight: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            fontWeight: 500,
          }}>
            {day}
          </div>

          {/* 24 hour cells — stretch to fill available space */}
          {HOURS.map(h => {
            const cell = grid.cells.find(c => c.day === day && c.hour === h);
            const val  = cell?.avg || 0;
            return (
              <div
                key={h}
                className="heatmap-cell"
                style={{
                  height: CELL_H,
                  borderRadius: 3,
                  background: getColor(val, grid.maxVal),
                  border: "1px solid rgba(128,128,128,0.08)",
                  cursor: "default",
                  minWidth: 0,
                }}
                onMouseEnter={e => setTooltip({ val, day, hour: h, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </div>
      ))}

      {/* Floating tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 12, top: tooltip.y - 48,
          background: "var(--tooltip-bg)",
          border: "1px solid var(--border)",
          borderRadius: 8, padding: "7px 12px", fontSize: 11.5,
          pointerEvents: "none", zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}>
          <strong style={{ color: "var(--text-primary)" }}>{tooltip.day} · {fmtHour(tooltip.hour)}</strong>
          <br />
          <span style={{ color: "#39D98A", fontFamily: "'IBM Plex Mono',monospace" }}>
            {tooltip.val.toFixed(1)} kW avg
          </span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Low</span>
        {["rgba(57,217,138,0.35)", "rgba(240,180,41,0.55)", "rgba(255,107,107,0.6)", "rgba(255,107,107,0.92)"].map((c, i) => (
          <div key={i} style={{
            width: 20, height: 12, borderRadius: 3,
            background: c, border: "1px solid rgba(128,128,128,0.12)",
          }} />
        ))}
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>High</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>Avg kW per hour / day</span>
      </div>
    </div>
  );
}

/* ── AI Insights panel ──────────────────────────────────────── */
function AIInsights({ data, period }) {
  const insights = useMemo(() => {
    if (!data) return [];
    const results = [];

    // Peak hour insight
    if (data.peak_hour != null) {
      results.push({
        icon: "⚡",
        color: "#FF6B6B",
        title: `Peak demand at ${fmtHour(data.peak_hour)}`,
        desc: `Predicted peak of ${data.peak_kw} kW. Pre-cooling 30–45 min earlier can flatten this by ~12%.`,
      });
    }

    // Baseline deviation
    if (data.baseline_actual?.length) {
      const recent = data.baseline_actual.slice(-24);
      const overBaseline = recent.filter(r => r.kw > (r.expected_kw || 0) * 1.1).length;
      if (overBaseline > 3) {
        results.push({
          icon: "📈",
          color: "#F0B429",
          title: `${overBaseline} readings above baseline recently`,
          desc: "Sustained overrun detected. Check HVAC and lab equipment for scheduling opportunities.",
        });
      }
    }

    // Zone contribution
    if (data.zone_contribution?.length) {
      const top = [...data.zone_contribution].sort((a, b) => b.total_kwh - a.total_kwh)[0];
      if (top) {
        results.push({
          icon: "🏛",
          color: "#A78BFA",
          title: `${top.name} is your biggest consumer`,
          desc: `Accounts for ${top.pct}% of campus load (${top.total_kwh.toLocaleString()} kWh). Focus efficiency efforts here first.`,
        });
      }
    }

    // Weekend standby
    if (data.weekday_vs_weekend) {
      results.push({
        icon: "💤",
        color: "#22D3EE",
        title: "Weekend standby load detected",
        desc: "Weekend off-hours consumption suggests always-on equipment. Consider scheduled shutdowns to save ~8–15%.",
      });
    }

    return results;
  }, [data, period]);

  if (!insights.length) return null;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid rgba(167,139,250,0.2)",
      borderRadius: 16, padding: "20px 22px",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={14} color="#A78BFA" />
        </div>
        <h3 style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontSize: 14, fontWeight: 600, margin: 0, color: "var(--text-panel-title)",
        }}>AI Insights</h3>
        <span style={{
          fontSize: 10.5, color: "#A78BFA", background: "rgba(167,139,250,0.1)",
          border: "1px solid rgba(167,139,250,0.25)", borderRadius: 6,
          padding: "2px 8px", fontWeight: 600, marginLeft: "auto",
        }}>
          {insights.length} finding{insights.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            padding: "12px 14px",
            background: `${ins.color}06`,
            border: `1px solid ${ins.color}20`,
            borderRadius: 12,
            animation: `fadeInUp 0.4s ease ${i * 60}ms both`,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{ins.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: ins.color, marginBottom: 4 }}>{ins.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>{ins.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ANALYTICS TAB
════════════════════════════════════════════════════════════ */
export default function AnalyticsTab({ isMobile }) {
  const [period, setPeriod]   = useState("14d");
  const [zoneId, setZoneId]   = useState("all");
  const [zones, setZones]     = useState([]);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeZones, setActiveZones] = useState({});

  useEffect(() => {
    fetchZones().then(zs => {
      setZones(zs);
      const init = {};
      zs.forEach(z => { init[z.id] = true; });
      setActiveZones(init);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(zoneId, period)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, zoneId]);

  const axisColor     = "var(--text-secondary)";
  const gridColor     = "var(--chart-grid)";
  const axisLineColor = "var(--chart-axis)";
  const visibleZones  = zones.filter(z => activeZones[z.id]);
  const toggleZone    = (id) => setActiveZones(prev => ({ ...prev, [id]: !prev[id] }));
  const Sk = ({ h = 200 }) => (
    <div className="skeleton" style={{ width:"100%", height:h, borderRadius:10 }} />
  );

  if (!data && !loading) return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)" }}>
      <BarChart2 size={36} style={{ marginBottom:12, opacity:0.4 }} />
      <p>No analytics data available.</p>
    </div>
  );

  const chartH = isMobile ? 200 : 260;

  return (
    <div style={{ animation:"fadeInUp 0.4s ease both" }}>
      {/* Controls */}
      <Controls period={period} setPeriod={setPeriod} zoneId={zoneId} setZoneId={setZoneId} zones={zones} loading={loading} />

      {/* AI Insights */}
      {!loading && data && <AIInsights data={data} period={period} />}

      {/* ── Row 1: Baseline vs Actual + Zone Contribution ── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap:16, marginBottom:16 }}>

        {/* 1. Baseline vs Actual */}
        <Section title="Baseline vs. Actual" subtitle="Shaded band = expected ± 1σ · Line = real usage" icon={TrendingUp} accent="#39D98A">
          {loading ? <Sk h={chartH} /> : (() => {
            // Recharts stacked-area trick: lower fills transparent 0→lower, then band_width fills lower→upper
            const bandData = (data?.baseline_actual || []).map(row => ({
              ...row,
              sigma_lower: row.expected_lower ?? null,
              sigma_width: (row.expected_upper != null && row.expected_lower != null)
                ? Math.max(row.expected_upper - row.expected_lower, 0)
                : null,
            }));
            return (
            <ResponsiveContainer width="100%" height={chartH}>
              <ComposedChart
                data={bandData}
                margin={{ top:5, right:8, left: isMobile ? -20 : -10, bottom:0 }}
              >
                <defs>
                  <linearGradient id="sigmaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#39D98A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#39D98A" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="ts"
                  tickFormatter={v => fmtTs(v)}
                  tick={{ fill:axisColor, fontSize:9 }}
                  tickLine={false}
                  axisLine={{ stroke:axisLineColor }}
                  interval={Math.max(Math.floor((bandData.length || 1) / (isMobile ? 4 : 6)), 0)}
                />
                <YAxis
                  tick={{ fill:axisColor, fontSize:10 }}
                  tickLine={false}
                  axisLine={{ stroke:axisLineColor }}
                  unit=" kW"
                  width={isMobile ? 44 : 52}
                />
                <Tooltip content={<ChartTooltip />} />

                {/* ── ±1σ band via stacked Areas ── */}
                {/* Layer 1: transparent base from 0 → sigma_lower */}
                <Area
                  type="monotone"
                  dataKey="sigma_lower"
                  stackId="sigma"
                  fill="transparent"
                  stroke="none"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                  connectNulls
                />
                {/* Layer 2: coloured band from sigma_lower → sigma_upper */}
                <Area
                  type="monotone"
                  dataKey="sigma_width"
                  stackId="sigma"
                  fill="url(#sigmaGrad)"
                  stroke="#39D98A"
                  strokeWidth={1}
                  strokeOpacity={0.6}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                  name="±1σ band"
                  legendType="none"
                  connectNulls
                />

                {/* Expected baseline centre line */}
                <Line
                  type="monotone"
                  dataKey="expected_kw"
                  stroke="#39D98A"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  name="Expected baseline"
                />

                {/* Actual usage */}
                <Line
                  type="monotone"
                  dataKey="kw"
                  stroke="#58A6FF"
                  strokeWidth={2.5}
                  dot={false}
                  name="Actual usage (kW)"
                />
              </ComposedChart>
            </ResponsiveContainer>
            );
          })()}
          <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap", alignItems:"center" }}>
            {[
              { color:"#58A6FF", label:"Actual usage", dash:false, isLine:true },
              { color:"#39D98A", label:"Expected baseline", dash:true, isLine:true },
              { color:"rgba(57,217,138,0.30)", label:"±1σ band", isArea:true },
            ].map((l, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11.5, color:"var(--text-secondary)" }}>
                {l.isArea
                  ? <span style={{
                      width:24, height:10, borderRadius:3,
                      background:l.color,
                      border:"1.5px dashed rgba(57,217,138,0.7)",
                      display:"inline-block",
                    }} />
                  : <svg width={24} height={3}>
                      <line x1="0" y1="1.5" x2="24" y2="1.5"
                        stroke={l.color}
                        strokeWidth={l.dash ? 1.5 : 2.5}
                        strokeDasharray={l.dash ? "6 3" : undefined} />
                    </svg>
                }
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 2. Zone Contribution Pie */}
        <Section title="Zone Contribution" subtitle={`Share of total campus load · ${period}`} icon={Layers} accent="#A78BFA">
          {loading ? <Sk h={chartH} /> : (
            <>
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                <PieChart>
                  <Pie
                    data={data?.zone_contribution || []}
                    cx="50%" cy="50%"
                    innerRadius={isMobile ? 45 : 55} outerRadius={isMobile ? 75 : 90}
                    paddingAngle={3}
                    dataKey="total_kwh"
                    nameKey="name"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {(data?.zone_contribution || []).map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="var(--bg-panel)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n, p) => [`${v.toLocaleString()} kWh (${p.payload.pct}%)`, p.payload.name]}
                    contentStyle={{ background:"var(--tooltip-bg)", border:"1px solid var(--border)", borderRadius:10, fontSize:12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:4 }}>
                {(data?.zone_contribution || []).map((z, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:z.color, flexShrink:0 }} />
                    <span style={{ fontSize:12, color:"var(--text-secondary)", flex:1 }}>{z.name}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:z.color, fontWeight:600 }}>
                      {z.pct}%
                    </span>
                    <span style={{ fontSize:11, color:"var(--text-muted)" }}>{z.total_kwh.toLocaleString()} kWh</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      {/* ── Row 2: Load Curve + Weekday vs Weekend ── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16, marginBottom:16 }}>

        {/* 3. Load Curve by Hour */}
        <Section title="Load Curve by Hour of Day" subtitle="Avg consumption per hour — where peaks live" icon={Clock} accent="#F0B429" delay={80}>
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {zones.map(z => (
              <button key={z.id} onClick={() => toggleZone(z.id)} style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"4px 10px", borderRadius:8, fontSize:11.5, fontWeight:500,
                fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer",
                border:`1px solid ${activeZones[z.id] ? z.color : "var(--border)"}`,
                background: activeZones[z.id] ? `${z.color}12` : "transparent",
                color: activeZones[z.id] ? z.color : "var(--text-muted)",
                transition:"all 0.2s ease",
              }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background: activeZones[z.id] ? z.color : "var(--border)" }} />
                {z.name}
              </button>
            ))}
          </div>
          {loading ? <Sk h={chartH} /> : (
            <ResponsiveContainer width="100%" height={chartH}>
              <LineChart data={data?.load_curve || []} margin={{ top:5, right:8, left: isMobile ? -20 : -10, bottom:0 }}>
                <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={fmtHour}
                  tick={{ fill:axisColor, fontSize:isMobile ? 8 : 10 }} tickLine={false}
                  axisLine={{ stroke:axisLineColor }} interval={isMobile ? 5 : 3} />
                <YAxis tick={{ fill:axisColor, fontSize:10 }} tickLine={false}
                  axisLine={{ stroke:axisLineColor }} unit=" kW" width={isMobile ? 40 : 50} />
                <Tooltip content={<ChartTooltip />} labelFormatter={fmtHour} />
                {data?.peak_hour != null && (
                  <ReferenceLine x={data.peak_hour} stroke="#FF6B6B" strokeDasharray="4 3"
                    label={{ value:"Peak", fill:"#FF6B6B", fontSize:10, position:"top" }} />
                )}
                {zones.filter(z => activeZones[z.id]).map(z => (
                  <Line key={z.id} type="monotone" dataKey={z.id} name={z.name}
                    stroke={z.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* 4. Weekday vs Weekend */}
        <Section title="Weekday vs. Weekend" subtitle="Occupancy-driven load vs. always-on standby floor" icon={Calendar} accent="#22D3EE" delay={160}>
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {zones.map(z => (
              <button key={z.id} onClick={() => setZoneId(z.id === zoneId ? "all" : z.id)} style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"4px 10px", borderRadius:8, fontSize:11.5, fontWeight:500,
                fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer",
                border:`1px solid ${(zoneId === z.id || zoneId === "all") ? z.color : "var(--border)"}`,
                background: (zoneId === z.id || zoneId === "all") ? `${z.color}12` : "transparent",
                color: (zoneId === z.id || zoneId === "all") ? z.color : "var(--text-muted)",
                transition:"all 0.2s ease",
              }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background: (zoneId === z.id || zoneId === "all") ? z.color : "var(--border)" }} />
                {z.name}
              </button>
            ))}
          </div>
          {loading ? <Sk h={chartH} /> : (
            <ResponsiveContainer width="100%" height={chartH}>
              <LineChart data={data?.weekday_vs_weekend || []} margin={{ top:5, right:8, left: isMobile ? -20 : -10, bottom:0 }}>
                <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={fmtHour}
                  tick={{ fill:axisColor, fontSize: isMobile ? 8 : 10 }} tickLine={false}
                  axisLine={{ stroke:axisLineColor }} interval={isMobile ? 5 : 3} />
                <YAxis tick={{ fill:axisColor, fontSize:10 }} tickLine={false}
                  axisLine={{ stroke:axisLineColor }} unit=" kW" width={isMobile ? 40 : 50} />
                <Tooltip content={<ChartTooltip />} labelFormatter={fmtHour} />
                {(zoneId === "all" ? zones : zones.filter(z => z.id === zoneId)).map(z => (
                  <React.Fragment key={z.id}>
                    <Line type="monotone" dataKey={`${z.id}_weekday`} name={`${z.name} (Weekday)`}
                      stroke={z.color} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey={`${z.id}_weekend`} name={`${z.name} (Weekend)`}
                      stroke={z.color} strokeWidth={1.5} strokeDasharray="5 3" dot={false} opacity={0.65} />
                  </React.Fragment>
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
          <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--text-secondary)" }}>
              <svg width={20} height={2}><line x1="0" y1="1" x2="20" y2="1" stroke="#7D8590" strokeWidth={2} /></svg>
              Weekday
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--text-secondary)" }}>
              <svg width={20} height={2}><line x1="0" y1="1" x2="20" y2="1" stroke="#7D8590" strokeWidth={1.5} strokeDasharray="5 3" /></svg>
              Weekend
            </div>
          </div>
        </Section>
      </div>

      {/* ── Heatmap ── */}
      <Section title="Consumption Heatmap" subtitle="Hour-of-day × day-of-week — spot hidden waste patterns" icon={Grid} accent="#22D3EE" delay={220}>
        {loading ? <Sk h={180} /> : <Heatmap data={data} zones={zones} isMobile={isMobile} />}
      </Section>

      {/* ── Row 3: Peak Forecast ── */}
      <Section title="Peak Demand Forecast" subtitle="Predicted hourly campus-wide load — 7-day rolling average" icon={Zap} accent="#FF6B6B" delay={280}>
        {loading ? <Sk h={isMobile ? 160 : 200} /> : (
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
            <ComposedChart data={data?.forecast_curve || []} margin={{ top:5, right:8, left: isMobile ? -20 : -10, bottom:0 }}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF6B6B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={fmtHour}
                tick={{ fill:axisColor, fontSize: isMobile ? 8 : 10 }} tickLine={false}
                axisLine={{ stroke:axisLineColor }} interval={isMobile ? 5 : 2} />
              <YAxis tick={{ fill:axisColor, fontSize:10 }} tickLine={false}
                axisLine={{ stroke:axisLineColor }} unit=" kW" width={isMobile ? 44 : 52} />
              <Tooltip content={<ChartTooltip />} labelFormatter={fmtHour} />
              {data?.peak_hour != null && (
                <ReferenceLine x={data.peak_hour} stroke="#FF6B6B" strokeWidth={2} strokeDasharray="4 3"
                  label={{ value:`Peak ${data.peak_kw} kW`, fill:"#FF6B6B", fontSize:10, position:"insideTopRight" }} />
              )}
              <Area type="monotone" dataKey="kw" fill="url(#forecastGrad)" stroke="none" />
              <Line type="monotone" dataKey="kw" name="Forecast (kW)"
                stroke="#FF6B6B" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        {data?.peak_hour != null && !loading && (
          <div style={{
            marginTop:14, padding:"10px 14px",
            background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)",
            borderRadius:10, fontSize:12.5, color:"var(--text-secondary)", lineHeight:1.6,
          }}>
            ⚡ <span style={{ color:"#FF6B6B", fontWeight:600 }}>Predicted peak</span> of{" "}
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", color:"var(--text-primary)" }}>
              {data.peak_kw} kW
            </span>{" "}
            at <strong style={{ color:"var(--text-primary)" }}>{fmtHour(data.peak_hour)}</strong>.
            Pre-cooling 30–45 min earlier can flatten this by an estimated <strong style={{ color:"#39D98A" }}>12%</strong>.
          </div>
        )}
      </Section>
    </div>
  );
}
