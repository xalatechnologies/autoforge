/**
 * Addons Hooks
 *
 * CRUD and association hooks for add-ons (resource and booking addons).
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../_shared/hooks/convex-api";
import type { Id } from "../../_shared/hooks/convex-api";

// =============================================================================
// Types
// =============================================================================

export interface Addon {
    _id: string;
    tenantId: string;
    name: string;
    slug: string;
    description?: string;
    category?: string;
    priceType: string;
    price: number;
    currency: string;
    maxQuantity?: number;
    requiresApproval: boolean;
    leadTimeHours?: number;
    icon?: string;
    images: any[];
    displayOrder: number;
    isActive: boolean;
    metadata: Record<string, unknown>;
}

export interface ResourceAddon {
    _id: string;
    tenantId: string;
    resourceId: string;
    addonId: string;
    isRequired: boolean;
    isRecommended: boolean;
    customPrice?: number;
    displayOrder: number;
    isActive: boolean;
    addon: Addon | null;
    effectivePrice: number;
}

export interface BookingAddon {
    _id: string;
    tenantId: string;
    bookingId: string;
    addonId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    notes?: string;
    status: "pending" | "confirmed" | "approved" | "rejected" | "cancelled";
    addon: Addon | null;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * List addons for a tenant, optionally filtered by category or active status.
 */
export function useAddons(
    tenantId: string | undefined,
    options?: { category?: string; isActive?: boolean }
) {
    const data = useQuery(
        api.domain.addons.list,
        tenantId
            ? {
                  tenantId: tenantId as Id<"tenants">,
                  category: options?.category,
                  isActive: options?.isActive,
              }
            : "skip"
    );

    return {
        data: (data ?? []) as Addon[],
        isLoading: data === undefined,
    };
}

/**
 * Get a single addon by ID.
 */
export function useAddon(addonId: string | undefined) {
    const data = useQuery(
        api.domain.addons.get,
        addonId ? { id: addonId } : "skip"
    );

    return {
        data: data as Addon | null | undefined,
        isLoading: data === undefined,
    };
}

/**
 * List addons available for a specific resource.
 */
export function useAddonsForResource(resourceId: string | undefined) {
    const data = useQuery(
        api.domain.addons.listForResource,
        resourceId ? { resourceId } : "skip"
    );

    return {
        data: (data ?? []) as ResourceAddon[],
        isLoading: data === undefined,
    };
}

/**
 * List addons selected for a specific booking.
 */
export function useAddonsForBooking(bookingId: string | undefined) {
    const data = useQuery(
        api.domain.addons.listForBooking,
        bookingId ? { bookingId } : "skip"
    );

    return {
        data: (data ?? []) as BookingAddon[],
        isLoading: data === undefined,
    };
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new addon.
 */
export function useCreateAddon() {
    const mutate = useMutation(api.domain.addons.create);
    return { mutate };
}

/**
 * Update an existing addon.
 */
export function useUpdateAddon() {
    const mutate = useMutation(api.domain.addons.update);
    return { mutate };
}

/**
 * Delete an addon.
 */
export function useDeleteAddon() {
    const mutate = useMutation(api.domain.addons.remove);
    return { mutate };
}

/**
 * Add an addon to a resource.
 */
export function useAddAddonToResource() {
    const mutate = useMutation(api.domain.addons.addToResource);
    return { mutate };
}

/**
 * Remove an addon from a resource.
 */
export function useRemoveAddonFromResource() {
    const mutate = useMutation(api.domain.addons.removeFromResource);
    return { mutate };
}

/**
 * Add an addon to a booking.
 */
export function useAddAddonToBooking() {
    const mutate = useMutation(api.domain.addons.addToBooking);
    return { mutate };
}

/**
 * Update a booking addon (quantity, notes).
 */
export function useUpdateBookingAddon() {
    const mutate = useMutation(api.domain.addons.updateBookingAddon);
    return { mutate };
}

/**
 * Remove an addon from a booking.
 */
export function useRemoveAddonFromBooking() {
    const mutate = useMutation(api.domain.addons.removeFromBooking);
    return { mutate };
}

/**
 * Approve a pending booking addon.
 */
export function useApproveBookingAddon() {
    const mutate = useMutation(api.domain.addons.approveBookingAddon);
    return { mutate };
}

/**
 * Reject a pending booking addon.
 */
export function useRejectBookingAddon() {
    const mutate = useMutation(api.domain.addons.rejectBookingAddon);
    return { mutate };
}
