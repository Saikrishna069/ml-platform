# Dockerfile for Hugging Face Spaces with NVIDIA T4 GPU Acceleration
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

# Install Python & system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    git \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip
RUN python3 -m pip install --no-cache-dir --upgrade pip

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend /app/backend
WORKDIR /app/backend

# Hugging Face Spaces expects port 7860
EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
