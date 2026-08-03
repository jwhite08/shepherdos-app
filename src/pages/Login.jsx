// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Ico } from "../components/ui/index.jsx";

export default function Login({ t }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${t.bg} 0%, ${t.surface} 100%)`, fontFamily: "'Nunito Sans', sans-serif", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${t.dark}, ${t.primary})`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Ico name="staff" size={28} />
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: t.dark }}>ShepherdOS</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>The tools to shepherd well.</div>
        </div>

        {/* Form */}
        <div style={{ background: t.white, borderRadius: 16, padding: 32, boxShadow: `0 4px 24px rgba(${t.rgb},0.08)`, border: `1px solid ${t.border}` }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 20, fontFamily: "'DM Serif Display', serif", color: t.dark }}>Sign in to your platform</h2>

          {error && (
            <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 5 }}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@yourchurch.org" required
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = t.primary}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 5 }}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = t.primary}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", borderRadius: 10, background: loading ? t.textMuted : t.primary, color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.2s" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, background: t.surface, fontSize: 12, color: t.textMuted, textAlign: "center" }}>
            Demo: <strong>admin@praisecathedral.org</strong> / <strong>admin1234</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
