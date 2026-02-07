/**
 * Availability Queries (Phase 2 — Booking Engine)
 *
 * getResourceAvailability, validateBookingSlot, and all availability helpers.
 * Resource config (openingHours, capacity, slotDurationMinutes, maxBookingDuration)
 * is passed in by the facade — the resource table is NOT in this component.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format a Date as YYYY-MM-DD in LOCAL timezone.
 * IMPORTANT: Do NOT use toISOString().split("T")[0] as it converts to UTC
 * which can shift the date by 1 day depending on timezone!
 */
function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// =============================================================================
// AVAILABILITY QUERIES
// =============================================================================

/**
 * Get resource availability for a date range.
 * Returns mode-specific availability data for the booking widget.
 */
export const getResourceAvailability = query({
    args: {
        resourceId: v.string(),
        startDate: v.string(),  // ISO date "2024-02-01"
        endDate: v.string(),    // ISO date "2024-02-28"
        mode: v.string(),       // "SLOTS" | "ALL_DAY" | "DURATION" | "TICKETS"
        // Resource config passed in from the facade
        openingHours: v.optional(v.array(v.any())),
        slotDurationMinutes: v.optional(v.number()),
        maxBookingDuration: v.optional(v.number()),
        capacity: v.optional(v.number()),
    },
    returns: v.any(),
    handler: async (ctx, args) => {
        const { resourceId, startDate, endDate, mode } = args;
        const openingHours = args.openingHours || [];
        const slotDurationMinutes = args.slotDurationMinutes || 60;
        const maxBookingDuration = args.maxBookingDuration;
        const capacity = args.capacity || 0;

        // Parse dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startMs = start.getTime();
        const endMs = end.getTime();

        // Get existing bookings in date range
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "cancelled"),
                    q.neq(q.field("status"), "rejected"),
                    q.gte(q.field("endTime"), startMs),
                    q.lte(q.field("startTime"), endMs)
                )
            )
            .collect();

        // Get blocks in date range
        const blocks = await ctx.db
            .query("blocks")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "active"),
                    q.gte(q.field("endDate"), startMs),
                    q.lte(q.field("startDate"), endMs)
                )
            )
            .collect();

        // Calculate based on mode using strategy pattern
        const calculator = AVAILABILITY_CALCULATORS[mode] ?? AVAILABILITY_CALCULATORS._default;
        return calculator({ start, end, openingHours, bookings, blocks, slotDurationMinutes, maxBookingDuration, capacity });
    },
});

// =============================================================================
// AVAILABILITY STRATEGIES
// =============================================================================

type AvailabilityArgs = {
    start: Date;
    end: Date;
    openingHours: any[];
    bookings: any[];
    blocks: any[];
    slotDurationMinutes: number;
    maxBookingDuration?: number;
    capacity: number;
};
type AvailabilityCalculator = (args: AvailabilityArgs) => any;

const AVAILABILITY_CALCULATORS: Record<string, AvailabilityCalculator> = {
    SLOTS: ({ start, end, openingHours, bookings, blocks, slotDurationMinutes }) =>
        calculateSlotAvailability(start, end, openingHours, bookings, blocks, slotDurationMinutes),
    ALL_DAY: ({ start, end, openingHours, bookings, blocks }) =>
        calculateDayAvailability(start, end, openingHours, bookings, blocks),
    DURATION: ({ start, end, openingHours, bookings, blocks, maxBookingDuration }) =>
        calculateDurationAvailability(start, end, openingHours, bookings, blocks, maxBookingDuration),
    TICKETS: ({ start, end, openingHours, bookings, capacity }) =>
        calculateTicketAvailability(start, end, openingHours, bookings, capacity),
    _default: ({ start, end, openingHours, bookings, blocks }) =>
        calculateSlotAvailability(start, end, openingHours, bookings, blocks, 60),
};

// =============================================================================
// AVAILABILITY HELPER FUNCTIONS
// =============================================================================

// Helper: Calculate slot-based availability (weekly grid, hourly)
function calculateSlotAvailability(
    start: Date,
    end: Date,
    openingHours: any[],
    bookings: any[],
    blocks: any[],
    slotDurationMinutes: number
) {
    const slots: Array<{ date: string; hour: number; available: boolean; bookingId?: string }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dateStr = formatLocalDate(currentDate);
        const dayIndex = currentDate.getDay();
        const dayHours = openingHours.find((h: any) => h.dayIndex === dayIndex);

        if (dayHours && !dayHours.isClosed && dayHours.open && dayHours.close) {
            const openHour = parseInt(dayHours.open.split(":")[0], 10);
            const closeHour = parseInt(dayHours.close.split(":")[0], 10);

            for (let hour = openHour; hour < closeHour; hour++) {
                const slotStart = new Date(currentDate);
                slotStart.setHours(hour, 0, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);

                // Check if slot is blocked
                const isBlocked = blocks.some((b) =>
                    slotStart.getTime() < b.endDate && slotEnd.getTime() > b.startDate
                );

                // Check if slot is booked
                const booking = bookings.find((b) =>
                    slotStart.getTime() < b.endTime && slotEnd.getTime() > b.startTime
                );

                slots.push({
                    date: dateStr,
                    hour,
                    available: !isBlocked && !booking,
                    bookingId: booking?._id,
                });
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { mode: "SLOTS", slots };
}

// Helper: Calculate day-based availability (month calendar)
function calculateDayAvailability(
    start: Date,
    end: Date,
    openingHours: any[],
    bookings: any[],
    blocks: any[]
) {
    const days: Array<{ date: string; status: "available" | "partial" | "booked" | "blocked" | "closed" }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dateStr = formatLocalDate(currentDate);
        const dayIndex = currentDate.getDay();
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dayHours = openingHours.find((h: any) => h.dayIndex === dayIndex);

        if (!dayHours || dayHours.isClosed) {
            days.push({ date: dateStr, status: "closed" });
        } else {
            // Check for full-day blocks
            const isFullyBlocked = blocks.some((b) =>
                b.startDate <= dayStart.getTime() && b.endDate >= dayEnd.getTime() && b.allDay
            );

            if (isFullyBlocked) {
                days.push({ date: dateStr, status: "blocked" });
            } else {
                // Check for full-day bookings
                const dayBookings = bookings.filter((b) =>
                    b.startTime < dayEnd.getTime() && b.endTime > dayStart.getTime()
                );

                // For ALL_DAY mode, any booking makes the day unavailable
                if (dayBookings.some((b) => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    // Check if booking spans most of the day
                    return (bEnd.getTime() - bStart.getTime()) >= 8 * 60 * 60 * 1000; // 8 hours
                })) {
                    days.push({ date: dateStr, status: "booked" });
                } else if (dayBookings.length > 0) {
                    days.push({ date: dateStr, status: "partial" });
                } else {
                    days.push({ date: dateStr, status: "available" });
                }
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { mode: "ALL_DAY", days };
}

// Helper: Calculate duration-based availability
function calculateDurationAvailability(
    start: Date,
    end: Date,
    openingHours: any[],
    bookings: any[],
    blocks: any[],
    maxDuration?: number
) {
    const days: Array<{ date: string; available: boolean; maxDurationMinutes: number }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dateStr = formatLocalDate(currentDate);
        const dayIndex = currentDate.getDay();
        const dayHours = openingHours.find((h: any) => h.dayIndex === dayIndex);

        if (!dayHours || dayHours.isClosed) {
            days.push({ date: dateStr, available: false, maxDurationMinutes: 0 });
        } else {
            const openHour = parseInt(dayHours.open.split(":")[0], 10);
            const closeHour = parseInt(dayHours.close.split(":")[0], 10);
            const dayStart = new Date(currentDate);
            dayStart.setHours(openHour, 0, 0, 0);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(closeHour, 0, 0, 0);

            // Check for blocks
            const isBlocked = blocks.some((b) =>
                dayStart.getTime() < b.endDate && dayEnd.getTime() > b.startDate
            );

            // Find available windows
            const dayBookings = bookings
                .filter((b) => b.startTime < dayEnd.getTime() && b.endTime > dayStart.getTime())
                .sort((a, b) => a.startTime - b.startTime);

            let maxAvailable = (closeHour - openHour) * 60; // Full day in minutes

            if (dayBookings.length > 0) {
                // Calculate largest gap
                let gaps: number[] = [];
                let lastEnd = dayStart.getTime();

                for (const booking of dayBookings) {
                    const gap = (booking.startTime - lastEnd) / (60 * 1000);
                    if (gap > 0) gaps.push(gap);
                    lastEnd = Math.max(lastEnd, booking.endTime);
                }

                // Gap after last booking
                const finalGap = (dayEnd.getTime() - lastEnd) / (60 * 1000);
                if (finalGap > 0) gaps.push(finalGap);

                maxAvailable = gaps.length > 0 ? Math.max(...gaps) : 0;
            }

            if (maxDuration) {
                maxAvailable = Math.min(maxAvailable, maxDuration);
            }

            days.push({
                date: dateStr,
                available: !isBlocked && maxAvailable > 0,
                maxDurationMinutes: isBlocked ? 0 : Math.floor(maxAvailable),
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { mode: "DURATION", days };
}

// Helper: Calculate ticket-based availability
function calculateTicketAvailability(
    start: Date,
    end: Date,
    openingHours: any[],
    bookings: any[],
    totalCapacity: number
) {
    const days: Array<{ date: string; available: number; capacity: number }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dateStr = formatLocalDate(currentDate);
        const dayIndex = currentDate.getDay();
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dayHours = openingHours.find((h: any) => h.dayIndex === dayIndex);

        if (!dayHours || dayHours.isClosed) {
            days.push({ date: dateStr, available: 0, capacity: totalCapacity });
        } else {
            // Count tickets sold for this day
            const dayBookings = bookings.filter((b) =>
                b.startTime < dayEnd.getTime() && b.endTime > dayStart.getTime()
            );

            // Sum quantities from metadata or count as 1 each
            const soldTickets = dayBookings.reduce((sum, b) => {
                const qty = (b.metadata as any)?.quantity || 1;
                return sum + qty;
            }, 0);

            days.push({
                date: dateStr,
                available: Math.max(0, totalCapacity - soldTickets),
                capacity: totalCapacity,
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { mode: "TICKETS", days };
}

/**
 * Validate a booking slot before creating.
 * Pre-flight validation for conflict checking.
 *
 * Resource config (capacity, openingHours) is passed in by the facade —
 * the resource table is NOT in this component.
 */
export const validateBookingSlot = query({
    args: {
        resourceId: v.string(),
        startTime: v.number(),    // epoch ms
        endTime: v.number(),      // epoch ms
        quantity: v.optional(v.number()),  // For TICKETS mode
        // Resource config passed from facade
        capacity: v.optional(v.number()),
        openingHours: v.optional(v.array(v.any())),
    },
    returns: v.any(),
    handler: async (ctx, args) => {
        const { resourceId, startTime, endTime, quantity, capacity } = args;
        const openingHours = args.openingHours || [];

        // Check for booking conflicts
        const conflicts = await ctx.db
            .query("bookings")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "cancelled"),
                    q.neq(q.field("status"), "rejected"),
                    q.lt(q.field("startTime"), endTime),
                    q.gt(q.field("endTime"), startTime)
                )
            )
            .collect();

        if (conflicts.length > 0) {
            return { valid: false, reason: "Time slot conflicts with existing booking" };
        }

        // Check for blocks
        const blocks = await ctx.db
            .query("blocks")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "active"),
                    q.lt(q.field("startDate"), endTime),
                    q.gt(q.field("endDate"), startTime)
                )
            )
            .collect();

        if (blocks.length > 0) {
            return { valid: false, reason: "Time slot is blocked" };
        }

        // For TICKETS mode, check capacity
        if (quantity !== undefined && capacity) {
            const dayStart = new Date(startTime);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(startTime);
            dayEnd.setHours(23, 59, 59, 999);

            const dayBookings = await ctx.db
                .query("bookings")
                .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
                .filter((q) =>
                    q.and(
                        q.neq(q.field("status"), "cancelled"),
                        q.neq(q.field("status"), "rejected"),
                        q.gte(q.field("startTime"), dayStart.getTime()),
                        q.lte(q.field("endTime"), dayEnd.getTime())
                    )
                )
                .collect();

            const soldTickets = dayBookings.reduce((sum, b) => {
                const qty = (b.metadata as any)?.quantity || 1;
                return sum + qty;
            }, 0);

            if (soldTickets + quantity > capacity) {
                return { valid: false, reason: `Only ${capacity - soldTickets} tickets available` };
            }
        }

        // Check opening hours
        if (openingHours.length > 0) {
            const startDate = new Date(startTime);
            const dayIndex = startDate.getDay();
            const dayHours = openingHours.find((h: any) => h.dayIndex === dayIndex);

            if (!dayHours || dayHours.isClosed) {
                return { valid: false, reason: "Resource is closed on this day" };
            }

            const startHour = startDate.getHours();
            const startMinute = startDate.getMinutes();
            const startTimeStr = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;

            const endDate = new Date(endTime);
            const endHour = endDate.getHours();
            const endMinute = endDate.getMinutes();
            const endTimeStr = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

            if (startTimeStr < dayHours.open || endTimeStr > dayHours.close) {
                return { valid: false, reason: `Outside opening hours (${dayHours.open}-${dayHours.close})` };
            }
        }

        return { valid: true };
    },
});
