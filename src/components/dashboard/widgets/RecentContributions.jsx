// src/components/dashboard/widgets/RecentContributions.jsx
// The most recent contributions, newest first.

import { dashboard as dashboardApi } from "../../../lib/api.js";
import WidgetCard from "../WidgetCard.jsx";
import { useDashboardResource } from "../DashboardData.jsx";

export default function RecentContributions({ t, setTab }) {
  const { data, loading, error } = useDashboardResource("stats", () => dashboardApi.getStats());

  const contributions = data?.recentContributions ?? [];

  return (
    <WidgetCard
      t={t}
      title="Recent Contributions"
      actionLabel="View All"
      onAction={() => setTab("finance")}
      loading={loading}
      error={error}
      isEmpty={!loading && !error && contributions.length === 0}
      emptyMessage="No contributions yet."
    >
      {contributions.map(c => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{c.memberName}</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>
              {new Date(c.date).toLocaleDateString()} · {c.type} · {c.method}
            </div>
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, color: t.success }}>
            ${Number(c.amount).toLocaleString()}
          </span>
        </div>
      ))}
    </WidgetCard>
  );
}
