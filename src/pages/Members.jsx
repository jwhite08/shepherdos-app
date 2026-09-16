// src/pages/Members.jsx
import { useState, useEffect, useCallback } from "react";
import { members as membersApi } from "../lib/api.js";
import { PageHeader, Btn, Ico, Spinner, ErrorMsg, StatusBadge, Empty, Modal } from "../components/ui/index.jsx";
import MemberForm from "../components/MemberForm.jsx";

export default function Members({ t }) {
  const [data, setData] = useState({ members: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    membersApi.list({ page, limit: 20, search, status: statusFilter })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounced search — wait 400ms after typing before fetching
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSaved = (saved) => {
    setShowForm(false);
    setEditMember(null);
    load(); // Refresh the list
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await membersApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const { members, pagination } = data;

  // ── Member Detail View ────────────────────────────────────────
  if (selectedMember) {
    return <MemberDetail t={t} memberId={selectedMember}
      onBack={() => setSelectedMember(null)}
      onEdit={(m) => { setEditMember(m); setSelectedMember(null); setShowForm(true); }} />;
  }

  return (
    <div>
      <PageHeader t={t} title="Membership"
        subtitle={pagination.total ? `${pagination.total} total members` : ""}
        actions={
          <Btn t={t} onClick={() => { setEditMember(null); setShowForm(true); }}>
            <Ico name="plus" size={14} /> Add Member
          </Btn>
        }
      />

      {error && <ErrorMsg t={t} message={error} />}

      <div style={{ padding: "18px 32px" }}>
        {/* Search & Filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}>
              <Ico name="search" size={15} />
            </div>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or phone..."
              style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: t.white, boxSizing: "border-box" }} />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "9px 14px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 12, fontFamily: "inherit", background: t.white, cursor: "pointer" }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="NEW_MEMBER">New Members</option>
            <option value="VISITOR">Visitors</option>
          </select>
        </div>

        {/* Table */}
        {loading ? <Spinner t={t} /> : (
          <>
            <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: t.surface }}>
                    {["Name", "Email", "Phone", "Family", "Status", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 13px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: t.primary, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr><td colSpan={6}><Empty t={t} message="No members found. Try adjusting your search." /></td></tr>
                  ) : members.map(m => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${t.border}`, transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = t.surface}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 13px" }}>
                        <button onClick={() => setSelectedMember(m.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, color: t.primary, fontFamily: "inherit", padding: 0, textAlign: "left" }}>
                          {m.firstName} {m.lastName}
                          {m.isMinor && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 5, background: "#FFF3E0", color: t.warning, fontWeight: 700 }}>MINOR</span>}
                        </button>
                      </td>
                      <td style={{ padding: "10px 13px", color: t.textMuted }}>{m.email || "—"}</td>
                      <td style={{ padding: "10px 13px" }}>{m.phone || "—"}</td>
                      <td style={{ padding: "10px 13px", color: t.textMuted }}>{m.family?.familyName || "—"}</td>
                      <td style={{ padding: "10px 13px" }}><StatusBadge status={m.memberStatus} /></td>
                      <td style={{ padding: "10px 13px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <Btn small t={t} variant="ghost" onClick={() => { setEditMember(m); setShowForm(true); }}>
                            <Ico name="edit" size={12} />
                          </Btn>
                          <Btn small t={t} variant="danger" onClick={() => setDeleteTarget(m)}>
                            <Ico name="trash" size={12} />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 12 }}>
                <span style={{ color: t.textMuted }}>
                  Showing {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Btn>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page + i - 2;
                    if (p > pagination.totalPages || p < 1) return null;
                    return <Btn key={p} small t={t} variant={p === page ? "primary" : "ghost"} onClick={() => setPage(p)}>{p}</Btn>;
                  })}
                  <Btn small t={t} variant="ghost" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>Next</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <MemberForm t={t} member={editMember}
          onClose={() => { setShowForm(false); setEditMember(null); }}
          onSaved={handleSaved} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal t={t} title="Delete Member" onClose={() => setDeleteTarget(null)} width={420}>
          <p style={{ color: t.text, fontSize: 14, marginBottom: 20 }}>
            Are you sure you want to delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>? This will also remove their contribution records and attendance history. This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Member Detail ─────────────────────────────────────────────
function MemberDetail({ t, memberId, onBack, onEdit }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    membersApi.getById(memberId)
      .then(setMember)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return <><PageHeader t={t} title="Member Profile" actions={<Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>} /><Spinner t={t} /></>;
  if (error) return <><PageHeader t={t} title="Member Profile" actions={<Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>} /><ErrorMsg t={t} message={error} /></>;

  const ytdGiving = member.contributions?.reduce((s, c) => s + Number(c.amount), 0) || 0;

  return (
    <div>
      <PageHeader t={t} title={`${member.firstName} ${member.lastName}`}
        subtitle={`Member since ${member.joinDate ? new Date(member.joinDate).toLocaleDateString() : "Unknown"}`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>
            <Btn t={t} variant="secondary" onClick={() => onEdit(member)}>
              <Ico name="edit" size={14} /> Edit Member
            </Btn>
          </div>
        }
      />
      <div style={{ padding: "22px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* Contact Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}` }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>Contact Information</h3>
            {[
              ["Email", member.email || "—"],
              ["Phone", member.phone || "—"],
              ["Address", [member.address, member.city, member.state, member.zip].filter(Boolean).join(", ") || "—"],
              ["Family", member.family?.familyName || "—"],
              ["Status", null],
              ["Member ID", member.id],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ width: 120, fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{label}</span>
                {label === "Status"
                  ? <StatusBadge status={member.memberStatus} />
                  : <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>}
              </div>
            ))}
          </div>

          {/* Ministry Involvement */}
          <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}` }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>Ministry Involvement</h3>
            {!member.subDepartments?.length ? (
              <span style={{ fontSize: 13, color: t.textMuted }}>Not involved in any ministries yet.</span>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {member.subDepartments.map(sd => (
                  <span key={sd.subDepartmentId} style={{ padding: "6px 12px", borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, fontSize: 12, fontWeight: 500 }}>
                    {sd.subDepartment.ministry.icon} {sd.subDepartment.ministry.name} — {sd.subDepartment.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Church & Giving */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}` }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>Giving Summary</h3>
            <div style={{ fontSize: 32, fontWeight: 700, color: t.success }}>${ytdGiving.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 14 }}>Year-to-date ({member.contributions?.length || 0} contributions)</div>
            {member.contributions?.slice(0, 5).map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ color: t.textMuted }}>{new Date(c.date).toLocaleDateString()} · {c.type}</span>
                <span style={{ fontWeight: 600, color: t.success }}>${Number(c.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Minor info */}
          {member.isMinor && (
            <div style={{ background: "#FFF5F5", borderRadius: 12, padding: 22, border: `1px solid #FECACA` }}>
              <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.danger }}>🔐 Child Security Info</h3>
              {[
                ["Guardian", member.guardianName || "—"],
                ["Guardian Phone", member.guardianPhone || "—"],
                ["Allergies", member.allergies || "None on file"],
                ["Medical", member.medicalNotes || "None on file"],
                ["Auth. Pickup", member.authorizedPickup || "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", padding: "7px 0", borderBottom: `1px solid #FECACA` }}>
                  <span style={{ width: 120, fontSize: 11, color: t.danger, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}`, gridColumn: "1/-1" }}>
          <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>Recent Attendance</h3>
          {!member.attendanceLogs?.length ? (
            <span style={{ fontSize: 13, color: t.textMuted }}>No attendance recorded yet.</span>
          ) : (
            member.attendanceLogs.map(log => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontWeight: 500 }}>{log.event?.title || "General Check-In"}</span>
                <span style={{ color: t.textMuted }}>{new Date(log.date).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        {/* Family Members */}
        {member.family?.members?.length > 1 && (
          <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}`, gridColumn: "1/-1" }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>
              Family Members — {member.family.familyName}
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {member.family.members.filter(fm => fm.id !== member.id).map(fm => (
                <div key={fm.id} style={{ padding: "8px 14px", borderRadius: 9, background: t.surface, border: `1px solid ${t.border}`, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  {fm.firstName} {fm.lastName}
                  {fm.isMinor && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#FFF3E0", color: t.warning, fontWeight: 700 }}>MINOR</span>}
                  <StatusBadge status={fm.memberStatus} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
