/**
 * Dev-Docs Convex Functions - Tickets
 *
 * Read-only queries for ticket data displayed in dashboards.
 * Mutations for agents to create/update tickets.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// QUERIES (Read-only for dashboards)
// =============================================================================

/**
 * List all tickets, optionally filtered by status, phase, or track.
 */
export const list = query({
    args: {
        status: v.optional(v.string()),
        phase: v.optional(v.string()),
        track: v.optional(v.string()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { status, phase, track }) => {
        let tickets = await ctx.db.query("tickets").collect();

        if (status) {
            tickets = tickets.filter((t) => t.status === status);
        }
        if (phase) {
            tickets = tickets.filter((t) => t.phase === phase);
        }
        if (track) {
            tickets = tickets.filter((t) => t.track === track);
        }

        // Sort by priority (critical > high > medium > low), then by ticketId
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        tickets.sort((a, b) => {
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return a.ticketId.localeCompare(b.ticketId);
        });

        return tickets;
    },
});

/**
 * Get a single ticket by ID.
 */
export const get = query({
    args: { ticketId: v.string() },
    returns: v.any(),
    handler: async (ctx, { ticketId }) => {
        const ticket = await ctx.db
            .query("tickets")
            .withIndex("by_ticketId", (q) => q.eq("ticketId", ticketId))
            .first();
        return ticket;
    },
});

/**
 * Get ticket counts by status (for Kanban board headers).
 */
export const countsByStatus = query({
    args: {},
    returns: v.object({
        todo: v.number(),
        "in-progress": v.number(),
        done: v.number(),
        blocked: v.number(),
    }),
    handler: async (ctx) => {
        const tickets = await ctx.db.query("tickets").collect();
        return {
            todo: tickets.filter((t) => t.status === "todo").length,
            "in-progress": tickets.filter((t) => t.status === "in-progress").length,
            done: tickets.filter((t) => t.status === "done").length,
            blocked: tickets.filter((t) => t.status === "blocked").length,
        };
    },
});

// =============================================================================
// MUTATIONS (For agents to create/update tickets)
// =============================================================================

/**
 * Create a new ticket.
 */
export const create = mutation({
    args: {
        ticketId: v.string(),
        title: v.string(),
        description: v.string(),
        status: v.union(
            v.literal("todo"),
            v.literal("in-progress"),
            v.literal("done"),
            v.literal("blocked")
        ),
        priority: v.union(
            v.literal("critical"),
            v.literal("high"),
            v.literal("medium"),
            v.literal("low")
        ),
        phase: v.string(),
        track: v.optional(v.string()),
        sprint: v.optional(v.number()),
        estimatedWeeks: v.optional(v.number()),
        dependencies: v.array(v.string()),
        scoreImpact: v.number(),
        category: v.string(),
        assignee: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        // Check for duplicate ticketId
        const existing = await ctx.db
            .query("tickets")
            .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
            .first();
        if (existing) {
            throw new Error(`Ticket ${args.ticketId} already exists`);
        }

        const id = await ctx.db.insert("tickets", {
            ...args,
            completedAt: args.status === "done" ? Date.now() : undefined,
        });

        return { id: id as string };
    },
});

/**
 * Update ticket status.
 */
export const updateStatus = mutation({
    args: {
        ticketId: v.string(),
        status: v.union(
            v.literal("todo"),
            v.literal("in-progress"),
            v.literal("done"),
            v.literal("blocked")
        ),
        blockedReason: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { ticketId, status, blockedReason }) => {
        const ticket = await ctx.db
            .query("tickets")
            .withIndex("by_ticketId", (q) => q.eq("ticketId", ticketId))
            .first();
        if (!ticket) {
            throw new Error(`Ticket ${ticketId} not found`);
        }

        await ctx.db.patch(ticket._id, {
            status,
            completedAt: status === "done" ? Date.now() : undefined,
            blockedReason: status === "blocked" ? blockedReason : undefined,
        });

        return { success: true };
    },
});

/**
 * Bulk import tickets (for initial data migration).
 */
export const bulkImport = mutation({
    args: {
        tickets: v.array(v.object({
            ticketId: v.string(),
            title: v.string(),
            description: v.string(),
            status: v.string(),
            priority: v.string(),
            phase: v.string(),
            track: v.optional(v.string()),
            sprint: v.optional(v.number()),
            estimatedWeeks: v.optional(v.number()),
            dependencies: v.array(v.string()),
            scoreImpact: v.number(),
            category: v.string(),
        })),
    },
    returns: v.object({ imported: v.number() }),
    handler: async (ctx, { tickets }) => {
        let imported = 0;
        for (const ticket of tickets) {
            const existing = await ctx.db
                .query("tickets")
                .withIndex("by_ticketId", (q) => q.eq("ticketId", ticket.ticketId))
                .first();
            if (!existing) {
                await ctx.db.insert("tickets", {
                    ...ticket,
                    status: ticket.status as "todo" | "in-progress" | "done" | "blocked",
                    priority: ticket.priority as "critical" | "high" | "medium" | "low",
                });
                imported++;
            }
        }
        return { imported };
    },
});
