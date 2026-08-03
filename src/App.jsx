// src/App.jsx — ShepherdOS v3

import { useState, useMemo, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login      from "./pages/Login.jsx";
import Dashboard  from "./pages/Dashboard.jsx";
import Members    from "./pages/Members.jsx";
import Families   from "./pages/Families.jsx";
import Finance    from "./pages/Finance.jsx";
import Events     from "./pages/Events.jsx";
import Attendance from "./pages/Attendance.jsx";
import PortalAdmin from "./pages/PortalAdmin.jsx";
import MinistryDashboard from "./pages/MinistryDashboard.jsx";
import { Ico }    from "./components/ui/index.jsx";
import { ministries as ministriesApi } from "./lib/api.js";

// ─── Theme Engine ─────────────────────────────────────────────
const PRESET_THEMES = [
  { name: "Royal Amethyst",  primary: "#5B2D8E", accent: "#C9A84C", bg: "#FAF8FC", surface: "#F3EEF8" },
  { name: "Ocean Grace",     primary: "#1A5276", accent: "#E67E22", bg: "#F5F8FA", surface: "#E8EFF5" },
  { name: "Forest Chapel",   primary: "#2D5F2D", accent: "#B8860B", bg: "#F5F8F5", surface: "#E5EFE5" },
  { name: "Crimson & Gold",  primary: "#8B1A1A", accent: "#D4A843", bg: "#FDF8F5", surface: "#F5E8E8" },
  { name: "Midnight Modern", primary: "#1C1C2E", accent: "#6C63FF", bg: "#F8F8FC", surface: "#EEEEF5" },
  { name: "Warm Sandstone",  primary: "#6B4226", accent: "#C17817", bg: "#FBF8F4", surface: "#F0E8DD" },
];

function makeTheme(pt) {
  const hex2rgb = h => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return`${r},${g},${b}`; };
  const darken  = (h,p) => { let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); r=Math.round(r*(1-p));g=Math.round(g*(1-p));b=Math.round(b*(1-p)); return`#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`; };
  return { primary:pt.primary, accent:pt.accent, bg:pt.bg, surface:pt.surface, dark:darken(pt.primary,0.3), rgb:hex2rgb(pt.primary), text:"#2A2535", textMuted:"#7A7488", border:"#E4DFE9", success:"#2E7D4F", danger:"#C04040", warning:"#C68A0A", white:"#FFFFFF" };
}

export default function ShepherdOS() {
  return <AuthProvider><App /></AuthProvider>;
}

function App() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setSidebarCollapsed] = useState(false);
  const [ministries, setMinistries] = useState([]);
  const [ministriesOpen, setMinistriesOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    ministriesApi.list().then(d => setMinistries(d.ministries)).catch(() => {});
  }, [user]);

  const themePreset = useMemo(() => {
    if (!user?.organization) return PRESET_THEMES[0];
    return PRESET_THEMES.find(p => p.primary === user.organization.primaryColor) || PRESET_THEMES[0];
  }, [user]);

  const t      = useMemo(() => makeTheme(themePreset), [themePreset]);
  const config = user ? { churchName: user.organization.name, theme: themePreset, ministries } : null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8FC" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #F3EEF8", borderTopColor: "#5B2D8E", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Login t={t} />;

  const nav = [
    { id: "dashboard",  label: "Dashboard",     icon: "dashboard" },
    { id: "members",    label: "Members",        icon: "members" },
    { id: "families",   label: "Families",       icon: "family" },
    { id: "attendance", label: "Attendance",     icon: "attendance" },
    { id: "ministries", label: "Ministries",     icon: "ministries", children: ministries.map(m => ({ id: `ministry:${m.id}`, label: m.name, emoji: m.icon })) },
    { id: "finance",    label: "Finances",       icon: "finance" },
    { id: "events",     label: "Events",         icon: "events" },
    { id: "portal",     label: "Member Portal",  icon: "portal" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Nunito Sans', sans-serif", background: t.bg, color: t.text, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{ width: collapsed ? 62 : 230, minWidth: collapsed ? 62 : 230, background: `linear-gradient(180deg, ${t.dark} 0%, ${t.primary} 100%)`, color: "#fff", display: "flex", flexDirection: "column", transition: "all 0.3s cubic-bezier(.4,0,.2,1)", boxShadow: `4px 0 20px rgba(${t.rgb},0.12)`, zIndex: 10, overflow: "hidden" }}>

        {/* Brand */}
        <div onClick={() => setSidebarCollapsed(!collapsed)} style={{ padding: collapsed ? "18px 8px" : "22px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", minHeight: 62, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ico name="staff" size={16} />
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, whiteSpace: "nowrap" }}>{config.churchName}</div>
              <div style={{ fontSize: 9, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.14em" }}>ShepherdOS</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 6px" }}>
          {nav.map(item => {
            if (!item.children) {
              return (
                <button key={item.id} onClick={() => setTab(item.id)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: collapsed ? "11px 0" : "10px 12px", justifyContent: collapsed ? "center" : "flex-start", background: tab === item.id ? "rgba(255,255,255,0.15)" : "transparent", border: "none", color: "#fff", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: tab === item.id ? 600 : 400, transition: "all 0.15s", marginBottom: 1, fontFamily: "inherit", opacity: tab === item.id ? 1 : 0.65 }}>
                  <Ico name={item.icon} size={17} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            }

            const groupActive = tab.startsWith("ministry:");
            return (
              <div key={item.id}>
                <button onClick={() => (collapsed ? setSidebarCollapsed(false) : setMinistriesOpen(!ministriesOpen))} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: collapsed ? "11px 0" : "10px 12px", justifyContent: collapsed ? "center" : "flex-start", background: groupActive && !ministriesOpen ? "rgba(255,255,255,0.15)" : "transparent", border: "none", color: "#fff", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: groupActive ? 600 : 400, transition: "all 0.15s", marginBottom: 1, fontFamily: "inherit", opacity: groupActive ? 1 : 0.65 }}>
                  <Ico name={item.icon} size={17} />
                  {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                  {!collapsed && item.children.length > 0 && (
                    <span style={{ transform: ministriesOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s", opacity: 0.6 }}>
                      <Ico name="chevDown" size={13} />
                    </span>
                  )}
                </button>
                {!collapsed && ministriesOpen && item.children.map(child => (
                  <button key={child.id} onClick={() => setTab(child.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px 8px 30px", background: tab === child.id ? "rgba(255,255,255,0.15)" : "transparent", border: "none", color: "#fff", borderRadius: 9, cursor: "pointer", fontSize: 12.5, fontWeight: tab === child.id ? 600 : 400, transition: "all 0.15s", marginBottom: 1, fontFamily: "inherit", opacity: tab === child.id ? 1 : 0.6 }}>
                    <span style={{ fontSize: 13 }}>{child.emoji}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{child.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "8px 6px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {!collapsed && user && (
            <div style={{ padding: "8px 12px 10px", fontSize: 11, opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.firstName} {user.lastName}
            </div>
          )}
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: collapsed ? "10px 0" : "10px 12px", justifyContent: collapsed ? "center" : "flex-start", background: "transparent", border: "none", color: "#fff", borderRadius: 9, cursor: "pointer", fontSize: 12, fontFamily: "inherit", opacity: 0.55 }}>
            <Ico name="logout" size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {tab === "dashboard"  && <Dashboard  t={t} config={config} setTab={setTab} />}
        {tab === "members"    && <Members    t={t} />}
        {tab === "families"   && <Families   t={t} />}
        {tab === "attendance" && <Attendance  t={t} />}
        {tab === "finance"    && <Finance    t={t} />}
        {tab === "events"     && <Events     t={t} />}
        {tab === "portal"     && <PortalAdmin t={t} />}
        {tab.startsWith("ministry:") && <MinistryDashboard t={t} ministryId={tab.slice(9)} />}
      </main>
    </div>
  );
}

function PlaceholderPage({ t, title, icon }) {
  return (
    <div style={{ padding: "60px 32px", textAlign: "center", color: t.textMuted }}>
      <div style={{ marginBottom: 16 }}><Ico name={icon} size={48} /></div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", color: t.dark, marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14 }}>This module is being migrated. Coming soon!</p>
    </div>
  );
}
