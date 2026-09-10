// src/components/dashboard/widgets/MembershipBreakdown.jsx
// Member counts by status, as a share of total membership.

import { dashboard as dashboardApi } from "../../../lib/api.js";
import WidgetCard, { BarRow, seriesColors } from "../WidgetCard.jsx";
import { useDashboardResource } from "../DashboardData.jsx";

const STATUS_LABELS = {
  ACTIVE:          "Active",
  INACTIVE:        "Inactive",
  NEW_MEMBER:      "New Members",
  VISITOR:         "Visitors",
  TRANSFERRED_OUT: "Transferred",
  DECEASED:        "Deceased",
};

export default function MembershipBreakdown({ t, setTab }) {
  const { data, loading, error } = useDashboardResource("stats", () => dashboardApi.getStats());

  const members = data?.members;
  const colors  = seriesColors(t);

  return (
    <WidgetCard
      t={t}
      title="Membership Breakdown"
      actionLabel="View All"
      onAction={() => setTab("members")}
      loading={loading}
      error={error}
      isEmpty={!loading && !error && !members?.byStatus?.length}
      emptyMessage="No members recorded yet."
    >
      {members?.byStatus.map((s, i) => {
        const pct = members.total > 0 ? Math.round((s.count / members.total) * 100) : 0;
        return (
          <BarRow
            key={s.status}
            t={t}
            label={STATUS_LABELS[s.status] || s.status}
            value={`${s.count} (${pct}%)`}
            pct={pct}
            color={colors[i] || t.primary}
          />
        );
      })}
    </WidgetCard>
  );
}
