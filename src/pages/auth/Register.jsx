import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "survey_officer",
  });
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await register(form).catch(() => null);
    if (result) setDone(true);
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{
            width: 60, height: 60,
            background: "var(--moss)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 32, color: "#fff" }}>check_circle</span>
          </div>
          <h1 style={{ marginBottom: 10 }}>Account created!</h1>
          <p className="auth-sub" style={{ marginBottom: 24 }}>
            Your Survey Officer account is ready. You can sign in now.
          </p>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>login</span>
            Go to sign in
          </Link>
        </div>
      </div>
    );
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
            <div className="auth-logo-sub">Survey Officer Registration</div>
          </div>
        </div>

        <h1>Create account</h1>
        <p className="auth-sub">
          For Survey Officers only. Admin accounts are created by the backend team.
        </p>

        {error && (
          <div className="form-error">
            <span className="material-symbols-rounded" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label htmlFor="first_name">First name</label>
              <input id="first_name" required value={form.first_name} onChange={update("first_name")} placeholder="Anjali" />
            </div>
            <div className="field">
              <label htmlFor="last_name">Last name</label>
              <input id="last_name" required value={form.last_name} onChange={update("last_name")} placeholder="Deshmukh" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" required value={form.email} onChange={update("email")} placeholder="you@smartagri.in" />
          </div>
          <div className="field">
            <label htmlFor="phone_number">Phone number</label>
            <input id="phone_number" value={form.phone_number} onChange={update("phone_number")} placeholder="+91 98765 00001" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={update("password")}
                placeholder="Min. 8 characters"
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "var(--soil)",
                  display: "flex", alignItems: "center", padding: 2,
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
                Creating account…
              </>
            ) : (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person_add</span>
                Create account
              </>
            )}
          </button>
        </form>

        <div className="auth-divider" />

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
