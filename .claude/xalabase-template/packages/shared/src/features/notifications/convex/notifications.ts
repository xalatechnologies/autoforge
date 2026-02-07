/**
 * Notifications Facade
 *
 * Thin facade that delegates to the notifications component.
 * Preserves api.domain.notifications.* for SDK compatibility.
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";
import { requireActiveUser } from "../lib/auth";

// =============================================================================
// QUERY FACADES
// =============================================================================

export const listByUser = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
        unreadOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, { userId, limit, unreadOnly }) => {
        return ctx.runQuery(components.notifications.functions.listByUser, {
            userId: userId as string,
            limit,
            unreadOnly,
        });
    },
});

export const unreadCount = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, { userId }) => {
        return ctx.runQuery(components.notifications.functions.unreadCount, {
            userId: userId as string,
        });
    },
});

export const get = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.notifications.functions.get, { id });
    },
});

export const getPreferences = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, { userId }) => {
        return ctx.runQuery(components.notifications.functions.getPreferences, {
            userId: userId as string,
        });
    },
});

// =============================================================================
// MUTATION FACADES
// =============================================================================

export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        body: v.optional(v.string()),
        link: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.userId);

        return ctx.runMutation(components.notifications.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            type: args.type,
            title: args.title,
            body: args.body,
            link: args.link,
            metadata: args.metadata,
        });
    },
});

export const markAsRead = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.notifications.functions.markAsRead, { id });
    },
});

export const markAllAsRead = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, { userId }) => {
        await requireActiveUser(ctx, userId);

        return ctx.runMutation(components.notifications.functions.markAllAsRead, {
            userId: userId as string,
        });
    },
});

export const remove = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.notifications.functions.remove, { id });
    },
});

export const updatePreference = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        channel: v.string(),
        category: v.string(),
        enabled: v.boolean(),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.userId);

        return ctx.runMutation(components.notifications.functions.updatePreference, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            channel: args.channel,
            category: args.category,
            enabled: args.enabled,
        });
    },
});
