import gradio as gr
from app.main import app as fastapi_app
import uvicorn

# A minimal Gradio UI to satisfy Hugging Face ZeroGPU requirements
demo = gr.Blocks()
with demo:
    gr.Markdown("# 🌱 SmartAgri ML API is Running!")
    gr.Markdown("### ➡️ [Click here to open the Interactive Dashboard](/)")
    gr.Markdown("### ➡️ [Click here to open the API Docs](/docs)")

# Mount the Gradio app onto our FastAPI app at /gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

# Hugging Face Gradio SDK executes `python app.py`
# We must start the Uvicorn server ourselves so it doesn't exit!
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
