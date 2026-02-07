/**
 * Feature Flags Facade
 *
 * Thin facade that delegates to the tenant-config component for feature flag
 * operations. Preserves the `api.domain.featureFlags.*` paths for SDK hooks.
 *
 * Handles:
 *   - ID type conversion (typed Id<"tenants"> -> string for component)
 *   - Audit logging via audit component
 */

import { query, mutation } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

// =============================================================================
// QUERY FACADES
// =============================================================================

/**
 * List all feature flags for a tenant.
 */
export const listFlags = query({
    args: {
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, { tenantId }) => {
        return ctx.runQuery(components.tenantConfig.queries.listFlags, {
            tenantId: tenantId as string,
        });
    },
});

/**
 * Get a single feature flag by key.
 */
export const getFlag = query({
    args: {
        tenantId: v.id("tenants"),
        key: v.string(),
    },
    handler: async (ctx, { tenantId, key }) => {
        return ctx.runQuery(components.tenantConfig.queries.getFlag, {
            tenantId: tenantId as string,
            key,
        });
    },
});

/**
 * Evaluate a feature flag for a specific target.
 * Returns the resolved value (respects targeting rules).
 */
export const evaluateFlag = query({
    args: {
        tenantId: v.id("tenants"),
        key: v.string(),
        targetType: v.optional(v.string()),
        targetId: v.optional(v.string()),
    },
    handler: async (ctx, { tenantId, key, targetType, targetId }) => {
        return ctx.runQuery(components.tenantConfig.queries.evaluateFlag, {
            tenantId: tenantId as string,
            key,
            targetType,
            targetId,
        });
    },
});

/**
 * Evaluate all feature flags for a tenant, optionally targeting a specific entity.
 * Returns a map of flag key -> evaluation result.
 */
export const evaluateAllFlags = query({
    args: {
        tenantId: v.id("tenants"),
        targetType: v.optional(v.string()),
        targetId: v.optional(v.string()),
    },
    handler: async (ctx, { tenantId, targetType, targetId }) => {
        return ctx.runQuery(components.tenantConfig.queries.evaluateAllFlags, {
            tenantId: tenantId as string,
            targetType,
            targetId,
        });
    },
});

// =============================================================================
// MUTATION FACADES
// =============================================================================

/**
 * Create a new feature flag definition.
 */
export const createFlag = mutation({
    args: {
        tenantId: v.id("tenants"),
        key: v.string(),
        name: v.string(),
        type: v.string(),
        defaultValue: v.any(),
        description: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { tenantId, key, name, type, defaultValue, description, metadata }) => {
        const result = await ctx.runMutation(components.tenantConfig.mutations.createFlag, {
            tenantId: tenantId as string,
            key,
            name,
            type,
            defaultValue,
            description,
            metadata,
        });

        // Audit: flag creation
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: tenantId as string,
            userId: "system",
            entityType: "featureFlag",
            entityId: result.id,
            action: "created",
            newState: { key, name, type, defaultValue },
            sourceComponent: "tenant-config",
        });

        return result;
    },
});

/**
 * Update an existing feature flag.
 */
export const updateFlag = mutation({
    args: {
        tenantId: v.id("tenants"),
        id: v.string(),
        name: v.optional(v.string()),
        defaultValue: v.optional(v.any()),
        isActive: v.optional(v.boolean()),
        description: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { tenantId, id, name, defaultValue, isActive, description, metadata }) => {
        const result = await ctx.runMutation(components.tenantConfig.mutations.updateFlag, {
            id,
            name,
            defaultValue,
            isActive,
            description,
            metadata,
        });

        // Audit: flag update
        const updates = Object.fromEntries(
            Object.entries({ name, defaultValue, isActive, description, metadata })
                .filter(([_, val]) => val !== undefined)
        );
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: tenantId as string,
            userId: "system",
            entityType: "featureFlag",
            entityId: id,
            action: "updated",
            newState: updates,
            sourceComponent: "tenant-config",
        });

        return result;
    },
});

/**
 * Delete a feature flag and its associated rules.
 */
export const deleteFlag = mutation({
    args: {
        tenantId: v.id("tenants"),
        id: v.string(),
    },
    handler: async (ctx, { tenantId, id }) => {
        const result = await ctx.runMutation(components.tenantConfig.mutations.deleteFlag, {
            id,
        });

        // Audit: flag deletion
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: tenantId as string,
            userId: "system",
            entityType: "featureFlag",
            entityId: id,
            action: "deleted",
            sourceComponent: "tenant-config",
        });

        return result;
    },
});

/**
 * Create a targeting rule for a feature flag.
 * Rules override the flag's default value for specific targets (users, orgs, roles).
 */
export const createFlagRule = mutation({
    args: {
        tenantId: v.id("tenants"),
        flagId: v.string(),
        targetType: v.string(),
        targetId: v.string(),
        value: v.any(),
        priority: v.number(),
    },
    handler: async (ctx, { tenantId, flagId, targetType, targetId, value, priority }) => {
        const result = await ctx.runMutation(components.tenantConfig.mutations.createFlagRule, {
            tenantId: tenantId as string,
            flagId,
            targetType,
            targetId,
            value,
            priority,
        });

        // Audit: rule creation
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: tenantId as string,
            userId: "system",
            entityType: "flagRule",
            entityId: result.id,
            action: "created",
            newState: { flagId, targetType, targetId, value, priority },
            sourceComponent: "tenant-config",
        });

        return result;
    },
});

/**
 * Delete a targeting rule.
 */
export const deleteFlagRule = mutation({
    args: {
        tenantId: v.id("tenants"),
        id: v.string(),
    },
    handler: async (ctx, { tenantId, id }) => {
        const result = await ctx.runMutation(components.tenantConfig.mutations.deleteFlagRule, {
            id,
        });

        // Audit: rule deletion
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: tenantId as string,
            userId: "system",
            entityType: "flagRule",
            entityId: id,
            action: "deleted",
            sourceComponent: "tenant-config",
        });

        return result;
    },
});
