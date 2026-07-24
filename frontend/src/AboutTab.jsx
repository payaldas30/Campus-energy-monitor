import React, { useState } from "react";
import {
  Activity, TrendingUp, Shield, Leaf, BarChart2, Bell,
} from "lucide-react";

/* ── Feature data ───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Activity, color: "#39D98A", bg: "rgba(57,217,138,0.1)",
    title: "Live Sub-Metering",
    desc: "15-minute interval readings from every campus zone — admin blocks, labs, hostels, library. Nothing escapes visibility.",
  },
  {
    icon: TrendingUp, color: "#58A6FF", bg: "rgba(88,166,255,0.1)",
    title: "Predictive Analytics",
    desc: "Rolling 7-day baselines and hour-of-day load curves give you statistical confidence in every forecast.",
  },
  {
    icon: Shield, color: "#A78BFA", bg: "rgba(167,139,250,0.1)",
    title: "Anomaly Intelligence",
    desc: "Z-score detection flags consumption spikes in real time. Tiered severity scoring means you act on what matters.",
  },
  {
    icon: Leaf, color: "#22D3EE", bg: "rgba(34,211,238,0.1)",
    title: "Carbon Tracking",
    desc: "Measure, monitor and reduce your campus carbon footprint with AI-generated intervention recommendations.",
  },
  {
    icon: BarChart2, color: "#F0B429", bg: "rgba(240,180,41,0.1)",
    title: "Heatmap Visualisation",
    desc: "Hour × day consumption heatmaps reveal hidden patterns. Spot weekend standby waste instantly.",
  },
  {
    icon: Bell, color: "#FF6B6B", bg: "rgba(255,107,107,0.1)",
    title: "Smart Alert Workflow",
    desc: "New → Acknowledged → Resolved status pipeline. Every alert links directly to an actionable intervention.",
  },
];

/* ── Tech stack ─────────────────────────────────────────────── */
const TECH = [
  { label: "React 18",      color: "#61DAFB", desc: "Fast reactive UI with hooks" },
  { label: "FastAPI",       color: "#39D98A", desc: "Async Python REST + WebSocket" },
  { label: "WebSockets",    color: "#A78BFA", desc: "Live bidirectional data push" },
  { label: "SQLite",        color: "#F0B429", desc: "Embedded time-series store" },
  { label: "Recharts",      color: "#58A6FF", desc: "Composable chart library" },
  { label: "Vite",          color: "#FF6B6B", desc: "Sub-second HMR dev server" },
  { label: "Vanilla CSS",   color: "#22D3EE", desc: "Glassmorphism design system" },
  { label: "IBM Plex Mono", color: "#E6EDF3", desc: "Technical monospace font" },
];

/* ── Mission stats ──────────────────────────────────────────── */
const MISSION_STATS = [
  { num: "12+",  label: "Campuses",      color: "#39D98A" },
  { num: "8",    label: "Zones Tracked", color: "#58A6FF" },
  { num: "28%",  label: "Avg Savings",   color: "#F0B429" },
  { num: "99%",  label: "Uptime",        color: "#A78BFA" },
];

/* ── Smart Grid SVG ─────────────────────────────────────────── */
function SmartGridSVG() {
  return (
    <svg viewBox="0 0 500 340" style={{ width: "100%", maxWidth: 480 }}>
      <defs>
        <linearGradient id="sgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="sgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.8" />
        </linearGradient>
        <filter id="sgGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background grid */}
      {[0,1,2,3].map(i => (
        <line key={`sg-h${i}`} x1="0" y1={85*i} x2="500" y2={85*i}
          stroke="var(--border)" strokeWidth="1"/>
      ))}
      {[0,1,2,3,4].map(i => (
        <line key={`sg-v${i}`} x1={125*i} y1="0" x2={125*i} y2="340"
          stroke="var(--border)" strokeWidth="1"/>
      ))}

      {/* Central brain ring */}
      <circle cx="250" cy="170" r="55" fill="var(--accent-green)" fillOpacity="0.05" stroke="url(#sgGrad1)" strokeWidth="1.5" />
      <circle cx="250" cy="170" r="38" fill="var(--accent-green)" fillOpacity="0.1" stroke="url(#sgGrad1)" strokeWidth="1" />
      <circle cx="250" cy="170" r="20" fill="var(--accent-green)" fillOpacity="0.25" />
      <circle cx="250" cy="170" r="6" fill="var(--accent-green)" style={{ filter: "url(#sgGlow)" }} />
      <text x="250" y="200" textAnchor="middle" fontSize="9" fill="var(--accent-green)" fontWeight="700" letterSpacing="1">AI CORE</text>

      {/* Satellite nodes */}
      {[
        { x: 80,  y: 60,  color: "var(--accent-green)",  label: "Admin" },
        { x: 420, y: 60,  color: "var(--accent-blue)",   label: "Labs" },
        { x: 60,  y: 280, color: "var(--accent-purple)", label: "Hostel" },
        { x: 440, y: 280, color: "var(--accent-cyan)",   label: "Library" },
        { x: 250, y: 30,  color: "var(--accent-yellow)", label: "Solar" },
        { x: 480, y: 170, color: "var(--accent-red)",    label: "Grid" },
      ].map(({ x, y, color, label }) => (
        <g key={label}>
          <line x1={x} y1={y} x2="250" y2="170" stroke={color} strokeWidth="1.2"
            strokeDasharray="4,4" strokeOpacity="0.6"
            style={{ animation: `energy-flow 3s linear infinite` }}/>
          <circle cx={x} cy={y} r="22" fill={color} fillOpacity="0.07" stroke={color} strokeOpacity="0.27" strokeWidth="1.5" />
          <circle cx={x} cy={y} r="8" fill={color} fillOpacity="0.18" />
          <circle cx={x} cy={y} r="3" fill={color} />
          <text x={x} y={y+34} textAnchor="middle" fontSize="8" fill={color} fontWeight="600" letterSpacing="0.5">{label}</text>
        </g>
      ))}

      {/* Live badge */}
      <rect x="30" y="310" width="100" height="20" rx="10" fill="var(--accent-green)" fillOpacity="0.1" stroke="var(--accent-green)" strokeOpacity="0.3" strokeWidth="1"/>
      <circle cx="44" cy="320" r="3.5" fill="var(--accent-green)" style={{ animation: "pulse-dot 1.5s ease infinite" }}/>
      <text x="53" y="324" fontSize="8" fill="var(--accent-green)" fontWeight="600">LIVE MONITORING</text>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════
   ABOUT TAB
════════════════════════════════════════════════════════════ */
export default function AboutTab({ isMobile }) {
  const [hoveredTech, setHoveredTech] = useState(null);
  const cols3 = isMobile ? "1fr" : "repeat(3, 1fr)";
  const cols2 = isMobile ? "1fr" : "repeat(2, 1fr)";
  const cols4 = isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)";

  return (
    <div style={{ animation: "fadeInUp 0.4s ease both" }}>

      {/* ── Hero strip ────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? "24px 20px" : "36px 32px",
        background: "linear-gradient(135deg, rgba(57,217,138,0.06) 0%, rgba(34,211,238,0.04) 50%, rgba(88,166,255,0.04) 100%)",
        border: "1px solid rgba(57,217,138,0.15)",
        borderRadius: 20,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 28,
        flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 13px", borderRadius: 999,
            background: "rgba(57,217,138,0.1)", border: "1px solid rgba(57,217,138,0.3)",
            fontSize: 10.5, fontWeight: 600, color: "#39D98A",
            textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#39D98A", animation: "pulse-dot 1.5s ease infinite" }} />
            About EnergyIQ
          </div>

          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: isMobile ? 22 : 30, fontWeight: 800,
            color: "var(--text-primary)", lineHeight: 1.2,
            letterSpacing: -0.8, marginBottom: 14,
          }}>
            The intelligent grid for<br />
            <span style={{
              background: "linear-gradient(135deg, #39D98A, #22D3EE, #58A6FF)",
              backgroundSize: "200%",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", animation: "gradient-x 4s ease infinite",
            }}>
              modern campuses
            </span>
          </h2>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 480 }}>
            EnergyIQ is an open-source campus energy intelligence platform combining
            real-time WebSocket metering, AI anomaly detection, and a premium futuristic
            dashboard. Built to make sustainability decisions data-driven and effortless.
          </p>
        </div>

        <div style={{ flexShrink: 0, width: isMobile ? "100%" : 280 }}>
          <SmartGridSVG />
        </div>
      </div>

      {/* ── Mission stats ──────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: cols4,
        gap: 12, marginBottom: 20,
      }}>
        {MISSION_STATS.map(({ num, label, color }) => (
          <div key={label} style={{
            background: "var(--bg-card)",
            border: `1px solid ${color}18`,
            borderRadius: 14, padding: isMobile ? "18px 14px" : "22px 18px",
            textAlign: "center",
            transition: "all 0.25s ease",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${color}45`;
              e.currentTarget.style.boxShadow = `0 6px 24px ${color}12`;
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${color}18`;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: isMobile ? 26 : 30, fontWeight: 700, color, marginBottom: 5,
            }}>{num}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Feature cards grid ─────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: -0.3,
          }}><span className="anim-heading">Core Capabilities</span></h3>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: cols3,
          gap: 12,
        }}>
          {FEATURES.map(({ color, bg, title, desc }, i) => (
            <div
              key={title}
              className="about-feature-card"
              style={{ animationDelay: `${i * 50}ms`, borderTop: `3px solid ${color}` }}
            >
              <h4 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 7,
                marginTop: 8,
              }}>{title}</h4>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
