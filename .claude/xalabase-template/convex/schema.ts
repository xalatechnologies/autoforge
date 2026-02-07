import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { rateLimitTables } from "convex-helpers/server/rateLimit";

// =============================================================================
// CORE SCHEMA — Tables that remain at app level
//
// All domain tables have been migrated to isolated Convex components.
// Only platform-level tables shared across all components remain here.
// =============================================================================

export default defineSchema({
    // ===========================================================================
    // RATE LIMITING (convex-helpers)
    // ===========================================================================
    ...rateLimitTables,

    // ===========================================================================
    // IDENTITY & TENANCY (5 tables)
    // ===========================================================================

    tenants: defineTable({
        name: v.string(),
        slug: v.string(),
        domain: v.optional(v.string()),
        settings: v.any(),
        status: v.union(
            v.literal("active"),
            v.literal("suspended"),
            v.literal("pending"),
            v.literal("deleted")
        ),
        seatLimits: v.any(),
        featureFlags: v.any(),
        enabledCategories: v.array(v.string()),
        deletedAt: v.optional(v.number()),
    })
        .index("by_slug", ["slug"])
        .index("by_domain", ["domain"])
        .index("by_status", ["status"]),

    organizations: defineTable({
        tenantId: v.id("tenants"),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        type: v.string(),
        parentId: v.optional(v.id("organizations")),
        settings: v.any(),
        metadata: v.any(),
        status: v.union(
            v.literal("active"),
            v.literal("inactive"),
            v.literal("suspended"),
            v.literal("deleted")
        ),
        deletedAt: v.optional(v.number()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_slug", ["tenantId", "slug"])
        .index("by_parent", ["parentId"]),

    users: defineTable({
        authUserId: v.optional(v.string()),
        tenantId: v.optional(v.id("tenants")),
        organizationId: v.optional(v.id("organizations")),
        email: v.string(),
        name: v.optional(v.string()),
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        nin: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        role: v.string(),
        status: v.union(
            v.literal("active"),
            v.literal("inactive"),
            v.literal("invited"),
            v.literal("suspended"),
            v.literal("deleted")
        ),
        demoToken: v.optional(v.string()),
        metadata: v.any(),
        deletedAt: v.optional(v.number()),
        lastLoginAt: v.optional(v.number()),
    })
        .index("by_email", ["email"])
        .index("by_authUserId", ["authUserId"])
        .index("by_nin", ["nin"])
        .index("by_tenant", ["tenantId"])
        .index("by_status", ["status"])
        .index("by_demoToken", ["demoToken"]),

    tenantUsers: defineTable({
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        status: v.union(
            v.literal("active"),
            v.literal("invited"),
            v.literal("suspended"),
            v.literal("removed")
        ),
        invitedByUserId: v.optional(v.id("users")),
        invitedAt: v.optional(v.number()),
        joinedAt: v.optional(v.number()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_user", ["userId"])
        .index("by_tenant_user", ["tenantId", "userId"]),

    // ===========================================================================
    // RESOURCE CUSTODY (2 tables — stays core, fundamentally about ownership)
    // ===========================================================================

    custodyGrants: defineTable({
        tenantId: v.id("tenants"),
        resourceId: v.string(), // References resources component
        userId: v.id("users"),
        custodyType: v.string(),
        grantedBy: v.optional(v.id("users")),
        grantedAt: v.number(),
        expiresAt: v.optional(v.number()),
        notes: v.optional(v.string()),
        permissions: v.any(),
        isActive: v.boolean(),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_user", ["userId"]),

    custodySubgrants: defineTable({
        tenantId: v.id("tenants"),
        parentGrantId: v.id("custodyGrants"),
        resourceId: v.string(),
        userId: v.id("users"),
        subgrantType: v.string(),
        grantedBy: v.id("users"),
        grantedAt: v.number(),
        expiresAt: v.optional(v.number()),
        notes: v.optional(v.string()),
        permissions: v.any(),
        isActive: v.boolean(),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_parent_grant", ["parentGrantId"])
        .index("by_resource", ["resourceId"])
        .index("by_user", ["userId"]),

    // ===========================================================================
    // PLATFORM INFRASTRUCTURE (2 tables)
    // ===========================================================================

    // Event Bus — Outbox pattern for decoupled component communication
    outboxEvents: defineTable({
        topic: v.string(),
        tenantId: v.string(),
        sourceComponent: v.string(),
        payload: v.any(),
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("processed"),
            v.literal("failed"),
            v.literal("dead_letter")
        ),
        error: v.optional(v.string()),
        retryCount: v.number(),
        maxRetries: v.optional(v.number()),
        createdAt: v.number(),
        processedAt: v.optional(v.number()),
    })
        .index("by_status", ["status"])
        .index("by_topic", ["topic", "status"])
        .index("by_tenant", ["tenantId", "status"])
        .index("by_created", ["createdAt"]),

    // Component Registry — Maps component slots to implementations
    componentRegistry: defineTable({
        tenantId: v.id("tenants"),
        componentId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        category: v.string(),
        version: v.string(),
        contractVersion: v.string(),
        isCore: v.boolean(),
        isEnabled: v.boolean(),
        isInstalled: v.boolean(),
        hooks: v.optional(v.object({
            onInstall: v.optional(v.string()),
            onUninstall: v.optional(v.string()),
            onEnable: v.optional(v.string()),
            onDisable: v.optional(v.string()),
        })),
        subscribes: v.optional(v.array(v.string())),
        emits: v.optional(v.array(v.string())),
        requires: v.optional(v.array(v.string())),
        conflicts: v.optional(v.array(v.string())),
        features: v.optional(v.array(v.string())),
        metadata: v.optional(v.any()),
        installedAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_component", ["tenantId", "componentId"])
        .index("by_enabled", ["tenantId", "isEnabled"]),
});
