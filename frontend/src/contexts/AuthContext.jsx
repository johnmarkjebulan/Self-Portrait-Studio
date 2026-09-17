import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setToken } from "../services/api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const stored = localStorage.getItem("sp_current_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      localStorage.removeItem("sp_current_user");
      setUser(null);
      setAuthReady(true);
    };

    const handleStorage = (event) => {
      if (event.key === "sp_token" && !event.newValue) handleUnauthorized();
    };

    window.addEventListener("sp:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("sp:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("sp_token");

    if (!token) {
      localStorage.removeItem("sp_current_user");
      setUser(null);
      setAuthReady(true);
      return () => { active = false; };
    }

    authApi.me()
      .then(({ user: refreshedUser }) => {
        if (!active) return;
        localStorage.setItem("sp_current_user", JSON.stringify(refreshedUser));
        setUser(refreshedUser);
      })
      .catch((err) => {
        if (!active) return;

        // Only destroy a saved login when the backend explicitly says the
        // credentials are invalid. A Render cold start, temporary outage, or
        // network interruption must not force the user to sign in again.
        if (err?.status === 401 || err?.status === 403) {
          setToken(null);
          localStorage.removeItem("sp_current_user");
          setUser(null);
        } else {
          const cachedUser = readStoredUser();
          if (cachedUser) setUser(cachedUser);
          console.warn("Could not refresh the current session; using cached user.", err);
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    try {
      const { user: loggedInUser, token } = await authApi.login(email, password);
      setToken(token);
      localStorage.setItem("sp_current_user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setAuthReady(true);
      return { success: true, message: "Login successful.", user: loggedInUser };
    } catch (err) {
      return { success: false, message: err.message || "Login failed." };
    }
  };

  const register = async (data) => {
    try {
      const { user: registeredUser, token } = await authApi.register(data);
      setToken(token);
      localStorage.setItem("sp_current_user", JSON.stringify(registeredUser));
      setUser(registeredUser);
      setAuthReady(true);
      return { success: true, message: "Registration successful.", user: registeredUser };
    } catch (err) {
      return { success: false, message: err.message || "Registration failed." };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("sp_current_user");
    setUser(null);
    setAuthReady(true);
  };

  const updateProfile = async (data) => {
    const { user: updatedUser } = await authApi.updateProfile(data);
    localStorage.setItem("sp_current_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const value = useMemo(() => ({
    user,
    authReady,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: user?.role === "admin",
    isClient: user?.role === "client",
    dashboardPath: user?.role === "admin" ? "/admin/dashboard" : "/client/dashboard",
  }), [user, authReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
