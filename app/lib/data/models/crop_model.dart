class Crop {
  final int id;
  final String name;
  final String description;

  Crop({required this.id, required this.name, required this.description});

  factory Crop.fromJson(Map<String, dynamic> json) => Crop(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String? ?? '',
      );
}

class CropStage {
  final int id;
  final String stageName;
  final int dayStart;
  final int dayEnd;
  final List<StageProduct> products;

  CropStage({
    required this.id,
    required this.stageName,
    required this.dayStart,
    required this.dayEnd,
    required this.products,
  });

  factory CropStage.fromJson(Map<String, dynamic> json) => CropStage(
        id: json['id'] as int,
        stageName: json['stage_name'] as String,
        dayStart: json['day_start'] as int,
        dayEnd: json['day_end'] as int,
        products: (json['products'] as List<dynamic>? ?? [])
            .map((p) => StageProduct.fromJson(p as Map<String, dynamic>))
            .toList(),
      );
}

class StageProduct {
  final int id;
  final String name;
  final String description;
  final double? dosageAmount;
  final String dosageUnit;
  final double? perAcreAmount;

  StageProduct({
    required this.id,
    required this.name,
    required this.description,
    required this.dosageAmount,
    required this.dosageUnit,
    required this.perAcreAmount,
  });

  /// Matches apps/crops/serializers.py::StageProductPlanSerializer exactly:
  /// {id, name, description, dosage_amount, dosage_unit, per_acre_amount}
  factory StageProduct.fromJson(Map<String, dynamic> json) => StageProduct(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String? ?? '',
        dosageAmount: (json['dosage_amount'] as num?)?.toDouble(),
        dosageUnit: json['dosage_unit'] as String? ?? '',
        perAcreAmount: (json['per_acre_amount'] as num?)?.toDouble(),
      );
}
