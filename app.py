import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import gradio as gr
from app.main import app as fastapi_app

# Create a simple status landing page interface
demo = gr.Interface(
    fn=lambda: "🚀 ML Dataset Analyzer & MLOps Platform API with GPU Acceleration is ACTIVE!",
    inputs=[],
    outputs="text",
    title="ML Platform Backend API Gateway",
    description="Backend API powering FastAPI endpoints, AutoML, MLOps, and Deep Learning GPU Inference."
)

# Mount FastAPI app onto Gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/status")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
