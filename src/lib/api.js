// src/lib/api.js
// Central API client for all ShepherdOS backend calls.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("shepherdos_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/api/auth/me"),
  acceptInvite: (token, password) =>
    request("/api/auth/accept-invite", { method: "POST", body: JSON.stringify({ token, password }) }),
};

// ─── Dashboard ────────────────────────────────────────────────
export const dashboard = {
  getStats: () => request("/api/dashboard/stats"),
};

// ─── Admin (access control) ───────────────────────────────────
export const admin = {
  listUsers: () => request("/api/admin/users"),
  // Sends the user's complete desired access state, not a delta.
  setUserAccess: (id, data) =>
    request(`/api/admin/users/${id}/access`, { method: "PUT", body: JSON.stringify(data) }),
  setUserActive: (id, isActive) =>
    request(`/api/admin/users/${id}/active`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  inviteUser: (data) =>
    request("/api/admin/users/invite", { method: "POST", body: JSON.stringify(data) }),
  listInvites: () => request("/api/admin/invites"),
  revokeInvite: (id) => request(`/api/admin/invites/${id}`, { method: "DELETE" }),
};

// ─── Members ──────────────────────────────────────────────────
export const members = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/members${qs ? `?${qs}` : ""}`);
  },
  getById:  (id)       => request(`/api/members/${id}`),
  getGiving:(id)       => request(`/api/members/${id}/giving`),
  create:   (data)     => request("/api/members",    { method: "POST",   body: JSON.stringify(data) }),
  update:   (id, data) => request(`/api/members/${id}`, { method: "PATCH",  body: JSON.stringify(data) }),
  delete:   (id)       => request(`/api/members/${id}`, { method: "DELETE" }),
};

// ─── Families ─────────────────────────────────────────────────
export const families = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/families${qs ? `?${qs}` : ""}`);
  },
  getById: (id)       => request(`/api/families/${id}`),
  create:  (data)     => request("/api/families",    { method: "POST",   body: JSON.stringify(data) }),
  update:  (id, data) => request(`/api/families/${id}`, { method: "PATCH",  body: JSON.stringify(data) }),
  delete:  (id)       => request(`/api/families/${id}`, { method: "DELETE" }),
};

// ─── Finance ──────────────────────────────────────────────────
export const finance = {
  listContributions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/finance/contributions${qs ? `?${qs}` : ""}`);
  },
  createContribution:  (data)     => request("/api/finance/contributions",      { method: "POST",   body: JSON.stringify(data) }),
  createBatch:         (data)     => request("/api/finance/contributions/batch", { method: "POST",   body: JSON.stringify(data) }),
  importContributions: (data)     => request("/api/finance/contributions/import", { method: "POST",  body: JSON.stringify(data) }),
  updateContribution:  (id, data) => request(`/api/finance/contributions/${id}`, { method: "PATCH",  body: JSON.stringify(data) }),
  deleteContribution:  (id)       => request(`/api/finance/contributions/${id}`, { method: "DELETE" }),
  getDonors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/finance/donors${qs ? `?${qs}` : ""}`);
  },
  getBudgets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/finance/budgets${qs ? `?${qs}` : ""}`);
  },
  createBudget: (data)     => request("/api/finance/budgets",      { method: "POST",   body: JSON.stringify(data) }),
  updateBudget: (id, data) => request(`/api/finance/budgets/${id}`, { method: "PATCH",  body: JSON.stringify(data) }),
  deleteBudget: (id)       => request(`/api/finance/budgets/${id}`, { method: "DELETE" }),
};

// ─── Portal Admin (managing member portal accounts) ────────────
export const portalAdmin = {
  getOverview: () => request("/api/portal-admin/overview"),
  getMembers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/portal-admin/members${qs ? `?${qs}` : ""}`);
  },
  invite:       (memberId)        => request(`/api/portal-admin/members/${memberId}/invite`,         { method: "POST" }),
  resetPassword:(memberId)        => request(`/api/portal-admin/members/${memberId}/reset-password`, { method: "POST" }),
  setAccess:    (memberId, isActive) => request(`/api/portal-admin/members/${memberId}/access`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  bulkInvite:   (memberIds)       => request("/api/portal-admin/bulk-invite", { method: "POST", body: JSON.stringify({ memberIds }) }),
  bulkSetAccess:(memberIds, isActive) => request("/api/portal-admin/bulk-access", { method: "POST", body: JSON.stringify({ memberIds, isActive }) }),
};

// ─── Events ───────────────────────────────────────────────────
export const events = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/events${qs ? `?${qs}` : ""}`);
  },
  getById:  (id)       => request(`/api/events/${id}`),
  create:   (data)     => request("/api/events",       { method: "POST",   body: JSON.stringify(data) }),
  update:   (id, data) => request(`/api/events/${id}`, { method: "PATCH",  body: JSON.stringify(data) }),
  delete:   (id)       => request(`/api/events/${id}`, { method: "DELETE" }),

  // Registrations
  getRegistrations: (eventId)           => request(`/api/events/${eventId}/registrations`),
  register:         (eventId, data)     => request(`/api/events/${eventId}/register`,               { method: "POST",   body: JSON.stringify(data) }),
  updateReg:        (eventId, regId, d) => request(`/api/events/${eventId}/registrations/${regId}`, { method: "PATCH",  body: JSON.stringify(d) }),
  cancelReg:        (eventId, regId)    => request(`/api/events/${eventId}/registrations/${regId}`, { method: "DELETE" }),
};

// ─── Ministries ───────────────────────────────────────────────
export const ministries = {
  list:    ()   => request("/api/ministries"),
  getById: (id) => request(`/api/ministries/${id}`),

  volunteers: {
    list:   (ministryId)             => request(`/api/ministries/${ministryId}/volunteers`),
    create: (ministryId, data)       => request(`/api/ministries/${ministryId}/volunteers`,               { method: "POST",   body: JSON.stringify(data) }),
    update: (ministryId, id, data)   => request(`/api/ministries/${ministryId}/volunteers/${id}`,          { method: "PATCH",  body: JSON.stringify(data) }),
    delete: (ministryId, id)         => request(`/api/ministries/${ministryId}/volunteers/${id}`,          { method: "DELETE" }),
  },

  schedule: {
    list:   (ministryId, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/ministries/${ministryId}/schedule${qs ? `?${qs}` : ""}`);
    },
    create: (ministryId, data)       => request(`/api/ministries/${ministryId}/schedule`,                  { method: "POST",   body: JSON.stringify(data) }),
    update: (ministryId, id, data)   => request(`/api/ministries/${ministryId}/schedule/${id}`,             { method: "PATCH",  body: JSON.stringify(data) }),
    delete: (ministryId, id)         => request(`/api/ministries/${ministryId}/schedule/${id}`,             { method: "DELETE" }),
  },

  subDepartments: {
    list:   (ministryId)             => request(`/api/ministries/${ministryId}/subdepartments`),
    create: (ministryId, data)       => request(`/api/ministries/${ministryId}/subdepartments`,             { method: "POST",   body: JSON.stringify(data) }),
    update: (ministryId, id, data)   => request(`/api/ministries/${ministryId}/subdepartments/${id}`,        { method: "PATCH",  body: JSON.stringify(data) }),
    delete: (ministryId, id)         => request(`/api/ministries/${ministryId}/subdepartments/${id}`,        { method: "DELETE" }),

    members: {
      list:   (ministryId, id)             => request(`/api/ministries/${ministryId}/subdepartments/${id}/members`),
      add:    (ministryId, id, data)       => request(`/api/ministries/${ministryId}/subdepartments/${id}/members`,             { method: "POST",   body: JSON.stringify(data) }),
      remove: (ministryId, id, memberId)   => request(`/api/ministries/${ministryId}/subdepartments/${id}/members/${memberId}`, { method: "DELETE" }),
    },
  },
};

// ─── Attendance ───────────────────────────────────────────────
export const attendance = {
  // Adult attendance
  getLog:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/attendance${qs ? `?${qs}` : ""}`);
  },
  getStats:  ()       => request("/api/attendance/stats"),
  checkIn:   (data)   => request("/api/attendance/checkin",  { method: "POST",   body: JSON.stringify(data) }),
  remove:    (id)     => request(`/api/attendance/${id}`,    { method: "DELETE" }),

  // Child secure check-in
  getChildren:      (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/attendance/children${qs ? `?${qs}` : ""}`);
  },
  getActiveCheckIns: ()     => request("/api/attendance/children/active"),
  getDepartments:    ()     => request("/api/attendance/departments"),
  checkInChild:      (data) => request("/api/attendance/children/checkin",  { method: "POST", body: JSON.stringify(data) }),
  checkOutChild:     (data) => request("/api/attendance/children/checkout", { method: "POST", body: JSON.stringify(data) }),
};
