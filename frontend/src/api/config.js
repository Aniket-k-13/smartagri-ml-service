/**
 * Single source of truth for API wiring.
 *
 * All real endpoints wrap responses in: { success: true, data: ... }
 * All api*() functions below unwrap .data before returning to components.
 *
 * REAL BACKEND PATHS (smartagri-backendd/smartagri-backend):
 *   GET  /api/crops/                          CropListView          [any auth]
 *   GET  /api/admin/crops/                    AdminCropListView     [admin]
 *   POST /api/admin/crops/
 *   PUT/DELETE /api/admin/crops/{id}/
 *   GET/POST   /api/admin/stages/             AdminCropStageListView [admin]
 *   PUT/DELETE /api/admin/stages/{id}/
 *   GET/POST   /api/admin/products/           AdminProductListView  [admin]
 *   PUT/DELETE /api/admin/products/{id}/
 *   GET/POST   /api/admin/stage-products/     AdminStageProductListView [admin]
 *   PUT/DELETE /api/admin/stage-products/{id}/
 *   GET/POST   /api/admin/employees/          AdminEmployeeListView [admin]
 *   PUT        /api/admin/employees/{id}/
 *   GET        /api/admin/dashboard/          AdminDashboardView    [admin]
 *   GET        /api/survey/submissions/       SurveySubmissionListView [officer|admin]
 *   GET        /api/survey/submissions/{id}/  SurveySubmissionDetailView
 *   PATCH      /api/survey/submissions/{id}/review/  SurveySubmissionReviewView
 *
 * WHEN A REAL ENDPOINT IS READY: flip that flag to false here.
 * No page/component needs to change — they all import from *Api.js only.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Auth is real from day one.
export const USE_REAL_AUTH = true;

// Flip each to `false` when the real endpoint is confirmed working in Swagger.
export const MOCK_FLAGS = {
  crops: false,           // GET /api/crops/ + /api/admin/crops/ CRUD
  cropStages: false,     // GET/POST/PUT/DELETE /api/admin/stages/
  products: false,       // GET/POST/PUT/DELETE /api/admin/products/
  stageProducts: false,  // GET/POST/DELETE /api/admin/stage-products/
  surveySubmissions: false, // GET /api/survey/submissions/ + detail + PATCH review
  employees: false,      // GET/POST/PUT /api/admin/employees/
  dashboard: false,       // GET /api/admin/dashboard/
};

// Simulated latency for mock calls so loading states stay visible in dev.
export const MOCK_DELAY_MS = 350;
