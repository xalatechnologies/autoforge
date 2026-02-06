/**
 * AutoForge Convex Mutations
 *
 * Write operations for features.
 * Matches SQLite MCP tool semantics exactly.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_DEPENDENCIES = 20;

/**
 * Mark a feature as passing.
 */
export const markPassing = mutation({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };
        if (feature.passes) return { error: `Feature ${featureId} already passing` };

        await ctx.db.patch(featureId, { passes: true, inProgress: false });
        return { success: true, feature_id: featureId, name: feature.name };
    },
});

/**
 * Mark a feature as failing (regression).
 */
export const markFailing = mutation({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };

        await ctx.db.patch(featureId, { passes: false, inProgress: false });
        return { message: `Feature marked failing`, feature: { id: featureId, name: feature.name } };
    },
});

/**
 * Skip a feature (move to end of queue).
 */
export const skip = mutation({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };
        if (feature.passes) return { error: "Cannot skip passing feature" };

        const features = await ctx.db
            .query("features")
            .withIndex("by_project", (q) => q.eq("projectId", feature.projectId))
            .collect();
        const maxPriority = Math.max(...features.map((f) => f.priority), 0);

        await ctx.db.patch(featureId, { priority: maxPriority + 1, inProgress: false });
        return { id: featureId, name: feature.name, old_priority: feature.priority, new_priority: maxPriority + 1 };
    },
});

/**
 * Mark a feature as in-progress.
 */
export const markInProgress = mutation({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };
        if (feature.passes) return { error: "Feature already passing" };
        if (feature.inProgress) return { error: "Feature already in-progress" };

        await ctx.db.patch(featureId, { inProgress: true });
        return { id: featureId, name: feature.name, in_progress: true };
    },
});

/**
 * Atomically claim and get feature.
 */
export const claimAndGet = mutation({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };
        if (feature.passes) return { error: "Feature already passing" };

        const alreadyClaimed = feature.inProgress;
        if (!alreadyClaimed) {
            await ctx.db.patch(featureId, { inProgress: true });
        }

        return {
            id: feature._id,
            priority: feature.priority,
            category: feature.category,
            name: feature.name,
            description: feature.description,
            steps: feature.steps,
            passes: feature.passes,
            in_progress: true,
            dependencies: feature.dependencies ?? [],
            already_claimed: alreadyClaimed,
        };
    },
});

/**
 * Clear in-progress status.
 */
export const clearInProgress = mutation({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };

        await ctx.db.patch(featureId, { inProgress: false });
        return { id: featureId, name: feature.name, in_progress: false };
    },
});

/**
 * Create a single feature.
 */
export const create = mutation({
    args: {
        projectId: v.id("projects"),
        category: v.string(),
        name: v.string(),
        description: v.string(),
        steps: v.array(v.string()),
    },
    handler: async (ctx, { projectId, category, name, description, steps }) => {
        const features = await ctx.db
            .query("features")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();
        const maxPriority = Math.max(...features.map((f) => f.priority), 0);

        const id = await ctx.db.insert("features", {
            projectId,
            priority: maxPriority + 1,
            category,
            name,
            description,
            steps,
            passes: false,
            inProgress: false,
        });

        return { success: true, feature: { id, priority: maxPriority + 1, category, name } };
    },
});

/**
 * Create multiple features in bulk.
 */
export const createBulk = mutation({
    args: {
        projectId: v.id("projects"),
        features: v.array(v.object({
            category: v.string(),
            name: v.string(),
            description: v.string(),
            steps: v.array(v.string()),
            depends_on_indices: v.optional(v.array(v.number())),
        })),
    },
    handler: async (ctx, { projectId, features }) => {
        const existing = await ctx.db
            .query("features")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();
        let nextPriority = Math.max(...existing.map((f) => f.priority), 0) + 1;

        // Validate
        for (let i = 0; i < features.length; i++) {
            const indices = features[i].depends_on_indices ?? [];
            if (indices.some((idx) => idx >= i)) {
                return { error: `Feature ${i} has forward dependency reference` };
            }
        }

        // Create
        const ids: string[] = [];
        for (const f of features) {
            const id = await ctx.db.insert("features", {
                projectId,
                priority: nextPriority++,
                category: f.category,
                name: f.name,
                description: f.description,
                steps: f.steps,
                passes: false,
                inProgress: false,
            });
            ids.push(id);
        }

        // Set dependencies
        let depsCount = 0;
        for (let i = 0; i < features.length; i++) {
            const indices = features[i].depends_on_indices ?? [];
            if (indices.length > 0) {
                const depIds = indices.map((idx) => ids[idx]);
                await ctx.db.patch(ids[i] as any, { dependencies: depIds as any });
                depsCount++;
            }
        }

        return { created: ids.length, with_dependencies: depsCount };
    },
});

/**
 * Add a dependency.
 */
export const addDependency = mutation({
    args: { featureId: v.id("features"), dependencyId: v.id("features") },
    handler: async (ctx, { featureId, dependencyId }) => {
        if (featureId === dependencyId) return { error: "Self-dependency not allowed" };

        const feature = await ctx.db.get(featureId);
        const dep = await ctx.db.get(dependencyId);
        if (!feature) return { error: `Feature ${featureId} not found` };
        if (!dep) return { error: `Dependency ${dependencyId} not found` };

        const deps = feature.dependencies ?? [];
        if (deps.length >= MAX_DEPENDENCIES) return { error: `Max ${MAX_DEPENDENCIES} deps` };
        if (deps.includes(dependencyId)) return { error: "Dependency exists" };

        await ctx.db.patch(featureId, { dependencies: [...deps, dependencyId] as any });
        return { success: true, dependencies: [...deps, dependencyId] };
    },
});

/**
 * Remove a dependency.
 */
export const removeDependency = mutation({
    args: { featureId: v.id("features"), dependencyId: v.id("features") },
    handler: async (ctx, { featureId, dependencyId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };

        const deps = feature.dependencies ?? [];
        if (!deps.includes(dependencyId)) return { error: "Dependency not found" };

        const newDeps = deps.filter((d) => d !== dependencyId);
        await ctx.db.patch(featureId, { dependencies: newDeps.length > 0 ? newDeps as any : undefined });
        return { success: true, dependencies: newDeps };
    },
});

/**
 * Update a feature's editable fields.
 * Only non-passing features can be updated.
 */
export const update = mutation({
    args: {
        featureId: v.id("features"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        steps: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
    },
    handler: async (ctx, { featureId, name, description, steps, category }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };
        if (feature.passes) return { error: "Cannot update a passing feature" };

        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (steps !== undefined) updates.steps = steps;
        if (category !== undefined) updates.category = category;

        if (Object.keys(updates).length === 0) {
            return { success: true, message: "No changes" };
        }

        await ctx.db.patch(featureId, updates);
        const updated = await ctx.db.get(featureId);
        return {
            success: true,
            feature: {
                id: updated!._id,
                name: updated!.name,
                description: updated!.description,
                steps: updated!.steps,
                category: updated!.category,
                priority: updated!.priority,
                passes: updated!.passes,
                inProgress: updated!.inProgress,
            },
        };
    },
});

/**
 * Delete a feature and clean up dependencies.
 */
export const deleteFeature = mutation({
    args: { featureId: v.id("features") },
    handler: async (ctx, { featureId }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };

        // Get all features that depend on this one and remove the dependency
        const allFeatures = await ctx.db
            .query("features")
            .withIndex("by_project", (q) => q.eq("projectId", feature.projectId))
            .collect();

        for (const f of allFeatures) {
            const deps = f.dependencies ?? [];
            if (deps.includes(featureId)) {
                const newDeps = deps.filter((d) => d !== featureId);
                await ctx.db.patch(f._id, {
                    dependencies: newDeps.length > 0 ? newDeps as any : undefined,
                });
            }
        }

        // Delete the feature
        await ctx.db.delete(featureId);
        return { success: true, deleted: featureId };
    },
});

/**
 * Set all dependencies at once (replacing existing).
 */
export const setDependencies = mutation({
    args: {
        featureId: v.id("features"),
        dependencyIds: v.array(v.id("features")),
    },
    handler: async (ctx, { featureId, dependencyIds }) => {
        const feature = await ctx.db.get(featureId);
        if (!feature) return { error: `Feature ${featureId} not found` };

        // Validate all dependencies exist
        for (const depId of dependencyIds) {
            if (depId === featureId) return { error: "Cannot depend on self" };
            const dep = await ctx.db.get(depId);
            if (!dep) return { error: `Dependency ${depId} not found` };
        }

        if (dependencyIds.length > MAX_DEPENDENCIES) {
            return { error: `Maximum ${MAX_DEPENDENCIES} dependencies allowed` };
        }

        await ctx.db.patch(featureId, {
            dependencies: dependencyIds.length > 0 ? dependencyIds as any : undefined,
        });
        return { success: true, dependencies: dependencyIds };
    },
});
