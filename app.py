import gradio as gr
import spaces
import json
from backend.main import app as fastapi_app
from backend.inference import predict_image
from backend.weather import get_timing_flag
from backend.soil import get_dosage_factor
from backend.fusion import build_recommendation

def process_image_gpu(image_bytes, crop_lower):
    return predict_image(image_bytes, crop_lower)

@spaces.GPU(duration=15)
def gradio_predict(image_path, crop, lat, lng, ph, n, p, k, base_schedule_str):
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    
    crop_lower = crop.lower().strip()
    schedule = json.loads(base_schedule_str)
    
    # 1. Inference (Triggering ZeroGPU)
    health_label, disease_type, confidence = process_image_gpu(image_bytes, crop_lower)
    
    # 2. Weather
    timing_flag = get_timing_flag(lat, lng)
    
    # 3. Soil
    dosage_factor = get_dosage_factor(ph, n, p, k)
    
    # 4. Fusion
    final_rec = build_recommendation(health_label, disease_type, timing_flag, dosage_factor, schedule)
    
    return health_label, f"{confidence*100:.1f}%", timing_flag, f"{dosage_factor}x", final_rec

# Create the beautiful Gradio dashboard
demo = gr.Interface(
    fn=gradio_predict,
    inputs=[
        gr.Image(type="filepath", label="Leaf Image"),
        gr.Dropdown(choices=["soybean", "chilli", "groundnut"], label="Crop", value="chilli"),
        gr.Number(label="Latitude", value=18.5204),
        gr.Number(label="Longitude", value=73.8567),
        gr.Number(label="pH", value=6.5),
        gr.Number(label="Nitrogen (N)", value=45),
        gr.Number(label="Phosphorus (P)", value=20),
        gr.Number(label="Potassium (K)", value=30),
        gr.Textbox(label="Base Schedule (JSON)", value='[{"product": "Agri Gold", "dosage": "20grm"}]')
    ],
    outputs=[
        gr.Textbox(label="Health Label"),
        gr.Textbox(label="Confidence"),
        gr.Textbox(label="Timing Flag"),
        gr.Textbox(label="Dosage Factor"),
        gr.Textbox(label="Final Recommendation")
    ],
    title="🌱 SmartAgri ML Dashboard",
    description="Test the prediction API directly from your browser. Note: FastAPI endpoints are still perfectly available at `/predict` and `/docs`."
)

# Mount the entire Gradio app at the root ("/") of our FastAPI app!
# Because our FastAPI app has specific routes (/predict, /health, /docs), Starlette will automatically route API requests to FastAPI, 
# and send any browser visits to the Gradio dashboard!
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
