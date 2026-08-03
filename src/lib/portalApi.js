// src/lib/portalApi.js
// API client scoped to the Member Portal.
// Uses a separate localStorage key to avoid conflicts with the admin token.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "shepherdos_member_token";

export function getMemberToken()          { return localStorage.getItem(TOKEN_KEY); }
export function setMemberToken(token)     { localStorage.setItem(TOKEN_KEY, token); }
export function removeMemberToken()       { localStorage.removeItem(TOKEN_KEY); }

async function request(path, options = {}) {
  const token = getMemberToken();
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

// ─── Member Auth ──────────────────────────────────────────────
export const memberAuth = {
  register: (data)  => request("/api/member-auth/register", { method: "POST", body: JSON.stringify(data) }),
  login:    (email, password) => request("/api/member-auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me:       ()      => request("/api/member-auth/me"),
  acceptInvite:  (token, password) => request("/api/member-auth/accept-invite",  { method: "POST", body: JSON.stringify({ token, password }) }),
  resetPassword: (token, password) => request("/api/member-auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
};

// ─── Portal Data ──────────────────────────────────────────────
export const portal = {
  getProfile:    ()         => request("/api/portal/profile"),
  updateProfile: (data)     => request("/api/portal/profile",  { method: "PATCH", body: JSON.stringify(data) }),
  getGiving:     (params={})=> {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/portal/giving${qs ? `?${qs}` : ""}`);
  },
  getEvents:     ()         => request("/api/portal/events"),
  registerEvent: (id)       => request(`/api/portal/events/${id}/register`, { method: "POST" }),
  cancelEvent:   (id)       => request(`/api/portal/events/${id}/register`, { method: "DELETE" }),
  getFamilyCheckIns: ()     => request("/api/portal/family/checkins"),
};
