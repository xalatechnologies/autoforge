# Convex Component Architecture Rules

## v.id() Rule (CRITICAL)
- ONLY use v.id() for core schema tables: tenants, users, organizations, tenantUsers, custodyGrants, custodySubgrants
- ALL component table IDs in facade args MUST use v.string() (not v.id)
- This includes: resources, bookings, reviews, sessions, roles, payments, invoices, addons, categories, etc.

## File Structure
- Component files split into queries.ts + mutations.ts (max 300 lines each)
- All functions MUST have returns: validators
- Creates return { id: v.string() }, updates return { success: v.boolean() }

## Security
- All facade mutations check ctx.auth.getUserIdentity()
- Never expose secrets in query responses
- Batch fetch instead of N+1 queries
- Default pagination limit of 100 on all list queries
