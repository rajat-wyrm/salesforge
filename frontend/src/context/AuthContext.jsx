import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  clearAuthState,
  orgStore,
  unwrap,
  userStore,
} from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => userStore.get());
  const [organization, setOrganization] = useState(() => orgStore.get());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const data = await unwrap(api.get("/auth/me"));

      setUser(data.user);
      setOrganization(data.organization || null);

      userStore.set(data.user);
      orgStore.set(data.organization || null);

      return data;
    } catch {
  clearAuthState();
      setUser(null);
      setOrganization(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      setError(null);

      try {
        const data = await unwrap(
          api.post("/auth/login", { email, password }),
        );

        setUser(data.user);
        userStore.set(data.user);

        await refresh();
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [refresh],
  );

  const register = useCallback(
    async (payload) => {
      setError(null);

      try {
        const data = await unwrap(api.post("/auth/register", payload));

        setUser(data.user);
        userStore.set(data.user);

        await refresh();
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await unwrap(api.post("/auth/logout"));
    } catch {
      // Clear local display data even if the server is unavailable.
    }

    clearAuthState();
    setUser(null);
    setOrganization(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    userStore.set(nextUser);
  }, []);

  const updateOrganization = useCallback((nextOrganization) => {
    setOrganization(nextOrganization);
    orgStore.set(nextOrganization);
  }, []);

  const value = useMemo(
    () => ({
      user,
      organization,
      loading,
      error,
      login,
      register,
      logout,
      refresh,
      updateUser,
      updateOrganization,
      isAuthenticated: Boolean(user),
      isOwner: user?.role === "OWNER",
      isAdmin: user?.role === "ADMIN" || user?.role === "OWNER",
      isMember:
        user && ["OWNER", "ADMIN", "MEMBER"].includes(user.role),
      isViewer:
        user &&
        ["OWNER", "ADMIN", "MEMBER", "VIEWER"].includes(user.role),
    }),
    [
      user,
      organization,
      loading,
      error,
      login,
      register,
      logout,
      refresh,
      updateUser,
      updateOrganization,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
