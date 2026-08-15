# Stage 1: Build the frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Python Backend
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies if any are needed for PDF/Excel generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libcairo2-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --default-timeout=1000 --no-cache-dir -r backend/requirements.txt

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy the rest of the backend source code
COPY backend ./backend

# Create necessary directories
RUN mkdir -p /app/backend/instance /app/backend/uploads

WORKDIR /app/backend

# Expose the Waitress port
EXPOSE 5055

# Run the Waitress production server
CMD ["waitress-serve", "--port=5055", "app:app"]
