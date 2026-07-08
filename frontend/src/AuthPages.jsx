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
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(57,217,138,0.15) 0%, transparent 60%)",
        top: "-150px", left: "-150px",
        animation: "float 8s ease-in-out infinite",
      }} />
      <div className="auth-bg-orb" style={{
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(88,166,255,0.12) 0%, transparent 60%)",
        bottom: "-100px", right: "-100px",
        animation: "float 10s ease-in-out infinite reverse",
        animationDelay: "2s",
      }} />
      <div className="auth-bg-orb" style={{
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 60%)",
        top: "30%", left: "40%",
        animation: "float 12s ease-in-out infinite",
        animationDelay: "4s",
      }} />
    </>
  );
}

/* ── Feature pill ───────────────────────────────────────────── */
function FeaturePill({ icon: Icon, label, color, delay }) {
  return (
    <div className="auth-pill" style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "16px 20px",
      background: "rgba(13,17,23,0.5)",
      border: `1px solid ${color}40`,
      borderRadius: 16,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      marginBottom: 14,
      boxShadow: `0 8px 32px rgba(0,0,0,0.2), inset 0 0 20px ${color}05`,
      animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
      animationDelay: `${delay}ms`,
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateX(10px) translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), inset 0 0 20px ${color}20`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateX(0) translateY(0)";
      e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), inset 0 0 20px ${color}05`;
    }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: `linear-gradient(135deg, ${color}20, ${color}50)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 0 15px ${color}40`
      }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontSize: 15, color: "#E6EDF3", fontWeight: 500, letterSpacing: 0.3 }}>{label}</span>
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
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= level ? color : "rgba(255,255,255,0.1)",
            boxShadow: i <= level ? `0 0 10px ${color}80` : "none",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

/* ── Social button ──────────────────────────────────────────── */
function SocialBtn({ icon: Icon, label, color }) {
  return (
    <button style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      flex: 1, padding: "12px 16px",
      background: "rgba(13,17,23,0.5)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      color: "var(--text-secondary)",
      fontSize: 14, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.color = color;
      e.currentTarget.style.background = `${color}15`;
      e.currentTarget.style.transform = "translateY(-3px)";
      e.currentTarget.style.boxShadow = `0 10px 20px ${color}20`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
      e.currentTarget.style.color = "var(--text-secondary)";
      e.currentTarget.style.background = "rgba(13,17,23,0.5)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}>
      <Icon size={18} />
      {label}
    </button>
  );
}

/* ── Input Wrapper ──────────────────────────────────────────── */
function InputField({ icon: Icon, type, placeholder, value, onChange, delay, isPassword }) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ animation: `fadeInUp 0.5s ease both`, animationDelay: `${delay}ms` }}>
      <div style={{ position: "relative", marginTop: 4 }}>
        <Icon size={18} style={{ 
          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", 
          color: focused ? "#58A6FF" : "var(--text-muted)", transition: "color 0.3s ease" 
        }} />
        <input
          type={isPassword && !showPass ? "password" : type}
          placeholder={placeholder}
          value={value} onChange={onChange}
          style={{
            width: "100%", padding: "16px 16px 16px 46px",
            background: focused ? "rgba(13,17,23,0.9)" : "rgba(13,17,23,0.5)", 
            border: `1px solid ${focused ? "#58A6FF" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 14, color: "var(--text-primary)", fontSize: 15,
            transition: "all 0.3s ease", outline: "none",
            boxShadow: focused ? "0 0 0 4px rgba(88,166,255,0.15), inset 0 0 10px rgba(88,166,255,0.1)" : "none"
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
              padding: 4, transition: "color 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Sign In Page ───────────────────────────────────────────── */
export function SignIn({ onSignIn, onGoSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    onSignIn({ email, name: email.split("@")[0] });
  };

  return (
    <div className="auth-root" style={{ background: "var(--bg-page)", overflow: "hidden" }}>
      <BgOrbs />

      {/* Left panel — branding */}
      <div className="auth-left">
        <div style={{ maxWidth: 480 }}>
          <div className="animate-fadeInUp" style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #39D98A, #22D3EE)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 20px rgba(57,217,138,0.4), inset 0 0 10px rgba(255,255,255,0.5)"
              }}>
                <Zap size={24} color="#080C10" fill="#080C10" />
              </div>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: 1
              }}>Energy<span className="gradient-text font-normal" style={{fontWeight: 400}}>IQ</span></span>
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 54, fontWeight: 800,
              color: "var(--text-primary)", lineHeight: 1.1,
              marginBottom: 20, letterSpacing: -1.5
            }}>
              Monitor campus<br />
              <span className="gradient-text glow-text">energy in real-time</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "95%" }}>
              AI-powered anomaly detection, live WebSocket feeds, and predictive
              analytics — all in one visually stunning dashboard.
            </p>
          </div>

          <div>
            <FeaturePill icon={Activity} label="Live 15-minute zone monitoring" color="#39D98A" delay={200} />
            <FeaturePill icon={TrendingUp} label="Forecast peak demand with AI" color="#58A6FF" delay={350} />
            <FeaturePill icon={Shield} label="Anomaly detection & smart alerts" color="#A78BFA" delay={500} />
            <FeaturePill icon={Leaf} label="Reduce carbon footprint & costs" color="#22D3EE" delay={650} />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card" style={{
          background: "var(--bg-glass)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)",
          borderRadius: 24,
          padding: "40px",
          width: "100%", maxWidth: 440,
          animation: "scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both"
        }}>
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8
            }}>Welcome Back</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Sign in to manage your grid</p>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <SocialBtn icon={Github} label="GitHub" color="#E6EDF3" />
            <SocialBtn icon={Chrome} label="Google" color="#FF6B6B" />
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 12, margin: "24px 0",
            color: "var(--text-muted)", fontSize: 12, fontWeight: 500, textTransform: "uppercase"
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField icon={Mail} type="email" placeholder="name@university.edu" value={email} onChange={e => setEmail(e.target.value)} delay={100} />
            <div>
              <InputField icon={Lock} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} delay={200} isPassword />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <a href="#" style={{ color: "#58A6FF", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>Forgot password?</a>
              </div>
            </div>

            {error && (
              <div style={{
                color: "#FF6B6B", fontSize: 14, background: "rgba(255,107,107,0.15)",
                padding: "12px", borderRadius: 12, border: "1px solid rgba(255,107,107,0.3)",
                animation: "shake 0.4s ease", textAlign: "center", fontWeight: 500
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "16px", marginTop: 16,
                background: "linear-gradient(135deg, #39D98A, #22D3EE, #58A6FF)",
                backgroundSize: "200% auto",
                border: "none", borderRadius: 14,
                color: "#080C10", fontSize: 16, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                boxShadow: "0 8px 20px rgba(57,217,138,0.4), inset 0 0 10px rgba(255,255,255,0.4)",
                animation: "fadeInUp 0.5s ease both, gradient-x 3s linear infinite",
                animationDelay: "400ms",
              }}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 25px rgba(57,217,138,0.6), inset 0 0 15px rgba(255,255,255,0.5)"; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(57,217,138,0.4), inset 0 0 10px rgba(255,255,255,0.4)"; } }}
            >
              {loading ? (
                <div style={{ width: 22, height: 22, border: "3px solid rgba(8,12,16,0.2)", borderTopColor: "#080C10", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite" }} />
              ) : (
                <>Sign in securely <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p style={{
            textAlign: "center", marginTop: 32, fontSize: 14, color: "var(--text-muted)",
            animation: "fadeInUp 0.5s ease both", animationDelay: "500ms"
          }}>
            Don't have an account?{" "}
            <button onClick={onGoSignUp} style={{
              background: "none", border: "none", color: "#39D98A", fontSize: 14,
              fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4
            }}>
              Request access
            </button>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    onSignUp({ email, name });
  };

  return (
    <div className="auth-root" style={{ background: "var(--bg-page)", overflow: "hidden" }}>
      <BgOrbs />

      <div className="auth-left">
        <div style={{ maxWidth: 480 }}>
          <div className="animate-fadeInUp" style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #58A6FF, #A78BFA)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 20px rgba(88,166,255,0.4), inset 0 0 10px rgba(255,255,255,0.5)"
              }}>
                <Zap size={24} color="#080C10" fill="#080C10" />
              </div>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: 1
              }}>Energy<span className="gradient-text font-normal" style={{fontWeight: 400}}>IQ</span></span>
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 54, fontWeight: 800,
              color: "var(--text-primary)", lineHeight: 1.1,
              marginBottom: 20, letterSpacing: -1.5
            }}>
              Join the <br />
              <span className="gradient-text glow-text" style={{ background: "linear-gradient(135deg, #58A6FF, #A78BFA)", backgroundClip: "text", WebkitBackgroundClip: "text" }}>energy revolution</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "95%" }}>
              Get comprehensive visibility into campus consumption. Automate anomaly resolution and cut utility costs.
            </p>
          </div>
          
          <div style={{
            background: "rgba(13,17,23,0.5)", border: "1px solid rgba(88,166,255,0.2)",
            borderRadius: 16, padding: "24px", backdropFilter: "blur(20px)",
            animation: "fadeInUp 0.6s ease both", animationDelay: "300ms",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3), inset 0 0 20px rgba(88,166,255,0.05)"
          }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#58A6FF20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={20} color="#58A6FF" />
              </div>
              <div>
                <h4 style={{ color: "#E6EDF3", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Trusted by 50+ campuses</h4>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>Join leading universities using EnergyIQ to manage millions of square feet in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card" style={{
          background: "var(--bg-glass)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)",
          borderRadius: 24,
          padding: "40px",
          width: "100%", maxWidth: 440,
          animation: "scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both"
        }}>
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8
            }}>Request Access</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Create your facility manager account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField icon={User} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} delay={100} />
            <InputField icon={Mail} type="email" placeholder="name@university.edu" value={email} onChange={e => setEmail(e.target.value)} delay={200} />
            <div style={{ animation: "fadeInUp 0.5s ease both", animationDelay: "300ms" }}>
              <InputField icon={Lock} type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} delay={0} isPassword />
              <PasswordStrength password={password} />
            </div>

            {error && (
              <div style={{
                color: "#FF6B6B", fontSize: 14, background: "rgba(255,107,107,0.15)",
                padding: "12px", borderRadius: 12, border: "1px solid rgba(255,107,107,0.3)",
                animation: "shake 0.4s ease", textAlign: "center", fontWeight: 500
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "16px", marginTop: 16,
                background: "linear-gradient(135deg, #58A6FF, #A78BFA)",
                backgroundSize: "200% auto",
                border: "none", borderRadius: 14,
                color: "#080C10", fontSize: 16, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                boxShadow: "0 8px 20px rgba(88,166,255,0.4), inset 0 0 10px rgba(255,255,255,0.4)",
                animation: "fadeInUp 0.5s ease both, gradient-x 3s linear infinite",
                animationDelay: "500ms",
              }}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 25px rgba(88,166,255,0.6), inset 0 0 15px rgba(255,255,255,0.5)"; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(88,166,255,0.4), inset 0 0 10px rgba(255,255,255,0.4)"; } }}
            >
              {loading ? (
                <div style={{ width: 22, height: 22, border: "3px solid rgba(8,12,16,0.2)", borderTopColor: "#080C10", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite" }} />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p style={{
            textAlign: "center", marginTop: 32, fontSize: 14, color: "var(--text-muted)",
            animation: "fadeInUp 0.5s ease both", animationDelay: "600ms"
          }}>
            Already have an account?{" "}
            <button onClick={onGoSignIn} style={{
              background: "none", border: "none", color: "#58A6FF", fontSize: 14,
              fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4
            }}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
