import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/farmer_providers.dart';
import '../../../shared/widgets/glass_stat_card.dart';

/// Sprint 2: real user name via /api/accounts/me/, real crop plans via
/// /api/farmer/plans/. Weather is still hardcoded — that's a separate
/// integration (a weather API key/service isn't part of this backend yet).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final plansAsync = ref.watch(farmerPlansProvider);

    return Scaffold(
      backgroundColor: AppColors.surfaceWhite,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(currentUserProvider);
            ref.invalidate(farmerPlansProvider);
          },
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: _HeaderWithWeather(userAsync: userAsync),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 44, 16, 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text('My crops',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                          Text('See all',
                              style: TextStyle(fontSize: 13, color: AppColors.forestMid)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      plansAsync.when(
                        data: (plans) => plans.isEmpty
                            ? const _EmptyPlansCard()
                            : Column(
                                children: plans
                                    .map((p) => _CropPlanCard(plan: p))
                                    .toList(),
                              ),
                        loading: () => const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                        error: (err, _) => Text(
                          'Could not load your crop plans.',
                          style: const TextStyle(color: Colors.red, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.limeAccent,
        onPressed: () {
          plansAsync.when(
            data: (plans) {
              if (plans.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Create a crop plan before scanning a plant.'),
                  ),
                );
                return;
              }
              final plan = plans.first;
              context.go(
                '/upload/${plan.id}/${plan.cropId}?sowingDate=${(plan.sowingDate as DateTime).toIso8601String()}',
              );
            },
            loading: () => null,
            error: (_, __) => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Could not load your crop plans.')),
            ),
          );
        },
        child: const Icon(Icons.camera_alt_outlined, color: Colors.black87),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: const [
            Icon(Icons.home, color: AppColors.forestMid),
            Icon(Icons.eco_outlined, color: AppColors.textMuted),
            SizedBox(width: 40),
            Icon(Icons.description_outlined, color: AppColors.textMuted),
            Icon(Icons.person_outline, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _HeaderWithWeather extends StatelessWidget {
  final AsyncValue userAsync;

  const _HeaderWithWeather({required this.userAsync});

  @override
  Widget build(BuildContext context) {
    final greetingName = userAsync.when(
      data: (user) => user.firstName.isNotEmpty ? user.firstName : user.email,
      loading: () => '...',
      error: (_, __) => 'there',
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 44),
      decoration: const BoxDecoration(
        color: AppColors.forestMid,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    radius: 18,
                    backgroundColor: Colors.white24,
                    child: Icon(Icons.person, color: Colors.white, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Welcome back',
                          style: TextStyle(color: Colors.white60, fontSize: 11)),
                      Text('Hi, $greetingName',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white24,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GlassStatCard(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                StatItem(icon: Icons.water_drop_outlined, label: 'Humidity', value: '85%'),
                StatItem(icon: Icons.water_outlined, label: 'Soil moisture', value: '62%'),
                StatItem(icon: Icons.air, label: 'Wind', value: '13 km/h'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyPlansCard extends StatelessWidget {
  const _EmptyPlansCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black12),
      ),
      child: const Column(
        children: [
          Icon(Icons.eco_outlined, size: 32, color: AppColors.textMuted),
          SizedBox(height: 8),
          Text('No crops added yet',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          SizedBox(height: 4),
          Text('Start a crop plan to see it here.',
              style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

class _CropPlanCard extends StatelessWidget {
  final dynamic plan; // FarmerCropPlan

  const _CropPlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    final daysSinceSowing =
        DateTime.now().difference(plan.sowingDate as DateTime).inDays;

    return GestureDetector(
      onTap: () => context.go(
        '/crop-plan/${plan.cropId}?sowingDate=${(plan.sowingDate as DateTime).toIso8601String()}',
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.black12),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.forestMid.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.eco, color: AppColors.forestMid, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(plan.cropName as String,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  Text('Day $daysSinceSowing · ${plan.status}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
