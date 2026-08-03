// src/components/ui/index.jsx
// Shared UI primitives used across all pages.

export const Ico = ({ name, size = 18 }) => {
  const s = { width: size, height: size, display: "inline-block", verticalAlign: "middle", flexShrink: 0 };
  const m = {
    dashboard: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    members: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    attendance: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M17 11l2 2 4-4"/></svg>,
    finance: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    events: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    portal: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>,
    ministries: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.5 5.5L20 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>,
    search: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    download: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    upload: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    printer: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    chevron: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
    chevDown: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
    settings: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    shield: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    staff: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V7"/><path d="M12 7c0-2.5 2-4 4-4s4 1.5 4 3.5c0 2.5-2.5 3.5-4 3.5"/></svg>,
    arrow: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    x: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    clock: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    edit: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    family: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    alert: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    logout: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return m[name] || null;
};

export const Btn = ({ children, t, variant = "primary", onClick, small, disabled, style: sx = {}, type = "button" }) => {
  const base = { padding: small ? "5px 13px" : "9px 18px", borderRadius: 9, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: small ? 11 : 13, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s", opacity: disabled ? 0.6 : 1, ...sx };
  const v = {
    primary: { background: t.primary, color: "#fff" },
    secondary: { background: t.surface, color: t.primary },
    success: { background: t.success, color: "#fff" },
    danger: { background: "#FDECEC", color: t.danger },
    ghost: { background: "transparent", color: t.primary, border: `1px solid ${t.border}` },
    red: { background: t.danger, color: "#fff" },
  };
  return <button type={type} style={{ ...base, ...v[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

export const Stat = ({ t, label, value, sub, color }) => (
  <div style={{ background: t.white, borderRadius: 12, padding: "18px 20px", border: `1px solid ${t.border}`, flex: 1, minWidth: 170, transition: "transform 0.15s", cursor: "default" }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "none"}>
    <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: color || t.dark }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{sub}</div>}
  </div>
);

export const PageHeader = ({ t, title, subtitle, actions }) => (
  <div style={{ padding: "26px 32px 18px", borderBottom: `1px solid ${t.border}`, background: t.white, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontFamily: "'DM Serif Display', serif", color: t.dark }}>{title}</h1>
      {subtitle && <p style={{ margin: "3px 0 0", color: t.textMuted, fontSize: 13 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
  </div>
);

export const Spinner = ({ t }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${t.surface}`, borderTopColor: t.primary, animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const Empty = ({ t, message = "No records found." }) => (
  <div style={{ padding: 48, textAlign: "center", color: t.textMuted, fontSize: 14 }}>{message}</div>
);

export const ErrorMsg = ({ t, message }) => (
  <div style={{ margin: "16px 32px", padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: `1px solid #FECACA`, color: t.danger, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
    <Ico name="alert" size={16} /> {message}
  </div>
);

// Generic modal overlay
export const Modal = ({ t, title, onClose, children, width = 560 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
    <div style={{ background: t.white, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontFamily: "'DM Serif Display', serif", color: t.dark }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, display: "flex" }}><Ico name="x" size={20} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

// Form field wrapper
export const Field = ({ label, required, children, error }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7A7488", marginBottom: 5 }}>
      {label}{required && <span style={{ color: "#C04040", marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {error && <div style={{ fontSize: 11, color: "#C04040", marginTop: 4 }}>{error}</div>}
  </div>
);

const inputBase = { width: "100%", padding: "9px 13px", borderRadius: 9, border: "1px solid #E4DFE9", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" };

export const Input = ({ value, onChange, placeholder, type = "text", disabled, style: sx = {} }) => (
  <input value={value} onChange={onChange} placeholder={placeholder} type={type} disabled={disabled}
    style={{ ...inputBase, ...sx, opacity: disabled ? 0.6 : 1 }} />
);

export const Select = ({ value, onChange, children, disabled }) => (
  <select value={value} onChange={onChange} disabled={disabled}
    style={{ ...inputBase, cursor: "pointer" }}>{children}</select>
);

export const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{ ...inputBase, resize: "vertical" }} />
);

// Status badge
export const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE:          { label: "Active",        bg: "#E8F5EE", color: "#2E7D4F" },
    INACTIVE:        { label: "Inactive",      bg: "#FEE2E2", color: "#C04040" },
    NEW_MEMBER:      { label: "New Member",    bg: "#FFF3E0", color: "#C68A0A" },
    VISITOR:         { label: "Visitor",       bg: "#EEF2FF", color: "#4338CA" },
    TRANSFERRED_OUT: { label: "Transferred",   bg: "#F3F4F6", color: "#6B7280" },
    DECEASED:        { label: "Deceased",      bg: "#F3F4F6", color: "#6B7280" },
    SCHEDULED:       { label: "Scheduled",     bg: "#EEF2FF", color: "#4338CA" },
    CONFIRMED:       { label: "Confirmed",     bg: "#E8F5EE", color: "#2E7D4F" },
    DECLINED:        { label: "Declined",      bg: "#FEE2E2", color: "#C04040" },
    COMPLETED:       { label: "Completed",     bg: "#F3F4F6", color: "#6B7280" },
  };
  const s = map[status] || { label: status, bg: "#F3F4F6", color: "#6B7280" };
  return <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>;
};
