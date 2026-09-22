import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const user = await login(form).catch(() => null);
    if (!user) return;

    const from = location.state?.from;
    if (from) return navigate(from, { replace: true });
    navigate(user.role === "admin" ? "/admin" : "/survey", { replace: true });
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="material-symbols-rounded">eco</span>
          </div>
          <div>
            <div className="auth-logo-text">SmartAgri Advisor</div>
            <div className="auth-logo-sub">Admin & Officer Console</div>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to access the platform console.</p>

        {error && (
          <div className="form-error">
            <span className="material-symbols-rounded" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@smartagri.in"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--soil)",
                  display: "flex",
                  alignItems: "center",
                  padding: 2,
                }}
                tabIndex={-1}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 19 }}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? (
              <>
                <span className="spinner" style={{ borderTopColor: "#fff" }} />
                Signing in…
              </>
            ) : (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>login</span>
                Sign in
              </>
            )}
          </button>
        </form>

        <div className="auth-divider" />

        <p className="auth-switch">
          Survey officer needing an account?{" "}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
