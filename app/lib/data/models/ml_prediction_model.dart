/// Matches apps/surveys/serializers.py::MLPredictionResultSerializer exactly:
/// {id, status, health_label, disease_type, confidence, timing_flag,
///  dosage_factor, final_recommendation, error_message, predicted_at}
///
/// status is one of: pending / processing / success / failed.
/// The submission is ALWAYS saved even if the ML call fails — always check
/// status before trusting health_label/final_recommendation, since those
/// may be empty/stale when status != "success".
class MlPrediction {
  final int id;
  final String status;
  final String? healthLabel;
  final String? diseaseType;
  final double? confidence;
  final String? timingFlag;
  final double? dosageFactor;
  final String? finalRecommendation;
  final String errorMessage;

  MlPrediction({
    required this.id,
    required this.status,
    this.healthLabel,
    this.diseaseType,
    this.confidence,
    this.timingFlag,
    this.dosageFactor,
    this.finalRecommendation,
    this.errorMessage = '',
  });

  bool get isSuccess => status == 'success';
  bool get isFailed => status == 'failed';
  bool get isPending => status == 'pending' || status == 'processing';

  factory MlPrediction.fromJson(Map<String, dynamic> json) => MlPrediction(
        id: json['id'] as int,
        status: json['status'] as String,
        healthLabel: json['health_label'] as String?,
        diseaseType: json['disease_type'] as String?,
        confidence: (json['confidence'] as num?)?.toDouble(),
        timingFlag: json['timing_flag'] as String?,
        dosageFactor: (json['dosage_factor'] as num?)?.toDouble(),
        finalRecommendation: json['final_recommendation'] as String?,
        errorMessage: json['error_message'] as String? ?? '',
      );
}

/// Matches apps/surveys/serializers.py::SurveySubmissionResultSerializer.
class SurveySubmissionResult {
  final int id;
  final int cropPlanId;
  final int stageId;
  final String stageName;
  final String? imageUrl;
  final DateTime submissionDate;

  SurveySubmissionResult({
    required this.id,
    required this.cropPlanId,
    required this.stageId,
    required this.stageName,
    required this.imageUrl,
    required this.submissionDate,
  });

  factory SurveySubmissionResult.fromJson(Map<String, dynamic> json) {
    final stage = json['stage'] as Map<String, dynamic>;
    return SurveySubmissionResult(
      id: json['id'] as int,
      cropPlanId: json['crop_plan_id'] as int,
      stageId: stage['id'] as int,
      stageName: stage['name'] as String,
      imageUrl: json['image_url'] as String?,
      submissionDate: DateTime.parse(json['submission_date'] as String),
    );
  }
}

/// The full, nested response of POST /api/survey/upload/ once unwrapped
/// from the {"success":true,"data": {...}} envelope.
class SurveyUploadResult {
  final SurveySubmissionResult submission;
  final MlPrediction mlPrediction;

  SurveyUploadResult({required this.submission, required this.mlPrediction});

  factory SurveyUploadResult.fromJson(Map<String, dynamic> json) =>
      SurveyUploadResult(
        submission: SurveySubmissionResult.fromJson(
            json['submission'] as Map<String, dynamic>),
        mlPrediction: MlPrediction.fromJson(
            json['ml_prediction'] as Map<String, dynamic>),
      );
}

