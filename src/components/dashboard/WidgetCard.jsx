// src/components/dashboard/WidgetCard.jsx
//
// Shared chrome for every dashboard widget: the white card, the title row,
// an optional action button, and consistent loading / error / empty states.
//
// Keeping these here means a new widget only writes its own body, and every
// widget handles its edge cases identically without copy-paste.

import { Btn, Spinner, ErrorMsg } from "../ui/index.jsx";

export default function WidgetCard({
  t,
  title,
  actionLabel,
  onAction,
  loading,
  error,
  isEmpty,
  emptyMessage = "No data yet.",
  children,
}) {
  return (
    <div style={{ background: t.white, borderRadius: 12, padding: "20px 22px", border: `1px solid ${t.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, minHeight: 26 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        {actionLabel && onAction && (
          <Btn small t={t} variant="ghost" onClick={onAction}>{actionLabel}</Btn>
        )}
      </div>

      {loading   ? <Spinner t={t} />
      : error    ? <ErrorMsg t={t} message={error} />
      : isEmpty  ? <p style={{ color: t.textMuted, fontSize: 13 }}>{emptyMessage}</p>
      : children}
    </div>
  );
}

/**
 * A labelled progress bar row — the repeated pattern in the membership,
 * giving, and budget widgets.
 *
 * @param label  Left-hand label
 * @param value  Right-hand value text (count, amount, "spent / budgeted")
 * @param pct    Fill percentage, 0-100
 * @param color  Fill color
 * @param dense  Slightly smaller label text (used by the budget widget)
 */
export function BarRow({ t, label, value, pct, color, dense }) {
  const safePct = Math.max(0, Math.min(100, isFinite(pct) ? pct : 0));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: dense ? 11 : 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ color: t.textMuted }}>{value}</span>
      </div>
      <div style={{ height: 6, background: t.surface, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${safePct}%`, height: "100%", borderRadius: 3, background: color || t.primary, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

// Shared palette for categorical bars, so widgets stay visually consistent.
export const seriesColors = t => [t.primary, t.accent, t.success, "#E67E22", "#8E44AD"];
