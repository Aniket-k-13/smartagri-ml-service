import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import {
  listCrops,
  listStages,
  listProducts,
  listStageProducts,
  createStageProduct,
  deleteStageProduct,
} from "../../api/cropsApi";

// Real AdminStageProductSerializer fields:
//   id, stage(FK), product(FK), dosage_amount, dosage_unit,
//   application_notes, is_mandatory

const EMPTY_FORM = {
  stage: "",
  product: "",
  dosage_amount: "",
  dosage_unit: "",
  application_notes: "",
  is_mandatory: true,
};

export default function StageProductsPage() {
  const [allCrops, setAllCrops] = useState([]); // Renamed to avoid conflict
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [allStages, setAllStages] = useState([]); // Renamed
  const [allProducts, setAllProducts] = useState([]); // Renamed
  const [mappings, setMappings] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listCrops().then((rows) => {
      setAllCrops(rows);
      if (rows.length) setSelectedCropId(rows[0].id);
    });
    listProducts().then(setAllProducts);
    listStages().then(setAllStages); // Fetch all stages to map names
  }, []);

  useEffect(() => {
    if (!selectedCropId) return;
    // No need to filter stages here, we use allStages for name lookup
  }, [selectedCropId]);

  function refreshMappings() {
    setMappings(null); // Show loading state while refreshing
    // console.log("REFRESH MAPPINGS: Calling listStageProducts..."); // ADD LOG
    listStageProducts().then(data => {
      // console.log("REFRESH MAPPINGS: listStageProducts returned:", data); // ADD LOG
      setMappings(data);
    }).catch(err => {
      console.error("REFRESH MAPPINGS: Error fetching mappings:", err);
      setError("Failed to load stage product mappings.");
      setMappings([]);
    });
  }

  useEffect(refreshMappings, []);

  // Memoized data for display
  const stagesForSelectedCrop = useMemo(
    () => allStages.filter((s) => s.crop === Number(selectedCropId)).sort((a, b) => a.order - b.order),
    [allStages, selectedCropId]
  );

  const stageIdsForCrop = useMemo(
    () => new Set(stagesForSelectedCrop.map((s) => s.id)),
    [stagesForSelectedCrop]
  );

  const enrichedCropMappings = useMemo(() => {
    // Only show mappings for the selected crop's stages
    return (mappings || [])
      .filter((m) => stageIdsForCrop.has(m.stage))
      .map((m) => {
        const stage = allStages.find((s) => s.id === m.stage);
        const product = allProducts.find((p) => p.id === m.product);
        return {
          ...m,
          stage_name: stage?.name || `ID: ${m.stage}`,
          product_name: product?.name || `ID: ${m.product}`,
        };
      })
      .sort((a, b) => {
        const stageA = allStages.find((s) => s.id === a.stage);
        const stageB = allStages.find((s) => s.id === b.stage);
        return (stageA?.order || 0) - (stageB?.order || 0);
      });
  }, [mappings, stageIdsForCrop, allStages, allProducts]);

  const stagesWithProducts = useMemo(() => new Set(enrichedCropMappings.map((m) => m.stage)), [enrichedCropMappings]);

  function openCreate() {
    // Ensure initial form values for stage and product are from the filtered lists
    setForm({ ...EMPTY_FORM, stage: stagesForSelectedCrop[0]?.id || "", product: allProducts[0]?.id || "" });
    setError("");
    setCreating(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createStageProduct({
        stage: Number(form.stage),
        product: Number(form.product),
        dosage_amount: form.dosage_amount ? Number(form.dosage_amount) : null,
        dosage_unit: form.dosage_unit,
        application_notes: form.application_notes,
        is_mandatory: form.is_mandatory,
      });
      setCreating(false);
      refreshMappings();
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

  async function handleDelete(mapping) {
    if (!confirm("Remove this product from the stage?")) return;
    try {
      await deleteStageProduct(mapping.id);
      refreshMappings();
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

  // Use allCrops for the crop selection dropdown
  const cropsForDropdown = allCrops;
  const cropName = allCrops.find((c) => c.id === Number(selectedCropId))?.name || "";

  return (
    <>
      <PageHeader
        title="Stage → Product Map"
        subtitle={
          <>
            What to apply at each growth stage {MOCK_FLAGS.stageProducts && <MockNotice />}
          </>
        }
        action={
          <button className="btn btn-primary" onClick={openCreate} disabled={!stagesForSelectedCrop.length || !allProducts.length}>
            + Map a product
          </button>
        }
      />
      <div className="page-body">
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Crop</label>
          <select value={selectedCropId || ""} onChange={(e) => setSelectedCropId(Number(e.target.value))} disabled={!cropsForDropdown.length}>
            {!cropsForDropdown.length && <option value="" disabled>No crops available</option>}
            {cropsForDropdown.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stage rail — signature UI element */}
        <div className="stage-rail" aria-label="Crop growth stages in order">
          {stagesForSelectedCrop.map((stage, i) => (
            <span key={stage.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`stage-pill ${stagesWithProducts.has(stage.id) ? "has-products" : ""}`}>
                <span className="order">{String(stage.order).padStart(2, "0")}</span>
                {stage.name}
              </span>
              {i < stagesForSelectedCrop.length - 1 && <span className="stage-rail-connector" />}
            </span>
          ))}
        </div>

        <div className="panel">
          {mappings === null ? (
            <div className="loading-state">Loading mappings…</div>
          ) : enrichedCropMappings.length === 0 ? (
            <div className="empty-state">
              No products mapped to any stage of this crop yet — use "Map a product" to add the first recommendation.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Product</th>
                  <th className="mono">Dosage</th>
                  <th>Notes</th>
                  <th>Mandatory</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enrichedCropMappings.map((m) => (
                  <tr key={m.id}>
                    <td>{m.stage_name}</td>
                    <td>{m.product_name}</td>
                    <td className="mono">
                      {m.dosage_amount} {m.dosage_unit}
                    </td>
                    <td style={{ color: "var(--soil)" }}>{m.application_notes || "—"}</td>
                    <td>
                      <span className={`badge ${m.is_mandatory ? "badge-active" : "badge-planned"}`}>
                        {m.is_mandatory ? "required" : "optional"}
                      </span>
                    </td>
                    <td>
                      <button className="link-btn danger" onClick={() => handleDelete(m)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {creating && (
        <Modal title="Map a product to a stage" onClose={() => setCreating(false)}>
          <form onSubmit={handleSave}>
            {error && <div className="form-error">{error}</div>}
            <div className="field">
              <label>Stage</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} disabled={!stagesForSelectedCrop.length}>
                {!stagesForSelectedCrop.length && <option value="" disabled>No stages available</option>}
                {stagesForSelectedCrop.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Product</label>
              <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} disabled={!allProducts.length}>
                {!allProducts.length && <option value="" disabled>No products available</option>}
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>Dosage amount</label>
                <input type="number" step="0.01" min="0" required value={form.dosage_amount}
                  onChange={(e) => setForm({ ...form, dosage_amount: e.target.value })} />
              </div>
              <div className="field">
                <label>Unit</label>
                <input placeholder="gm / ml" required value={form.dosage_unit}
                  onChange={(e) => setForm({ ...form, dosage_unit: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Application notes</label>
              <textarea rows={2} value={form.application_notes}
                onChange={(e) => setForm({ ...form, application_notes: e.target.value })} />
            </div>
            <div className="field">
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" style={{ width: "auto" }} checked={form.is_mandatory}
                  onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })} />
                Mandatory application
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save mapping"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
