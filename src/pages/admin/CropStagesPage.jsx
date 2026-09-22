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
  const [stages, setStages] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCrops().then((rows) => {
      setCrops(rows);
      if (rows.length) setSelectedCropId(rows[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCropId) return;
    setStages(null);
    listStages({ cropId: Number(selectedCropId) }).then(setStages);
  }, [selectedCropId]);

  function refresh() {
    setStages(null);
    listStages({ cropId: Number(selectedCropId) }).then(setStages);
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM, crop: selectedCropId });
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
    setEditing(stage);
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
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
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(stage) {
    if (!confirm(`Delete stage "${stage.name}"? This cannot be undone.`)) return;
    await deleteStage(stage.id);
    refresh();
  }

  const cropName = crops.find((c) => c.id === Number(selectedCropId))?.name || "";

  return (
    <>
      <PageHeader
        title="Crop Stages"
        subtitle={
          <>
            Growth stages per crop — ordered lifecycle {MOCK_FLAGS.cropStages && <MockNotice />}
          </>
        }
        action={
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedCropId}>
            + Add stage
          </button>
        }
      />
      <div className="page-body">
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Crop</label>
          <select value={selectedCropId} onChange={(e) => setSelectedCropId(e.target.value)}>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="panel">
          {stages === null ? (
            <div className="loading-state">Loading stages…</div>
          ) : stages.length === 0 ? (
            <div className="empty-state">No stages for {cropName} yet. Add the first one.</div>
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
                    <td className="mono">{String(s.order).padStart(2, "0")}</td>
                    <td>
                      <strong>{s.name}</strong>
                      {s.description && (
                        <div style={{ color: "var(--soil)", fontSize: 12 }}>{s.description}</div>
                      )}
                    </td>
                    <td className="mono">{s.day_start ?? "—"}</td>
                    <td className="mono">{s.day_end ?? "—"}</td>
                    <td className="mono">{s.typical_duration_days ?? "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="link-btn" onClick={() => openEdit(s)}>Edit</button>
                        <button className="link-btn danger" onClick={() => handleDelete(s)}>Delete</button>
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
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
