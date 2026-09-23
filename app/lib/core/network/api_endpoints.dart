/// Mirrors the ACTUAL Django backend (apps/*/urls.py), confirmed against
/// the real repo — not the earlier planning doc. Keep this file as the
/// single source of truth; if Person 1 changes a path, update it here only.
class ApiEndpoints {
  ApiEndpoints._();

  // apps/accounts/urls.py — note: prefix is "accounts", not "auth"
  static const String register = '/accounts/register/';
  static const String login = '/accounts/login/'; // body: {email, password}
  static const String loginRefresh = '/accounts/login/refresh/';
  static const String me = '/accounts/me/';

  // apps/crops/urls.py
  static const String crops = '/crops/';
  static String cropPlan(int cropId) => '/crops/$cropId/plan/';

  // apps/farmers/urls.py
  static const String farmerProfile = '/farmer/profile/';
  static const String farmerPlans = '/farmer/plans/';
  static String farmerPlanDetail(int planId) => '/farmer/plans/$planId/';

  // apps/surveys/urls.py
  static const String surveyUpload = '/survey/upload/';
}
