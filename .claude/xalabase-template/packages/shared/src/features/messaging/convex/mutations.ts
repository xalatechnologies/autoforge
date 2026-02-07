/**
 * Messaging Component — Mutation Functions
 *
 * Write operations for conversations and messages.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// CONVERSATION MUTATIONS
// =============================================================================

export const createConversation = mutation({
    args: {
        tenantId: v.string(),
        userId: v.string(),
        participants: v.array(v.string()),
        subject: v.optional(v.string()),
        bookingId: v.optional(v.string()),
        resourceId: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("conversations", {
            tenantId: args.tenantId,
            userId: args.userId,
            participants: args.participants,
            subject: args.subject,
            bookingId: args.bookingId,
            resourceId: args.resourceId,
            status: "open",
            unreadCount: 0,
            metadata: args.metadata ?? {},
        });
        return { id: id as string };
    },
});

export const archiveConversation = mutation({
    args: { id: v.id("conversations") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, { status: "archived" });
        return { success: true };
    },
});

export const resolveConversation = mutation({
    args: {
        id: v.id("conversations"),
        resolvedBy: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, resolvedBy }) => {
        await ctx.db.patch(id, {
            status: "resolved",
            resolvedAt: Date.now(),
            resolvedBy,
        });
        return { success: true };
    },
});

export const reopenConversation = mutation({
    args: { id: v.id("conversations") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, {
            status: "open",
            resolvedAt: undefined,
            resolvedBy: undefined,
            reopenedAt: Date.now(),
        });
        return { success: true };
    },
});

export const assignConversation = mutation({
    args: {
        id: v.id("conversations"),
        assigneeId: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, assigneeId }) => {
        await ctx.db.patch(id, { assigneeId, assignedAt: Date.now() });
        return { success: true };
    },
});

export const unassignConversation = mutation({
    args: { id: v.id("conversations") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, { assigneeId: undefined, assignedAt: undefined });
        return { success: true };
    },
});

export const setConversationPriority = mutation({
    args: {
        id: v.id("conversations"),
        priority: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, priority }) => {
        await ctx.db.patch(id, { priority });
        return { success: true };
    },
});

// =============================================================================
// MESSAGE MUTATIONS
// =============================================================================

export const sendMessage = mutation({
    args: {
        tenantId: v.string(),
        conversationId: v.id("conversations"),
        senderId: v.string(),
        senderType: v.optional(v.string()),
        content: v.string(),
        messageType: v.optional(v.string()),
        attachments: v.optional(v.array(v.any())),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const now = Date.now();

        const messageId = await ctx.db.insert("messages", {
            tenantId: args.tenantId,
            conversationId: args.conversationId,
            senderId: args.senderId,
            senderType: args.senderType ?? "user",
            content: args.content,
            messageType: args.messageType ?? "text",
            attachments: args.attachments ?? [],
            metadata: args.metadata ?? {},
            sentAt: now,
        });

        // Update conversation
        const conversation = await ctx.db.get(args.conversationId);
        if (conversation) {
            await ctx.db.patch(args.conversationId, {
                lastMessageAt: now,
                unreadCount: (conversation.unreadCount || 0) + 1,
            });
        }

        return { id: messageId as string };
    },
});

export const markMessagesAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.string(),
    },
    returns: v.object({ success: v.boolean(), count: v.number() }),
    handler: async (ctx, { conversationId, userId }) => {
        const now = Date.now();

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("senderId"), userId),
                    q.eq(q.field("readAt"), undefined)
                )
            )
            .collect();

        for (const message of messages) {
            await ctx.db.patch(message._id, { readAt: now });
        }

        await ctx.db.patch(conversationId, { unreadCount: 0 });

        return { success: true, count: messages.length };
    },
});
