import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/network/api_envelope.dart';

/// If Django rejects a request because the tunnel's hostname isn't in
/// DJANGO_ALLOWED_HOSTS, it returns an HTML error page (status 400),
/// not JSON. Dio still "succeeds" the HTTP call, so this would otherwise
/// surface as a confusing type-cast crash. Detect it here and give a
/// specific, actionable message instead.
Map<String, dynamic> _expectJsonMap(dynamic data) {
  if (data is Map<String, dynamic>) return data;
  throw ApiException(
    code: 'NON_JSON_RESPONSE',
    message:
        "Server returned an unexpected (non-JSON) response. This usually "
        "means the tunnel's hostname isn't in Django's ALLOWED_HOSTS — "
        "ask Person 1 to add the tunnel domain (e.g. '.trycloudflare.com') "
        "to DJANGO_ALLOWED_HOSTS in their .env and restart the server.",
  );
}

/// Minimal shape of GET /api/accounts/me/ — expand fields here if the
/// backend's UserSerializer returns more than this.
class CurrentUser {
  final int id;
  final String email;
  final String role;
  final String firstName;
  final String lastName;

  CurrentUser({
    required this.id,
    required this.email,
    required this.role,
    required this.firstName,
    required this.lastName,
  });

  factory CurrentUser.fromJson(Map<String, dynamic> json) => CurrentUser(
        id: json['id'] as int,
        email: json['email'] as String,
        role: json['role'] as String,
        firstName: json['first_name'] as String? ?? '',
        lastName: json['last_name'] as String? ?? '',
      );
}

class AuthRepository {
  final _dio = ApiClient.instance.dio;

  /// POST /api/accounts/register/ — wrapped in the standard envelope.
  /// role must be "farmer" or "survey_officer" (admin can't self-register).
  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phoneNumber,
    String role = 'farmer',
  }) async {
    final res = await _dio.post(ApiEndpoints.register, data: {
      'email': email,
      'password': password,
      'first_name': firstName,
      'last_name': lastName,
      'phone_number': phoneNumber,
      'role': role,
    });
    ApiEnvelope.unwrap(_expectJsonMap(res.data));
  }

  /// POST /api/accounts/login/ — this endpoint is NOT wrapped in the
  /// success/data envelope (it's raw SimpleJWT: {"access":..., "refresh":...}).
  /// USERNAME_FIELD on the backend User model is "email", not "username".
  Future<void> login({required String email, required String password}) async {
    final res = await _dio.post(ApiEndpoints.login, data: {
      'email': email,
      'password': password,
    });
    final json = _expectJsonMap(res.data);
    final accessToken = json['access'] as String;
    await ApiClient.instance.saveToken(accessToken);
    // TODO: also persist json['refresh'] securely if you want silent
    // re-auth via /api/accounts/login/refresh/ instead of forcing re-login.
  }

  /// GET /api/accounts/me/ — call this after login/app-restart to check
  /// the token is still valid and to know who's logged in + their role.
  Future<CurrentUser> getCurrentUser() async {
    final res = await _dio.get(ApiEndpoints.me);
    final data = ApiEnvelope.unwrap(_expectJsonMap(res.data)) as Map<String, dynamic>;
    return CurrentUser.fromJson(data);
  }

  Future<void> logout() => ApiClient.instance.clearToken();
}
