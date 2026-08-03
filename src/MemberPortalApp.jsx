// src/MemberPortalApp.jsx
// Completely separate from the admin app.
// Accessed at /portal — has its own login, registration, and views.

import { useState, useEffect, useMemo, useCallback } from "react";
import { memberAuth, portal, getMemberToken, setMemberToken, removeMemberToken } from "./lib/portalApi.js";

// ─── Theme (matches admin but derived from org) ───────────────
const PRESET_THEMES = [
  { primary: "#5B2D8E", accent: "#C9A84C", bg: "#FAF8FC", surface: "#F3EEF8" },
  { primary: "#1A5276", accent: "#E67E22", bg: "#F5F8FA", surface: "#E8EFF5" },
  { primary: "#2D5F2D", accent: "#B8860B", bg: "#F5F8F5", surface: "#E5EFE5" },
  { primary: "#8B1A1A", accent: "#D4A843", bg: "#FDF8F5", surface: "#F5E8E8" },
  { primary: "#1C1C2E", accent: "#6C63FF", bg: "#F8F8FC", surface: "#EEEEF5" },
  { primary: "#6B4226", accent: "#C17817", bg: "#FBF8F4", surface: "#F0E8DD" },
];

function makeTheme(primary = "#5B2D8E", accent = "#C9A84C") {
  const found = PRESET_THEMES.find(p => p.primary === primary) || PRESET_THEMES[0];
  const hex2rgb = h => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return`${r},${g},${b}`; };
  const darken  = (h,p) => { let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); r=Math.round(r*(1-p));g=Math.round(g*(1-p));b=Math.round(b*(1-p)); return`#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`; };
  return { ...found, primary: found.primary, accent: found.accent, dark: darken(found.primary, 0.3), rgb: hex2rgb(found.primary), text: "#2A2535", textMuted: "#7A7488", border: "#E4DFE9", success: "#2E7D4F", danger: "#C04040", warning: "#C68A0A", white: "#FFFFFF" };
}

const TYPE_LABELS   = { TITHE:"Tithe", OFFERING:"Offering", BUILDING_FUND:"Building Fund", MISSIONS:"Missions", BENEVOLENCE:"Benevolence", YOUTH_FUND:"Youth Fund", OTHER:"Other" };
const METHOD_LABELS = { CASH:"Cash", CHECK:"Check", ONLINE:"Online", ACH:"ACH", CARD:"Card", OTHER:"Other" };
const TYPE_COLORS   = { Worship:"#4338CA", Study:"#0369A1", Youth:"#92400E", Conference:"#7E22CE", Fellowship:"#166534", Training:"#854D0E", Outreach:"#0F766E", General:"#475569" };

// ─── Shared UI ────────────────────────────────────────────────
const Spinner = ({ t }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
    <div style={{ width:28, height:28, borderRadius:"50%", border:`3px solid ${t.surface}`, borderTopColor:t.primary, animation:"spin 0.7s linear infinite" }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const StaffIcon = ({ size=24, color="#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V7"/><path d="M12 7c0-2.5 2-4 4-4s4 1.5 4 3.5c0 2.5-2.5 3.5-4 3.5"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function MemberPortalApp() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [org,     setOrg]     = useState(null);
  const [tokenAction, setTokenAction] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    const reset  = params.get("reset");
    if (invite) return { type: "invite", token: invite };
    if (reset)  return { type: "reset",  token: reset };
    return null;
  });

  useEffect(() => {
    const token = getMemberToken();
    if (!token) { setLoading(false); return; }
    memberAuth.me()
      .then(data => { setUser(data); setOrg(data.organization); })
      .catch(() => removeMemberToken())
      .finally(() => setLoading(false));
  }, []);

  const t = useMemo(() => makeTheme(org?.primaryColor, org?.accentColor), [org]);

  const handleLogin = (userData) => { setUser(userData); setOrg(userData.organization); setTokenAction(null); };
  const handleLogout = () => { removeMemberToken(); setUser(null); setOrg(null); };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#FAF8FC" }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid #F3EEF8", borderTopColor:"#5B2D8E", animation:"spin 0.7s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      {user
        ? <Portal t={t} user={user} org={org} onLogout={handleLogout} />
        : tokenAction
          ? <SetPasswordScreen t={t} action={tokenAction} onLogin={handleLogin} />
          : <AuthScreen t={t} onLogin={handleLogin} />
      }
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SET PASSWORD SCREEN (from invite or password reset email link)
// ═══════════════════════════════════════════════════════════════
function SetPasswordScreen({ t, action, onLogin }) {
  const isInvite = action.type === "invite";
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== password2) { setError("Passwords do not match."); return; }
    if (password.length < 8)    { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const data = isInvite
        ? await memberAuth.acceptInvite(action.token, password)
        : await memberAuth.resetPassword(action.token, password);
      setMemberToken(data.token);
      window.history.replaceState({}, "", "/portal");
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${t.border}`, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg, ${t.bg} 0%, ${t.surface} 100%)`, fontFamily:"'Nunito Sans',sans-serif", padding:24 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:`linear-gradient(135deg, ${t.dark}, ${t.primary})`, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <StaffIcon size={26}/>
          </div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:t.dark }}>{isInvite ? "Set Up Your Account" : "Reset Your Password"}</div>
          <div style={{ fontSize:13, color:t.textMuted, marginTop:4 }}>{isInvite ? "Choose a password to activate your Member Portal account." : "Choose a new password for your account."}</div>
        </div>

        <div style={{ background:t.white, borderRadius:16, padding:32, boxShadow:`0 4px 24px rgba(${t.rgb},0.08)`, border:`1px solid ${t.border}` }}>
          {error && <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:9, background:"#FEF2F2", border:"1px solid #FECACA", color:t.danger, fontSize:13 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:5 }}>New Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="At least 8 characters" required style={inputStyle}
                onFocus={e=>e.target.style.borderColor=t.primary} onBlur={e=>e.target.style.borderColor=t.border}/>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:5 }}>Confirm Password</label>
              <input value={password2} onChange={e=>setPassword2(e.target.value)} type="password" placeholder="Repeat password" required style={inputStyle}
                onFocus={e=>e.target.style.borderColor=t.primary} onBlur={e=>e.target.style.borderColor=t.border}/>
            </div>
            <button type="submit" disabled={loading} style={{ width:"100%", padding:12, borderRadius:10, background:loading?t.textMuted:t.primary, color:"#fff", border:"none", fontSize:15, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
              {loading ? "Saving..." : isInvite ? "Activate Account" : "Reset Password"}
            </button>
          </form>
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:t.textMuted }}>
          <a href="/portal" style={{ color:t.primary, textDecoration:"none" }}>← Back to Sign In</a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH SCREEN (login + register)
// ═══════════════════════════════════════════════════════════════
function AuthScreen({ t, onLogin }) {
  const [mode,      setMode]      = useState("login"); // login | register
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await memberAuth.login(email, password);
      setMemberToken(data.token);
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password !== password2) { setError("Passwords do not match."); return; }
    if (password.length < 8)    { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const data = await memberAuth.register({ email, password });
      setMemberToken(data.token);
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${t.border}`, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg, ${t.bg} 0%, ${t.surface} 100%)`, fontFamily:"'Nunito Sans',sans-serif", padding:24 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:`linear-gradient(135deg, ${t.dark}, ${t.primary})`, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <StaffIcon size={26}/>
          </div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:t.dark }}>Member Portal</div>
          <div style={{ fontSize:13, color:t.textMuted, marginTop:4 }}>The tools to shepherd well.</div>
        </div>

        {/* Card */}
        <div style={{ background:t.white, borderRadius:16, padding:32, boxShadow:`0 4px 24px rgba(${t.rgb},0.08)`, border:`1px solid ${t.border}` }}>
          {/* Tab switcher */}
          <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${t.border}`, marginBottom:24 }}>
            {[["login","Sign In"],["register","Create Account"]].map(([m,label])=>(
              <button key={m} onClick={()=>{ setMode(m); setError(""); setSuccess(""); }}
                style={{ flex:1, padding:"10px", border:"none", background:mode===m?t.primary:t.white, color:mode===m?"#fff":t.textMuted, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:mode===m?600:400, transition:"all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>

          {error && <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:9, background:"#FEF2F2", border:"1px solid #FECACA", color:t.danger, fontSize:13 }}>{error}</div>}
          {success && <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:9, background:"#E8F5EE", border:`1px solid ${t.success}`, color:t.success, fontSize:13 }}>{success}</div>}

          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:5 }}>Email Address</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="your@email.com" required style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=t.primary} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:5 }}>Password</label>
                <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" required style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=t.primary} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <button type="submit" disabled={loading} style={{ width:"100%", padding:12, borderRadius:10, background:loading?t.textMuted:t.primary, color:"#fff", border:"none", fontSize:15, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
                {loading?"Signing in...":"Sign In"}
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom:5, padding:"12px 14px", borderRadius:9, background:"#EFF6FF", border:"1px solid #BFDBFE", fontSize:12, color:"#1E40AF" }}>
                📋 Your email must match the one on file with your church. Contact your administrator if you need help.
              </div>
              <div style={{ marginBottom:14, marginTop:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:5 }}>Email Address</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="your@email.com" required style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=t.primary} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:5 }}>Create Password</label>
                <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="At least 8 characters" required style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=t.primary} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:5 }}>Confirm Password</label>
                <input value={password2} onChange={e=>setPassword2(e.target.value)} type="password" placeholder="Repeat password" required style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=t.primary} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <button type="submit" disabled={loading} style={{ width:"100%", padding:12, borderRadius:10, background:loading?t.textMuted:t.primary, color:"#fff", border:"none", fontSize:15, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
                {loading?"Creating Account...":"Create My Account"}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:t.textMuted }}>
          <a href="/" style={{ color:t.primary, textDecoration:"none" }}>← Admin Login</a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PORTAL SHELL
// ═══════════════════════════════════════════════════════════════
function Portal({ t, user, org, onLogout }) {
  const [tab, setTab] = useState("profile");
  const tabs = [
    { id:"profile", label:"My Profile",   emoji:"👤" },
    { id:"giving",  label:"My Giving",    emoji:"💰" },
    { id:"events",  label:"Events",       emoji:"📅" },
    { id:"family",  label:"My Family",    emoji:"👨‍👩‍👧" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:t.bg, fontFamily:"'Nunito Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${t.dark}, ${t.primary})`, color:"#fff" }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0", borderBottom:"1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <StaffIcon size={20}/>
              <div>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16 }}>{org.name}</div>
                <div style={{ fontSize:9, opacity:0.6, textTransform:"uppercase", letterSpacing:"0.14em" }}>Member Portal</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"6px 14px", color:"#fff", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
              Sign Out
            </button>
          </div>
          <div style={{ padding:"20px 0 0" }}>
            <div style={{ fontSize:13, opacity:0.7 }}>Welcome back,</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, marginBottom:16 }}>
              {user.firstName} {user.lastName}
            </div>
            {/* Nav tabs */}
            <div style={{ display:"flex", gap:4 }}>
              {tabs.map(tab_item => (
                <button key={tab_item.id} onClick={() => setTab(tab_item.id)}
                  style={{ padding:"10px 18px", border:"none", background:tab===tab_item.id?"rgba(255,255,255,0.2)":"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:tab===tab_item.id?600:400, borderRadius:"8px 8px 0 0", transition:"all 0.15s" }}>
                  {tab_item.emoji} {tab_item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>
        {tab === "profile" && <ProfileTab t={t} user={user} />}
        {tab === "giving"  && <GivingTab  t={t} />}
        {tab === "events"  && <EventsTab  t={t} />}
        {tab === "family"  && <FamilyTab  t={t} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════════════════════
function ProfileTab({ t, user }) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    portal.getProfile()
      .then(data => { setProfile(data); setForm({ phone: data.phone||"", address: data.address||"", city: data.city||"", state: data.state||"", zip: data.zip||"", email: data.email||"" }); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const updated = await portal.updateProfile(form);
      setProfile(updated);
      setEditing(false);
      setSuccess("Your profile has been updated.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = { width:"100%", padding:"9px 13px", borderRadius:9, border:`1px solid ${t.border}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const card = { background:t.white, borderRadius:14, padding:24, border:`1px solid ${t.border}`, marginBottom:18 };

  if (loading) return <Spinner t={t}/>;

  return (
    <div>
      {error   && <div style={{ marginBottom:16, padding:"12px 16px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA", color:t.danger, fontSize:13 }}>{error}</div>}
      {success && <div style={{ marginBottom:16, padding:"12px 16px", borderRadius:10, background:"#E8F5EE", border:`1px solid ${t.success}`, color:t.success, fontSize:13 }}>✓ {success}</div>}

      <div style={card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h2 style={{ margin:0, fontFamily:"'DM Serif Display',serif", fontSize:20, color:t.dark }}>Personal Information</h2>
          {!editing
            ? <button onClick={()=>setEditing(true)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${t.border}`, background:t.white, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", color:t.primary }}>Edit Info</button>
            : <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setEditing(false)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${t.border}`, background:t.white, cursor:"pointer", fontSize:12, fontFamily:"inherit", color:t.textMuted }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding:"7px 16px", borderRadius:8, border:"none", background:t.primary, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit" }}>{saving?"Saving...":"Save Changes"}</button>
              </div>
          }
        </div>

        {!editing ? (
          <div>
            {[
              ["Full Name",    `${profile.firstName} ${profile.lastName}`],
              ["Email",        profile.email || "—"],
              ["Phone",        profile.phone || "—"],
              ["Address",      [profile.address, profile.city, profile.state, profile.zip].filter(Boolean).join(", ") || "—"],
              ["Member Since", profile.joinDate ? new Date(profile.joinDate).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }) : "—"],
              ["Status",       profile.memberStatus?.replace("_"," ")],
            ].map(([label, value]) => (
              <div key={label} style={{ display:"flex", padding:"10px 0", borderBottom:`1px solid ${t.border}` }}>
                <span style={{ width:130, fontSize:11, color:t.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", flexShrink:0 }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:500 }}>{value}</span>
              </div>
            ))}
            {profile.subDepartments?.length > 0 && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, color:t.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Ministry Involvement</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {profile.subDepartments.map(sd => (
                    <span key={sd.subDepartmentId} style={{ padding:"4px 12px", borderRadius:20, background:t.surface, fontSize:12, fontWeight:500 }}>
                      {sd.subDepartment.ministry.icon} {sd.subDepartment.ministry.name} — {sd.subDepartment.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { key:"email",   label:"Email",   type:"email",  span:true },
              { key:"phone",   label:"Phone",   type:"text" },
              { key:"address", label:"Address", type:"text",   span:true },
              { key:"city",    label:"City",    type:"text" },
              { key:"state",   label:"State",   type:"text" },
              { key:"zip",     label:"ZIP",     type:"text" },
            ].map(f => (
              <div key={f.key} style={f.span?{gridColumn:"1/-1"}:{}}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:t.textMuted, marginBottom:4 }}>{f.label}</label>
                <input value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} type={f.type} style={{ ...inputStyle, width:"100%" }}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GIVING TAB
// ═══════════════════════════════════════════════════════════════
function GivingTab({ t }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [year,    setYear]    = useState(String(new Date().getFullYear()));

  useEffect(() => {
    setLoading(true);
    portal.getGiving({ year })
      .then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, [year]);

  if (loading) return <Spinner t={t}/>;
  if (error)   return <div style={{ padding:20, color:t.danger }}>{error}</div>;

  const { contributions, total, byType } = data;

  return (
    <div>
      {/* Summary */}
      <div style={{ display:"flex", gap:14, marginBottom:22, flexWrap:"wrap" }}>
        {[
          { label:"YTD Total", value:`$${total.toLocaleString()}`, color:t.success },
          { label:"Contributions", value:contributions.length },
          { label:"Avg. Gift", value:contributions.length>0?`$${Math.round(total/contributions.length).toLocaleString()}`:"—" },
        ].map(s => (
          <div key={s.label} style={{ background:t.white, borderRadius:12, padding:"16px 20px", border:`1px solid ${t.border}`, flex:1, minWidth:140 }}>
            <div style={{ fontSize:11, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:700, marginTop:4, color:s.color||t.dark }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* By Type breakdown */}
      {Object.keys(byType).length > 0 && (
        <div style={{ background:t.white, borderRadius:12, padding:"18px 20px", border:`1px solid ${t.border}`, marginBottom:20 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Breakdown by Fund</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([type,amt])=>(
              <div key={type} style={{ padding:"8px 14px", borderRadius:9, background:t.surface, border:`1px solid ${t.border}` }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{TYPE_LABELS[type]||type}</div>
                <div style={{ fontSize:12, color:t.success, fontWeight:700 }}>${amt.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year selector + statement */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <select value={year} onChange={e=>setYear(e.target.value)}
          style={{ padding:"8px 12px", borderRadius:9, border:`1px solid ${t.border}`, fontSize:12, fontFamily:"inherit", background:t.white, cursor:"pointer" }}>
          {["2026","2025","2024","2023"].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <button style={{ padding:"8px 16px", borderRadius:9, border:`1px solid ${t.border}`, background:t.white, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", color:t.primary, display:"flex", alignItems:"center", gap:6 }}>
          📄 Download Tax Statement
        </button>
      </div>

      {/* Contribution list */}
      <div style={{ background:t.white, borderRadius:12, border:`1px solid ${t.border}`, overflow:"hidden" }}>
        {contributions.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:t.textMuted, fontSize:14 }}>No contributions recorded for {year}.</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:t.surface }}>
                {["Date","Fund","Method","Amount"].map(h=>(
                  <th key={h} style={{ textAlign:"left", padding:"11px 16px", fontWeight:700, fontSize:10, textTransform:"uppercase", color:t.primary, letterSpacing:"0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contributions.map(c=>(
                <tr key={c.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                  <td style={{ padding:"10px 16px" }}>{new Date(c.date).toLocaleDateString()}</td>
                  <td style={{ padding:"10px 16px" }}>
                    <span style={{ padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600, background:c.type==="TITHE"?"#E8F5EE":t.surface, color:c.type==="TITHE"?t.success:t.primary }}>
                      {TYPE_LABELS[c.type]||c.type}
                    </span>
                  </td>
                  <td style={{ padding:"10px 16px", color:t.textMuted }}>{METHOD_LABELS[c.method]||c.method}</td>
                  <td style={{ padding:"10px 16px", fontWeight:700, color:t.success }}>${Number(c.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EVENTS TAB
// ═══════════════════════════════════════════════════════════════
function EventsTab({ t }) {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [acting,   setActing]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    portal.getEvents()
      .then(d => setEvents(d.events||[]))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRegister = async (eventId) => {
    setActing(eventId); setError("");
    try {
      await portal.registerEvent(eventId);
      load();
    } catch (e) { setError(e.message); }
    finally { setActing(null); }
  };

  const handleCancel = async (eventId) => {
    setActing(eventId); setError("");
    try {
      await portal.cancelEvent(eventId);
      load();
    } catch (e) { setError(e.message); }
    finally { setActing(null); }
  };

  if (loading) return <Spinner t={t}/>;

  return (
    <div>
      {error && <div style={{ marginBottom:16, padding:"12px 16px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA", color:t.danger, fontSize:13 }}>{error}</div>}
      <h2 style={{ margin:"0 0 18px", fontFamily:"'DM Serif Display',serif", fontSize:22, color:t.dark }}>Upcoming Events</h2>
      {events.length === 0 ? (
        <div style={{ padding:48, textAlign:"center", color:t.textMuted, background:t.white, borderRadius:14, border:`1px solid ${t.border}` }}>No upcoming events at this time.</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:14 }}>
          {events.map(e => {
            const myReg  = e.myRegistration;
            const full   = e.capacity && e.registrationCount >= e.capacity && !myReg;
            const color  = TYPE_COLORS[e.type] || "#475569";
            const capPct = e.capacity ? Math.round((e.registrationCount/e.capacity)*100) : null;
            return (
              <div key={e.id} style={{ background:t.white, borderRadius:14, padding:"20px", border:`1px solid ${t.border}`, borderLeft:`4px solid ${color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <span style={{ fontSize:10, padding:"3px 9px", borderRadius:20, fontWeight:600, textTransform:"uppercase", background:`${color}18`, color }}>
                    {e.type}
                  </span>
                  {myReg && (
                    <span style={{ fontSize:10, padding:"3px 9px", borderRadius:20, fontWeight:600, background: myReg.status==="WAITLISTED"?"#FFF3E0":"#E8F5EE", color: myReg.status==="WAITLISTED"?t.warning:t.success }}>
                      {myReg.status==="WAITLISTED"?"⏳ Waitlisted":"✓ Registered"}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight:700, fontSize:15, color:t.dark, marginBottom:4 }}>{e.title}</div>
                <div style={{ fontSize:12, color:t.textMuted, marginBottom:8 }}>
                  📅 {new Date(e.startDate).toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" })}
                  {e.location && <> · 📍 {e.location}</>}
                </div>
                {e.description && <p style={{ fontSize:12, color:t.textMuted, margin:"0 0 12px", lineHeight:1.5 }}>{e.description}</p>}
                {capPct !== null && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ height:5, background:t.surface, borderRadius:3, overflow:"hidden", marginBottom:3 }}>
                      <div style={{ width:`${Math.min(capPct,100)}%`, height:"100%", borderRadius:3, background:capPct>=100?t.danger:t.primary }}/>
                    </div>
                    <div style={{ fontSize:10, color:t.textMuted }}>{e.registrationCount}/{e.capacity} spots filled</div>
                  </div>
                )}
                {myReg ? (
                  <button onClick={()=>handleCancel(e.id)} disabled={acting===e.id}
                    style={{ width:"100%", padding:"9px", borderRadius:9, border:`1px solid ${t.border}`, background:t.white, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", color:t.danger }}>
                    {acting===e.id?"Cancelling...":"Cancel Registration"}
                  </button>
                ) : (
                  <button onClick={()=>!full&&handleRegister(e.id)} disabled={acting===e.id||full}
                    style={{ width:"100%", padding:"9px", borderRadius:9, border:"none", background:full?t.surface:t.primary, color:full?t.textMuted:"#fff", cursor:full?"not-allowed":"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit" }}>
                    {acting===e.id?"Registering...":full?"Event Full":"Register for This Event"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FAMILY TAB
// ═══════════════════════════════════════════════════════════════
function FamilyTab({ t }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    portal.getFamilyCheckIns()
      .then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, []);

  if (loading) return <Spinner t={t}/>;
  if (error)   return <div style={{ padding:20, color:t.danger }}>{error}</div>;

  const { checkIns = [], familyMinors = [] } = data;

  return (
    <div>
      <h2 style={{ margin:"0 0 18px", fontFamily:"'DM Serif Display',serif", fontSize:22, color:t.dark }}>My Family</h2>

      {familyMinors.length === 0 ? (
        <div style={{ padding:40, textAlign:"center", color:t.textMuted, background:t.white, borderRadius:14, border:`1px solid ${t.border}` }}>
          No children or dependents are linked to your family account.
        </div>
      ) : (
        <>
          {/* Children list */}
          <div style={{ background:t.white, borderRadius:14, padding:"18px 20px", border:`1px solid ${t.border}`, marginBottom:20 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>Children / Dependents</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {familyMinors.map(m=>(
                <div key={m.id} style={{ padding:"8px 14px", borderRadius:9, background:t.surface, border:`1px solid ${t.border}`, fontSize:13, fontWeight:500 }}>
                  {m.firstName} {m.lastName}
                  {m.dateOfBirth && <span style={{ color:t.textMuted, marginLeft:6, fontSize:11 }}>Age {Math.floor((new Date()-new Date(m.dateOfBirth))/(365.25*24*60*60*1000))}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Check-in history */}
          <div style={{ background:t.white, borderRadius:14, border:`1px solid ${t.border}`, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${t.border}`, fontWeight:600, fontSize:14 }}>
              Recent Check-In History
            </div>
            {checkIns.length === 0 ? (
              <div style={{ padding:32, textAlign:"center", color:t.textMuted, fontSize:13 }}>No check-in history yet.</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:t.surface }}>
                    {["Child","Department","Checked In","Checked Out"].map(h=>(
                      <th key={h} style={{ textAlign:"left", padding:"11px 16px", fontWeight:700, fontSize:10, textTransform:"uppercase", color:t.primary, letterSpacing:"0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checkIns.map(ci=>(
                    <tr key={ci.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                      <td style={{ padding:"10px 16px", fontWeight:500 }}>{ci.member.firstName} {ci.member.lastName}</td>
                      <td style={{ padding:"10px 16px" }}>{ci.subDepartment.name}</td>
                      <td style={{ padding:"10px 16px" }}>{new Date(ci.checkedInAt).toLocaleString("en-US",{ month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</td>
                      <td style={{ padding:"10px 16px", color:ci.checkedOutAt?t.textMuted:t.success }}>
                        {ci.checkedOutAt
                          ? new Date(ci.checkedOutAt).toLocaleTimeString("en-US",{ hour:"2-digit", minute:"2-digit" })
                          : <span style={{ fontWeight:600 }}>Currently checked in</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
