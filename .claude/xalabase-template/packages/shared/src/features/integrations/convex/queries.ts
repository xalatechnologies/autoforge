/**
 * Integrations Component — Query Functions
 *
 * Read-only operations for integration configs, webhooks, and sync logs.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// CONFIG QUERIES
// =============================================================================

/**
 * Get a specific integration config by tenant and type.
 */
export const getConfig = query({
    args: {
        tenantId: v.string(),
        integrationType: v.string(),
    },
    returns: v.any(),
    handler: async (ctx, { tenantId, integrationType }) => {
        const config = await ctx.db
            .query("integrationConfigs")
            .withIndex("by_type", (q) =>
                q.eq("tenantId", tenantId).eq("integrationType", integrationType)
            )
            .first();

        if (!config) return null;

        // Mask sensitive fields before returning
        return {
            ...config,
            apiKey: config.apiKey ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}` : undefined,
            secretKey: config.secretKey ? "••••••••" : undefined,
            webhookSecret: config.webhookSecret ? "••••••••" : undefined,
        };
    },
});

/**
 * List all integration configs for a tenant.
 */
export const listConfigs = query({
    args: {
        tenantId: v.string(),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, limit = 100 }) => {
        const configs = await ctx.db
            .query("integrationConfigs")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .take(limit);

        // Mask sensitive fields before returning
        return configs.map((config) => ({
            ...config,
            apiKey: config.apiKey ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}` : undefined,
            secretKey: config.secretKey ? "••••••••" : undefined,
            webhookSecret: config.webhookSecret ? "••••••••" : undefined,
        }));
    },
});

// =============================================================================
// WEBHOOK QUERIES
// =============================================================================

/**
 * List webhook registrations, optionally filtered by integration.
 */
export const listWebhooks = query({
    args: {
        tenantId: v.string(),
        integrationId: v.optional(v.id("integrationConfigs")),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, integrationId, limit = 100 }) => {
        if (integrationId) {
            return await ctx.db
                .query("webhookRegistrations")
                .withIndex("by_integration", (q) =>
                    q.eq("integrationId", integrationId)
                )
                .take(limit);
        }

        return await ctx.db
            .query("webhookRegistrations")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .take(limit);
    },
});

// =============================================================================
// SYNC LOG QUERIES
// =============================================================================

/**
 * List sync logs, optionally filtered by integration.
 */
export const listSyncLogs = query({
    args: {
        tenantId: v.string(),
        integrationId: v.optional(v.id("integrationConfigs")),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, integrationId, limit = 50 }) => {
        if (integrationId) {
            return await ctx.db
                .query("syncLogs")
                .withIndex("by_integration", (q) =>
                    q.eq("integrationId", integrationId)
                )
                .order("desc")
                .take(limit);
        }

        return await ctx.db
            .query("syncLogs")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .order("desc")
            .take(limit);
    },
});

/**
 * Get a single sync log entry by ID.
 */
export const getSyncLog = query({
    args: {
        id: v.id("syncLogs"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const log = await ctx.db.get(id);
        if (!log) throw new Error("Sync log not found");
        return log;
    },
});
