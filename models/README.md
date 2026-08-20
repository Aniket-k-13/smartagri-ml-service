# models/

This directory holds the trained ONNX model files for each crop.

## Expected filenames

| Crop       | File                   |
|------------|------------------------|
| Soybean    | `soybean_model.onnx`   |
| Chilli     | `chilli_model.onnx`    |
| Groundnut  | `groundnut_model.onnx` |

## How to export from your training notebook (Kaggle / Colab)

**From PyTorch:**
```python
import torch

dummy_input = torch.randn(1, 3, 224, 224)   # match your training input size
torch.onnx.export(
    model,
    dummy_input,
    "soybean_model.onnx",
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
    opset_version=17,
)
```

**From TensorFlow / Keras:**
```python
import tf2onnx, tensorflow as tf

model = tf.keras.models.load_model("your_model.h5")
spec = (tf.TensorSpec((None, 224, 224, 3), tf.float32, name="input"),)
tf2onnx.convert.from_keras(model, input_signature=spec, output_path="soybean_model.onnx")
```

## ⚠️ Preprocessing contract

When you write the real `predict_image()` logic in `app/inference.py`, the preprocessing
(resize dimensions, mean/std normalization, channel order) **must exactly match** what
was done during training. Mismatch causes silent wrong predictions — no error, just
garbage output.

Document your training preprocessing steps here once training is finalized:

```
# TODO — fill in after training:
# - Input image size: ___ x ___
# - Normalization mean: [_, _, _]  (RGB order)
# - Normalization std: [_, _, _]
# - Class label index map: {0: "Healthy", 1: "...", ...}
```
