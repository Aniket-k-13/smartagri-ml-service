import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../../core/network/api_envelope.dart';

/// Sprint 1: real login against POST /api/accounts/login/.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authRepo = AuthRepository();
  bool _loading = false;
  String? _error;

  /// DEV-ONLY convenience — fills the shared team test farmer account.
  /// Gated behind kDebugMode so it never appears in a release build.
  /// The admin@test.com and survey@test.com accounts are for the React
  /// Admin/Survey Officer web dashboards, not this farmer app — this
  /// Flutter app only ever logs in as role="farmer".
  void _fillTestFarmerAccount() {
    _emailController.text = 'farmer@test.com';
    _passwordController.text = 'SmartAgri@Farmer2026';
  }

  Future<void> _handleLogin() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _authRepo.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (mounted) context.go('/home');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } on DioException catch (e) {
      debugPrint('Login DioException: ${e.type} — ${e.message}');
      setState(() {
        _error = switch (e.type) {
          DioExceptionType.connectionError ||
          DioExceptionType.connectionTimeout =>
            "Can't reach the server. The backend URL may be down or changed "
                "— check with the team for a fresh backend URL.",
          DioExceptionType.receiveTimeout ||
          DioExceptionType.sendTimeout =>
            'Server is taking too long to respond. Try again.',
          _ => 'Network error: ${e.message ?? e.type}',
        };
      });
    } catch (e) {
      debugPrint('Login unexpected error: $e');
      setState(() => _error = 'Unexpected error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Welcome back', style: AppTextStyles.heading),
              const SizedBox(height: 24),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
              ],
              const SizedBox(height: 24),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.forestMid,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _loading ? null : _handleLogin,
                child: Text(_loading ? 'Logging in...' : 'Log in'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/register'),
                child: const Text("New here? Create an account"),
              ),
              if (kDebugMode) ...[
                const Divider(height: 32),
                OutlinedButton.icon(
                  onPressed: _fillTestFarmerAccount,
                  icon: const Icon(Icons.bug_report_outlined, size: 18),
                  label: const Text('Fill test farmer account (debug only)'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
