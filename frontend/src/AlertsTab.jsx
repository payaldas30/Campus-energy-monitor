import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Clock, XCircle, Filter,
  ChevronRight, Zap, RefreshCw, ChevronDown, Bell, Link,
} from "lucide-react";
import { fetchAlerts, fetchZones } from "./api";

/* ── severity config ────────────────────────────────────────── */
const SEV = {
  severe:   { label:"Severe",   color:"#FF6B6B", bg:"rgba(255,107,107,0.10)", border:"rgba(255,107,107,0.3)", icon:"🔴" },
  moderate: { label:"Moderate", color:"#F0B429", bg:"rgba(240,180,41,0.10)",  border:"rgba(240,180,41,0.3)",  icon:"🟡" },
  mild:     { label:"Mild",     color:"#58A6FF", bg:"rgba(88,166,255,0.10)",  border:"rgba(88,166,255,0.3)",  icon:"🔵" },
};

const STATUS_CYCLE = { new:"acknowledged", acknowledged:"resolved", resolved:"new" };
const STATUS_CONFIG = {
  new:          { label:"New",          color:"#FF6B6B", bg:"rgba(255,107,107,0.1)", icon:Bell },
  acknowledged: { label:"Acknowledged", color:"#F0B429", bg:"rgba(240,180,41,0.1)",  icon:Clock },
  resolved:     { label:"Resolved",     color:"#39D98A", bg:"rgba(57,217,138,0.1)",  icon:CheckCircle },
};

/* ── helpers ────────────────────────────────────────────────── */
const fmtTs = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* ── severity badge ─────────────────────────────────────────── */
function SevBadge({ severity, size = "sm" }) {
  const s = SEV[severity] || SEV.mild;
  const pad = size === "lg" ? "5px 12px" : "3px 9px";
  const fs  = size === "lg" ? 12 : 10.5;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:pad, borderRadius:999, fontSize:fs, fontWeight:600,
      background:s.bg, border:`1px solid ${s.border}`, color:s.color,
      whiteSpace:"nowrap",
    }}>
      <span style={{ fontSize:fs - 1 }}>{s.icon}</span>
      {s.label}
    </span>
  );
}

/* ── status toggle button ───────────────────────────────────── */
function StatusBtn({ status, onClick }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const Icon = cfg.icon;
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:5,
      padding:"5px 11px", borderRadius:8, fontSize:11.5, fontWeight:500,
      fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer",
      background: cfg.bg, border:`1px solid ${cfg.color}40`,
      color:cfg.color, transition:"all 0.2s ease",
    }}
    title={`Click to mark as ${STATUS_CYCLE[status]}`}
    >
      <Icon size={12} />
      {cfg.label}
    </button>
  );
}

/* ── stats summary row ──────────────────────────────────────── */
function StatPill({ count, label, color, bg }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"12px 20px", borderRadius:12,
      background:bg, border:`1px solid ${color}25`,
      minWidth:80,
    }}>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:22, fontWeight:700, color }}>{count}</span>
      <span style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{label}</span>
    </div>
  );
}

/* ── alert card ─────────────────────────────────────────────── */
function AlertCard({ alert, status, onStatusChange, index }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV[alert.severity] || SEV.mild;

  return (
    <div style={{
      background:"var(--bg-card)", border:`1px solid var(--border)`,
      borderLeft:`3px solid ${sev.color}`,
      borderRadius:12, overflow:"hidden",
      animation:`fadeInUp 0.4s ease both`,
      animationDelay:`${index * 40}ms`,
      transition:"box-shadow 0.2s ease, border-color 0.2s ease",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Main row */}
      <div style={{
        display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px",
        cursor:"pointer",
      }} onClick={() => setExpanded(v => !v)}>
        {/* Severity dot */}
        <div style={{
          width:36, height:36, borderRadius:10,
          background:sev.bg, border:`1px solid ${sev.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0, marginTop:1,
          fontSize:16,
        }}>{sev.icon}</div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)" }}>
              {alert.label}
            </span>
            <SevBadge severity={alert.severity} />
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            {/* Zone pill */}
            <span style={{
              display:"inline-flex", alignItems:"center", gap:4,
              fontSize:11, color:alert.color, fontWeight:500,
              background:`${alert.color}10`, border:`1px solid ${alert.color}30`,
              borderRadius:6, padding:"2px 8px",
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:alert.color }} />
              {alert.zone_name}
            </span>
            {/* Timestamp */}
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>
              {fmtTs(alert.ts)} · {timeAgo(alert.ts)}
            </span>
          </div>
        </div>

        {/* Right: metrics + status */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:600, color:sev.color }}>
              {alert.kw} kW
            </div>
            <div style={{ fontSize:10.5, color:"var(--text-muted)" }}>
              exp. {alert.expected_kw} kW
            </div>
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11.5,
            color:sev.color, background:sev.bg, borderRadius:6, padding:"2px 7px" }}>
            +{alert.pct_over}%
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding:"0 16px 14px",
          borderTop:"1px solid var(--border)",
          animation:"scaleIn 0.2s ease",
          background:"var(--bg-panel)",
        }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", paddingTop:12 }}>
            {/* Detail metrics */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[
                { label:"Actual load",   value:`${alert.kw} kW`,            color:sev.color },
                { label:"Expected",      value:`${alert.expected_kw} kW`,   color:"var(--text-secondary)" },
                { label:"Z-score",       value:`${alert.z_score}σ`,         color:sev.color },
                { label:"Excess",        value:`+${alert.pct_over}% above`, color:"var(--text-secondary)" },
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ fontSize:10.5, color:"var(--text-muted)", marginBottom:2 }}>{m.label}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:600, color:m.color }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Status toggle */}
            <StatusBtn status={status} onClick={(e) => { e.stopPropagation(); onStatusChange(); }} />
          </div>

          {/* Linked recommendation */}
          {alert.rec_link && (
            <div style={{
              marginTop:12, padding:"9px 12px",
              background:"rgba(88,166,255,0.06)", border:"1px solid rgba(88,166,255,0.2)",
              borderRadius:9, display:"flex", alignItems:"center", gap:8,
            }}>
              <Link size={12} color="#58A6FF" style={{ flexShrink:0 }} />
              <div>
                <span style={{ fontSize:10.5, color:"var(--text-muted)" }}>Linked intervention → </span>
                <span style={{ fontSize:12, color:"#58A6FF", fontWeight:500 }}>{alert.rec_link}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ALERTS TAB
════════════════════════════════════════════════════════════ */
export default function AlertsTab({ isMobile }) {
  const [zones, setZones]         = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [sevCounts, setSevCounts] = useState({});
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filterZone, setFilterZone] = useState("all");
  const [filterSev,  setFilterSev]  = useState("all");
  const [statusMap, setStatusMap]   = useState({});   // alert index → status string

  /* load zones */
  useEffect(() => { fetchZones().then(setZones).catch(() => {}); }, []);

  /* load alerts whenever filters change */
  const load = useCallback(() => {
    setLoading(true);
    fetchAlerts(filterZone, filterSev)
      .then(d => {
        setAlerts(d.alerts || []);
        setSevCounts(d.severity_counts || {});
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterZone, filterSev]);

  useEffect(() => { load(); }, [load]);

  /* cycle status for one alert */
  const cycleStatus = (key, currentStatus) => {
    const next = STATUS_CYCLE[currentStatus] || "acknowledged";
    setStatusMap(prev => ({ ...prev, [key]: next }));
  };

  const getStatus = (key) => statusMap[key] || "new";

  /* counts by status */
  const statusCounts = alerts.reduce((acc, a, i) => {
    const s = getStatus(i);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ animation:"fadeInUp 0.4s ease both" }}>

      {/* ── Stats summary ─────────────────────────────── */}
      <div style={{
        display:"flex", gap:10, marginBottom:20, flexWrap:"wrap",
        padding:"16px 20px",
        background:"var(--bg-card)", border:"1px solid var(--border)",
        borderRadius:14,
      }}>
        <StatPill count={total} label="Total alerts" color="#E6EDF3" bg="rgba(230,237,243,0.05)" />
        <div style={{ width:1, background:"var(--border)", margin:"0 4px", alignSelf:"stretch" }} />
        <StatPill count={sevCounts.severe   || 0} label="Severe"   color={SEV.severe.color}   bg={SEV.severe.bg} />
        <StatPill count={sevCounts.moderate || 0} label="Moderate" color={SEV.moderate.color} bg={SEV.moderate.bg} />
        <StatPill count={sevCounts.mild     || 0} label="Mild"     color={SEV.mild.color}     bg={SEV.mild.bg} />
        <div style={{ width:1, background:"var(--border)", margin:"0 4px", alignSelf:"stretch" }} />
        <StatPill count={statusCounts.new          || 0} label="New"          color="#FF6B6B" bg="rgba(255,107,107,0.08)" />
        <StatPill count={statusCounts.acknowledged || 0} label="Acknowledged" color="#F0B429" bg="rgba(240,180,41,0.08)" />
        <StatPill count={statusCounts.resolved     || 0} label="Resolved"     color="#39D98A" bg="rgba(57,217,138,0.08)" />
      </div>

      {/* ── Filters ───────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, color:"var(--text-muted)", fontSize:12.5 }}>
          <Filter size={13} /> Filters:
        </div>

        {/* Severity filter */}
        <div style={{
          display:"flex", gap:3, background:"var(--bg-card)",
          border:"1px solid var(--border)", borderRadius:10, padding:3,
        }}>
          {["all", "severe", "moderate", "mild"].map(s => (
            <button key={s} onClick={() => setFilterSev(s)} style={{
              padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:500,
              fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer",
              border: filterSev === s ? `1px solid ${s === "all" ? "rgba(57,217,138,0.35)" : (SEV[s]?.border || "transparent")}` : "1px solid transparent",
              background: filterSev === s ? (s === "all" ? "rgba(57,217,138,0.10)" : SEV[s]?.bg) : "transparent",
              color: filterSev === s ? (s === "all" ? "#39D98A" : SEV[s]?.color) : "var(--text-secondary)",
              transition:"all 0.2s ease", textTransform:"capitalize",
            }}>{s === "all" ? "All severity" : s}</button>
          ))}
        </div>

        {/* Zone dropdown */}
        <div style={{ position:"relative" }}>
          <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={{
            appearance:"none", WebkitAppearance:"none",
            padding:"7px 32px 7px 12px",
            background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:10, color:"var(--text-primary)", fontSize:12,
            fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer", outline:"none",
          }}>
            <option value="all">All zones</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <ChevronDown size={12} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }} />
        </div>

        {/* Refresh */}
        <button onClick={load} style={{
          display:"flex", alignItems:"center", gap:5,
          padding:"7px 12px", borderRadius:10, fontSize:12,
          background:"var(--bg-card)", border:"1px solid var(--border)",
          color:"var(--text-secondary)", cursor:"pointer",
          fontFamily:"'Inter',system-ui,sans-serif", transition:"all 0.2s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor="#39D98A"; e.currentTarget.style.color="#39D98A"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; }}
        >
          <RefreshCw size={12} style={{ animation: loading ? "spin-slow 0.8s linear infinite" : "none" }} />
          Refresh
        </button>

        {loading && (
          <span style={{ fontSize:11.5, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid var(--border)", borderTopColor:"#39D98A", animation:"spin-slow 0.7s linear infinite" }} />
            Loading…
          </span>
        )}
      </div>

      {/* ── Instruction tip ───────────────────────────── */}
      <div style={{
        padding:"9px 14px", marginBottom:14, borderRadius:10,
        background:"rgba(88,166,255,0.05)", border:"1px solid rgba(88,166,255,0.15)",
        fontSize:12, color:"var(--text-secondary)", lineHeight:1.5,
      }}>
        💡 Click any alert to expand details. Use the status button to work through alerts: <strong style={{ color:"#FF6B6B" }}>New</strong> → <strong style={{ color:"#F0B429" }}>Acknowledged</strong> → <strong style={{ color:"#39D98A" }}>Resolved</strong>.
      </div>

      {/* ── Alert feed ────────────────────────────────── */}
      {loading && alerts.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height:74, borderRadius:12 }} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div style={{
          textAlign:"center", padding:"60px 20px",
          background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:14,
        }}>
          <CheckCircle size={40} color="#39D98A" style={{ marginBottom:12, opacity:0.6 }} />
          <p style={{ color:"var(--text-primary)", fontWeight:600, marginBottom:4 }}>No alerts found</p>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>
            {filterSev !== "all" || filterZone !== "all" ? "Try adjusting the filters." : "All clear — no anomalies detected."}
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {/* Group by severity: severe first */}
          {["severe", "moderate", "mild"].map(sev => {
            const group = alerts.filter(a => a.severity === sev);
            if (!group.length) return null;
            const cfg = SEV[sev];
            return (
              <div key={sev}>
                {/* Group header */}
                <div style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"6px 0", marginBottom:6,
                }}>
                  <span style={{ fontSize:12.5, fontWeight:600, color:cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span style={{
                    fontSize:11, color:cfg.color, background:cfg.bg,
                    border:`1px solid ${cfg.border}`, borderRadius:99,
                    padding:"1px 8px", fontFamily:"'IBM Plex Mono',monospace",
                  }}>{group.length}</span>
                  <div style={{ flex:1, height:1, background:`${cfg.color}20` }} />
                </div>

                {group.map((alert, idx) => {
                  const globalIdx = alerts.indexOf(alert);
                  return (
                    <div key={globalIdx} style={{ marginBottom:8 }}>
                      <AlertCard
                        alert={alert}
                        status={getStatus(globalIdx)}
                        onStatusChange={() => cycleStatus(globalIdx, getStatus(globalIdx))}
                        index={idx}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Load count */}
          <p style={{ textAlign:"center", fontSize:12, color:"var(--text-muted)", paddingTop:8 }}>
            Showing {alerts.length} of {total} alerts
          </p>
        </div>
      )}
    </div>
  );
}
