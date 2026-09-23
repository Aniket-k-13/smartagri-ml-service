import 'package:flutter/material.dart';
import '../../data/models/crop_model.dart';
import '../../core/theme/app_theme.dart';

/// Shows the recommended products for the current stage as a set of
/// panel cards. If [dosageFactor] is provided (from the ML prediction),
/// the displayed quantity is adjusted and both the base and adjusted
/// amounts are shown so the farmer can see why it changed.
class RecommendedProductsPanel extends StatelessWidget {
  final List<StageProduct> products;
  final double? dosageFactor;

  const RecommendedProductsPanel({
    super.key,
    required this.products,
    this.dosageFactor,
  });

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return const SizedBox.shrink();
    }

    final showAdjustment = dosageFactor != null && dosageFactor != 1.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Recommended products',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            if (showAdjustment) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.limeAccent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  dosageFactor! > 1.0
                      ? '+${((dosageFactor! - 1) * 100).toStringAsFixed(0)}% adjusted'
                      : '-${((1 - dosageFactor!) * 100).toStringAsFixed(0)}% adjusted',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 10),
        ...products.map((p) => _ProductCard(
              product: p,
              dosageFactor: dosageFactor,
            )),
      ],
    );
  }
}

class _ProductCard extends StatelessWidget {
  final StageProduct product;
  final double? dosageFactor;

  const _ProductCard({required this.product, this.dosageFactor});

  @override
  Widget build(BuildContext context) {
    final baseAmount = product.dosageAmount;
    final adjusted = (baseAmount != null && dosageFactor != null)
        ? baseAmount * dosageFactor!
        : null;
    final showAdjustment = adjusted != null && dosageFactor != 1.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black12),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: AppColors.forestMid.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.eco_outlined,
                color: AppColors.forestMid, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(product.name,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                if (product.description.isNotEmpty)
                  Text(
                    product.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                adjusted != null
                    ? '${adjusted.toStringAsFixed(1)} ${product.dosageUnit}'
                    : (baseAmount != null
                        ? '${baseAmount.toStringAsFixed(1)} ${product.dosageUnit}'
                        : '—'),
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              if (showAdjustment && baseAmount != null)
                Text(
                  'base ${baseAmount.toStringAsFixed(1)} ${product.dosageUnit}',
                  style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.textMuted,
                      decoration: TextDecoration.lineThrough),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
