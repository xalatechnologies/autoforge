/**
 * Pricing Facade
 *
 * Thin facade that delegates to the pricing component.
 * Preserves the existing API path (api.domain.pricing.*) for SDK compatibility.
 * Handles:
 *   - ID type conversion (typed Id<"tenants"> -> string for component)
 *   - Resource lookups (to get tenantId / categoryKey for price calculations)
 *   - Audit logging via audit component
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";
import { requireActiveUser } from "../lib/auth";

// =============================================================================
// Shared validators (mirror component-level validators for facade args)
// =============================================================================

const surchargeTypeValidator = v.union(
    v.literal("percent"),
    v.literal("fixed"),
    v.literal("multiplier")
);

const discountTypeValidator = v.union(
    v.literal("percent"),
    v.literal("fixed"),
    v.literal("free_hours")
);

// =============================================================================
// PRICING GROUPS
// =============================================================================

/**
 * List pricing groups for a tenant.
 */
export const listGroups = query({
    args: {
        tenantId: v.id("tenants"),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listGroups, {
            tenantId: tenantId as string,
            isActive,
        });
    },
});

/**
 * Get a single pricing group by ID.
 */
export const getGroup = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.pricing.queries.getGroup, { id });
    },
});

/**
 * Create a pricing group.
 */
export const createGroup = mutation({
    args: {
        tenantId: v.id("tenants"),
        name: v.string(),
        description: v.optional(v.string()),
        groupType: v.optional(v.string()),
        discountPercent: v.optional(v.number()),
        discountAmount: v.optional(v.number()),
        applicableBookingModes: v.optional(v.array(v.string())),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        isDefault: v.optional(v.boolean()),
        priority: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(components.pricing.mutations.createGroup, {
            tenantId: args.tenantId as string,
            name: args.name,
            description: args.description,
            groupType: args.groupType,
            discountPercent: args.discountPercent,
            discountAmount: args.discountAmount,
            applicableBookingModes: args.applicableBookingModes,
            validFrom: args.validFrom,
            validUntil: args.validUntil,
            isDefault: args.isDefault,
            priority: args.priority,
            metadata: args.metadata,
        });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            entityType: "pricingGroup",
            entityId: result.id as string,
            action: "created",
            sourceComponent: "pricing",
            newState: { name: args.name },
        });

        return result;
    },
});

/**
 * Update a pricing group.
 */
export const updateGroup = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        groupType: v.optional(v.string()),
        discountPercent: v.optional(v.number()),
        discountAmount: v.optional(v.number()),
        applicableBookingModes: v.optional(v.array(v.string())),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        isDefault: v.optional(v.boolean()),
        priority: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.pricing.mutations.updateGroup, {
            id,
            ...updates,
        });
    },
});

/**
 * Remove a pricing group.
 */
export const removeGroup = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.mutations.removeGroup, { id });
    },
});

// =============================================================================
// RESOURCE PRICING
// =============================================================================

/**
 * List pricing configurations for a resource.
 */
export const listForResource = query({
    args: {
        resourceId: v.string(),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { resourceId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listForResource, {
            resourceId: resourceId as string,
            isActive,
        });
    },
});

/**
 * List all resource pricing for a tenant.
 */
export const listByTenant = query({
    args: {
        tenantId: v.id("tenants"),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listByTenant, {
            tenantId: tenantId as string,
            isActive,
        });
    },
});

/**
 * Get a single resource pricing entry.
 */
export const get = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.pricing.queries.get, { id });
    },
});

/**
 * Create resource pricing.
 */
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        pricingGroupId: v.optional(v.string()),
        priceType: v.string(),
        basePrice: v.number(),
        currency: v.string(),
        pricePerHour: v.optional(v.number()),
        pricePerDay: v.optional(v.number()),
        pricePerHalfDay: v.optional(v.number()),
        pricePerPerson: v.optional(v.number()),
        pricePerPersonHour: v.optional(v.number()),
        slotOptions: v.optional(v.array(v.any())),
        minDuration: v.optional(v.number()),
        maxDuration: v.optional(v.number()),
        minPeople: v.optional(v.number()),
        maxPeople: v.optional(v.number()),
        minAge: v.optional(v.number()),
        maxAge: v.optional(v.number()),
        slotDurationMinutes: v.optional(v.number()),
        advanceBookingDays: v.optional(v.number()),
        sameDayBookingAllowed: v.optional(v.boolean()),
        cancellationHours: v.optional(v.number()),
        applicableBookingModes: v.optional(v.array(v.string())),
        depositAmount: v.optional(v.number()),
        cleaningFee: v.optional(v.number()),
        serviceFee: v.optional(v.number()),
        taxRate: v.optional(v.number()),
        taxIncluded: v.optional(v.boolean()),
        weekendMultiplier: v.optional(v.number()),
        peakHoursMultiplier: v.optional(v.number()),
        holidayMultiplier: v.optional(v.number()),
        enableDiscountCodes: v.optional(v.boolean()),
        enableSurcharges: v.optional(v.boolean()),
        enablePriceGroups: v.optional(v.boolean()),
        rules: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(components.pricing.mutations.create, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string,
            pricingGroupId: args.pricingGroupId as string | undefined,
            priceType: args.priceType,
            basePrice: args.basePrice,
            currency: args.currency,
            pricePerHour: args.pricePerHour,
            pricePerDay: args.pricePerDay,
            pricePerHalfDay: args.pricePerHalfDay,
            pricePerPerson: args.pricePerPerson,
            pricePerPersonHour: args.pricePerPersonHour,
            slotOptions: args.slotOptions,
            minDuration: args.minDuration,
            maxDuration: args.maxDuration,
            minPeople: args.minPeople,
            maxPeople: args.maxPeople,
            minAge: args.minAge,
            maxAge: args.maxAge,
            slotDurationMinutes: args.slotDurationMinutes,
            advanceBookingDays: args.advanceBookingDays,
            sameDayBookingAllowed: args.sameDayBookingAllowed,
            cancellationHours: args.cancellationHours,
            applicableBookingModes: args.applicableBookingModes,
            depositAmount: args.depositAmount,
            cleaningFee: args.cleaningFee,
            serviceFee: args.serviceFee,
            taxRate: args.taxRate,
            taxIncluded: args.taxIncluded,
            weekendMultiplier: args.weekendMultiplier,
            peakHoursMultiplier: args.peakHoursMultiplier,
            holidayMultiplier: args.holidayMultiplier,
            enableDiscountCodes: args.enableDiscountCodes,
            enableSurcharges: args.enableSurcharges,
            enablePriceGroups: args.enablePriceGroups,
            rules: args.rules,
            metadata: args.metadata,
        });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            entityType: "resourcePricing",
            entityId: result.id as string,
            action: "created",
            sourceComponent: "pricing",
            newState: { resourceId: args.resourceId as string, priceType: args.priceType },
        });

        return result;
    },
});

/**
 * Update resource pricing.
 */
export const update = mutation({
    args: {
        id: v.string(),
        priceType: v.optional(v.string()),
        basePrice: v.optional(v.number()),
        currency: v.optional(v.string()),
        pricingGroupId: v.optional(v.string()),
        pricePerHour: v.optional(v.number()),
        pricePerDay: v.optional(v.number()),
        pricePerHalfDay: v.optional(v.number()),
        pricePerPerson: v.optional(v.number()),
        pricePerPersonHour: v.optional(v.number()),
        slotOptions: v.optional(v.array(v.any())),
        minDuration: v.optional(v.number()),
        maxDuration: v.optional(v.number()),
        minPeople: v.optional(v.number()),
        maxPeople: v.optional(v.number()),
        minAge: v.optional(v.number()),
        maxAge: v.optional(v.number()),
        slotDurationMinutes: v.optional(v.number()),
        advanceBookingDays: v.optional(v.number()),
        sameDayBookingAllowed: v.optional(v.boolean()),
        cancellationHours: v.optional(v.number()),
        applicableBookingModes: v.optional(v.array(v.string())),
        depositAmount: v.optional(v.number()),
        cleaningFee: v.optional(v.number()),
        serviceFee: v.optional(v.number()),
        taxRate: v.optional(v.number()),
        taxIncluded: v.optional(v.boolean()),
        weekendMultiplier: v.optional(v.number()),
        peakHoursMultiplier: v.optional(v.number()),
        holidayMultiplier: v.optional(v.number()),
        enableDiscountCodes: v.optional(v.boolean()),
        enableSurcharges: v.optional(v.boolean()),
        enablePriceGroups: v.optional(v.boolean()),
        rules: v.optional(v.any()),
        isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.pricing.mutations.update, {
            id,
            ...updates,
        });
    },
});

/**
 * Remove resource pricing.
 */
export const remove = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.mutations.remove, { id });
    },
});

// =============================================================================
// PRICE CALCULATION
// =============================================================================

/**
 * Calculate price for a booking (simple).
 * Looks up resource to validate existence, then delegates.
 */
export const calculatePrice = query({
    args: {
        resourceId: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        userId: v.optional(v.id("users")),
        organizationId: v.optional(v.id("organizations")),
        addonIds: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        // Validate resource exists via resources component
        const resource = await ctx.runQuery(components.resources.queries.get, {
            id: args.resourceId as string,
        });

        if (!resource) {
            throw new Error("Resource not found");
        }

        return ctx.runQuery(components.pricing.calculations.calculatePrice, {
            resourceId: args.resourceId as string,
            startTime: args.startTime,
            endTime: args.endTime,
            userId: args.userId as string | undefined,
            organizationId: args.organizationId as string | undefined,
            // Note: addonIds are external addons; the component uses additionalServiceIds
            // For now, pass undefined — component handles its own additional services
        });
    },
});

/**
 * Calculate price with full breakdown including surcharges, discounts, and tax.
 * Looks up resource from resources component to get tenantId and categoryKey.
 */
export const calculatePriceWithBreakdown = query({
    args: {
        resourceId: v.string(),
        bookingMode: v.string(),
        durationMinutes: v.number(),
        attendees: v.number(),
        tickets: v.optional(v.number()),
        priceGroupId: v.optional(v.string()),
        selectedSlotMinutes: v.optional(v.number()),
        bookingDate: v.optional(v.number()),
        bookingTime: v.optional(v.string()),
        discountCode: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        // Look up resource to get tenantId and categoryKey
        const resource = await ctx.runQuery(components.resources.queries.get, {
            id: args.resourceId as string,
        });

        if (!resource) {
            return {
                items: [],
                surcharges: [],
                subtotal: 0,
                surchargeTotal: 0,
                subtotalWithSurcharges: 0,
                discounts: [],
                totalDiscountAmount: 0,
                subtotalAfterDiscount: 0,
                taxAmount: 0,
                taxRate: 0.25,
                total: 0,
                currency: "NOK",
                deposit: undefined,
                summary: "Pris på forespørsel",
                explanation: "Ressursen ble ikke funnet.",
                pricingModel: "per_booking",
                validation: { valid: false, errors: ["Ressursen ble ikke funnet"] },
                slotOptions: [],
                constraints: {},
            };
        }

        return ctx.runQuery(components.pricing.calculations.calculatePriceWithBreakdown, {
            tenantId: (resource as any).tenantId,
            resourceId: args.resourceId as string,
            resourceCategoryKey: (resource as any).categoryKey,
            bookingMode: args.bookingMode,
            durationMinutes: args.durationMinutes,
            attendees: args.attendees,
            tickets: args.tickets,
            priceGroupId: args.priceGroupId,
            selectedSlotMinutes: args.selectedSlotMinutes,
            bookingDate: args.bookingDate,
            bookingTime: args.bookingTime,
            discountCode: args.discountCode,
            userId: args.userId as string | undefined,
            organizationId: args.organizationId as string | undefined,
        });
    },
});

/**
 * Get pricing configuration for a resource (for display purposes).
 */
export const getResourcePricingConfig = query({
    args: {
        resourceId: v.string(),
        bookingMode: v.optional(v.string()),
    },
    handler: async (ctx, { resourceId, bookingMode }) => {
        return ctx.runQuery(components.pricing.queries.getResourcePricingConfig, {
            resourceId: resourceId as string,
            bookingMode,
        });
    },
});

/**
 * Get all pricing groups applicable to a resource (for selection in UI).
 * Looks up resource to get tenantId, then delegates.
 */
export const getResourcePriceGroups = query({
    args: {
        resourceId: v.string(),
        bookingMode: v.optional(v.string()),
    },
    handler: async (ctx, { resourceId, bookingMode }) => {
        // Look up resource to get tenantId
        const resource = await ctx.runQuery(components.resources.queries.get, {
            id: resourceId as string,
        });

        if (!resource) {
            return [];
        }

        return ctx.runQuery(components.pricing.queries.getResourcePriceGroups, {
            resourceId: resourceId as string,
            tenantId: (resource as any).tenantId,
            bookingMode,
        });
    },
});

/**
 * Get applicable surcharges for a booking.
 * Looks up resource to get tenantId and categoryKey, then delegates.
 */
export const getApplicableSurcharges = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        bookingDate: v.number(),
        bookingTime: v.optional(v.string()),
    },
    handler: async (ctx, { tenantId, resourceId, bookingDate, bookingTime }) => {
        // Look up resource to get categoryKey
        const resource = await ctx.runQuery(components.resources.queries.get, {
            id: resourceId as string,
        });

        return ctx.runQuery(components.pricing.surcharges.getApplicableSurcharges, {
            tenantId: tenantId as string,
            resourceId: resourceId as string,
            bookingDate,
            bookingTime,
            resourceCategoryKey: (resource as any)?.categoryKey,
        });
    },
});

// =============================================================================
// HOLIDAYS
// =============================================================================

/**
 * List holidays for a tenant.
 */
export const listHolidays = query({
    args: {
        tenantId: v.id("tenants"),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, isActive }) => {
        return ctx.runQuery(components.pricing.holidays.listHolidays, {
            tenantId: tenantId as string,
            isActive,
        });
    },
});

/**
 * Create a holiday.
 */
export const createHoliday = mutation({
    args: {
        tenantId: v.id("tenants"),
        name: v.string(),
        date: v.string(),
        isRecurring: v.boolean(),
        surchargeType: surchargeTypeValidator,
        surchargeValue: v.number(),
        appliesToResources: v.optional(v.array(v.string())),
        appliesToCategories: v.optional(v.array(v.string())),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.pricing.holidays.createHoliday, {
            tenantId: args.tenantId as string,
            name: args.name,
            date: args.date,
            isRecurring: args.isRecurring,
            surchargeType: args.surchargeType,
            surchargeValue: args.surchargeValue,
            appliesToResources: args.appliesToResources?.map((id) => id as string),
            appliesToCategories: args.appliesToCategories,
            metadata: args.metadata,
        });
    },
});

/**
 * Update a holiday.
 */
export const updateHoliday = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        date: v.optional(v.string()),
        isRecurring: v.optional(v.boolean()),
        surchargeType: v.optional(surchargeTypeValidator),
        surchargeValue: v.optional(v.number()),
        appliesToResources: v.optional(v.array(v.string())),
        appliesToCategories: v.optional(v.array(v.string())),
        isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, appliesToResources, ...updates }) => {
        return ctx.runMutation(components.pricing.holidays.updateHoliday, {
            id,
            ...updates,
            appliesToResources: appliesToResources?.map((rid) => rid as string),
        });
    },
});

/**
 * Delete a holiday.
 */
export const deleteHoliday = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.holidays.deleteHoliday, { id });
    },
});

// =============================================================================
// WEEKDAY PRICING
// =============================================================================

/**
 * List weekday pricing rules.
 */
export const listWeekdayPricing = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        dayOfWeek: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, resourceId, dayOfWeek, isActive }) => {
        return ctx.runQuery(components.pricing.surcharges.listWeekdayPricing, {
            tenantId: tenantId as string,
            resourceId: resourceId as string | undefined,
            dayOfWeek,
            isActive,
        });
    },
});

/**
 * Create a weekday pricing rule.
 */
export const createWeekdayPricing = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        dayOfWeek: v.number(),
        surchargeType: surchargeTypeValidator,
        surchargeValue: v.number(),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        label: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.pricing.surcharges.createWeekdayPricing, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string | undefined,
            dayOfWeek: args.dayOfWeek,
            surchargeType: args.surchargeType,
            surchargeValue: args.surchargeValue,
            startTime: args.startTime,
            endTime: args.endTime,
            label: args.label,
            metadata: args.metadata,
        });
    },
});

/**
 * Update a weekday pricing rule.
 */
export const updateWeekdayPricing = mutation({
    args: {
        id: v.string(),
        dayOfWeek: v.optional(v.number()),
        surchargeType: v.optional(surchargeTypeValidator),
        surchargeValue: v.optional(v.number()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        label: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.pricing.surcharges.updateWeekdayPricing, {
            id,
            ...updates,
        });
    },
});

/**
 * Delete a weekday pricing rule.
 */
export const deleteWeekdayPricing = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.surcharges.deleteWeekdayPricing, { id });
    },
});

// =============================================================================
// DISCOUNT CODES
// =============================================================================

/**
 * List discount codes for a tenant.
 */
export const listDiscountCodes = query({
    args: {
        tenantId: v.id("tenants"),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, isActive }) => {
        return ctx.runQuery(components.pricing.discounts.listDiscountCodes, {
            tenantId: tenantId as string,
            isActive,
        });
    },
});

/**
 * Create a discount code.
 */
export const createDiscountCode = mutation({
    args: {
        tenantId: v.id("tenants"),
        code: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        discountType: discountTypeValidator,
        discountValue: v.number(),
        minBookingAmount: v.optional(v.number()),
        maxDiscountAmount: v.optional(v.number()),
        minDurationMinutes: v.optional(v.number()),
        appliesToResources: v.optional(v.array(v.string())),
        appliesToCategories: v.optional(v.array(v.string())),
        appliesToBookingModes: v.optional(v.array(v.string())),
        maxUsesTotal: v.optional(v.number()),
        maxUsesPerUser: v.optional(v.number()),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        restrictToUsers: v.optional(v.array(v.string())),
        restrictToOrgs: v.optional(v.array(v.string())),
        restrictToPriceGroups: v.optional(v.array(v.string())),
        firstTimeBookersOnly: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.pricing.discounts.createDiscountCode, {
            tenantId: args.tenantId as string,
            code: args.code,
            name: args.name,
            description: args.description,
            discountType: args.discountType,
            discountValue: args.discountValue,
            minBookingAmount: args.minBookingAmount,
            maxDiscountAmount: args.maxDiscountAmount,
            minDurationMinutes: args.minDurationMinutes,
            appliesToResources: args.appliesToResources?.map((id) => id as string),
            appliesToCategories: args.appliesToCategories,
            appliesToBookingModes: args.appliesToBookingModes,
            maxUsesTotal: args.maxUsesTotal,
            maxUsesPerUser: args.maxUsesPerUser,
            validFrom: args.validFrom,
            validUntil: args.validUntil,
            restrictToUsers: args.restrictToUsers,
            restrictToOrgs: args.restrictToOrgs,
            restrictToPriceGroups: args.restrictToPriceGroups,
            firstTimeBookersOnly: args.firstTimeBookersOnly,
            metadata: args.metadata,
        });
    },
});

/**
 * Update a discount code.
 */
export const updateDiscountCode = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        discountType: v.optional(discountTypeValidator),
        discountValue: v.optional(v.number()),
        minBookingAmount: v.optional(v.number()),
        maxDiscountAmount: v.optional(v.number()),
        minDurationMinutes: v.optional(v.number()),
        appliesToResources: v.optional(v.array(v.string())),
        appliesToCategories: v.optional(v.array(v.string())),
        appliesToBookingModes: v.optional(v.array(v.string())),
        maxUsesTotal: v.optional(v.number()),
        maxUsesPerUser: v.optional(v.number()),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        restrictToUsers: v.optional(v.array(v.string())),
        restrictToOrgs: v.optional(v.array(v.string())),
        restrictToPriceGroups: v.optional(v.array(v.string())),
        firstTimeBookersOnly: v.optional(v.boolean()),
        isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, appliesToResources, ...updates }) => {
        return ctx.runMutation(components.pricing.discounts.updateDiscountCode, {
            id,
            ...updates,
            appliesToResources: appliesToResources?.map((rid) => rid as string),
        });
    },
});

/**
 * Delete a discount code.
 */
export const deleteDiscountCode = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.discounts.deleteDiscountCode, { id });
    },
});

/**
 * Validate and get discount code details.
 */
export const validateDiscountCode = query({
    args: {
        tenantId: v.id("tenants"),
        code: v.string(),
        resourceId: v.optional(v.string()),
        categoryKey: v.optional(v.string()),
        bookingMode: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        organizationId: v.optional(v.id("organizations")),
        priceGroupId: v.optional(v.string()),
        bookingAmount: v.optional(v.number()),
        durationMinutes: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return ctx.runQuery(components.pricing.discounts.validateDiscountCode, {
            tenantId: args.tenantId as string,
            code: args.code,
            resourceId: args.resourceId as string | undefined,
            categoryKey: args.categoryKey,
            bookingMode: args.bookingMode,
            userId: args.userId as string | undefined,
            organizationId: args.organizationId as string | undefined,
            priceGroupId: args.priceGroupId,
            bookingAmount: args.bookingAmount,
            durationMinutes: args.durationMinutes,
        });
    },
});

/**
 * Apply discount code (record usage after booking).
 */
export const applyDiscountCode = mutation({
    args: {
        tenantId: v.id("tenants"),
        discountCodeId: v.string(),
        userId: v.id("users"),
        bookingId: v.optional(v.string()),
        discountAmount: v.number(),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.userId);

        return ctx.runMutation(components.pricing.discounts.applyDiscountCode, {
            tenantId: args.tenantId as string,
            discountCodeId: args.discountCodeId,
            userId: args.userId as string,
            bookingId: args.bookingId as string | undefined,
            discountAmount: args.discountAmount,
        });
    },
});

// =============================================================================
// ADDITIONAL SERVICES
// =============================================================================

/**
 * List additional services for a resource.
 */
export const listAdditionalServices = query({
    args: {
        resourceId: v.string(),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { resourceId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listAdditionalServices, {
            resourceId: resourceId as string,
            isActive,
        });
    },
});

/**
 * List additional services for a tenant.
 */
export const listAdditionalServicesByTenant = query({
    args: {
        tenantId: v.id("tenants"),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listAdditionalServicesByTenant, {
            tenantId: tenantId as string,
            isActive,
        });
    },
});

/**
 * Create an additional service.
 */
export const createAdditionalService = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        currency: v.optional(v.string()),
        isRequired: v.optional(v.boolean()),
        displayOrder: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.pricing.mutations.createAdditionalService, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string,
            name: args.name,
            description: args.description,
            price: args.price,
            currency: args.currency,
            isRequired: args.isRequired,
            displayOrder: args.displayOrder,
            metadata: args.metadata,
        });
    },
});

/**
 * Update an additional service.
 */
export const updateAdditionalService = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        currency: v.optional(v.string()),
        isRequired: v.optional(v.boolean()),
        displayOrder: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.pricing.mutations.updateAdditionalService, {
            id,
            ...updates,
        });
    },
});

/**
 * Remove an additional service.
 */
export const removeAdditionalService = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.mutations.removeAdditionalService, { id });
    },
});

// =============================================================================
// ORG PRICING GROUPS
// =============================================================================

/**
 * List org pricing group assignments.
 */
export const listOrgPricingGroups = query({
    args: {
        tenantId: v.id("tenants"),
        organizationId: v.optional(v.id("organizations")),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, organizationId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listOrgPricingGroups, {
            tenantId: tenantId as string,
            organizationId: organizationId as string | undefined,
            isActive,
        });
    },
});

/**
 * Assign a pricing group to an organization.
 */
export const assignOrgPricingGroup = mutation({
    args: {
        tenantId: v.id("tenants"),
        organizationId: v.id("organizations"),
        pricingGroupId: v.string(),
        discountPercent: v.optional(v.number()),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.pricing.mutations.assignOrgPricingGroup, {
            tenantId: args.tenantId as string,
            organizationId: args.organizationId as string,
            pricingGroupId: args.pricingGroupId,
            discountPercent: args.discountPercent,
            validFrom: args.validFrom,
            validUntil: args.validUntil,
            metadata: args.metadata,
        });
    },
});

/**
 * Remove an org pricing group assignment.
 */
export const removeOrgPricingGroup = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.mutations.removeOrgPricingGroup, { id });
    },
});

// =============================================================================
// USER PRICING GROUPS
// =============================================================================

/**
 * List user pricing group assignments.
 */
export const listUserPricingGroups = query({
    args: {
        tenantId: v.id("tenants"),
        userId: v.optional(v.id("users")),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, userId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listUserPricingGroups, {
            tenantId: tenantId as string,
            userId: userId as string | undefined,
            isActive,
        });
    },
});

/**
 * Assign a pricing group to a user.
 */
export const assignUserPricingGroup = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        pricingGroupId: v.string(),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.pricing.mutations.assignUserPricingGroup, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            pricingGroupId: args.pricingGroupId,
            validFrom: args.validFrom,
            validUntil: args.validUntil,
            metadata: args.metadata,
        });
    },
});

/**
 * Remove a user pricing group assignment.
 */
export const removeUserPricingGroup = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.pricing.mutations.removeUserPricingGroup, { id });
    },
});
