// src/pages/Dashboard.jsx
//
// Layout shell only. Which widgets appear is decided by the registry
// (see components/dashboard/registry.js) — this file should not need
// to change when widgets are added, removed, or reordered.

import { PageHeader } from "../components/ui/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { DashboardDataProvider } from "../components/dashboard/DashboardData.jsx";
import { resolveWidgets } from "../components/dashboard/registry.js";

export default function Dashboard({ t, config, setTab }) {
  const { user } = useAuth();

  // savedIds is null today. When per-user customization ships, pass the
  // user's saved widget ids here and the role default becomes the fallback.
  const widgets = resolveWidgets(user, null);

  return (
    <div>
      <PageHeader
        t={t}
        title="Dashboard"
        subtitle={`${config?.churchName || "Your Church"} · ${config?.ministries?.length || 0} active ministries`}
      />

      <div style={{ padding: "22px 32px" }}>
        {widgets.length === 0 ? (
          <p style={{ color: t.textMuted, fontSize: 14 }}>
            No dashboard widgets are configured for your account.
          </p>
        ) : (
          <DashboardDataProvider>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
              {widgets.map(({ id, component: Widget, span }) => (
                <div key={id} style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
                  <Widget t={t} setTab={setTab} />
                </div>
              ))}
            </div>
          </DashboardDataProvider>
        )}
      </div>
    </div>
  );
}
