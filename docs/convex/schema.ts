/**
 * Dev-Docs Convex Schema
 *
 * Standalone Convex project for production readiness tracking and ticket management.
 * Separate from the main xalabase Convex deployment.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    /**
     * Implementation tickets (A1, A2, B1, 01, 02, etc.)
     * Tracks sprints, phases, dependencies, and score impact.
     */
    tickets: defineTable({
        ticketId: v.string(),           // "A1", "01", "T1.1", etc.
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
        phase: v.string(),              // "foundation", "core", "production"
        track: v.optional(v.string()),  // "A", "B", "C", "D", "E"
        sprint: v.optional(v.number()),
        estimatedWeeks: v.optional(v.number()),
        dependencies: v.array(v.string()),
        scoreImpact: v.number(),        // Points added when completed
        category: v.string(),           // architecture, testing, security, etc.
        assignee: v.optional(v.string()),
        completedAt: v.optional(v.number()),
        blockedReason: v.optional(v.string()),
        metadata: v.optional(v.any()),
    })
        .index("by_status", ["status"])
        .index("by_phase", ["phase"])
        .index("by_track", ["track"])
        .index("by_ticketId", ["ticketId"])
        .index("by_priority", ["priority"]),

    /**
     * Production readiness category scores.
     * 8 categories with weights summing to 100%.
     */
    categoryScores: defineTable({
        category: v.string(),           // architecture, testing, security, etc.
        weight: v.number(),             // Percentage weight (5-20)
        currentScore: v.number(),       // Current score (0-100)
        targetScore: v.number(),        // Target for next milestone
        notes: v.string(),
        updatedAt: v.number(),
    })
        .index("by_category", ["category"]),

    /**
     * Weekly score snapshots for trending visualization.
     */
    scoreHistory: defineTable({
        weekNumber: v.number(),
        totalScore: v.number(),
        categoryScores: v.any(),        // { architecture: 60, testing: 50, ... }
        completedTickets: v.array(v.string()),
        notes: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_week", ["weekNumber"]),

    /**
     * Milestones for roadmap visualization.
     */
    milestones: defineTable({
        name: v.string(),
        targetWeek: v.number(),
        targetScore: v.number(),
        status: v.union(
            v.literal("upcoming"),
            v.literal("active"),
            v.literal("completed")
        ),
        description: v.string(),
        phase: v.string(),
    })
        .index("by_week", ["targetWeek"])
        .index("by_status", ["status"]),
});
