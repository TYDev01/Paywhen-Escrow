# Escrow Platform

A mobile-first escrow platform for secure buyer/seller transactions. Payment is held
until the agreed conditions are met, with buyer and seller protection, a dispute process,
and a double-entry financial ledger.

> **Status: foundation / in development.** Live money movement is **disabled** by default.
> No approved payment provider or fund-safeguarding arrangement is configured, so funding,
> payouts and refunds are intentionally unavailable and the UI shows a truthful
> "configuration required" state. There is **no mock data** — every figure shown comes
> from a real persisted action or a real integration.

## Monorepo layout

```
escrow/
├── packages/core/     # Financial & domain logic (money, fees, state machine, ledger, RBAC) + tests
├── apps/api/          # NestJS backend (auth, agreements, transactions, ledger, payments boundary)
├── apps/web/          # Next.js App Router frontend (marketing site, auth, dashboard)
├── docker-compose.yml # Postgres + Redis for local development
└── turbo.json         # Task orchestration
```

### Why `packages/core`
The code that must be correct above everything else — currency arithmetic, fee
calculation, the transaction state machine, double-entry ledger rules, and permission
checks — lives in one dependency-light, fully unit-tested package shared by the API (and
usable by the web app). Money is always integer **minor units** (`bigint`); floating point
is never used for monetary values.

## Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Docker (for Postgres + Redis)

## Getting started

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.example .env
cp .env.example apps/api/.env      # the API reads its own .env
#   Generate real secrets: openssl rand -base64 48  → JWT_ACCESS_SECRET / JWT_REFRESH_SECRET

# 3. Start infrastructure
pnpm infra:up                      # docker compose up -d (Postgres + Redis)

# 4. Database schema
pnpm --filter @escrow/api migrate:dev    # creates the schema via Prisma migrations

# 5. Build the shared core (the API imports its compiled output)
pnpm --filter @escrow/core build

# 6. Run
pnpm --filter @escrow/api dev      # API on http://localhost:4000/api  (docs at /api/docs)
pnpm --filter @escrow/web dev      # Web on http://localhost:3000
```

## Tests

```bash
pnpm --filter @escrow/core test    # currency, fees, state machine, ledger, RBAC
```

The core test suite covers the financially-critical rules: currency-safe arithmetic and
rounding, fee breakdowns, legal/illegal state transitions (including blocking client-driven
funding), ledger balancing, and permission checks.

## What is implemented

**Foundations**
- pnpm + Turborepo monorepo, strict TypeScript, shared tsconfig.
- Env validation that refuses to boot on bad config and rejects default secrets in prod.
- Docker Compose for Postgres + Redis.

**Domain core (tested)**
- Integer-minor-unit money with safe add/subtract/multiply, basis-point fees, half-up
  rounding, and remainder-preserving allocation.
- Transaction state machine with explicit legal transitions; funding/release/refund
  transitions are flagged system-only so a raw client request can never trigger them.
- Double-entry ledger rules (balanced per currency, positive postings, signed effects).
- Role/permission model (buyer, seller, admin, support, dispute agent, compliance).

**Backend (NestJS)**
- Auth: registration, login, refresh-token rotation, logout; Argon2 password hashing;
  refresh tokens stored only as hashes.
- Server-side authorization: global JWT guard (roles re-loaded from DB, never trusted from
  the token) + permissions guard + rate limiting + Helmet + validation pipe.
- Agreements: creation with immutable versioned terms + content hash, dual acceptance,
  non-guessable references.
- Transactions: dashboard listing (real records only), detail with state history,
  optimistic-concurrency transitions, and a funding endpoint that returns a truthful
  503 "payments not configured" instead of simulating money movement.
- Ledger service: balanced, idempotent journal posting; balances derived from postings.
- Payments integration boundary: `PaymentProvider` interface + honest `NoneProvider`;
  `/payments/capabilities` reports real status.
- OpenAPI docs at `/api/docs`.

**Frontend (Next.js)**
- Design-token system (light/dark), Inter + Space Grotesk, accessible focus states,
  `prefers-reduced-motion` support, skip link.
- Marketing site: homepage (hero, buyer/seller protection, interactive escrow steps,
  transparent fees, security, FAQ, CTA) plus How it works, For buyers, For sellers,
  Pricing, Security, FAQ, Contact, and all legal pages — each legal page flagged as
  requiring professional review.
- Truthful payment-status banner driven by the real backend capabilities endpoint.
- Auth (register/login) and an authenticated dashboard with real empty states, status
  filters, create-escrow form, transaction detail, activity history, accept/fund actions.

## What is intentionally NOT done (and why)
Per the project's non-negotiable rules, the following are left as clearly-marked
integration boundaries rather than faked:
- **Live payments / payouts / refunds** — require an approved, regulated payment partner
  and a legally-permitted fund-safeguarding arrangement. Disabled until configured.
- **KYC / identity verification** — requires a provider chosen for the confirmed
  jurisdiction. Verification state defaults to a truthful `UNVERIFIED`.
- **Email / SMS / push delivery, object storage, malware scanning** — integration points
  exist in the schema and config; wire real providers before enabling.
- **Legal content** — provisional drafts only; must be reviewed by a qualified
  professional for the operating jurisdiction before launch.

## Remaining roadmap (spec phases 4–6)
Delivery evidence uploads, disputes UI + admin resolution, notifications jobs (BullMQ),
WebSocket transaction messaging, the admin dashboard, reconciliation reports, E2E tests
against provider sandboxes, and CI/CD. The schema and module boundaries for these already
exist; they are built out as the corresponding integrations are approved.

## Security notes
- Authorization is always enforced server-side; frontend role checks are cosmetic.
- No payment secrets or tokens are exposed to the client.
- Monetary math never uses floating point.
- Money only moves on verified backend/provider events, never on a browser redirect.
# Paywhen-Escrow
