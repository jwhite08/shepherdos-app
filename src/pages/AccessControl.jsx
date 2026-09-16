// src/pages/AccessControl.jsx
//
// Global-admin screen for managing who can see what.
// Reachable only by ADMIN / SUPER_ADMIN — the API enforces this too.

import { useState, useEffect } from "react";
import { admin as adminApi, ministries as ministriesApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  PageHeader, Spinner, ErrorMsg, Btn, Modal, Field, Select, Ico,
} from "../components/ui/index.jsx";

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN:       "Administrator",
  STAFF:       "Staff",
  VOLUNTEER:   "Volunteer",
  MEMBER:      "Member (portal only)",
};

const ROLE_HELP = {
  SUPER_ADMIN: "Full access to everything, including creating other super admins.",
  ADMIN:       "Full access across the whole organization. Ministry grants below are ignored.",
  STAFF:       "Access limited to the ministries granted below.",
  VOLUNTEER:   "Access limited to the ministries granted below, with fewer actions available.",
  MEMBER:      "No admin access — member portal only.",
};

export default function AccessControl({ t }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers]           = useState([]);
  const [invites, setInvites]       = useState([]);
  const [allMinistries, setAll]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [editing, setEditing]       = useState(null);
  const [inviting, setInviting]     = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.listUsers(), adminApi.listInvites(), ministriesApi.list()])
      .then(([u, i, m]) => { setUsers(u.users); setInvites(i.invites); setAll(m.ministries); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const revokeInvite = async (invite) => {
    try {
      await adminApi.revokeInvite(invite.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (u) => {
    try {
      await adminApi.setUserActive(u.id, !u.isActive);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <><PageHeader t={t} title="Access Control" /><Spinner t={t} /></>;

  return (
    <div>
      <PageHeader
        t={t}
        title="Access Control"
        subtitle="Control which ministries each staff member can see and manage"
        actions={
          <Btn t={t} onClick={() => setInviting(true)}>
            <Ico name="plus" size={14} /> Invite User
          </Btn>
        }
      />

      <div style={{ padding: "22px 32px" }}>
        {error && <div style={{ marginBottom: 16 }}><ErrorMsg t={t} message={error} /></div>}

        <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 2.4fr 90px 90px", padding: "12px 20px", borderBottom: `1px solid ${t.border}`, background: t.surface, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: t.textMuted }}>
            <span>User</span><span>Role</span><span>Ministry Access</span><span /><span />
          </div>

          {users.map(u => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 2.4fr 90px 90px", padding: "14px 20px", borderBottom: `1px solid ${t.border}`, alignItems: "center", opacity: u.isActive ? 1 : 0.5 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {u.firstName} {u.lastName}
                  {u.id === currentUser?.id && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: t.textMuted, fontWeight: 500 }}>(you)</span>
                  )}
                  {!u.isActive && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: t.danger, fontWeight: 700 }}>DEACTIVATED</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted }}>{u.email}</div>
              </div>

              <div style={{ fontSize: 12 }}>
                {ROLE_LABELS[u.role] || u.role}
                {u.canViewFinance && (
                  <div style={{ fontSize: 10, color: t.success, fontWeight: 600, marginTop: 2 }}>+ Finance</div>
                )}
              </div>

              <div style={{ fontSize: 12, color: t.textMuted }}>
                {u.hasGlobalAccess
                  ? <span style={{ color: t.primary, fontWeight: 600 }}>Entire organization</span>
                  : u.ministryAccess.length === 0
                    ? <span style={{ fontStyle: "italic" }}>No ministry access</span>
                    : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {u.ministryAccess.map(a => (
                          <span key={a.ministryId} style={{ background: t.surface, borderRadius: 6, padding: "3px 8px", fontSize: 11 }}>
                            {a.icon} {a.name}
                            <span style={{ color: a.accessLevel === "MANAGE" ? t.success : t.textMuted, fontWeight: 600, marginLeft: 5 }}>
                              {a.accessLevel === "MANAGE" ? "Manage" : "View"}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
              </div>

              <Btn small t={t} variant="ghost" onClick={() => setEditing(u)}>Edit</Btn>
              <Btn small t={t} variant={u.isActive ? "danger" : "ghost"}
                disabled={u.id === currentUser?.id}
                onClick={() => toggleActive(u)}>
                {u.isActive ? "Deactivate" : "Reactivate"}
              </Btn>
            </div>
          ))}
        </div>

        {invites.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontFamily: "'DM Serif Display', serif", fontSize: 16, color: t.dark }}>Pending Invites</h3>
            <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              {invites.map(inv => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${t.border}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.firstName} {inv.lastName}</div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>{inv.email} · {ROLE_LABELS[inv.role] || inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
                  </div>
                  <Btn small t={t} variant="ghost" onClick={() => revokeInvite(inv)}>Revoke</Btn>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditAccessModal
          t={t}
          user={editing}
          allMinistries={allMinistries}
          isSelf={editing.id === currentUser?.id}
          currentUserRole={currentUser?.role}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {inviting && (
        <InviteUserModal
          t={t}
          allMinistries={allMinistries}
          currentUserRole={currentUser?.role}
          onClose={() => setInviting(false)}
          onSent={() => { setInviting(false); load(); }}
        />
      )}
    </div>
  );
}

// ─── Shared role / finance / ministry-grant fields ─────────────
// Used by both the invite form and the edit-access modal so the two
// can't drift out of sync with each other.
function AccessFields({ t, role, setRole, canViewFinance, setFinance, grants, toggle, setLevel, allMinistries, currentUserRole }) {
  const isGlobal = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <>
      <Field label="Role">
        <Select value={role} onChange={e => setRole(e.target.value)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            // Only a super admin can grant super admin; the API enforces this too.
            (value !== "SUPER_ADMIN" || currentUserRole === "SUPER_ADMIN") && (
              <option key={value} value={value}>{label}</option>
            )
          ))}
        </Select>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>{ROLE_HELP[role]}</div>
      </Field>

      <Field label="Financial Data">
        <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, cursor: isGlobal ? "not-allowed" : "pointer" }}>
          <input
            type="checkbox"
            checked={isGlobal || canViewFinance}
            disabled={isGlobal}
            onChange={e => setFinance(e.target.checked)}
          />
          <span>Can view contributions, donor totals and giving history</span>
        </label>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
          {isGlobal
            ? "Administrators always have financial access."
            : "Giving records aren't split by ministry, so this is all-or-nothing. Department budgets are controlled by the ministry grants below."}
        </div>
      </Field>

      <Field label="Ministry Access">
        {isGlobal ? (
          <div style={{ fontSize: 12, color: t.textMuted, padding: "10px 0" }}>
            This role already has access to every ministry. Grants below would have no effect.
          </div>
        ) : (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 9, overflow: "hidden" }}>
            {allMinistries.length === 0 && (
              <div style={{ padding: 14, fontSize: 12, color: t.textMuted }}>No ministries defined yet.</div>
            )}
            {allMinistries.map(m => {
              const level = grants[m.id];
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderBottom: `1px solid ${t.border}` }}>
                  <input type="checkbox" checked={!!level} onChange={() => toggle(m.id)} />
                  <span style={{ flex: 1, fontSize: 13 }}>{m.icon} {m.name}</span>
                  {level && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {["VIEW", "MANAGE"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setLevel(m.id, opt)}
                          style={{
                            padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
                            fontFamily: "inherit",
                            border: `1px solid ${level === opt ? t.primary : t.border}`,
                            background: level === opt ? t.primary : "transparent",
                            color: level === opt ? "#fff" : t.textMuted,
                          }}
                        >
                          {opt === "VIEW" ? "View" : "Manage"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Field>
    </>
  );
}

function useAccessFieldsState(initialRole, initialFinance, initialGrants) {
  const [role, setRole]              = useState(initialRole);
  const [canViewFinance, setFinance] = useState(initialFinance);
  const [grants, setGrants]          = useState(initialGrants);

  const toggle = (ministryId) => {
    setGrants(prev => {
      const next = { ...prev };
      if (next[ministryId]) delete next[ministryId];
      else next[ministryId] = "VIEW";
      return next;
    });
  };

  const setLevel = (ministryId, level) =>
    setGrants(prev => ({ ...prev, [ministryId]: level }));

  return { role, setRole, canViewFinance, setFinance, grants, toggle, setLevel };
}

function EditAccessModal({ t, user, allMinistries, isSelf, currentUserRole, onClose, onSaved }) {
  const access = useAccessFieldsState(
    user.role,
    user.canViewFinance,
    Object.fromEntries(user.ministryAccess.map(a => [a.ministryId, a.accessLevel]))
  );
  const { role, canViewFinance, grants } = access;
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const isGlobal = role === "ADMIN" || role === "SUPER_ADMIN";

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      await adminApi.setUserAccess(user.id, {
        role,
        canViewFinance,
        ministryAccess: Object.entries(grants).map(([ministryId, accessLevel]) => ({ ministryId, accessLevel })),
      });
      onSaved();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal t={t} title={`Access — ${user.firstName} ${user.lastName}`} onClose={onClose} width={620}>
      {err && <div style={{ marginBottom: 14 }}><ErrorMsg t={t} message={err} /></div>}

      <AccessFields t={t} allMinistries={allMinistries} currentUserRole={currentUserRole} {...access} />

      {isSelf && !isGlobal && (
        <div style={{ background: "#FDECEC", color: t.danger, borderRadius: 9, padding: "10px 13px", fontSize: 12, marginTop: 4, marginBottom: 16 }}>
          You can't remove your own administrator access — save will be rejected.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Access"}</Btn>
      </div>
    </Modal>
  );
}

function InviteUserModal({ t, allMinistries, currentUserRole, onClose, onSent }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const access = useAccessFieldsState("STAFF", false, {});
  const { role, canViewFinance, grants } = access;
  const [sending, setSending] = useState(false);
  const [err, setErr]         = useState("");

  const send = async () => {
    setErr("");
    if (!firstName.trim() || !lastName.trim()) return setErr("First and last name are required.");
    if (!email.trim())                          return setErr("Email is required.");

    setSending(true);
    try {
      await adminApi.inviteUser({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        role,
        canViewFinance,
        ministryAccess: Object.entries(grants).map(([ministryId, accessLevel]) => ({ ministryId, accessLevel })),
      });
      onSent();
    } catch (e) {
      setErr(e.message);
      setSending(false);
    }
  };

  return (
    <Modal t={t} title="Invite a New User" onClose={onClose} width={620}>
      {err && <div style={{ marginBottom: 14 }}><ErrorMsg t={t} message={err} /></div>}

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="First Name">
            <input value={firstName} onChange={e => setFirstName(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Last Name">
            <input value={lastName} onChange={e => setLastName(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </Field>
        </div>
      </div>

      <Field label="Email">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      </Field>

      <AccessFields t={t} allMinistries={allMinistries} currentUserRole={currentUserRole} {...access} />

      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4, marginBottom: 4 }}>
        They'll get an email with a link to set their own password. It expires in 7 days.
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={send} disabled={sending}>{sending ? "Sending…" : "Send Invite"}</Btn>
      </div>
    </Modal>
  );
}
