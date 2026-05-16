# Faktur Public API V2 — Design Spec

**Date** : 2026-05-16
**Status** : Approved (brainstorming validated)
**Author** : Dany
**Spec type** : Design document
**Related** : `apps/backend/database/migrations/0076_add_team_encryption_mode.ts`, OAuth 2.0 system (apps tierces, déjà en place)

---

## 1. Context & Motivation

Faktur expose actuellement deux surfaces d'auth :
- **Sessions web/mobile** via `auth_access_tokens` (consommées par le frontend Next.js).
- **OAuth 2.0 apps tierces** via `oauth_apps` + `oauth_tokens` + flow authorize/consent/token (pour les apps externes qui demandent accès au compte d'un user — type ZapierFaktur).

Il manque la troisième surface : **Personal API keys**. Un développeur (souvent l'owner de la team lui-même) veut scripter SON propre compte sans passer par un flow OAuth interactif — comme Stripe `sk_live_xxx`, GitHub PAT, Linear API keys.

Le présent spec décrit la conception complète d'une API publique V2 :
- API keys team-owned, scoped `resource:action`
- Préfixe d'URL `/api/v2/` sur `api.fakturapp.cc`
- Webhooks signés HMAC vers une URL configurable par clé
- Doc dev portal séparée sur `developers.fakturapp.cc`
- Compatibilité stricte avec les modes de chiffrement existants (Privé / Standard)

## 2. Goals & Non-goals

### Goals
- Permettre à un développeur d'automatiser son compte Faktur via une clé Bearer simple.
- Réutiliser au maximum l'infrastructure existante (services, validators, encryption middleware).
- Versioning explicite par URL path, migration future sans cassure.
- Documentation auto-générée depuis le code (zéro drift code/doc).
- Webhooks bidirectionnels avec retry et signature HMAC.

### Non-goals (V1)
- Pas de sandbox / environnement de test distinct (reporté V2.1).
- Pas de SDKs livrés (reporté V1.1 — TS d'abord, puis Python/PHP).
- Pas de CLI `fkr` (reporté V1.1).
- Pas d'accès API pour les teams en Mode Privé (par design — voir §4).
- Pas de revente / facturation à l'usage de l'API en V1 (rate limit fixe, hookable au plan plus tard).

## 3. Décisions cadrées

| Décision | Choix |
|---|---|
| Crypto compatibility | API keys **uniquement Mode Standard** |
| Scope granularity | `resource:action` (invoices:read, …) + wildcards `*:*` et `*` |
| Key ownership | **Team-owned** (créée par admin, survit au départ d'un user) |
| Webhooks | **Inclus en V1** (1 URL par clé, HMAC SHA-256) |
| Versioning | **URL path** `/api/v2/` (préfixe fixe, indépendant de `API_PREFIX` env) |
| Storage | **Nouvelle table `api_keys`** (séparée de `auth_access_tokens` et `oauth_tokens`) |
| Key format | `fk_live_<32 chars base64url>` (Stripe-style, secret scanning friendly) |
| Auth middleware | Nouveau `api_key_middleware` (SHA-256 hash lookup, ctx injection) |
| Domain | `api.fakturapp.cc` (même que l'app interne, préfixe distinct) |
| Doc portal | `developers.fakturapp.cc` (Scalar, OpenAPI-driven, dans `apps/docs/`) |

## 4. Architecture

### 4.1 Flow d'une requête API V2

```
Developer
  │  curl -H "Authorization: Bearer fk_live_..." https://api.fakturapp.cc/api/v2/invoices
  ▼
AdonisJS Router (prefix /api/v2 — fixe, non-env-driven)
  │
  ▼
api_key_middleware
  │  - parse Bearer, hash SHA-256, lookup api_keys
  │  - check not revoked, not expired
  │  - check team.encryption_mode === 'standard' (else 403 team_mode_private)
  │  - check IP allowlist if defined
  │  - inject ctx.apiKey, ctx.user (impersonate created_by_user_id ou tech user team)
  │  - load team_encryption_service → ctx.dek
  ▼
api_scope_middleware
  │  - read required scope from route metadata
  │  - check key.scopes includes required scope OR wildcard
  │  - else 403 insufficient_scope
  ▼
api_rate_limit_middleware
  │  - sliding window 1m + 1h (Redis ou rate_limits table)
  │  - inject headers X-RateLimit-Limit/Remaining/Reset
  │  - else 429 rate_limited
  ▼
Controller V2 (apps/backend/app/controllers/api_v2/<resource>/<action>.ts)
  │  - utilise les MÊMES services que les controllers internes
  │  - field_encryption_helper, pdf_generator, invoice_service, etc.
  │  - shape la response au format V2 standardisé
  ▼
Response { "data": ... } + X-Request-Id + X-RateLimit-*
  │
  ▼ (async, après response rendue)
WebhookEventEmitter.emit('invoice.created', team, payload)
  │
  ▼
Pour chaque api_key de la team subscribée à cet event :
  - insert api_webhook_deliveries (status='pending')
  - BullMQ worker POST → URL dev avec X-Faktur-Signature
  - retry exponentiel sur échec (8 tentatives sur 24h)
```

### 4.2 Distinction des trois systèmes d'auth

| Système | Use case | Stockage | Auth header |
|---|---|---|---|
| Session web/mobile | Frontend Next.js, app Tauri | `auth_access_tokens` | `Authorization: Bearer oat_...` |
| OAuth 2.0 (apps tierces) | App externe qui demande accès à un user (Zapier, Make) | `oauth_tokens` | `Authorization: Bearer <opaque>` (post-exchange) |
| **API key (V2)** | Dev qui scripte SON compte | **`api_keys`** | `Authorization: Bearer fk_live_...` |

Les trois sont strictement disjoints. Le middleware `api_key_middleware` ne touche pas aux deux autres tables.

## 5. Data model

### 5.1 Migrations

**`0079_create_api_keys_table.ts`**

```ts
this.schema.createTable('api_keys', (t) => {
  t.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
  t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
  t.uuid('created_by_user_id').notNullable().references('id').inTable('users').onDelete('SET NULL').nullable()
  t.string('name', 100).notNullable()
  t.string('prefix', 16).notNullable().defaultTo('fk_live_')
  t.string('last_4', 4).notNullable()
  t.string('hash', 64).notNullable().unique() // SHA-256 hex
  t.specificType('scopes', 'text[]').notNullable()
  t.string('rate_limit_tier', 32).notNullable().defaultTo('default')
  t.specificType('allowed_ips', 'text[]').nullable() // CIDR
  t.timestamp('expires_at').nullable()
  t.timestamp('last_used_at').nullable()
  t.string('last_ip', 45).nullable()
  t.bigInteger('usage_count').notNullable().defaultTo(0)
  t.timestamp('revoked_at').nullable()
  t.string('revoked_reason', 100).nullable()
  t.timestamp('created_at').notNullable()
  t.timestamp('updated_at').nullable()

  t.index(['hash'], 'idx_api_keys_hash')
  t.index(['team_id'], 'idx_api_keys_team_id')
  t.index(['revoked_at'], 'idx_api_keys_revoked_at')
})
```

**`0080_create_api_key_webhooks_table.ts`**

```ts
this.schema.createTable('api_key_webhooks', (t) => {
  t.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
  t.uuid('api_key_id').notNullable().references('id').inTable('api_keys').onDelete('CASCADE').unique() // 1-1
  t.string('url', 500).notNullable()
  t.string('secret_hash', 128).notNullable() // hash du whsec_...
  t.string('secret_last_4', 4).notNullable()
  t.specificType('events', 'text[]').notNullable()
  t.boolean('is_active').notNullable().defaultTo(true)
  t.timestamp('last_delivery_at').nullable()
  t.string('last_delivery_status', 32).nullable()
  t.integer('consecutive_failures').notNullable().defaultTo(0)
  t.timestamp('created_at').notNullable()
  t.timestamp('updated_at').nullable()
})
```

**`0081_create_api_webhook_deliveries_table.ts`**

```ts
this.schema.createTable('api_webhook_deliveries', (t) => {
  t.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
  t.uuid('api_key_id').notNullable().references('id').inTable('api_keys').onDelete('CASCADE')
  t.string('event_type', 100).notNullable()
  t.string('event_id', 64).notNullable().unique()
  t.string('url', 500).notNullable()
  t.text('encrypted_payload').notNullable() // chiffré server-side, jamais brut en DB
  t.string('status', 20).notNullable().defaultTo('pending') // pending|delivered|failed|failed_permanent
  t.integer('attempt_count').notNullable().defaultTo(0)
  t.integer('last_status_code').nullable()
  t.text('last_error').nullable()
  t.timestamp('delivered_at').nullable()
  t.timestamp('next_attempt_at').nullable()
  t.timestamp('created_at').notNullable()
  t.timestamp('updated_at').nullable()

  t.index(['api_key_id'], 'idx_api_webhooks_key_id')
  t.index(['status', 'next_attempt_at'], 'idx_api_webhooks_pending')
  t.index(['event_type'], 'idx_api_webhooks_event_type')
})
```

**`0082_create_api_request_logs_table.ts`**

```ts
this.schema.createTable('api_request_logs', (t) => {
  t.bigIncrements('id')
  t.uuid('api_key_id').notNullable().references('id').inTable('api_keys').onDelete('CASCADE')
  t.string('method', 10).notNullable()
  t.string('path', 500).notNullable()
  t.integer('status').notNullable()
  t.integer('latency_ms').notNullable()
  t.string('ip', 45).notNullable()
  t.string('request_id', 64).notNullable()
  t.timestamp('created_at').notNullable()

  t.index(['api_key_id', 'created_at'], 'idx_api_logs_key_time')
  t.index(['created_at'], 'idx_api_logs_time') // pour purge cron
})
```

**`0083_create_api_idempotency_keys_table.ts`**

```ts
this.schema.createTable('api_idempotency_keys', (t) => {
  t.string('key', 128).primary() // Faktur-Idempotency-Key
  t.uuid('api_key_id').notNullable().references('id').inTable('api_keys').onDelete('CASCADE')
  t.string('method', 10).notNullable()
  t.string('path', 500).notNullable()
  t.string('body_hash', 64).notNullable() // SHA-256 du body
  t.integer('response_status').notNullable()
  t.text('response_body').notNullable()
  t.timestamp('created_at').notNullable()
  t.timestamp('expires_at').notNullable() // created_at + 24h

  t.index(['expires_at'], 'idx_api_idempotency_expires')
})
```

### 5.2 Models Lucid

- `app/models/api/api_key.ts`
- `app/models/api/api_key_webhook.ts`
- `app/models/api/api_webhook_delivery.ts`
- `app/models/api/api_request_log.ts`
- `app/models/api/api_idempotency_key.ts`

## 6. Key format & lifecycle

### 6.1 Génération

```
fk_live_<32 chars base64url>  (alphabet : A-Z a-z 0-9 - _)
```

```ts
import crypto from 'node:crypto'
function generateApiKey(): { plaintext: string; hash: string; last_4: string } {
  const secret = crypto.randomBytes(24).toString('base64url').slice(0, 32)
  const plaintext = `fk_live_${secret}`
  const hash = crypto.createHash('sha256').update(plaintext).digest('hex')
  return { plaintext, hash, last_4: plaintext.slice(-4) }
}
```

- ~190 bits d'entropie (au-delà du seuil cryptographique).
- Hash SHA-256 stocké, **jamais** le plaintext.
- Comparaison hash = O(log n) avec index unique. Pas besoin de constant-time car secret à haute entropie.

### 6.2 Création (UX)

UI 3 steps :
1. Nom + expiration + IP allowlist (optionnel)
2. Permissions (ScopeSelector avec presets + custom)
3. Plaintext révélé **une seule fois** + bouton "copié" → terminer

Server endpoint : `POST /dashboard/settings/api-keys` (web app, pas l'API publique).
Response : `{ id, plaintext, prefix, last_4, scopes, expires_at, created_at }`.
Le plaintext n'est jamais renvoyé après.

### 6.3 Rotation

`POST /dashboard/settings/api-keys/:id/rotate` :
- Génère nouvelle clé (nouveau hash, nouveau last_4)
- L'ancienne reste active 24h avec `revoked_at = NULL` mais flag `rotating_to_id`
- Après 24h, l'ancienne est revoked automatiquement (cron)
- Permet aux intégrations de migrer sans downtime

### 6.4 Révocation

`DELETE /dashboard/settings/api-keys/:id` :
- `revoked_at = now`, `revoked_reason = 'manual'`
- Confirmation typing-confirm dans l'UI
- Webhooks pending de la clé restent en queue (pas annulés)

### 6.5 Auto-révocation (sécurité)

Une clé est auto-révoquée si :
- Team passe en Mode Privé (cas défensif, normalement impossible vu le plan crypto)
- Plus de N (=50) erreurs 401 sur la clé en 1h (signal de compromission)
- Détectée par GitHub Secret Scanning (callback Anthropic-style)
- L'owner clique "Suspect activity" dans le dashboard

## 7. Scopes — catalogue complet

### 7.1 Liste exhaustive

| Resource | Scopes |
|---|---|
| invoices | `invoices:read`, `invoices:write`, `invoices:delete`, `invoices:send` |
| quotes | `quotes:read`, `quotes:write`, `quotes:delete`, `quotes:send` |
| credit_notes | `credit_notes:read`, `credit_notes:write`, `credit_notes:delete`, `credit_notes:send` |
| recurring_invoices | `recurring_invoices:read`, `recurring_invoices:write`, `recurring_invoices:delete` |
| clients | `clients:read`, `clients:write`, `clients:delete` |
| products | `products:read`, `products:write`, `products:delete` |
| expenses | `expenses:read`, `expenses:write`, `expenses:delete` |
| reminders | `reminders:read`, `reminders:write`, `reminders:delete`, `reminders:send` |
| payment_links | `payment_links:read`, `payment_links:write`, `payment_links:delete` |
| bank_accounts | `bank_accounts:read`, `bank_accounts:write`, `bank_accounts:delete` |
| company | `company:read`, `company:write` |
| team | `team:read` |
| email | `email:send` |
| einvoicing | `einvoicing:read`, `einvoicing:submit` |
| webhooks | `webhooks:manage` |
| files | `files:read` |
| ai (V1.1) | `ai:use` |

### 7.2 Wildcards

- `<resource>:*` = toutes actions sur la ressource
- `*` = toutes actions sur toutes les ressources (équivalent superadmin de la clé)

Règles UI :
- Au moins 1 scope obligatoire
- `*` exclusif (pas combinable)
- `<resource>:*` exclusif au sein de la ressource

### 7.3 Presets

| Preset | Scopes inclus |
|---|---|
| Lecture seule | tous les `*:read` |
| Lecture + écriture | tous les `*:read` + `*:write` (sans delete, sans send) |
| Accès complet | tous les scopes (équivalent `*`) |
| Personnalisé | cases à cocher détaillées |

## 8. Routes API V2 — surface complète

### 8.1 Conventions globales

- **Base URL** : `https://api.fakturapp.cc/api/v2`
- **Auth header** : `Authorization: Bearer fk_live_<token>`
- **Content-Type** : `application/json` (sauf upload multipart, sauf téléchargement PDF)
- **Idempotency** : `Faktur-Idempotency-Key: <uuid>` optionnel sur POST
- **Format response** :
  - succès single : `{ "data": { ... } }`
  - succès list : `{ "data": [...], "pagination": { ... } }`
  - erreur : `{ "error": { "code", "message", "request_id", "doc_url", "details": [...] } }`
- **IDs publics** : préfixés par type (`inv_`, `clt_`, `prd_`, `qot_`, `cn_`, `exp_`, `pmt_`, `rmd_`, `pkl_`, `bnk_`)
- **Dates** : ISO 8601 UTC (`2026-05-16T14:32:11Z`)
- **Pagination** : cursor-based (`?limit=50&cursor=...`)
- **Filtres** : `?status=paid,sent`, `?client_id=clt_xxx`, `?created_after=...`, `?q=...`, `?sort=-created_at`

### 8.2 Mapping des endpoints

**Invoices**
- `GET /v2/invoices` — list (scope `invoices:read`)
- `GET /v2/invoices/:id` — show (`invoices:read`)
- `GET /v2/invoices/:id/pdf` — download PDF (`invoices:read` + `files:read`)
- `POST /v2/invoices` — create draft (`invoices:write`)
- `PATCH /v2/invoices/:id` — update draft (`invoices:write`, refus si status ≠ draft)
- `POST /v2/invoices/:id/duplicate` — duplicate (`invoices:write`)
- `POST /v2/invoices/:id/mark-paid` — mark paid (`invoices:write`)
- `POST /v2/invoices/:id/mark-unpaid` — annule payment (`invoices:write`)
- `POST /v2/invoices/:id/send` — send email (`invoices:send` + `email:send`)
- `DELETE /v2/invoices/:id` — delete draft (`invoices:delete`, refus si status ≠ draft)

**Quotes**
- `GET /v2/quotes`, `GET /v2/quotes/:id`, `GET /v2/quotes/:id/pdf`
- `POST /v2/quotes`, `PATCH /v2/quotes/:id`, `DELETE /v2/quotes/:id`
- `POST /v2/quotes/:id/send`, `POST /v2/quotes/:id/accept`, `POST /v2/quotes/:id/reject`
- `POST /v2/quotes/:id/convert-to-invoice`

**Credit notes**
- `GET /v2/credit-notes`, `GET /v2/credit-notes/:id`, `GET /v2/credit-notes/:id/pdf`
- `POST /v2/credit-notes` (body inclut `invoice_id` requis)
- `PATCH /v2/credit-notes/:id`, `DELETE /v2/credit-notes/:id`
- `POST /v2/credit-notes/:id/send`

**Recurring invoices**
- `GET /v2/recurring-invoices`, `GET /v2/recurring-invoices/:id`, `GET /v2/recurring-invoices/:id/upcoming`
- `POST /v2/recurring-invoices`, `PATCH /v2/recurring-invoices/:id`, `DELETE /v2/recurring-invoices/:id`
- `POST /v2/recurring-invoices/:id/pause`, `POST /v2/recurring-invoices/:id/resume`

**Clients**
- `GET /v2/clients` (filtres : `siren`, `email`, `q`)
- `GET /v2/clients/:id`, `POST /v2/clients`, `PATCH /v2/clients/:id`, `DELETE /v2/clients/:id`
- `GET /v2/clients/:id/contacts`, `POST /v2/clients/:id/contacts`
- `PATCH /v2/clients/:id/contacts/:cid`, `DELETE /v2/clients/:id/contacts/:cid`
- `POST /v2/clients/lookup-siren` (helper enrichissement SIRENE — public, pas de scope custom)

**Products**
- `GET /v2/products`, `GET /v2/products/:id`
- `POST /v2/products`, `PATCH /v2/products/:id`, `DELETE /v2/products/:id`

**Expenses**
- `GET /v2/expenses`, `GET /v2/expenses/:id`
- `POST /v2/expenses`, `PATCH /v2/expenses/:id`, `DELETE /v2/expenses/:id`
- `POST /v2/expenses/:id/upload-receipt` (multipart/form-data)

**Reminders**
- `GET /v2/reminders` (filtre `invoice_id`)
- `POST /v2/reminders`, `DELETE /v2/reminders/:id`
- `POST /v2/reminders/:id/send`

**Payment links**
- `GET /v2/payment-links`, `GET /v2/payment-links/:id`
- `POST /v2/payment-links` (body inclut `invoice_id`), `DELETE /v2/payment-links/:id`

**Bank accounts**
- `GET /v2/bank-accounts`, `GET /v2/bank-accounts/:id`
- `POST /v2/bank-accounts`, `PATCH /v2/bank-accounts/:id`, `DELETE /v2/bank-accounts/:id`

**Company**
- `GET /v2/company`, `PATCH /v2/company`
- `POST /v2/company/logo` (multipart), `DELETE /v2/company/logo`

**Team**
- `GET /v2/team`, `GET /v2/team/members` (lecture seule)

**Email**
- `POST /v2/emails` — envoi custom lié à une ressource (body : `resource_type`, `resource_id`, `to`, `subject`, `body`, `attach_pdf`)
- `GET /v2/emails/:id` — status
- `GET /v2/emails?resource_id=...` — historique

**E-invoicing**
- `POST /v2/einvoicing/submit` — soumettre une facture (body : `invoice_id`, `target: 'chorus_pro' | 'pdp'`)
- `GET /v2/einvoicing/submissions/:id` — status lifecycle
- `GET /v2/einvoicing/submissions?invoice_id=...`

**Files**
- `GET /v2/files/:id` — téléchargement signé, courte expiration

**Webhooks**
- `GET /v2/webhooks` — config actuelle de la clé courante
- `PUT /v2/webhooks` — set/update config (idempotent)
- `DELETE /v2/webhooks` — désactive
- `GET /v2/webhooks/deliveries?status=failed`
- `POST /v2/webhooks/deliveries/:id/retry`
- `POST /v2/webhooks/test` (body : `url`, `event_type`)

**AI (V1.1, optionnel)**
- `POST /v2/ai/suggest-invoice-lines`, `POST /v2/ai/generate-text`, `POST /v2/ai/chat-document`

## 9. Webhooks — design détaillé

### 9.1 Modèle

Une seule webhook config par API key (1-1 enforced par `UNIQUE` sur `api_key_id` dans `api_key_webhooks`).

### 9.2 Catalogue d'events V1

```
invoice.created, invoice.updated, invoice.sent, invoice.paid, invoice.partially_paid,
  invoice.overdue, invoice.deleted
quote.created, quote.updated, quote.sent, quote.accepted, quote.rejected, quote.expired,
  quote.converted
credit_note.created, credit_note.sent
client.created, client.updated, client.deleted
product.created, product.updated, product.deleted
expense.created, expense.updated, expense.deleted
recurring_invoice.generated
payment.received
reminder.sent
einvoicing.submitted, einvoicing.status_changed
```

### 9.3 Format payload

```json
{
  "id": "evt_...",
  "type": "invoice.paid",
  "created_at": "2026-05-16T14:32:11Z",
  "api_version": "v2",
  "team_id": "tm_...",
  "data": { ... },
  "previous_data": null
}
```

### 9.4 Signature HMAC

- Secret par webhook config : `whsec_<32 chars base64url>`, généré 1x à la config, hashé en DB.
- Header émis : `X-Faktur-Signature: t=<unix_ts>,v1=<hex>`
- `signed_payload = "<ts>.<raw_body>"`, `v1 = HMAC-SHA256(secret, signed_payload).hex()`
- Tolérance timestamp : ±5 minutes (anti-replay).

### 9.5 Headers de delivery

```
X-Faktur-Signature: t=...,v1=...
X-Faktur-Event-Id: evt_...
X-Faktur-Event-Type: invoice.paid
X-Faktur-Delivery: <attempt_number>
User-Agent: Faktur-Webhooks/2.0
Content-Type: application/json
```

### 9.6 Retry policy

```
Attempt 1 : immediate
Attempt 2 : +30s
Attempt 3 : +2m
Attempt 4 : +10m
Attempt 5 : +1h
Attempt 6 : +6h
Attempt 7 : +24h
Attempt 8+: abandon → status='failed_permanent'
```

- Considéré succès : 2xx (200-299)
- Timeout : 10s par tentative
- 5 réponses 410 Gone consécutives → désactivation auto + email

### 9.7 Replay manuel

`POST /v2/webhooks/deliveries/:id/retry` — renvoie même payload, même event_id (dédup côté dev).

### 9.8 Test endpoint

`POST /v2/webhooks/test { url, event_type }` — envoie une delivery `evt_test_...` sans toucher à la config. Renvoie le détail HTTP de la response du dev (status, body, latence).

## 10. Rate limiting & quotas

### 10.1 Algorithme

Sliding window log (Redis-backed). Deux fenêtres : `1m` et `1h`.

### 10.2 Tiers

```ts
const TIERS = {
  default:   { perMinute: 60,   perHour: 1000 },
  pro:       { perMinute: 120,  perHour: 5000 },
  business:  { perMinute: 300,  perHour: 20000 },
  unlimited: { perMinute: 1000, perHour: 100000 },
}
```

Tous les keys créées en V1 → `rate_limit_tier='default'`. Hookable au plan payant plus tard.

### 10.3 Headers (sur toutes les responses)

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: <unix_ts>
X-RateLimit-Policy: "60;w=60, 1000;w=3600"
```

### 10.4 Response 429

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 18
```
```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Try again in 18 seconds.",
    "details": { "limit": 60, "window": "1m", "reset_at": "..." }
  }
}
```

### 10.5 Quotas opérationnels mensuels (par team)

| Quota | Default |
|---|---|
| PDF générés via API | 5 000 / mois |
| Emails envoyés via API | 1 000 / mois |
| AI calls | Quota AI team existant |
| Webhook replays manuels | 200 / jour |

Dépassement → 429 `code='quota_exceeded'`, `details.quota_type='pdf_monthly'`.

### 10.6 Anti-abuse globale (pré-auth)

- 1 000 req/h par IP sur `/api/v2/*`
- 10 401 en 15min par IP → blocage 30min
- Tarpit léger sur 401 (100-300ms aléatoire)

## 11. UI dashboard

### 11.1 Arbo

```
/dashboard/settings/api-keys
/dashboard/settings/api-keys/new
/dashboard/settings/api-keys/[id]
/dashboard/settings/api-keys/[id]/webhook
/dashboard/settings/api-keys/[id]/logs
/dashboard/settings/api-keys/[id]/usage
```

### 11.2 État Mode Privé

Banner d'incompatibilité sur la liste, pas de bouton "Créer". Lien vers la modale de migration crypto (plan séparé).

### 11.3 Composants à créer

- `src/app/dashboard/settings/api-keys/page.tsx`
- `src/app/dashboard/settings/api-keys/new/page.tsx` (ou modal)
- `src/app/dashboard/settings/api-keys/[id]/page.tsx`
- `src/app/dashboard/settings/api-keys/[id]/webhook/page.tsx`
- `src/app/dashboard/settings/api-keys/[id]/logs/page.tsx`
- `src/app/dashboard/settings/api-keys/[id]/usage/page.tsx`
- `src/components/api-keys/CreateApiKeyModal.tsx`
- `src/components/api-keys/ScopeSelector.tsx`
- `src/components/api-keys/WebhookConfigForm.tsx`
- `src/components/api-keys/DeliveryLogTable.tsx`
- `src/components/api-keys/UsageCharts.tsx`

### 11.4 Sécurité UI

- Plaintext affiché 1x à la création + 1x à la rotation, jamais ailleurs.
- Partout ailleurs : `fk_live_...3u` (prefix + last_4).
- Révocation derrière typing-confirm.
- Rotation = 24h de grâce avec banner d'overlap.

## 12. Documentation dev portal

### 12.1 Stack

**Scalar self-hosted** dans `apps/docs/` (Next.js statique). Cohérent avec monorepo. OpenAPI-driven.

### 12.2 Domaine

`developers.fakturapp.cc` (séparé de l'app, indexable, pas d'auth).

### 12.3 Structure

```
/                            Landing
/quickstart                  Auth + premier appel
/concepts/authentication
/concepts/errors
/concepts/pagination
/concepts/filtering
/concepts/idempotency
/concepts/rate-limits
/concepts/webhooks
/concepts/encryption-modes
/resources/invoices          (depuis OpenAPI)
/resources/quotes
/resources/clients
...
/webhooks-events             Liste des events + exemples
/recipes/
  /sync-clients-from-crm
  /auto-create-invoices-from-stripe
  /weekly-revenue-report
  /factur-x-submission
  /reminder-automation
  /bulk-import-csv
/sdks                        À venir
/changelog                   Keep-a-Changelog format
/openapi.json
/llms.txt                    Pour AI agents
/llms-full.txt               Doc complète flat markdown
```

### 12.4 OpenAPI generation

- Source de vérité : code backend
- Décorateurs `@OpenApi.summary/.scope/.response()` sur chaque action
- VineJS schemas → JSON Schema (converter custom court)
- Lucid models → response schemas via décorateurs
- Build step : `node ace openapi:generate` → `apps/docs/public/openapi.json`
- CI : `node ace openapi:validate` casse le build si drift

### 12.5 Snippets multi-langage

Curl, JS (fetch + axios), Python (requests + httpx), PHP, Go, Ruby. Générés via templating depuis l'OpenAPI.

## 13. Error handling

### 13.1 Codes applicatifs

| Code | HTTP | Quand |
|---|---|---|
| `invalid_token` | 401 | Token absent / mal formé / hash inconnu |
| `token_expired` | 401 | expires_at dépassé |
| `token_revoked` | 401 | revoked_at non NULL |
| `ip_not_allowed` | 403 | IP hors allowed_ips |
| `insufficient_scope` | 403 | Scope manquant |
| `team_mode_private` | 403 | Team en Mode Privé |
| `team_inactive` | 403 | Team suspendue |
| `resource_not_found` | 404 | ID inconnu / autre team |
| `route_not_found` | 404 | Route inexistante |
| `method_not_allowed` | 405 | Verbe non supporté |
| `conflict` | 409 | État incompatible |
| `idempotency_replay` | 409 | Key réutilisée avec body différent |
| `validation_failed` | 422 | VineJS errors |
| `business_rule_violation` | 422 | Règle métier (delete invoice sent) |
| `rate_limited` | 429 | Window 1m/1h dépassé |
| `quota_exceeded` | 429 | Quota mensuel dépassé |
| `internal_error` | 500 | Bug serveur |
| `service_unavailable` | 503 | Maintenance, dependency down |

### 13.2 Structure response

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Some fields are invalid",
    "request_id": "req_...",
    "doc_url": "https://developers.fakturapp.cc/concepts/errors#validation_failed",
    "details": [{ "field": "...", "code": "...", "message": "..." }]
  }
}
```

### 13.3 Request ID

UUID injecté dans chaque response (header `X-Request-Id`) et dans `api_request_logs` + logs serveur Pino. Permet support efficace.

## 14. Observabilité

### 14.1 Metrics

- `api_v2_requests_total{path,method,status,team_tier}` (counter)
- `api_v2_request_duration_seconds{path,method}` (histogram)
- `api_v2_webhook_deliveries_total{event_type,status}` (counter)
- `api_v2_webhook_delivery_duration_seconds` (histogram)
- `api_v2_active_keys` (gauge)

### 14.2 Logs

Pino JSON structurés : `request_id`, `api_key_id`, `team_id`, `route`, `latency`, `status`.

### 14.3 Alertes

- 5xx >2% sur 5min → notify owner
- Échec webhook >50% pour une team → email à la team
- Latence p95 >1s sur 10min → notify owner

## 15. Testing

### 15.1 Unit tests

- `api_key_service.spec.ts`
- `webhook_signer.spec.ts`
- `webhook_dispatcher.spec.ts`
- `api_scope_middleware.spec.ts`

### 15.2 Functional tests (`apps/backend/tests/functional/api_v2/`)

- `auth.spec.ts`
- `invoices_crud.spec.ts`
- `invoices_send.spec.ts` (+ webhook enqueued)
- `quotes_lifecycle.spec.ts`
- `idempotency.spec.ts`
- `rate_limit.spec.ts`
- `webhooks_delivery.spec.ts`
- `pagination.spec.ts`

### 15.3 Contract tests

Prism (OpenAPI lib) vérifie chaque endpoint contre la spec en CI.

## 16. Rollout

### 16.1 Phases

**Phase 1 — Internal alpha** (2 semaines) : feature flag `api_v2_enabled`, owner + 2-3 testeurs internes.
**Phase 2 — Closed beta** (4 semaines) : 10-20 power users sur whitelist, banner feedback.
**Phase 3 — GA** : flag retiré, annonce publique, doc indexée.

### 16.2 Sécurité backwards-compat

Aucune route existante touchée. Préfixe `/api/v2/` strictement séparé. Services réutilisés tels quels.

### 16.3 Risques

| Risque | Mitigation |
|---|---|
| Mode Privé majoritaire → adoption faible | Marketing pro-Standard |
| Webhook URL down permanent | Désactivation auto après 5×410 |
| Clé fuite GitHub | Secret scanning partner + revoke + email |
| Surcharge PDF/email infra | Quotas mensuels par team |
| Drift code/doc OpenAPI | Tests Prism CI bloquants |
| Migration v2 → v3 future | URL path + déprécation échelonnée 12 mois |

## 17. Découpage en lots livrables

**Lot 1 — Infra & auth** (~1 semaine)
Migrations + models + services + middlewares + route placeholder `/api/v2/ping` + tests auth.

**Lot 2 — UI dashboard API keys** (~1 semaine)
Pages settings, ScopeSelector, locales, tests frontend.

**Lot 3 — Resources batch 1 (invoices + clients + products)** (~1 semaine)
Routes + controllers + validators + tests + doc Scalar.

**Lot 4 — Resources batch 2 (quotes + credit_notes + recurring + reminders + payment_links + bank_accounts + company + team + expenses + files)** (~2 semaines, parallélisable)
Le gros morceau.

**Lot 5 — Email + e-invoicing** (~3 jours)
`POST /emails`, `POST /einvoicing/submit` + status.

**Lot 6 — Webhooks** (~1 semaine)
WebhookEventEmitter, intégration dans controllers V2, worker BullMQ, page config UI, test endpoint, deliveries log UI.

**Lot 7 — Documentation portal** (~1 semaine)
`apps/docs/` Scalar, OpenAPI generator ace command, quickstart, 6 recipes, concepts.

**Lot 8 — Observabilité + rollout alpha** (~3 jours)
Metrics, logs, alertes, feature flag, banner beta.

**Total** : ~7-8 semaines linéaires, ~5-6 semaines avec parallélisation (lots 3 et 4).

## 18. Hors scope V1 (reportés)

- Sandbox / environnement de test (préfixe `fk_test_`)
- SDKs : TS d'abord, puis Python, PHP
- CLI `fkr` (Node, OAuth device flow ou `--api-key`)
- AI endpoints publics (`/v2/ai/*`)
- Marketplace d'intégrations (Zapier, Make, n8n templates)
- API key analytics avancées (heatmap par endpoint, retention)
- Multi-webhook par clé (si demande, V1.1)

## 19. Annexe — Conventions de naming

- Tables : `api_*` (api_keys, api_key_webhooks, etc.)
- Models : `app/models/api/*.ts`
- Controllers : `app/controllers/api_v2/<resource>/<action>.ts`
- Routes : `start/routes/api_v2/<resource>.ts`
- Middlewares : `app/middleware/api_v2/*.ts`
- Services : `app/services/api/*.ts`
- Validators : `app/validators/api_v2/<resource>_validators.ts`
- Tests : `tests/functional/api_v2/*.spec.ts`
- Frontend pages : `src/app/dashboard/settings/api-keys/...`
- Frontend components : `src/components/api-keys/*.tsx`

## 20. Annexe — IDs publics, mapping interne

Chaque ressource exposée par l'API a un préfixe d'ID public distinct du UUID interne :

| Resource | Prefix |
|---|---|
| Invoice | `inv_` |
| Quote | `qot_` |
| Credit note | `cn_` |
| Recurring invoice | `rec_` |
| Client | `clt_` |
| Client contact | `cct_` |
| Product | `prd_` |
| Expense | `exp_` |
| Reminder | `rmd_` |
| Payment link | `pkl_` |
| Bank account | `bnk_` |
| Email delivery | `eml_` |
| E-invoicing submission | `eis_` |
| File | `fil_` |
| Event (webhook) | `evt_` |
| Request | `req_` |
| API key | `apk_` |
| Webhook delivery | `whd_` |

Le controller V2 strip le préfixe avant de query la DB (UUID dans `id`). À l'output, il préfixe l'UUID. Pas de double table de mapping nécessaire.
