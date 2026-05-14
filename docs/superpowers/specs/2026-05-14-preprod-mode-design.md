# Preprod environment mode — design

**Date:** 2026-05-14
**Status:** Approved

## Problem

There is a preprod server that points at the real production database. Anyone
using it can unknowingly mutate live data. We need:

1. A toggle to mark an instance as preprod.
2. A separate toggle to lock an instance down to admins only.
3. A permanent, unmissable PREPROD warning on every page that, when clicked,
   explains the danger (real DB, real data loss).

## Decisions

- **Two independent flags** (option B): `APP_ENV` and `ADMIN_ONLY` can be mixed
  freely. Preprod does not imply admin-only and vice versa.
- **Admin-only covers everything that requires auth**, not just the dashboard.
- **Banner:** bottom bar, on every page (public + authed), high z-index.
- **Env wiring:** frontend has its own `NEXT_PUBLIC_*` vars (no extra request).
  Backend keeps its own vars for real enforcement.
- **Admin-only UX:** non-admins still log in normally, then get redirected to a
  single `/restricted` notice page; all other authed routes are blocked.

## Environment variables

| Var | Where | Values | Purpose |
|-----|-------|--------|---------|
| `APP_ENV` | backend `.env` | `development` \| `preprod` \| `production` | informational |
| `ADMIN_ONLY` | backend `.env` | `true` \| `false` | real enforcement |
| `NEXT_PUBLIC_APP_ENV` | frontend `.env` | same as above | drives the banner |
| `NEXT_PUBLIC_ADMIN_ONLY` | frontend `.env` | `true` \| `false` | drives the redirect |

## Backend

- `start/env.ts`: add `APP_ENV` (optional enum) and `ADMIN_ONLY` (optional boolean).
- `.env.example` + `.env`: document and set the new vars.
- New helper `app/services/auth/is_admin.ts`: parses `ADMIN_EMAILS`, exposes
  `isAdminEmail(email)`. Replaces the duplicated parsing in `me.ts` and
  `admin_middleware.ts`.
- `app/middleware/auth/auth_middleware.ts`: after `authenticateUsing`, if
  `ADMIN_ONLY` is true and the user is not an admin, reject with
  `403 { code: 'INSTANCE_ADMIN_ONLY' }` — unless the request path ends with
  `/auth/me` or `/auth/logout` (allowlist so the frontend can identify the user
  and sign out).

## Frontend

- `apps/frontend/.env`: add `NEXT_PUBLIC_APP_ENV=development`,
  `NEXT_PUBLIC_ADMIN_ONLY=false`.
- `src/lib/app-env.ts`: exports `APP_ENV`, `IS_PREPROD`, `IS_ADMIN_ONLY`.
- `src/components/layout/preprod-banner.tsx` (`'use client'`): renders nothing
  unless `IS_PREPROD`. Fixed bottom strip, `z-[9999]`, amber warning style,
  whole bar is a button → opens a `Dialog`. Modal copy: this is a preprod
  environment **connected to the real production database**; anything done here
  can affect the live site and cause real, unrecoverable data loss; do not use
  it as a normal app.
- `src/app/layout.tsx`: mount `<PreprodBanner />` in `<body>` so it shows on
  every page.
- `src/app/restricted/page.tsx`: notice page — "Instance privée, accès réservé
  aux administrateurs" with a logout button. Lives outside `/dashboard` so the
  dashboard layout redirect doesn't loop.
- `src/app/dashboard/layout.tsx`: once `user` is loaded, if `IS_ADMIN_ONLY` and
  `!user.isAdmin`, `router.replace('/restricted')`.

## Out of scope

- Per-route backend allowlist beyond `/auth/me` and `/auth/logout`.
- Syncing backend and frontend env vars automatically.
