// src/pages/Events.jsx
import { useState, useEffect, useCallback } from "react";
import { events as eventsApi, members as membersApi } from "../lib/api.js";
import {
  PageHeader, Btn, Ico, Spinner, ErrorMsg, Empty,
  Modal, Field, StatusBadge, Stat,
} from "../components/ui/index.jsx";

const EVENT_TYPES = ["Worship","Study","Youth","Conference","Fellowship","Training","Outreach","General"];
const RECURRING   = ["None","Weekly","Bi-weekly","Monthly","Annual"];

const TYPE_COLORS = {
  Worship:    { bg: "#EEF2FF", color: "#4338CA" },
  Study:      { bg: "#E0F2FE", color: "#0369A1" },
  Youth:      { bg: "#FEF3C7", color: "#92400E" },
  Conference: { bg: "#F3E8FF", color: "#7E22CE" },
  Fellowship: { bg: "#DCFCE7", color: "#166534" },
  Training:   { bg: "#FEF9C3", color: "#854D0E" },
  Outreach:   { bg: "#CCFBF1", color: "#0F766E" },
  General:    { bg: "#F1F5F9", color: "#475569" },
};

export default function Events({ t }) {
  const [view, setView] = useState("list");   // list | detail | form
  const [detailId, setDetailId] = useState(null);
  const [editEvent, setEditEvent] = useState(null);

  const openDetail = (id)    => { setDetailId(id); setView("detail"); };
  const openCreate = ()      => { setEditEvent(null); setView("form"); };
  const openEdit   = (event) => { setEditEvent(event); setView("form"); };
  const goBack     = ()      => { setView("list"); setDetailId(null); setEditEvent(null); };

  return (
    <div>
      {view === "list"   && <EventList   t={t} onDetail={openDetail} onCreate={openCreate} />}
      {view === "detail" && <EventDetail t={t} eventId={detailId}   onBack={goBack} onEdit={openEdit} />}
      {view === "form"   && <EventForm   t={t} event={editEvent}    onBack={goBack} onSaved={goBack} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EVENT LIST
// ═══════════════════════════════════════════════════════════════
function EventList({ t, onDetail, onCreate }) {
  const [data,    setData]    = useState({ events: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter,  setTypeFilter]  = useState("");
  const [timeFilter,  setTimeFilter]  = useState("upcoming"); // upcoming | past | all
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true); setError("");
    eventsApi.list({
      page, limit: 12, search,
      type: typeFilter,
      upcoming: timeFilter === "upcoming" ? "true" : "",
      past:     timeFilter === "past"     ? "true" : "",
    })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, typeFilter, timeFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { events, pagination } = data;

  // Group events by month for a cleaner calendar-like display
  const byMonth = {};
  events.forEach(e => {
    const key = new Date(e.startDate).toLocaleString("default", { month: "long", year: "numeric" });
    (byMonth[key] = byMonth[key] || []).push(e);
  });

  return (
    <div>
      <PageHeader t={t} title="Events & Scheduling"
        subtitle={pagination.total ? `${pagination.total} events` : ""}
        actions={<Btn t={t} onClick={onCreate}><Ico name="plus" size={14} /> New Event</Btn>}
      />

      {error && <ErrorMsg t={t} message={error} />}

      <div style={{ padding: "18px 32px" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}>
              <Ico name="search" size={15} />
            </div>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search events..."
              style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: t.white, boxSizing: "border-box" }} />
          </div>

          {/* Time filter buttons */}
          <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: `1px solid ${t.border}` }}>
            {[["upcoming","Upcoming"],["all","All"],["past","Past"]].map(([val, label]) => (
              <button key={val} onClick={() => { setTimeFilter(val); setPage(1); }}
                style={{ padding: "9px 16px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: timeFilter === val ? 600 : 400, background: timeFilter === val ? t.primary : t.white, color: timeFilter === val ? "#fff" : t.textMuted, transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>

          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 12, fontFamily: "inherit", background: t.white, cursor: "pointer" }}>
            <option value="">All Types</option>
            {EVENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </div>

        {loading ? <Spinner t={t} /> : events.length === 0 ? (
          <Empty t={t} message="No events found. Create your first event!" />
        ) : (
          <>
            {Object.entries(byMonth).map(([month, evts]) => (
              <div key={month} style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: t.dark, margin: "0 0 12px", fontFamily: "'DM Serif Display', serif" }}>
                  {month}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                  {evts.map(e => <EventCard key={e.id} t={t} event={e} onClick={() => onDetail(e.id)} />)}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 12 }}>
                <span style={{ color: t.textMuted }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Prev</Btn>
                  <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} disabled={page === pagination.totalPages}>Next</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────
function EventCard({ t, event, onClick }) {
  const colors     = TYPE_COLORS[event.type] || TYPE_COLORS.General;
  const startDate  = new Date(event.startDate);
  const isPast     = startDate < new Date();
  const capPct     = event.capacity ? Math.round((event.registrationCount / event.capacity) * 100) : null;
  const isFull     = capPct !== null && capPct >= 100;

  return (
    <div onClick={onClick} style={{
      background: t.white, borderRadius: 12, padding: "18px 20px",
      border: `1px solid ${t.border}`, borderLeft: `4px solid ${colors.color}`,
      cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
      opacity: isPast ? 0.75 : 1,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.07)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", background: colors.bg, color: colors.color }}>
          {event.type}
        </span>
        {event.isRecurring && <span style={{ fontSize: 10, color: t.textMuted }}>🔄 Recurring</span>}
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: t.dark }}>{event.title}</div>

      <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 8 }}>
        📅 {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        {event.location && <> · 📍 {event.location}</>}
      </div>

      {event.description && (
        <p style={{ fontSize: 12, color: t.textMuted, margin: "0 0 10px", lineHeight: 1.4,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {event.description}
        </p>
      )}

      {/* Capacity bar */}
      {event.capacity && (
        <div>
          <div style={{ height: 5, background: t.surface, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ width: `${Math.min(capPct, 100)}%`, height: "100%", borderRadius: 3,
              background: isFull ? t.danger : capPct > 75 ? t.warning : t.primary, transition: "width 0.4s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: t.textMuted }}>
            <span>{event.registrationCount} / {event.capacity} registered</span>
            {isFull && <span style={{ color: t.danger, fontWeight: 600 }}>FULL</span>}
          </div>
        </div>
      )}

      {!event.capacity && (
        <div style={{ fontSize: 11, color: t.textMuted }}>{event.registrationCount} registered · No capacity limit</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EVENT DETAIL VIEW
// ═══════════════════════════════════════════════════════════════
function EventDetail({ t, eventId, onBack, onEdit }) {
  const [event,    setEvent]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState("");
  const [showRegForm, setShowRegForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [regLoading, setRegLoading] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    eventsApi.getById(eventId)
      .then(setEvent)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteEvent = async () => {
    setDeleting(true);
    try { await eventsApi.delete(eventId); onBack(); }
    catch (e) { setError(e.message); setDeleting(false); }
  };

  const handleMarkAttended = async (reg) => {
    setRegLoading(p => ({ ...p, [reg.id]: true }));
    try {
      await eventsApi.updateReg(eventId, reg.id, {
        status: reg.status === "ATTENDED" ? "REGISTERED" : "ATTENDED",
        checkedInAt: reg.status === "ATTENDED" ? null : new Date().toISOString(),
      });
      load();
    } catch (e) { setError(e.message); }
    finally { setRegLoading(p => ({ ...p, [reg.id]: false })); }
  };

  const handleCancelReg = async (reg) => {
    setRegLoading(p => ({ ...p, [reg.id]: true }));
    try { await eventsApi.cancelReg(eventId, reg.id); load(); }
    catch (e) { setError(e.message); }
    finally { setRegLoading(p => ({ ...p, [reg.id]: false })); }
  };

  if (loading) return <><PageHeader t={t} title="Event" actions={<Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>} /><Spinner t={t} /></>;
  if (error)   return <><PageHeader t={t} title="Event" actions={<Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>} /><ErrorMsg t={t} message={error} /></>;

  const colors     = TYPE_COLORS[event.type] || TYPE_COLORS.General;
  const startDate  = new Date(event.startDate);
  const capPct     = event.capacity ? Math.round((event.registrationCount / event.capacity) * 100) : null;
  const registered = event.registrations?.filter(r => r.status === "REGISTERED"  || r.status === "ATTENDED") || [];
  const waitlisted = event.registrations?.filter(r => r.status === "WAITLISTED") || [];
  const attended   = event.registrations?.filter(r => r.status === "ATTENDED")   || [];

  return (
    <div>
      <PageHeader t={t} title={event.title}
        subtitle={startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>
            <Btn t={t} variant="secondary" onClick={() => onEdit(event)}><Ico name="edit" size={14} /> Edit Event</Btn>
            <Btn t={t} variant="danger" onClick={() => setDeleteTarget(event)}><Ico name="trash" size={14} /></Btn>
          </div>
        }
      />

      {error && <ErrorMsg t={t} message={error} />}

      <div style={{ padding: "22px 32px", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>

        {/* Event Details Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, textTransform: "uppercase", background: colors.bg, color: colors.color }}>{event.type}</span>
              {event.isRecurring && <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: t.surface, color: t.textMuted }}>🔄 {event.recurringRule || "Recurring"}</span>}
            </div>

            {[
              ["📅 Date & Time", startDate.toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })],
              ["📍 Location",    event.location || "—"],
              ["👥 Capacity",    event.capacity ? `${event.capacity} spots` : "Unlimited"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
              </div>
            ))}

            {event.description && (
              <div style={{ paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 13, color: t.text, lineHeight: 1.6, margin: 0 }}>{event.description}</p>
              </div>
            )}
          </div>

          {/* Registration Stats */}
          <div style={{ display: "flex", gap: 10 }}>
            <Stat t={t} label="Registered"   value={registered.length} color={t.primary} />
            <Stat t={t} label="Attended"     value={attended.length}   color={t.success} />
            {waitlisted.length > 0 && <Stat t={t} label="Waitlisted" value={waitlisted.length} color={t.warning} />}
          </div>

          {/* Capacity bar */}
          {event.capacity && (
            <div style={{ background: t.white, borderRadius: 12, padding: 18, border: `1px solid ${t.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Capacity</div>
              <div style={{ height: 10, background: t.surface, borderRadius: 5, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${Math.min(capPct, 100)}%`, height: "100%", borderRadius: 5, background: capPct >= 100 ? t.danger : capPct > 75 ? t.warning : t.primary, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 12, color: t.textMuted }}>{event.registrationCount} / {event.capacity} ({capPct}% full)</div>
            </div>
          )}
        </div>

        {/* Registrations Panel */}
        <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>Registrations</h3>
            <Btn t={t} small onClick={() => setShowRegForm(true)}><Ico name="plus" size={13} /> Add Registration</Btn>
          </div>

          {event.registrations?.length === 0 ? (
            <Empty t={t} message="No registrations yet." />
          ) : (
            <div style={{ maxHeight: 480, overflow: "auto" }}>
              {/* Registered */}
              {registered.length > 0 && (
                <>
                  <div style={{ padding: "10px 20px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, background: t.surface }}>Registered ({registered.length})</div>
                  {registered.map(reg => (
                    <RegistrationRow key={reg.id} t={t} reg={reg} loading={regLoading[reg.id]}
                      onToggleAttend={() => handleMarkAttended(reg)}
                      onCancel={() => handleCancelReg(reg)} />
                  ))}
                </>
              )}

              {/* Waitlisted */}
              {waitlisted.length > 0 && (
                <>
                  <div style={{ padding: "10px 20px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.warning, background: "#FFFBEB" }}>Waitlisted ({waitlisted.length})</div>
                  {waitlisted.map(reg => (
                    <RegistrationRow key={reg.id} t={t} reg={reg} loading={regLoading[reg.id]}
                      onToggleAttend={() => handleMarkAttended(reg)}
                      onCancel={() => handleCancelReg(reg)} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Registration Modal */}
      {showRegForm && (
        <AddRegistrationForm t={t} eventId={eventId}
          onClose={() => setShowRegForm(false)}
          onSaved={() => { setShowRegForm(false); load(); }} />
      )}

      {/* Delete Event Confirm */}
      {deleteTarget && (
        <Modal t={t} title="Delete Event" onClose={() => setDeleteTarget(null)} width={420}>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            Are you sure you want to delete <strong>{deleteTarget.title}</strong>? All registrations will also be removed. This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleDeleteEvent} disabled={deleting}>{deleting ? "Deleting..." : "Delete Event"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Registration Row ─────────────────────────────────────────
function RegistrationRow({ t, reg, onToggleAttend, onCancel, loading }) {
  const isAttended = reg.status === "ATTENDED";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${t.border}`, opacity: loading ? 0.5 : 1 }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: 13 }}>
          {reg.member.firstName} {reg.member.lastName}
          {reg.member.isMinor && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#FFF3E0", color: "#C68A0A", fontWeight: 700 }}>MINOR</span>}
        </div>
        <div style={{ fontSize: 11, color: t.textMuted }}>
          Registered {new Date(reg.registeredAt).toLocaleDateString()}
          {reg.checkedInAt && <> · Checked in {new Date(reg.checkedInAt).toLocaleTimeString()}</>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={onToggleAttend} disabled={loading}
          style={{ padding: "4px 10px", borderRadius: 7, border: `1px solid ${isAttended ? t.success : t.border}`, background: isAttended ? "#E8F5EE" : t.white, color: isAttended ? t.success : t.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
          <Ico name="check" size={12} /> {isAttended ? "Attended" : "Mark Attended"}
        </button>
        <Btn small t={t} variant="danger" onClick={onCancel} disabled={loading}><Ico name="x" size={12} /></Btn>
      </div>
    </div>
  );
}

// ─── Add Registration Form ────────────────────────────────────
function AddRegistrationForm({ t, eventId, onClose, onSaved }) {
  const [memberSearch, setMemberSearch] = useState("");
  const [memberList,   setMemberList]   = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [notes,  setNotes]  = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (memberSearch.length < 2) { setMemberList([]); return; }
    membersApi.list({ search: memberSearch, limit: 8 })
      .then(d => setMemberList(d.members || []))
      .catch(() => {});
  }, [memberSearch]);

  const handleSubmit = async () => {
    if (!selectedMember) { setError("Please select a member."); return; }
    setSaving(true); setError("");
    try {
      const res = await eventsApi.register(eventId, { memberId: selectedMember.id, notes });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (result) {
    return (
      <Modal t={t} title="Registration Confirmed" onClose={onSaved} width={400}>
        <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{result.waitlisted ? "⏳" : "✅"}</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: result.waitlisted ? "#C68A0A" : t.success }}>
            {result.waitlisted ? "Added to Waitlist" : "Successfully Registered"}
          </div>
          <div style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>
            {selectedMember.firstName} {selectedMember.lastName}
            {result.waitlisted && " has been placed on the waitlist and will be notified if a spot opens."}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Btn t={t} onClick={onSaved}>Done</Btn>
        </div>
      </Modal>
    );
  }

  const inputStyle = { width: "100%", padding: "9px 13px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  return (
    <Modal t={t} title="Add Registration" onClose={onClose} width={480}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}

      <Field label="Member" required>
        {selectedMember ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", borderRadius: 9, border: `1px solid ${t.primary}`, background: t.surface }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{selectedMember.firstName} {selectedMember.lastName}</span>
            <button onClick={() => { setSelectedMember(null); setMemberSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}><Ico name="x" size={14} /></button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
              placeholder="Search by name..." style={inputStyle} />
            {memberList.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: t.white, border: `1px solid ${t.border}`, borderRadius: 9, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 220, overflow: "auto" }}>
                {memberList.map(m => (
                  <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(""); setMemberList([]); }}
                    style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.surface}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontWeight: 500 }}>{m.firstName} {m.lastName}</span>
                    {m.family && <span style={{ color: t.textMuted, marginLeft: 6, fontSize: 11 }}>· {m.family.familyName}</span>}
                    {m.isMinor && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#FFF3E0", color: "#C68A0A", fontWeight: 700 }}>MINOR</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Field>

      <Field label="Notes (optional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Any notes about this registration..."
          style={{ ...inputStyle, resize: "vertical" }} />
      </Field>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving || !selectedMember}>
          {saving ? "Registering..." : "Register Member"}
        </Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// EVENT FORM (Create / Edit)
// ═══════════════════════════════════════════════════════════════
function EventForm({ t, event, onBack, onSaved }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title:        event?.title        || "",
    description:  event?.description  || "",
    location:     event?.location     || "",
    startDate:    event?.startDate    ? new Date(event.startDate).toISOString().slice(0,16) : "",
    endDate:      event?.endDate      ? new Date(event.endDate).toISOString().slice(0,16)   : "",
    capacity:     event?.capacity     ? String(event.capacity) : "",
    type:         event?.type         || "Worship",
    isRecurring:  event?.isRecurring  || false,
    recurringRule: event?.recurringRule || "None",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inputStyle = { width: "100%", padding: "9px 13px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Event title is required."); return; }
    if (!form.startDate)    { setError("Start date is required.");  return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        endDate:  form.endDate  || null,
        recurringRule: form.isRecurring ? form.recurringRule : null,
      };
      isEdit
        ? await eventsApi.update(event.id, payload)
        : await eventsApi.create(payload);
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader t={t}
        title={isEdit ? `Edit — ${event.title}` : "Create New Event"}
        actions={<Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>}
      />
      <div style={{ padding: "24px 32px", maxWidth: 680 }}>
        <div style={{ background: t.white, borderRadius: 14, padding: 28, border: `1px solid ${t.border}` }}>

          {error && <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}

          {/* Basic Info */}
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 14 }}>Event Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Event Title" required>
                <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Sunday Worship Service" style={{ ...inputStyle, width: "100%" }} />
              </Field>
            </div>
            <Field label="Type">
              <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {EVENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Main Sanctuary, Room 201" style={inputStyle} />
            </Field>
            <Field label="Capacity (leave blank for unlimited)">
              <input value={form.capacity} onChange={e => set("capacity", e.target.value)} type="number" min="1" placeholder="e.g. 200" style={inputStyle} />
            </Field>
          </div>

          {/* Date & Time */}
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 14 }}>Date & Time</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <Field label="Start Date & Time" required>
              <input value={form.startDate} onChange={e => set("startDate", e.target.value)} type="datetime-local" style={inputStyle} />
            </Field>
            <Field label="End Date & Time (optional)">
              <input value={form.endDate} onChange={e => set("endDate", e.target.value)} type="datetime-local" style={inputStyle} />
            </Field>
          </div>

          {/* Recurring */}
          <div style={{ marginBottom: 20 }}>
            <button type="button" onClick={() => set("isRecurring", !form.isRecurring)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, border: `1px solid ${form.isRecurring ? t.primary : t.border}`, background: form.isRecurring ? t.surface : t.white, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: form.isRecurring ? `2px solid ${t.primary}` : `2px solid ${t.border}`, background: form.isRecurring ? t.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                {form.isRecurring && <Ico name="check" size={12} />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>This is a recurring event</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>e.g. every Sunday, weekly Bible study</div>
              </div>
            </button>
            {form.isRecurring && (
              <div style={{ marginTop: 10 }}>
                <Field label="Recurring Schedule">
                  <select value={form.recurringRule} onChange={e => set("recurringRule", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {RECURRING.filter(r => r !== "None").map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            )}
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="What should attendees know about this event?" rows={3}
              style={{ ...inputStyle, resize: "vertical" }} />
          </Field>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn t={t} variant="ghost" onClick={onBack}>Cancel</Btn>
            <Btn t={t} onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
