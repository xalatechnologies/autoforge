/**
 * AutoForge Convex Schema
 *
 * Data persistence layer for autonomous coding agent.
 * Replaces per-project SQLite databases with centralized Convex storage.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    /**
     * Projects tracked by AutoForge.
     * Each project maps to a directory on the filesystem.
     */
    projects: defineTable({
        name: v.string(),
        path: v.string(),
        createdAt: v.number(),
        lastActiveAt: v.optional(v.number()),
    }).index("by_name", ["name"]),

    /**
     * Features (test cases) to implement.
     * Matches SQLite `features` table exactly.
     */
    features: defineTable({
        projectId: v.id("projects"),
        priority: v.number(),
        category: v.string(),
        name: v.string(),
        description: v.string(),
        steps: v.array(v.string()),
        passes: v.boolean(),
        inProgress: v.boolean(),
        dependencies: v.optional(v.array(v.id("features"))),
    })
        .index("by_project", ["projectId"])
        .index("by_project_priority", ["projectId", "priority"])
        .index("by_status", ["passes", "inProgress"]),

    /**
     * Time-based schedules for automated agent runs.
     */
    schedules: defineTable({
        projectId: v.id("projects"),
        startTime: v.string(),          // "HH:MM" format
        durationMinutes: v.number(),    // 1-1440
        daysOfWeek: v.number(),         // Bitfield: Mon=1..Sun=64
        enabled: v.boolean(),
        yoloMode: v.boolean(),
        model: v.optional(v.string()),
        maxConcurrency: v.number(),     // 1-5
        crashCount: v.number(),
        createdAt: v.number(),
    }).index("by_project", ["projectId"]),

    /**
     * Persisted manual overrides for schedule windows.
     */
    scheduleOverrides: defineTable({
        scheduleId: v.id("schedules"),
        overrideType: v.union(v.literal("start"), v.literal("stop")),
        expiresAt: v.number(),
        createdAt: v.number(),
    }),
});
