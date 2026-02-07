/**
 * Module Registry Facade
 *
 * Thin facade for managing the component registry (module enablement).
 * Queries the core `componentRegistry` table directly since it lives at
 * app level, not inside a component.
 *
 * Preserves the `api.domain.moduleRegistry.*` paths for SDK hooks.
 *
 * Handles:
 *   - Module listing, enable/disable with core-module protection
 *   - Audit logging via audit component
 */

import { query, mutation } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

// =============================================================================
// QUERY FACADES
// =============================================================================

/**
 * List all registered modules for a tenant.
 * Returns the full component registry entries including metadata,
 * hooks, and dependency information.
 */
export const listModules = query({
    args: {
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, { tenantId }) => {
        return ctx.db
            .query("componentRegistry")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();
    },
});

/**
 * Get a single module's registry entry by its component ID.
 */
export const getModule = query({
    args: {
        tenantId: v.id("tenants"),
        moduleId: v.string(),
    },
    handler: async (ctx, { tenantId, moduleId }) => {
        const entry = await ctx.db
            .query("componentRegistry")
            .withIndex("by_component", (q) =>
                q.eq("tenantId", tenantId).eq("componentId", moduleId)
            )
            .first();

        if (!entry) {
            throw new Error(`Module "${moduleId}" not found for this tenant`);
        }

        return entry;
    },
});

/**
 * Enable a module for a tenant.
 * Both core and non-core modules can be enabled.
 */
export const enableModule = mutation({
    args: {
        tenantId: v.id("tenants"),
        moduleId: v.string(),
    },
    handler: async (ctx, { tenantId, moduleId }) => {
        const entry = await ctx.db
            .query("componentRegistry")
            .withIndex("by_component", (q) =>
                q.eq("tenantId", tenantId).eq("componentId", moduleId)
            )
            .first();

        if (!entry) {
            throw new Error(`Module "${moduleId}" not found for this tenant`);
        }

        if (!entry.isInstalled) {
            throw new Error(`Cannot enable module "${moduleId}" — it is not installed.`);
        }

        if (entry.isEnabled) return { success: true }; // Idempotent

        await ctx.db.patch(entry._id, {
            isEnabled: true,
            updatedAt: Date.now(),
        });

        // Audit: module enablement
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: tenantId as string,
            userId: "system",
            entityType: "module",
            entityId: moduleId,
            action: "enabled",
            previousState: { isEnabled: entry.isEnabled },
            newState: { isEnabled: true },
            sourceComponent: "tenant-config",
        });

        return { success: true };
    },
});

/**
 * Disable a module for a tenant.
 * Core modules cannot be disabled — they are essential platform infrastructure.
 */
export const disableModule = mutation({
    args: {
        tenantId: v.id("tenants"),
        moduleId: v.string(),
    },
    handler: async (ctx, { tenantId, moduleId }) => {
        const entry = await ctx.db
            .query("componentRegistry")
            .withIndex("by_component", (q) =>
                q.eq("tenantId", tenantId).eq("componentId", moduleId)
            )
            .first();

        if (!entry) {
            throw new Error(`Module "${moduleId}" not found for this tenant`);
        }

        if (entry.isCore) {
            throw new Error(
                `Cannot disable core module "${moduleId}". Core modules are essential platform infrastructure.`
            );
        }

        if (!entry.isEnabled) return { success: true }; // Idempotent

        await ctx.db.patch(entry._id, {
            isEnabled: false,
            updatedAt: Date.now(),
        });

        // Audit: module disablement
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: tenantId as string,
            userId: "system",
            entityType: "module",
            entityId: moduleId,
            action: "disabled",
            previousState: { isEnabled: entry.isEnabled },
            newState: { isEnabled: false },
            sourceComponent: "tenant-config",
        });

        return { success: true };
    },
});

/**
 * List only the enabled and installed module IDs for a tenant.
 * Returns a flat string array of componentId values.
 * This is the primary query consumed by TenantProvider to gate features.
 */
export const listEnabledModuleIds = query({
    args: {
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, { tenantId }) => {
        const entries = await ctx.db
            .query("componentRegistry")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        return entries
            .filter((entry) => entry.isEnabled && entry.isInstalled)
            .map((entry) => entry.componentId);
    },
});
