// src/components/dashboard/widgets/KeyStats.jsx
// The at-a-glance stat card strip across the top of the dashboard.

import { dashboard as dashboardApi } from "../../../lib/api.js";
import { Stat, Spinner, ErrorMsg } from "../../ui/index.jsx";
import { useDashboardResource } from "../DashboardData.jsx";

export default function KeyStats({ t }) {
  const { data, loading, error } = useDashboardResource("stats", () => dashboardApi.getStats());

  if (loading) return <Spinner t={t} />;
  if (error)   return <ErrorMsg t={t} message={error} />;

  const { members, giving, checkIns } = data;

  // `giving` is omitted by the API for users without finance access rather
  // than zeroed, so its absence is the signal to hide those cards.
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <Stat t={t} label="Total Members"    value={members.total.toLocaleString()} sub={`${members.active} active · ${members.newMembers} new`} />

      {giving && (
        <>
          <Stat t={t} label="YTD Giving" value={`$${giving.ytd.toLocaleString()}`}       sub={`$${giving.thisMonth.toLocaleString()} this month`} color={t.success} />
          <Stat t={t} label="This Month" value={`$${giving.thisMonth.toLocaleString()}`} sub="Current month contributions" color={t.primary} />
        </>
      )}

      <Stat t={t} label="Children / Youth" value={members.minors.toLocaleString()} sub="Registered minors" color={t.accent} />

      {checkIns && (
        <Stat t={t} label="Checked In Now" value={checkIns.active.toLocaleString()} sub="Children currently checked in" color={t.accent} />
      )}
    </div>
  );
}
