// src/pages/Attendance.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { attendance as attendanceApi, members as membersApi } from "../lib/api.js";
import { PageHeader, Btn, Ico, Spinner, ErrorMsg, Empty, Modal, Field, Stat } from "../components/ui/index.jsx";

export default function Attendance({ t }) {
  const [mode, setMode] = useState("overview"); // overview | member | child | pickup
  return (
    <div>
      {mode === "overview" && <Overview t={t} setMode={setMode} />}
      {mode === "member"   && <MemberCheckIn  t={t} onBack={() => setMode("overview")} />}
      {mode === "child"    && <ChildCheckIn   t={t} onBack={() => setMode("overview")} />}
      {mode === "pickup"   && <ChildPickup    t={t} onBack={() => setMode("overview")} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════
function Overview({ t, setMode }) {
  const [stats,      setStats]      = useState(null);
  const [depts,      setDepts]      = useState([]);
  const [log,        setLog]        = useState([]);
  const [activeKids, setActiveKids] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [removing,   setRemoving]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [statsData, deptsData, logData, kidsData] = await Promise.all([
        attendanceApi.getStats(),
        attendanceApi.getDepartments(),
        attendanceApi.getLog({ limit: 30 }),
        attendanceApi.getActiveCheckIns(),
      ]);
      setStats(statsData);
      setDepts(deptsData.departments || []);
      setLog(logData.logs || []);
      setActiveKids(kidsData.checkIns || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id) => {
    setRemoving(id);
    try { await attendanceApi.remove(id); load(); }
    catch (e) { setError(e.message); }
    finally { setRemoving(null); }
  };

  if (loading) return <><PageHeader t={t} title="Attendance & Check-In" /><Spinner t={t} /></>;

  const totalPresent = (stats?.todayCount || 0) + (stats?.todayChildren || 0);

  return (
    <div>
      <PageHeader t={t} title="Attendance & Check-In"
        subtitle={`Today's attendance — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
        actions={
          <div style={{ padding: "6px 14px", borderRadius: 9, background: t.success, color: "#fff", fontSize: 13, fontWeight: 600 }}>
            {totalPresent} Total Present
          </div>
        }
      />

      {error && <ErrorMsg t={t} message={error} />}

      <div style={{ padding: "22px 32px" }}>
        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <Stat t={t} label="Adults Present"   value={stats?.todayCount    || 0} color={t.primary} sub="Member check-ins today" />
          <Stat t={t} label="Children Present" value={stats?.todayChildren || 0} color={t.accent}  sub="Secure check-ins today" />
          <Stat t={t} label="Total Attendance" value={totalPresent}               color={t.success} sub="All services combined" />
        </div>

        {/* Action Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
          {[
            { mode: "member",  emoji: "📋", title: "Member Check-In",       sub: "Record adult attendance",                border: t.border,  accent: t.primary },
            { mode: "child",   emoji: "🔐", title: "Child Secure Check-In", sub: "Security code + name tag + alerts",       border: t.accent,  accent: t.accent  },
            { mode: "pickup",  emoji: "🏠", title: "Child Pickup",          sub: "Verify security code for checkout",       border: t.border,  accent: t.success },
          ].map(card => (
            <div key={card.mode} onClick={() => setMode(card.mode)}
              style={{ background: t.white, borderRadius: 14, padding: "28px 24px", border: `2px solid ${card.border}`, cursor: "pointer", textAlign: "center", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.07)`; e.currentTarget.style.borderColor = card.accent; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = card.border; }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>{card.emoji}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.dark, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: t.textMuted }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Department counts (children) */}
        {depts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: t.dark }}>Children by Department</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {depts.map(d => (
                <div key={d.id} style={{ background: t.white, borderRadius: 10, padding: "12px 20px", border: `1px solid ${t.border}`, textAlign: "center", minWidth: 120 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: t.primary }}>{d.count}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginTop: 2 }}>{d.name}</div>
                  {(d.ageRangeMin !== null && d.ageRangeMax !== null) && (
                    <div style={{ fontSize: 10, color: t.textMuted }}>Ages {d.ageRangeMin}–{d.ageRangeMax}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Trend */}
        {stats?.weeklyTrend?.length > 0 && (
          <div style={{ background: t.white, borderRadius: 12, padding: "20px 22px", border: `1px solid ${t.border}`, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Weekly Attendance Trend</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
              {stats.weeklyTrend.map((w, i) => {
                const max = Math.max(...stats.weeklyTrend.map(x => x.count), 1);
                const pct = Math.max((w.count / max) * 85, w.count > 0 ? 8 : 3);
                const isLatest = i === stats.weeklyTrend.length - 1;
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 4, fontWeight: 600 }}>{w.count || 0}</div>
                    <div style={{ height: pct, borderRadius: "5px 5px 0 0", background: isLatest ? `linear-gradient(180deg, ${t.primary}, ${t.dark})` : t.surface, transition: "height 0.4s" }} />
                    <div style={{ fontSize: 9, color: t.textMuted, marginTop: 5 }}>{w.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Today's Member Log */}
          <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, fontWeight: 600, fontSize: 14 }}>
              Today's Member Check-Ins ({log.length})
            </div>
            {log.length === 0 ? (
              <Empty t={t} message="No check-ins yet today." />
            ) : (
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {log.map(entry => (
                  <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 18px", borderBottom: `1px solid ${t.border}` }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{entry.member.firstName} {entry.member.lastName}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>
                        {new Date(entry.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {entry.event && ` · ${entry.event.title}`}
                      </div>
                    </div>
                    <button onClick={() => handleRemove(entry.id)} disabled={removing === entry.id}
                      style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: 4, opacity: removing === entry.id ? 0.4 : 0.6 }}
                      title="Remove check-in">
                      <Ico name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Child Check-Ins */}
          <div style={{ background: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, fontWeight: 600, fontSize: 14 }}>
              Children Currently Checked In ({activeKids.length})
            </div>
            {activeKids.length === 0 ? (
              <Empty t={t} message="No children currently checked in." />
            ) : (
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {activeKids.map(ci => (
                  <div key={ci.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 18px", borderBottom: `1px solid ${t.border}`, background: (ci.member.allergies || ci.member.medicalNotes) ? "#FFF9F5" : "transparent" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {ci.member.firstName} {ci.member.lastName}
                        {(ci.member.allergies || ci.member.medicalNotes) && (
                          <span style={{ marginLeft: 6, fontSize: 12 }} title={[ci.member.allergies, ci.member.medicalNotes].filter(Boolean).join(" · ")}>⚠️</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>
                        {ci.subDepartment.name} · Code: <span style={{ fontFamily: "monospace", fontWeight: 700, color: t.primary }}>{ci.securityCode}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>
                      {new Date(ci.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MEMBER CHECK-IN
// ═══════════════════════════════════════════════════════════════
function MemberCheckIn({ t, onBack }) {
  const [searchInput, setSearchInput] = useState("");
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [checkedIn,   setCheckedIn]   = useState(new Set()); // IDs checked in this session
  const [error,       setError]       = useState("");
  const [recentLog,   setRecentLog]   = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load today's log to show already-checked-in members
    attendanceApi.getLog({ limit: 100 }).then(d => {
      const ids = new Set((d.logs || []).map(l => l.memberId));
      setCheckedIn(ids);
      setRecentLog(d.logs || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchInput.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await membersApi.list({ search: searchInput, limit: 10, isMinor: "false" });
        setResults(data.members || []);
      } catch (e) { setError(e.message); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCheckIn = async (member) => {
    if (checkedIn.has(member.id)) return;
    setError("");
    try {
      await attendanceApi.checkIn({ memberId: member.id });
      setCheckedIn(prev => new Set([...prev, member.id]));
      setRecentLog(prev => [{ id: Date.now(), member, date: new Date(), event: null }, ...prev]);
      setSearchInput("");
      setResults([]);
      inputRef.current?.focus();
    } catch (e) {
      if (e.message.includes("already checked in")) {
        setCheckedIn(prev => new Set([...prev, member.id]));
      } else {
        setError(e.message);
      }
    }
  };

  return (
    <div>
      <PageHeader t={t} title="Member Check-In"
        subtitle="Search for a member and mark them present"
        actions={<Btn t={t} variant="ghost" onClick={onBack}>← Back to Overview</Btn>}
      />
      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        {/* Search panel */}
        <div>
          <div style={{ background: t.white, borderRadius: 14, padding: 24, border: `1px solid ${t.border}` }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: t.dark, marginBottom: 6 }}>Search Member</div>
            <p style={{ color: t.textMuted, fontSize: 13, margin: "0 0 18px" }}>Type a name to search. Press Enter or click Check In.</p>

            {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}><Ico name="search" size={18} /></div>
              <input ref={inputRef} value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                style={{ width: "100%", padding: "13px 14px 13px 44px", borderRadius: 10, border: `2px solid ${t.border}`, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = t.primary}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>

            {/* Results */}
            <div style={{ marginTop: 12 }}>
              {searching && <div style={{ padding: "12px 0", textAlign: "center", color: t.textMuted, fontSize: 13 }}>Searching...</div>}
              {!searching && results.length === 0 && searchInput.length >= 2 && (
                <div style={{ padding: "12px 0", color: t.textMuted, fontSize: 13 }}>No members found for "{searchInput}"</div>
              )}
              {results.map(m => {
                const alreadyIn = checkedIn.has(m.id);
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, marginBottom: 6, background: alreadyIn ? "#E8F5EE" : t.bg, border: `1px solid ${alreadyIn ? t.success : t.border}`, transition: "all 0.15s" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.firstName} {m.lastName}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{m.email || m.phone || "No contact info"}</div>
                    </div>
                    {alreadyIn ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, color: t.success, fontSize: 12, fontWeight: 600 }}>
                        <Ico name="check" size={16} /> Checked In
                      </div>
                    ) : (
                      <Btn t={t} variant="success" onClick={() => handleCheckIn(m)}>
                        <Ico name="check" size={14} /> Check In
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent check-ins panel */}
        <div style={{ background: t.white, borderRadius: 14, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`, fontWeight: 600, fontSize: 14 }}>
            Today's Log ({recentLog.length} check-ins)
          </div>
          {recentLog.length === 0 ? (
            <Empty t={t} message="No check-ins recorded yet today." />
          ) : (
            <div style={{ maxHeight: 500, overflow: "auto" }}>
              {recentLog.map((entry, i) => (
                <div key={entry.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${t.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: t.primary, flexShrink: 0 }}>
                      {entry.member.firstName[0]}{entry.member.lastName[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{entry.member.firstName} {entry.member.lastName}</div>
                      {entry.event && <div style={{ fontSize: 11, color: t.textMuted }}>{entry.event.title}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>
                    {new Date(entry.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHILD SECURE CHECK-IN
// ═══════════════════════════════════════════════════════════════
function ChildCheckIn({ t, onBack }) {
  const [step,         setStep]         = useState("search"); // search | results | nametag
  const [searchInput,  setSearchInput]  = useState("");
  const [results,      setResults]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [departments,  setDepartments]  = useState([]);
  const [checkInData,  setCheckInData]  = useState(null); // { child, checkIn }
  const [error,        setError]        = useState("");
  const [checkingIn,   setCheckingIn]   = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    attendanceApi.getDepartments().then(d => setDepartments(d.departments || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchInput.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await attendanceApi.getChildren({ search: searchInput });
        setResults(data.children || []);
        if ((data.children || []).length > 0) setStep("results");
      } catch (e) { setError(e.message); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCheckIn = async (child, subDepartmentId) => {
    setCheckingIn(child.id);
    setError("");
    try {
      const checkIn = await attendanceApi.checkInChild({ memberId: child.id, subDepartmentId });
      setCheckInData({ child, checkIn });
      setStep("nametag");
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingIn(null);
    }
  };

  const reset = () => {
    setStep("search");
    setSearchInput("");
    setResults([]);
    setCheckInData(null);
    setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div>
      <PageHeader t={t} title="Child Secure Check-In"
        subtitle="Search by child or parent name — security code generated automatically"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {step !== "search" && <Btn t={t} variant="ghost" onClick={reset}>← New Search</Btn>}
            <Btn t={t} variant="ghost" onClick={onBack}>← Back to Overview</Btn>
          </div>
        }
      />
      <div style={{ padding: "24px 32px" }}>

        {/* Search step */}
        {(step === "search" || step === "results") && (
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ background: t.white, borderRadius: 14, padding: 28, border: `2px solid ${t.accent}`, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🔐</span>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: t.dark }}>Search Child or Parent</div>
              </div>
              {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13 }}>{error}</div>}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: t.textMuted }}><Ico name="search" size={18} /></div>
                <input ref={inputRef} value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Child's name or parent/guardian name..."
                  style={{ width: "100%", padding: "13px 14px 13px 44px", borderRadius: 10, border: `2px solid ${t.border}`, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor = t.accent}
                  onBlur={e => e.target.style.borderColor = t.border} />
              </div>
              {searching && <div style={{ marginTop: 10, color: t.textMuted, fontSize: 13 }}>Searching...</div>}
            </div>

            {/* Results */}
            {step === "results" && results.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.map(child => {
                  const hasAlert = child.allergies || child.medicalNotes;
                  return (
                    <ChildResultCard key={child.id} t={t} child={child} departments={departments}
                      onCheckIn={handleCheckIn} loading={checkingIn === child.id} />
                  );
                })}
              </div>
            )}
            {step === "results" && results.length === 0 && !searching && (
              <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 14, background: t.white, borderRadius: 12, border: `1px solid ${t.border}` }}>
                No children found for "{searchInput}". Try searching by parent name.
              </div>
            )}
          </div>
        )}

        {/* Name tag step */}
        {step === "nametag" && checkInData && (
          <NameTag t={t} child={checkInData.child} checkIn={checkInData.checkIn} onCheckInAnother={reset} onBack={onBack} />
        )}
      </div>
    </div>
  );
}

// ─── Child Result Card ────────────────────────────────────────
function ChildResultCard({ t, child, departments, onCheckIn, loading }) {
  const [selectedDept, setSelectedDept] = useState("");
  const hasAlert = child.allergies || child.medicalNotes;

  // Auto-select department based on age
  useEffect(() => {
    if (departments.length > 0 && child.dateOfBirth) {
      const age = Math.floor((new Date() - new Date(child.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      const match = departments.find(d => d.ageRangeMin !== null && d.ageRangeMax !== null && age >= d.ageRangeMin && age <= d.ageRangeMax);
      if (match) setSelectedDept(match.id);
      else if (departments.length > 0) setSelectedDept(departments[0].id);
    } else if (departments.length > 0) {
      setSelectedDept(departments[0].id);
    }
  }, [departments, child]);

  return (
    <div style={{ background: t.white, borderRadius: 12, padding: "18px 20px", border: `2px solid ${hasAlert ? t.danger : t.border}`, background: hasAlert ? "#FFF9F9" : t.white }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          {/* Name & age */}
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
            {child.firstName} {child.lastName}
            {child.dateOfBirth && (
              <span style={{ fontWeight: 400, color: t.textMuted, fontSize: 13, marginLeft: 8 }}>
                · Age {Math.floor((new Date() - new Date(child.dateOfBirth)) / (365.25*24*60*60*1000))}
              </span>
            )}
          </div>
          {child.guardianName && <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8 }}>Guardian: {child.guardianName}{child.guardianPhone ? ` · ${child.guardianPhone}` : ""}</div>}

          {/* Alerts */}
          {child.allergies && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 7, background: "#FDECEC", color: t.danger, fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6 }}>
              ⚠ {child.allergies}
            </div>
          )}
          {child.medicalNotes && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 7, background: "#FFF3E0", color: t.warning, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              🏥 {child.medicalNotes}
            </div>
          )}

          {/* Department selector */}
          {!child.checkedIn && departments.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 5, display: "block" }}>Department</label>
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 13, fontFamily: "inherit", background: t.white, cursor: "pointer" }}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}{d.ageRangeMin !== null && d.ageRangeMax !== null ? ` (Ages ${d.ageRangeMin}–${d.ageRangeMax})` : ""}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Check in / already checked in */}
        <div style={{ flexShrink: 0 }}>
          {child.checkedIn ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: t.success, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>✓ Checked In</div>
              <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: t.primary }}>{child.activeCheckIn?.securityCode}</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>{child.activeCheckIn?.subDepartment?.name}</div>
            </div>
          ) : (
            <Btn t={t} variant="success" onClick={() => onCheckIn(child, selectedDept)} disabled={loading || !selectedDept}>
              {loading ? "Checking in..." : <><Ico name="check" size={14} /> Check In</>}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Name Tag ─────────────────────────────────────────────────
function NameTag({ t, child, checkIn, onCheckInAnother, onBack }) {
  const checkedInAt = new Date(checkIn.checkedInAt);

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {/* Name tag card */}
      <div style={{ background: t.white, borderRadius: 16, overflow: "hidden", border: `3px solid ${t.primary}`, boxShadow: `0 8px 32px rgba(${t.rgb},0.15)`, marginBottom: 20 }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${t.dark}, ${t.primary})`, color: "#fff", padding: "16px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, fontWeight: 400 }}>
            {checkIn.subDepartment?.subDepartment?.name || checkIn.subDepartment?.name}
          </div>
          <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.14em", marginTop: 2 }}>
            {checkIn.subDepartment?.subDepartment?.ministry?.name || "Children's Ministry"}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 38, fontFamily: "'DM Serif Display', serif", color: t.dark, fontWeight: 400 }}>
            {child.firstName}
          </div>
          <div style={{ fontSize: 20, color: t.textMuted, fontWeight: 500, marginBottom: 8 }}>{child.lastName}</div>

          {child.dateOfBirth && (
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 16 }}>
              Age {Math.floor((new Date() - new Date(child.dateOfBirth)) / (365.25*24*60*60*1000))}
            </div>
          )}

          {/* Alerts */}
          {(child.allergies || child.medicalNotes) && (
            <div style={{ margin: "0 0 18px", padding: "12px 16px", borderRadius: 10, background: "#FFF0F0", border: `2px solid ${t.danger}` }}>
              <div style={{ fontWeight: 700, color: t.danger, fontSize: 13, marginBottom: 6 }}>⚠ ALERTS — Please Read</div>
              {child.allergies   && <div style={{ fontSize: 13, color: t.danger,  marginBottom: 3 }}>{child.allergies}</div>}
              {child.medicalNotes && <div style={{ fontSize: 13, color: t.warning }}>{child.medicalNotes}</div>}
            </div>
          )}

          {/* Security Code */}
          <div style={{ padding: "14px 20px", borderRadius: 12, background: t.surface, border: `2px dashed ${t.primary}` }}>
            <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Parent Security Code</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: t.primary, letterSpacing: "0.2em", fontFamily: "monospace" }}>
              {checkIn.securityCode}
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>Present this code at pickup</div>
          </div>

          {child.guardianName && (
            <div style={{ marginTop: 14, fontSize: 12, color: t.textMuted }}>
              Guardian: {child.guardianName}
              {child.guardianPhone && ` · ${child.guardianPhone}`}
            </div>
          )}
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
            Checked in at {checkedInAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Btn t={t}><Ico name="printer" size={14} /> Print Name Tag</Btn>
        <Btn t={t} variant="secondary" onClick={onCheckInAnother}>Check In Another</Btn>
        <Btn t={t} variant="ghost" onClick={onBack}>Done</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHILD PICKUP / CHECKOUT
// ═══════════════════════════════════════════════════════════════
function ChildPickup({ t, onBack }) {
  const [code,       setCode]       = useState("");
  const [verifying,  setVerifying]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");
  const [activeKids, setActiveKids] = useState([]);
  const [loadingKids,setLoadingKids]= useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    attendanceApi.getActiveCheckIns()
      .then(d => setActiveKids(d.checkIns || []))
      .catch(() => {})
      .finally(() => setLoadingKids(false));
  }, []);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setVerifying(true); setError(""); setResult(null);
    try {
      const res = await attendanceApi.checkOutChild({ securityCode: code.trim() });
      setResult(res);
      setCode("");
      // Refresh active kids list
      attendanceApi.getActiveCheckIns().then(d => setActiveKids(d.checkIns || [])).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => { setResult(null); setError(""); setCode(""); inputRef.current?.focus(); };

  return (
    <div>
      <PageHeader t={t} title="Child Pickup Verification"
        subtitle="Enter the security code from the child's name tag"
        actions={<Btn t={t} variant="ghost" onClick={onBack}>← Back to Overview</Btn>}
      />
      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "420px 1fr", gap: 24 }}>

        {/* Code entry */}
        <div>
          <div style={{ background: t.white, borderRadius: 14, padding: 28, border: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🔐</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: t.dark, textAlign: "center", marginBottom: 6 }}>Enter Security Code</div>
            <p style={{ color: t.textMuted, fontSize: 13, textAlign: "center", margin: "0 0 20px" }}>
              The code is printed on the child's name tag.
            </p>

            {error && (
              <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: t.danger, fontSize: 13, textAlign: "center" }}>
                {error}
              </div>
            )}

            {result && (
              <div style={{ marginBottom: 20, padding: "16px", borderRadius: 12, background: "#E8F5EE", border: `2px solid ${t.success}`, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, color: t.success, fontSize: 16, marginBottom: 8 }}>{result.message}</div>
                {result.children.map((c, i) => (
                  <div key={i} style={{ fontSize: 13, color: t.success }}>{c.name} — {c.department}</div>
                ))}
                <button onClick={reset} style={{ marginTop: 12, background: "none", border: `1px solid ${t.success}`, borderRadius: 8, padding: "6px 16px", cursor: "pointer", color: t.success, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                  Verify Another
                </button>
              </div>
            )}

            <input ref={inputRef} value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              placeholder="e.g. PC-4821"
              style={{ width: "100%", padding: "16px 20px", borderRadius: 10, border: `2px solid ${t.border}`, fontSize: 22, fontFamily: "monospace", textAlign: "center", outline: "none", boxSizing: "border-box", letterSpacing: "0.15em", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = t.primary}
              onBlur={e => e.target.style.borderColor = t.border} />

            <Btn t={t} variant="success" onClick={handleVerify} disabled={verifying || !code.trim()}
              style={{ width: "100%", marginTop: 12, justifyContent: "center", padding: "13px" }}>
              {verifying ? "Verifying..." : "Verify & Release Child"}
            </Btn>
          </div>
        </div>

        {/* Currently checked in */}
        <div style={{ background: t.white, borderRadius: 14, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.border}`, fontWeight: 600, fontSize: 14 }}>
            Currently Checked In ({activeKids.length})
          </div>
          {loadingKids ? <Spinner t={t} /> : activeKids.length === 0 ? (
            <Empty t={t} message="No children currently checked in." />
          ) : (
            <div style={{ maxHeight: 480, overflow: "auto" }}>
              {activeKids.map(ci => (
                <div key={ci.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 20px", borderBottom: `1px solid ${t.border}`, background: (ci.member.allergies || ci.member.medicalNotes) ? "#FFF9F5" : "transparent" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {ci.member.firstName} {ci.member.lastName}
                      {(ci.member.allergies || ci.member.medicalNotes) && <span style={{ marginLeft: 6 }}>⚠️</span>}
                    </div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>
                      {ci.subDepartment.name}
                      {ci.member.guardianName && ` · Guardian: ${ci.member.guardianName}`}
                    </div>
                    {ci.member.allergies && <div style={{ fontSize: 10, color: t.danger, marginTop: 2 }}>{ci.member.allergies}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: t.primary }}>{ci.securityCode}</div>
                    <div style={{ fontSize: 10, color: t.textMuted }}>{new Date(ci.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
