import 'package:flutter/material.dart';

/// Colors + text styles matching the reference design (Section 3 of roadmap).
class AppColors {
  AppColors._();

  static const Color forestDark = Color(0xFF10331F);
  static const Color forestMid = Color(0xFF1C5A38);
  static const Color limeAccent = Color(0xFFC6E85B);
  static const Color amber = Color(0xFFE8A33D);
  static const Color surfaceWhite = Color(0xFFFAFAF7);
  static const Color textMuted = Color(0xFF6B7A70);
  static const Color glassWhite = Color(0x26FFFFFF); // ~15% opacity overlay
}

class AppTextStyles {
  AppTextStyles._();

  static const heading = TextStyle(
    fontWeight: FontWeight.w500,
    fontSize: 18,
    color: Colors.black87,
  );

  static const statValue = TextStyle(
    fontWeight: FontWeight.w600,
    fontSize: 22,
  );

  static const body = TextStyle(
    fontWeight: FontWeight.w400,
    fontSize: 13,
    color: AppColors.textMuted,
  );
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.surfaceWhite,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.forestMid,
      primary: AppColors.forestMid,
      secondary: AppColors.limeAccent,
    ),
    textTheme: const TextTheme(
      titleLarge: AppTextStyles.heading,
      bodyMedium: AppTextStyles.body,
    ),
  );
}
