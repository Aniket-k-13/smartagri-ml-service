
class PlantObservation {
  final String imagePath;
  final String plantType;
  final DateTime plantedOn;
  final String soilType;
  final String soilCondition;
  final String temperature;
  final String weatherCondition;
  final String fertilizerUsed;
  final double? latitude;
  final double? longitude;
  final DateTime capturedAt;

  const PlantObservation({
    required this.imagePath,
    required this.plantType,
    required this.plantedOn,
    required this.soilType,
    required this.soilCondition,
    required this.temperature,
    required this.weatherCondition,
    required this.fertilizerUsed,
    required this.latitude,
    required this.longitude,
    required this.capturedAt,
  });

  Map<String, dynamic> toJson() => {
        'image_path': imagePath,
        'plant_type': plantType,
        'planted_on': plantedOn.toIso8601String(),
        'soil_type': soilType,
        'soil_condition': soilCondition,
        'temperature': temperature,
        'weather_condition': weatherCondition,
        'fertilizer_used': fertilizerUsed,
        'latitude': latitude,
        'longitude': longitude,
        'captured_at': capturedAt.toIso8601String(),
      };
}
