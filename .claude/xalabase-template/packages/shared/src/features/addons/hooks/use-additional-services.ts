/**
 * Additional Services Hook
 *
 * Fetches additional services available for a resource.
 */

import { useQuery } from "convex/react";
import { api } from "../../_shared/hooks/convex-api";
import type { Id } from "../../_shared/hooks/convex-api";

export interface AdditionalService {
    id: string;
    name: string;
    label: string; // Alias for name (for component compatibility)
    description: string;
    price: number;
    currency: string;
    isRequired: boolean;
    displayOrder: number;
}

/**
 * Hook to fetch additional services for a resource
 */
export function useAdditionalServices(resourceId: string | undefined) {
    const services = useQuery(
        api.domain.additionalServices.listByResource,
        resourceId ? { resourceId: resourceId as Id<"resources"> } : "skip"
    );

    // Transform to component-friendly format
    const transformed: AdditionalService[] = (services ?? []).map((service) => ({
        id: service._id,
        name: service.name,
        label: service.name, // Alias for compatibility with BookingPricingStep
        description: service.description ?? "",
        price: service.price,
        currency: service.currency ?? "NOK",
        isRequired: service.isRequired ?? false,
        displayOrder: service.displayOrder ?? 999,
    }));

    return {
        services: transformed,
        isLoading: services === undefined,
    };
}

/**
 * Hook to fetch additional services for display in OverviewTab
 * Returns in the format expected by OverviewTab
 */
export function useAdditionalServicesForDisplay(resourceId: string | undefined) {
    const { services, isLoading } = useAdditionalServices(resourceId);

    // Transform to OverviewTab format
    const displayServices = services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        currency: service.currency,
    }));

    return {
        services: displayServices,
        isLoading,
    };
}
