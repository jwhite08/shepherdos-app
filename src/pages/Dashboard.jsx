// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { dashboard as dashboardApi } from "../lib/api.js";
import { PageHeader, Stat, Spinner, ErrorMsg, Ico, Btn } from "../components/ui/index.jsx";

export default function Dashboard({ t, config, setTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.getStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><PageHeader t={t} title="Dashboard" /><Spinner t={t} /></>;
  if (error) return <><PageHeader t={t} title="Dashboard" /><ErrorMsg t={t} message={error} /></>;

  const { members, giving, recentContributions } = stats;

  // Static budget data (will be API-driven in a later phase)
  const budgetData = [
    { category: "Staff Salaries",      budgeted: 180000, spent: 44200,  icon: "👥" },
    { category: "Building & Maintenance", budgeted: 60000, spent: 18700, icon: "🏛️" },
    { category: "Missions & Outreach", budgeted: 45000,  spent: 9800,   icon: "🌍" },
    { category: "Youth Programs",       budgeted: 25000,  spent: 6100,   icon: "🧒" },
    { category: "Worship & Media",      budgeted: 20000,  spent: 5400,   icon: "🎵" },
  ];

  // Giving breakdown from real contributions
  const givingByType = {};
  recentContributions.forEach(c => { givingByType[c.type] = (givingByType[c.type] || 0) + c.amount; });
  const typeSorted = Object.entries(givingByType).sort((a, b) => b[1] - a[1]);
  const totalTyped = typeSorted.reduce((s, [, v]) => s + v, 0);
  const typeColors = [t.primary, t.accent, t.success, "#E67E22", "#8E44AD"];

  return (
    <div>
      <PageHeader t={t} title="Dashboard"
        subtitle={`${config?.churchName || "Your Church"} · ${config?.ministries?.length || 0} active ministries`} />
      <div style={{ padding: "22px 32px" }}>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          <Stat t={t} label="Total Members" value={members.total.toLocaleString()} sub={`${members.active} active · ${members.newMembers} new`} />
          <Stat t={t} label="YTD Giving" value={`$${giving.ytd.toLocaleString()}`} sub={`$${giving.thisMonth.toLocaleString()} this month`} color={t.success} />
          <Stat t={t} label="This Month" value={`$${giving.thisMonth.toLocaleString()}`} sub="Current month contributions" color={t.primary} />
          <Stat t={t} label="Children / Youth" value={members.minors.toLocaleString()} sub="Registered minors" color={t.accent} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          {/* Member Status Breakdown */}
          <div style={{ background: t.white, borderRadius: 12, padding: "20px 22px", border: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Membership Breakdown</span>
              <Btn small t={t} variant="ghost" onClick={() => setTab("members")}>View All</Btn>
            </div>
            {members.byStatus.map((s, i) => {
              const pct = members.total > 0 ? Math.round((s.count / members.total) * 100) : 0;
              const labels = { ACTIVE: "Active", INACTIVE: "Inactive", NEW_MEMBER: "New Members", VISITOR: "Visitors", TRANSFERRED_OUT: "Transferred", DECEASED: "Deceased" };
              return (
                <div key={s.status} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{labels[s.status] || s.status}</span>
                    <span style={{ color: t.textMuted }}>{s.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: t.surface, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: typeColors[i] || t.primary, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Giving Breakdown */}
          <div style={{ background: t.white, borderRadius: 12, padding: "20px 22px", border: `1px solid ${t.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Giving Breakdown</div>
            {typeSorted.length === 0 ? (
              <p style={{ color: t.textMuted, fontSize: 13 }}>No contributions recorded yet.</p>
            ) : typeSorted.map(([type, amt], i) => {
              const pct = Math.round((amt / totalTyped) * 100);
              const labels = { TITHE: "Tithe", OFFERING: "Offering", BUILDING_FUND: "Building Fund", MISSIONS: "Missions", BENEVOLENCE: "Benevolence", YOUTH_FUND: "Youth Fund", OTHER: "Other" };
              return (
                <div key={type} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{labels[type] || type}</span>
                    <span style={{ color: t.textMuted }}>${amt.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: t.surface, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: typeColors[i] || t.primary, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Budget vs Actuals */}
          <div style={{ background: t.white, borderRadius: 12, padding: "20px 22px", border: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Budget vs. Actuals</span>
              <Btn small t={t} variant="ghost" onClick={() => setTab("finance")}>Details</Btn>
            </div>
            {budgetData.map(b => {
              const pct = Math.round((b.spent / b.budgeted) * 100);
              return (
                <div key={b.category} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{b.icon} {b.category}</span>
                    <span style={{ color: t.textMuted }}>${b.spent.toLocaleString()} / ${b.budgeted.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, background: t.surface, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct > 80 ? t.danger : pct > 50 ? t.warning : t.primary, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Contributions */}
          <div style={{ background: t.white, borderRadius: 12, padding: "20px 22px", border: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Contributions</span>
              <Btn small t={t} variant="ghost" onClick={() => setTab("finance")}>View All</Btn>
            </div>
            {recentContributions.length === 0 ? (
              <p style={{ color: t.textMuted, fontSize: 13 }}>No contributions yet.</p>
            ) : recentContributions.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.memberName}</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{new Date(c.date).toLocaleDateString()} · {c.type} · {c.method}</div>
                </div>
                <span style={{ fontWeight: 600, fontSize: 13, color: t.success }}>${Number(c.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
