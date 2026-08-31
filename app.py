import gradio as gr
from app.main import app as fastapi_app

# A minimal Gradio UI just to satisfy Hugging Face's requirements
demo = gr.Blocks()
with demo:
    gr.Markdown("# 🌱 SmartAgri ML API is Running!")
    gr.Markdown("### ➡️ [Click here to open the Interactive Dashboard](/)")
    gr.Markdown("### ➡️ [Click here to open the API Docs](/docs)")

# Mount the Gradio app onto our FastAPI app at /gradio
# This allows Hugging Face to detect a valid Gradio app, while keeping our beautiful custom root dashboard intact!
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")
