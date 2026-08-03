// src/pages/PortalAdmin.jsx
// Admin dashboard for managing Member Portal accounts:
// invites, password resets, and enabling/disabling access.
import { useState, useEffect, useCallback } from "react";
import { portalAdmin } from "../lib/api.js";
import { PageHeader, Btn, Ico, Spinner, ErrorMsg, Empty, Modal, Stat } from "../components/ui/index.jsx";

const STATUS_FILTERS = [
  { value: "",           label: "All Statuses" },
  { value: "NO_ACCOUNT", label: "No Account" },
  { value: "PENDING",    label: "Invite Pending" },
  { value: "ACTIVE",     label: "Active" },
  { value: "DISABLED",   label: "Disabled" },
];

function PortalStatusBadge({ t, status, expiresAt }) {
  const map = {
    NO_ACCOUNT: { label: "No Account",     bg: "#F3F4F6", color: "#6B7280" },
    PENDING:    { label: "Invite Pending", bg: "#FFF3E0", color: t.warning },
    ACTIVE:     { label: "Active",         bg: "#E8F5EE", color: t.success },
    DISABLED:   { label: "Disabled",       bg: "#FEE2E2", color: t.danger },
  };
  const s = map[status] || map.NO_ACCOUNT;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}{status === "PENDING" && expiresAt ? ` · expires ${new Date(expiresAt).toLocaleDateString()}` : ""}
    </span>
  );
}

export default function PortalAdmin({ t }) {
  const [overview,    setOverview]    = useState(null);
  const [data,         setData]        = useState({ members: [], pagination: {} });
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState("");
  const [success,      setSuccess]     = useState("");
  const [search,       setSearch]      = useState("");
  const [searchInput,  setSearchInput] = useState("");
  const [statusFilter, setStatusFilter]= useState("");
  const [page,         setPage]        = useState(1);
  const [selected,     setSelected]    = useState(() => new Set());
  const [confirmAction,setConfirmAction] = useState(null); // { type, member? }
  const [acting,       setActing]      = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError("");
    Promise.all([
      portalAdmin.getOverview(),
      portalAdmin.getMembers({ page, limit: 25, search, status: statusFilter }),
    ]).then(([ov, list]) => { setOverview(ov); setData(list); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { members, pagination } = data;

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allOnPageSelected = members.length > 0 && members.every(m => selected.has(m.id));
  const toggleSelectAll = () => setSelected(prev => {
    if (allOnPageSelected) { const next = new Set(prev); members.forEach(m => next.delete(m.id)); return next; }
    const next = new Set(prev); members.forEach(m => next.add(m.id)); return next;
  });

  const runConfirmed = async () => {
    if (!confirmAction) return;
    setActing(true); setError(""); setSuccess("");
    try {
      const { type, member } = confirmAction;
      if (type === "invite")      { const r = await portalAdmin.invite(member.id); setSuccess(r.message); }
      if (type === "reset")       { const r = await portalAdmin.resetPassword(member.id); setSuccess(r.message); }
      if (type === "enable")      { const r = await portalAdmin.setAccess(member.id, true); setSuccess(r.message); }
      if (type === "disable")     { const r = await portalAdmin.setAccess(member.id, false); setSuccess(r.message); }
      if (type === "bulkInvite")  { const r = await portalAdmin.bulkInvite([...selected]); setSuccess(`${r.sent} invite${r.sent!==1?"s":""} sent${r.skipped?`, ${r.skipped} skipped`:""}.`); setSelected(new Set()); }
      if (type === "bulkEnable")  { const r = await portalAdmin.bulkSetAccess([...selected], true);  setSuccess(`${r.updated} account${r.updated!==1?"s":""} enabled.`);  setSelected(new Set()); }
      if (type === "bulkDisable") { const r = await portalAdmin.bulkSetAccess([...selected], false); setSuccess(`${r.updated} account${r.updated!==1?"s":""} disabled.`); setSelected(new Set()); }
      setConfirmAction(null);
      load();
    } catch (e) { setError(e.message); } finally { setActing(false); }
  };

  const confirmCopy = {
    invite:      m => ({ title: "Send Portal Invite", body: `Send a portal invite email to ${m.firstName} ${m.lastName} (${m.email})?` }),
    reset:       m => ({ title: "Reset Password", body: `Send a password reset email to ${m.firstName} ${m.lastName}?` }),
    enable:      m => ({ title: "Enable Portal Access", body: `Re-enable portal login for ${m.firstName} ${m.lastName}?` }),
    disable:     m => ({ title: "Disable Portal Access", body: `Disable portal login for ${m.firstName} ${m.lastName}? They won't be able to sign in until re-enabled.` }),
    bulkInvite:  () => ({ title: "Send Bulk Invites", body: `Send portal invite emails to ${selected.size} selected member${selected.size!==1?"s":""}? Members who already have an account or lack an email on file will be skipped.` }),
    bulkEnable:  () => ({ title: "Enable Access", body: `Enable portal access for ${selected.size} selected member${selected.size!==1?"s":""}?` }),
    bulkDisable: () => ({ title: "Disable Access", body: `Disable portal access for ${selected.size} selected member${selected.size!==1?"s":""}?` }),
  };

  return (
    <div>
      <PageHeader t={t} title="Member Portal" subtitle="Manage who can sign in to the Member Portal"
        actions={
          <a href="/portal" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <Btn t={t} variant="secondary">Open Member Portal ↗</Btn>
          </a>
        }
      />

      <div style={{ padding: "24px 32px" }}>
        {overview && (
          <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
            <Stat t={t} label="Portal Accounts" value={overview.withAccount} sub={`of ${overview.totalMembers} members`} />
            <Stat t={t} label="Active" value={overview.active} color={t.success} />
            <Stat t={t} label="Pending Invites" value={overview.pendingInvites} color={t.warning} />
            <Stat t={t} label="Disabled" value={overview.disabled} color={t.danger} />
            <Stat t={t} label="No Account" value={overview.noAccount} sub="Never invited" />
          </div>
        )}

        {error   && <ErrorMsg t={t} message={error} />}
        {success && (
          <div style={{ margin: "0 0 16px", padding: "10px 14px", borderRadius: 9, background: "#E8F5EE", border: `1px solid ${t.success}`, color: t.success, fontSize: 13 }}>
            {success}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}><Ico name="search" size={15} /></div>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by name or email..."
              style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: t.white, boxSizing: "border-box" }} />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 12, fontFamily: "inherit", background: t.white, cursor: "pointer" }}>
            {STATUS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 12px", borderRadius: 9, background: t.surface }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.primary }}>{selected.size} selected</span>
              <Btn small t={t} variant="secondary" onClick={() => setConfirmAction({ type: "bulkInvite" })}>Invite</Btn>
              <Btn small t={t} variant="secondary" onClick={() => setConfirmAction({ type: "bulkEnable" })}>Enable</Btn>
              <Btn small t={t} variant="danger" onClick={() => setConfirmAction({ type: "bulkDisable" })}>Disable</Btn>
              <Btn small t={t} variant="ghost" onClick={() => setSelected(new Set())}>Clear</Btn>
            </div>
          )}
        </div>

        {loading ? <Spinner t={t} /> : (
          <>
            <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: t.surface }}>
                    <th style={{ padding: "11px 13px", width: 32 }}>
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                    </th>
                    {["Name","Email","Status","Last Login","Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0
                    ? <tr><td colSpan={6}><Empty t={t} message="No members found." /></td></tr>
                    : members.map(m => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.surface}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 13px" }}>
                          <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} style={{ cursor: "pointer" }} />
                        </td>
                        <td style={{ padding: "10px 13px", fontWeight: 500 }}>{m.firstName} {m.lastName}</td>
                        <td style={{ padding: "10px 13px", color: t.textMuted }}>{m.email || <span style={{ fontStyle: "italic" }}>no email on file</span>}</td>
                        <td style={{ padding: "10px 13px" }}><PortalStatusBadge t={t} status={m.portalStatus} expiresAt={m.pendingInviteExpiresAt} /></td>
                        <td style={{ padding: "10px 13px", color: t.textMuted }}>{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : (m.hasAccount ? "Never" : "—")}</td>
                        <td style={{ padding: "10px 13px" }}>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {m.portalStatus === "NO_ACCOUNT" && (
                              <Btn small t={t} variant="secondary" disabled={!m.email} onClick={() => setConfirmAction({ type: "invite", member: m })}>Send Invite</Btn>
                            )}
                            {m.portalStatus === "PENDING" && (
                              <Btn small t={t} variant="secondary" onClick={() => setConfirmAction({ type: "invite", member: m })}>Resend Invite</Btn>
                            )}
                            {(m.portalStatus === "ACTIVE" || m.portalStatus === "DISABLED") && (
                              <Btn small t={t} variant="secondary" onClick={() => setConfirmAction({ type: "reset", member: m })}>Reset Password</Btn>
                            )}
                            {m.portalStatus === "ACTIVE" && (
                              <Btn small t={t} variant="danger" onClick={() => setConfirmAction({ type: "disable", member: m })}>Disable</Btn>
                            )}
                            {m.portalStatus === "DISABLED" && (
                              <Btn small t={t} variant="secondary" onClick={() => setConfirmAction({ type: "enable", member: m })}>Enable</Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 12 }}>
                <span style={{ color: t.textMuted }}>Showing {((pagination.page-1)*25)+1}–{Math.min(pagination.page*25, pagination.total)} of {pagination.total}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>Prev</Btn>
                  {Array.from({length: Math.min(5,pagination.totalPages)},(_,i)=>{const p=page<=3?i+1:page+i-2;if(p>pagination.totalPages||p<1)return null;return<Btn key={p} small t={t} variant={p===page?"primary":"ghost"} onClick={()=>setPage(p)}>{p}</Btn>;})}
                  <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.min(pagination.totalPages,p+1))} disabled={page===pagination.totalPages}>Next</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {confirmAction && (() => {
        const copy = confirmCopy[confirmAction.type](confirmAction.member);
        return (
          <Modal t={t} title={copy.title} onClose={() => setConfirmAction(null)} width={420}>
            <p style={{ fontSize: 14, marginBottom: 20 }}>{copy.body}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn t={t} variant="ghost" onClick={() => setConfirmAction(null)} disabled={acting}>Cancel</Btn>
              <Btn t={t} variant={confirmAction.type.toLowerCase().includes("disable") ? "red" : "primary"} onClick={runConfirmed} disabled={acting}>
                {acting ? "Working..." : "Confirm"}
              </Btn>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
