import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../providers/crop_providers.dart';

/// Sprint 2: the "Amazon tracking"-style stage-by-stage timeline,
/// fed by GET /api/crops/{id}/plan/?sowing_date=...
class CropPlanScreen extends ConsumerWidget {
  final int cropId;
  final DateTime sowingDate;

  const CropPlanScreen({
    super.key,
    required this.cropId,
    required this.sowingDate,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final planAsync = ref.watch(
      cropPlanProvider((cropId: cropId, sowingDate: sowingDate)),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Crop plan')),
      body: planAsync.when(
        data: (stages) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: stages.length,
          itemBuilder: (context, index) {
            final stage = stages[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(stage.stageName),
                subtitle: Text(
                  'Day ${stage.dayStart}-${stage.dayEnd}  •  '
                      '${stage.products.map((p) => '${p.name} ${p.dosageAmount}${p.dosageUnit}').join(', ')}',
                ),
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Failed to load plan: $err')),
      ),
    );
  }
}
