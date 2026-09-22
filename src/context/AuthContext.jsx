import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep state in sync if the token gets cleared elsewhere (e.g. a failed
  // refresh in the axios interceptor redirects to /login).
  useEffect(() => {
    const onStorage = () => setUser(authApi.getStoredUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(credentials) {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await authApi.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const message = err.response?.data?.detail || "Invalid email or password.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    setError(null);
    try {
      return await authApi.register(payload);
    } catch (err) {
      const message = flattenDrfErrors(err.response?.data) || "Registration failed.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    authApi.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// DRF validation errors come back as { field: ["msg", ...] } — flatten to
// one readable string for the form.
function flattenDrfErrors(data) {
  if (!data || typeof data !== "object") return null;
  return Object.entries(data)
    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
    .join(" ");
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
