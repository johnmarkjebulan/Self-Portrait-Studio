import { createContext, useContext, useState, useEffect } from "react";
import { authApi, setToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("sp_current_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    // Always validate persisted login state against the backend token.
    const token = localStorage.getItem("sp_token");
    if (!token) {
      localStorage.removeItem("sp_current_user");
      setUser(null);
      return;
    }

    authApi.me()
      .then(({ user: u }) => {
        localStorage.setItem("sp_current_user", JSON.stringify(u));
        setUser(u);
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem("sp_current_user");
        setUser(null);
      });
  }, []);

  const login = async (email, password) => {
    try {
      const { user: u, token } = await authApi.login(email, password);
      setToken(token);
      localStorage.setItem("sp_current_user", JSON.stringify(u));
      setUser(u);
      return { success: true, message: "Login successful." };
    } catch (err) {
      return { success: false, message: err.message || "Login failed." };
    }
  };

  const register = async (data) => {
    try {
      const { user: u, token } = await authApi.register(data);
      setToken(token);
      localStorage.setItem("sp_current_user", JSON.stringify(u));
      setUser(u);
      return { success: true, message: "Registration successful." };
    } catch (err) {
      return { success: false, message: err.message || "Registration failed." };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("sp_current_user");
    setUser(null);
  };

  const updateProfile = async (data) => {
    const { user: u } = await authApi.updateProfile(data);
    localStorage.setItem("sp_current_user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateProfile,
      isAdmin: user?.role === "admin",
      isClient: user?.role === "client",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
