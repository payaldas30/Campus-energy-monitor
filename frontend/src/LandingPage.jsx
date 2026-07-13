import React, { useState, useEffect, useRef } from "react";
import {
  Zap, ArrowRight, Activity, TrendingUp, Shield, Leaf,
  BarChart2, Bell, ChevronRight, ChevronDown, Play, Sun, Moon,
  CheckCircle, Star, ArrowUpRight, Menu, X, GitBranch, ExternalLink,
} from "lucide-react";

/* ── Scroll reveal hook ─────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => entry.target.classList.add("revealed"), Number(delay));
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Counter animation ──────────────────────────────────────── */
function CountUp({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const animate = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(eased * end));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Energy flow SVG ────────────────────────────────────────── */
function EnergyFlowSVG({ theme }) {
  const isLight = theme === "light";
  const HUB = { cx: 320, cy: 220 };
  const nodes = [
    { cx: 110, cy: 90,  color: "#1DA463", lightColor: "#1DA463", darkColor: "#39D98A", label: "ADMIN",   delay: 0 },
    { cx: 490, cy: 90,  color: "#0969DA", lightColor: "#0969DA", darkColor: "#58A6FF", label: "LABS",    delay: 0.5 },
    { cx: 95,  cy: 330, color: "#7C3AED", lightColor: "#7C3AED", darkColor: "#A78BFA", label: "HOSTEL",  delay: 1.0 },
    { cx: 510, cy: 330, color: "#0891B2", lightColor: "#0891B2", darkColor: "#22D3EE", label: "LIBRARY", delay: 1.5 },
    { cx: 320, cy: 45,  color: "#D97706", lightColor: "#D97706", darkColor: "#F0B429", label: "SOLAR",   delay: 2.0 },
    { cx: 560, cy: 220, color: "#DC2626", lightColor: "#DC2626", darkColor: "#FF6B6B", label: "GRID",    delay: 0.3 },
  ].map(n => ({ ...n, color: isLight ? n.lightColor : n.darkColor }));

  const hubColor    = isLight ? "#1DA463" : "#39D98A";
  const gridStroke  = isLight ? "rgba(0,0,0,0.07)"   : "rgba(255,255,255,0.03)";
  const lineOpacity = isLight ? 0.55 : 0.25;
  const hubRingOp   = isLight ? [0.9, 0.5] : [0.6, 0.25];
  const pulseOp     = isLight ? 0.65 : 0.4;
  const hubFill     = isLight ? `rgba(29,164,99,0.18)` : "rgba(57,217,138,0.22)";

  return (
    <svg
      viewBox="0 0 640 420"
      style={{ width: "100%", maxWidth: 640, opacity: 1 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={hubColor} stopOpacity={isLight ? 0.22 : 0.3} />
          <stop offset="100%" stopColor={hubColor} stopOpacity="0" />
        </radialGradient>
        {nodes.map(({ color, label }) => (
          <radialGradient key={label} id={`ng-${label}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity={isLight ? 0.3 : 0.4} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowStrong" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid */}
      {[0,1,2,3,4,5].map(i => (
        <line key={`h${i}`} x1="0" y1={70*i} x2="640" y2={70*i}
          stroke={gridStroke} strokeWidth="1" />
      ))}
      {[0,1,2,3,4,5,6].map(i => (
        <line key={`v${i}`} x1={106.6*i} y1="0" x2={106.6*i} y2="420"
          stroke={gridStroke} strokeWidth="1" />
      ))}

      {/* Hub glow backdrop */}
      <circle cx={HUB.cx} cy={HUB.cy} r="90" fill="url(#hubGlow)" />

      {/* Connector lines */}
      {nodes.map(({ cx, cy, color, label, delay }) => (
        <line key={`line-${label}`}
          x1={HUB.cx} y1={HUB.cy} x2={cx} y2={cy}
          stroke={color} strokeWidth={isLight ? 1.8 : 1.2} strokeOpacity={lineOpacity}
          strokeDasharray="6 4"
          style={{ animation: `energy-flow 3s linear ${delay}s infinite` }}
        />
      ))}

      {/* Animated data-packet dots */}
      {nodes.map(({ cx, cy, color, label, delay }) => (
        <circle key={`pkt-${label}`} r={isLight ? 4 : 3} fill={color}
          style={{ filter: "url(#glow)", opacity: 1 }}
        >
          <animateMotion dur="3s" begin={`${delay}s`} repeatCount="indefinite"
            path={`M${HUB.cx},${HUB.cy} L${cx},${cy}`} />
        </circle>
      ))}

      {/* Central hub rings */}
      {[58, 44, 30].map((r, i) => (
        <circle key={`hr${i}`} cx={HUB.cx} cy={HUB.cy} r={r}
          fill="none" stroke={hubColor}
          strokeWidth={i === 2 ? 2 : 1}
          strokeOpacity={i === 2 ? hubRingOp[0] : hubRingOp[1]}
          strokeDasharray={i === 1 ? "4 3" : "none"}
          style={i === 1 ? { animation: "spin-slow 12s linear infinite" } : {}}
        />
      ))}

      {/* Pulse rings */}
      {[72, 92, 112].map((r, i) => (
        <circle key={`pr${i}`} cx={HUB.cx} cy={HUB.cy} r={r}
          fill="none" stroke={hubColor} strokeWidth={isLight ? 1 : 0.6} strokeOpacity={pulseOp}
          style={{ animation: `pulse-ring ${2.2 + i * 0.9}s ease-out ${i * 0.7}s infinite` }} />
      ))}

      {/* Hub fill + icon */}
      <circle cx={HUB.cx} cy={HUB.cy} r="22" fill={hubFill} />
      <text x={HUB.cx} y={HUB.cy + 8} textAnchor="middle" fontSize="22"
        fill={hubColor} style={{ filter: "url(#glowStrong)" }}>⚡</text>

      {/* Satellite nodes */}
      {nodes.map(({ cx, cy, color, label }) => (
        <g key={label}>
          <circle cx={cx} cy={cy} r="32" fill={`url(#ng-${label})`} />
          <circle cx={cx} cy={cy} r="24" fill="none" stroke={color}
            strokeWidth={isLight ? 1.5 : 1} strokeOpacity={isLight ? 0.7 : 0.35}
            strokeDasharray="3 3"
            style={{ animation: "spin-slow 20s linear infinite" }} />
          <circle cx={cx} cy={cy} r="17" fill={`${color}${isLight ? "28" : "18"}`} stroke={color}
            strokeWidth="2" strokeOpacity={isLight ? 0.9 : 0.55} />
          <circle cx={cx} cy={cy} r="6" fill={color}
            style={{ filter: "url(#glowStrong)" }} />
          <text x={cx} y={cy + 40} textAnchor="middle" fontSize={isLight ? 10 : 9}
            fill={color} fontWeight="800" letterSpacing="1.5"
            style={{ filter: isLight ? "none" : "url(#glow)" }}>{label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Feature cards data ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: Activity, color: "#39D98A",
    title: "Real-Time Monitoring",
    desc: "Live WebSocket feeds push 15-minute interval data from every campus zone directly to your dashboard.",
    detail: "Our WebSocket pipeline streams sub-meter readings every 15 minutes. You get instant visibility into zone-level consumption spikes, letting your team respond before small issues become big bills.",
    link: "dashboard",
  },
  {
    icon: TrendingUp, color: "#58A6FF",
    title: "Peak Demand Forecasting",
    desc: "Rolling 7-day baseline models predict hourly demand peaks with statistical confidence intervals.",
    detail: "Using a 7-day rolling average baseline, the system forecasts peak demand hours with ±5% accuracy. Confidence intervals let facility managers plan load-shedding or HVAC schedules in advance.",
    link: "analytics",
  },
  {
    icon: Shield, color: "#A78BFA",
    title: "Anomaly Detection",
    desc: "Z-score analysis flags consumption spikes the moment they deviate beyond expected thresholds.",
    detail: "Every reading is scored against its historical Z-score. Deviations beyond 2σ trigger automatic anomaly flags with zone, timestamp, and magnitude — so no abnormal draw goes unnoticed.",
    link: "alerts",
  },
  {
    icon: Leaf, color: "#22D3EE",
    title: "Carbon Optimization",
    desc: "Smart intervention recommendations reduce your campus carbon footprint and slash utility costs.",
    detail: "The recommendations engine converts kWh readings into CO₂ equivalents and suggests concrete actions — e.g., 'Shift AC peak in Lab A to off-peak hours to save 120 kg CO₂/month'.",
    link: "analytics",
  },
  {
    icon: BarChart2, color: "#F0B429",
    title: "Interactive Analytics",
    desc: "Heatmaps, load curves, weekday/weekend patterns — every angle of your energy story visualized.",
    detail: "Drill into 48-hour history charts, weekday vs weekend overlays, and zonal heatmaps. Recharts-powered visuals update live so you always see the freshest data without a page refresh.",
    link: "analytics",
  },
  {
    icon: Bell, color: "#FF6B6B",
    title: "Smart Alert Workflow",
    desc: "Tiered alert system with severity scoring, status pipeline and direct action recommendations.",
    detail: "Alerts are graded Low / Medium / High / Critical. Each alert moves through a status pipeline (Open → Investigating → Resolved) and includes a recommended action so your team always knows the next step.",
    link: "alerts",
  },
];

/* ── Steps data ─────────────────────────────────────────────── */
const STEPS = [
  {
    num: "01", color: "#39D98A",
    title: "Connect Your Grid",
    desc: "Install sub-meters on each zone. Our API ingests readings every 15 minutes via secure WebSocket.",
  },
  {
    num: "02", color: "#58A6FF",
    title: "AI Learns Patterns",
    desc: "The system builds a rolling baseline of normal consumption per zone, hour, and day-of-week.",
  },
  {
    num: "03", color: "#A78BFA",
    title: "Act on Insights",
    desc: "Receive prioritised interventions, resolve alerts, and watch your energy costs fall in real time.",
  },
];

/* ── Ticker data (no emojis) ─────────────────────────────────── */
const TICKERS = [
  "Real-time WebSocket feeds",
  "AI anomaly detection",
  "Interactive heatmaps",
  "Carbon footprint tracking",
  "Smart alert system",
  "Peak demand forecasting",
  "Multi-zone monitoring",
  "Secure and scalable",
];

/* ════════════════════════════════════════════════════════════
   LANDING PAGE
════════════════════════════════════════════════════════════ */
/* ── Feature cards (no expand) ───────────────────────────────── */
function FeatureCard({ feature, index, onGetStarted }) {
  const [hovered, setHovered] = useState(false);
  const { icon: Icon, color, title, desc } = feature;

  return (
    <div
      className="feature-card reveal"
      data-delay={index * 80}
      onMouseEnter={e => {
        setHovered(true);
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.boxShadow = `0 16px 48px ${color}14`;
        e.currentTarget.style.transform = "translateY(-6px)";
      }}
      onMouseLeave={e => {
        setHovered(false);
        e.currentTarget.style.borderColor = "var(--feat-card-border)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="feature-card-icon" style={{
        background: `${color}12`,
        border: `1px solid ${color}25`,
      }}>
        <Icon size={22} color={color} />
      </div>
      <h3 className="feature-card-title">{title}</h3>
      <p className="feature-card-desc">{desc}</p>

      {/* Learn more — navigates to app */}
      <button
        onClick={() => onGetStarted()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          marginTop: 16, padding: "0", background: "none", border: "none",
          fontSize: 12.5, color, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          transition: "gap 0.2s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.gap = "9px"; }}
        onMouseLeave={e => { e.currentTarget.style.gap = "5px"; }}
      >
        Learn more
        <ChevronRight size={14} style={{
          transition: "transform 0.25s ease",
          transform: hovered ? "translateX(3px)" : "translateX(0)",
        }} />
      </button>
    </div>
  );
}

function FeatureGrid({ onGetStarted }) {
  return (
    <div className="features-grid">
      {FEATURES.map((feature, i) => (
        <FeatureCard key={feature.title} feature={feature} index={i} onGetStarted={onGetStarted} />
      ))}
    </div>
  );
}

export default function LandingPage({ onGetStarted, theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="landing-root">
      {/* ── Sticky Nav ──────────────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "linear-gradient(135deg, #39D98A, #22D3EE)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(57,217,138,0.35)",
          }}>
            <Zap size={18} color="#080C10" fill="#080C10" />
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
          }}>Energy<span className="gradient-text" style={{ fontWeight: 500 }}>IQ</span></span>
        </div>

        {/* Desktop nav links */}
        <div className="landing-nav-links">
          {[
            { id: "features",      label: "Features" },
            { id: "how-it-works",  label: "How It Works" },
            { id: "stats",         label: "Results" },
          ].map(({ id, label }) => (
            <button key={id} className="landing-nav-link" onClick={() => scrollTo(id)}>
              {label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={toggleTheme}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36,
              background: "var(--toggle-bg)", border: "1px solid var(--border)",
              borderRadius: 9, cursor: "pointer", transition: "all 0.2s ease",
            }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} color="#F0B429" /> : <Moon size={15} color="#58A6FF" />}
          </button>
          <button
            onClick={onGetStarted}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 20px", borderRadius: 11,
              background: "linear-gradient(135deg, #39D98A, #22D3EE)",
              color: "#080C10", fontSize: 13.5, fontWeight: 700,
              border: "none", cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(57,217,138,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            Sign In <ArrowRight size={14} />
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="landing-mobile-btn"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={18} color="var(--text-primary)" /> : <Menu size={18} color="var(--text-primary)" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown menu ─────────────────────────────── */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed", top: 70, left: 0, right: 0, zIndex: 180,
          background: "var(--bg-glass)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--border)",
          padding: "16px 5%",
          display: "flex", flexDirection: "column", gap: 4,
          animation: "slideDown 0.2s ease",
        }}>
          {[
            { id: "features",     label: "Features" },
            { id: "how-it-works", label: "How It Works" },
            { id: "stats",        label: "Results" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", padding: "12px 0",
              fontSize: 15, fontWeight: 500, color: "var(--text-secondary)",
              textAlign: "left", cursor: "pointer", fontFamily: "'Inter', sans-serif",
              borderBottom: "1px solid var(--border)",
            }}>{label}</button>
          ))}
          <button onClick={onGetStarted} style={{
            marginTop: 12, padding: "13px 0", borderRadius: 11, fontSize: 15, fontWeight: 700,
            background: "linear-gradient(135deg, #39D98A, #22D3EE)",
            color: "#080C10", border: "none", cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}>
            Get Started
          </button>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="landing-hero">
        {/* Background orbs */}
        <div className="auth-bg-orb" style={{
          width: 700, height: 700,
          background: `radial-gradient(circle, var(--landing-orb1) 0%, transparent 60%)`,
          top: "-200px", left: "-200px",
          animation: "float 10s ease-in-out infinite",
        }} />
        <div className="auth-bg-orb" style={{
          width: 600, height: 600,
          background: `radial-gradient(circle, var(--landing-orb2) 0%, transparent 60%)`,
          bottom: "-100px", right: "-100px",
          animation: "float-reverse 12s ease-in-out infinite",
        }} />

        {/* Badge */}
        <div className="landing-hero-badge">
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#39D98A", animation: "pulse-dot 1.5s ease infinite" }} />
          Campus energy intelligence platform
        </div>

        {/* Title */}
        <h1 className="landing-hero-title">
          Monitor every watt.<br />
          <span className="gradient-text">Optimize everything.</span>
        </h1>

        {/* Subtitle */}
        <p className="landing-hero-sub">
          EnergyIQ gives campus facility teams real-time sub-metering, AI-powered anomaly
          detection and predictive analytics — all in one clean, responsive dashboard.
        </p>

        {/* CTA buttons */}
        <div className="landing-cta-group">
          <button className="landing-cta-primary" onClick={onGetStarted}>
            <Zap size={17} fill="currentColor" />
            Get Started
            <ArrowRight size={16} />
          </button>
          <button className="landing-cta-secondary" onClick={() => scrollTo("features")}>
            <Play size={13} fill="currentColor" />
            See Features
          </button>
        </div>

        {/* Stats — realistic numbers */}
        <div className="hero-stats" id="stats">
          {[
            { end: 12,  suffix: "+",  label: "Campuses Monitored" },
            { end: 8,   suffix: "",   label: "Zones Tracked" },
            { end: 28,  suffix: "%",  label: "Avg Cost Reduction" },
            { end: 99,  suffix: "%",  label: "Uptime" },
          ].map(({ end, suffix, label }) => (
            <div key={label} className="hero-stat">
              <span className="hero-stat-number">
                <CountUp end={end} suffix={suffix} />
              </span>
              <div className="hero-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Energy Flow Visual ───────────────────────────────── */}
      <section style={{ padding: "40px 5% 20px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 620, width: "100%", animation: "float 6s ease-in-out infinite" }}>
          <EnergyFlowSVG theme={theme} />
        </div>
      </section>

      {/* ── Ticker ──────────────────────────────────────────── */}
      <div className="ticker-wrapper">
        <div className="ticker-track">
          {[...TICKERS, ...TICKERS].map((text, i) => (
            <div key={i} className="ticker-item">
              <span style={{
                width: 4, height: 4, borderRadius: "50%",
                background: "var(--accent-green)", display: "inline-block", flexShrink: 0,
              }} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="landing-section" id="features">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 52 }}>
            <div className="landing-section-tag">
              <Activity size={11} /> Features
            </div>
            <h2 className="landing-section-title">
              Everything you need to<br />
              <span className="gradient-text">master your energy grid</span>
            </h2>
            <p className="landing-section-sub">
              Six focused modules that transform raw meter data into
              actionable intelligence for your entire campus.
            </p>
          </div>

          <FeatureGrid onGetStarted={onGetStarted} />
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="landing-section" id="how-it-works" style={{
        background: "linear-gradient(135deg, rgba(57,217,138,0.03) 0%, rgba(88,166,255,0.03) 100%)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 52 }}>
            <div className="landing-section-tag">
              <GitBranch size={11} /> Process
            </div>
            <h2 className="landing-section-title">
              Up and running in<br />
              <span className="gradient-text-blue">three simple steps</span>
            </h2>
          </div>

          <div className="steps-container">
            {STEPS.map(({ num, color, title, desc }, i) => (
              <div key={num} className="step-card reveal" data-delay={i * 120}>
                <div className="step-number" style={{
                  background: `${color}12`,
                  border: `2px solid ${color}35`,
                  color, fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {num}
                </div>
                <div>
                  <h3 className="step-title">{title}</h3>
                  <p className="step-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Results strip ───────────────────────────────────── */}
      <section style={{ padding: "80px 5%" }} id="stats">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 44 }}>
            <div className="landing-section-tag">
              <Star size={11} /> Proven Results
            </div>
            <h2 className="landing-section-title" style={{ maxWidth: 540 }}>
              Measurable impact,<br />
              <span className="gradient-text">not just promises</span>
            </h2>
          </div>

          <div className="metric-strip reveal" data-delay="100">
            {[
              { num: 240,  suffix: " MWh", label: "Energy tracked daily",      color: "#39D98A" },
              { num: 124,  suffix: "",     label: "Anomalies flagged this month", color: "#FF6B6B" },
              { num: 18,   suffix: "K",    label: "Cost savings (USD) this year", color: "#F0B429" },
              { num: 94,   suffix: "%",    label: "Prediction accuracy",        color: "#58A6FF" },
            ].map(({ num, suffix, label, color }) => (
              <div key={label} className="metric-item">
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 34, fontWeight: 700, color, marginBottom: 8,
                }}>
                  <CountUp end={num} suffix={suffix} />
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="reveal" data-delay="180" style={{
            marginTop: 36, padding: "28px 36px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 18, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #39D98A, #22D3EE)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 16, fontWeight: 700, color: "#080C10",
            }}>PS</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7, marginBottom: 14, fontStyle: "italic" }}>
                "EnergyIQ cut our campus electricity bill by 28% in the first semester. The anomaly
                alerts caught a faulty HVAC unit in the labs before it became a major repair."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Dr. Priya Sharma</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Facilities Director, Engineering Campus</div>
                </div>
                <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} color="#F0B429" fill="#F0B429" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────────── */}
      <section style={{
        padding: "48px 5%",
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <p className="reveal" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24, textTransform: "uppercase", letterSpacing: 2 }}>
            Built with
          </p>
          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              { label: "React 18",   color: "#61DAFB" },
              { label: "FastAPI",    color: "#39D98A" },
              { label: "WebSockets", color: "#A78BFA" },
              { label: "SQLite",     color: "#F0B429" },
              { label: "Recharts",   color: "#58A6FF" },
              { label: "Vite",       color: "#FF6B6B" },
              { label: "Python",     color: "#22D3EE" },
            ].map(({ label, color }) => (
              <span key={label} className="tech-badge" style={{
                color, borderColor: `${color}30`, background: `${color}08`,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="landing-cta-bg" />
        <div className="reveal" style={{ position: "relative", zIndex: 1, maxWidth: 660, margin: "0 auto", textAlign: "center" }}>
          <div className="landing-section-tag" style={{ justifyContent: "center", margin: "0 auto 24px" }}>
            <CheckCircle size={11} /> Open source
          </div>
          <h2 className="landing-section-title" style={{ marginBottom: 18 }}>
            Ready to optimize<br />
            <span className="gradient-text">your campus energy?</span>
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 36, lineHeight: 1.7 }}>
            Join campuses already using EnergyIQ to cut costs, reduce emissions,
            and gain real-time visibility into every watt consumed.
          </p>
          <button className="landing-cta-primary" onClick={onGetStarted}
            style={{ fontSize: 16, padding: "16px 40px", margin: "0 auto" }}>
            <Zap size={18} fill="currentColor" />
            Launch Dashboard
            <ArrowUpRight size={16} />
          </button>
          <p style={{ marginTop: 18, fontSize: 12.5, color: "var(--text-muted)" }}>
            Runs locally · MIT open source · No cloud dependency
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg, #39D98A, #22D3EE)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={13} color="#080C10" fill="#080C10" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            EnergyIQ
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>© 2026 · Campus Energy Intelligence</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "GitHub", "Docs"].map(link => (
            <span key={link} style={{
              fontSize: 13, color: "var(--text-muted)", cursor: "pointer",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >{link}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
