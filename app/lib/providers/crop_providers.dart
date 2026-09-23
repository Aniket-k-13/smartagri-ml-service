import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/crop_model.dart';
import '../data/repositories/crop_repository.dart';

final cropRepositoryProvider = Provider((ref) => CropRepository());

final cropListProvider = FutureProvider<List<Crop>>((ref) {
  return ref.read(cropRepositoryProvider).fetchCrops();
});

final cropPlanProvider = FutureProvider.family<List<CropStage>,
    ({int cropId, DateTime sowingDate})>((ref, args) {
  return ref.read(cropRepositoryProvider).fetchCropPlan(
        cropId: args.cropId,
        sowingDate: args.sowingDate,
      );
});
