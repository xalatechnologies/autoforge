# XalaBaaS Architecture

This document describes the core architecture of XalaBaaS: a multi-tenant Backend-as-a-Service platform built on Convex with a feature-first, component-isolated design.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Layered Architecture](#2-layered-architecture)
3. [Import Chain](#3-import-chain)
4. [Re-export Convention](#4-re-export-convention)
5. [Facade Pattern](#5-facade-pattern)
6. [Component Isolation](#6-component-isolation)
7. [Event Bus](#7-event-bus)
8. [Two-Tier Gating](#8-two-tier-gating)

---

## 1. System Overview

XalaBaaS is a serverless multi-tenant platform where all backend logic runs as Convex functions (queries, mutations, actions) organized into **18 isolated components**. The frontend consists of **5 React applications** that consume backend data exclusively through a shared SDK layer.

### Design Principles

- **Feature-first**: All domain logic lives in `packages/shared/src/features/`. Every other layer (convex/, packages/sdk/) contains only thin re-exports pointing back to features. This ensures a single source of truth for each domain.

- **Component isolation**: Each of the 18 Convex components owns its own tables, schema, and functions. Components cannot directly query each other's tables. Cross-component communication happens exclusively through the event bus or the facade layer.

- **Thin apps**: React applications contain only route definitions and provider composition. They import hooks from `@xalabaas/sdk`, types from `@xalabaas/shared`, and layout/auth from `@xalabaas/app-shell`. No business logic lives in apps.

- **Plug-and-play**: Components are interchangeable. Any component implementing the same contract (query/mutation shapes, event topics) can be swapped in `convex/convex.config.ts` without modifying the SDK, facades, or apps.

- **Tenant isolation**: Every query and mutation validates tenant membership at the function level. There is no database-level isolation; enforcement is purely in application logic through middleware and facade validation.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Convex (serverless DB + functions), convex-helpers |
| Frontend | React 18, TypeScript, Vite 5, React Router 6 |
| SDK | Convex React hooks, custom hook wrappers |
| Design System | Designsystemet (@digdir), custom @xala/ds |
| i18n | i18next (nb, en, ar) |
| Testing | Vitest (unit + integration), Playwright (E2E), convex-test |
| Package Manager | pnpm workspaces |

---

## 2. Layered Architecture

The system is organized into four distinct layers. Data flows downward from apps to Convex; each layer delegates to the one below it.

```
+------------------------------------------------------------------+
|                     EXPERIENCE PLANE                              |
|  apps/web  |  apps/backoffice  |  apps/minside  |  saas-admin    |
|  (port 5190)  (port 5175)       (port 5174)      (port 6005)     |
|                                                                    |
|  Thin React shells: route definitions + provider composition       |
|  Import from: @xalabaas/sdk, @xalabaas/shared, @xalabaas/app-shell|
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        SDK LAYER                                  |
|  packages/sdk/src/hooks/use-*.ts                                  |
|                                                                    |
|  ~35 hook files, each a single-line re-export to features layer   |
|  Example: export * from '../../../shared/src/features/reviews/    |
|           hooks/use-reviews'                                      |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      FEATURE LAYER                                |
|  packages/shared/src/features/                                    |
|                                                                    |
|  23 feature modules + 1 _shared module                            |
|  SINGLE SOURCE OF TRUTH for all domain logic                      |
|  Contains: hooks/, convex/ (facades + component functions),       |
|            types.ts, adapters/, presenters/, utils/                |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     CONTROL PLANE                                 |
|  convex/                                                          |
|                                                                    |
|  Thin re-exports pointing to features/ (except schema, config,   |
|  seeds, http). Registers 18 components in convex.config.ts.       |
|  Core tables: tenants, users, orgs, outboxEvents, registry        |
+------------------------------------------------------------------+
```

### Layer Responsibilities

**Experience Plane (apps/)**
- 5 React applications, each a thin shell
- Compose providers: `XalaConvexProvider` -> `XalaProviders` -> `BrowserRouter` -> `App`
- Digdir apps (web, backoffice, minside) use the `@xala/ds` design system
- Platform apps (saas-admin, dashboard) use `@xala-technologies/platform-ui`
- Apps import ONLY from `@xalabaas/sdk`, `@xalabaas/shared`, and `@xalabaas/app-shell`
- No direct imports to `convex/`, `features/`, or internal SDK sources

**SDK Layer (packages/sdk/)**
- Single-line re-export files pointing to feature hooks
- Provides the public API surface consumed by apps
- Also contains `convex-provider.tsx` for the Convex client setup
- Contains `compat/` for backward compatibility with the pre-Convex REST API
- Contains formatters, upload utilities, and type definitions

**Feature Layer (packages/shared/src/features/)**
- The canonical location for all domain logic
- Each feature module is a self-contained vertical slice with hooks, convex functions, types, adapters, presenters, and utilities
- The `_shared` module provides cross-cutting infrastructure (auth helpers, event bus, rate limiting, CRUD, RLS, triggers, middleware)
- Feature hooks use Convex React hooks (`useQuery`, `useMutation`) from `convex/react` via the `_shared/hooks/convex-utils` adapter

**Control Plane (convex/)**
- Re-export files that satisfy Convex's file-based routing convention (Convex requires functions in the `convex/` directory)
- Real logic only in: `convex.config.ts`, `schema.ts`, `http.ts`, `seeds.ts`, `seedComponents.ts`, `seeds/`, and each component's `convex.config.ts`
- Registers all 18 components via `app.use()` in `convex.config.ts`
- Defines core tables in `schema.ts` (shared across all components)

---

## 3. Import Chain

The full data flow from a React app to the actual database operation follows this chain:

```
App component
  imports useReviews() from @xalabaas/sdk
    |
    v
packages/sdk/src/hooks/use-reviews.ts              (RE-EXPORT)
  export * from '../../../shared/src/features/reviews/hooks/use-reviews'
    |
    v
packages/shared/src/features/reviews/hooks/use-reviews.ts   (REAL LOGIC)
  Uses: useQuery(api.domain.reviews.list, { tenantId })
  Uses: useMutation(api.domain.reviews.create)
  Imports from:
    - features/_shared/hooks/convex-utils  (cached query hooks)
    - features/_shared/hooks/convex-api    (typed IDs, generated API)
    - features/_shared/hooks/transforms    (pagination helpers)
    |
    v
api.domain.reviews.list  -->  convex/domain/reviews.ts      (RE-EXPORT)
  export * from '../../packages/shared/src/features/reviews/convex/reviews'
    |
    v
packages/shared/src/features/reviews/convex/reviews.ts      (FACADE LOGIC)
  Imports from convex/_generated/server (app-level server, 6 dirs up)
  Imports from convex/_generated/api (components.reviews.functions.*)
  Responsibilities:
    1. Accept typed v.id("tenants") from SDK
    2. Convert to v.string() for component call
    3. Delegate to: ctx.runQuery(components.reviews.functions.list, ...)
    4. Enrich response with core table data (user names, etc.)
    5. Create audit entries via components.audit.functions.create
    |
    v
components.reviews.functions.list  -->  convex/components/reviews/functions.ts  (RE-EXPORT)
  export * from '../../../packages/shared/src/features/reviews/convex/functions'
    |
    v
packages/shared/src/features/reviews/convex/functions.ts    (COMPONENT LOGIC)
  Imports from ./_generated/server (component's own server)
  Operates ONLY on component's own tables
  Uses v.string() for ALL external references
  Pure data operations: no enrichment, no audit, no cross-component calls
```

### Import Path Examples

```typescript
// SDK hook re-export (packages/sdk/src/hooks/use-reviews.ts)
export * from '../../../shared/src/features/reviews/hooks/use-reviews';

// Domain facade re-export (convex/domain/reviews.ts)
export * from '../../packages/shared/src/features/reviews/convex/reviews';

// Lib re-export (convex/lib/eventBus.ts)
export * from '../../packages/shared/src/features/_shared/lib/eventBus';

// Component re-export (convex/components/reviews/functions.ts)
export * from '../../../packages/shared/src/features/reviews/convex/functions';

// Component schema re-export (convex/components/reviews/schema.ts)
export { default } from '../../../packages/shared/src/features/reviews/convex/schema';

// Facade importing app-level server (6 directories up from features/{domain}/convex/)
import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";

// Component function importing its own server (local _generated)
import { mutation, query } from "./_generated/server";
```

---

## 4. Re-export Convention

The `convex/` directory and `packages/sdk/` directory are almost entirely composed of single-line re-export files. This is a deliberate architectural choice driven by two constraints:

1. **Convex's file-based routing**: Convex maps function files in the `convex/` directory to API paths (e.g., `convex/domain/reviews.ts` becomes `api.domain.reviews.*`). The actual logic must live in `features/`, so `convex/` files re-export to satisfy the routing convention.

2. **SDK encapsulation**: Apps should import from `@xalabaas/sdk`, not from internal paths. SDK hook files re-export from features to provide a stable public API.

### Re-export Patterns

**Standard re-export** (most files):
```typescript
// convex/domain/bookings.ts
export * from '../../packages/shared/src/features/bookings/convex/bookings';
```

**Default export re-export** (schema files):
```typescript
// convex/components/reviews/schema.ts
export { default } from '../../../packages/shared/src/features/reviews/convex/schema';
```

**Barrel re-export** (index files):
```typescript
// convex/lib/index.ts
export * from '../../packages/shared/src/features/_shared/lib';
```

### Files That Are NOT Re-exports

The following files in `convex/` contain real logic and are not re-exports:

| File | Purpose |
|------|---------|
| `convex.config.ts` | Registers all 18 components via `app.use()` |
| `schema.ts` | Defines 9 core tables (tenants, users, orgs, etc.) |
| `http.ts` | HTTP route handler (Convex convention) |
| `seeds.ts` | Core table seed data |
| `seedComponents.ts` | Component table seed data |
| `seeds/*.ts` | Individual seed data modules |
| `components/*/convex.config.ts` | Component registration (e.g., `defineComponent("reviews")`) |
| `tsconfig.json` | TypeScript configuration |
| `migrations/index.ts` | Data migration orchestration |

Everything else (approximately 150+ files in `convex/`) is a single-line re-export.

---

## 5. Facade Pattern

Domain facade files bridge the gap between the SDK (which uses typed Convex IDs) and components (which use opaque strings). Every domain with a Convex component has a facade file at `features/{domain}/convex/{module}.ts`.

### Facade Responsibilities

1. **Accept typed IDs from SDK**: Facades use `v.id("tenants")`, `v.id("users")` in their argument validators, matching what the SDK sends.

2. **Convert IDs for component calls**: Components use `v.string()` for all external references. The facade casts typed IDs to strings: `tenantId as string`.

3. **Delegate to component functions**: The primary operation runs inside the component via `ctx.runQuery(components.{name}.functions.{fn}, ...)` or `ctx.runMutation(...)`.

4. **Enrich results with core table data**: Components only store string IDs for users, resources, etc. The facade looks up the actual records from core tables and attaches display data (names, emails).

5. **Create audit entries**: Facade mutations call `components.audit.functions.create` after the primary operation to log the action.

6. **Enforce rate limits**: Facade mutations call `rateLimit()` from `_shared/lib/rateLimits.ts` before processing.

7. **Emit events**: Facade mutations can emit events to the event bus for cross-component communication.

### Concrete Example: Reviews Facade

```typescript
// packages/shared/src/features/reviews/convex/reviews.ts

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export const list = query({
    args: {
        tenantId: v.id("tenants"),     // Typed ID from SDK
        resourceId: v.optional(v.string()),
    },
    handler: async (ctx, { tenantId, resourceId }) => {
        // 1. Delegate to component (convert typed ID to string)
        const reviews = await ctx.runQuery(components.reviews.functions.list, {
            tenantId: tenantId as string,
            resourceId,
        });

        // 2. Batch fetch users to avoid N+1 queries
        const userIds = [...new Set(reviews.map((r: any) => r.userId))];
        const users = await Promise.all(
            userIds.map((id: string) => ctx.db.get(id as Id<"users">))
        );
        const userMap = new Map(users.filter(Boolean).map((u: any) => [u._id, u]));

        // 3. Enrich with core table data
        return reviews.map((review: any) => {
            const user = review.userId ? userMap.get(review.userId) : null;
            return {
                ...review,
                user: user ? { id: user._id, name: user.name, email: user.email } : null,
            };
        });
    },
});

export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        resourceId: v.string(),
        rating: v.number(),
    },
    handler: async (ctx, args) => {
        // Rate limit
        await rateLimit(ctx, { name: "createReview", key: args.userId as string, throws: true });

        // Delegate to component
        const result = await ctx.runMutation(components.reviews.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            resourceId: args.resourceId,
            rating: args.rating,
        });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            entityType: "review",
            entityId: result.id,
            action: "created",
            newState: { rating: args.rating },
            sourceComponent: "reviews",
        });

        return result;
    },
});
```

### Domain Facade Mapping

Each domain facade in `convex/domain/` maps to one or more component function sets:

| Facade File | Source Feature | Delegates To |
|-------------|---------------|--------------|
| `bookings.ts` | bookings | `components.bookings.*` |
| `allocations.ts` | bookings | `components.bookings.*` |
| `bookingAddons.ts` | bookings | `components.bookings.*, components.addons.*` |
| `blocks.ts` | calendar | `components.bookings.*` |
| `reviews.ts` | reviews | `components.reviews.*` |
| `messaging.ts` | messaging | `components.messaging.*` |
| `notifications.ts` | notifications | `components.notifications.*` |
| `categories.ts` | catalog | `components.catalog.*` |
| `amenities.ts` | catalog | `components.catalog.*` |
| `pricing.ts` | pricing | `components.pricing.*` |
| `billing.ts` | billing | `components.billing.*` |
| `resources.ts` | resources | `components.resources.*` |
| `seasons.ts` | seasons | `components.seasons.*` |
| `favorites.ts` | user-prefs | `components.userPrefs.*` |
| `audit.ts` | audit | `components.audit.*` |
| `rbacFacade.ts` | rbac | `components.rbac.*` |
| `featureFlags.ts` | tenant-config | `components.tenantConfig.*` |
| `moduleRegistry.ts` | tenant-config | `componentRegistry table` |
| `search.ts` | listings | `components.catalog.*, components.resources.*` |
| `addons.ts` | addons | `components.addons.*` |
| `additionalServices.ts` | addons | `components.addons.*` |
| `seasonalLeases.ts` | seasons | `components.seasons.*` |
| `seasonApplications.ts` | seasons | `components.seasons.*` |
| `authSessions.ts` | auth | `components.auth.*` |

---

## 6. Component Isolation

### The v.string() Rule

Convex components have isolated databases. A component cannot use `v.id("tenants")` because the `tenants` table lives in the app-level schema, not in the component's schema. Therefore:

**Component functions use `v.string()` for ALL external references:**

```typescript
// Component function (features/reviews/convex/functions.ts)
// Uses ./_generated/server (component's own Convex server)
export const create = mutation({
    args: {
        tenantId: v.string(),      // NOT v.id("tenants")
        userId: v.string(),        // NOT v.id("users")
        resourceId: v.string(),    // NOT v.id("resources")
        rating: v.number(),
    },
    handler: async (ctx, args) => {
        // Can only access own tables (e.g., "reviews")
        const id = await ctx.db.insert("reviews", { ...args, status: "pending" });
        return { id: id as string };
    },
});
```

**Facade functions use `v.id()` for core table references:**

```typescript
// Facade function (features/reviews/convex/reviews.ts)
// Uses ../../../../../../convex/_generated/server (app-level Convex server)
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),  // Typed ID from SDK
        userId: v.id("users"),      // Typed ID from SDK
        resourceId: v.string(),
        rating: v.number(),
    },
    handler: async (ctx, args) => {
        // Can access core tables (tenants, users, etc.)
        // Converts typed IDs to strings for component calls
        return ctx.runMutation(components.reviews.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            ...
        });
    },
});
```

### Why Components Cannot Query Each Other

Each component gets its own isolated Convex database context. The `ctx.db` inside a component function can only see tables defined in that component's `schema.ts`. This means:

- The reviews component cannot read from the bookings component's tables
- The messaging component cannot look up user names from the users table
- Cross-component data joins happen exclusively in facade functions, which run at the app level and have access to all components via `ctx.runQuery(components.{name}.*)` and to core tables via `ctx.db`

This isolation is enforced by Convex at the platform level, not by convention.

### Component Internal Structure

Each component has both a registration directory in `convex/components/{name}/` and the real implementation in `features/{name}/convex/`:

```
convex/components/reviews/
  convex.config.ts      <-- REAL LOGIC: defineComponent("reviews")
  schema.ts             <-- RE-EXPORT to features/reviews/convex/schema
  functions.ts          <-- RE-EXPORT to features/reviews/convex/functions
  contract.ts           <-- RE-EXPORT to features/reviews/convex/contract
  index.ts              <-- RE-EXPORT to features/reviews/convex/index
  _generated/           <-- Auto-generated by Convex

features/reviews/convex/
  convex.config.ts      <-- REAL LOGIC (component definition)
  schema.ts             <-- REAL LOGIC (table definitions with v.string())
  functions.ts          <-- REAL LOGIC (component queries + mutations)
  contract.ts           <-- REAL LOGIC (API contract definition)
  reviews.ts            <-- REAL LOGIC (facade functions)
  index.ts              <-- Barrel export
  _generated/           <-- Auto-generated by Convex
```

---

## 7. Event Bus

Components communicate asynchronously through an outbox-pattern event bus. This preserves component isolation while enabling cross-component workflows.

### Outbox Pattern

Events are stored in the `outboxEvents` table (a core table in `convex/schema.ts`) rather than being dispatched synchronously. A background worker processes pending events and dispatches them to subscribers.

```
                 Facade Mutation
                      |
                      v
              +----------------+
              | Primary Op     |  ctx.runMutation(components.reviews.functions.create)
              +----------------+
                      |
                      v
              +----------------+
              | Emit Event     |  emitEvent(ctx, "reviews.review.created", ...)
              +----------------+
                      |
                      v
              +----------------+
              | outboxEvents   |  INSERT { topic, tenantId, sourceComponent, payload,
              | table          |          status: "pending", retryCount: 0 }
              +----------------+
                      |
                      v (async, via cron/scheduled function)
              +----------------+
              | processEvents  |  Reads pending, looks up subscribers in
              |                |  componentRegistry, dispatches to handlers
              +----------------+
                      |
                      v
              +------------------+
              | Subscriber       |  Another component's event handler
              | Component        |
              +------------------+
```

### Event Topic Convention

Topics follow the pattern `{component}.{entity}.{action}`:

```
reviews.review.created
reviews.review.moderated
bookings.booking.created
bookings.booking.cancelled
resources.resource.deleted
messaging.message.sent
```

### Event Lifecycle

| Status | Meaning |
|--------|---------|
| `pending` | Newly emitted, awaiting processing |
| `processing` | Currently being dispatched to subscribers |
| `processed` | Successfully dispatched |
| `failed` | Dispatch failed, will be retried (up to maxRetries) |
| `dead_letter` | Exceeded retry limit, requires manual intervention |

### Subscriber Resolution

The event processor queries the `componentRegistry` table to find components that subscribe to a given topic. Each component's registry entry includes a `subscribes` array listing the topics it handles:

```typescript
// componentRegistry record
{
    componentId: "notifications",
    subscribes: ["reviews.review.created", "bookings.booking.cancelled"],
    emits: ["notifications.notification.sent"],
    ...
}
```

### Emitting Events from Facades

Facades use the `emitEvent` helper from `_shared/lib/eventBus.ts`:

```typescript
import { emitEvent } from "../../_shared/lib/eventBus";

// Inside a facade mutation handler:
await emitEvent(ctx, "reviews.review.created", tenantId as string, "reviews", {
    reviewId: result.id,
    resourceId: args.resourceId,
    rating: args.rating,
});
```

### Event Cleanup

Processed events are periodically cleaned up by `cleanupProcessed`, which removes events older than a configurable threshold (default: 7 days).

---

## 8. Two-Tier Gating

XalaBaaS implements two independent gating mechanisms to control feature availability per tenant. Both tiers must pass for a feature to be available.

### Tier 1: Module-Level Gating (componentRegistry)

The `componentRegistry` table in the core schema tracks which components are installed and enabled for each tenant. The `hasModuleEnabled()` function from `_shared/lib/componentMiddleware.ts` checks this:

```typescript
export async function hasModuleEnabled(
    ctx: { db: { query: (table: string) => any } },
    tenantId: string,
    moduleId: string
): Promise<boolean> {
    const registration = await ctx.db
        .query("componentRegistry")
        .withIndex("by_component", (q) =>
            q.eq("tenantId", tenantId).eq("componentId", moduleId)
        )
        .first();

    if (registration) {
        return registration.isEnabled && registration.isInstalled;
    }
    return true; // Default to enabled if not in registry
}
```

This controls whether an entire component (e.g., reviews, messaging, analytics) is available to a tenant. It is a coarse-grained on/off switch.

**componentRegistry fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `componentId` | string | Component identifier (e.g., "reviews") |
| `isInstalled` | boolean | Whether the component is deployed for this tenant |
| `isEnabled` | boolean | Whether the component is currently active |
| `version` | string | Component version |
| `contractVersion` | string | API contract version |
| `subscribes` | string[] | Event topics this component listens to |
| `emits` | string[] | Event topics this component publishes |
| `requires` | string[] | Other components this depends on |
| `conflicts` | string[] | Mutually exclusive components |
| `features` | string[] | Feature flags this component provides |

### Tier 2: Feature Flag Level (tenant-config Component)

Within an enabled module, individual features can be toggled via the `tenant-config` component's feature flag system. The `hasFeatureFlag()` function evaluates flags with optional targeting:

```typescript
export async function hasFeatureFlag(
    ctx: { runQuery: (...args: any[]) => any },
    tenantId: string,
    key: string,
    targetType?: string,
    targetId?: string,
): Promise<boolean> {
    try {
        const result = await ctx.runQuery(
            components.tenantConfig.queries.evaluateFlag,
            { tenantId, key, targetType, targetId }
        );
        return result?.value === true;
    } catch {
        return false; // Default to disabled
    }
}
```

This supports granular targeting rules: a flag can be enabled for specific users, roles, or percentages of traffic.

### How the Tiers Work Together

```
Request: "List reviews for tenant X"
    |
    v
[Tier 1] Is the "reviews" module enabled for tenant X?
    |-- NO  --> Return empty / 403
    |-- YES --> Continue
    |
    v
[Tier 2] Is the "reviews-v2-ui" feature flag active for this user?
    |-- NO  --> Serve v1 behavior
    |-- YES --> Serve v2 behavior
    |
    v
Execute the query
```

### Use Cases

| Tier | Use Case | Example |
|------|----------|---------|
| Module gating | SaaS plan tiers | Free plan: reviews disabled. Pro plan: reviews enabled. |
| Module gating | Staged rollout | Enable messaging for one tenant at a time during migration. |
| Feature flags | A/B testing | "new-booking-flow" flag enabled for 10% of users. |
| Feature flags | Soft launch | "advanced-analytics" flag enabled only for admin users. |
| Feature flags | Kill switch | "vipps-payments" flag disabled during Vipps maintenance. |

### Component Contract Pattern

Every component should declare its capabilities via a contract file (`features/{domain}/convex/contract.ts`):

```typescript
import { defineContract } from "../../_shared/lib/componentContract";
import { v } from "convex/values";

export const CONTRACT = defineContract({
    name: "reviews",
    version: "1.0.0",
    category: "domain",
    description: "Resource reviews with moderation support",

    queries: {
        list: { args: { tenantId: v.string(), ... }, returns: v.array(v.any()) },
        get: { args: { id: v.string() }, returns: v.any() },
        stats: { args: { resourceId: v.string() }, returns: v.object({ ... }) },
    },

    mutations: {
        create: { args: { ... }, returns: v.object({ id: v.string() }) },
        update: { args: { ... }, returns: v.object({ success: v.boolean() }) },
        remove: { args: { id: v.string() }, returns: v.object({ success: v.boolean() }) },
        moderate: { args: { ... }, returns: v.object({ success: v.boolean() }) },
    },

    emits: [
        "reviews.review.created",
        "reviews.review.updated",
        "reviews.review.deleted",
        "reviews.review.moderated",
    ],

    subscribes: [
        "resources.resource.deleted",
    ],

    dependencies: {
        core: ["tenants", "users", "resources"],
        components: [],
    },
});
```

The contract serves as machine-readable documentation of a component's API surface. When swapping a component, the replacement must satisfy the same contract to maintain compatibility with facades and event subscribers.
