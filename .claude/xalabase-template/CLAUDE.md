# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XalaBaaS is a multi-tenant Backend-as-a-Service platform built on **Convex** (serverless database + functions). It provides tenant isolation, RBAC, booking/resource management, billing, and compliance — consumed by 5 React apps through a shared SDK.

The 3 main user-facing apps (`web`, `backoffice`, `minside`) were migrated from the digdir monorepo. They use the `@xala/ds` design system and the `@xalabaas/sdk` adapter layer which re-exports ~240 hooks backed by Convex instead of the original React Query + Fastify REST backend.

## Commands

```bash
# Development
pnpm install                          # Install all dependencies (pnpm required, not npm)
npx convex dev                        # Start Convex dev server (watches schema + functions + components)
pnpm dev                              # Alias for npx convex dev

# Build
pnpm sdk:build                        # Build SDK package (tsup)

# Testing
pnpm sdk:test                         # SDK unit tests (vitest, jsdom) — 54 tests
pnpm test:convex                      # Convex function tests (vitest, node env) — 472 tests
pnpm test:convex:watch                # Watch mode
pnpm test:convex:e2e                  # E2E backend tests via custom runner
pnpm test:convex:e2e:all              # All E2E suites
pnpm test:e2e                         # Playwright browser E2E tests
pnpm test:all                         # Full suite: sdk + convex + e2e

# Run a single test file
cd tests && npx vitest run convex/path/to/file.test.ts
npx vitest run --filter "test name"   # SDK tests from packages/sdk/

# Typecheck & Lint
pnpm typecheck                        # Typecheck all workspaces
pnpm lint                             # Lint all workspaces

# Deploy (self-hosted)
npx convex dev --once                 # Deploy schema + functions + components (uses .env.selfhosted)
npx convex deploy                     # Deploy to production
npx convex deploy --dry-run           # Validate without deploying

# Seeding
npx convex run seeds:seedAll          # Seed core tables (tenants, users, resources, etc.)
npx convex run seedComponents:seedAll # Seed component tables (reviews, notifications, registry, etc.)
npx convex run seeds:resetAll         # Reset all core table data
npx convex run seedComponents:resetAll # Reset component table data

# Migrations (app tables -> component tables)
npx convex run migrations/index:getMigrationStatus  # Check migration status
npx convex run migrations/index:runAllMigrations     # Migrate all data
npx convex run migrations/index:migrateReviews       # Migrate single domain

# Component management
npx convex run --component audit functions:listForTenant '{"tenantId":"..."}'
```

## Architecture

### Feature-First Design (Single Source of Truth)

All domain logic lives in **`packages/shared/src/features/`** — 23 self-contained feature modules. Everything else (convex/, packages/sdk/) is thin re-exports pointing back to features.

```
packages/shared/src/features/          — SINGLE SOURCE OF TRUTH (23 features)
  ├── _shared/                         — Cross-cutting: lib/, hooks/, convex/
  ├── auth/                            — Sessions, OAuth, magic links, passwords
  ├── bookings/                        — Bookings, blocks, allocations, conflicts
  ├── billing/                         — Payments, invoices, Vipps webhooks
  ├── catalog/                         — Categories, amenity groups
  ├── listings/                        — Search, favorites, geocode
  ├── calendar/                        — Block scheduling
  ├── pricing/                         — Pricing groups, holidays, discounts
  ├── reviews/                         — Reviews with moderation
  ├── messaging/                       — Conversations, messages
  ├── notifications/                   — In-app notifications, preferences
  ├── seasons/                         — Seasons, applications, leases
  ├── addons/                          — Addons, additional services
  ├── resources/                       — Resource management
  ├── integrations/                    — Integration configs, webhooks
  ├── audit/                           — Audit logging
  ├── organizations/                   — Org + user management
  ├── rbac/                            — Roles, user-role bindings
  ├── analytics/                       — Metrics, report schedules
  ├── tenant-config/                   — Feature flags, branding, themes
  ├── user-prefs/                      — Favorites, saved filters
  ├── compliance/                      — Consent, DSAR, policies
  └── dashboard/                       — Dashboard KPIs

Experience Plane (apps/)               — 5 thin React apps, compose providers, no business logic
  ├── web (port 5190)                  — Public booking platform (digdir)
  ├── backoffice (port 5175)           — Admin management + case handling (digdir)
  ├── minside (port 5174)              — User dashboard / "My Pages" (digdir)
  ├── saas-admin (port 6005)           — SaaS platform admin
  └── dashboard                        — Analytics

SDK Layer (packages/sdk/)              — Thin re-exports to features layer hooks
  └── hooks/use-*.ts                   — All re-export from features/{domain}/hooks/

Control Plane (convex/)                — Thin re-exports to features layer convex/
  ├── convex.config.ts                 — App config, registers all 18 components (REAL LOGIC)
  ├── schema.ts                        — Core tables: tenants, users, orgs, etc. (REAL LOGIC)
  ├── http.ts                          — HTTP router (REAL LOGIC)
  ├── seeds.ts, seedComponents.ts      — Seed scripts (REAL LOGIC)
  ├── lib/                             — Re-exports → features/_shared/lib/
  ├── domain/                          — Re-exports → features/{domain}/convex/
  ├── components/*/                    — Re-exports → features/{domain}/convex/ (except convex.config.ts)
  ├── auth/                            — Re-exports → features/auth/convex/
  ├── admin/                           — Re-exports → features/catalog|analytics|_shared/convex/
  ├── billing/                         — Re-exports → features/billing/convex/
  ├── integrations/                    — Re-exports → features/integrations/convex/
  ├── monitoring/                      — Re-exports → features/dashboard|analytics/convex/
  ├── organizations/                   — Re-exports → features/organizations/convex/
  ├── tenants/                         — Re-exports → features/tenant-config/convex/
  ├── users/                           — Re-exports → features/organizations/convex/
  ├── modules/                         — Re-exports → features/_shared/convex/
  ├── ops/                             — Re-exports → features/_shared/convex/
  ├── types.ts                         — Re-exports → features/_shared/convex/types
  └── storage.ts                       — Re-exports → features/_shared/convex/storage
```

### Feature Module Structure

Each feature module is a self-contained vertical slice:

```
features/{domain}/
  ├── index.ts           # Barrel export
  ├── types.ts           # Domain types
  ├── convex/            # Backend functions (Convex queries/mutations)
  │   ├── convex.config.ts  # Component registration
  │   ├── schema.ts         # Table definitions
  │   ├── queries.ts        # Read operations
  │   ├── mutations.ts      # Write operations
  │   ├── contract.ts       # API contract
  │   ├── _generated/       # Convex auto-generated
  │   └── {domain}.ts       # Domain facade functions
  ├── hooks/             # React hooks
  │   ├── index.ts
  │   └── use-{domain}.ts
  ├── adapters/          # Data transformation
  ├── presenters/        # Presentation logic
  └── utils/             # Domain utilities
```

### _shared Feature (Cross-Cutting Infrastructure)

```
features/_shared/
  ├── lib/                  # Convex infrastructure (12 files)
  │   ├── auth.ts              # Auth helpers
  │   ├── batchGet.ts          # Batch data fetching
  │   ├── componentContract.ts # defineContract() for component API shapes
  │   ├── componentMiddleware.ts # Middleware chain (auth, tenant, rate limit, RLS, audit)
  │   ├── crud.ts              # CRUD helpers
  │   ├── eventBus.ts          # Outbox pattern for decoupled communication
  │   ├── functions.ts         # Tenant-aware custom function builders
  │   ├── rateLimits.ts        # Per-tenant/per-user rate limiting
  │   ├── rls.ts               # Row-level security
  │   ├── triggers.ts          # Database triggers with event bus integration
  │   ├── validators.ts        # Shared validators
  │   └── index.ts             # Barrel export
  ├── hooks/                # Shared hook utilities
  │   ├── convex-utils.ts      # Cached query hooks (convex-helpers)
  │   ├── convex-api.ts        # Generated API + typed IDs (TenantId, ResourceId, etc.)
  │   ├── transforms/common.ts # Pagination, response wrappers
  │   └── index.ts
  ├── convex/               # App-level cross-cutting functions
  │   ├── types.ts             # Status enums, doc types
  │   ├── storage.ts           # File storage API
  │   ├── modules.ts           # Feature module catalog
  │   ├── ops.ts               # System health/metrics
  │   ├── cleanup.ts           # Data consolidation
  │   └── index.ts
  ├── use-help.ts           # FAQ/guides hook
  └── use-accessibility-monitoring.ts  # A11y metrics hook
```

### Import Chain

```
Apps (@xalabaas/sdk, @xalabaas/shared, @xalabaas/app-shell)
  → packages/sdk/src/hooks/use-*.ts          (re-export)
    → packages/shared/src/features/{domain}/hooks/use-*.ts  (REAL LOGIC)
      → features/_shared/hooks/convex-utils   (cached Convex hooks)
      → features/_shared/hooks/convex-api     (generated API + typed IDs)
      → features/_shared/hooks/transforms     (pagination helpers)
      → api.domain.{module}.*                 (Convex domain facade)
        → convex/domain/{module}.ts           (re-export)
          → features/{domain}/convex/{module}.ts  (facade logic)
            → components.{name}.*             (Convex component functions)
              → features/{domain}/convex/queries|mutations  (REAL LOGIC)
```

### 18 Convex Components

Each component has isolated tables, functions, and schema. Components communicate via the event bus (outbox pattern). Replacing a component is plug-and-play: implement the same contract, swap in convex.config.ts.

`addons`, `analytics`, `audit`, `auth`, `billing`, `bookings`, `catalog`, `compliance`, `integrations`, `messaging`, `notifications`, `pricing`, `rbac`, `resources`, `reviews`, `seasons`, `tenant-config`, `user-prefs`

### Re-export Layer (convex/)

All files in `convex/` (except those listed below) are **single-line re-exports**:
```typescript
// Example: convex/lib/eventBus.ts
export * from '../../packages/shared/src/features/_shared/lib/eventBus';

// Example: convex/domain/bookings.ts
export * from '../../packages/shared/src/features/bookings/convex/bookings';

// Example: convex/components/reviews/queries.ts
export * from '../../../packages/shared/src/features/reviews/convex/queries';

// Example: convex/auth/sessions.ts
export * from '../../packages/shared/src/features/auth/convex/sessions';
```

**Files that stay as real logic in convex/**:
- `convex.config.ts` — App registration (18 components)
- `schema.ts` — Core tables (tenants, users, orgs, outboxEvents, registry)
- `http.ts` — HTTP router (Convex convention)
- `seeds.ts`, `seedComponents.ts`, `seeds/` — Seed scripts
- `components/*/convex.config.ts` — Component registration (NOT re-exports)
- `tsconfig.json`, `README.md`

### Facade Pattern (SDK Compatibility)

Domain facade files in `features/{domain}/convex/{module}.ts` delegate to components. This preserves the `api.domain.{module}.{function}` paths that SDK hooks use — no SDK changes needed when components are swapped.

Facade responsibilities:
1. Accept typed `v.id("tenants")` args from SDK
2. Convert to `string` for component calls
3. Enrich results with core table data (user names, resource names)
4. Create audit entries via audit component
5. Emit events to the event bus

### Convex Function Patterns

**Component function** (inside `features/{domain}/convex/queries.ts` or `mutations.ts`):
```typescript
import { query, mutation } from "./_generated/server";  // Component's own server
import { v } from "convex/values";

export const list = query({
  args: { tenantId: v.string(), /* v.string() for ALL external refs */ },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return ctx.db.query("reviews")
      .withIndex("by_tenant", q => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
```

**Facade function** (in `features/{domain}/convex/{module}.ts`):
```typescript
import { query } from "../../../../../../convex/_generated/server";  // App's server (6 levels up)
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

export const list = query({
  args: { tenantId: v.id("tenants") },  // Typed IDs from SDK
  handler: async (ctx, { tenantId }) => {
    // 1. Delegate to component (convert typed ID to string)
    const data = await ctx.runQuery(components.reviews.functions.list, {
      tenantId: tenantId as string,
    });
    // 2. Enrich with core table data (user names, etc.)
    // 3. Return enriched data to SDK
    return data;
  },
});
```

**App-level function** (in `features/_shared/convex/` or `features/{domain}/convex/`):
```typescript
import { query, mutation } from "../../../../../../convex/_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return ctx.db.query("resources")
      .withIndex("by_tenant", q => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
```

### Database Schema

**Core tables** (in `convex/schema.ts`) — 9 tables shared across all components:
- **Identity**: tenants, organizations, users, tenantUsers
- **Custody**: custodyGrants, custodySubgrants
- **Infrastructure**: outboxEvents (event bus), componentRegistry (component slots)

**CRITICAL RULE**: Component functions must use `v.string()` (not `v.id("tableName")`) for ANY table that lives in a component. Only core tables above can use `v.id()`.

**Component tables** (in `features/{domain}/convex/schema.ts`) — isolated per component:
- Each component defines its own tables with `v.string()` for external references
- Components cannot directly query other components' tables
- Cross-component data access happens through the facade layer

Status types are defined in `features/_shared/convex/types.ts` as string literal unions.

### Shared Packages

- **`@xalabaas/app-shell`** — Provider composition (`XalaProviders`), auth context (`AuthProvider`/`TenantProvider`), route guards (`RequireAuth`/`RequirePermission`/`RequireModule`), shared layout
- **`@xalabaas/i18n`** — i18next with `nb`, `en`, `ar` locales (includes digdir translation keys)
- **`@xalabaas/shared`** — Types, constants, navigation config; multi-entry (`./types`, `./constants`, `./navigation`)
- **`@xala/ds`** — Designsystemet-based design system (imported by digdir apps)
- **`@xala/ds-themes`** — Theme tokens for the design system
- **`@xala/ds-registry`** — Component registry

### Using @xalabaas/shared Types

The `@xalabaas/shared` package is the **single source of truth** for all domain types and interfaces. Import types from this package instead of defining them locally.

**Type files** (`packages/shared/src/types/`):
- `common.ts` — Base types: `Id`, `Timestamp`, `Pricing`, `Location`, `Image`, `App`, `Locale`
- `auth.ts` — `User`, `Session`, `Role`, `Permission`, `AuthState`
- `tenant.ts` — `Tenant`, `Organization`, `TenantUser`
- `listing.ts` — `Listing`, `ListingType`, `ListingStatus`, `ListingInput`, `ListingQuery`
- `booking.ts` — `Booking`, `BookingStatus`, `CalendarEvent`, `TimeSlot`, `Block`
- `category.ts` — `Category`, `CategoryWithSubcategories`, `CategoryOption`
- `amenity.ts` — `Amenity`, `AmenityGroup`, `AmenityOption`
- `filter.ts` — `ListingFilterState`, `FilterOption`, `SortOption`, `PriceRange`, `DateRange`
- `api.ts` — `PaginatedResponse`, `ProblemDetails`, `ApiError`, `QueryOptions`

**Usage examples**:
```typescript
// Import specific types
import type { Listing, Category, Amenity } from '@xalabaas/shared/types';

// Import from main entry (re-exports all)
import type { ListingFilterState, PaginatedResponse } from '@xalabaas/shared';

// Import constants
import { APPS, SUPPORTED_LOCALES } from '@xalabaas/shared/constants';
```

### Thin App Pattern

Every app follows the same entry structure — compose providers, render routes:
```
XalaConvexProvider (sdk) -> [XalaProviders (app-shell)] -> BrowserRouter -> App
```

- **Digdir apps** (`web`, `backoffice`, `minside`): Use `@xala/ds` for the design system, `@xalabaas/sdk` for data hooks
- **Platform apps** (`saas-admin`, `dashboard`): Use `@xala-technologies/platform-ui` and `@xalabaas/app-shell`
- **backoffice** has 2 app-specific providers (`BackofficeRoleProvider`, `ThemeProvider`) — this is correct, they are app-specific concerns

Business logic lives in feature modules, not in apps.

Apps import ONLY from: `@xalabaas/sdk` (hooks), `@xalabaas/shared` (types), `@xalabaas/app-shell` (providers). NO direct imports to `convex/`, `features/`, or `sdk/src/`.

### Component Contract Pattern

Every component should define a contract (`features/{domain}/convex/contract.ts`) declaring its API shape:
```typescript
import { defineContract } from "../../_shared/lib/componentContract";

export const CONTRACT = defineContract({
  name: "reviews",
  version: "1.0.0",
  category: "domain",
  queries: { list: { args: {...}, returns: v.array(v.any()) } },
  mutations: { create: { args: {...}, returns: v.object({ id: v.string() }) } },
  emits: ["reviews.review.created"],
  subscribes: ["resources.resource.deleted"],
  dependencies: { core: ["tenants", "users", "resources"], components: [] },
});
```

### Adding a New Feature / Component

1. Create feature module at `packages/shared/src/features/{name}/`
   - `convex/convex.config.ts`, `convex/schema.ts`, `convex/queries.ts`, `convex/mutations.ts`, `convex/contract.ts`
   - `hooks/use-{name}.ts`, `hooks/index.ts`
   - `types.ts`, `index.ts`
2. Create re-export wrappers in `convex/components/{name}/` pointing to `features/{name}/convex/`
3. Register in `convex/convex.config.ts`: `import comp from "./components/{name}/convex.config"; app.use(comp);`
4. Create facade in `features/{name}/convex/{name}.ts` + re-export in `convex/domain/{name}.ts`
5. Create SDK re-export in `packages/sdk/src/hooks/use-{name}.ts` pointing to `features/{name}/hooks/`
6. Run `npx convex dev` to generate `_generated/` for the component
7. Add component to seed script: `convex/seedComponents.ts`

### Domain Mapping

| Feature | Component | Domain Facades | SDK Hooks |
|---------|-----------|----------------|-----------|
| auth | auth | authSessions | use-auth, use-magic-link, use-oauth-callback |
| bookings | bookings | bookings, allocations, bookingAddons, blocks | use-bookings, use-booking-availability |
| billing | billing | billing | use-billing, use-economy |
| catalog | catalog | categories, amenities | use-categories |
| listings | (uses catalog+resources) | search, favorites | use-listings, use-search, use-amenities, use-favorites, use-geocode |
| calendar | (uses bookings) | blocks | use-blocks |
| pricing | pricing | pricing | use-pricing |
| reviews | reviews | reviews | use-reviews |
| messaging | messaging | messaging | use-conversations |
| notifications | notifications | notifications | use-notifications |
| seasons | seasons | seasons, seasonalLeases, seasonApplications | use-seasons, use-seasonal-leases, use-season-applications |
| addons | addons | addons, additionalServices | use-addons, use-additional-services |
| resources | resources | resources | use-resources |
| integrations | integrations | - | use-integrations |
| audit | audit | audit | use-audit |
| organizations | - | - | use-organizations |
| rbac | rbac | rbacFacade | - |
| analytics | analytics | - | use-reports |
| tenant-config | tenant-config | - | use-tenant-id |
| user-prefs | user-prefs | favorites | use-favorites |
| compliance | compliance | - | - |
| dashboard | - | - | - |

## Key Conventions

- **Feature-first**: All domain logic in `packages/shared/src/features/`. Everything else is re-exports.
- **Errors**: RFC7807 format (`type`, `title`, `status`, `detail`, `instance`)
- **Tenant isolation**: Enforced at function level, not database level. Every query/mutation validates tenant membership.
- **Audit**: All mutations create audit events via the **audit component** (`components.audit.functions.create`)
- **Idempotency**: Mutations support idempotency keys
- **i18n**: Default locale is `nb` (Norwegian Bokmal), RTL support for `ar`
- **Module system**: Feature modules are gated — functions check `hasModuleEnabled()` from `_shared/lib/componentMiddleware.ts`
- **Event bus**: Components communicate via outbox events (`outboxEvents` table), never direct cross-component calls
- **Facade pattern**: SDK hooks call `api.domain.{module}.*` — facades delegate to components, no SDK changes needed
- **Component isolation**: Component functions use `v.string()` for external references, never `v.id("otherTable")`
- **Rate limiting**: Defined in `features/_shared/lib/rateLimits.ts`, applied in facade mutations
- **Plug-and-play**: Any component implementing the same contract can be swapped in `convex.config.ts`
- **Import paths**: App-level functions in features use `../../../../../../convex/_generated/server` (6 levels up). Component functions use `./_generated/server` (local).
- **Cross-feature deps**: Hooks use relative paths (e.g., `../../tenant-config/hooks/use-tenant-id`)

## Test Structure

- **SDK tests** (`packages/sdk/src/__tests__/`): Vitest + jsdom + React Testing Library
- **Convex function tests** (`tests/convex/`): Vitest + node env, run with `convex-test` utilities
- **E2E backend tests** (`tests/convex/e2e/`): Custom runner via `tsx tests/convex/e2e/runner.ts`
- **Browser E2E** (`tests/e2e/`): Playwright, Desktop Chrome, sequential (1 worker)

Test config: `tests/vitest.config.ts` for Convex tests, `packages/sdk/vitest.config.ts` for SDK tests, `playwright.config.ts` at root for browser E2E.

## Relevant Docs

- `docs/CONVENTIONS.md` — Tenant boundaries, idempotency, RFC7807 errors, outbox events, audit requirements
- `docs/SECURITY_INVARIANTS.md` — Non-negotiable security rules (tenant isolation, auth, authorization, audit)
- `docs/DOMAIN_BUNDLE_SPEC.md` — Module contract: schema + functions + SDK hooks + tests
- `docs/MIGRATION_POLICY.md` — Schema change procedures (forward-only, additive preferred)
- `docs/DEFINITION_OF_DONE.md` — Feature completion gates
- `docs/COMPONENT_ARCHITECTURE.md` — Component architecture, facade pattern, event bus, plug-and-play design
