// src/pages/MinistryDashboard.jsx
// Generic per-ministry admin area: Giving, Volunteers, Events — all scoped
// by ministryId. One dashboard serves every Ministry row in the org.

import { useState, useEffect, useCallback } from "react";
import { ministries as ministriesApi, finance as financeApi, events as eventsApi, members as membersApi } from "../lib/api.js";
import {
  PageHeader, Btn, Ico, Spinner, ErrorMsg, Empty,
  Modal, Field, Stat, StatusBadge,
} from "../components/ui/index.jsx";

const CONTRIBUTION_TYPES   = ["TITHE","OFFERING","BUILDING_FUND","MISSIONS","BENEVOLENCE","YOUTH_FUND","OTHER"];
const CONTRIBUTION_METHODS = ["CASH","CHECK","ONLINE","ACH","CARD","OTHER"];
const TYPE_LABELS   = { TITHE:"Tithe", OFFERING:"Offering", BUILDING_FUND:"Building Fund", MISSIONS:"Missions", BENEVOLENCE:"Benevolence", YOUTH_FUND:"Youth Fund", OTHER:"Other" };
const METHOD_LABELS = { CASH:"Cash", CHECK:"Check", ONLINE:"Online", ACH:"ACH", CARD:"Card", OTHER:"Other" };
const EVENT_TYPES = ["Worship","Study","Youth","Conference","Fellowship","Training","Outreach","General"];

const inputStyleFor = t => ({ width: "100%", padding: "9px 13px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" });

export default function MinistryDashboard({ t, ministryId }) {
  const [ministry, setMinistry] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [activeTab, setActiveTab] = useState("giving");

  const load = useCallback(() => {
    setLoading(true); setError("");
    ministriesApi.getById(ministryId).then(setMinistry).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [ministryId]);

  useEffect(() => { setActiveTab("giving"); load(); }, [ministryId, load]);

  if (loading) return <Spinner t={t} />;
  if (error)   return <ErrorMsg t={t} message={error} />;
  if (!ministry) return null;

  const tabs = [
    { id: "giving",         label: "Giving" },
    { id: "volunteers",     label: "Volunteers" },
    { id: "events",         label: "Events" },
    { id: "subdepartments", label: "Sub-Departments" },
  ];

  return (
    <div>
      <PageHeader t={t}
        title={`${ministry.icon} ${ministry.name}`}
        subtitle={ministry.description || `${ministry.subDepartments.length} sub-department${ministry.subDepartments.length === 1 ? "" : "s"} · ${ministry.volunteerCount} volunteer${ministry.volunteerCount === 1 ? "" : "s"}`}
      />
      <div style={{ padding: "0 32px", background: t.white, borderBottom: `1px solid ${t.border}`, display: "flex", gap: 4 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "13px 22px", border: "none", background: "transparent", cursor: "pointer",
            fontFamily: "inherit", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? t.primary : t.textMuted,
            borderBottom: activeTab === tab.id ? `2px solid ${t.primary}` : "2px solid transparent",
            transition: "all 0.15s",
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ padding: "24px 32px" }}>
        {activeTab === "giving"         && <MinistryGiving         t={t} ministry={ministry} />}
        {activeTab === "volunteers"     && <MinistryVolunteers     t={t} ministry={ministry} />}
        {activeTab === "events"         && <MinistryEvents         t={t} ministry={ministry} />}
        {activeTab === "subdepartments" && <MinistrySubDepartments t={t} ministry={ministry} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GIVING
// ═══════════════════════════════════════════════════════════════
function MinistryGiving({ t, ministry }) {
  const [data,    setData]    = useState({ contributions: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError("");
    financeApi.listContributions({ ministryId: ministry.id, limit: 50 })
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [ministry.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await financeApi.deleteContribution(deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { setError(e.message); } finally { setDeleting(false); }
  };

  const { contributions, totals } = data;

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        <Stat t={t} label="Year-to-Date Giving" value={`$${Number(ministry.ytdGiving).toLocaleString()}`} color={t.success} />
        <Stat t={t} label="All-Time (loaded)" value={`$${(totals.sum || 0).toLocaleString()}`} sub={`${totals.count || 0} gifts`} />
      </div>
      {error && <ErrorMsg t={t} message={error} />}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn t={t} onClick={() => { setEditTarget(null); setShowForm(true); }}><Ico name="plus" size={14} /> Add Gift</Btn>
      </div>

      {loading ? <Spinner t={t} /> : (
        <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {["Date","Member","Type","Method","Amount","Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0
                ? <tr><td colSpan={6}><Empty t={t} message="No gifts recorded for this ministry yet." /></td></tr>
                : contributions.map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "10px 13px" }}>{new Date(c.date).toLocaleDateString()}</td>
                    <td style={{ padding: "10px 13px", fontWeight: 500 }}>
                      {c.member ? `${c.member.firstName} ${c.member.lastName}` : <span style={{ color: t.textMuted }}>Anonymous</span>}
                    </td>
                    <td style={{ padding: "10px 13px" }}>{TYPE_LABELS[c.type] || c.type}</td>
                    <td style={{ padding: "10px 13px", color: t.textMuted }}>{METHOD_LABELS[c.method] || c.method}</td>
                    <td style={{ padding: "10px 13px", fontWeight: 700, color: t.success }}>${Number(c.amount).toLocaleString()}</td>
                    <td style={{ padding: "10px 13px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <Btn small t={t} variant="ghost" onClick={() => { setEditTarget(c); setShowForm(true); }}><Ico name="edit" size={12} /></Btn>
                        <Btn small t={t} variant="danger" onClick={() => setDeleteTarget(c)}><Ico name="trash" size={12} /></Btn>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <GiftForm t={t} ministryId={ministry.id} contribution={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={() => { setShowForm(false); setEditTarget(null); load(); }} />
      )}
      {deleteTarget && (
        <Modal t={t} title="Delete Gift" onClose={() => setDeleteTarget(null)} width={400}>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            Delete this <strong>{TYPE_LABELS[deleteTarget.type]}</strong> of <strong>${Number(deleteTarget.amount).toLocaleString()}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GiftForm({ t, ministryId, contribution, onClose, onSaved }) {
  const isEdit = !!contribution;
  const inputStyle = inputStyleFor(t);
  const [memberList,   setMemberList]   = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [form, setForm] = useState({
    memberId: contribution?.memberId || "",
    amount:   contribution ? String(contribution.amount) : "",
    type:     contribution?.type   || "TITHE",
    method:   contribution?.method || "CASH",
    date:     contribution?.date   ? new Date(contribution.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    notes:    contribution?.notes  || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (memberSearch.length < 2) { setMemberList([]); return; }
    membersApi.list({ search: memberSearch, limit: 10 }).then(d => setMemberList(d.members || [])).catch(() => {});
  }, [memberSearch]);

  const handleSubmit = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError("Enter a valid amount."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, ministryId };
      isEdit ? await financeApi.updateContribution(contribution.id, payload) : await financeApi.createContribution(payload);
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const selectedMember = memberList.find(m => m.id === form.memberId);

  return (
    <Modal t={t} title={isEdit ? "Edit Gift" : "Add Gift"} onClose={onClose}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Member (leave blank for anonymous)">
            {form.memberId ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 9, border: `1px solid ${t.primary}`, background: t.surface }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Selected member"}</span>
                <button onClick={() => { set("memberId",""); setMemberSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:t.textMuted }}><Ico name="x" size={14}/></button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Type a name to search..." style={inputStyle} />
                {memberList.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:t.white, border:`1px solid ${t.border}`, borderRadius:9, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", zIndex:10, maxHeight:200, overflow:"auto" }}>
                    {memberList.map(m => (
                      <button key={m.id} onClick={() => { set("memberId",m.id); setMemberSearch(""); setMemberList([]); }}
                        style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left", background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:"inherit", borderBottom:`1px solid ${t.border}` }}>
                        {m.firstName} {m.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Field>
        </div>
        <Field label="Amount ($)" required>
          <input value={form.amount} onChange={e => set("amount",e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" style={inputStyle} />
        </Field>
        <Field label="Date">
          <input value={form.date} onChange={e => set("date",e.target.value)} type="date" style={inputStyle} />
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={e => set("type",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
            {CONTRIBUTION_TYPES.map(tp => <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>)}
          </select>
        </Field>
        <Field label="Method">
          <select value={form.method} onChange={e => set("method",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
            {CONTRIBUTION_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
        </Field>
        <div style={{ gridColumn:"1/-1" }}>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set("notes",e.target.value)} rows={2} style={{...inputStyle,resize:"vertical"}} placeholder="Optional note..." />
          </Field>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Add Gift"}</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// VOLUNTEERS
// ═══════════════════════════════════════════════════════════════
function MinistryVolunteers({ t, ministry }) {
  const [volunteers, setVolunteers] = useState([]);
  const [schedule,   setSchedule]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showVolForm,  setShowVolForm]  = useState(false);
  const [editVol,      setEditVol]      = useState(null);
  const [removeVolTarget, setRemoveVolTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [showSchedForm, setShowSchedForm] = useState(false);
  const [editSched,     setEditSched]     = useState(null);
  const [removeSchedTarget, setRemoveSchedTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true); setError("");
    Promise.all([
      ministriesApi.volunteers.list(ministry.id),
      ministriesApi.schedule.list(ministry.id, { upcoming: "true" }),
    ]).then(([v, s]) => { setVolunteers(v.volunteers); setSchedule(s.schedule); })
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [ministry.id]);

  useEffect(() => { load(); }, [load]);

  const handleRemoveVolunteer = async () => {
    setRemoving(true);
    try { await ministriesApi.volunteers.delete(ministry.id, removeVolTarget.id); setRemoveVolTarget(null); load(); }
    catch (e) { setError(e.message); } finally { setRemoving(false); }
  };

  const handleRemoveSchedule = async () => {
    try { await ministriesApi.schedule.delete(ministry.id, removeSchedTarget.id); setRemoveSchedTarget(null); load(); }
    catch (e) { setError(e.message); }
  };

  if (loading) return <Spinner t={t} />;

  return (
    <div>
      {error && <ErrorMsg t={t} message={error} />}

      {/* Roster */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontFamily: "'DM Serif Display', serif", color: t.dark }}>Volunteer Roster</h3>
        <Btn t={t} onClick={() => { setEditVol(null); setShowVolForm(true); }}><Ico name="plus" size={14} /> Add Volunteer</Btn>
      </div>
      <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden", marginBottom: 28 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {["Name","Role","Status","Upcoming Shifts","Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {volunteers.length === 0
              ? <tr><td colSpan={5}><Empty t={t} message="No volunteers yet for this ministry." /></td></tr>
              : volunteers.map(v => (
                <tr key={v.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: "10px 13px", fontWeight: 500 }}>{v.member.firstName} {v.member.lastName}</td>
                  <td style={{ padding: "10px 13px", color: t.textMuted }}>{v.roleTitle || "—"}</td>
                  <td style={{ padding: "10px 13px" }}><StatusBadge status={v.status} /></td>
                  <td style={{ padding: "10px 13px" }}>{v.scheduleCount}</td>
                  <td style={{ padding: "10px 13px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <Btn small t={t} variant="ghost" onClick={() => { setEditVol(v); setShowVolForm(true); }}><Ico name="edit" size={12} /></Btn>
                      <Btn small t={t} variant="danger" onClick={() => setRemoveVolTarget(v)}><Ico name="trash" size={12} /></Btn>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Schedule */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontFamily: "'DM Serif Display', serif", color: t.dark }}>Upcoming Schedule</h3>
        <Btn t={t} variant="secondary" disabled={volunteers.length === 0} onClick={() => { setEditSched(null); setShowSchedForm(true); }}>
          <Ico name="plus" size={14} /> Schedule Volunteer
        </Btn>
      </div>
      <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {["Date","Volunteer","Role","Event","Status","Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.length === 0
              ? <tr><td colSpan={6}><Empty t={t} message="No upcoming shifts scheduled." /></td></tr>
              : schedule.map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: "10px 13px" }}>{new Date(s.serveDate).toLocaleDateString()}</td>
                  <td style={{ padding: "10px 13px", fontWeight: 500 }}>{s.volunteer.member.firstName} {s.volunteer.member.lastName}</td>
                  <td style={{ padding: "10px 13px", color: t.textMuted }}>{s.role || "—"}</td>
                  <td style={{ padding: "10px 13px", color: t.textMuted }}>{s.event?.title || "—"}</td>
                  <td style={{ padding: "10px 13px" }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: "10px 13px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <Btn small t={t} variant="ghost" onClick={() => { setEditSched(s); setShowSchedForm(true); }}><Ico name="edit" size={12} /></Btn>
                      <Btn small t={t} variant="danger" onClick={() => setRemoveSchedTarget(s)}><Ico name="trash" size={12} /></Btn>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showVolForm && (
        <VolunteerForm t={t} ministryId={ministry.id} volunteer={editVol}
          onClose={() => { setShowVolForm(false); setEditVol(null); }}
          onSaved={() => { setShowVolForm(false); setEditVol(null); load(); }} />
      )}
      {removeVolTarget && (
        <Modal t={t} title="Remove Volunteer" onClose={() => setRemoveVolTarget(null)} width={400}>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            Remove <strong>{removeVolTarget.member.firstName} {removeVolTarget.member.lastName}</strong> from this ministry's roster? Their scheduled shifts will also be removed.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setRemoveVolTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleRemoveVolunteer} disabled={removing}>{removing ? "Removing..." : "Remove"}</Btn>
          </div>
        </Modal>
      )}
      {showSchedForm && (
        <ScheduleForm t={t} ministryId={ministry.id} volunteers={volunteers} entry={editSched}
          onClose={() => { setShowSchedForm(false); setEditSched(null); }}
          onSaved={() => { setShowSchedForm(false); setEditSched(null); load(); }} />
      )}
      {removeSchedTarget && (
        <Modal t={t} title="Remove Shift" onClose={() => setRemoveSchedTarget(null)} width={400}>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Remove this scheduled shift? This cannot be undone.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setRemoveSchedTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleRemoveSchedule}>Remove</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function VolunteerForm({ t, ministryId, volunteer, onClose, onSaved }) {
  const isEdit = !!volunteer;
  const inputStyle = inputStyleFor(t);
  const [memberList,   setMemberList]   = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [form, setForm] = useState({
    memberId:  volunteer?.memberId  || "",
    roleTitle: volunteer?.roleTitle || "",
    status:    volunteer?.status    || "ACTIVE",
    notes:     volunteer?.notes     || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (memberSearch.length < 2) { setMemberList([]); return; }
    membersApi.list({ search: memberSearch, limit: 10 }).then(d => setMemberList(d.members || [])).catch(() => {});
  }, [memberSearch]);

  const handleSubmit = async () => {
    if (!isEdit && !form.memberId) { setError("Select a member."); return; }
    setSaving(true); setError("");
    try {
      isEdit
        ? await ministriesApi.volunteers.update(ministryId, volunteer.id, { roleTitle: form.roleTitle, status: form.status, notes: form.notes })
        : await ministriesApi.volunteers.create(ministryId, { memberId: form.memberId, roleTitle: form.roleTitle, notes: form.notes });
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const selectedMember = volunteer?.member || memberList.find(m => m.id === form.memberId);

  return (
    <Modal t={t} title={isEdit ? "Edit Volunteer" : "Add Volunteer"} onClose={onClose}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}

      {!isEdit && (
        <Field label="Member" required>
          {form.memberId ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 9, border: `1px solid ${t.primary}`, background: t.surface }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>{selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Selected member"}</span>
              <button onClick={() => { set("memberId",""); setMemberSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:t.textMuted }}><Ico name="x" size={14}/></button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Type a name to search..." style={inputStyle} />
              {memberList.length > 0 && (
                <div style={{ position:"absolute", top:"100%", left:0, right:0, background:t.white, border:`1px solid ${t.border}`, borderRadius:9, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", zIndex:10, maxHeight:200, overflow:"auto" }}>
                  {memberList.map(m => (
                    <button key={m.id} onClick={() => { set("memberId",m.id); setMemberSearch(""); setMemberList([]); }}
                      style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left", background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:"inherit", borderBottom:`1px solid ${t.border}` }}>
                      {m.firstName} {m.lastName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>
      )}
      {isEdit && (
        <Field label="Member">
          <div style={{ padding: "8px 12px", borderRadius: 9, background: t.surface, fontWeight: 500, fontSize: 13 }}>
            {selectedMember?.firstName} {selectedMember?.lastName}
          </div>
        </Field>
      )}

      <Field label="Role / Title">
        <input value={form.roleTitle} onChange={e => set("roleTitle", e.target.value)} placeholder="e.g. Nursery Volunteer, Sound Tech" style={inputStyle} />
      </Field>
      {isEdit && (
        <Field label="Status">
          <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      )}
      <Field label="Notes">
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Optional note..." />
      </Field>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Add Volunteer"}</Btn>
      </div>
    </Modal>
  );
}

function ScheduleForm({ t, ministryId, volunteers, entry, onClose, onSaved }) {
  const isEdit = !!entry;
  const inputStyle = inputStyleFor(t);
  const [ministryEvents, setMinistryEvents] = useState([]);
  const [form, setForm] = useState({
    volunteerId: entry?.volunteerId || entry?.volunteer?.id || "",
    eventId:     entry?.eventId     || "",
    serveDate:   entry?.serveDate   ? new Date(entry.serveDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    role:        entry?.role        || "",
    status:      entry?.status      || "SCHEDULED",
    notes:       entry?.notes       || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    eventsApi.list({ ministryId, limit: 50, upcoming: "true" }).then(d => setMinistryEvents(d.events || [])).catch(() => {});
  }, [ministryId]);

  const handleSubmit = async () => {
    if (!form.volunteerId) { setError("Select a volunteer."); return; }
    if (!form.serveDate)   { setError("Select a date.");      return; }
    setSaving(true); setError("");
    try {
      isEdit
        ? await ministriesApi.schedule.update(ministryId, entry.id, form)
        : await ministriesApi.schedule.create(ministryId, form);
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <Modal t={t} title={isEdit ? "Edit Shift" : "Schedule Volunteer"} onClose={onClose}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Volunteer" required>
            <select value={form.volunteerId} onChange={e => set("volunteerId", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Select a volunteer...</option>
              {volunteers.map(v => <option key={v.id} value={v.id}>{v.member.firstName} {v.member.lastName}{v.roleTitle ? ` — ${v.roleTitle}` : ""}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Serve Date" required>
          <input value={form.serveDate} onChange={e => set("serveDate", e.target.value)} type="date" style={inputStyle} />
        </Field>
        <Field label="Linked Event (optional)">
          <select value={form.eventId} onChange={e => set("eventId", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">None</option>
            {ministryEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </Field>
        <Field label="Role Override">
          <input value={form.role} onChange={e => set("role", e.target.value)} placeholder="Defaults to volunteer's role" style={inputStyle} />
        </Field>
        {isEdit && (
          <Field label="Status">
            <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {["SCHEDULED","CONFIRMED","DECLINED","COMPLETED"].map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </Field>
        )}
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Optional note..." />
          </Field>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Schedule Volunteer"}</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════
function MinistryEvents({ t, ministry }) {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true); setError("");
    eventsApi.list({ ministryId: ministry.id, limit: 50 })
      .then(d => setEvents(d.events || [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [ministry.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner t={t} />;

  return (
    <div>
      {error && <ErrorMsg t={t} message={error} />}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn t={t} onClick={() => { setEditTarget(null); setShowForm(true); }}><Ico name="plus" size={14} /> Schedule Event</Btn>
      </div>

      {events.length === 0 ? (
        <Empty t={t} message="No events scheduled for this ministry yet." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {events.map(e => {
            const startDate = new Date(e.startDate);
            const isPast = startDate < new Date();
            return (
              <div key={e.id} onClick={() => { setEditTarget(e); setShowForm(true); }} style={{ background: t.white, borderRadius: 12, padding: "16px 18px", border: `1px solid ${t.border}`, borderLeft: `4px solid ${t.primary}`, cursor: "pointer", opacity: isPast ? 0.7 : 1 }}>
                <div style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", background: t.surface, color: t.primary, display: "inline-block", marginBottom: 8 }}>{e.type}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: t.dark }}>{e.title}</div>
                <div style={{ fontSize: 11, color: t.textMuted }}>
                  📅 {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  {e.location && <> · 📍 {e.location}</>}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>{e.registrationCount} registered{e.capacity ? ` / ${e.capacity}` : ""}</div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <MinistryEventForm t={t} ministryId={ministry.id} event={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={() => { setShowForm(false); setEditTarget(null); load(); }} />
      )}
    </div>
  );
}

function MinistryEventForm({ t, ministryId, event, onClose, onSaved }) {
  const isEdit = !!event;
  const inputStyle = inputStyleFor(t);
  const [form, setForm] = useState({
    title:       event?.title       || "",
    description: event?.description || "",
    location:    event?.location    || "",
    startDate:   event?.startDate   ? new Date(event.startDate).toISOString().slice(0,16) : "",
    endDate:     event?.endDate     ? new Date(event.endDate).toISOString().slice(0,16)   : "",
    capacity:    event?.capacity    ? String(event.capacity) : "",
    type:        event?.type        || "General",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Event title is required."); return; }
    if (!form.startDate)    { setError("Start date is required.");  return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, ministryId, capacity: form.capacity ? parseInt(form.capacity) : null, endDate: form.endDate || null };
      isEdit ? await eventsApi.update(event.id, payload) : await eventsApi.create(payload);
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <Modal t={t} title={isEdit ? "Edit Event" : "Schedule Event"} onClose={onClose}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Event Title" required>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Sunday School Kickoff" style={inputStyle} />
          </Field>
        </div>
        <Field label="Type">
          <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {EVENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Room 201" style={inputStyle} />
        </Field>
        <Field label="Start Date & Time" required>
          <input value={form.startDate} onChange={e => set("startDate", e.target.value)} type="datetime-local" style={inputStyle} />
        </Field>
        <Field label="End Date & Time (optional)">
          <input value={form.endDate} onChange={e => set("endDate", e.target.value)} type="datetime-local" style={inputStyle} />
        </Field>
        <Field label="Capacity (leave blank for unlimited)">
          <input value={form.capacity} onChange={e => set("capacity", e.target.value)} type="number" min="1" style={inputStyle} />
        </Field>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Schedule Event"}</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-DEPARTMENTS
// ═══════════════════════════════════════════════════════════════
function MinistrySubDepartments({ t, ministry }) {
  const [subDepartments, setSubDepartments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rosterTarget, setRosterTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true); setError("");
    ministriesApi.subDepartments.list(ministry.id)
      .then(d => setSubDepartments(d.subDepartments || [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [ministry.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await ministriesApi.subDepartments.delete(ministry.id, deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { setError(e.message); } finally { setDeleting(false); }
  };

  if (loading) return <Spinner t={t} />;

  return (
    <div>
      {error && <ErrorMsg t={t} message={error} />}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn t={t} onClick={() => { setEditTarget(null); setShowForm(true); }}><Ico name="plus" size={14} /> Add Sub-Department</Btn>
      </div>

      <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {["Name","Age Range","Members","Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subDepartments.length === 0
              ? <tr><td colSpan={4}><Empty t={t} message="No sub-departments yet for this ministry." /></td></tr>
              : subDepartments.map(sd => (
                <tr key={sd.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: "10px 13px", fontWeight: 500 }}>{sd.name}</td>
                  <td style={{ padding: "10px 13px", color: t.textMuted }}>
                    {sd.ageRangeMin != null || sd.ageRangeMax != null
                      ? `${sd.ageRangeMin ?? "0"}–${sd.ageRangeMax ?? "+"}`
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 13px" }}>{sd.memberCount}</td>
                  <td style={{ padding: "10px 13px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <Btn small t={t} variant="secondary" onClick={() => setRosterTarget(sd)}>Manage Roster</Btn>
                      <Btn small t={t} variant="ghost" onClick={() => { setEditTarget(sd); setShowForm(true); }}><Ico name="edit" size={12} /></Btn>
                      <Btn small t={t} variant="danger" onClick={() => setDeleteTarget(sd)}><Ico name="trash" size={12} /></Btn>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showForm && (
        <SubDepartmentForm t={t} ministryId={ministry.id} subDepartment={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={() => { setShowForm(false); setEditTarget(null); load(); }} />
      )}
      {deleteTarget && (
        <Modal t={t} title="Delete Sub-Department" onClose={() => setDeleteTarget(null)} width={400}>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            Delete <strong>{deleteTarget.name}</strong>? This removes it for all {deleteTarget.memberCount} assigned member{deleteTarget.memberCount === 1 ? "" : "s"} and cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Btn>
          </div>
        </Modal>
      )}
      {rosterTarget && (
        <SubDepartmentRoster t={t} ministryId={ministry.id} subDepartment={rosterTarget}
          onClose={() => setRosterTarget(null)}
          onChanged={load} />
      )}
    </div>
  );
}

function SubDepartmentForm({ t, ministryId, subDepartment, onClose, onSaved }) {
  const isEdit = !!subDepartment;
  const inputStyle = inputStyleFor(t);
  const [form, setForm] = useState({
    name:        subDepartment?.name || "",
    ageRangeMin: subDepartment?.ageRangeMin != null ? String(subDepartment.ageRangeMin) : "",
    ageRangeMax: subDepartment?.ageRangeMax != null ? String(subDepartment.ageRangeMax) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      isEdit
        ? await ministriesApi.subDepartments.update(ministryId, subDepartment.id, form)
        : await ministriesApi.subDepartments.create(ministryId, form);
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <Modal t={t} title={isEdit ? "Edit Sub-Department" : "Add Sub-Department"} onClose={onClose}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Name" required>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Nursery, Elementary, Youth Band" style={inputStyle} />
          </Field>
        </div>
        <Field label="Min Age (optional)">
          <input value={form.ageRangeMin} onChange={e => set("ageRangeMin", e.target.value)} type="number" min="0" style={inputStyle} />
        </Field>
        <Field label="Max Age (optional)">
          <input value={form.ageRangeMax} onChange={e => set("ageRangeMax", e.target.value)} type="number" min="0" style={inputStyle} />
        </Field>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Add Sub-Department"}</Btn>
      </div>
    </Modal>
  );
}

function SubDepartmentRoster({ t, ministryId, subDepartment, onClose, onChanged }) {
  const inputStyle = inputStyleFor(t);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [memberList,   setMemberList]   = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError("");
    ministriesApi.subDepartments.members.list(ministryId, subDepartment.id)
      .then(d => setMembers(d.members || [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [ministryId, subDepartment.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (memberSearch.length < 2) { setMemberList([]); return; }
    membersApi.list({ search: memberSearch, limit: 10 }).then(d => setMemberList(d.members || [])).catch(() => {});
  }, [memberSearch]);

  const handleAdd = async (memberId) => {
    setAdding(true); setError("");
    try {
      await ministriesApi.subDepartments.members.add(ministryId, subDepartment.id, { memberId });
      setMemberSearch(""); setMemberList([]);
      load(); onChanged();
    } catch (e) { setError(e.message); } finally { setAdding(false); }
  };

  const handleRemove = async (memberId) => {
    try {
      await ministriesApi.subDepartments.members.remove(ministryId, subDepartment.id, memberId);
      load(); onChanged();
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal t={t} title={`${subDepartment.name} — Roster`} onClose={onClose} width={520}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}

      <div style={{ position: "relative", marginBottom: 16 }}>
        <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members to add..." style={inputStyle} disabled={adding} />
        {memberList.length > 0 && (
          <div style={{ position:"absolute", top:"100%", left:0, right:0, background:t.white, border:`1px solid ${t.border}`, borderRadius:9, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", zIndex:10, maxHeight:200, overflow:"auto" }}>
            {memberList.map(m => (
              <button key={m.id} onClick={() => handleAdd(m.id)} disabled={adding}
                style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left", background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:"inherit", borderBottom:`1px solid ${t.border}` }}>
                {m.firstName} {m.lastName}{m.isMinor ? " (minor)" : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? <Spinner t={t} /> : (
        <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {["Name","Status","Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0
                ? <tr><td colSpan={3}><Empty t={t} message="No members assigned yet." /></td></tr>
                : members.map(entry => (
                  <tr key={entry.memberId} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "10px 13px", fontWeight: 500 }}>{entry.member.firstName} {entry.member.lastName}</td>
                    <td style={{ padding: "10px 13px" }}><StatusBadge status={entry.member.memberStatus} /></td>
                    <td style={{ padding: "10px 13px" }}>
                      <Btn small t={t} variant="danger" onClick={() => handleRemove(entry.memberId)}><Ico name="trash" size={12} /></Btn>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}
