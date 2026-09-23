/// Matches the Farmers table from the shared DB schema:
/// id, user_id, name, phone, gps_lat, gps_lng, farm_size,
/// soil_ph, soil_n, soil_p, soil_k, soil_tested_on
class FarmerProfile {
  final int id;
  final String name;
  final String phone;
  final double? gpsLat;
  final double? gpsLng;
  final double? farmSize;
  final double? soilPh;
  final double? soilN;
  final double? soilP;
  final double? soilK;
  final DateTime? soilTestedOn;

  FarmerProfile({
    required this.id,
    required this.name,
    required this.phone,
    this.gpsLat,
    this.gpsLng,
    this.farmSize,
    this.soilPh,
    this.soilN,
    this.soilP,
    this.soilK,
    this.soilTestedOn,
  });

  factory FarmerProfile.fromJson(Map<String, dynamic> json) => FarmerProfile(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        gpsLat: (json['gps_lat'] as num?)?.toDouble(),
        gpsLng: (json['gps_lng'] as num?)?.toDouble(),
        farmSize: (json['farm_size'] as num?)?.toDouble(),
        soilPh: (json['soil_ph'] as num?)?.toDouble(),
        soilN: (json['soil_n'] as num?)?.toDouble(),
        soilP: (json['soil_p'] as num?)?.toDouble(),
        soilK: (json['soil_k'] as num?)?.toDouble(),
        soilTestedOn: json['soil_tested_on'] != null
            ? DateTime.tryParse(json['soil_tested_on'] as String)
            : null,
      );

  /// For PUT /api/farmer/profile/ — only send fields that changed if
  /// possible; this sends everything for simplicity.
  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        if (gpsLat != null) 'gps_lat': gpsLat,
        if (gpsLng != null) 'gps_lng': gpsLng,
        if (farmSize != null) 'farm_size': farmSize,
        if (soilPh != null) 'soil_ph': soilPh,
        if (soilN != null) 'soil_n': soilN,
        if (soilP != null) 'soil_p': soilP,
        if (soilK != null) 'soil_k': soilK,
      };
}

/// Matches the FarmerCropPlans table:
/// id, farmer_id, crop_id, sowing_date, status, created_at
class FarmerCropPlan {
  final int id;
  final int cropId;
  final String cropName;
  final DateTime sowingDate;
  final String status; // "active" | "completed"
  final DateTime createdAt;

  FarmerCropPlan({
    required this.id,
    required this.cropId,
    required this.cropName,
    required this.sowingDate,
    required this.status,
    required this.createdAt,
  });

  bool get isActive => status == 'active';

  factory FarmerCropPlan.fromJson(Map<String, dynamic> json) {
    // Backend may return crop as a nested object or as crop_id + crop_name
    // flattened, depending on the serializer — handle both defensively.
    final cropObj = json['crop'] as Map<String, dynamic>?;
    return FarmerCropPlan(
      id: json['id'] as int,
      cropId: cropObj != null ? cropObj['id'] as int : json['crop_id'] as int,
      cropName: cropObj != null
          ? cropObj['name'] as String
          : json['crop_name'] as String? ?? '',
      sowingDate: DateTime.parse(json['sowing_date'] as String),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// For POST /api/farmer/plans/
  static Map<String, dynamic> createPayload({
    required int cropId,
    required DateTime sowingDate,
  }) =>
      {
        'crop_id': cropId,
        'sowing_date': sowingDate.toIso8601String().split('T').first,
      };
}
