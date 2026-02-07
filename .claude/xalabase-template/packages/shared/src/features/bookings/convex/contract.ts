/**
 * Bookings Component Contract
 */

import { v } from "convex/values";
import { defineContract } from "../../_shared/lib/componentContract";

export const CONTRACT = defineContract({
    name: "bookings",
    version: "1.0.0",
    category: "domain",
    description: "Bookings, blocks, allocations, conflicts, and rental agreements",

    queries: {
        list: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        get: {
            args: { id: v.string() },
            returns: v.any(),
        },
        calendar: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        getResourceAvailability: {
            args: { resourceId: v.string(), startDate: v.string(), endDate: v.string(), mode: v.string() },
            returns: v.any(),
        },
        validateBookingSlot: {
            args: { resourceId: v.string(), startTime: v.number(), endTime: v.number() },
            returns: v.any(),
        },
        listBlocks: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        getBlock: {
            args: { id: v.string() },
            returns: v.any(),
        },
        checkAvailability: {
            args: { resourceId: v.string() },
            returns: v.any(),
        },
        getAvailableSlots: {
            args: { resourceId: v.string() },
            returns: v.array(v.any()),
        },
        listAllocations: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        getAllocation: {
            args: { id: v.string() },
            returns: v.any(),
        },
    },

    mutations: {
        create: {
            args: { tenantId: v.string(), resourceId: v.string(), userId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        update: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        approve: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        reject: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        cancel: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        createBlock: {
            args: { tenantId: v.string(), resourceId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        updateBlock: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        removeBlock: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        createAllocation: {
            args: { tenantId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        removeAllocation: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
    },

    emits: [
        "bookings.booking.created",
        "bookings.booking.updated",
        "bookings.booking.approved",
        "bookings.booking.rejected",
        "bookings.booking.cancelled",
        "bookings.block.created",
        "bookings.block.removed",
    ],

    subscribes: [
        "resources.resource.deleted",
        "seasons.allocation.created",
    ],

    dependencies: {
        core: ["tenants", "users", "resources"],
        components: [],
    },
});
