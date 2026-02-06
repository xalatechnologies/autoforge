/**
 * AutoForge Convex Queries
 *
 * Read operations for features, projects, and schedules.
 * Return shapes match SQLite MCP tool responses exactly.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get statistics about feature completion progress.
 */
export const getStats = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        const features = await ctx.db
            .query("features")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();

        const total = features.length;
        const passing = features.filter((f) => f.passes).length;
        const inProgress = features.filter((f) => f.inProgress).length;
        const percentage = total > 0 ? Math.round((passing / total) * 1000) / 10 : 0;

        return { passing, inProgress: inProgress, total, percentage };
    },
});

/**
 * Get a specific feature by ID.
 */
export const getById = query({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return null;
        return {
            id: feature._id,
            priority: feature.priority,
            category: feature.category,
            name: feature.name,
            description: feature.description,
            steps: feature.steps,
            passes: feature.passes,
            in_progress: feature.inProgress,
            dependencies: feature.dependencies ?? [],
        };
    },
});

/**
 * Get minimal feature info.
 */
export const getSummary = query({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return null;
        return {
            id: feature._id,
            name: feature.name,
            passes: feature.passes,
            in_progress: feature.inProgress,
            dependencies: feature.dependencies ?? [],
        };
    },
});

/**
 * Get features ready to implement (not passing, not blocked).
 */
export const getReady = query({
    args: { projectId: v.id("projects"), limit: v.optional(v.number()) },
    handler: async (ctx, { projectId, limit = 5 }) => {
        const features = await ctx.db
            .query("features")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();

        const passingIds = new Set(features.filter((f) => f.passes).map((f) => f._id));

        return features
            .filter((f) => {
                if (f.passes || f.inProgress) return false;
                const deps = f.dependencies ?? [];
                return deps.every((d) => passingIds.has(d));
            })
            .sort((a, b) => a.priority - b.priority)
            .slice(0, limit)
            .map((f) => ({
                id: f._id,
                priority: f.priority,
                category: f.category,
                name: f.name,
                description: f.description,
                steps: f.steps,
                passes: f.passes,
                in_progress: f.inProgress,
                dependencies: f.dependencies ?? [],
            }));
    },
});

/**
 * Get blocked features.
 */
export const getBlocked = query({
    args: { projectId: v.id("projects"), limit: v.optional(v.number()) },
    handler: async (ctx, { projectId, limit = 10 }) => {
        const features = await ctx.db
            .query("features")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();

        const passingIds = new Set(features.filter((f) => f.passes).map((f) => f._id));

        return features
            .filter((f) => {
                if (f.passes) return false;
                const deps = f.dependencies ?? [];
                return deps.length > 0 && deps.some((d) => !passingIds.has(d));
            })
            .slice(0, limit)
            .map((f) => ({
                id: f._id,
                name: f.name,
                blocking_dependencies: (f.dependencies ?? []).filter((d) => !passingIds.has(d)),
            }));
    },
});

/**
 * List all features grouped by status.
 */
export const list = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        const features = await ctx.db
            .query("features")
            .withIndex("by_project_priority", (q) => q.eq("projectId", projectId))
            .collect();

        const passingIds = new Set(features.filter((f) => f.passes).map((f) => f._id));

        const format = (f: typeof features[0]) => {
            const deps = f.dependencies ?? [];
            const blocking = deps.filter((d) => !passingIds.has(d));
            return {
                id: f._id,
                priority: f.priority,
                category: f.category,
                name: f.name,
                description: f.description,
                steps: f.steps,
                passes: f.passes,
                in_progress: f.inProgress,
                dependencies: deps,
                blocked: blocking.length > 0,
            };
        };

        return {
            pending: features.filter((f) => !f.passes && !f.inProgress).map(format),
            in_progress: features.filter((f) => f.inProgress && !f.passes).map(format),
            done: features.filter((f) => f.passes).map(format),
        };
    },
});
