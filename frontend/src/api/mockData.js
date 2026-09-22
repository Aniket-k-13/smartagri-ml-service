/**
 * Mock data shaped to match the REAL serializer field names from:
 *   smartagri-backendd/smartagri-backend/apps/adminapi/serializers.py
 *   smartagri-backendd/smartagri-backend/apps/surveys/serializers.py
 *
 * When a MOCK_FLAG is flipped to false, the real API returns the same shape.
 */

let nextId = (() => {
  let n = 1000;
  return () => n++;
})();

export const genId = () => nextId();

// ---- Crops (AdminCropSerializer fields) ------------------------------------
// id, name, scientific_name, category, season, description, is_active

export const mockCrops = [
  { id: 1, name: "Soybean", scientific_name: "Glycine max", category: "oilseed", season: "kharif", description: "Primary kharif oilseed crop for the region.", is_active: true },
  { id: 2, name: "Chilli", scientific_name: "Capsicum annuum", category: "spice", season: "kharif", description: "High-value cash crop, needs close pest monitoring.", is_active: true },
  { id: 3, name: "Groundnut", scientific_name: "Arachis hypogaea", category: "oilseed", season: "kharif", description: "Drought-tolerant oilseed, common in sandy loam soils.", is_active: true },
];

// ---- Crop Stages (AdminCropStageSerializer fields) -------------------------
// id, crop(FK id), name, order, day_start, day_end, description, typical_duration_days

export const mockCropStages = [
  { id: 1, crop: 1, name: "Land Preparation", order: 1, day_start: 0, day_end: 7, description: "Ploughing and field prep.", typical_duration_days: 7 },
  { id: 2, crop: 1, name: "Seed Treatment", order: 2, day_start: 8, day_end: 9, description: "Pre-sowing seed treatment.", typical_duration_days: 1 },
  { id: 3, crop: 1, name: "Sowing", order: 3, day_start: 10, day_end: 12, description: "Seed sowing.", typical_duration_days: 2 },
  { id: 4, crop: 1, name: "Vegetative", order: 4, day_start: 13, day_end: 38, description: "Early vegetative growth.", typical_duration_days: 25 },
  { id: 5, crop: 1, name: "Flowering", order: 5, day_start: 39, day_end: 59, description: "Flowering and pod initiation.", typical_duration_days: 20 },
  { id: 6, crop: 1, name: "Maturity", order: 6, day_start: 60, day_end: 90, description: "Pod filling to harvest.", typical_duration_days: 30 },
  { id: 7, crop: 2, name: "Land Preparation", order: 1, day_start: 0, day_end: 5, description: "Bed preparation.", typical_duration_days: 5 },
  { id: 8, crop: 2, name: "Transplanting", order: 2, day_start: 6, day_end: 8, description: "Seedling transplant.", typical_duration_days: 2 },
  { id: 9, crop: 2, name: "Vegetative", order: 3, day_start: 9, day_end: 39, description: "Vegetative growth.", typical_duration_days: 30 },
  { id: 10, crop: 2, name: "Flowering", order: 4, day_start: 40, day_end: 65, description: "Flowering and fruit set.", typical_duration_days: 25 },
];

// ---- Products (AdminProductSerializer fields) ------------------------------
// id, name, product_type, manufacturer, description, unit_of_measure, is_active

export const mockProducts = [
  { id: 1, name: "Agri Humic", product_type: "fertilizer", manufacturer: "Vestige", description: "Humic acid soil conditioner.", unit_of_measure: "gm", is_active: true },
  { id: 2, name: "Agri Gold", product_type: "growth_regulator", manufacturer: "Vestige", description: "Growth booster for flowering stage.", unit_of_measure: "ml", is_active: true },
  { id: 3, name: "Agri 82", product_type: "pesticide", manufacturer: "Vestige", description: "Broad-spectrum pest control.", unit_of_measure: "ml", is_active: true },
];

// ---- Stage Products (AdminStageProductSerializer fields) ------------------
// id, stage(FK), product(FK), dosage_amount, dosage_unit, application_notes, is_mandatory

export const mockStageProducts = [
  { id: 1, stage: 1, product: 1, dosage_amount: "500.00", dosage_unit: "gm", application_notes: "Mix into soil during ploughing.", is_mandatory: true, stage_name: "Land Preparation", crop_name: "Soybean", product_name: "Agri Humic" },
  { id: 2, stage: 5, product: 2, dosage_amount: "20.00", dosage_unit: "ml", application_notes: "Foliar spray at flower initiation.", is_mandatory: true, stage_name: "Flowering", crop_name: "Soybean", product_name: "Agri Gold" },
  { id: 3, stage: 4, product: 3, dosage_amount: "15.00", dosage_unit: "ml", application_notes: "Apply if pest pressure observed.", is_mandatory: false, stage_name: "Vegetative", crop_name: "Soybean", product_name: "Agri 82" },
];

// ---- Employees (AdminEmployeeSerializer fields) ----------------------------
// id, user_id, email, role, first_name, last_name, phone,
// employee_code, designation, department, assigned_region,
// date_of_joining, is_active_employee

export const mockEmployees = [
  { id: 1, user_id: 201, email: "anjali@smartagri.in", role: "survey_officer", first_name: "Anjali", last_name: "Deshmukh", phone: "9876500001", employee_code: "EMP-001", designation: "Field Officer", department: "Survey", assigned_region: "Pune East", date_of_joining: "2025-06-01", is_active_employee: true },
  { id: 2, user_id: 202, email: "vikram@smartagri.in", role: "survey_officer", first_name: "Vikram", last_name: "Shinde", phone: "9876500002", employee_code: "EMP-002", designation: "Field Officer", department: "Survey", assigned_region: "Pune West", date_of_joining: "2025-07-15", is_active_employee: true },
];

// ---- Survey Submissions (SurveySubmissionListSerializer fields) ------------
// id, farmer{id,name,phone,village,district,state},
// crop_plan_id, crop{id,name,description}, stage{id,name,order},
// submitted_at, gps_lat, gps_lng, officer_review_status, officer_notes,
// reviewed_by{id,name}, reviewed_at, latest_ml_prediction{...}
//
// Detail adds: image_url, observations, issues_reported, soil_moisture_percent

export const mockSurveySubmissions = [
  {
    id: 1,
    farmer: { id: 1, name: "Ramesh Patil", phone: "9876501001", village: "Wagholi", district: "Pune", state: "Maharashtra" },
    crop_plan_id: 1,
    crop: { id: 1, name: "Soybean", description: "Primary kharif oilseed crop." },
    stage: { id: 4, name: "Vegetative", order: 4 },
    submitted_at: "2026-07-10T09:15:00Z",
    gps_lat: "18.520430",
    gps_lng: "73.856744",
    image_url: "https://placehold.co/600x400?text=Survey+Photo",
    soil_moisture_percent: "42.50",
    observations: "Leaves show slight yellowing on lower canopy.",
    issues_reported: "Possible nitrogen deficiency.",
    officer_review_status: "submitted",
    officer_notes: "",
    reviewed_by: null,
    reviewed_at: null,
    latest_ml_prediction: {
      id: 1,
      status: "success",
      health_label: "Nitrogen Deficiency",
      disease_type: "nutritional",
      confidence: "0.8700",
      timing_flag: "apply_now",
      dosage_factor: "1.00",
      final_recommendation: "Apply nitrogen-rich fertilizer immediately. Consider foliar urea spray.",
      error_message: "",
      predicted_at: "2026-07-10T09:15:45Z",
    },
  },
  {
    id: 2,
    farmer: { id: 2, name: "Sunita Jadhav", phone: "9876501002", village: "Hinjewadi", district: "Pune", state: "Maharashtra" },
    crop_plan_id: 2,
    crop: { id: 2, name: "Chilli", description: "High-value cash crop." },
    stage: { id: 9, name: "Vegetative", order: 3 },
    submitted_at: "2026-07-12T11:40:00Z",
    gps_lat: "18.591000",
    gps_lng: "73.738000",
    image_url: "https://placehold.co/600x400?text=Survey+Photo+2",
    soil_moisture_percent: "38.00",
    observations: "Healthy growth, no visible issues.",
    issues_reported: "",
    officer_review_status: "under_review",
    officer_notes: "",
    reviewed_by: null,
    reviewed_at: null,
    latest_ml_prediction: {
      id: 2,
      status: "success",
      health_label: "Healthy",
      disease_type: null,
      confidence: "0.9500",
      timing_flag: "no_action",
      dosage_factor: "1.00",
      final_recommendation: "Crop is healthy. Continue regular irrigation schedule.",
      error_message: "",
      predicted_at: "2026-07-12T11:41:10Z",
    },
  },
  {
    id: 3,
    farmer: { id: 1, name: "Ramesh Patil", phone: "9876501001", village: "Wagholi", district: "Pune", state: "Maharashtra" },
    crop_plan_id: 1,
    crop: { id: 1, name: "Soybean", description: "Primary kharif oilseed crop." },
    stage: { id: 5, name: "Flowering", order: 5 },
    submitted_at: "2026-08-01T08:05:00Z",
    gps_lat: "18.520430",
    gps_lng: "73.856744",
    image_url: "https://placehold.co/600x400?text=Survey+Photo+3",
    soil_moisture_percent: "35.20",
    observations: "Brown lesions on several leaves.",
    issues_reported: "Suspected fungal infection.",
    officer_review_status: "reviewed",
    officer_notes: "Confirmed early blight. Advised fungicide spray.",
    reviewed_by: { id: 201, name: "Anjali Deshmukh" },
    reviewed_at: "2026-08-02T10:30:00Z",
    latest_ml_prediction: {
      id: 3,
      status: "success",
      health_label: "Early Blight",
      disease_type: "fungal",
      confidence: "0.9100",
      timing_flag: "delay_2_days",
      dosage_factor: "1.10",
      final_recommendation: "Apply fungicide after 2 days. Increase dosage by 10% given severity.",
      error_message: "",
      predicted_at: "2026-08-01T08:06:00Z",
    },
  },
];

// ---- Dashboard (AdminDashboardView response data fields) -------------------
export const mockDashboard = {
  total_farmers: 128,
  total_survey_officers: 14,
  total_crops: 6,
  total_active_crop_plans: 94,
  total_survey_submissions: 231,
  pending_reviews: 17,
  reviewed_submissions: 214,
  successful_ml_predictions: 198,
  failed_ml_predictions: 12,
};
