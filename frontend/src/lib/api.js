// Single, unified API client. All other services and hooks should import this.
// Adds: auth header injection, automatic refresh on 401, error normalization,
// request id propagation, and SSE helpers.

import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000") + "/api";

export const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "salesforge.token";
const USER_KEY = "salesforge.user";
const ORG_KEY = "salesforge.org";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
  },
};

export const userStore = {
  get: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
  },
  set: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
};

export const orgStore = {
  get: () => {
    try { return JSON.parse(localStorage.getItem(ORG_KEY) || "null"); } catch { return null; }
  },
  set: (o) => localStorage.setItem(ORG_KEY, JSON.stringify(o)),
};

// Attach the bearer token and a request id to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (!config.headers["X-Request-Id"]) {
    config.headers["X-Request-Id"] = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return config;
});

// Normalize errors so the rest of the app has a consistent shape.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // FIX 1: Ignore canceled requests so components can catch AbortErrors properly
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const data = error.response?.data || {};
    const requestUrl = error.config?.url || "";
    const isAuthRequest = requestUrl.includes("/auth/");

    if (status === 401 && !isAuthRequest) {
      tokenStore.clear();

      if (data.code === "JWT_EXPIRED") {
        sessionStorage.setItem(
          "salesforge.authMessage",
          "Your session expired. Please log in again.",
        );
      }

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/login";
      }
    }

    // FIX 2: Attach the normalized data, but RETURN THE ORIGINAL ERROR OBJECT.
    // This ensures err.response and err.name still exist for components that rely on them.
    error.normalized = {
      status,
      message: data.message || error.message || "Request failed",
      code: data.code,
      details: data.details,
      requestId: error.response?.headers?.["x-request-id"],
    };

    return Promise.reject(error);
  },
);

export const unwrap = (promise) =>
  promise.then((r) => r.data).then((body) => {
    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        const err = new Error(body.message || "Request failed");
        err.response = body;
        throw err;
      }
      return body.data !== undefined ? body.data : body;
    }
    return body;
  });

// Helper that flattens the paginated wrapper to an array + pagination meta.
export const unwrapList = (promise) =>
  promise.then((r) => r.data).then((body) => {
    if (!body?.success) throw new Error(body?.message || "Request failed");
    const data = body.data;
    const meta = body.meta?.pagination || {};
    if (Array.isArray(data)) return { items: data, ...meta };
    if (data && Array.isArray(data.data)) return { items: data.data, ...meta };
    return { items: [], ...meta };
  });

// SSE helper for real-time streams.
export const openEventStream = (path, { onEvent, onError, params = {} } = {}) => {
  const url = new URL(baseURL + path);
  const token = tokenStore.get();
  if (token) url.searchParams.set("token", token);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  const source = new EventSource(url.toString());
  source.onmessage = (e) => {
    try { onEvent?.("*", JSON.parse(e.data)); } catch { /* ignore */ }
  };
  // eventSource supports addEventListener per event name
  ["ready", "message", "LEAD_CREATED", "LEAD_UPDATED", "LEAD_DELETED", "LEAD_STATUS_CHANGED",
   "DEAL_CREATED", "DEAL_UPDATED", "DEAL_STAGE_CHANGED", "USER_INVITED", "USER_JOINED", "PAYMENT_SUCCEEDED",
   "PAYMENT_FAILED", "SUBSCRIPTION_UPDATED", "SEARCH_COMPLETED", "INTEGRATION_SYNCED",
   "notifications.read_all", "notification.new"].forEach((evt) => {
    source.addEventListener(evt, (e) => {
      try { onEvent?.(evt, JSON.parse(e.data)); } catch { /* ignore */ }
    });
  });
  source.onerror = (e) => {
    onError?.(e);
    if (source.readyState === EventSource.CLOSED) {
      // Auto-reconnect after a short delay.
      setTimeout(() => openEventStream(path, { onEvent, onError, params }), 5000);
    }
  };
  return source;
};

export default api;
