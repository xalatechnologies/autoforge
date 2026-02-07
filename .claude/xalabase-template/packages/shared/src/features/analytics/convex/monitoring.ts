import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

/**
 * Monitoring Functions
 * Metrics, analytics, and reporting functions.
 */

// Get booking metrics via analytics component
export const getBookingMetrics = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        periodStart: v.number(),
        periodEnd: v.number(),
    },
    handler: async (ctx, { tenantId, resourceId, periodStart, periodEnd }) => {
        return ctx.runQuery(components.analytics.functions.getBookingMetrics, {
            tenantId: tenantId as string,
            resourceId: resourceId ? (resourceId as string) : undefined,
            periodStart,
            periodEnd,
        });
    },
});

// Get availability metrics via analytics component
export const getAvailabilityMetrics = query({
    args: {
        resourceId: v.string(),
        periodStart: v.number(),
        periodEnd: v.number(),
    },
    handler: async (ctx, { resourceId, periodStart, periodEnd }) => {
        return ctx.runQuery(components.analytics.functions.getAvailabilityMetrics, {
            resourceId: resourceId as string,
            periodStart,
            periodEnd,
        });
    },
});

// Calculate and store booking metrics
export const calculateBookingMetrics = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        period: v.string(),
        periodStart: v.number(),
        periodEnd: v.number(),
    },
    handler: async (ctx, { tenantId, resourceId, period, periodStart, periodEnd }) => {
        // Get bookings from bookings component
        let bookings = await ctx.runQuery(components.bookings.queries.list, {
            tenantId: tenantId as string,
            resourceId: resourceId ? (resourceId as string) : undefined,
            startAfter: periodStart,
            startBefore: periodEnd,
        }) as any[];

        // Additional filter: endTime within period
        bookings = bookings.filter((b: any) => b.endTime <= periodEnd);

        // Calculate metrics
        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed").length;
        const cancelledBookings = bookings.filter((b: any) => b.status === "cancelled").length;
        const totalRevenue = bookings
            .filter((b: any) => b.status === "confirmed")
            .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

        // Store metrics via analytics component
        const result = await ctx.runMutation(components.analytics.functions.storeBookingMetrics, {
            tenantId: tenantId as string,
            resourceId: resourceId ? (resourceId as string) : undefined,
            metricType: "summary",
            period,
            value: totalRevenue,
            count: totalBookings,
            metadata: {
                confirmedBookings,
                cancelledBookings,
                averagePrice: totalBookings > 0 ? totalRevenue / confirmedBookings : 0,
            },
            periodStart,
            periodEnd,
        });

        return {
            id: result.id,
            metrics: {
                totalBookings,
                confirmedBookings,
                cancelledBookings,
                totalRevenue,
            },
        };
    },
});

// Calculate availability metrics
export const calculateAvailabilityMetrics = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        period: v.string(),
        periodStart: v.number(),
        periodEnd: v.number(),
    },
    handler: async (ctx, { tenantId, resourceId, period, periodStart, periodEnd }) => {
        // Get bookings for resource from bookings component
        let bookings = await ctx.runQuery(components.bookings.queries.list, {
            tenantId: tenantId as string,
            resourceId: resourceId as string,
            startAfter: periodStart,
            startBefore: periodEnd,
        }) as any[];

        // Filter: endTime within period, exclude cancelled/rejected
        bookings = bookings.filter(
            (b: any) =>
                b.endTime <= periodEnd &&
                b.status !== "cancelled" &&
                b.status !== "rejected"
        );

        // Calculate total available hours (assume 12 hours/day)
        const totalDays = Math.ceil((periodEnd - periodStart) / (24 * 60 * 60 * 1000));
        const totalSlots = totalDays * 12; // 12 hour slots per day

        // Calculate booked hours
        let bookedHours = 0;
        for (const booking of bookings) {
            const duration = (booking.endTime - booking.startTime) / (60 * 60 * 1000);
            bookedHours += duration;
        }

        const bookedSlots = Math.round(bookedHours);
        const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

        // Find popular time slots
        const slotCounts: Record<string, number> = {};
        for (const booking of bookings) {
            const hour = new Date(booking.startTime).getHours();
            const slotKey = `${hour}:00`;
            slotCounts[slotKey] = (slotCounts[slotKey] || 0) + 1;
        }

        const popularTimeSlots = Object.entries(slotCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([time, count]) => ({ time, count }));

        // Store metrics via analytics component
        const result = await ctx.runMutation(components.analytics.functions.storeAvailabilityMetrics, {
            tenantId: tenantId as string,
            resourceId: resourceId as string,
            period,
            totalSlots,
            bookedSlots,
            utilizationRate,
            popularTimeSlots,
            metadata: {},
            periodStart,
            periodEnd,
        });

        return {
            id: result.id,
            metrics: {
                totalSlots,
                bookedSlots,
                utilizationRate,
                popularTimeSlots,
            },
        };
    },
});

// ============================================
// Report Schedules
// ============================================

// List report schedules via analytics component
export const listReportSchedules = query({
    args: {
        tenantId: v.id("tenants"),
        enabled: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, enabled }) => {
        return ctx.runQuery(components.analytics.functions.listReportSchedules, {
            tenantId: tenantId as string,
            enabled,
        });
    },
});

// Create report schedule via analytics component
export const createReportSchedule = mutation({
    args: {
        tenantId: v.id("tenants"),
        name: v.string(),
        description: v.optional(v.string()),
        reportType: v.string(),
        cronExpression: v.string(),
        recipients: v.array(v.string()),
        filters: v.optional(v.any()),
        format: v.string(),
        createdBy: v.id("users"),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.analytics.functions.createReportSchedule, {
            tenantId: args.tenantId as string,
            name: args.name,
            description: args.description,
            reportType: args.reportType,
            cronExpression: args.cronExpression,
            recipients: args.recipients,
            filters: args.filters,
            format: args.format,
            createdBy: args.createdBy as string,
            metadata: args.metadata,
        });
    },
});

// Update report schedule via analytics component
export const updateReportSchedule = mutation({
    args: {
        id: v.id("reportSchedules"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        cronExpression: v.optional(v.string()),
        recipients: v.optional(v.array(v.string())),
        filters: v.optional(v.any()),
        format: v.optional(v.string()),
        enabled: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.analytics.functions.updateReportSchedule, {
            id: id as any,
            ...updates,
        });
    },
});

// Delete report schedule via analytics component
export const deleteReportSchedule = mutation({
    args: {
        id: v.id("reportSchedules"),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.analytics.functions.deleteReportSchedule, {
            id: id as any,
        });
    },
});

// Get dashboard summary
export const getDashboardSummary = query({
    args: {
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, { tenantId }) => {
        const now = Date.now();
        const dayStart = now - (now % (24 * 60 * 60 * 1000));
        const weekStart = dayStart - 7 * 24 * 60 * 60 * 1000;
        const monthStart = dayStart - 30 * 24 * 60 * 60 * 1000;

        // Get resources via resources component
        const allResources = await ctx.runQuery(components.resources.queries.list, {
            tenantId: tenantId as string,
        }) as any[];
        const resources = allResources.filter((r: any) => r.status !== "deleted");

        // Get all bookings via bookings component (single call, filter in memory)
        const allBookings = await ctx.runQuery(components.bookings.queries.list, {
            tenantId: tenantId as string,
        }) as any[];

        const todayBookings = allBookings.filter(
            (b: any) => b.startTime >= dayStart && b.startTime <= dayStart + 24 * 60 * 60 * 1000
        );
        const weekBookings = allBookings.filter((b: any) => b.startTime >= weekStart);
        const pendingBookings = allBookings.filter((b: any) => b.status === "pending");

        // Get users count (users is a core table — direct access)
        const users = await ctx.db
            .query("users")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

        // Calculate revenue
        const monthRevenue = allBookings
            .filter((b: any) => b.status === "confirmed" && b._creationTime >= monthStart)
            .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

        return {
            resources: {
                total: resources.length,
                published: resources.filter((r: any) => r.status === "published").length,
                draft: resources.filter((r: any) => r.status === "draft").length,
            },
            bookings: {
                today: todayBookings.length,
                thisWeek: weekBookings.length,
                pending: pendingBookings.length,
            },
            users: {
                total: users.length,
            },
            revenue: {
                thisMonth: monthRevenue,
            },
        };
    },
});
