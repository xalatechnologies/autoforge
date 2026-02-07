import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

/**
 * Season Applications Facade
 * Delegates to components.seasons.queries.* / components.seasons.mutations.*.
 * Maps: list -> listApplications, create -> submitApplication, approve/reject -> reviewApplication.
 * Preserves api.domain.seasonApplications.* paths for SDK hooks.
 */

// List applications for a tenant or season
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        seasonId: v.optional(v.string()),
        status: v.optional(v.string()),
        organizationId: v.optional(v.id("organizations")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, seasonId, status, organizationId, limit }) => {
        // The component's listApplications requires a seasonId.
        // If no seasonId is given, we need the tenant-scoped list from the seasons component.
        // The component only has listApplications(seasonId), so for tenant-wide listing
        // we get all seasons first and then aggregate.
        if (seasonId) {
            const applications = await ctx.runQuery(
                components.seasons.queries.listApplications,
                {
                    seasonId: seasonId as any,
                    status,
                    organizationId: organizationId ? (organizationId as string) : undefined,
                }
            );

            // Enrich with core table data
            const enriched = await enrichApplications(ctx, applications);

            // Apply limit
            return limit ? enriched.slice(0, limit) : enriched;
        }

        // Tenant-wide: get all seasons, then aggregate applications
        const seasons = await ctx.runQuery(components.seasons.queries.list, {
            tenantId: tenantId as string,
        });

        let allApplications: any[] = [];
        for (const season of seasons) {
            const apps = await ctx.runQuery(
                components.seasons.queries.listApplications,
                {
                    seasonId: season._id as any,
                    status,
                    organizationId: organizationId ? (organizationId as string) : undefined,
                }
            );
            allApplications = allApplications.concat(apps);
        }

        // Sort by priority descending, then creation time
        allApplications.sort((a: any, b: any) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return b._creationTime - a._creationTime;
        });

        if (limit) {
            allApplications = allApplications.slice(0, limit);
        }

        // Enrich with core table data
        return enrichApplications(ctx, allApplications);
    },
});

// Get a single application
export const get = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        // The component doesn't have a dedicated getApplication, but the season component
        // has the application in its table. We use listApplications and filter by ID,
        // or we need the raw data. For now, we use the component's approach.
        // Since the component stores applications, the facade can read via the
        // component's listApplications (scoped by seasonId).
        // However, we don't have seasonId here. We'll throw a helpful error
        // or use a workaround. The simplest approach: since application IDs are
        // within the seasons component, we cannot ctx.db.get them from app tables.
        // The component needs a getApplication function. For now, throw.
        throw new Error(
            "Use list with seasonId to find applications. Direct get by ID requires component enhancement."
        );
    },
});

// Create a season application
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        seasonId: v.string(),
        userId: v.id("users"),
        organizationId: v.optional(v.id("organizations")),
        resourceId: v.optional(v.string()),
        weekday: v.optional(v.number()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        applicantName: v.optional(v.string()),
        applicantEmail: v.optional(v.string()),
        applicantPhone: v.optional(v.string()),
        applicationData: v.optional(v.any()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.seasons.mutations.submitApplication, {
            tenantId: args.tenantId as string,
            seasonId: args.seasonId as any,
            userId: args.userId as string,
            organizationId: args.organizationId
                ? (args.organizationId as string)
                : undefined,
            resourceId: args.resourceId
                ? (args.resourceId as string)
                : undefined,
            weekday: args.weekday,
            startTime: args.startTime,
            endTime: args.endTime,
            applicantName: args.applicantName,
            applicantEmail: args.applicantEmail,
            applicantPhone: args.applicantPhone,
            applicationData: args.applicationData,
            notes: args.notes,
        });
    },
});

// Update a season application (only pending applications)
export const update = mutation({
    args: {
        id: v.string(),
        resourceId: v.optional(v.string()),
        weekday: v.optional(v.number()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        applicantName: v.optional(v.string()),
        applicantEmail: v.optional(v.string()),
        applicantPhone: v.optional(v.string()),
        applicationData: v.optional(v.any()),
        notes: v.optional(v.string()),
    },
    handler: async (_ctx, _args) => {
        // The component's reviewApplication handles status changes,
        // but there's no generic updateApplication in the component.
        // This would need a component enhancement. For now, throw.
        throw new Error(
            "Application update requires component enhancement. Use approve/reject for status changes."
        );
    },
});

// Approve a season application
export const approve = mutation({
    args: {
        id: v.string(),
        reviewedBy: v.id("users"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, { id, reviewedBy, notes }) => {
        return ctx.runMutation(components.seasons.mutations.reviewApplication, {
            id: id as any,
            status: "approved",
            reviewedBy: reviewedBy as string,
            notes,
        });
    },
});

// Reject a season application
export const reject = mutation({
    args: {
        id: v.string(),
        reviewedBy: v.id("users"),
        rejectionReason: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, { id, reviewedBy, rejectionReason, notes }) => {
        return ctx.runMutation(components.seasons.mutations.reviewApplication, {
            id: id as any,
            status: "rejected",
            reviewedBy: reviewedBy as string,
            rejectionReason,
            notes,
        });
    },
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Enrich application records with core table data (user, org, resource names).
 * Uses batch fetching to avoid N+1 queries.
 */
async function enrichApplications(ctx: any, applications: any[]) {
    // Batch fetch all unique users
    const userIds = [...new Set(applications.map((a: any) => a.userId).filter(Boolean))];
    const users = await Promise.all(
        userIds.map((id: string) =>
            ctx.db
                .query("users")
                .filter((q: any) => q.eq(q.field("_id"), id as any))
                .first()
                .catch(() => null)
        )
    );
    const userMap = new Map(users.filter(Boolean).map((u: any) => [String(u._id), u]));

    // Batch fetch all unique organizations
    const orgIds = [...new Set(applications.map((a: any) => a.organizationId).filter(Boolean))];
    const orgs = await Promise.all(
        orgIds.map((id: string) =>
            ctx.db
                .query("organizations")
                .filter((q: any) => q.eq(q.field("_id"), id as any))
                .first()
                .catch(() => null)
        )
    );
    const orgMap = new Map(orgs.filter(Boolean).map((o: any) => [String(o._id), o]));

    // Batch fetch all unique resources
    const resourceIds = [...new Set(applications.map((a: any) => a.resourceId).filter(Boolean))];
    const resources = await Promise.all(
        resourceIds.map((id: string) =>
            ctx.db
                .query("resources")
                .filter((q: any) => q.eq(q.field("_id"), id as any))
                .first()
                .catch(() => null)
        )
    );
    const resourceMap = new Map(resources.filter(Boolean).map((r: any) => [String(r._id), r]));

    return applications.map((app: any) => {
        const user = app.userId ? userMap.get(String(app.userId)) : null;
        const org = app.organizationId ? orgMap.get(String(app.organizationId)) : null;
        const resource = app.resourceId ? resourceMap.get(String(app.resourceId)) : null;

        return {
            ...app,
            user: user
                ? { id: user._id, name: user.name, email: user.email }
                : null,
            organization: org ? { id: org._id, name: org.name } : null,
            resource: resource
                ? { id: resource._id, name: resource.name }
                : null,
        };
    });
}
