import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });

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
        <div className="auth-eyebrow">SmartAgri Advisor</div>
        <h1>Sign in</h1>
        <p className="auth-sub">Admin and Survey Officer console.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@smartagri.in"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          Survey officer needing an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
