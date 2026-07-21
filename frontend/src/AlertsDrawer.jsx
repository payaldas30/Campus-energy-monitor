import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Clock, ChevronRight,
  Zap, RefreshCw, ChevronDown, Bell, Link, X,
  ShieldAlert, Filter,
} from "lucide-react";
import { fetchAlerts, fetchZones } from "./api";

/* ── severity config ──────────────────────────────────────────── */
const SEV = {
  severe:   { label:"Severe",   color:"#FF6B6B", bg:"rgba(255,107,107,0.10)", border:"rgba(255,107,107,0.28)" },
  moderate: { label:"Moderate", color:"#F0B429", bg:"rgba(240,180,41,0.10)",  border:"rgba(240,180,41,0.28)"  },
  mild:     { label:"Mild",     color:"#58A6FF", bg:"rgba(88,166,255,0.10)",  border:"rgba(88,166,255,0.28)"  },
};
const STATUS_CYCLE  = { new:"acknowledged", acknowledged:"resolved", resolved:"new" };
const STATUS_CONFIG = {
  new:          { label:"New",          color:"#FF6B6B", bg:"rgba(255,107,107,0.13)", icon:Bell },
  acknowledged: { label:"Acknowledged", color:"#F0B429", bg:"rgba(240,180,41,0.13)",  icon:Clock },
  resolved:     { label:"Resolved",     color:"#39D98A", bg:"rgba(57,217,138,0.13)",  icon:CheckCircle },
};

const fmtTs = iso =>
  new Date(iso).toLocaleString("en-US",{
    month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true,
  });
const timeAgo = iso => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

/* ── Live ticker ─────────────────────────────────────────────── */
function LiveTicker({ lastUpdated }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!lastUpdated) return;
    const id = setInterval(() =>
      setElapsed(Math.floor((Date.now() - lastUpdated) / 1000)), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);
  if (!lastUpdated) return null;
  return (
    <span style={{ fontSize:11, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:5 }}>
      <span style={{
        width:6, height:6, borderRadius:"50%", background:"#39D98A",
        animation:"pulse-dot 1.5s ease infinite", flexShrink:0,
      }} />
      Updated {elapsed < 5 ? "just now" : `${elapsed}s ago`}
    </span>
  );
}

/* ── Status button ───────────────────────────────────────────── */
function StatusBtn({ status, onClick }) {
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      title={`Click → mark as ${STATUS_CYCLE[status]}`}
      style={{
        display:"flex", alignItems:"center", gap:5,
        padding:"6px 14px", borderRadius:8, fontSize:11.5, fontWeight:600,
        fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer",
        background:cfg.bg, border:`1px solid ${cfg.color}55`,
        color:cfg.color, transition:"all 0.2s ease",
      }}
    >
      <Icon size={12} /> {cfg.label}
    </button>
  );
}

/* ── Alert card ──────────────────────────────────────────────── */
function AlertCard({ alert, status, onStatusChange, index }) {
  const [open, setOpen]      = useState(false);
  const [simulating, setSim] = useState(false);
  const [simulated,  setSimd]= useState(false);
  const sev = SEV[alert.severity] || SEV.mild;

  const handleSim = e => {
    e.stopPropagation();
    setSim(true);
    setTimeout(() => { setSim(false); setSimd(true); }, 1500);
  };

  return (
    <div
      style={{
        borderRadius:14,
        background:"var(--bg-card)",
        border:`1px solid var(--border)`,
        borderLeft:`4px solid ${sev.color}`,
        overflow:"hidden",
        transition:"transform 0.2s ease, box-shadow 0.2s ease",
        animation:`fadeInUp 0.3s ease ${index * 35}ms both`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.14)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ── Collapsed header row ────────────── */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}
      >
        {/* Icon */}
        <div style={{
          width:38, height:38, borderRadius:10, flexShrink:0,
          background:sev.bg, border:`1px solid ${sev.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <AlertTriangle size={16} color={sev.color} />
        </div>

        {/* Text */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:13, fontWeight:600, color:"var(--text-primary)", lineHeight:1.35,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {alert.label}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:4, flexWrap:"wrap" }}>
            <span style={{
              fontSize:10.5, fontWeight:700, color:sev.color,
              background:sev.bg, border:`1px solid ${sev.border}`,
              borderRadius:99, padding:"2px 8px",
            }}>{sev.label}</span>
            <span style={{
              fontSize:10.5, fontWeight:600,
              color:STATUS_CONFIG[status].color,
              background:STATUS_CONFIG[status].bg,
              borderRadius:99, padding:"2px 8px",
              border:`1px solid ${STATUS_CONFIG[status].color}40`,
            }}>{STATUS_CONFIG[status].label}</span>
            <span style={{ fontSize:10.5, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:3 }}>
              <Clock size={9} /> {timeAgo(alert.ts)}
            </span>
          </div>
        </div>

        {/* kW metric */}
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{
            fontFamily:"'IBM Plex Mono',monospace",
            fontSize:15, fontWeight:700, color:sev.color,
          }}>
            {alert.kw} kW
          </div>
          <div style={{
            fontSize:10, color:sev.color,
            background:sev.bg, borderRadius:6, padding:"2px 6px",
            marginTop:3, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace",
          }}>
            +{alert.pct_over}%
          </div>
        </div>

        <ChevronRight
          size={15} color="var(--text-muted)"
          style={{ transform: open ? "rotate(90deg)" : "none", transition:"transform 0.2s", flexShrink:0 }}
        />
      </div>

      {/* ── Expanded detail ─────────────────── */}
      {open && (
        <div style={{
          borderTop:`1px solid var(--border)`,
          padding:"14px 16px 16px",
          background:"var(--bg-panel)",
          animation:"scaleIn 0.18s ease",
        }}>
          {/* Metrics row */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(3,1fr)",
            gap:12, marginBottom:14,
          }}>
            {[
              { label:"Actual",   value:`${alert.kw} kW`,          color:sev.color },
              { label:"Expected", value:`${alert.expected_kw} kW`, color:"var(--text-secondary)" },
              { label:"Z-score",  value:`${alert.z_score}σ`,        color:sev.color },
            ].map((m, i) => (
              <div key={i} style={{
                padding:"10px 12px", borderRadius:10,
                background:"var(--bg-card)", border:`1px solid var(--border)`,
              }}>
                <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>
                  {m.label}
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:14, fontWeight:700, color:m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:12, display:"flex", alignItems:"center", gap:5 }}>
            <Clock size={12} /> {fmtTs(alert.ts)}
          </div>

          {/* Actions row */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <div onClick={e => e.stopPropagation()}>
              <StatusBtn status={status} onClick={onStatusChange} />
            </div>
            {alert.rec_link && (
              <button
                onClick={handleSim}
                disabled={simulating || simulated}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"6px 14px", borderRadius:8, fontSize:11.5, fontWeight:600,
                  background: simulated ? "rgba(57,217,138,0.15)" : "rgba(88,166,255,0.15)",
                  color: simulated ? "#39D98A" : "#58A6FF",
                  border: simulated ? "1px solid rgba(57,217,138,0.4)" : "1px solid rgba(88,166,255,0.35)",
                  cursor:(simulating||simulated) ? "default" : "pointer",
                  transition:"all 0.3s ease",
                }}
              >
                {simulating
                  ? <><RefreshCw size={12} style={{ animation:"spin-slow 0.8s linear infinite" }} /> Simulating…</>
                  : simulated ? <><CheckCircle size={12} /> Applied!</>
                  : <><Zap size={12} /> Apply fix</>
                }
              </button>
            )}
          </div>

          {alert.rec_link && (
            <div style={{
              marginTop:12, padding:"10px 14px",
              background:"rgba(88,166,255,0.06)", border:"1px solid rgba(88,166,255,0.2)",
              borderRadius:10, display:"flex", alignItems:"center", gap:10,
            }}>
              <Link size={13} color="#58A6FF" style={{ flexShrink:0 }} />
              <span style={{ fontSize:12.5, color:"#58A6FF", fontWeight:500 }}>{alert.rec_link}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ALERTS DRAWER — wider, with New / Acknowledged / Resolved tabs
════════════════════════════════════════════════════════════════ */
export default function AlertsDrawer({ open, onClose, anomalyCount = 0 }) {
  const [zones,       setZones]       = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [sevCounts,   setSevCounts]   = useState({});
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filterSev,   setFilterSev]   = useState("all");
  const [filterZone,  setFilterZone]  = useState("all");
  const [filterStatus,setFilterStatus]= useState("all"); // "all" | "new" | "acknowledged" | "resolved"
  const [statusMap,   setStatusMap]   = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => { fetchZones().then(setZones).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchAlerts(filterZone, filterSev)
      .then(d => {
        setAlerts(d.alerts || []);
        setSevCounts(d.severity_counts || {});
        setTotal(d.total || 0);
        setLoading(false);
        setLastUpdated(Date.now());
      })
      .catch(() => setLoading(false));
  }, [filterZone, filterSev]);

  useEffect(() => { if (open) load(); }, [open, load]);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  const cycleStatus = key => {
    const cur = statusMap[key] || "new";
    setStatusMap(prev => ({ ...prev, [key]: STATUS_CYCLE[cur] }));
  };
  const getStatus = key => statusMap[key] || "new";

  /* ── Status counts derived from current statusMap ── */
  const statusCounts = alerts.reduce((acc, _, i) => {
    const s = getStatus(i);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  /* ── Filtered alert list ── */
  const filteredAlerts = alerts
    .map((a, i) => ({ ...a, _idx: i }))
    .filter(a =>
      (filterSev   === "all" || a.severity === filterSev) &&
      (filterStatus === "all" || getStatus(a._idx) === filterStatus)
    );

  const sevGroups = ["severe", "moderate", "mild"].map(sev => ({
    sev,
    group: filteredAlerts.filter(a => a.severity === sev),
  })).filter(({ group }) => group.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:300,
          background:"rgba(0,0,0,0.5)",
          backdropFilter:"blur(5px)",
          WebkitBackdropFilter:"blur(5px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition:"opacity 0.32s ease",
        }}
      />

      {/* ── Drawer ── */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0,
        width:"min(680px, 100vw)",          /* ← bigger */
        zIndex:400,
        background:"var(--bg-panel)",
        borderLeft:"1px solid var(--border)",
        boxShadow:"-24px 0 80px rgba(0,0,0,0.4)",
        display:"flex", flexDirection:"column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.36s cubic-bezier(0.4,0,0.2,1)",
        overflow:"hidden",
      }}>

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <div style={{
          padding:"22px 26px 0",
          borderBottom:"1px solid var(--border)",
          background:"var(--bg-glass)",
          backdropFilter:"blur(14px)",
          flexShrink:0,
        }}>
          {/* Title row */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                width:42, height:42, borderRadius:12,
                background:"rgba(255,107,107,0.12)",
                border:"1px solid rgba(255,107,107,0.3)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <ShieldAlert size={20} color="#FF6B6B" />
              </div>
              <div>
                <h2 style={{
                  fontFamily:"'Space Grotesk',sans-serif",
                  fontSize:20, fontWeight:700, margin:0, color:"var(--text-primary)",
                }}>
                  Alerts
                  {total > 0 && (
                    <span style={{
                      marginLeft:10, fontSize:12, fontWeight:700,
                      color:"#FF6B6B", background:"rgba(255,107,107,0.12)",
                      border:"1px solid rgba(255,107,107,0.3)", borderRadius:99,
                      padding:"2px 9px", verticalAlign:"middle",
                    }}>{total}</span>
                  )}
                </h2>
                <LiveTicker lastUpdated={lastUpdated} />
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button
                onClick={load}
                title="Refresh"
                style={{
                  width:36, height:36, borderRadius:10,
                  background:"var(--bg-card)", border:"1px solid var(--border)",
                  display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                }}
              >
                <RefreshCw size={14} color="var(--text-secondary)"
                  style={{ animation: loading ? "spin-slow 0.7s linear infinite" : "none" }} />
              </button>
              <button
                onClick={onClose}
                style={{
                  width:36, height:36, borderRadius:10,
                  background:"var(--bg-card)", border:"1px solid var(--border)",
                  display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                }}
              >
                <X size={16} color="var(--text-secondary)" />
              </button>
            </div>
          </div>

          {/* ── Big stat cards: Total / Severe / Moderate / Mild ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
            {[
              { label:"Total",    count:total,                  color:"var(--text-primary)",  bg:"var(--bg-card)",           border:"var(--border)" },
              { label:"Severe",   count:sevCounts.severe   ||0, color:SEV.severe.color,   bg:SEV.severe.bg,   border:SEV.severe.border   },
              { label:"Moderate", count:sevCounts.moderate ||0, color:SEV.moderate.color, bg:SEV.moderate.bg, border:SEV.moderate.border },
              { label:"Mild",     count:sevCounts.mild     ||0, color:SEV.mild.color,     bg:SEV.mild.bg,     border:SEV.mild.border     },
            ].map((p, i) => (
              <div
                key={i}
                onClick={() => setFilterSev(i === 0 ? "all" : ["severe","moderate","mild"][i-1])}
                style={{
                  padding:"12px 14px", borderRadius:12, cursor:"pointer",
                  background:p.bg, border:`1px solid ${p.border}`,
                  textAlign:"center",
                  outline: (i===0 ? filterSev==="all" : filterSev===["severe","moderate","mild"][i-1])
                    ? `2px solid ${p.color}` : "none",
                  transition:"all 0.18s ease",
                }}
              >
                <div style={{
                  fontFamily:"'IBM Plex Mono',monospace",
                  fontSize:24, fontWeight:800, color:p.color, lineHeight:1,
                }}>
                  {p.count}
                </div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4, fontWeight:500 }}>
                  {p.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Status tabs: New / Acknowledged / Resolved ── */}
          <div style={{ display:"flex", gap:0, borderBottom:"none" }}>
            {[
              { key:"all",          label:"All",          count: alerts.length,                   color:"var(--text-secondary)" },
              { key:"new",          label:"New",          count: statusCounts.new          || 0,  color:STATUS_CONFIG.new.color          },
              { key:"acknowledged", label:"Acknowledged", count: statusCounts.acknowledged || 0,  color:STATUS_CONFIG.acknowledged.color },
              { key:"resolved",     label:"Resolved",     count: statusCounts.resolved     || 0,  color:STATUS_CONFIG.resolved.color     },
            ].map(tab => {
              const active = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  style={{
                    flex:1,
                    padding:"11px 6px",
                    border:"none",
                    background:"transparent",
                    cursor:"pointer",
                    fontFamily:"'Inter',system-ui,sans-serif",
                    fontSize:12.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? tab.color : "var(--text-muted)",
                    borderBottom: active ? `2.5px solid ${tab.color}` : "2.5px solid transparent",
                    transition:"all 0.2s ease",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    gap:7,
                  }}
                >
                  {tab.label}
                  <span style={{
                    minWidth:20, height:18, borderRadius:99,
                    background: active ? `${tab.color}20` : "var(--bg-card)",
                    border: active ? `1px solid ${tab.color}50` : "1px solid var(--border)",
                    color: active ? tab.color : "var(--text-muted)",
                    fontSize:10.5, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    padding:"0 5px",
                    fontFamily:"'IBM Plex Mono',monospace",
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Sub-filter bar (zone) ────────────────────────────── */}
        <div style={{
          display:"flex", alignItems:"center", gap:10, padding:"12px 26px",
          borderBottom:"1px solid var(--border)",
          background:"var(--bg-panel)", flexShrink:0, flexWrap:"wrap",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, color:"var(--text-muted)", fontSize:12 }}>
            <Filter size={12} /> <span>Filter:</span>
          </div>

          {/* Severity pills */}
          <div style={{
            display:"flex", gap:3,
            background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:9, padding:3,
          }}>
            {["all","severe","moderate","mild"].map(s => (
              <button
                key={s}
                onClick={() => setFilterSev(s)}
                style={{
                  padding:"4px 11px", borderRadius:7, fontSize:11, fontWeight:500,
                  fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer",
                  border: filterSev === s
                    ? `1px solid ${s==="all" ? "rgba(57,217,138,0.4)" : (SEV[s]?.border||"transparent")}`
                    : "1px solid transparent",
                  background: filterSev === s
                    ? (s==="all" ? "rgba(57,217,138,0.12)" : SEV[s]?.bg)
                    : "transparent",
                  color: filterSev === s
                    ? (s==="all" ? "#39D98A" : SEV[s]?.color)
                    : "var(--text-secondary)",
                  transition:"all 0.18s ease", textTransform:"capitalize",
                }}
              >{s === "all" ? "All severity" : s}</button>
            ))}
          </div>

          {/* Zone select */}
          <div style={{ position:"relative" }}>
            <select
              value={filterZone}
              onChange={e => setFilterZone(e.target.value)}
              style={{
                appearance:"none", WebkitAppearance:"none",
                padding:"6px 30px 6px 11px",
                background:"var(--bg-card)", border:"1px solid var(--border)",
                borderRadius:9, color:"var(--text-primary)", fontSize:11.5,
                fontFamily:"'Inter',system-ui,sans-serif", cursor:"pointer", outline:"none",
              }}
            >
              <option value="all">All zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <ChevronDown size={11} style={{
              position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
              color:"var(--text-muted)", pointerEvents:"none",
            }} />
          </div>

          <span style={{ marginLeft:"auto", fontSize:11, color:"var(--text-muted)" }}>
            {filteredAlerts.length} shown
          </span>
        </div>

        {/* ══ FEED ════════════════════════════════════════════════ */}
        <div style={{ flex:1, overflowY:"auto", padding:"18px 26px", display:"flex", flexDirection:"column", gap:10 }}>
          {loading && alerts.length === 0 ? (
            Array.from({ length:5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height:76, borderRadius:14 }} />
            ))
          ) : filteredAlerts.length === 0 ? (
            <div style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", textAlign:"center",
              padding:"60px 20px", color:"var(--text-muted)",
            }}>
              <CheckCircle size={48} color="#39D98A" style={{ marginBottom:14, opacity:0.6 }} />
              <p style={{ fontWeight:700, fontSize:16, color:"var(--text-primary)", marginBottom:6 }}>
                {filterStatus === "resolved" ? "All resolved! 🎉" : "All clear!"}
              </p>
              <p style={{ fontSize:13 }}>
                {filterStatus !== "all"
                  ? `No ${filterStatus} alerts with current filters.`
                  : "No anomalies detected with current filters."}
              </p>
            </div>
          ) : (
            <>
              {sevGroups.map(({ sev, group }) => {
                const cfg = SEV[sev];
                return (
                  <div key={sev} style={{ marginBottom:6 }}>
                    {/* Section header */}
                    <div style={{
                      display:"flex", alignItems:"center", gap:8,
                      marginBottom:10, paddingBottom:8,
                      borderBottom:`1px solid ${cfg.color}22`,
                    }}>
                      <div style={{
                        width:8, height:8, borderRadius:"50%",
                        background:cfg.color, flexShrink:0,
                      }} />
                      <span style={{
                        fontSize:11, fontWeight:700, letterSpacing:1.3,
                        textTransform:"uppercase", color:cfg.color,
                      }}>{cfg.label} Alerts</span>
                      <span style={{
                        fontSize:11, fontWeight:700, color:cfg.color,
                        background:cfg.bg, border:`1px solid ${cfg.border}`,
                        borderRadius:99, padding:"2px 9px",
                        fontFamily:"'IBM Plex Mono',monospace",
                      }}>{group.length}</span>
                      <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${cfg.color}35, transparent)` }} />
                    </div>

                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {group.map((alert, gi) => (
                        <AlertCard
                          key={alert._idx}
                          alert={alert}
                          status={getStatus(alert._idx)}
                          onStatusChange={() => cycleStatus(alert._idx)}
                          index={gi}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              <p style={{
                textAlign:"center", fontSize:11.5, color:"var(--text-muted)",
                paddingTop:10, paddingBottom:6,
              }}>
                Showing {filteredAlerts.length} of {total} alerts
              </p>
            </>
          )}
        </div>

        {/* ══ FOOTER TIP ══════════════════════════════════════════ */}
        <div style={{
          padding:"13px 26px",
          borderTop:"1px solid var(--border)",
          background:"rgba(88,166,255,0.04)",
          fontSize:11.5, color:"var(--text-muted)", lineHeight:1.6, flexShrink:0,
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span>💡</span>
          <span>
            Click a card to expand. Cycle status:{" "}
            <strong style={{ color:"#FF6B6B" }}>New</strong> →{" "}
            <strong style={{ color:"#F0B429" }}>Acknowledged</strong> →{" "}
            <strong style={{ color:"#39D98A" }}>Resolved</strong>
          </span>
        </div>
      </div>
    </>
  );
}
