import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { listCrops, listStages, createStage, updateStage, deleteStage } from "../../api/cropsApi";

const EMPTY_FORM = {
  crop: "",
  name: "",
  order: "",
  day_start: "",
  day_end: "",
  description: "",
  typical_duration_days: "",
};

export default function CropStagesPage() {
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [allStages, setAllStages] = useState([]); // ALL stages from backend
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load crops once on mount
  useEffect(() => {
    listCrops().then((rows) => {
      setCrops(rows);
      if (rows.length) setSelectedCropId(String(rows[0].id));
    });
  }, []);

  // Load ALL stages once on mount — then filter client-side by selectedCropId
  // The backend AdminCropStageListView does NOT support ?crop= filter (no DjangoFilterBackend),
  // only SearchFilter. So we fetch all and filter on the frontend.
  function refreshAllStages() {
    setLoading(true);
    listStages()
      .then(setAllStages)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshAllStages();
  }, []);

  // Derived: stages only for the currently selected crop, sorted by order
  const stages = allStages
    .filter((s) => String(s.crop) === String(selectedCropId))
    .sort((a, b) => a.order - b.order);

  function openCreate() {
    setForm({ ...EMPTY_FORM, crop: selectedCropId });
    setError("");
    setEditing({});
  }

  function openEdit(stage) {
    setForm({
      crop: stage.crop,
      name: stage.name,
      order: stage.order,
      day_start: stage.day_start ?? "",
      day_end: stage.day_end ?? "",
      description: stage.description || "",
      typical_duration_days: stage.typical_duration_days ?? "",
    });
    setError("");
    setEditing(stage);
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      crop: Number(form.crop),
      name: form.name,
      order: Number(form.order),
      day_start: form.day_start !== "" ? Number(form.day_start) : null,
      day_end: form.day_end !== "" ? Number(form.day_end) : null,
      description: form.description,
      typical_duration_days: form.typical_duration_days !== "" ? Number(form.typical_duration_days) : null,
    };
    try {
      if (editing?.id) {
        await updateStage(editing.id, payload);
      } else {
        await createStage(payload);
      }
      setEditing(null);
      refreshAllStages(); // Reload all stages after save
    } catch (err) {
      console.error("Save failed:", err);
      const backendError = err.response?.data?.error;
      if (backendError?.code === "VALIDATION_ERROR" && backendError?.details) {
        const messages = Object.entries(backendError.details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
          .join("; ");
        setError(`Validation failed: ${messages}`);
      } else {
        setError(backendError?.message || err.message || "An unexpected error occurred.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(stage) {
    if (!confirm(`Delete stage "${stage.name}"? This cannot be undone.`)) return;
    try {
      await deleteStage(stage.id);
      refreshAllStages();
    } catch (err) {
      const backendError = err.response?.data?.error;
      setError(backendError?.message || "Delete failed.");
    }
  }

  const cropName = crops.find((c) => String(c.id) === String(selectedCropId))?.name || "";

  return (
    <>
      <PageHeader
        title="Crop Stages"
        subtitle={
          <>
            <span className="material-symbols-rounded" style={{ fontSize: 14, opacity: 0.6 }}>timeline</span>
            Growth stages per crop — ordered lifecycle {MOCK_FLAGS.cropStages && <MockNotice />}
          </>
        }
        action={
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedCropId}>
            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>add</span>
            Add stage
          </button>
        }
      />
      <div className="page-body">
        {/* Crop selector */}
        <div className="filter-bar" style={{ marginBottom: 20 }}>
          <label htmlFor="crop-select">Crop</label>
          <select
            id="crop-select"
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            style={{ minWidth: 220 }}
          >
            {crops.length === 0 && <option value="" disabled>No crops available</option>}
            {crops.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {cropName && (
            <span style={{ fontSize: 13, color: "var(--soil)" }}>
              Showing stages for <strong style={{ color: "var(--canopy)" }}>{cropName}</strong>
            </span>
          )}
        </div>

        <div className="panel">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              Loading stages…
            </div>
          ) : stages.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-rounded empty-state-icon">timeline</span>
              <p>No stages for <strong>{cropName}</strong> yet. Add the first one to get started.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="mono">#</th>
                  <th>Stage name</th>
                  <th className="mono">Day start</th>
                  <th className="mono">Day end</th>
                  <th className="mono">Duration (days)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ fontWeight: 700 }}>{String(s.order).padStart(2, "0")}</td>
                    <td>
                      <strong>{s.name}</strong>
                      {s.description && (
                        <div style={{ color: "var(--soil)", fontSize: 12, marginTop: 2 }}>{s.description}</div>
                      )}
                    </td>
                    <td className="mono">{s.day_start ?? "—"}</td>
                    <td className="mono">{s.day_end ?? "—"}</td>
                    <td className="mono">{s.typical_duration_days ?? "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="link-btn" onClick={() => openEdit(s)}>
                          <span className="material-symbols-rounded" style={{ fontSize: 15 }}>edit</span>
                          Edit
                        </button>
                        <button className="link-btn danger" onClick={() => handleDelete(s)}>
                          <span className="material-symbols-rounded" style={{ fontSize: 15 }}>delete</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing !== null && (
        <Modal title={editing.id ? "Edit stage" : "Add stage"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave}>
            {error && (
              <div className="form-error">
                <span className="material-symbols-rounded" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
                {error}
              </div>
            )}
            <div className="field">
              <label>Crop</label>
              <select value={form.crop} onChange={set("crop")} required>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Stage name</label>
              <input required value={form.name} onChange={set("name")} placeholder="e.g. Vegetative" />
            </div>
            <div className="field">
              <label>Order (sequence number)</label>
              <input type="number" min="1" required value={form.order} onChange={set("order")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>Day start</label>
                <input type="number" min="0" value={form.day_start} onChange={set("day_start")} placeholder="0" />
              </div>
              <div className="field">
                <label>Day end</label>
                <input type="number" min="0" value={form.day_end} onChange={set("day_end")} placeholder="7" />
              </div>
            </div>
            <div className="field">
              <label>Typical duration (days)</label>
              <input type="number" min="0" value={form.typical_duration_days} onChange={set("typical_duration_days")} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={set("description")} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner" style={{ borderTopColor: "#fff", width: 14, height: 14 }} />
                    Saving…
                  </>
                ) : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
