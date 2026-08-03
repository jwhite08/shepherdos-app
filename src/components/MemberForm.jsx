// src/components/MemberForm.jsx
// Reused for both Add and Edit member actions.

import { useState, useEffect } from "react";
import { Modal, Field, Input, Select, Textarea, Btn } from "./ui/index.jsx";
import { members as membersApi, families as familiesApi } from "../lib/api.js";

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", city: "", state: "", zip: "",
  gender: "", maritalStatus: "", memberStatus: "ACTIVE",
  joinDate: "", dateOfBirth: "", familyId: "",
  isMinor: false, allergies: "", medicalNotes: "",
  guardianName: "", guardianPhone: "", authorizedPickup: "", notes: "",
};

export default function MemberForm({ t, member, onClose, onSaved }) {
  const isEdit = !!member;
  const [form, setForm] = useState(EMPTY_FORM);
  const [familyList, setFamilyList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    familiesApi.list().then(setFamilyList).catch(() => {});
    if (member) {
      setForm({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        phone: member.phone || "",
        address: member.address || "",
        city: member.city || "",
        state: member.state || "",
        zip: member.zip || "",
        gender: member.gender || "",
        maritalStatus: member.maritalStatus || "",
        memberStatus: member.memberStatus || "ACTIVE",
        joinDate: member.joinDate ? member.joinDate.slice(0, 10) : "",
        dateOfBirth: member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : "",
        familyId: member.familyId || "",
        isMinor: member.isMinor || false,
        allergies: member.allergies || "",
        medicalNotes: member.medicalNotes || "",
        guardianName: member.guardianName || "",
        guardianPhone: member.guardianPhone || "",
        authorizedPickup: member.authorizedPickup || "",
        notes: member.notes || "",
      });
    }
  }, [member]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required."); return;
    }
    setSaving(true); setError("");
    try {
      const saved = isEdit
        ? await membersApi.update(member.id, form)
        : await membersApi.create(form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: "100%", padding: "9px 13px", borderRadius: 9, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };

  return (
    <Modal t={t} title={isEdit ? `Edit — ${member.firstName} ${member.lastName}` : "Add New Member"} onClose={onClose} width={640}>
      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>
      )}

      {/* Basic Info */}
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 12 }}>Basic Information</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Field label="First Name" required>
          <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="First name" style={inputStyle} />
        </Field>
        <Field label="Last Name" required>
          <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Last name" style={inputStyle} />
        </Field>
        <Field label="Email Address">
          <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" type="email" style={inputStyle} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={e => set("phone", formatPhone(e.target.value))} placeholder="(000) 000-0000" style={inputStyle} />
        </Field>
        <Field label="Date of Birth">
          <input value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} type="date" style={inputStyle} />
        </Field>
        <Field label="Gender">
          <select value={form.gender} onChange={e => set("gender", e.target.value)} style={selectStyle}>
            <option value="">Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </Field>
        <Field label="Marital Status">
          <select value={form.maritalStatus} onChange={e => set("maritalStatus", e.target.value)} style={selectStyle}>
            <option value="">Select...</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
            <option value="SEPARATED">Separated</option>
          </select>
        </Field>
        <Field label="Member Status">
          <select value={form.memberStatus} onChange={e => set("memberStatus", e.target.value)} style={selectStyle}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="NEW_MEMBER">New Member</option>
            <option value="VISITOR">Visitor</option>
            <option value="TRANSFERRED_OUT">Transferred Out</option>
          </select>
        </Field>
        <Field label="Join Date">
          <input value={form.joinDate} onChange={e => set("joinDate", e.target.value)} type="date" style={inputStyle} />
        </Field>
        <Field label="Family">
          <select value={form.familyId} onChange={e => set("familyId", e.target.value)} style={selectStyle}>
            <option value="">No family assigned</option>
            {familyList.map(f => <option key={f.id} value={f.id}>{f.familyName}</option>)}
          </select>
        </Field>
      </div>

      {/* Address */}
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 12 }}>Address</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Field label="Street Address" style={{ gridColumn: "1/-1" }}>
          <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St" style={{ ...inputStyle, width: "100%" }} />
        </Field>
        <Field label="City">
          <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" style={inputStyle} />
        </Field>
        <Field label="State">
          <input value={form.state} onChange={e => set("state", e.target.value)} placeholder="SC" style={inputStyle} />
        </Field>
        <Field label="ZIP Code">
          <input value={form.zip} onChange={e => set("zip", e.target.value)} placeholder="00000" style={inputStyle} />
        </Field>
      </div>

      {/* Minor toggle */}
      <div style={{ marginBottom: 20 }}>
        <button type="button" onClick={() => set("isMinor", !form.isMinor)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, border: `1px solid ${form.isMinor ? t.danger : t.border}`, background: form.isMinor ? "#FFF5F5" : t.white, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, border: form.isMinor ? `2px solid ${t.danger}` : `2px solid ${t.border}`, background: form.isMinor ? t.danger : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {form.isMinor && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: form.isMinor ? t.danger : t.text }}>This member is a minor (under 18)</div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>Enables guardian info and check-in security features</div>
          </div>
        </button>
      </div>

      {/* Minor fields */}
      {form.isMinor && (
        <div style={{ padding: "16px 18px", borderRadius: 10, border: `1px solid ${t.danger}`, background: "#FFF5F5", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.danger, marginBottom: 12 }}>🔐 Minor / Child Security Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Guardian Name">
              <input value={form.guardianName} onChange={e => set("guardianName", e.target.value)} placeholder="Parent or guardian" style={inputStyle} />
            </Field>
            <Field label="Guardian Phone">
              <input value={form.guardianPhone} onChange={e => set("guardianPhone", formatPhone(e.target.value))} placeholder="(000) 000-0000" style={inputStyle} />
            </Field>
            <Field label="Allergies" style={{ gridColumn: "1/-1" }}>
              <input value={form.allergies} onChange={e => set("allergies", e.target.value)} placeholder="e.g. Peanut allergy, Dairy allergy" style={{ ...inputStyle, width: "100%" }} />
            </Field>
            <Field label="Medical Notes" style={{ gridColumn: "1/-1" }}>
              <input value={form.medicalNotes} onChange={e => set("medicalNotes", e.target.value)} placeholder="e.g. Uses EpiPen, Asthma — carries inhaler" style={{ ...inputStyle, width: "100%" }} />
            </Field>
            <Field label="Authorized Pickup" style={{ gridColumn: "1/-1" }}>
              <input value={form.authorizedPickup} onChange={e => set("authorizedPickup", e.target.value)} placeholder="Names of people authorized to pick up this child" style={{ ...inputStyle, width: "100%" }} />
            </Field>
          </div>
        </div>
      )}

      {/* Notes */}
      <Field label="Notes">
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes..." rows={3}
          style={{ ...inputStyle, resize: "vertical" }} />
      </Field>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn t={t} variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn t={t} onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
        </Btn>
      </div>
    </Modal>
  );
}
