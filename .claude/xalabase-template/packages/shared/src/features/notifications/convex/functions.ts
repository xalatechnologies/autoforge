/**
 * Notifications Component Functions
 *
 * Pure component implementation — operates only on its own tables.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// QUERIES
// =============================================================================

export const listByUser = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
        unreadOnly: v.optional(v.boolean()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { userId, limit = 50, unreadOnly = false }) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .take(limit);

        if (unreadOnly) {
            return notifications.filter((n) => !n.readAt);
        }

        return notifications;
    },
});

export const unreadCount = query({
    args: {
        userId: v.string(),
    },
    returns: v.object({ count: v.number() }),
    handler: async (ctx, { userId }) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("readAt"), undefined))
            .collect();

        return { count: notifications.length };
    },
});

export const get = query({
    args: {
        id: v.id("notifications"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const getPreferences = query({
    args: {
        userId: v.string(),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

// =============================================================================
// MUTATIONS
// =============================================================================

export const create = mutation({
    args: {
        tenantId: v.string(),
        userId: v.string(),
        type: v.string(),
        title: v.string(),
        body: v.optional(v.string()),
        link: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("notifications", {
            tenantId: args.tenantId,
            userId: args.userId,
            type: args.type,
            title: args.title,
            body: args.body,
            link: args.link,
            metadata: args.metadata ?? {},
        });

        return { id: id as string };
    },
});

export const markAsRead = mutation({
    args: {
        id: v.id("notifications"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, { readAt: Date.now() });
        return { success: true };
    },
});

export const markAllAsRead = mutation({
    args: {
        userId: v.string(),
    },
    returns: v.object({ success: v.boolean(), count: v.number() }),
    handler: async (ctx, { userId }) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("readAt"), undefined))
            .collect();

        for (const notification of notifications) {
            await ctx.db.patch(notification._id, { readAt: Date.now() });
        }

        return { success: true, count: notifications.length };
    },
});

export const remove = mutation({
    args: {
        id: v.id("notifications"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
        return { success: true };
    },
});

export const updatePreference = mutation({
    args: {
        tenantId: v.string(),
        userId: v.string(),
        channel: v.string(),
        category: v.string(),
        enabled: v.boolean(),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("channel"), args.channel),
                    q.eq(q.field("category"), args.category)
                )
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { enabled: args.enabled });
            return { id: existing._id as string };
        } else {
            const id = await ctx.db.insert("notificationPreferences", {
                tenantId: args.tenantId,
                userId: args.userId,
                channel: args.channel,
                category: args.category,
                enabled: args.enabled,
            });
            return { id: id as string };
        }
    },
});

// =============================================================================
// IMPORT FUNCTIONS (data migration)
// =============================================================================

/**
 * Import a notification record from the legacy table.
 * Used during data migration.
 */
export const importNotification = mutation({
    args: {
        tenantId: v.string(),
        userId: v.string(),
        type: v.string(),
        title: v.string(),
        body: v.optional(v.string()),
        link: v.optional(v.string()),
        readAt: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("notifications", { ...args, metadata: args.metadata ?? {} });
        return { id: id as string };
    },
});

/**
 * Import a notification preference record from the legacy table.
 * Used during data migration.
 */
export const importPreference = mutation({
    args: {
        tenantId: v.string(),
        userId: v.string(),
        channel: v.string(),
        category: v.string(),
        enabled: v.boolean(),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("notificationPreferences", { ...args });
        return { id: id as string };
    },
});
