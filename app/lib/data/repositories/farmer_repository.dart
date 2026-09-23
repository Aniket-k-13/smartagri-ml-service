import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/network/api_envelope.dart';
import '../models/farmer_model.dart';

class FarmerRepository {
  final _dio = ApiClient.instance.dio;

  /// GET /api/farmer/profile/
  Future<FarmerProfile> fetchProfile() async {
    final res = await _dio.get(ApiEndpoints.farmerProfile);
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as Map<String, dynamic>;
    return FarmerProfile.fromJson(data);
  }

  /// PUT /api/farmer/profile/
  Future<FarmerProfile> updateProfile(FarmerProfile profile) async {
    final res = await _dio.put(ApiEndpoints.farmerProfile, data: profile.toJson());
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as Map<String, dynamic>;
    return FarmerProfile.fromJson(data);
  }

  /// GET /api/farmer/plans/ — all crop plans for the logged-in farmer.
  Future<List<FarmerCropPlan>> fetchPlans() async {
    final res = await _dio.get(ApiEndpoints.farmerPlans);
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as List<dynamic>;
    return data.map((e) => FarmerCropPlan.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// POST /api/farmer/plans/ — start growing a new crop.
  Future<FarmerCropPlan> createPlan({
    required int cropId,
    required DateTime sowingDate,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.farmerPlans,
      data: FarmerCropPlan.createPayload(cropId: cropId, sowingDate: sowingDate),
    );
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as Map<String, dynamic>;
    return FarmerCropPlan.fromJson(data);
  }

  /// GET /api/farmer/plans/{id}/
  Future<FarmerCropPlan> fetchPlanDetail(int planId) async {
    final res = await _dio.get(ApiEndpoints.farmerPlanDetail(planId));
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as Map<String, dynamic>;
    return FarmerCropPlan.fromJson(data);
  }

  /// PUT /api/farmer/plans/{id}/ — e.g. mark a plan as "completed".
  Future<FarmerCropPlan> updatePlanStatus({
    required int planId,
    required String status,
  }) async {
    final res = await _dio.put(
      ApiEndpoints.farmerPlanDetail(planId),
      data: {'status': status},
    );
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as Map<String, dynamic>;
    return FarmerCropPlan.fromJson(data);
  }
}
