/**
 * Seasons Component Contract
 */

import { v } from "convex/values";
import { defineContract } from "../../lib/componentContract";

export const CONTRACT = defineContract({
    name: "seasons",
    version: "1.0.0",
    category: "domain",
    description: "Seasons, applications, leases, and priority rules",

    queries: {
        list: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        get: {
            args: { id: v.string() },
            returns: v.any(),
        },
        listApplications: {
            args: { seasonId: v.string() },
            returns: v.array(v.any()),
        },
        listAllocations: {
            args: { seasonId: v.string() },
            returns: v.array(v.any()),
        },
        listLeases: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
    },

    mutations: {
        create: {
            args: { tenantId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        update: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        remove: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        publish: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        close: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        submitApplication: {
            args: { seasonId: v.string(), userId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        reviewApplication: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        createAllocation: {
            args: { seasonId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        updateAllocation: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        removeAllocation: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        createLease: {
            args: { tenantId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        cancelLease: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
    },

    emits: [
        "seasons.season.created",
        "seasons.season.published",
        "seasons.season.closed",
        "seasons.application.submitted",
        "seasons.application.reviewed",
        "seasons.allocation.created",
        "seasons.lease.created",
        "seasons.lease.cancelled",
    ],

    subscribes: [
        "resources.resource.deleted",
    ],

    dependencies: {
        core: ["tenants", "users", "resources"],
        components: [],
    },
});
