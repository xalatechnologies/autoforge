import { query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

/**
 * Dashboard Functions
 * KPIs, stats, and activity feeds for monitoring dashboards.
 */

// Get key performance indicators for a tenant
export const getKPIs = query({
    args: {
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, { tenantId }) => {
        const now = Date.now();
        const dayStart = now - (now % (24 * 60 * 60 * 1000));
        const weekStart = dayStart - 7 * 24 * 60 * 60 * 1000;
        const monthStart = dayStart - 30 * 24 * 60 * 60 * 1000;

        // Count resources via resources component
        const resources = await ctx.runQuery(components.resources.queries.list, {
            tenantId: tenantId as string,
        }) as any[];

        const activeResources = resources.filter(
            (r: any) => r.status !== "deleted" && r.status !== "draft"
        );

        // Count bookings via bookings component
        const bookings = await ctx.runQuery(components.bookings.queries.list, {
            tenantId: tenantId as string,
        }) as any[];

        const todayBookings = bookings.filter(
            (b: any) => b.startTime >= dayStart && b.startTime < dayStart + 24 * 60 * 60 * 1000
        );
        const weekBookings = bookings.filter((b: any) => b.startTime >= weekStart);
        const monthBookings = bookings.filter((b: any) => b.startTime >= monthStart);
        const pendingBookings = bookings.filter((b: any) => b.status === "pending");

        // Count users (tenantUsers is a core table — direct access)
        const tenantUsers = await ctx.db
            .query("tenantUsers")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        const activeUsers = tenantUsers.filter((u) => u.status === "active");

        // Revenue this month
        const monthRevenue = monthBookings
            .filter((b: any) => b.status === "confirmed")
            .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

        return {
            resources: {
                total: resources.length,
                active: activeResources.length,
                published: resources.filter((r: any) => r.status === "published").length,
            },
            bookings: {
                total: bookings.length,
                today: todayBookings.length,
                thisWeek: weekBookings.length,
                thisMonth: monthBookings.length,
                pending: pendingBookings.length,
            },
            users: {
                total: tenantUsers.length,
                active: activeUsers.length,
            },
            revenue: {
                thisMonth: monthRevenue,
                currency: "NOK",
            },
        };
    },
});

// Get detailed stats with breakdowns
export const getStats = query({
    args: {
        tenantId: v.id("tenants"),
        periodStart: v.optional(v.number()),
        periodEnd: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, periodStart, periodEnd }) => {
        const now = Date.now();
        const start = periodStart || now - 30 * 24 * 60 * 60 * 1000;
        const end = periodEnd || now;

        // Bookings via bookings component
        const bookings = await ctx.runQuery(components.bookings.queries.list, {
            tenantId: tenantId as string,
        }) as any[];

        const periodBookings = bookings.filter(
            (b: any) => b._creationTime >= start && b._creationTime <= end
        );

        // Status breakdown
        const statusCounts: Record<string, number> = {};
        for (const booking of periodBookings) {
            statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
        }

        // Resources via resources component
        const resources = await ctx.runQuery(components.resources.queries.list, {
            tenantId: tenantId as string,
        }) as any[];

        const resourceBookingCounts: Record<string, { name: string; count: number; revenue: number }> = {};
        for (const booking of periodBookings) {
            const resourceId = booking.resourceId as string;
            if (!resourceBookingCounts[resourceId]) {
                const resource = resources.find((r: any) => r._id === booking.resourceId);
                resourceBookingCounts[resourceId] = {
                    name: resource?.name || "Unknown",
                    count: 0,
                    revenue: 0,
                };
            }
            resourceBookingCounts[resourceId].count++;
            if (booking.status === "confirmed") {
                resourceBookingCounts[resourceId].revenue += booking.totalPrice || 0;
            }
        }

        // Top resources by booking count
        const topResources = Object.entries(resourceBookingCounts)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([id, data]) => ({ resourceId: id, ...data }));

        // Revenue breakdown
        const confirmedBookings = periodBookings.filter(
            (b: any) => b.status === "confirmed"
        );
        const totalRevenue = confirmedBookings.reduce(
            (sum: number, b: any) => sum + (b.totalPrice || 0),
            0
        );

        // Category breakdown
        const categoryBookings: Record<string, number> = {};
        for (const booking of periodBookings) {
            const resource = resources.find((r: any) => r._id === booking.resourceId);
            if (resource) {
                const cat = resource.categoryKey;
                categoryBookings[cat] = (categoryBookings[cat] || 0) + 1;
            }
        }

        return {
            period: { start, end },
            bookings: {
                total: periodBookings.length,
                byStatus: statusCounts,
                byCategory: categoryBookings,
            },
            revenue: {
                total: totalRevenue,
                averagePerBooking:
                    confirmedBookings.length > 0
                        ? Math.round(totalRevenue / confirmedBookings.length)
                        : 0,
            },
            topResources,
        };
    },
});

// Get recent activity (audit events)
export const getActivity = query({
    args: {
        tenantId: v.id("tenants"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, limit }) => {
        const maxItems = limit || 20;

        // Get recent audit entries from audit component
        const auditEntries = await ctx.runQuery(components.audit.functions.listForTenant, {
            tenantId: tenantId as string,
            limit: maxItems,
        }) as any[];

        // Enrich with user details from core users table
        const withDetails = await Promise.all(
            auditEntries.map(async (entry: any) => {
                let user = null;
                if (entry.userId) {
                    try {
                        const userDoc = await ctx.db.get(entry.userId as any);
                        if (userDoc) {
                            user = {
                                id: userDoc._id,
                                name: (userDoc as any).name,
                                email: (userDoc as any).email,
                            };
                        }
                    } catch {
                        // User ID may not resolve in core table
                    }
                }

                return {
                    id: entry._id,
                    action: entry.action,
                    timestamp: entry.timestamp,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    user,
                    reason: entry.reason,
                    details: entry.details,
                    sourceComponent: entry.sourceComponent,
                };
            })
        );

        return withDetails;
    },
});
