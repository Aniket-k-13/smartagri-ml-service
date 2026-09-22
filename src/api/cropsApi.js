import { apiClient } from "./client";
import { MOCK_FLAGS } from "./config";
import { mockDelay } from "./mockUtils";
import { mockCrops, mockCropStages, mockProducts, mockStageProducts, genId } from "./mockData";

/**
 * Every function here is what a page component calls.
 * Real backend wraps all responses: { success: true, data: [...] } or { success: true, data: { count, next, previous, results: [...] } }
 * We unwrap .data and then .results before returning so components never know the difference.
 *
 * Real URL contract (smartagri-backendd/smartagri-backend/apps/adminapi/urls.py):
 *   GET/POST        /api/admin/crops/
 *   GET/PUT/DELETE  /api/admin/crops/{id}/
 *   GET/POST        /api/admin/stages/
 *   GET/PUT/DELETE  /api/admin/stages/{id}/
 *   GET/POST        /api/admin/products/
 *   GET/PUT/DELETE  /api/admin/products/{id}/
 *   GET/POST        /api/admin/stage-products/
 *   GET/PUT/DELETE  /api/admin/stage-products/{id}/
 *   GET             /api/crops/              (public list, returns {id,name,description})
 */

// Utility to correctly extract the 'results' array from the paginated 'data' object
const ensurePaginatedArray = (paginatedData) => {
  if (paginatedData && Array.isArray(paginatedData.results)) {
    return paginatedData.results;
  }
  return [];
};

// ---- Crops (Admin CRUD) --------------------------------------------------

export async function listCrops() {
  if (MOCK_FLAGS.crops) return mockDelay([...mockCrops]);
  const { data } = await apiClient.get("/admin/crops/");
  return ensurePaginatedArray(data.data);
}

export async function createCrop(payload) {
  if (MOCK_FLAGS.crops) {
    const crop = { id: genId(), is_active: true, ...payload };
    mockCrops.push(crop);
    return mockDelay(crop);
  }
  const { data } = await apiClient.post("/admin/crops/", payload);
  return data.data;
}

export async function updateCrop(id, payload) {
  if (MOCK_FLAGS.crops) {
    const idx = mockCrops.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Crop not found");
    mockCrops[idx] = { ...mockCrops[idx], ...payload };
    return mockDelay(mockCrops[idx]);
  }
  const { data } = await apiClient.put(`/admin/crops/${id}/`, payload);
  return data.data;
}

export async function deleteCrop(id) {
  if (MOCK_FLAGS.crops) {
    const idx = mockCrops.findIndex((c) => c.id === id);
    if (idx !== -1) mockCrops.splice(idx, 1);
    return mockDelay({ success: true });
  }
  await apiClient.delete(`/admin/crops/${id}/`);
  return { success: true };
}

// ---- Crop Stages (Admin CRUD) --------------------------------------------
// Real: GET/POST /api/admin/stages/   PUT/DELETE /api/admin/stages/{id}/
// AdminCropStageSerializer fields: id, crop, name, order, day_start, day_end,
//   description, typical_duration_days, created_at, updated_at

export async function listStages({ cropId } = {}) {
  if (MOCK_FLAGS.cropStages) {
    const rows = cropId
      ? mockCropStages.filter((s) => s.crop === cropId).sort((a, b) => a.order - b.order)
      : [...mockCropStages];
    return mockDelay(rows);
  }
  const params = cropId ? { crop: cropId } : {};
  const { data } = await apiClient.get("/admin/stages/", { params });
  return ensurePaginatedArray(data.data);
}

export async function listStagesForCrop(cropId) {
  return listStages({ cropId });
}

export async function createStage(payload) {
  if (MOCK_FLAGS.cropStages) {
    const stage = { id: genId(), ...payload };
    mockCropStages.push(stage);
    return mockDelay(stage);
  }
  const { data } = await apiClient.post("/admin/stages/", payload);
  return data.data;
}

export async function updateStage(id, payload) {
  if (MOCK_FLAGS.cropStages) {
    const idx = mockCropStages.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Stage not found");
    mockCropStages[idx] = { ...mockCropStages[idx], ...payload };
    return mockDelay(mockCropStages[idx]);
  }
  const { data } = await apiClient.put(`/admin/stages/${id}/`, payload);
  return data.data;
}

export async function deleteStage(id) {
  if (MOCK_FLAGS.cropStages) {
    const idx = mockCropStages.findIndex((s) => s.id === id);
    if (idx !== -1) mockCropStages.splice(idx, 1);
    return mockDelay({ success: true });
  }
  await apiClient.delete(`/admin/stages/${id}/`);
  return { success: true };
}

// ---- Products (Admin CRUD) -----------------------------------------------

export async function listProducts() {
  if (MOCK_FLAGS.products) return mockDelay([...mockProducts]);
  const { data } = await apiClient.get("/admin/products/");
  return ensurePaginatedArray(data.data);
}

export async function createProduct(payload) {
  if (MOCK_FLAGS.products) {
    const product = { id: genId(), is_active: true, ...payload };
    mockProducts.push(product);
    return mockDelay(product);
  }
  const { data } = await apiClient.post("/admin/products/", payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  if (MOCK_FLAGS.products) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx] = { ...mockProducts[idx], ...payload };
    return mockDelay(mockProducts[idx]);
  }
  const { data } = await apiClient.put(`/admin/products/${id}/`, payload);
  return data.data;
}

export async function deleteProduct(id) {
  if (MOCK_FLAGS.products) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) mockProducts.splice(idx, 1);
    return mockDelay({ success: true });
  }
  await apiClient.delete(`/admin/products/${id}/`);
  return { success: true };
}

// ---- Stage <-> Product mapping -------------------------------------------
// Real serializer fields: id, stage, product, dosage_amount, dosage_unit,
//   application_notes, is_mandatory, created_at, updated_at

export async function listStageProducts() {
  if (MOCK_FLAGS.stageProducts) {
    const withLabels = mockStageProducts.map((sp) => {
      const stage = mockCropStages.find((s) => s.id === sp.stage);
      const product = mockProducts.find((p) => p.id === sp.product);
      const crop = stage ? mockCrops.find((c) => c.id === stage.crop) : null;
      return {
        ...sp,
        stage_name: stage?.name,
        crop_name: crop?.name,
        product_name: product?.name,
      };
    });
    return mockDelay(withLabels);
  }
  const { data } = await apiClient.get("/admin/stage-products/");
  return ensurePaginatedArray(data.data);
}

export async function createStageProduct(payload) {
  if (MOCK_FLAGS.stageProducts) {
    const row = { id: genId(), is_mandatory: false, ...payload };
    mockStageProducts.push(row);
    return mockDelay(row);
  }
  // Real serializer uses dosage_amount / dosage_unit (not recommended_quantity)
  const { data } = await apiClient.post("/admin/stage-products/", payload);
  return data.data;
}

export async function deleteStageProduct(id) {
  if (MOCK_FLAGS.stageProducts) {
    const idx = mockStageProducts.findIndex((sp) => sp.id === id);
    if (idx !== -1) mockStageProducts.splice(idx, 1);
    return mockDelay({ success: true });
  }
  await apiClient.delete(`/admin/stage-products/${id}/`);
  return { success: true };
}
