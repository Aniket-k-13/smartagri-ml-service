import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/network/api_envelope.dart';
import '../models/crop_model.dart';

class CropRepository {
  final _dio = ApiClient.instance.dio;

  /// GET /api/crops/ -> {"success": true, "data": [ {id, name, description}, ... ]}
  Future<List<Crop>> fetchCrops() async {
    final res = await _dio.get(ApiEndpoints.crops);
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as List<dynamic>;
    return data.map((e) => Crop.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /api/crops/{id}/plan/?sowing_date=YYYY-MM-DD
  /// -> {"success": true, "data": {"crop": {...}, "sowing_date": ..., "stages": [...]}}
  Future<List<CropStage>> fetchCropPlan({
    required int cropId,
    required DateTime sowingDate,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.cropPlan(cropId),
      queryParameters: {
        'sowing_date': sowingDate.toIso8601String().split('T').first,
      },
    );
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as Map<String, dynamic>;
    final stages = data['stages'] as List<dynamic>;
    return stages.map((e) => CropStage.fromJson(e as Map<String, dynamic>)).toList();
  }
}
