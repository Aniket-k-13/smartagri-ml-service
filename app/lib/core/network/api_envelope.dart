/// The Django backend wraps almost every response as:
///   {"success": true, "data": {...}}
///   {"success": false, "error": {"code": "...", "message": "..."}}
/// EXCEPT the JWT login/refresh endpoints, which intentionally return
/// simplejwt's raw {"access": ..., "refresh": ...} shape unwrapped
/// (see the backend's common/response.py docstring — this is deliberate,
/// not a bug, so don't "fix" it by unwrapping those two).
///
/// Use ApiEnvelope.unwrap() for every endpoint EXCEPT login/refresh.
class ApiEnvelope {
  ApiEnvelope._();

  static dynamic unwrap(Map<String, dynamic> json) {
    if (json['success'] == true) {
      return json['data'];
    }
    final error = json['error'] as Map<String, dynamic>?;
    throw ApiException(
      code: error?['code'] as String? ?? 'UNKNOWN_ERROR',
      message: error?['message'] as String? ?? 'Something went wrong.',
      details: error?['details'],
    );
  }
}

class ApiException implements Exception {
  final String code;
  final String message;
  final dynamic details;

  ApiException({required this.code, required this.message, this.details});

  @override
  String toString() => 'ApiException($code): $message';
}
