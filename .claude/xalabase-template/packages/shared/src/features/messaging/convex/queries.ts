/**
 * Messaging Component — Query Functions
 *
 * Read-only operations for conversations and messages.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// CONVERSATION QUERIES
// =============================================================================

export const listConversations = query({
    args: {
        userId: v.string(),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { userId, status, limit = 50 }) => {
        let conversations = await ctx.db
            .query("conversations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .take(limit);

        if (status) {
            conversations = conversations.filter((c) => c.status === status);
        }
        return conversations;
    },
});

export const getConversation = query({
    args: { id: v.id("conversations") },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const listConversationsByAssignee = query({
    args: {
        assigneeId: v.string(),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { assigneeId, status, limit = 50 }) => {
        let conversations = await ctx.db
            .query("conversations")
            .withIndex("by_assignee", (q) => q.eq("assigneeId", assigneeId))
            .order("desc")
            .take(limit);

        if (status) {
            conversations = conversations.filter((c) => c.status === status);
        }
        return conversations;
    },
});

export const unreadMessageCount = query({
    args: { userId: v.string() },
    returns: v.object({ count: v.number() }),
    handler: async (ctx, { userId }) => {
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        return { count: total };
    },
});

// =============================================================================
// MESSAGE QUERIES
// =============================================================================

export const listMessages = query({
    args: {
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { conversationId, limit = 100 }) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
            .order("asc")
            .take(limit);
    },
});
