// src/components/dashboard/registry.js
//
// The single source of truth for what dashboard widgets exist.
//
// Adding a widget = write the component, add one entry here. Nothing in
// Dashboard.jsx needs to change. When the per-user customization UI is
// built, it reads this same list to populate the "add a widget" picker,
// and stores the chosen ids against the user.

import KeyStats            from "./widgets/KeyStats.jsx";
import MembershipBreakdown from "./widgets/MembershipBreakdown.jsx";
import GivingBreakdown     from "./widgets/GivingBreakdown.jsx";
import BudgetVsActuals     from "./widgets/BudgetVsActuals.jsx";
import RecentContributions from "./widgets/RecentContributions.jsx";

/**
 * id          Stable key. Persisted in user preferences — never rename in place.
 * title       Display name shown in the widget picker (not the card itself;
 *             each widget renders its own heading).
 * component   The widget. Receives { t, setTab }.
 * span        Grid columns to occupy (dashboard grid is 2 columns).
 * roles       UserRole values allowed to see this widget at all. This is a
 *             UI convenience, NOT a security boundary — the API must enforce
 *             its own access rules regardless of what renders here.
 */
export const WIDGETS = [
  {
    id: "key-stats",
    title: "Key Stats",
    component: KeyStats,
    span: 2,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "VOLUNTEER"],
  },
  {
    id: "membership-breakdown",
    title: "Membership Breakdown",
    component: MembershipBreakdown,
    span: 1,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
  {
    id: "giving-breakdown",
    title: "Giving Breakdown",
    component: GivingBreakdown,
    span: 1,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
  {
    id: "budget-vs-actuals",
    title: "Budget vs. Actuals",
    component: BudgetVsActuals,
    span: 1,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
  {
    id: "recent-contributions",
    title: "Recent Contributions",
    component: RecentContributions,
    span: 1,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
];

export const WIDGETS_BY_ID = Object.fromEntries(WIDGETS.map(w => [w.id, w]));

// Default landing layout per role, used until a user saves their own.
// Order here is the order they render.
const DEFAULT_LAYOUTS = {
  SUPER_ADMIN: ["key-stats", "membership-breakdown", "giving-breakdown", "budget-vs-actuals", "recent-contributions"],
  ADMIN:       ["key-stats", "membership-breakdown", "giving-breakdown", "budget-vs-actuals", "recent-contributions"],
  STAFF:       ["key-stats", "membership-breakdown", "giving-breakdown", "budget-vs-actuals", "recent-contributions"],
  VOLUNTEER:   ["key-stats"],
  MEMBER:      [],
};

/**
 * Resolve which widgets to render for a user.
 *
 * @param role       UserRole from useAuth()
 * @param savedIds   The user's saved widget ids, once that feature exists.
 *                   Pass null/undefined to fall back to the role default.
 */
export function resolveWidgets(role, savedIds) {
  const ids = savedIds?.length ? savedIds : (DEFAULT_LAYOUTS[role] ?? DEFAULT_LAYOUTS.STAFF);

  return ids
    .map(id => WIDGETS_BY_ID[id])
    // Drop unknown ids (a widget removed from the app but still saved in a
    // user's preferences) and anything the role isn't permitted to see.
    .filter(w => w && w.roles.includes(role));
}
