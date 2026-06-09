import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore, userStore, orgStore, unwrap } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => userStore.get());
  const [organization, setOrganization] = useState(() => orgStore.get());
  const [loading, setLoading] = useState(!!tokenStore.get());
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setOrganization(null);
      setLoading(false);
      return;
    }
    try {
      const data = await unwrap(api.get("/auth/me"));
      setUser(data.user);
      setOrganization(data.organization);
      userStore.set(data.user);
      orgStore.set(data.organization);
    } catch {
      tokenStore.clear();
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await unwrap(api.post("/auth/login", { email, password }));
    tokenStore.set(data.token);
    userStore.set(data.user);
    setUser(data.user);
    await refresh();
    return data;
  }, [refresh]);

  const register = useCallback(async (payload) => {
    const data = await unwrap(api.post("/auth/register", payload));
    tokenStore.set(data.token);
    userStore.set(data.user);
    setUser(data.user);
    await refresh();
    return data;
  }, [refresh]);

  const logout = useCallback(async () => {
    try { await unwrap(api.post("/auth/logout")); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
    setOrganization(null);
  }, []);

  const updateUser = useCallback((next) => {
    setUser(next);
    userStore.set(next);
  }, []);

  const updateOrganization = useCallback((next) => {
    setOrganization(next);
    orgStore.set(next);
  }, []);

  const value = useMemo(() => ({
    user, organization, loading, error, login, register, logout, refresh, updateUser, updateOrganization,
    isAuthenticated: !!user,
    isOwner: user?.role === "OWNER",
    isAdmin: user?.role === "ADMIN" || user?.role === "OWNER",
    isMember: user && ["OWNER", "ADMIN", "MEMBER"].includes(user.role),
    isViewer: user && ["OWNER", "ADMIN", "MEMBER", "VIEWER"].includes(user.role),
  }), [user, organization, loading, error, login, register, logout, refresh, updateUser, updateOrganization]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
