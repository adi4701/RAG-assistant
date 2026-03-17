# --- Build Stage ---
FROM node:20-slim AS builder

# Install Python and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
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

# Install Python dependencies (globally for this container)
RUN pip3 install --no-cache-dir -r lexrag/backend/requirements.txt --break-system-packages

# Copy the rest of the source code
COPY . .

# Build the application
# This will build Vite, Next.js, and move everything into .next/standalone
RUN npm run build

# --- Production Stage ---
FROM node:20-slim

# Install Python runtime
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built standalone server and assets from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/lexrag/backend ./lexrag/backend

# Copy the Python packages from builder
# (This is a bit crude but works for standard pip installs)
COPY --from=builder /usr/local/lib/python3.11/dist-packages /usr/local/lib/python3.11/dist-packages

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port Render expects
EXPOSE 10000

# Start the entrypoint script
CMD ["node", "entrypoint.js"]
