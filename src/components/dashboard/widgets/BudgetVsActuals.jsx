// src/components/dashboard/widgets/BudgetVsActuals.jsx
// Spend against budget by category for the current year.

import { finance as financeApi } from "../../../lib/api.js";
import WidgetCard, { BarRow } from "../WidgetCard.jsx";
import { useDashboardResource } from "../DashboardData.jsx";

export default function BudgetVsActuals({ t, setTab }) {
  const { data, loading, error } = useDashboardResource("budgets", () => financeApi.getBudgets());

  // Prisma Decimal fields arrive as strings over JSON — coerce before math.
  const rows = (data?.budgets ?? []).map(b => ({
    category: b.category,
    icon:     b.icon || "💰",
    budgeted: Number(b.budgetedAmount),
    spent:    Number(b.spentAmount),
  }));

  return (
    <WidgetCard
      t={t}
      title="Budget vs. Actuals"
      actionLabel="Details"
      onAction={() => setTab("finance")}
      loading={loading}
      error={error}
      isEmpty={!loading && !error && rows.length === 0}
      emptyMessage={`No budget categories set up for ${data?.year ?? new Date().getFullYear()} yet.`}
    >
      {rows.map(b => {
        // Guard against a zero/blank budget, which would otherwise divide by zero.
        const pct = b.budgeted > 0 ? Math.round((b.spent / b.budgeted) * 100) : 0;
        return (
          <BarRow
            key={b.category}
            t={t}
            dense
            label={`${b.icon} ${b.category}`}
            value={`$${b.spent.toLocaleString()} / $${b.budgeted.toLocaleString()}`}
            pct={pct}
            color={pct > 80 ? t.danger : pct > 50 ? t.warning : t.primary}
          />
        );
      })}
    </WidgetCard>
  );
}
