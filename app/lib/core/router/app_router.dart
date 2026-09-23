import 'package:go_router/go_router.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/crops/screens/crop_plan_screen.dart';
import '../../features/survey/screens/upload_screen.dart';

/// Central route table. Add new screens here, not scattered Navigator.push
/// calls, so the whole app's navigation is visible in one place.
final appRouter = GoRouter(
  initialLocation: '/onboarding',
  routes: [
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/crop-plan/:cropId',
      builder: (context, state) {
        final cropId = int.parse(state.pathParameters['cropId']!);
        final sowingDateStr = state.uri.queryParameters['sowingDate'];
        final sowingDate = sowingDateStr != null
            ? DateTime.parse(sowingDateStr)
            : DateTime.now();
        return CropPlanScreen(cropId: cropId, sowingDate: sowingDate);
      },
    ),
    GoRoute(
      path: '/upload/:cropPlanId/:cropId',
      builder: (context, state) {
        final cropPlanId = int.parse(state.pathParameters['cropPlanId']!);
        final cropId = int.parse(state.pathParameters['cropId']!);
        final sowingDateStr = state.uri.queryParameters['sowingDate'];
        final stageIdStr = state.uri.queryParameters['stageId'];
        return UploadScreen(
          cropPlanId: cropPlanId,
          cropId: cropId,
          sowingDate: sowingDateStr != null
              ? DateTime.parse(sowingDateStr)
              : DateTime.now(),
          stageId: stageIdStr != null ? int.parse(stageIdStr) : null,
        );
      },
    ),
  ],
);
