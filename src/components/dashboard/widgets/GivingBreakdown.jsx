// src/components/dashboard/widgets/GivingBreakdown.jsx
// Recent contributions grouped by contribution type.
//
// NOTE: this derives from the same recent-contributions sample the API
// already returns (currently the latest 10), not from all giving YTD.
// If you want a true period breakdown later, this is the widget to point
// at a dedicated /api/dashboard/giving-by-type endpoint.

import { dashboard as dashboardApi } from "../../../lib/api.js";
import WidgetCard, { BarRow, seriesColors } from "../WidgetCard.jsx";
import { useDashboardResource } from "../DashboardData.jsx";

const TYPE_LABELS = {
  TITHE:         "Tithe",
  OFFERING:      "Offering",
  BUILDING_FUND: "Building Fund",
  MISSIONS:      "Missions",
  BENEVOLENCE:   "Benevolence",
  YOUTH_FUND:    "Youth Fund",
  OTHER:         "Other",
};

export default function GivingBreakdown({ t, setTab }) {
  const { data, loading, error } = useDashboardResource("stats", () => dashboardApi.getStats());

  const contributions = data?.recentContributions ?? [];

  const byType = {};
  contributions.forEach(c => { byType[c.type] = (byType[c.type] || 0) + Number(c.amount); });

  const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const total  = sorted.reduce((s, [, v]) => s + v, 0);
  const colors = seriesColors(t);

  return (
    <WidgetCard
      t={t}
      title="Giving Breakdown"
      actionLabel="View All"
      onAction={() => setTab("finance")}
      loading={loading}
      error={error}
      isEmpty={!loading && !error && sorted.length === 0}
      emptyMessage="No contributions recorded yet."
    >
      {sorted.map(([type, amt], i) => {
        const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
        return (
          <BarRow
            key={type}
            t={t}
            label={TYPE_LABELS[type] || type}
            value={`$${amt.toLocaleString()} (${pct}%)`}
            pct={pct}
            color={colors[i] || t.primary}
          />
        );
      })}
    </WidgetCard>
  );
}
