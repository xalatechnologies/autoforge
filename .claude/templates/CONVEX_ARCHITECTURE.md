# Convex Backend Template Architecture

AutoForge generates projects using **Convex** as the reactive backend. This document describes the template patterns and verification requirements.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite (port 5173) |
| Backend | Convex (reactive, serverless) |
| Database | Convex document database |
| Realtime | WebSocket subscriptions (automatic) |
| Helpers | `convex-helpers` (npm) |

---

## Project Structure

Generated projects follow this structure:

```
project/
├── convex/
│   ├── _generated/          # Auto-generated types (do not edit)
│   ├── schema.ts            # Table definitions with v.* validators
│   ├── domain/              # Domain-specific queries/mutations
│   │   └── items.ts         # Example: item CRUD operations
│   └── lib/                 # Shared utilities
│       ├── functions.ts     # Custom function builders
│       └── validators.ts    # Reusable validators
├── src/
│   ├── main.tsx             # ConvexProvider setup
│   └── components/          # React components with useQuery/useMutation
├── .env.local               # VITE_CONVEX_URL (auto-generated)
├── package.json             # convex, convex-helpers dependencies
├── init.sh                  # Setup script
└── README.md                # Project documentation
```

---

## Convex Patterns

### Schema Definition (`convex/schema.ts`)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_email", ["email"]),

  items: defineTable({
    userId: v.id("users"),
    title: v.string(),
    status: v.union(v.literal("draft"), v.literal("active")),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
```

### Query Pattern

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("items")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .collect();
    }
    return await ctx.db.query("items").collect();
  },
});
```

### Mutation Pattern

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", {
      ...args,
      status: "draft",
    });
  },
});
```

### React Integration

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function ItemList() {
  const items = useQuery(api.domain.items.list);
  const createItem = useMutation(api.domain.items.create);

  if (items === undefined) return <Loading />;
  
  return (
    <ul>
      {items.map((item) => (
        <li key={item._id}>{item.title}</li>
      ))}
    </ul>
  );
}
```

---

## convex-helpers Integration

Install with: `npm install convex-helpers`

### Rate Limiting

```typescript
import { rateLimitTables } from "convex-helpers/server/rateLimit";

export default defineSchema({
  ...rateLimitTables,  // Adds rateLimits and rateLimitShards tables
  // ... your tables
});
```

### Custom Function Builders

```typescript
import { customQuery, customMutation } from "convex-helpers/server/customFunctions";

// Create tenant-aware functions
export const tenantQuery = customQuery(query, {
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // Inject tenant context automatically
  },
});
```

---

## Infrastructure Features (0-4)

These MUST pass before any functional features:

| Index | Feature | Verification |
|-------|---------|--------------|
| 0 | Convex dev server starts | `npx convex dev` succeeds |
| 1 | Schema deployed | Tables visible in dashboard |
| 2 | Data persists | Create → restart dev → data exists |
| 3 | No mock patterns | `grep` returns empty |
| 4 | Real database queries | Function logs show operations |

---

## init.sh Script

```bash
#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Deploying Convex schema..."
npx convex dev --once

echo "Starting Convex dev server..."
npx convex dev &

echo "Starting Vite dev server..."
npm run dev
```

---

## Verification Commands

### Mock Data Detection

```bash
# Check for mock patterns
grep -r "mockData\|fakeData\|dummyData" --include="*.ts" src/ convex/
grep -r "return \[\]" --include="*.ts" convex/
grep -E "json-server|miragejs|msw" package.json
```

### Persistence Test

1. Create test data via mutation
2. Stop Convex dev server (Ctrl+C)
3. Restart: `npx convex dev`
4. Verify data still exists in useQuery or dashboard

---

## Reference: xalabase Architecture

For production patterns, see [xalabase/convex](file:///Volumes/Development/Experimental/xalabase/convex):

- 17 isolated Convex components
- Domain-driven facades (`domain/`)
- Event bus (outbox pattern)
- Tenant-aware function builders
- Row-level security
