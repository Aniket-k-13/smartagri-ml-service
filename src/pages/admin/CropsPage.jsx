import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { listCrops, createCrop, updateCrop, deleteCrop } from "../../api/cropsApi";

const CATEGORIES = ["cereal", "pulse", "oilseed", "vegetable", "fruit", "cash_crop", "spice", "other"];
const SEASONS = ["kharif", "rabi", "zaid", "perennial"];

const EMPTY_FORM = { name: "", scientific_name: "", category: "oilseed", season: "kharif", description: "" };

export default function CropsPage() {
  const [crops, setCrops] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    console.log("REFRESH: Calling listCrops...");
    listCrops().then(data => {
      console.log("REFRESH: listCrops returned (data):", data);
      setCrops(data);
    }).catch(err => {
      console.error("REFRESH: Error fetching crops:", err);
      setError("Failed to load crops.");
      setCrops([]); // Set to empty array on error to prevent loading spinner forever
    });
  }

  useEffect(() => {
    console.log("EFFECT: Initial load/refresh for CropsPage");
    refresh();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError("");
    setEditing({});
  }

  function openEdit(crop) {
    setForm({
      name: crop.name,
      scientific_name: crop.scientific_name,
      category: crop.category,
      season: crop.season,
      description: crop.description,
    });
    setError("");
    setEditing(crop);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      console.log("SAVE: Attempting to save form:", form);
      if (editing?.id) {
        await updateCrop(editing.id, form);
        console.log("SAVE: updateCrop successful for ID:", editing.id);
      } else {
        await createCrop(form);
        console.log("SAVE: createCrop successful");
      }
      setEditing(null);
      refresh(); // This should re-fetch and update the list
      console.log("SAVE: refresh triggered.");
    } catch (err) {
      console.error("Save failed:", err);
      const backendError = err.response?.data?.error;
      if (backendError) {
        if (backendError.code === "VALIDATION_ERROR" && backendError.details) {
          const messages = Object.entries(backendError.details)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
            .join("; ");
          setError(`Validation failed: ${messages}`);
        } else {
          setError(backendError.message || "An unexpected error occurred.");
        }
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(crop) {
    if (!confirm(`Delete "${crop.name}"? This cannot be undone.`)) return;
    try {
      await deleteCrop(crop.id);
      refresh();
    } catch (err) {
      console.error("Delete failed:", err);
      const backendError = err.response?.data?.error;
      if (backendError) {
        setError(backendError.message || "An unexpected error occurred during delete.");
      } else {
        setError("An unknown error occurred during delete.");
      }
    }
  }

  // Add a console.log here to see the 'crops' state right before rendering
  console.log("RENDER: Current 'crops' state:", crops);

  return (
    <>
      <PageHeader
        title="Crops"
        subtitle={
          <>
            Master crop list farmers select from {MOCK_FLAGS.crops && <MockNotice />}
          </>
        }
        action={
          <button className="btn btn-primary" onClick={openCreate}>
            + Add crop
          </button>
        }
      />
      <div className="page-body">
        <div className="panel">
          {crops === null ? (
            <div className="loading-state">Loading crops…</div>
          ) : crops.length === 0 ? (
            <div className="empty-state">No crops yet. Add the first one to get started.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Season</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {crops.map((crop) => (
                  <tr key={crop.id}>
                    <td>
                      <strong>{crop.name}</strong>
                      {crop.scientific_name && (
                        <div style={{ color: "var(--soil)", fontSize: 12 }}>{crop.scientific_name}</div>
                      )}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{crop.category.replace("_", " ")}</td>
                    <td style={{ textTransform: "capitalize" }}>{crop.season}</td>
                    <td>
                      <span className={`badge ${crop.is_active ? "badge-active" : "badge-planned"}`}>
                        {crop.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="link-btn" onClick={() => openEdit(crop)}>
                          Edit
                        </button>
                        <button className="link-btn danger" onClick={() => handleDelete(crop)}>
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
        <Modal title={editing.id ? "Edit crop" : "Add crop"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave}>
            {error && <div className="form-error">{error}</div>}
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Scientific name</label>
              <input
                value={form.scientific_name}
                onChange={(e) => setForm({ ...form, scientific_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Season</label>
              <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
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
