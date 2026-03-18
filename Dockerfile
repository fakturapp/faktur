# ==============================================================================
# Faktur - Multi-stage Docker build (Backend + Frontend)
# Single container: backend (port 3333) + frontend (port 3000)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base with dependencies
# ------------------------------------------------------------------------------
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Install all dependencies
# ------------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 3: Build backend (AdonisJS)
# ------------------------------------------------------------------------------
FROM deps AS build-backend
COPY apps/backend/ ./apps/backend/
WORKDIR /app/apps/backend
RUN node ace build --ignore-ts-errors
# Install production deps inside build output
WORKDIR /app/apps/backend/build
RUN npm install --omit=dev

# ------------------------------------------------------------------------------
# Stage 4: Build frontend (Next.js standalone)
# ------------------------------------------------------------------------------
FROM deps AS build-frontend
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY apps/frontend/ ./apps/frontend/
WORKDIR /app/apps/frontend
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 5: Production (combined backend + frontend)
# ------------------------------------------------------------------------------
FROM base AS production

# -- Backend (build output with node_modules already installed) --
COPY --from=build-backend /app/apps/backend/build/ ./apps/backend/

# -- Frontend (standalone) --
COPY --from=build-frontend /app/apps/frontend/.next/standalone/ ./standalone-tmp/
RUN mkdir -p apps/frontend/.next \
    && cp -r standalone-tmp/apps/frontend/* apps/frontend/ \
    && cp -r standalone-tmp/node_modules apps/frontend/node_modules 2>/dev/null || true \
    && rm -rf standalone-tmp
COPY --from=build-frontend /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build-frontend /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3333 3000
# Backend on 3333 (background) + Frontend on 3000 (foreground)
CMD ["sh", "-c", "cd /app/apps/backend && PORT=3333 HOST=0.0.0.0 node ace migration:run --force && PORT=3333 HOST=0.0.0.0 node bin/server.js & cd /app/apps/frontend && PORT=3000 HOSTNAME=0.0.0.0 node server.js"]
