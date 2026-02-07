# Domain Customization Guide

This directory contains the domain-specific business logic for your application.

## Current Domain Files (Example)

The existing files in this directory are for reference only. Replace them with your domain logic:

| File | Purpose | Action |
|------|---------|--------|
| `bookings.ts` | Booking management | Replace with your entity |
| `pricing.ts` | Pricing engine | Replace with your entity |
| `search.ts` | Search functionality | Replace with your entity |
| `messaging.ts` | User messaging | Keep or replace |
| `reviews.ts` | Review system | Replace with your entity |
| etc. | ... | ... |

## How to Create Your Domain

### 1. Identify Your Entities

What are the core business objects in your application?

- Example: `items`, `orders`, `products`, `tasks`, etc.

### 2. Create Domain Files

Each entity gets its own file:

```typescript
// convex/domain/items.ts
import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// List items for a tenant
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

// Create an item
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", {
      ...args,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

// Update an item
export const update = mutation({
  args: {
    id: v.id("items"),
    title: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete an item
export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

### 3. Add Schema Tables

Update `convex/schema.ts` to add your domain tables in the components:

```typescript
// In convex/components/items/schema.ts
export default defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  description: v.optional(v.string()),
  status: v.union(v.literal("draft"), v.literal("active")),
  createdAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_status", ["tenantId", "status"]);
```

### 4. Wire SDK Hooks

Add hooks to `packages/sdk/`:

```typescript
// packages/sdk/src/hooks/useItems.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@xalabaas/convex";

export function useItems(tenantId: string) {
  return useQuery(api.domain.items.list, { tenantId });
}

export function useCreateItem() {
  return useMutation(api.domain.items.create);
}
```

## Best Practices

1. **Tenant Scoping**: Always include `tenantId` in your queries for multi-tenant isolation
2. **Use Indexes**: Define indexes for common query patterns
3. **Validation**: Use `convex/lib/validators.ts` for reusable validators
4. **CRUD Helpers**: Use `convex/lib/crud.ts` for standard CRUD operations
5. **RLS**: Use `convex/components/rls/` for row-level security

## Reference Files

- `convex/lib/functions.ts` - Custom function builders
- `convex/lib/validators.ts` - Reusable validators
- `convex/lib/crud.ts` - CRUD helper utilities
- `convex/auth/` - Authentication patterns
