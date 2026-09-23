
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../data/repositories/survey_repository.dart';
import '../../../data/repositories/crop_repository.dart';
import '../../../data/repositories/plant_observation_repository.dart';
import '../../../data/models/ml_prediction_model.dart';
import '../../../data/models/crop_model.dart';
import '../../../data/models/plant_observation_model.dart';
import '../../../shared/widgets/recommended_products_panel.dart';
import 'plant_camera_screen.dart';

class UploadScreen extends StatefulWidget {
  final int cropPlanId;
  final int cropId;
  final DateTime sowingDate;
  final int? stageId;

  const UploadScreen({
    super.key,
    required this.cropPlanId,
    required this.cropId,
    required this.sowingDate,
    this.stageId,
  });

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final _surveyRepo = SurveyRepository();
  final _cropRepo = CropRepository();
  final _observationRepo = PlantObservationRepository();

  bool _uploading = false;
  SurveyUploadResult? _result;
  List<StageProduct> _stageProducts = [];
  String? _error;
  String? _savedPath;

  Future<void> _takePlantPhoto() async {
    setState(() => _error = null);
    final path = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const PlantCameraScreen()),
    );
    if (!mounted || path == null) return;
    setState(() => _savedPath = path);
    await _showMetadataForm(path);
  }

  Future<void> _showMetadataForm(String imagePath) async {
    final plant = TextEditingController();
    final soilCondition = TextEditingController();
    final temperature = TextEditingController();
    final fertilizer = TextEditingController();
    String soilType = 'Loamy';
    String weather = 'Sunny';
    DateTime plantedOn = DateTime.now();

    final result = await showModalBottomSheet<PlantObservation>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16, right: 16, top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Plant information',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: plant,
                      decoration: const InputDecoration(
                        labelText: 'What kind of plant is it?',
                        hintText: 'e.g. Soybean',
                      ),
                    ),
                    const SizedBox(height: 10),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('When was it planted?'),
                      subtitle: Text(
                        '${plantedOn.day}/${plantedOn.month}/${plantedOn.year}',
                      ),
                      trailing: const Icon(Icons.calendar_today_outlined),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          firstDate: DateTime(2000),
                          lastDate: DateTime.now(),
                          initialDate: plantedOn,
                        );
                        if (picked != null) {
                          setSheetState(() => plantedOn = picked);
                        }
                      },
                    ),
                    DropdownButtonFormField<String>(
                      value: soilType,
                      decoration: const InputDecoration(labelText: 'Soil type'),
                      items: const ['Loamy', 'Clay', 'Sandy', 'Silty', 'Black soil', 'Other']
                          .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                          .toList(),
                      onChanged: (v) => setSheetState(() => soilType = v ?? soilType),
                    ),
                    TextField(
                      controller: soilCondition,
                      decoration: const InputDecoration(
                        labelText: 'Soil condition',
                        hintText: 'e.g. moist, dry, waterlogged',
                      ),
                    ),
                    TextField(
                      controller: temperature,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Temperature',
                        hintText: 'e.g. 28 °C',
                      ),
                    ),
                    DropdownButtonFormField<String>(
                      value: weather,
                      decoration: const InputDecoration(labelText: 'Current weather'),
                      items: const ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Humid', 'Other']
                          .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                          .toList(),
                      onChanged: (v) => setSheetState(() => weather = v ?? weather),
                    ),
                    TextField(
                      controller: fertilizer,
                      decoration: const InputDecoration(
                        labelText: 'Fertilizer used',
                        hintText: 'e.g. Urea, NPK, none',
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: plant.text.trim().isEmpty
                          ? null
                          : () async {
                              final observation = PlantObservation(
                                imagePath: imagePath,
                                plantType: plant.text.trim(),
                                plantedOn: plantedOn,
                                soilType: soilType,
                                soilCondition: soilCondition.text.trim(),
                                temperature: temperature.text.trim(),
                                weatherCondition: weather,
                                fertilizerUsed: fertilizer.text.trim(),
                                latitude: null,
                                longitude: null,
                                capturedAt: DateTime.now(),
                              );
                              Navigator.of(sheetContext).pop(observation);
                            },
                      child: const Text('Save information & upload'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    if (!mounted || result == null) return;
    await _uploadObservation(result);
  }

  Future<void> _uploadObservation(PlantObservation observation) async {
    setState(() {
      _uploading = true;
      _error = null;
      _result = null;
      _stageProducts = [];
    });

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final enriched = PlantObservation(
        imagePath: observation.imagePath,
        plantType: observation.plantType,
        plantedOn: observation.plantedOn,
        soilType: observation.soilType,
        soilCondition: observation.soilCondition,
        temperature: observation.temperature,
        weatherCondition: observation.weatherCondition,
        fertilizerUsed: observation.fertilizerUsed,
        latitude: position.latitude,
        longitude: position.longitude,
        capturedAt: observation.capturedAt,
      );

      await _observationRepo.saveMetadata(enriched);

      // IMPORTANT: the current Django SurveyUploadSerializer accepts only
      // crop_plan_id, stage_id, gps_lat, gps_lng and image. The extra
      // observation fields are therefore stored locally until the backend
      // adds matching serializer/model fields.
      final result = await _surveyRepo.uploadSurveyPhoto(
        cropPlanId: widget.cropPlanId,
        stageId: widget.stageId,
        imagePath: observation.imagePath,
        lat: position.latitude,
        lng: position.longitude,
      );

      final stages = await _cropRepo.fetchCropPlan(
        cropId: widget.cropId,
        sowingDate: widget.sowingDate,
      );
      final matchingStage = stages.where(
        (s) => s.id == result.submission.stageId,
      );
      final products = matchingStage.isNotEmpty
          ? matchingStage.first.products
          : <StageProduct>[];

      if (!mounted) return;
      setState(() {
        _result = result;
        _stageProducts = products;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plant survey')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_savedPath != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.file(
                  File(_savedPath!),
                  height: 230,
                  fit: BoxFit.cover,
                ),
              ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _uploading ? null : _takePlantPhoto,
              icon: const Icon(Icons.camera_alt_outlined),
              label: Text(_uploading ? 'Uploading...' : 'Scan plant'),
            ),
            const SizedBox(height: 8),
            const Text(
              'The shutter is enabled only after the on-device labeler detects a plant.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            if (_result != null) ...[
              const SizedBox(height: 16),
              _buildResultCard(_result!.mlPrediction),
              if (_stageProducts.isNotEmpty) ...[
                const SizedBox(height: 20),
                RecommendedProductsPanel(
                  products: _stageProducts,
                  dosageFactor: _result!.mlPrediction.dosageFactor,
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard(MlPrediction prediction) {
    if (prediction.isPending) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
              SizedBox(width: 12),
              Text('Still processing — check back shortly.'),
            ],
          ),
        ),
      );
    }
    if (prediction.isFailed) {
      return Card(
        color: Colors.red.shade50,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            prediction.errorMessage.isNotEmpty
                ? prediction.errorMessage
                : 'Prediction failed. Your photo was still saved.',
          ),
        ),
      );
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Health: ${prediction.healthLabel ?? '—'}'),
            if (prediction.confidence != null)
              Text('Confidence: ${(prediction.confidence! * 100).toStringAsFixed(0)}%'),
            if (prediction.timingFlag != null) Text('Timing: ${prediction.timingFlag}'),
            const SizedBox(height: 8),
            Text(prediction.finalRecommendation ?? ''),
          ],
        ),
      ),
    );
  }
}
