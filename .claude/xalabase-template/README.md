# xalabase Template

Production-ready Convex + React monorepo template based on the xalabase architecture.

## Thin App Architecture

| Layer | Contains | Package |
|-------|----------|---------|
| **SDK** | Hooks, Convex API wrappers, localization | `@xalabaas/sdk` |
| **Shared** | Types, services, utilities | `@xala/shared` |
| **Design System** | ALL styling, themes, CSS | `@xala/ds`, `@xala/ds-themes` |
| **Apps** | ONLY routes (thin shells) | `apps/*` |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev
```

## Structure

```
├── convex/                     # Convex backend
│   ├── auth/                   # Authentication, sessions
│   ├── lib/                    # CRUD, validators, custom functions
│   ├── domain/                 # 👈 CUSTOMIZE: Your business logic
│   ├── components/             # Convex components (RLS, rate limiting)
│   └── schema.ts               # 👈 CUSTOMIZE: Your tables
├── packages/
│   ├── sdk/                    # Client SDK (hooks, API)
│   ├── ds/                     # Design system components
│   ├── ds-themes/              # Themes
│   ├── i18n/                   # Localization
│   ├── shared/                 # Types, services, utilities
│   └── app-shell/              # Layout, navigation
├── apps/
│   ├── web/                    # Public marketing (thin routes)
│   ├── backoffice/             # Admin panel (thin routes)
│   └── minside/                # User portal (thin routes)
└── package.json
```

## Customization Guide

### 1. Define Your Domain Schema (`convex/schema.ts`)

Replace the domain-specific tables with your entities:

```typescript
// Example: Replace "bookings" with your domain
items: defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  status: v.union(v.literal("draft"), v.literal("active")),
})
  .index("by_tenant", ["tenantId"])
```

### 2. Create Domain Functions (`convex/domain/`)

Each entity gets its own file with queries and mutations:

```typescript
// convex/domain/items.ts
export const list = query({...})
export const create = mutation({...})
export const update = mutation({...})
export const remove = mutation({...})
```

### 3. Add SDK Hooks (`packages/sdk/`)

Wrap your Convex functions in typed hooks:

```typescript
// packages/sdk/src/hooks/useItems.ts
export function useItems() {
  return useQuery(api.domain.items.list);
}
```

### 4. Create Thin Routes (`apps/`)

Apps only contain route definitions that compose shared components:

```tsx
// apps/backoffice/src/routes/items.tsx
import { ItemsPage } from "@xala/shared";
export default function ItemsRoute() {
  return <ItemsPage />;
}
```

## What's Included (Keep 100%)

- ✅ **convex/auth/** - Session management, authentication
- ✅ **convex/lib/** - CRUD helpers, validators, custom functions
- ✅ **convex/components/** - 17 Convex components (RLS, rate limiting, etc.)
- ✅ **packages/sdk/** - Hooks, Convex wrappers, localization
- ✅ **packages/ds/** - 107 design system components
- ✅ **packages/i18n/** - Full i18n setup with translations
- ✅ **packages/app-shell/** - Layout, navigation, sidebar

## What to Customize

- 🔄 **convex/domain/** - Replace with your business logic
- 🔄 **convex/schema.ts** - Keep core tables, add your domain tables
- 🔄 **convex/seeds.ts** - Your seed data
- 🔄 **apps/*/routes/** - Your route definitions
