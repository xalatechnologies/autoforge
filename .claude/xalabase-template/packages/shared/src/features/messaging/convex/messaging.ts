/**
 * Messaging Facade
 *
 * Delegates to the messaging component.
 * Enriches results with user data from core tables (names, avatars).
 * Preserves api.domain.messaging.* for SDK compatibility.
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { requireActiveUser } from "../../_shared/lib/auth";
import { rateLimit, rateLimitKeys } from "../../_shared/lib/rateLimits";

// =============================================================================
// QUERY FACADES
// =============================================================================

export const listConversations = query({
    args: {
        userId: v.id("users"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { userId, status, limit }) => {
        return ctx.runQuery(components.messaging.queries.listConversations, {
            userId: userId as string,
            status,
            limit,
        });
    },
});

export const getConversation = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        const conversation = await ctx.runQuery(
            components.messaging.queries.getConversation,
            { id }
        );
        if (!conversation) return null;

        // Enrich participants with user data from core tables
        const participantDetails = await Promise.all(
            (conversation.participants as string[]).map(async (pid) => {
                const user = await ctx.db.get(pid as Id<"users">);
                return user ? { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } : null;
            })
        );

        return {
            ...conversation,
            participantDetails: participantDetails.filter(Boolean),
        };
    },
});

export const listMessages = query({
    args: {
        conversationId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { conversationId, limit }) => {
        const messages = await ctx.runQuery(
            components.messaging.queries.listMessages,
            { conversationId, limit }
        );

        // Enrich with sender details from core tables
        return Promise.all(
            messages.map(async (m: any) => {
                const sender = m.senderId
                    ? await ctx.db.get(m.senderId as Id<"users">)
                    : null;
                return {
                    ...m,
                    senderName: sender?.name || "Unknown",
                    senderAvatar: sender?.avatarUrl,
                };
            })
        );
    },
});

export const unreadMessageCount = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        return ctx.runQuery(components.messaging.queries.unreadMessageCount, {
            userId: userId as string,
        });
    },
});

export const listConversationsByAssignee = query({
    args: {
        assigneeId: v.id("users"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { assigneeId, status, limit }) => {
        return ctx.runQuery(
            components.messaging.queries.listConversationsByAssignee,
            { assigneeId: assigneeId as string, status, limit }
        );
    },
});

// =============================================================================
// MUTATION FACADES
// =============================================================================

export const createConversation = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        participants: v.array(v.id("users")),
        subject: v.optional(v.string()),
        bookingId: v.optional(v.string()),
        resourceId: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.userId);

        return ctx.runMutation(components.messaging.mutations.createConversation, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            participants: args.participants.map((p) => p as string),
            subject: args.subject,
            bookingId: args.bookingId as string | undefined,
            resourceId: args.resourceId as string | undefined,
            metadata: args.metadata,
        });
    },
});

export const sendMessage = mutation({
    args: {
        tenantId: v.id("tenants"),
        conversationId: v.string(),
        senderId: v.id("users"),
        senderType: v.optional(v.string()),
        content: v.string(),
        messageType: v.optional(v.string()),
        attachments: v.optional(v.array(v.any())),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.senderId);

        // Rate limit: per-user message sending
        await rateLimit(ctx, {
            name: "sendMessage",
            key: rateLimitKeys.user(args.senderId as string),
            throws: true,
        });

        return ctx.runMutation(components.messaging.mutations.sendMessage, {
            tenantId: args.tenantId as string,
            conversationId: args.conversationId,
            senderId: args.senderId as string,
            senderType: args.senderType,
            content: args.content,
            messageType: args.messageType,
            attachments: args.attachments,
            metadata: args.metadata,
        });
    },
});

export const markMessagesAsRead = mutation({
    args: {
        conversationId: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, { conversationId, userId }) => {
        await requireActiveUser(ctx, userId);

        return ctx.runMutation(components.messaging.mutations.markMessagesAsRead, {
            conversationId,
            userId: userId as string,
        });
    },
});

export const archiveConversation = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.messaging.mutations.archiveConversation, { id });
    },
});

export const resolveConversation = mutation({
    args: {
        id: v.string(),
        resolvedBy: v.id("users"),
    },
    handler: async (ctx, { id, resolvedBy }) => {
        await requireActiveUser(ctx, resolvedBy);

        return ctx.runMutation(components.messaging.mutations.resolveConversation, {
            id,
            resolvedBy: resolvedBy as string,
        });
    },
});

export const reopenConversation = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.messaging.mutations.reopenConversation, { id });
    },
});

export const assignConversation = mutation({
    args: {
        id: v.string(),
        assigneeId: v.id("users"),
    },
    handler: async (ctx, { id, assigneeId }) => {
        await requireActiveUser(ctx, assigneeId);

        return ctx.runMutation(components.messaging.mutations.assignConversation, {
            id,
            assigneeId: assigneeId as string,
        });
    },
});

export const unassignConversation = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.messaging.mutations.unassignConversation, { id });
    },
});

export const setConversationPriority = mutation({
    args: {
        id: v.string(),
        priority: v.string(),
    },
    handler: async (ctx, { id, priority }) => {
        return ctx.runMutation(components.messaging.mutations.setConversationPriority, {
            id,
            priority,
        });
    },
});
