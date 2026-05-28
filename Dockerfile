# ============================================
# Inkspire - Monolithic Production Dockerfile
# ============================================

# --------------------------------------------
# Stage 1: Build the React Frontend
# --------------------------------------------
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY frontend/ .

# Define build arguments for Vite
ARG VITE_API_URL=https://inkspire2.onrender.com
ARG VITE_GOOGLE_AI_KEY=""
ARG VITE_OPENROUTER_API_KEY=""
ARG VITE_STRIPE_PUBLISHABLE_KEY=""
ARG VITE_GOOGLE_CLIENT_ID=""

# Set env vars for Vite build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_AI_KEY=$VITE_GOOGLE_AI_KEY
ENV VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build the production bundle to /app/frontend/dist
RUN npm run build

# --------------------------------------------
# Stage 2: Build the Django Backend Runtime
# --------------------------------------------
FROM python:3.12-slim AS production

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set home directory to avoid permission errors
ENV HOME=/app

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Copy backend dependency files
COPY backend/pyproject.toml backend/uv.lock ./

# Install Python dependencies
RUN uv sync --frozen --no-dev

# Copy the backend code
COPY backend/ .

# Copy the compiled frontend from Stage 1 into the backend container
COPY --from=frontend-builder /app/frontend/dist /app/dist

# Install gunicorn and whitenoise in the environment
RUN uv pip install gunicorn whitenoise

# Create persistent data directories
RUN mkdir -p /app/data /app/media

# Set the SQLite database path to the persistent volume
ENV DB_PATH=/app/data/db.sqlite3
ENV UV_CACHE_DIR=/tmp/.uv-cache

# Collect static files (this will copy Vite assets to staticfiles via WhiteNoise)
RUN uv run python manage.py collectstatic --noinput || true

# Create a non-root user for security
RUN addgroup --system inkspire && \
    adduser --system --ingroup inkspire inkspire && \
    chown -R inkspire:inkspire /app

USER inkspire

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl https://inkspire2.onrender.com/api/ || exit 1

# Run migrations, create superuser, seed database, and start Gunicorn
CMD ["sh", "-c", ".venv/bin/python manage.py migrate && .venv/bin/python manage.py create_admin_superuser && .venv/bin/python manage.py seed_db && .venv/bin/gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile -"]

