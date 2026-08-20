# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.10-slim

# ── System deps (pillow needs libjpeg, etc.) ──────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ──────────────────────────────────────────────────────────
WORKDIR /app

# ── Install Python dependencies ────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy project ───────────────────────────────────────────────────────────────
COPY . .

# ── Hugging Face Spaces requires port 7860 ────────────────────────────────────
EXPOSE 7860

# ── Run with uvicorn ───────────────────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
