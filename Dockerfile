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
# Stage 5: Production (combined backend + frontend with turbo)
# ------------------------------------------------------------------------------
FROM base AS production

# Root monorepo config for turbo
COPY package.json turbo.json ./

# Install turbo globally
RUN npm install -g turbo

# -- Backend --
COPY --from=build-backend /app/apps/backend/build/ ./apps/backend/
COPY package-lock.json /tmp/package-lock.json
RUN cp /tmp/package-lock.json apps/backend/ \
    && cd apps/backend \
    && npm ci --omit=dev \
    && rm package-lock.json

# -- Frontend (standalone) --
# Copy standalone output — in monorepo it preserves apps/frontend/ structure
COPY --from=build-frontend /app/apps/frontend/.next/standalone/ ./standalone-tmp/
RUN mkdir -p apps/frontend/.next \
    && cp -r standalone-tmp/apps/frontend/* apps/frontend/ \
    && cp -r standalone-tmp/node_modules apps/frontend/node_modules 2>/dev/null || true \
    && rm -rf standalone-tmp
COPY --from=build-frontend /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build-frontend /app/apps/frontend/public ./apps/frontend/public

# Frontend package.json with start script for turbo
RUN printf '{"name":"@faktur/frontend","private":true,"scripts":{"start":"HOSTNAME=0.0.0.0 PORT=3000 node server.js"}}\n' > apps/frontend/package.json

EXPOSE 3333 3000
CMD ["sh", "-c", "cd /app/apps/backend && node ace migration:run --force && cd /app && turbo start"]
