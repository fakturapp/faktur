# ==============================================================================
# Faktur - Multi-stage Docker build (Backend + Frontend)
# For Dokploy deployment
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
WORKDIR /app/apps/backend/build
RUN npm ci --omit=dev

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
# Stage 5: Production backend
# ------------------------------------------------------------------------------
FROM node:24-alpine AS backend
RUN apk add --no-cache libc6-compat chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build-backend /app/apps/backend/build/ ./
EXPOSE 3333
CMD ["sh", "-c", "node ace migration:run --force && node bin/server.js"]

# ------------------------------------------------------------------------------
# Stage 6: Production frontend
# ------------------------------------------------------------------------------
FROM node:24-alpine AS frontend
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build-frontend /app/apps/frontend/.next/standalone/ ./
COPY --from=build-frontend /app/apps/frontend/.next/static ./.next/static
COPY --from=build-frontend /app/apps/frontend/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
