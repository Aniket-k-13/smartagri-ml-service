import gradio as gr
import spaces
from app.main import app as fastapi_app

# Dummy function to satisfy Hugging Face's ZeroGPU requirement!
# ZeroGPU crashes the container on startup if it doesn't detect this decorator anywhere in the code.
@spaces.GPU
def dummy_gpu_fn():
    pass

# A minimal Gradio UI to satisfy Hugging Face's Gradio SDK
demo = gr.Blocks()
with demo:
    gr.Markdown("# 🌱 SmartAgri ML API is Running!")
    gr.Markdown("### ➡️ [Click here to open the Interactive Dashboard](/)")
    gr.Markdown("### ➡️ [Click here to open the API Docs](/docs)")

# Mount the Gradio app onto our FastAPI app at /gradio
# Hugging Face's SDK will automatically find the 'app' object and serve it using Uvicorn!
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")
