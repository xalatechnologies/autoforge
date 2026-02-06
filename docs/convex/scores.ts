/**
 * Dev-Docs Convex Functions - Scores
 *
 * Production readiness scoring and history tracking.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get current production readiness score with category breakdown.
 */
export const getProductionReadiness = query({
    args: {},
    returns: v.object({
        totalScore: v.number(),
        categories: v.array(v.any()),
    }),
    handler: async (ctx) => {
        const categories = await ctx.db.query("categoryScores").collect();

        if (categories.length === 0) {
            return { totalScore: 0, categories: [] };
        }

        // Calculate weighted total score
        const totalScore = categories.reduce((sum, cat) => {
            return sum + (cat.currentScore * cat.weight) / 100;
        }, 0);

        return {
            totalScore: Math.round(totalScore),
            categories: categories.sort((a, b) => b.weight - a.weight),
        };
    },
});

/**
 * Get score history for trending chart.
 */
export const getScoreHistory = query({
    args: { limit: v.optional(v.number()) },
    returns: v.array(v.any()),
    handler: async (ctx, { limit }) => {
        let history = await ctx.db
            .query("scoreHistory")
            .withIndex("by_week")
            .collect();

        // Sort by week ascending
        history.sort((a, b) => a.weekNumber - b.weekNumber);

        if (limit) {
            history = history.slice(-limit);
        }

        return history;
    },
});

/**
 * Get milestones for roadmap visualization.
 */
export const getMilestones = query({
    args: {},
    returns: v.array(v.any()),
    handler: async (ctx) => {
        const milestones = await ctx.db.query("milestones").collect();
        return milestones.sort((a, b) => a.targetWeek - b.targetWeek);
    },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Initialize category scores with baseline values.
 */
export const initializeCategoryScores = mutation({
    args: {
        categories: v.array(v.object({
            category: v.string(),
            weight: v.number(),
            currentScore: v.number(),
            targetScore: v.number(),
            notes: v.string(),
        })),
    },
    returns: v.object({ initialized: v.number() }),
    handler: async (ctx, { categories }) => {
        // Clear existing
        const existing = await ctx.db.query("categoryScores").collect();
        for (const cat of existing) {
            await ctx.db.delete(cat._id);
        }

        // Insert new
        for (const cat of categories) {
            await ctx.db.insert("categoryScores", {
                ...cat,
                updatedAt: Date.now(),
            });
        }

        return { initialized: categories.length };
    },
});

/**
 * Update a category score.
 */
export const updateCategoryScore = mutation({
    args: {
        category: v.string(),
        currentScore: v.number(),
        notes: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { category, currentScore, notes }) => {
        const cat = await ctx.db
            .query("categoryScores")
            .withIndex("by_category", (q) => q.eq("category", category))
            .first();

        if (!cat) {
            throw new Error(`Category ${category} not found`);
        }

        await ctx.db.patch(cat._id, {
            currentScore,
            notes: notes ?? cat.notes,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Record a weekly score snapshot.
 */
export const recordWeeklyScore = mutation({
    args: {
        weekNumber: v.number(),
        notes: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { weekNumber, notes }) => {
        // Get current category scores
        const categories = await ctx.db.query("categoryScores").collect();
        const categoryScores: Record<string, number> = {};
        let totalScore = 0;

        for (const cat of categories) {
            categoryScores[cat.category] = cat.currentScore;
            totalScore += (cat.currentScore * cat.weight) / 100;
        }

        // Get completed tickets
        const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_status", (q) => q.eq("status", "done"))
            .collect();
        const completedTickets = tickets.map((t) => t.ticketId);

        // Check if week already exists
        const existing = await ctx.db
            .query("scoreHistory")
            .withIndex("by_week", (q) => q.eq("weekNumber", weekNumber))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                totalScore: Math.round(totalScore),
                categoryScores,
                completedTickets,
                notes,
                timestamp: Date.now(),
            });
        } else {
            await ctx.db.insert("scoreHistory", {
                weekNumber,
                totalScore: Math.round(totalScore),
                categoryScores,
                completedTickets,
                notes,
                timestamp: Date.now(),
            });
        }

        return { success: true };
    },
});

/**
 * Initialize milestones.
 */
export const initializeMilestones = mutation({
    args: {
        milestones: v.array(v.object({
            name: v.string(),
            targetWeek: v.number(),
            targetScore: v.number(),
            status: v.string(),
            description: v.string(),
            phase: v.string(),
        })),
    },
    returns: v.object({ initialized: v.number() }),
    handler: async (ctx, { milestones }) => {
        // Clear existing
        const existing = await ctx.db.query("milestones").collect();
        for (const m of existing) {
            await ctx.db.delete(m._id);
        }

        // Insert new
        for (const m of milestones) {
            await ctx.db.insert("milestones", {
                ...m,
                status: m.status as "upcoming" | "active" | "completed",
            });
        }

        return { initialized: milestones.length };
    },
});
