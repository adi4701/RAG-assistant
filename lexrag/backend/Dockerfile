FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Shell form (not JSON array) so ${PORT} is expanded at runtime.
# Render sets PORT=10000. Falls back to 10000 if PORT is not set.
# --no-reload removes the file watcher process (saves ~50MB RAM).
# --workers 1 is required on Render free tier (256MB RAM limit).
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000} --no-reload --workers 1
