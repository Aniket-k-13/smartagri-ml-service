import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/farmer_model.dart';
import '../data/repositories/farmer_repository.dart';
import '../data/repositories/auth_repository.dart';

final farmerRepositoryProvider = Provider((ref) => FarmerRepository());
final authRepositoryProvider = Provider((ref) => AuthRepository());

final farmerProfileProvider = FutureProvider<FarmerProfile>((ref) {
  return ref.read(farmerRepositoryProvider).fetchProfile();
});

final farmerPlansProvider = FutureProvider<List<FarmerCropPlan>>((ref) {
  return ref.read(farmerRepositoryProvider).fetchPlans();
});

final currentUserProvider = FutureProvider<CurrentUser>((ref) {
  return ref.read(authRepositoryProvider).getCurrentUser();
});
