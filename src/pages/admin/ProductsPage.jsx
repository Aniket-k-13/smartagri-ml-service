import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../../api/cropsApi";

const TYPES = ["fertilizer", "pesticide", "herbicide", "fungicide", "growth_regulator", "seed_treatment", "other"];

const EMPTY_FORM = {
  name: "",
  product_type: "fertilizer",
  manufacturer: "",
  unit_of_measure: "gm",
  description: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function refresh() {
    listProducts().then(setProducts);
  }

  useEffect(refresh, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing({});
  }

  function openEdit(product) {
    setForm({
      name: product.name,
      product_type: product.product_type,
      manufacturer: product.manufacturer,
      unit_of_measure: product.unit_of_measure,
      description: product.description,
    });
    setEditing(product);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing?.id) {
        await updateProduct(editing.id, form);
      } else {
        await createProduct(form);
      }
      setEditing(null);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await deleteProduct(product.id);
    refresh();
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={
          <>
            Inputs like Agri Humic, Agri Gold, Agri 82 {MOCK_FLAGS.products && <MockNotice />}
          </>
        }
        action={
          <button className="btn btn-primary" onClick={openCreate}>
            + Add product
          </button>
        }
      />
      <div className="page-body">
        <div className="panel">
          {products === null ? (
            <div className="loading-state">Loading products\u2026</div>
          ) : products.length === 0 ? (
            <div className="empty-state">No products yet. Add the first one to get started.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Manufacturer</th>
                  <th>Unit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{p.product_type.replace("_", " ")}</td>
                    <td>{p.manufacturer || "\u2014"}</td>
                    <td className="mono">{p.unit_of_measure}</td>
                    <td>
                      <div className="row-actions">
                        <button className="link-btn" onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button className="link-btn danger" onClick={() => handleDelete(p)}>
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
        <Modal title={editing.id ? "Edit product" : "Add product"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Type</label>
              <select
                value={form.product_type}
                onChange={(e) => setForm({ ...form, product_type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Manufacturer</label>
              <input
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Unit of measure</label>
              <input
                placeholder="gm / ml / kg / litre"
                value={form.unit_of_measure}
                onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
              />
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
                {saving ? "Saving\u2026" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
