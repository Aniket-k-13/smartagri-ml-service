import 'package:dio/dio.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/network/api_envelope.dart';
import '../models/ml_prediction_model.dart';

class SurveyRepository {
  final _dio = ApiClient.instance.dio;

  /// POST /api/survey/upload/ (multipart). Field names must match
  /// apps/surveys/serializers.py::SurveyUploadSerializer exactly:
  /// crop_plan_id, stage_id (optional), image, gps_lat, gps_lng.
  /// Response is nested: {"submission": {...}, "ml_prediction": {...}}
  /// under the standard envelope — always check
  /// result.mlPrediction.status before trusting the prediction fields,
  /// since the submission is saved even when the ML call fails.
  Future<SurveyUploadResult> uploadSurveyPhoto({
    required int cropPlanId,
    int? stageId,
    required String imagePath,
    required double lat,
    required double lng,
  }) async {
    final formData = FormData.fromMap({
      'crop_plan_id': cropPlanId,
      if (stageId != null) 'stage_id': stageId,
      'gps_lat': lat,
      'gps_lng': lng,
      'image': await MultipartFile.fromFile(imagePath),
    });

    final res = await _dio.post(ApiEndpoints.surveyUpload, data: formData);
    final data = ApiEnvelope.unwrap(res.data as Map<String, dynamic>) as Map<String, dynamic>;
    return SurveyUploadResult.fromJson(data);
  }
}
