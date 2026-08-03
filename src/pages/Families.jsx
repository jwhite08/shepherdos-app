// src/pages/Families.jsx
import { useState, useEffect, useCallback } from "react";
import { families as familiesApi } from "../lib/api.js";
import { PageHeader, Btn, Ico, Spinner, ErrorMsg, Empty, Modal, StatusBadge, Field } from "../components/ui/index.jsx";

const EMPTY_FORM = { familyName: "", address: "", city: "", state: "", zip: "", phone: "", notes: "" };

export default function Families({ t }) {
  const [familyList, setFamilyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editFamily, setEditFamily] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    familiesApi.list({ search })
      .then(setFamilyList)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await familiesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (selected) {
    const family = familyList.find(f => f.id === selected);
    if (!family) return null;
    return <FamilyDetail t={t} family={family} onBack={() => setSelected(null)}
      onEdit={() => { setEditFamily(family); setSelected(null); setShowForm(true); }} />;
  }

  return (
    <div>
      <PageHeader t={t} title="Families" subtitle={`${familyList.length} families`}
        actions={<Btn t={t} onClick={() => { setEditFamily(null); setShowForm(true); }}><Ico name="plus" size={14} /> Add Family</Btn>}
      />
      {error && <ErrorMsg t={t} message={error} />}
      <div style={{ padding: "18px 32px" }}>
        <div style={{ position: "relative", marginBottom: 16, maxWidth: 400 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}><Ico name="search" size={15} /></div>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search families..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: t.white }} />
        </div>

        {loading ? <Spinner t={t} /> : familyList.length === 0 ? <Empty t={t} message="No families found." /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {familyList.map(f => (
              <div key={f.id} style={{ background: t.white, borderRadius: 12, padding: "18px 20px", border: `1px solid ${t.border}`, transition: "transform 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <button onClick={() => setSelected(f.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", padding: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: t.primary }}>{f.familyName}</div>
                    {f.address && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{f.city}, {f.state}</div>}
                  </button>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn small t={t} variant="ghost" onClick={() => { setEditFamily(f); setShowForm(true); }}><Ico name="edit" size={12} /></Btn>
                    <Btn small t={t} variant="danger" onClick={() => setDeleteTarget(f)}><Ico name="trash" size={12} /></Btn>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {f.members?.map(m => (
                    <span key={m.id} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 7, background: t.surface, fontWeight: 500 }}>
                      {m.firstName} {m.isMinor ? "👶" : ""}
                    </span>
                  ))}
                </div>
                {f.members?.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: t.textMuted }}>
                    {f.members.filter(m => !m.isMinor).length} adult(s) · {f.members.filter(m => m.isMinor).length} minor(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <FamilyForm t={t} family={editFamily} onClose={() => { setShowForm(false); setEditFamily(null); }} onSaved={() => { setShowForm(false); setEditFamily(null); load(); }} />}

      {deleteTarget && (
        <Modal t={t} title="Delete Family" onClose={() => setDeleteTarget(null)} width={420}>
          <p style={{ color: t.text, fontSize: 14, marginBottom: 20 }}>
            Are you sure you want to delete <strong>{deleteTarget.familyName}</strong>? Members in this family will not be deleted but will be unlinked from the family. This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn t={t} variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn t={t} variant="red" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Yes, Delete"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FamilyDetail({ t, family, onBack, onEdit }) {
  return (
    <div>
      <PageHeader t={t} title={family.familyName} subtitle={`${family.members?.length || 0} members`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn t={t} variant="ghost" onClick={onBack}>← Back</Btn>
            <Btn t={t} variant="secondary" onClick={onEdit}><Ico name="edit" size={14} /> Edit Family</Btn>
          </div>
        }
      />
      <div style={{ padding: "22px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}` }}>
          <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>Contact Information</h3>
          {[["Address", family.address], ["City", family.city], ["State", family.state], ["ZIP", family.zip], ["Phone", family.phone]].map(([l, v]) => v ? (
            <div key={l} style={{ display: "flex", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
              <span style={{ width: 100, fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
            </div>
          ) : null)}
          {family.notes && <p style={{ marginTop: 14, fontSize: 13, color: t.textMuted }}>{family.notes}</p>}
        </div>
        <div style={{ background: t.white, borderRadius: 12, padding: 22, border: `1px solid ${t.border}` }}>
          <h3 style={{ margin: "0 0 14px", fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark }}>Family Members</h3>
          {family.members?.map(m => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>
                {m.firstName} {m.lastName}
                {m.isMinor && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#FFF3E0", color: t.warning, fontWeight: 700 }}>MINOR</span>}
              </div>
              <StatusBadge status={m.memberStatus} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FamilyForm({ t, family, onClose, onSaved }) {
  const [form, setForm] = useState(family ? {
    familyName: family.familyName || "", address: family.address || "",
    city: family.city || "", state: family.state || "",
    zip: family.zip || "", phone: family.phone || "", notes: family.notes || "",
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle = { width: "100%", padding: "9px 13px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  const handleSubmit = async () => {
    if (!form.familyName.trim()) { setError("Family name is required."); return; }
    setSaving(true); setError("");
    try {
      family ? await familiesApi.update(family.id, form) : await familiesApi.create(form);
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal t={t} title={family ? `Edit — ${family.familyName}` : "Add New Family"} onClose={onClose}>
      {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Family Name" required><input value={form.familyName} onChange={e => set("familyName", e.target.value)} placeholder="e.g. The Johnson Family" style={{ ...inputStyle, width: "100%" }} /></Field>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Address"><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St" style={{ ...inputStyle, width: "100%" }} /></Field>
        </div>
        <Field label="City"><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" style={inputStyle} /></Field>
        <Field label="State"><input value={form.state} onChange={e => set("state", e.target.value)} placeholder="SC" style={inputStyle} /></Field>
        <Field label="ZIP"><input value={form.zip} onChange={e => set("zip", e.target.value)} placeholder="00000" style={inputStyle} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(000) 000-0000" style={inputStyle} /></Field>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", width: "100%" }} /></Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : family ? "Save Changes" : "Add Family"}</Btn>
      </div>
    </Modal>
  );
}
