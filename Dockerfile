# --- Build Stage ---
FROM node:20-slim AS builder

# Install Python and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for caching
COPY package*.json ./
COPY lexrag/frontend/package*.json ./lexrag/frontend/
COPY lexrag/backend/requirements.txt ./lexrag/backend/

# Install Node dependencies
RUN npm install
RUN cd lexrag/frontend && npm install

# Create a virtual environment for Python dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies in the virtual environment
RUN pip install --no-cache-dir -r lexrag/backend/requirements.txt

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# --- Production Stage ---
FROM node:20-slim

# Install Python runtime
RUN apt-get update && apt-get install -y \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built standalone server and assets from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/lexrag/backend ./lexrag/backend
COPY --from=builder /app/entrypoint.js ./entrypoint.js

# Copy the virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port AI Studio expects
EXPOSE 3000

# Start the entrypoint script
CMD ["node", "entrypoint.js"]
