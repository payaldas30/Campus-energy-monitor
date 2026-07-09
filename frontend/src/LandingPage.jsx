import React, { useState, useEffect, useRef } from "react";
import {
  Zap, ArrowRight, Activity, TrendingUp, Shield, Leaf,
  BarChart2, Bell, ChevronRight, Play, Sun, Moon,
  CheckCircle, Star, ArrowUpRight, Menu, X, GitBranch,
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
function EnergyFlowSVG() {
  return (
    <svg
      viewBox="0 0 600 400"
      style={{ width: "100%", maxWidth: 600, opacity: 0.9 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#39D98A" stopOpacity="0" />
          <stop offset="50%" stopColor="#39D98A" stopOpacity="1" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#58A6FF" stopOpacity="0" />
          <stop offset="50%" stopColor="#58A6FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`h${i}`} x1="0" y1={80 * i} x2="600" y2={80 * i}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={`v${i}`} x1={120 * i} y1="0" x2={120 * i} y2="400"
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {/* Central hub */}
      <circle cx="300" cy="200" r="50" fill="rgba(57,217,138,0.06)" stroke="rgba(57,217,138,0.3)" strokeWidth="1" />
      <circle cx="300" cy="200" r="35" fill="rgba(57,217,138,0.1)" stroke="rgba(57,217,138,0.5)" strokeWidth="1.5" />
      <circle cx="300" cy="200" r="22" fill="rgba(57,217,138,0.2)" />
      <text x="300" y="207" textAnchor="middle" fontSize="20" fill="#39D98A" style={{ filter: "url(#glow)" }}>⚡</text>

      {/* Pulse rings */}
      {[70, 90, 110].map((r, i) => (
        <circle key={i} cx="300" cy="200" r={r}
          fill="none" stroke="#39D98A" strokeWidth="0.5" strokeOpacity="0.3"
          style={{ animation: `pulse-ring ${2 + i * 0.8}s ease-out ${i * 0.6}s infinite` }} />
      ))}

      {/* Connecting paths */}
      {[
        { d: "M300,200 L120,80",  grad: "lineGrad1", delay: 0 },
        { d: "M300,200 L480,80",  grad: "lineGrad2", delay: 0.5 },
        { d: "M300,200 L100,300", grad: "lineGrad1", delay: 1 },
        { d: "M300,200 L500,300", grad: "lineGrad2", delay: 1.5 },
        { d: "M300,200 L300,50",  grad: "lineGrad1", delay: 2 },
        { d: "M300,200 L560,200", grad: "lineGrad2", delay: 0.3 },
      ].map(({ d, grad, delay }, i) => (
        <path key={i} d={d} stroke={`url(#${grad})`} strokeWidth="1.5" fill="none" strokeDasharray="5,3"
          style={{ animation: `energy-flow 3s linear ${delay}s infinite` }} />
      ))}

      {/* Satellite nodes */}
      {[
        { cx: 120, cy: 80,  color: "#39D98A", label: "ADMIN" },
        { cx: 480, cy: 80,  color: "#58A6FF", label: "LABS" },
        { cx: 100, cy: 300, color: "#A78BFA", label: "HOSTEL" },
        { cx: 500, cy: 300, color: "#22D3EE", label: "LIBRARY" },
        { cx: 300, cy: 50,  color: "#F0B429", label: "SOLAR" },
        { cx: 560, cy: 200, color: "#FF6B6B", label: "GRID" },
      ].map(({ cx, cy, color, label }) => (
        <g key={label}>
          <circle cx={cx} cy={cy} r="24" fill={`${color}15`} stroke={`${color}50`} strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="14" fill={`${color}25`} />
          <circle cx={cx} cy={cy} r="5" fill={color} style={{ filter: "url(#glow)" }} />
          <text x={cx} y={cy + 36} textAnchor="middle" fontSize="8" fill={color} fontWeight="600" letterSpacing="1">{label}</text>
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
  },
  {
    icon: TrendingUp, color: "#58A6FF",
    title: "Peak Demand Forecasting",
    desc: "Rolling 7-day baseline models predict hourly demand peaks with statistical confidence intervals.",
  },
  {
    icon: Shield, color: "#A78BFA",
    title: "Anomaly Detection",
    desc: "Z-score analysis flags consumption spikes the moment they deviate beyond expected thresholds.",
  },
  {
    icon: Leaf, color: "#22D3EE",
    title: "Carbon Optimization",
    desc: "Smart intervention recommendations reduce your campus carbon footprint and slash utility costs.",
  },
  {
    icon: BarChart2, color: "#F0B429",
    title: "Interactive Analytics",
    desc: "Heatmaps, load curves, weekday/weekend patterns — every angle of your energy story visualized.",
  },
  {
    icon: Bell, color: "#FF6B6B",
    title: "Smart Alert Workflow",
    desc: "Tiered alert system with severity scoring, status pipeline and direct action recommendations.",
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
          <EnergyFlowSVG />
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

          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <div
                key={title}
                className="feature-card reveal"
                data-delay={i * 80}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${color}40`;
                  e.currentTarget.style.boxShadow = `0 16px 48px ${color}14`;
                  e.currentTarget.style.transform = "translateY(-6px)";
                }}
                onMouseLeave={e => {
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
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  marginTop: 16, fontSize: 12, color, fontWeight: 600, cursor: "pointer",
                }}>
                  Learn more <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
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
                <h3 className="step-title">{title}</h3>
                <p className="step-desc">{desc}</p>
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
