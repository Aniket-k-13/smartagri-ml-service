import { apiClient } from "./client";
import { MOCK_FLAGS } from "./config";
import { mockDelay } from "./mockUtils";
import { mockSurveySubmissions, mockEmployees, mockDashboard } from "./mockData";

/**
 * Real backend wraps all responses: { success: true, data: ... } or { success: true, data: { count, next, previous, results: [...] } }
 * We unwrap .data and then .results before returning.
 *
 * Real URL contract:
 *   GET   /api/survey/submissions/?officer_review_status=  SurveySubmissionListView
 *   GET   /api/survey/submissions/{id}/                    SurveySubmissionDetailView
 *   PATCH /api/survey/submissions/{id}/review/             SurveySubmissionReviewView
 *   GET   /api/admin/employees/                            AdminEmployeeListView
 *   POST  /api/admin/employees/                            (creates user with role=survey_officer)
 *   PUT   /api/admin/employees/{id}/
 *   GET   /api/admin/dashboard/                            AdminDashboardView
 *
 * Real field names from SurveySubmissionListSerializer:
 *   id, farmer{id,name,phone,village,district,state},
 *   crop_plan_id, crop{id,name,description}, stage{id,name,order},
 *   submitted_at, gps_lat, gps_lng, officer_review_status, officer_notes,
 *   reviewed_by{id,name}, reviewed_at, latest_ml_prediction{...}
 *
 * SurveySubmissionDetailSerializer adds:
 *   image_url, observations, issues_reported, soil_moisture_percent
 *
 * AdminDashboardView returns:
 *   total_farmers, total_survey_officers, total_crops,
 *   total_active_crop_plans, total_survey_submissions,
 *   pending_reviews, reviewed_submissions,
 *   successful_ml_predictions, failed_ml_predictions
 */

// Utility to correctly extract the 'results' array from the paginated 'data' object
const ensurePaginatedArray = (paginatedData) => {
  if (paginatedData && Array.isArray(paginatedData.results)) {
    return paginatedData.results;
  }
  return [];
};

// ---- Survey Submissions (Survey Officer panel) ----------------------------

export async function listSubmissions({ officer_review_status } = {}) {
  if (MOCK_FLAGS.surveySubmissions) {
    const rows = officer_review_status
      ? mockSurveySubmissions.filter((s) => s.officer_review_status === officer_review_status)
      : mockSurveySubmissions;
    return mockDelay([...rows]);
  }
  const params = officer_review_status ? { officer_review_status } : {};
  const { data } = await apiClient.get("/survey/submissions/", { params });
  return ensurePaginatedArray(data.data);
}

export async function getSubmission(id) {
  if (MOCK_FLAGS.surveySubmissions) {
    const row = mockSurveySubmissions.find((s) => s.id === id);
    if (!row) throw new Error("Submission not found");
    return mockDelay({ ...row });
  }
  const { data } = await apiClient.get(`/survey/submissions/${id}/`);
  return data.data;
}

export async function reviewSubmission(id, { officer_review_status, officer_notes }) {
  if (MOCK_FLAGS.surveySubmissions) {
    const idx = mockSurveySubmissions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Submission not found");
    mockSurveySubmissions[idx] = {
      ...mockSurveySubmissions[idx],
      officer_review_status,
      officer_notes,
      reviewed_at: new Date().toISOString(),
    };
    return mockDelay({ ...mockSurveySubmissions[idx] });
  }
  // Real endpoint: PATCH (not PUT) with { officer_review_status, officer_notes }
  const { data } = await apiClient.patch(`/survey/submissions/${id}/review/`, {
    officer_review_status,
    officer_notes,
  });
  return data.data;
}

// ---- Employees (Admin panel) -----------------------------------------------
// Real AdminEmployeeSerializer fields:
//   id, user_id, email, role, first_name, last_name, phone,
//   employee_code, designation, department, assigned_region,
//   date_of_joining, is_active_employee
// POST uses AdminEmployeeCreateSerializer (needs password + employee_code)

export async function listEmployees() {
  if (MOCK_FLAGS.employees) return mockDelay([...mockEmployees]);
  const { data } = await apiClient.get("/admin/employees/");
  return ensurePaginatedArray(data.data);
}

export async function createEmployee(payload) {
  if (MOCK_FLAGS.employees) {
    const emp = { id: genId(), role: "survey_officer", is_active_employee: true, ...payload };
    mockEmployees.push(emp);
    return mockDelay(emp);
  }
  // payload: { email, password, first_name, last_name, phone,
  //            employee_code, designation, department, assigned_region, date_of_joining }
  const { data } = await apiClient.post("/admin/employees/", payload);
  return data.data;
}

export async function updateEmployee(id, payload) {
  if (MOCK_FLAGS.employees) {
    const idx = mockEmployees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Employee not found");
    mockEmployees[idx] = { ...mockEmployees[idx], ...payload };
    return mockDelay(mockEmployees[idx]);
  }
  const { data } = await apiClient.put(`/admin/employees/${id}/`, payload);
  return data.data;
}

// ---- Dashboard (Admin panel) -----------------------------------------------
// Real AdminDashboardView returns the data directly (no 'results' array as it's not a list endpoint),
// but we normalise it here so components always get the same shape.

export async function getDashboard() {
  if (MOCK_FLAGS.dashboard) return mockDelay({ ...mockDashboard });
  const { data } = await apiClient.get("/admin/dashboard/");
  // AdminDashboardView: Response({"success": True, "data": {...}})
  return data.data;
}

// keep old name for ReportsPage until we migrate it
export const getReportsSummary = getDashboard;

// helper used by mock createEmployee
function genId() {
  return Math.floor(Math.random() * 90000) + 10000;
}
