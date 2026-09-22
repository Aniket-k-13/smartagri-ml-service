import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { listEmployees, createEmployee, updateEmployee } from "../../api/surveysApi";

const EMPTY_FORM = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  employee_code: "",
  designation: "",
  department: "",
  assigned_region: "",
  date_of_joining: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(null);
  const [editing, setEditing] = useState(null); // null=closed, {}=create, {...}=edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    listEmployees().then(setEmployees);
  }

  useEffect(refresh, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError("");
    setEditing({});
  }

  function openEdit(emp) {
    setForm({
      email: emp.email || emp.user?.email || "",
      password: "",
      first_name: emp.first_name || emp.user?.first_name || "",
      last_name: emp.last_name || emp.user?.last_name || "",
      phone: emp.phone || emp.user?.phone_number || "",
      employee_code: emp.employee_code || "",
      designation: emp.designation || "",
      department: emp.department || "",
      assigned_region: emp.assigned_region || "",
      date_of_joining: emp.date_of_joining || "",
    });
    setError("");
    setEditing(emp);
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing?.id) {
        const payload = { ...form };
        delete payload.password; // don't send empty password on edit
        await updateEmployee(editing.id, payload);
      } else {
        await createEmployee(form);
      }
      setEditing(null);
      refresh();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || "Save failed.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Survey Officers"
        subtitle={<>Accounts assigned to field regions {MOCK_FLAGS.employees && <MockNotice />}</>}
        action={
          <button className="btn btn-primary" onClick={openCreate}>+ Add officer</button>
        }
      />
      <div className="page-body">
        <div className="panel">
          {employees === null ? (
            <div className="loading-state">Loading survey officers…</div>
          ) : employees.length === 0 ? (
            <div className="empty-state">No survey officers yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Code</th>
                  <th>Region</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.first_name || e.user?.first_name || "—"} {e.last_name || e.user?.last_name || ""}</strong>
                      {(e.phone || e.user?.phone_number) && <div style={{ color: "var(--soil)", fontSize: 12 }}>{e.phone || e.user?.phone_number}</div>}
                    </td>
                    <td style={{ fontSize: 13 }}>{e.email || e.user?.email}</td>
                    <td className="mono">{e.employee_code || "—"}</td>
                    <td>{e.assigned_region || "—"}</td>
                    <td>{e.designation || "—"}</td>
                    <td>
                      <span className={`badge ${e.is_active_employee ? "badge-active" : "badge-planned"}`}>
                        {e.is_active_employee ? "active" : "inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="link-btn" onClick={() => openEdit(e)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing !== null && (
        <Modal title={editing.id ? "Edit survey officer" : "Add survey officer"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave}>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>First name</label>
                <input value={form.first_name} onChange={set("first_name")} />
              </div>
              <div className="field">
                <label>Last name</label>
                <input value={form.last_name} onChange={set("last_name")} />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required={!editing?.id} value={form.email} onChange={set("email")} readOnly={!!editing?.id} />
            </div>
            {!editing?.id && (
              <div className="field">
                <label>Password</label>
                <input type="password" required value={form.password} onChange={set("password")} />
              </div>
            )}
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={set("phone")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>Employee code</label>
                <input required={!editing?.id} value={form.employee_code} onChange={set("employee_code")} placeholder="EMP-001" />
              </div>
              <div className="field">
                <label>Date of joining</label>
                <input type="date" value={form.date_of_joining} onChange={set("date_of_joining")} />
              </div>
            </div>
            <div className="field">
              <label>Designation</label>
              <input value={form.designation} onChange={set("designation")} placeholder="Field Officer" />
            </div>
            <div className="field">
              <label>Department</label>
              <input value={form.department} onChange={set("department")} placeholder="Survey" />
            </div>
            <div className="field">
              <label>Assigned region</label>
              <input value={form.assigned_region} onChange={set("assigned_region")} placeholder="Pune East" />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
