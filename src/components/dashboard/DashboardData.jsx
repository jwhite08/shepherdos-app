// src/components/dashboard/DashboardData.jsx
//
// Shared request cache for dashboard widgets.
//
// Each widget fetches its own data so it can be added/removed independently,
// but several widgets read from the same endpoint (e.g. both the stat cards
// and the membership breakdown need /api/dashboard/stats). Without a cache
// that would mean firing the same request two or three times on every load.
//
// This provider de-duplicates by caching the in-flight promise per key, so
// N widgets asking for the same resource produce exactly one network call.

import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";

const DashboardDataContext = createContext(null);

export function DashboardDataProvider({ children }) {
  const cache = useRef(new Map());

  const get = useCallback((key, fetcher) => {
    if (!cache.current.has(key)) {
      const promise = fetcher().catch(err => {
        // Drop failed requests from the cache so a remount can retry.
        // Without this, one transient failure would be cached forever.
        cache.current.delete(key);
        throw err;
      });
      cache.current.set(key, promise);
    }
    return cache.current.get(key);
  }, []);

  // Call after a mutation elsewhere in the app to force widgets to refetch.
  const invalidate = useCallback((key) => {
    if (key) cache.current.delete(key);
    else cache.current.clear();
  }, []);

  return (
    <DashboardDataContext.Provider value={{ get, invalidate }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardDataContext);
}

/**
 * Fetch a dashboard resource, de-duplicated across widgets.
 *
 * @param {string} key      Stable cache key, e.g. "stats" or "budgets"
 * @param {Function} fetcher  Returns a promise. Only called on cache miss.
 * @returns {{ data, loading, error }}
 */
export function useDashboardResource(key, fetcher) {
  const ctx = useContext(DashboardDataContext);
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  useEffect(() => {
    let alive = true;
    // Fall back to a direct fetch if a widget is rendered outside the provider
    // (e.g. previewed on its own), so widgets stay independently usable.
    const promise = ctx ? ctx.get(key, fetcher) : fetcher();

    promise
      .then(data => { if (alive) setState({ data, loading: false, error: "" }); })
      .catch(err => { if (alive) setState({ data: null, loading: false, error: err.message }); });

    return () => { alive = false; };
    // `fetcher` is intentionally omitted — `key` identifies the resource, and
    // inline arrow fetchers would otherwise retrigger this on every render.
  }, [key, ctx]);

  return state;
}
