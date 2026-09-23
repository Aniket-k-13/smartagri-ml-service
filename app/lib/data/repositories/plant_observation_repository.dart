
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../models/plant_observation_model.dart';

class PlantObservationRepository {
  Future<File> saveImage(File source) async {
    final dir = await getApplicationDocumentsDirectory();
    final imagesDir = Directory('${dir.path}/plant_observations');
    if (!await imagesDir.exists()) {
      await imagesDir.create(recursive: true);
    }
    final filename =
        'plant_${DateTime.now().millisecondsSinceEpoch}${_extension(source.path)}';
    return source.copy('${imagesDir.path}/$filename');
  }

  Future<File> saveMetadata(PlantObservation observation) async {
    final dir = await getApplicationDocumentsDirectory();
    final metadataDir = Directory('${dir.path}/plant_observations');
    if (!await metadataDir.exists()) {
      await metadataDir.create(recursive: true);
    }
    final file = File(
      '${metadataDir.path}/plant_${observation.capturedAt.millisecondsSinceEpoch}.json',
    );
    return file.writeAsString(
      const JsonEncoder.withIndent('  ').convert(observation.toJson()),
    );
  }

  String _extension(String path) {
    final i = path.lastIndexOf('.');
    return i == -1 ? '.jpg' : path.substring(i);
  }
}
