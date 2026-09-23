import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

/// Matches the "Your farm, smarter." reference screen — full-bleed photo,
/// dark scrim, headline, subtext, pill CTA.
///
/// BACKDROP IMAGE: drop a portrait (9:16) photo at
///   assets/images/onboarding_farm.jpg
/// Recommended size: 1080x1920px (or any 9:16 ratio, larger is fine).
/// pubspec.yaml already declares `assets/images/` so no extra config is
/// needed — just add the file with this exact name and hot-restart.
/// If the file is missing, this falls back to a flat color so the app
/// never crashes on a missing asset during development.
class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  static const _backdropPath = 'assets/images/onboarding_farm.jpg';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            _backdropPath,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) =>
                Container(color: AppColors.forestMid),
          ),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black87],
                stops: [0.4, 1.0],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Your farm,\nsmarter.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w600,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Monitor crop health, optimize resources, and increase '
                    'yield with data-driven insights.',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.limeAccent,
                        foregroundColor: Colors.black87,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () => context.go('/login'),
                      child: const Text('Get started'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
