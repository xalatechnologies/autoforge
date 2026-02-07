/**
 * Pricing Component — Query Functions
 *
 * Read-only queries for pricing groups, resource pricing, org/user pricing groups,
 * additional services, and pricing configuration display.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// PRICING GROUPS
// =============================================================================

// List pricing groups for a tenant
export const listGroups = query({
    args: {
        tenantId: v.string(),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, isActive, limit = 100 }) => {
        let groups = await ctx.db
            .query("pricingGroups")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        if (isActive !== undefined) {
            groups = groups.filter((g) => g.isActive === isActive);
        }

        groups.sort((a, b) => a.priority - b.priority);

        return groups.slice(0, limit);
    },
});

// Get a single pricing group by ID
export const getGroup = query({
    args: { id: v.id("pricingGroups") },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const group = await ctx.db.get(id);
        if (!group) throw new Error("Pricing group not found");
        return group;
    },
});

// =============================================================================
// RESOURCE PRICING
// =============================================================================

// List resource pricing (with pricing group info)
export const listForResource = query({
    args: {
        resourceId: v.string(),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { resourceId, isActive, limit = 100 }) => {
        let pricing = await ctx.db
            .query("resourcePricing")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .collect();

        if (isActive !== undefined) {
            pricing = pricing.filter((p) => p.isActive === isActive);
        } else {
            pricing = pricing.filter((p) => p.isActive === true);
        }

        pricing = pricing.slice(0, limit);

        // Batch fetch pricing groups to avoid N+1
        const groupIds = [...new Set(pricing.map((p) => p.pricingGroupId).filter(Boolean))];
        const groups = await Promise.all(groupIds.map((id) => ctx.db.get(id as any)));
        const groupMap = new Map(groups.filter(Boolean).map((g: any) => [g._id, g]));

        const withGroups = pricing.map((p) => ({
            ...p,
            pricingGroup: p.pricingGroupId ? groupMap.get(p.pricingGroupId) ?? null : null,
        }));

        return withGroups;
    },
});

// Get a single resource pricing entry
export const get = query({
    args: { id: v.id("resourcePricing") },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const entry = await ctx.db.get(id);
        if (!entry) throw new Error("Resource pricing not found");
        return entry;
    },
});

// List all resource pricing for a tenant
export const listByTenant = query({
    args: {
        tenantId: v.string(),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, isActive, limit = 100 }) => {
        let entries = await ctx.db
            .query("resourcePricing")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        if (isActive !== undefined) {
            entries = entries.filter((e) => e.isActive === isActive);
        }

        return entries.slice(0, limit);
    },
});

// =============================================================================
// PRICING CONFIGURATION — Display queries
// =============================================================================

/**
 * Get pricing configuration for a resource (for display purposes).
 * No resource table lookup needed — queries resourcePricing directly by index.
 */
export const getResourcePricingConfig = query({
    args: {
        resourceId: v.string(),
        bookingMode: v.optional(v.string()),
    },
    returns: v.any(),
    handler: async (ctx, { resourceId, bookingMode }) => {
        // Get all active pricing for this resource
        const allPricing = await ctx.db
            .query("resourcePricing")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        if (allPricing.length === 0) {
            return null;
        }

        // Filter by booking mode if specified
        let pricing = allPricing[0];
        if (bookingMode && allPricing.length > 1) {
            const modeSpecific = allPricing.find(p =>
                p.applicableBookingModes?.includes(bookingMode)
            );
            if (modeSpecific) {
                pricing = modeSpecific;
            }
        }

        // Get pricing group if available
        const pricingGroup = pricing.pricingGroupId
            ? await ctx.db.get(pricing.pricingGroupId as any)
            : null;

        // Determine the price label based on price type
        const getPriceLabel = () => {
            const curr = pricing.currency;
            switch (pricing.priceType) {
                case 'per_hour':
                case 'hourly':
                    return `${pricing.pricePerHour?.toLocaleString('nb-NO') ?? pricing.basePrice} ${curr}/time`;
                case 'per_day':
                case 'daily':
                    return `${pricing.pricePerDay?.toLocaleString('nb-NO') ?? pricing.basePrice} ${curr}/dag`;
                case 'per_half_day':
                    return `${pricing.pricePerHalfDay?.toLocaleString('nb-NO') ?? pricing.basePrice} ${curr}/halvdag`;
                case 'per_person':
                    return `${pricing.pricePerPerson?.toLocaleString('nb-NO') ?? pricing.basePrice} ${curr}/person`;
                case 'per_person_hour':
                    return `${pricing.pricePerPersonHour?.toLocaleString('nb-NO') ?? pricing.basePrice} ${curr}/person/time`;
                case 'sport_slot':
                    // For sport slots, show the cheapest option
                    if (pricing.slotOptions && pricing.slotOptions.length > 0) {
                        const minPrice = Math.min(...pricing.slotOptions.map((o: any) => o.price));
                        return `fra ${minPrice.toLocaleString('nb-NO')} ${curr}`;
                    }
                    return `${pricing.basePrice} ${curr}`;
                case 'per_booking':
                case 'per_session':
                    return `${pricing.basePrice?.toLocaleString('nb-NO')} ${curr}`;
                default:
                    return `${pricing.basePrice?.toLocaleString('nb-NO')} ${curr}`;
            }
        };

        return {
            ...pricing,
            pricingGroup,
            // Slot options for sport_slot mode
            slotOptions: pricing.slotOptions ?? [],
            // Constraints
            constraints: {
                minDurationMinutes: pricing.minDuration,
                maxDurationMinutes: pricing.maxDuration,
                minPeople: pricing.minPeople,
                maxPeople: pricing.maxPeople,
                minAge: pricing.minAge,
                maxAge: pricing.maxAge,
                slotDurationMinutes: pricing.slotDurationMinutes,
                advanceBookingDays: pricing.advanceBookingDays,
                sameDayBookingAllowed: pricing.sameDayBookingAllowed,
                cancellationHours: pricing.cancellationHours,
            },
            // Feature toggles (defaults to true if not set)
            featureToggles: {
                enableDiscountCodes: pricing.enableDiscountCodes ?? true,
                enableSurcharges: pricing.enableSurcharges ?? true,
                enablePriceGroups: pricing.enablePriceGroups ?? true,
            },
            // Formatted display info
            displayInfo: {
                priceType: pricing.priceType,
                priceLabel: getPriceLabel(),
                hasCleaningFee: (pricing.cleaningFee ?? 0) > 0,
                hasDeposit: (pricing.depositAmount ?? 0) > 0,
                hasServiceFee: (pricing.serviceFee ?? 0) > 0,
                isPricePerPerson: ['per_person', 'per_person_hour', 'per_person_day'].includes(pricing.priceType),
                isSportSlot: pricing.priceType === 'sport_slot',
                taxRate: pricing.taxRate ?? 0.25,
                taxIncluded: pricing.taxIncluded ?? false,
            },
        };
    },
});

/**
 * Get all pricing groups applicable to a resource (for selection in UI).
 * The facade passes tenantId since the component cannot read the resources table.
 */
export const getResourcePriceGroups = query({
    args: {
        resourceId: v.string(),
        tenantId: v.string(),
        bookingMode: v.optional(v.string()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { resourceId, tenantId, bookingMode }) => {
        // Get all pricing configurations for this resource
        const pricingConfigs = await ctx.db
            .query("resourcePricing")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Collect unique pricing group IDs
        const groupIds = new Set<string>();
        for (const config of pricingConfigs) {
            if (config.pricingGroupId) {
                // Check if applicable to the booking mode
                if (!bookingMode || !config.applicableBookingModes ||
                    config.applicableBookingModes.length === 0 ||
                    config.applicableBookingModes.includes(bookingMode)) {
                    groupIds.add(config.pricingGroupId);
                }
            }
        }

        // Also get tenant-level pricing groups that might apply
        const tenantGroups = await ctx.db
            .query("pricingGroups")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Filter by booking mode and validity
        const now = Date.now();
        const applicableGroups = tenantGroups.filter(group => {
            // Check booking mode applicability
            if (bookingMode && group.applicableBookingModes &&
                group.applicableBookingModes.length > 0 &&
                !group.applicableBookingModes.includes(bookingMode)) {
                return false;
            }
            // Check validity dates
            if (group.validFrom && group.validFrom > now) return false;
            if (group.validUntil && group.validUntil < now) return false;
            return true;
        });

        // Sort by priority
        applicableGroups.sort((a, b) => a.priority - b.priority);

        return applicableGroups.map(group => ({
            id: group._id,
            name: group.name,
            description: group.description,
            groupType: group.groupType,
            discountPercent: group.discountPercent,
            discountAmount: group.discountAmount,
            isDefault: group.isDefault,
            priority: group.priority,
        }));
    },
});

// =============================================================================
// ORG PRICING GROUPS
// =============================================================================

// List org pricing group assignments
export const listOrgPricingGroups = query({
    args: {
        tenantId: v.string(),
        organizationId: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, organizationId, isActive, limit = 100 }) => {
        let entries;

        if (organizationId) {
            entries = await ctx.db
                .query("orgPricingGroups")
                .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
                .collect();
            entries = entries.filter((e) => e.tenantId === tenantId);
        } else {
            entries = await ctx.db
                .query("orgPricingGroups")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
                .collect();
        }

        if (isActive !== undefined) {
            entries = entries.filter((e) => e.isActive === isActive);
        }

        return entries.slice(0, limit);
    },
});

// =============================================================================
// USER PRICING GROUPS
// =============================================================================

// List user pricing group assignments
export const listUserPricingGroups = query({
    args: {
        tenantId: v.string(),
        userId: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, userId, isActive, limit = 100 }) => {
        let entries;

        if (userId) {
            entries = await ctx.db
                .query("userPricingGroups")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();
            entries = entries.filter((e) => e.tenantId === tenantId);
        } else {
            entries = await ctx.db
                .query("userPricingGroups")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
                .collect();
        }

        if (isActive !== undefined) {
            entries = entries.filter((e) => e.isActive === isActive);
        }

        return entries.slice(0, limit);
    },
});

// =============================================================================
// ADDITIONAL SERVICES
// =============================================================================

// List additional services for a resource
export const listAdditionalServices = query({
    args: {
        resourceId: v.string(),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { resourceId, isActive, limit = 100 }) => {
        let services = await ctx.db
            .query("additionalServices")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .collect();

        if (isActive !== undefined) {
            services = services.filter((s) => s.isActive === isActive);
        }

        services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        return services.slice(0, limit);
    },
});

// List additional services for a tenant
export const listAdditionalServicesByTenant = query({
    args: {
        tenantId: v.string(),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, isActive, limit = 100 }) => {
        let services = await ctx.db
            .query("additionalServices")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        if (isActive !== undefined) {
            services = services.filter((s) => s.isActive === isActive);
        }

        services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        return services.slice(0, limit);
    },
});
