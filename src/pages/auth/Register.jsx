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
        <div className="auth-card">
          <div className="auth-eyebrow">SmartAgri Advisor</div>
          <h1>Account created</h1>
          <p className="auth-sub">You can sign in now with your new credentials.</p>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-eyebrow">SmartAgri Advisor</div>
        <h1>Create account</h1>
        <p className="auth-sub">
          For Survey Officers. Admin accounts are created directly on the backend.
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="first_name">First name</label>
            <input id="first_name" required value={form.first_name} onChange={update("first_name")} />
          </div>
          <div className="field">
            <label htmlFor="last_name">Last name</label>
            <input id="last_name" required value={form.last_name} onChange={update("last_name")} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={update("email")} />
          </div>
          <div className="field">
            <label htmlFor="phone_number">Phone</label>
            <input id="phone_number" value={form.phone_number} onChange={update("phone_number")} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={update("password")}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account\u2026" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
