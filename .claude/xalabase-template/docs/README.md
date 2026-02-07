# XalaBaaS Documentation

XalaBaaS is a multi-tenant Backend-as-a-Service platform built on [Convex](https://convex.dev/) with a feature-first monorepo architecture. It provides tenant isolation, RBAC, booking/resource management, billing, and compliance capabilities consumed by **5 React applications** through a shared SDK.

The platform comprises **18 isolated Convex components**, **23 feature modules** (the single source of truth for all domain logic), and a layered re-export system that keeps each layer thin and replaceable.

## At a Glance

| Metric | Count |
|--------|-------|
| React Applications | 5 (web, backoffice, minside, saas-admin, dashboard) |
| Convex Components | 18 (isolated, plug-and-play) |
| Feature Modules | 23 (+ 1 shared infrastructure module) |
| Shared Packages | 8 (sdk, shared, app-shell, ds, ds-themes, ds-registry, i18n, eslint-config) |
| Core Tables | 9 (tenants, users, orgs, tenantUsers, custodyGrants, custodySubgrants, outboxEvents, componentRegistry, rateLimits) |
| SDK Hooks | ~35 re-export files |
| Domain Facades | 25 files |
| Supported Locales | 3 (nb, en, ar) |

## Table of Contents

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** -- Core architecture overview
  - System overview and design principles
  - Layered architecture (Experience Plane, SDK Layer, Feature Layer, Control Plane)
  - Full import chain with path examples
  - Re-export convention
  - Facade pattern (ID conversion, data enrichment, audit logging)
  - Component isolation and the `v.string()` rule
  - Event bus (outbox pattern)
  - Two-tier gating (module registry + feature flags)

- **[REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)** -- Full directory tree and explanation
  - Complete annotated directory tree (3 levels deep)
  - File counts per directory
  - Identification of real logic vs. re-export files
  - Feature module internal structure
  - Package and app breakdowns

- **[FEATURES.md](./FEATURES.md)** -- Feature module reference
  - All 23 feature modules documented
  - Types, hooks, Convex functions, and contracts for each domain

- **[SDK.md](./SDK.md)** -- SDK reference
  - SDK architecture and hook patterns
  - Convex provider setup
  - Compatibility layer documentation

- **[APPS.md](./APPS.md)** -- Application reference
  - Thin app pattern and provider composition
  - Per-app configuration and routes
  - Design system mapping

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (not npm or yarn)
- A Convex account or self-hosted Convex instance

### Development Setup

```bash
# 1. Install all dependencies
pnpm install

# 2. Start the Convex dev server (watches schema, functions, and components)
npx convex dev

# 3. Seed the database with test data
npx convex run seeds:seedAll
npx convex run seedComponents:seedAll

# 4. Start one or more apps (in separate terminals)
pnpm dev:web            # Public booking platform (port 5190)
pnpm dev:backoffice     # Admin management (port 5175)
pnpm dev:minside        # User "My Pages" (port 5174)

# Or start everything at once
pnpm dev:all
```

### Common Commands

```bash
# Testing
pnpm sdk:test                   # SDK unit tests (vitest, jsdom)
pnpm test:convex                # Convex function tests (vitest, node)
pnpm test:convex:e2e:all        # E2E backend tests
pnpm test:e2e                   # Playwright browser E2E tests
pnpm test:all                   # Full suite

# Type checking and linting
pnpm typecheck                  # All workspaces
pnpm lint                       # All workspaces

# Seeding
npx convex run seeds:seedAll    # Core tables (tenants, users, resources)
npx convex run seedComponents:seedAll  # Component tables (reviews, notifications, registry)
npx convex run seeds:resetAll   # Reset core data
```

### Key Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
CONVEX_DEPLOYMENT=...           # Your Convex deployment URL
VITE_CONVEX_URL=...             # Client-side Convex URL
```

## Related Documentation

Additional reference documents exist alongside the codebase:

| Document | Location | Purpose |
|----------|----------|---------|
| CLAUDE.md | `/CLAUDE.md` | AI coding agent instructions, full architecture reference |
| Domain Facades | `convex/domain/DOMAIN.md` | Domain facade mapping and patterns |
| Design System | `packages/ds/STRUCTURE.md` | DS component structure |
| Test Plan | `tests/TEST_PLAN.md` | Test strategy and coverage plan |
| Convex README | `convex/README.md` | Convex directory conventions |
