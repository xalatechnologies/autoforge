/**
 * Event Bus — Outbox Pattern for Component Communication
 *
 * Components communicate through events, never through direct function calls.
 * This enables the plug-and-play architecture where components can be swapped
 * without affecting subscribers.
 *
 * Topic format: {component}.{entity}.{action}
 * Examples: "bookings.booking.created", "reviews.review.moderated"
 *
 * @see docs/CONVENTIONS.md for the outbox event specification
 */

import { v } from "convex/values";
import {
    internalMutation,
    internalQuery,
    mutation,
    query,
} from "../../../../../../convex/_generated/server";
import type { Id } from "../../../../../../convex/_generated/dataModel";

// =============================================================================
// EVENT EMISSION
// =============================================================================

/**
 * Emit an event to the outbox. Called by facade functions after primary operations.
 * Events are processed asynchronously by the event worker.
 */
export const emit = internalMutation({
    args: {
        topic: v.string(),
        tenantId: v.string(),
        sourceComponent: v.string(),
        payload: v.any(),
    },
    handler: async (ctx, args) => {
        const eventId = await ctx.db.insert("outboxEvents", {
            topic: args.topic,
            tenantId: args.tenantId,
            sourceComponent: args.sourceComponent,
            payload: args.payload,
            status: "pending",
            retryCount: 0,
            maxRetries: 3,
            createdAt: Date.now(),
        });
        return { eventId };
    },
});

// =============================================================================
// EVENT PROCESSING
// =============================================================================

/**
 * Process pending events — dispatches to subscribing components.
 * Should be called by a cron job or scheduled function.
 */
export const processEvents = internalMutation({
    args: {
        batchSize: v.optional(v.number()),
    },
    handler: async (ctx, { batchSize = 50 }) => {
        const pending = await ctx.db
            .query("outboxEvents")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .take(batchSize);

        let processed = 0;
        let failed = 0;

        for (const event of pending) {
            try {
                // Mark as processing
                await ctx.db.patch(event._id, { status: "processing" });

                // Look up subscribers for this topic from component registry
                const subscribers = await ctx.db
                    .query("componentRegistry")
                    .withIndex("by_enabled", (q) =>
                        q.eq("tenantId", event.tenantId as Id<"tenants">).eq("isEnabled", true)
                    )
                    .collect();

                const matchingSubscribers = subscribers.filter(
                    (sub) =>
                        sub.subscribes?.includes(event.topic) &&
                        sub.componentId !== event.sourceComponent
                );

                // For now, log subscribers — actual dispatch will be implemented
                // when components declare their event handlers
                if (matchingSubscribers.length > 0) {
                    // TODO: Dispatch to subscriber event handlers via ctx.runMutation
                    // This will be wired up as components are migrated
                }

                // Mark as processed
                await ctx.db.patch(event._id, {
                    status: "processed",
                    processedAt: Date.now(),
                });
                processed++;
            } catch (error) {
                const newRetryCount = event.retryCount + 1;
                const maxRetries = event.maxRetries ?? 3;

                await ctx.db.patch(event._id, {
                    status: newRetryCount >= maxRetries ? "dead_letter" : "pending",
                    retryCount: newRetryCount,
                    error: error instanceof Error ? error.message : String(error),
                });
                failed++;
            }
        }

        return { processed, failed, total: pending.length };
    },
});

// =============================================================================
// EVENT QUERIES
// =============================================================================

/**
 * List recent events for monitoring/debugging.
 */
export const listRecent = internalQuery({
    args: {
        tenantId: v.optional(v.string()),
        topic: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, topic, status, limit = 50 }) => {
        let events;

        if (status) {
            events = await ctx.db
                .query("outboxEvents")
                .withIndex("by_status", (q) =>
                    q.eq("status", status as "pending" | "processing" | "processed" | "failed" | "dead_letter")
                )
                .take(limit);
        } else {
            events = await ctx.db
                .query("outboxEvents")
                .order("desc")
                .take(limit);
        }

        // Apply additional filters in memory
        if (tenantId) {
            events = events.filter((e) => e.tenantId === tenantId);
        }
        if (topic) {
            events = events.filter((e) => e.topic === topic);
        }

        return events;
    },
});

/**
 * Get dead letter events that need manual intervention.
 */
export const listDeadLetters = internalQuery({
    args: {
        tenantId: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, limit = 100 }) => {
        let events = await ctx.db
            .query("outboxEvents")
            .withIndex("by_status", (q) => q.eq("status", "dead_letter"))
            .take(limit);

        if (tenantId) {
            events = events.filter((e) => e.tenantId === tenantId);
        }

        return events;
    },
});

/**
 * Retry a dead letter event.
 */
export const retryDeadLetter = internalMutation({
    args: {
        eventId: v.id("outboxEvents"),
    },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId);
        if (!event) {
            throw new Error("Event not found");
        }
        if (event.status !== "dead_letter" && event.status !== "failed") {
            throw new Error("Event is not in dead_letter or failed status");
        }

        await ctx.db.patch(eventId, {
            status: "pending",
            retryCount: 0,
            error: undefined,
        });

        return { success: true };
    },
});

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Clean up old processed events. Call periodically to keep the table manageable.
 */
export const cleanupProcessed = internalMutation({
    args: {
        olderThanMs: v.optional(v.number()), // Default: 7 days
        batchSize: v.optional(v.number()),
    },
    handler: async (ctx, { olderThanMs = 7 * 24 * 60 * 60 * 1000, batchSize = 100 }) => {
        const cutoff = Date.now() - olderThanMs;

        const oldEvents = await ctx.db
            .query("outboxEvents")
            .withIndex("by_status", (q) => q.eq("status", "processed"))
            .take(batchSize);

        let deleted = 0;
        for (const event of oldEvents) {
            if (event.createdAt < cutoff) {
                await ctx.db.delete(event._id);
                deleted++;
            }
        }

        return { deleted };
    },
});

// =============================================================================
// HELPER — For use in facade functions
// =============================================================================

/**
 * Helper function to emit events from facade functions.
 * Import and call this in domain facade mutations.
 *
 * Usage in a facade:
 *   import { emitEvent } from "../lib/eventBus";
 *   // After primary operation:
 *   await emitEvent(ctx, "reviews.review.created", tenantId, "reviews", { reviewId, resourceId });
 */
export async function emitEvent(
    ctx: { runMutation: (ref: any, args: any) => Promise<any> },
    topic: string,
    tenantId: string,
    sourceComponent: string,
    payload: Record<string, unknown>
): Promise<void> {
    // Use internal import to avoid circular dependencies
    const { internal } = await import("../../../../../../convex/_generated/api");
    await ctx.runMutation(internal.lib.eventBus.emit, {
        topic,
        tenantId,
        sourceComponent,
        payload,
    });
}
