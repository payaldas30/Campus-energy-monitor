import React, { useState, useEffect } from "react";
import {
  Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Leaf, Shield, TrendingUp, Activity, Github, Chrome,
  CheckCircle,
} from "lucide-react";

/* ── Animated background orbs ───────────────────────────────── */
function BgOrbs() {
  return (
    <>
      <div className="auth-bg-orb" style={{
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(57,217,138,0.12) 0%, transparent 70%)",
        top: "-150px", left: "-100px",
        animation: "float 8s ease-in-out infinite",
      }} />
      <div className="auth-bg-orb" style={{
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(88,166,255,0.1) 0%, transparent 70%)",
        bottom: "0px", right: "200px",
        animation: "float 10s ease-in-out infinite reverse",
        animationDelay: "2s",
      }} />
      <div className="auth-bg-orb" style={{
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
        top: "40%", left: "30%",
        animation: "float 12s ease-in-out infinite",
        animationDelay: "4s",
      }} />
    </>
  );
}

/* ── Feature pill ───────────────────────────────────────────── */
function FeaturePill({ icon: Icon, label, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px",
      background: "rgba(13,17,23,0.6)",
      border: `1px solid ${color}30`,
      borderRadius: 12,
      backdropFilter: "blur(12px)",
      marginBottom: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={16} color={color} />
      </div>
      <span style={{ fontSize: 13.5, color: "#CDD9E5", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ── Password strength meter ────────────────────────────────── */
function PasswordStrength({ password }) {
  const getStrength = (p) => {
    if (!p) return { level: 0, label: "", color: "transparent" };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: "Weak", color: "#FF6B6B" },
      { label: "Fair", color: "#F0B429" },
      { label: "Good", color: "#58A6FF" },
      { label: "Strong", color: "#39D98A" },
    ];
    return { level: score, ...levels[Math.min(score - 1, 3)] };
  };

  const { level, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= level ? color : "var(--border)",
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ── Social button ──────────────────────────────────────────── */
function SocialBtn({ icon: Icon, label, color }) {
  return (
    <button style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      flex: 1, padding: "11px 16px",
      background: "var(--bg-input)",
      border: "1px solid var(--border-input)",
      borderRadius: 12,
      color: "var(--text-secondary)",
      fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.color = color;
      e.currentTarget.style.background = `${color}10`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = "var(--border-input)";
      e.currentTarget.style.color = "var(--text-secondary)";
      e.currentTarget.style.background = "var(--bg-input)";
    }}>
      <Icon size={15} />
      {label}
    </button>
  );
}

/* ── Sign In Page ───────────────────────────────────────────── */
export function SignIn({ onSignIn, onGoSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    // Simulate auth (replace with real API call)
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onSignIn({ email, name: email.split("@")[0] });
  };

  return (
    <div className="auth-root" style={{ background: "var(--bg-page)" }}>
      <BgOrbs />

      {/* Left panel — branding */}
      <div className="auth-left">
        <div style={{ maxWidth: 460 }}>
          <div className="animate-fadeInUp" style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, #39D98A, #22D3EE)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={22} color="#080C10" fill="#080C10" />
              </div>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20, fontWeight: 700, color: "var(--text-primary)",
              }}>EnergyIQ</span>
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 38, fontWeight: 700,
              color: "var(--text-primary)", lineHeight: 1.2,
              marginBottom: 16,
            }}>
              Monitor your campus<br />
              <span className="gradient-text">energy in real-time</span>
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              AI-powered anomaly detection, live WebSocket feeds, and predictive
              analytics — all in one dashboard.
            </p>
          </div>

          <div className="animate-fadeInUp delay-200">
            <FeaturePill icon={Activity} label="Live 15-minute zone monitoring" color="#39D98A" />
            <FeaturePill icon={TrendingUp} label="Forecast peak demand with AI" color="#58A6FF" />
            <FeaturePill icon={Shield} label="Anomaly detection & smart alerts" color="#A78BFA" />
            <FeaturePill icon={Leaf} label="Reduce carbon footprint & costs" color="#22D3EE" />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card animate-slideRight">
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 26, fontWeight: 700,
              color: "var(--text-primary)", marginBottom: 8,
            }}>Welcome back</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Sign in to your EnergyIQ account
            </p>
          </div>

          {/* Social logins */}
          <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <SocialBtn icon={Github} label="GitHub" color="#7D8590" />
            <SocialBtn icon={Chrome} label="Google" color="#4285F4" />
          </div>

          <div className="auth-divider">or continue with email</div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="you@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="auth-input-wrap" style={{ position: "relative" }}>
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPass ? "text" : "password"}
                className="auth-input"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "var(--text-muted)", cursor: "pointer", padding: 0,
                  display: "flex",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot */}
            <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
              <button type="button" className="auth-link" style={{ fontSize: 12 }}>
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.3)",
                color: "#FF6B6B", fontSize: 13, marginBottom: 16,
              }}>{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-glow"
              disabled={loading}
              style={{
                width: "100%", padding: "14px",
                fontSize: 15, letterSpacing: 0.2,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(8,12,16,0.3)",
                    borderTopColor: "#080C10",
                    animation: "spin-slow 0.6s linear infinite",
                  }} />
                  Signing in…
                </>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13.5, color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            <button className="auth-link" onClick={onGoSignUp}>Create one</button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Sign Up Page ───────────────────────────────────────────── */
export function SignUp({ onSignUp, onGoSignIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) { setError("Please fill in all fields."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!agreed) { setError("Please accept the terms to continue."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    onSignUp({ email, name });
  };

  return (
    <div className="auth-root" style={{ background: "var(--bg-page)" }}>
      <BgOrbs />

      {/* Left panel */}
      <div className="auth-left">
        <div style={{ maxWidth: 460 }}>
          <div className="animate-fadeInUp" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, #39D98A, #22D3EE)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={22} color="#080C10" fill="#080C10" />
              </div>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20, fontWeight: 700, color: "var(--text-primary)",
              }}>EnergyIQ</span>
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 36, fontWeight: 700,
              color: "var(--text-primary)", lineHeight: 1.25, marginBottom: 16,
            }}>
              Join thousands of<br />
              <span className="gradient-text">energy-conscious</span> campuses
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Get started for free. Set up in minutes. No credit card required.
            </p>
          </div>

          {/* Checklist */}
          <div className="animate-fadeInUp delay-200" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Real-time energy readings via WebSocket",
              "AI-powered anomaly detection",
              "14-day historical analytics",
              "Smart intervention recommendations",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle size={18} color="#39D98A" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card animate-slideRight">
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 26, fontWeight: 700,
              color: "var(--text-primary)", marginBottom: 8,
            }}>Create account</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Start monitoring your campus today
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <SocialBtn icon={Github} label="GitHub" color="#7D8590" />
            <SocialBtn icon={Chrome} label="Google" color="#4285F4" />
          </div>
          <div className="auth-divider">or register with email</div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                type="text"
                className="auth-input"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="you@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPass ? "text" : "password"}
                className="auth-input"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={password} />

            {/* Confirm */}
            <div className="auth-input-wrap" style={{ marginTop: 8 }}>
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showConfirm ? "text" : "password"}
                className="auth-input"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={{
                  paddingRight: 44,
                  borderColor: confirm && confirm !== password ? "#FF6B6B" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex",
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Terms */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              marginTop: 16, marginBottom: 20, cursor: "pointer",
            }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: "#39D98A", width: 14, height: 14 }}
              />
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                I agree to the{" "}
                <button type="button" className="auth-link" style={{ fontSize: 12.5 }}>Terms of Service</button>
                {" "}and{" "}
                <button type="button" className="auth-link" style={{ fontSize: 12.5 }}>Privacy Policy</button>
              </span>
            </label>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.3)",
                color: "#FF6B6B", fontSize: 13, marginBottom: 16,
              }}>{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-glow"
              disabled={loading}
              style={{
                width: "100%", padding: "14px",
                fontSize: 15, letterSpacing: 0.2,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(8,12,16,0.3)",
                    borderTopColor: "#080C10",
                    animation: "spin-slow 0.6s linear infinite",
                  }} />
                  Creating account…
                </>
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <button className="auth-link" onClick={onGoSignIn}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
