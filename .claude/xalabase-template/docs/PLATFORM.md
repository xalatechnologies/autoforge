# Platform Layer Documentation

The platform layer provides the foundational services that all feature modules build upon: core schema, authentication, multi-tenancy, RBAC, module gating, feature flags, audit logging, the event bus, and rate limiting.

---

## 1. Core Schema

The core schema is defined in `convex/schema.ts`. It contains 9 tables that are shared across all components. These tables live at the app level (not inside any component) because they represent cross-cutting platform concerns.

### tenants

The top-level organizational unit. Every piece of data in the system belongs to a tenant.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name |
| `slug` | `string` | URL-safe identifier, unique |
| `domain` | `string?` | Custom domain for white-labeling |
| `settings` | `any` | JSON blob: locale, timezone, currency, theme, branding, notifications, installedModules, policies |
| `status` | `"active" \| "suspended" \| "pending" \| "deleted"` | Lifecycle status |
| `seatLimits` | `any` | Usage limits: maxUsers, maxListings, maxStorageMb, maxOrganizations, maxBookingsPerMonth |
| `featureFlags` | `any` | Legacy feature flag JSON blob (deprecated; use tenant-config component) |
| `enabledCategories` | `string[]` | Resource categories enabled for this tenant |
| `deletedAt` | `number?` | Soft delete timestamp |

**Indexes:** `by_slug` (slug), `by_domain` (domain), `by_status` (status)

---

### organizations

Hierarchical organizational units within a tenant. Supports parent-child relationships for nested structures.

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `Id<"tenants">` | Owning tenant |
| `name` | `string` | Organization name |
| `slug` | `string` | URL-safe identifier, unique within tenant |
| `description` | `string?` | Optional description |
| `type` | `string` | Organization type (e.g., "sports_club", "company") |
| `parentId` | `Id<"organizations">?` | Parent organization for hierarchy |
| `settings` | `any` | Org-specific settings JSON |
| `metadata` | `any` | Additional metadata JSON |
| `status` | `"active" \| "inactive" \| "suspended" \| "deleted"` | Lifecycle status |
| `deletedAt` | `number?` | Soft delete timestamp |

**Indexes:** `by_tenant` (tenantId), `by_slug` (tenantId, slug), `by_parent` (parentId)

---

### users

Platform user accounts. A user may belong to multiple tenants via the `tenantUsers` join table.

| Field | Type | Description |
|-------|------|-------------|
| `authUserId` | `string?` | External auth provider subject ID |
| `tenantId` | `Id<"tenants">?` | Primary tenant association |
| `organizationId` | `Id<"organizations">?` | Primary organization |
| `email` | `string` | Email address |
| `name` | `string?` | Full name |
| `displayName` | `string?` | Display name override |
| `avatarUrl` | `string?` | Profile image URL |
| `nin` | `string?` | Norwegian national identity number |
| `phoneNumber` | `string?` | Phone number |
| `role` | `string` | Legacy role field (use RBAC component for role resolution) |
| `status` | `"active" \| "inactive" \| "invited" \| "suspended" \| "deleted"` | Account status |
| `demoToken` | `string?` | Demo authentication token |
| `metadata` | `any` | User metadata: isFounder, provider, linkedProviders, consent, dsarRequests |
| `deletedAt` | `number?` | Soft delete timestamp |
| `lastLoginAt` | `number?` | Last login timestamp |

**Indexes:** `by_email` (email), `by_authUserId` (authUserId), `by_nin` (nin), `by_tenant` (tenantId), `by_status` (status), `by_demoToken` (demoToken)

---

### tenantUsers

Join table linking users to tenants. Tracks invitation and membership lifecycle.

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `Id<"tenants">` | Tenant |
| `userId` | `Id<"users">` | User |
| `status` | `"active" \| "invited" \| "suspended" \| "removed"` | Membership status |
| `invitedByUserId` | `Id<"users">?` | Who sent the invitation |
| `invitedAt` | `number?` | Invitation timestamp |
| `joinedAt` | `number?` | When the user accepted |

**Indexes:** `by_tenant` (tenantId), `by_user` (userId), `by_tenant_user` (tenantId, userId)

---

### custodyGrants

Resource custody assignments -- tracks who has custody (responsibility/access) over a resource.

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `Id<"tenants">` | Tenant |
| `resourceId` | `string` | Resource in the resources component |
| `userId` | `Id<"users">` | User granted custody |
| `custodyType` | `string` | Type of custody (e.g., "owner", "manager", "operator") |
| `grantedBy` | `Id<"users">?` | Who granted custody |
| `grantedAt` | `number` | Grant timestamp |
| `expiresAt` | `number?` | Optional expiration |
| `notes` | `string?` | Grant notes |
| `permissions` | `any` | Custody-specific permissions |
| `isActive` | `boolean` | Whether the grant is currently active |
| `metadata` | `any` | Additional metadata |

**Indexes:** `by_tenant` (tenantId), `by_resource` (resourceId), `by_user` (userId)

---

### custodySubgrants

Delegated custody -- a custody holder can subgrant limited custody to another user.

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `Id<"tenants">` | Tenant |
| `parentGrantId` | `Id<"custodyGrants">` | Parent custody grant |
| `resourceId` | `string` | Resource reference |
| `userId` | `Id<"users">` | User receiving the subgrant |
| `subgrantType` | `string` | Type of subgrant |
| `grantedBy` | `Id<"users">` | Who created the subgrant |
| `grantedAt` | `number` | Subgrant timestamp |
| `expiresAt` | `number?` | Optional expiration |
| `notes` | `string?` | Subgrant notes |
| `permissions` | `any` | Subgrant-specific permissions |
| `isActive` | `boolean` | Whether the subgrant is active |
| `metadata` | `any` | Additional metadata |

**Indexes:** `by_tenant` (tenantId), `by_parent_grant` (parentGrantId), `by_resource` (resourceId), `by_user` (userId)

---

### outboxEvents

Event bus outbox table. All inter-component communication flows through this table using the transactional outbox pattern.

| Field | Type | Description |
|-------|------|-------------|
| `topic` | `string` | Event topic in format `{component}.{entity}.{action}` |
| `tenantId` | `string` | Tenant scope for the event |
| `sourceComponent` | `string` | Which component emitted the event |
| `payload` | `any` | Event payload data |
| `status` | `"pending" \| "processing" \| "processed" \| "failed" \| "dead_letter"` | Processing status |
| `error` | `string?` | Error message if failed |
| `retryCount` | `number` | Number of processing attempts |
| `maxRetries` | `number?` | Maximum retry attempts (default: 3) |
| `createdAt` | `number` | Event creation timestamp |
| `processedAt` | `number?` | When the event was processed |

**Indexes:** `by_status` (status), `by_topic` (topic, status), `by_tenant` (tenantId, status), `by_created` (createdAt)

---

### componentRegistry

Maps component slots to their implementations per tenant. Determines which modules are installed and enabled for each tenant.

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | `Id<"tenants">` | Tenant |
| `componentId` | `string` | Component identifier (e.g., "bookings", "reviews") |
| `name` | `string` | Display name |
| `description` | `string?` | Component description |
| `category` | `string` | Component category (domain, infrastructure, platform) |
| `version` | `string` | Semantic version |
| `contractVersion` | `string` | Contract version implemented |
| `isCore` | `boolean` | Whether this is a core (non-removable) component |
| `isEnabled` | `boolean` | Whether the component is currently enabled |
| `isInstalled` | `boolean` | Whether the component is installed |
| `hooks` | `object?` | Lifecycle hook references (onInstall, onUninstall, onEnable, onDisable) |
| `subscribes` | `string[]?` | Event topics this component subscribes to |
| `emits` | `string[]?` | Event topics this component can emit |
| `requires` | `string[]?` | Other components required |
| `conflicts` | `string[]?` | Components that conflict |
| `features` | `string[]?` | Features this component provides |
| `metadata` | `any?` | Additional metadata |
| `installedAt` | `number?` | Installation timestamp |
| `updatedAt` | `number?` | Last update timestamp |

**Indexes:** `by_tenant` (tenantId), `by_component` (tenantId, componentId), `by_enabled` (tenantId, isEnabled)

---

### rateLimitTables

Rate limiting tables from `convex-helpers/server/rateLimit`. These are automatically managed by the rate limiting library and should not be modified directly.

Provided by: `import { rateLimitTables } from "convex-helpers/server/rateLimit"` and spread into the schema with `...rateLimitTables`.

---

## 2. Authentication

Authentication is handled by the `auth` component (`features/auth/convex/`). The platform uses a **custom session system** rather than Convex's built-in auth.

### Session Flow

1. User authenticates via OAuth, magic link, password, or demo token
2. A session is created in the `sessions` table with a unique token
3. The token is stored client-side and sent with every request
4. Session validation happens at the app-shell level (`AuthProvider`)
5. Sessions expire after a configurable duration and have `lastActiveAt` tracking

### OAuth Flow

1. **Initiate:** Client calls `createOAuthState` which generates a CSRF state token and stores it in `oauthStates` with the provider, app origin, and return path
2. **Redirect:** User is redirected to the OAuth provider (BankID, Vipps, Google, Azure) with the state parameter
3. **Callback:** Provider redirects back with an authorization code and the state parameter
4. **Validate:** `consumeOAuthState` validates the state, marks it consumed
5. **Exchange:** Server exchanges the code for tokens and retrieves user info
6. **Session:** A session is created linking the authenticated identity to the platform user

Supported providers (type `OAuthProvider`): `"bankid"`, `"vipps"`, `"google"`, `"azure"`

### Magic Link Flow

1. User requests a magic link by providing their email
2. `createMagicLink` generates a token and stores it in `magicLinks` with expiration
3. An email is sent to the user with a link containing the token
4. User clicks the link, client calls `consumeMagicLink` with the token
5. Token is validated, marked consumed, and a session is created

### Demo Tokens

For development and testing, demo tokens provide instant authentication:

1. Admin creates a demo token via `createDemoToken` linked to a specific tenant and user
2. Token is stored in `authDemoTokens` with a hashed value
3. Users authenticate by providing the token key
4. `validateDemoToken` looks up the token and creates a session

### Important Notes

- `ctx.auth.getUserIdentity()` always returns `null` because the app does not use Convex's built-in auth
- Use `requireActiveUser(ctx, userId)` from `_shared/lib/auth.ts` to validate users
- Facade functions accept `userId` as an explicit argument rather than extracting it from auth context

---

## 3. Multi-Tenancy

Tenant isolation is the most critical security invariant in the platform. Every query and mutation must be scoped to a tenant.

### How Tenant Isolation Works

**At the function level (not database level).** Convex does not support database-level tenant isolation. Instead, every function enforces tenant scoping:

1. **Component functions** receive `tenantId` as a `v.string()` argument and filter using `withIndex("by_tenant", q => q.eq("tenantId", args.tenantId))`

2. **Facade functions** receive `tenantId` as `v.id("tenants")` (typed ID) and convert to string when calling components

3. **Core table queries** use `withIndex("by_tenant", q => q.eq("tenantId", tenantId))` directly

### Row-Level Security (RLS)

For core tables, RLS rules in `_shared/lib/rls.ts` provide an additional layer:

```typescript
const rules = {
    tenants: {
        read: async (_, tenant) => tenant._id === tenantId,   // Only own tenant
        insert: async () => false,                              // No direct inserts
        modify: async () => false,                              // No direct modifications
    },
    users: {
        read: async (_, user) => user.tenantId === tenantId,   // Same tenant
        modify: async (_, user) => identity?.subject === user.authUserId,  // Only self
    },
    organizations: {
        read: async (_, org) => org.tenantId === tenantId,     // Same tenant
        modify: async (_, org) => org.tenantId === tenantId,   // Same tenant
    },
    // ... same pattern for tenantUsers, custodyGrants, custodySubgrants
};
```

Default policy is **deny** -- any table not explicitly listed is inaccessible.

### Client-Side Tenant Context

The `TenantProvider` in `@xalabaas/app-shell` establishes the current tenant context:

1. Determines tenant from the URL domain, slug, or user's primary tenant
2. Provides `useTenantId()` hook (from `features/tenant-config/hooks/use-tenant-id`) to all descendant components
3. All SDK hooks automatically include the tenant ID in their queries

### Tenant Data Flow

```
Browser -> TenantProvider (determines tenantId)
  -> SDK Hook (use-bookings, etc.)
    -> Facade Function (api.domain.bookings.list)
      -> args: { tenantId: v.id("tenants") }
        -> Component Function (components.bookings.queries.list)
          -> args: { tenantId: v.string() }
            -> ctx.db.query("bookings").withIndex("by_tenant", ...)
```

---

## 4. RBAC (Role-Based Access Control)

The RBAC system provides role definitions with permission arrays and user-role bindings, all scoped to a tenant.

### Role System

Roles are defined in the `rbac` component's `roles` table. Each role has:

- A **name** (e.g., "admin", "manager", "member")
- A **permissions** array (e.g., `["booking:read", "booking:write", "resource:read"]`)
- An **isSystem** flag (system roles cannot be deleted)
- An **isDefault** flag (assigned automatically to new users)

### Permission Strings

Permissions follow the pattern `{resource}:{action}`:

| Permission | Description |
|------------|-------------|
| `tenant:read`, `tenant:write`, `tenant:admin` | Tenant management |
| `user:read`, `user:write`, `user:invite`, `user:delete` | User management |
| `resource:read`, `resource:write`, `resource:delete`, `resource:publish` | Resource management |
| `booking:read`, `booking:write`, `booking:approve`, `booking:cancel` | Booking management |
| `org:read`, `org:write`, `org:admin` | Organization management |
| `rbac:read`, `rbac:write` | Role management |
| `module:install`, `module:configure` | Module management |
| `billing:read`, `billing:write` | Billing access |
| `reports:read`, `reports:export` | Report access |

### Permission Checking

**Server-side** (in facade functions):

```typescript
// Check via RBAC component
const result = await ctx.runQuery(components.rbac.queries.checkPermission, {
    userId: userId as string,
    tenantId: tenantId as string,
    permission: "booking:approve",
});
```

**Client-side** (in React components):

```tsx
import { RequirePermission } from "@xalabaas/app-shell";

function AdminPanel() {
    return (
        <RequirePermission permission="tenant:admin">
            <AdminContent />
        </RequirePermission>
    );
}
```

### User Permission Resolution

A user's effective permissions are the **union** of all permissions from all their assigned roles. The `getUserPermissions` query returns the full array:

```typescript
const permissions = await ctx.runQuery(components.rbac.queries.getUserPermissions, {
    userId: userId as string,
    tenantId: tenantId as string,
});
// Returns: ["booking:read", "booking:write", "resource:read", ...]
```

---

## 5. Module Gating

Module gating controls which components are available to each tenant. It operates at the `componentRegistry` table level.

### How It Works

1. **Registration:** Components are seeded into `componentRegistry` per tenant (via `convex/seedComponents.ts`)
2. **Checking:** Facade functions call `hasModuleEnabled()` before delegating to component functions
3. **Blocking:** If a module is not enabled, the facade returns an error or empty result

### Server-Side: `hasModuleEnabled()`

From `_shared/lib/componentMiddleware.ts`:

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

### Client-Side: `RequireModule`

From `@xalabaas/app-shell`:

```tsx
import { RequireModule } from "@xalabaas/app-shell";

function SeasonalLeasesPage() {
    return (
        <RequireModule moduleId="seasons">
            <SeasonsContent />
        </RequireModule>
    );
}
```

### Component Registry Fields

The `componentRegistry` table tracks per-tenant state:

- `isInstalled` -- Whether the component code is deployed
- `isEnabled` -- Whether it is active for the tenant (can be toggled)
- `isCore` -- Whether the component can be disabled (core components cannot)
- `requires` -- Dependencies on other components
- `conflicts` -- Components that cannot be enabled simultaneously

---

## 6. Feature Flags

XalaBaaS uses a **two-tier** feature flag system:

### Tier 1: Module Gating (componentRegistry)

Coarse-grained, per-component enablement. Controls whether an entire feature module is available. Checked via `hasModuleEnabled()`.

### Tier 2: Fine-Grained Flags (tenant-config component)

Per-tenant feature flags with targeting rules. Managed through the `tenant-config` component's `flagDefinitions` and `flagRules` tables.

#### Flag Definitions

Each flag has:
- **key** -- Unique identifier (e.g., `"advanced-analytics"`, `"beta-ui"`)
- **type** -- Value type: `"boolean"`, `"string"`, or `"number"`
- **defaultValue** -- Fallback value when no targeting rule matches
- **isActive** -- Master toggle for the flag

#### Targeting Rules

Rules allow different flag values for different targets:

| targetType | targetId | Purpose |
|------------|----------|---------|
| `"tenant"` | tenant ID | Per-tenant overrides |
| `"organization"` | org ID | Per-organization overrides |
| `"user"` | user ID | Per-user overrides (beta access, A/B testing) |
| `"role"` | role name | Per-role overrides |

Rules have a **priority** field. Higher priority rules take precedence.

#### Flag Evaluation

**Server-side** (via `hasFeatureFlag()` from `_shared/lib/componentMiddleware.ts`):

```typescript
import { hasFeatureFlag } from "../_shared/lib/componentMiddleware";

// Basic check
const enabled = await hasFeatureFlag(ctx, tenantId, "advanced-analytics");

// With targeting context
const userEnabled = await hasFeatureFlag(ctx, tenantId, "beta-ui", "user", userId);
```

Internally, this calls `components.tenantConfig.queries.evaluateFlag` which:
1. Looks up the flag definition by key
2. Checks if the flag is active
3. Evaluates all matching targeting rules, sorted by priority
4. Returns the highest-priority matching rule's value, or the default

**Client-side** (via `use-feature-flags` hook):

```typescript
import { useFeatureFlag } from "@xalabaas/sdk";

function AnalyticsDashboard() {
    const { value: isAdvanced } = useFeatureFlag("advanced-analytics");

    if (!isAdvanced) return <BasicDashboard />;
    return <AdvancedDashboard />;
}
```

---

## 7. Audit System

Every mutation across the platform creates an audit entry. The audit system uses the `audit` component with a polymorphic `auditLog` table.

### How Audit Logging Works

1. **Facade mutations** call `components.audit.functions.create` after the primary operation
2. The audit entry records: who (userId, userEmail, userName), what (entityType, entityId, action), and the state change (previousState, newState, changedFields)
3. The `sourceComponent` field identifies which component triggered the audit entry

### Audit Entry Structure

```typescript
{
    tenantId: "tenant123",
    userId: "user456",
    userEmail: "user@example.com",
    userName: "John Doe",
    entityType: "booking",              // Polymorphic entity type
    entityId: "booking789",             // ID of the affected entity
    action: "approved",                 // What happened
    previousState: { status: "pending" },
    newState: { status: "confirmed" },
    changedFields: ["status", "approvedBy", "approvedAt"],
    details: { approvalNotes: "..." },
    reason: "Met all requirements",
    sourceComponent: "bookings",
    timestamp: 1704067200000,
}
```

### Entity Types

The `entityType` field is a free-form string. Common values:

| entityType | Source |
|------------|--------|
| `booking` | bookings component |
| `resource` | resources component |
| `user` | users (core table) |
| `organization` | organizations (core table) |
| `review` | reviews component |
| `role` | rbac component |
| `season` | seasons component |
| `payment` | billing component |
| `invoice` | billing component |
| `notification` | notifications component |
| `integration` | integrations component |

### Querying Audit Entries

The audit component provides several query patterns:

```typescript
// All entries for a tenant
await ctx.runQuery(components.audit.functions.listForTenant, {
    tenantId, entityType: "booking", limit: 50
});

// Entries for a specific entity
await ctx.runQuery(components.audit.functions.listByEntity, {
    entityType: "resource", entityId: "res123"
});

// Entries by a specific user
await ctx.runQuery(components.audit.functions.listByUser, {
    userId: "user456", limit: 20
});

// Entries by action type
await ctx.runQuery(components.audit.functions.listByAction, {
    tenantId, action: "deleted", limit: 100
});

// Summary statistics
await ctx.runQuery(components.audit.functions.getSummary, {
    tenantId, periodStart, periodEnd
});
```

---

## 8. Event Bus

Components communicate through the **outbox pattern**, using the `outboxEvents` core table. This decouples components and enables the plug-and-play architecture.

### Architecture

```
Facade Mutation
  -> Primary operation (e.g., create booking)
  -> emitEvent(ctx, "bookings.booking.created", tenantId, "bookings", { bookingId })
    -> INSERT into outboxEvents (status: "pending")

Event Worker (processEvents)
  -> SELECT FROM outboxEvents WHERE status = "pending"
  -> For each event:
    -> Look up subscribers from componentRegistry
    -> Dispatch to matching subscriber handlers
    -> Mark as "processed"
    -> On failure: increment retryCount, move to "dead_letter" after maxRetries
```

### Topic Format

All topics follow `{component}.{entity}.{action}`:

```
bookings.booking.created
bookings.booking.approved
reviews.review.moderated
billing.payment.completed
resources.resource.deleted
```

### Emitting Events

From facade mutations, use the `emitEvent()` helper:

```typescript
import { emitEvent } from "../../_shared/lib/eventBus";

// In a facade mutation handler:
await emitEvent(ctx, "bookings.booking.created", tenantId as string, "bookings", {
    bookingId: booking._id,
    resourceId,
    userId,
});
```

### Event Lifecycle

| Status | Description |
|--------|-------------|
| `pending` | Event created, awaiting processing |
| `processing` | Currently being dispatched to subscribers |
| `processed` | Successfully delivered to all subscribers |
| `failed` | Processing failed, will be retried |
| `dead_letter` | Failed after maxRetries (default: 3), needs manual intervention |

### Dead Letter Management

Events that exhaust their retry budget move to `dead_letter` status:

```typescript
// List dead letters
const deadLetters = await ctx.runQuery(internal.lib.eventBus.listDeadLetters, {
    tenantId, limit: 100
});

// Retry a dead letter
await ctx.runMutation(internal.lib.eventBus.retryDeadLetter, {
    eventId: deadLetter._id
});
```

### Cleanup

Processed events are cleaned up periodically (default: events older than 7 days):

```typescript
await ctx.runMutation(internal.lib.eventBus.cleanupProcessed, {
    olderThanMs: 7 * 24 * 60 * 60 * 1000,  // 7 days
    batchSize: 100,
});
```

### Subscription Map

This table shows which components subscribe to which events:

| Event Topic | Subscribers |
|-------------|-------------|
| `bookings.booking.created` | analytics, messaging, notifications |
| `bookings.booking.approved` | analytics, billing, notifications |
| `bookings.booking.rejected` | notifications |
| `bookings.booking.cancelled` | addons, analytics, billing |
| `messaging.message.sent` | notifications |
| `resources.resource.deleted` | addons, bookings, catalog, pricing, reviews, seasons, user-prefs |
| `seasons.allocation.created` | bookings |

---

## 9. Rate Limiting

Rate limiting protects the platform from abuse and ensures fair resource usage. It uses `convex-helpers/server/rateLimit` with two algorithms: token bucket and fixed window.

### Rate Limit Definitions

Defined in `_shared/lib/rateLimits.ts`:

| Name | Algorithm | Rate | Period | Capacity | Scope |
|------|-----------|------|--------|----------|-------|
| `createBooking` | token bucket | 10/min | 60s | 20 burst | per-tenant |
| `cancelBooking` | token bucket | 5/min | 60s | 10 burst | per-tenant |
| `createReview` | token bucket | 5/min | 60s | 10 burst | per-user |
| `moderateReview` | token bucket | 20/min | 60s | 50 burst | per-user |
| `sendMessage` | token bucket | 20/min | 60s | 50 burst | per-user |
| `loginAttempt` | fixed window | 5/5min | 300s | -- | per-IP |
| `passwordReset` | fixed window | 3/hour | 3600s | -- | per-user |
| `magicLinkRequest` | fixed window | 5/10min | 600s | -- | per-user |
| `bulkExport` | token bucket | 1/min | 60s | 3 burst | per-tenant |
| `bulkImport` | token bucket | 1/min | 60s | 2 burst | per-tenant |
| `apiGeneral` | token bucket | 100/min | 60s | 200 burst | per-tenant |
| `createNotification` | token bucket | 30/min | 60s | 60 burst | per-user |
| `searchQuery` | token bucket | 30/min | 60s | 60 burst | per-tenant |

### Token Bucket vs Fixed Window

**Token bucket** allows burst traffic up to `capacity`, then throttles to `rate` per `period`. Good for APIs with occasional spikes.

**Fixed window** enforces a strict count within a time window. Good for security-sensitive operations like login attempts.

### Enforcement

Rate limits are enforced at the **facade level** using `withRateLimit()`:

```typescript
import { withRateLimit } from "../../_shared/lib/componentMiddleware";
import { rateLimitKeys } from "../../_shared/lib/rateLimits";

export const createBooking = mutation({
    args: { tenantId: v.id("tenants"), ... },
    handler: async (ctx, { tenantId, ... }) => {
        // Enforce rate limit before any work
        await withRateLimit(ctx, "createBooking", rateLimitKeys.tenant(tenantId as string));

        // Proceed with booking creation...
    },
});
```

### Key Builders

The `rateLimitKeys` object provides consistent key formatting:

```typescript
rateLimitKeys.tenant(tenantId)           // "tenant:{tenantId}"
rateLimitKeys.user(userId)               // "user:{userId}"
rateLimitKeys.tenantUser(tenantId, userId) // "tenant:{tenantId}:user:{userId}"
rateLimitKeys.ip(ipAddress)              // "ip:{ipAddress}"
```

### Rate Limit Functions

```typescript
import { rateLimit, checkRateLimit, resetRateLimit } from "../../_shared/lib/rateLimits";

// Consume a token (throws on limit exceeded when throws: true)
await rateLimit(ctx, { name: "createBooking", key: rateLimitKeys.tenant(tenantId), throws: true });

// Check without consuming (read-only)
const { ok, retryAt } = await checkRateLimit(ctx, { name: "createBooking", key });

// Reset a rate limit bucket (admin operation)
await resetRateLimit(ctx, { name: "loginAttempt", key: rateLimitKeys.ip("1.2.3.4") });
```

When a rate limit is exceeded with `throws: true`, the error follows RFC 7807 format with a `retryAt` timestamp.
