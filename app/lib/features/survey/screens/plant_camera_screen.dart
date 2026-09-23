
import 'dart:io';
import 'dart:ui' as ui;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_image_labeling/google_mlkit_image_labeling.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/foundation.dart';

class PlantCameraScreen extends StatefulWidget {
  const PlantCameraScreen({super.key});

  @override
  State<PlantCameraScreen> createState() => _PlantCameraScreenState();
}

class _PlantCameraScreenState extends State<PlantCameraScreen> {
  CameraController? _controller;
  ImageLabeler? _labeler;
  bool _busy = false;
  bool _plantDetected = false;
  double _confidence = 0;
  String _status = 'Point the camera at a plant';

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final cameras = await availableCameras();
      final camera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      _labeler = ImageLabeler(
        options: ImageLabelerOptions(confidenceThreshold: 0.55),
      );

      final controller = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.nv21
            : ImageFormatGroup.bgra8888,
      );
      _controller = controller;
      await controller.initialize();
      await controller.startImageStream(_processFrame);
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) setState(() => _status = 'Camera could not start: $e');
    }
  }

  Future<void> _processFrame(CameraImage image) async {
    if (_busy || _labeler == null || _controller == null) return;
    _busy = true;
    try {
      final input = _inputImageFromCameraImage(image);
      if (input == null) return;
      final labels = await _labeler!.processImage(input);

      final plant = labels
          .where((l) => _isPlantLabel(l.label))
          .fold<ImageLabel?>(
        null,
            (best, current) =>
        best == null || current.confidence > best.confidence
            ? current
            : best,
      );

      if (!mounted) return;
      setState(() {
        _plantDetected = plant != null;
        _confidence = plant?.confidence ?? 0;
        _status = plant == null
            ? 'No plant detected — move closer or change the angle'
            : 'Plant detected ${(plant.confidence * 100).toStringAsFixed(0)}%';
      });
    } catch (_) {
      // Frame-level failures should not stop the preview.
    } finally {
      _busy = false;
    }
  }

  bool _isPlantLabel(String label) {
    final value = label.toLowerCase().trim();
    const exact = {
      'plant',
      'plantation',
      'flower',
      'flowering plant',
      'houseplant',
      'vegetation',
      'leaf',
      'leaves',
      'tree',
      'shrub',
      'herb',
      'grass',
      'crop',
      'fruit',
      'vegetable',
    };
    if (exact.contains(value)) return true;
    return value.contains('plant') ||
        value.contains('vegetation') ||
        value.contains('flowering');
  }

  InputImage? _inputImageFromCameraImage(CameraImage image) {
    final controller = _controller;
    if (controller == null) return null;

    final rotation = InputImageRotationValue.fromRawValue(
      controller.description.sensorOrientation,
    );
    if (rotation == null) return null;

    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    if (format == null) return null;

    final bytes = WriteBuffer();
    for (final plane in image.planes) {
      bytes.putUint8List(plane.bytes);
    }

    final size = ui.Size(image.width.toDouble(), image.height.toDouble());
    final metadata = InputImageMetadata(
      size: size,
      rotation: rotation,
      format: format,
      bytesPerRow: image.planes.first.bytesPerRow,
    );

    return InputImage.fromBytes(bytes: bytes.done().buffer.asUint8List(), metadata: metadata);
  }

  Future<void> _capture() async {
    final controller = _controller;
    if (controller == null ||
        !controller.value.isInitialized ||
        !_plantDetected ||
        controller.value.isTakingPicture) {
      return;
    }

    try {
      await controller.stopImageStream();
      final photo = await controller.takePicture();
      final dir = await getApplicationDocumentsDirectory();
      final folder = Directory('${dir.path}/plant_observations');
      await folder.create(recursive: true);
      final saved = await File(photo.path).copy(
        '${folder.path}/plant_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );

      if (!mounted) return;
      Navigator.of(context).pop(saved.path);
    } catch (e) {
      if (mounted) setState(() => _status = 'Could not save photo: $e');
      if (!controller.value.isStreamingImages) {
        try {
          await controller.startImageStream(_processFrame);
        } catch (_) {}
      }
    }
  }

  @override
  void dispose() {
    _labeler?.close();
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Plant camera'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: controller == null || !controller.value.isInitialized
          ? Center(
              child: Text(_status, style: const TextStyle(color: Colors.white)),
            )
          : Stack(
              fit: StackFit.expand,
              children: [
                CameraPreview(controller),
                Align(
                  alignment: Alignment.topCenter,
                  child: SafeArea(
                    child: Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(.65),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        _status,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _plantDetected ? Colors.greenAccent : Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 28),
                      child: GestureDetector(
                        onTap: _plantDetected ? _capture : null,
                        child: Container(
                          width: 76,
                          height: 76,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _plantDetected ? Colors.white : Colors.white38,
                            border: Border.all(color: Colors.white, width: 4),
                          ),
                          child: Icon(
                            Icons.camera_alt,
                            color: _plantDetected ? Colors.black : Colors.white54,
                            size: 30,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
