/**
 * useDynamicFilterCounts
 *
 * A hook that computes dynamic filter counts based on the current filter state.
 * When one filter changes, all other filter counts update to reflect what's available.
 *
 * Key principle: For each filter dimension, we compute counts by applying all OTHER
 * filters but not the filter for that dimension. This shows users what options are
 * available if they change that specific filter.
 *
 * @example
 * ```tsx
 * const { categories, subcategories, facilities, cities } = useDynamicFilterCounts({
 *   listings,
 *   filters,
 *   categoryMapping: TYPE_TO_CATEGORY,
 *   allSubcategories: SUBCATEGORY_OPTIONS,
 *   allFacilities: FACILITY_OPTIONS,
 * });
 *
 * <ListingFilter
 *   categories={categories}
 *   subcategories={subcategories}
 *   facilities={facilities}
 *   cities={cities}
 *   // ...
 * />
 * ```
 */

import { useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface DynamicFilterListing {
  /** Listing ID */
  id: string;
  /** Listing type (e.g., 'SPACE', 'RESOURCE', 'EVENT') */
  type: string;
  /** Subcategory keys */
  subcategoryKeys?: string[];
  /** Amenities/facilities list */
  amenities?: string[];
  /** City name */
  city?: string;
  /** Price amount */
  priceAmount?: number;
  /** Capacity */
  capacity?: number;
  /** Created timestamp */
  createdAt?: string | number;
}

export interface DynamicFilterState {
  category?: string;
  subcategories?: string[];
  facilities?: string[];
  location?: string;
  maxPrice?: number;
  minCapacity?: number;
  newThisWeek?: boolean;
}

export interface CategoryOption {
  id: string;
  key: string;
  label: string;
  icon?: React.ReactNode;
  count: number;
}

export interface SubcategoryOption {
  id: string;
  key: string;
  label: string;
  parentKey: string;
  count?: number;
}

export interface FacilityOption {
  id: string;
  key: string;
  label: string;
  icon?: string;
  count?: number;
}

export interface CityOption {
  name: string;
  count: number;
}

export interface DynamicFilterConfig<T extends DynamicFilterListing> {
  /** All listings (unfiltered) */
  listings: T[];
  /** Current filter state */
  filters: DynamicFilterState;
  /** Map from listing.type to category key */
  categoryMapping: Record<string, string>;
  /** Reverse map from category key to listing.type */
  categoryToTypeMapping: Record<string, string>;
  /** All category definitions with labels and icons */
  allCategories: Omit<CategoryOption, 'count'>[];
  /** All subcategory definitions grouped by parent category */
  allSubcategories: Record<string, Omit<SubcategoryOption, 'count'>[]>;
  /** All facility definitions */
  allFacilities: Omit<FacilityOption, 'count'>[];
}

export interface DynamicFilterResult {
  /** Categories with dynamic counts */
  categories: CategoryOption[];
  /** Subcategories for selected category with counts */
  subcategories: SubcategoryOption[];
  /** Facilities with dynamic counts */
  facilities: FacilityOption[];
  /** Cities with dynamic counts */
  cities: CityOption[];
  /** Total count of filtered listings */
  totalCount: number;
  /** Price range in filtered listings */
  priceRange: { min: number; max: number };
  /** Capacity range in filtered listings */
  capacityRange: { min: number; max: number };
}

// =============================================================================
// Filter Functions
// =============================================================================

/**
 * Apply all filters except the specified dimension
 */
function applyFiltersExcept<T extends DynamicFilterListing>(
  listings: T[],
  filters: DynamicFilterState,
  categoryToType: Record<string, string>,
  exclude: 'category' | 'subcategories' | 'facilities' | 'location' | 'price' | 'capacity' | 'newThisWeek'
): T[] {
  return listings.filter(listing => {
    // Category filter
    if (exclude !== 'category' && filters.category) {
      const expectedType = categoryToType[filters.category];
      if (expectedType && listing.type !== expectedType) return false;
    }

    // Subcategories filter
    if (exclude !== 'subcategories' && filters.subcategories && filters.subcategories.length > 0) {
      if (!filters.subcategories.some(s => listing.subcategoryKeys?.includes(s))) return false;
    }

    // Location filter
    if (exclude !== 'location' && filters.location) {
      const locationLower = filters.location.toLowerCase();
      const cityMatch = listing.city?.toLowerCase().includes(locationLower);
      if (!cityMatch) return false;
    }

    // Price filter
    if (exclude !== 'price' && filters.maxPrice != null) {
      if ((listing.priceAmount ?? 0) > filters.maxPrice) return false;
    }

    // Capacity filter
    if (exclude !== 'capacity' && filters.minCapacity != null && filters.minCapacity > 0) {
      if ((listing.capacity ?? 0) < filters.minCapacity) return false;
    }

    // Facilities filter
    if (exclude !== 'facilities' && filters.facilities && filters.facilities.length > 0) {
      const listingAmenities = listing.amenities || [];
      const hasAllFacilities = filters.facilities.every(f =>
        listingAmenities.some(a => a.toLowerCase().includes(f.toLowerCase()))
      );
      if (!hasAllFacilities) return false;
    }

    // New this week filter
    if (exclude !== 'newThisWeek' && filters.newThisWeek) {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const createdTime = listing.createdAt
        ? (typeof listing.createdAt === 'number' ? listing.createdAt : new Date(listing.createdAt).getTime())
        : 0;
      if (createdTime < weekAgo) return false;
    }

    return true;
  });
}

/**
 * Apply all filters (for total count and ranges)
 */
function applyAllFilters<T extends DynamicFilterListing>(
  listings: T[],
  filters: DynamicFilterState,
  categoryToType: Record<string, string>
): T[] {
  return applyFiltersExcept(listings, filters, categoryToType, 'newThisWeek')
    .filter(listing => {
      // Also apply newThisWeek since we used it as the "exclude" parameter
      if (filters.newThisWeek) {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const createdTime = listing.createdAt
          ? (typeof listing.createdAt === 'number' ? listing.createdAt : new Date(listing.createdAt).getTime())
          : 0;
        if (createdTime < weekAgo) return false;
      }
      return true;
    });
}

// =============================================================================
// Main Hook
// =============================================================================

export function useDynamicFilterCounts<T extends DynamicFilterListing>(
  config: DynamicFilterConfig<T>
): DynamicFilterResult {
  const {
    listings,
    filters,
    categoryMapping,
    categoryToTypeMapping,
    allCategories,
    allSubcategories,
    allFacilities,
  } = config;

  return useMemo(() => {
    // Compute category counts
    // Apply all filters EXCEPT category to show what's available in each category
    const listingsForCategoryCounts = applyFiltersExcept(
      listings, filters, categoryToTypeMapping, 'category'
    );

    const categoryCounts: Record<string, number> = {};
    listingsForCategoryCounts.forEach(l => {
      const categoryKey = categoryMapping[l.type] || l.type;
      categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1;
    });

    const categories: CategoryOption[] = allCategories.map(cat => ({
      ...cat,
      count: categoryCounts[cat.key] || 0,
    }));

    // Compute subcategory counts
    // Only show subcategories for the selected category
    // Apply all filters EXCEPT subcategories to show what's available
    let subcategories: SubcategoryOption[] = [];
    if (filters.category && allSubcategories[filters.category]) {
      const listingsForSubcategoryCounts = applyFiltersExcept(
        listings, filters, categoryToTypeMapping, 'subcategories'
      );

      const subcategoryCounts: Record<string, number> = {};
      listingsForSubcategoryCounts.forEach(l => {
        l.subcategoryKeys?.forEach(subKey => {
          subcategoryCounts[subKey] = (subcategoryCounts[subKey] || 0) + 1;
        });
      });

      subcategories = allSubcategories[filters.category].map(sub => ({
        ...sub,
        count: subcategoryCounts[sub.key] || 0,
      }));
    }

    // Compute facility counts
    // Apply all filters EXCEPT facilities to show what's available
    const listingsForFacilityCounts = applyFiltersExcept(
      listings, filters, categoryToTypeMapping, 'facilities'
    );

    const facilityCounts: Record<string, number> = {};
    listingsForFacilityCounts.forEach(l => {
      l.amenities?.forEach(amenity => {
        // Match facility key to amenity (case-insensitive partial match)
        allFacilities.forEach(fac => {
          if (amenity.toLowerCase().includes(fac.key.toLowerCase())) {
            facilityCounts[fac.key] = (facilityCounts[fac.key] || 0) + 1;
          }
        });
      });
    });

    const facilities: FacilityOption[] = allFacilities.map(fac => ({
      ...fac,
      count: facilityCounts[fac.key] || 0,
    }));

    // Compute city counts
    // Apply all filters EXCEPT location to show what's available
    const listingsForCityCounts = applyFiltersExcept(
      listings, filters, categoryToTypeMapping, 'location'
    );

    const cityCounts: Record<string, number> = {};
    listingsForCityCounts.forEach(l => {
      if (l.city) {
        cityCounts[l.city] = (cityCounts[l.city] || 0) + 1;
      }
    });

    const cities: CityOption[] = Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Compute total count and ranges from fully filtered listings
    const filteredListings = applyAllFilters(listings, filters, categoryToTypeMapping);
    const totalCount = filteredListings.length;

    // Price range
    const prices = filteredListings
      .map(l => l.priceAmount ?? 0)
      .filter(p => p > 0);
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    };

    // Capacity range
    const capacities = filteredListings
      .map(l => l.capacity ?? 0)
      .filter(c => c > 0);
    const capacityRange = {
      min: capacities.length > 0 ? Math.min(...capacities) : 0,
      max: capacities.length > 0 ? Math.max(...capacities) : 0,
    };

    return {
      categories,
      subcategories,
      facilities,
      cities,
      totalCount,
      priceRange,
      capacityRange,
    };
  }, [
    listings,
    filters,
    categoryMapping,
    categoryToTypeMapping,
    allCategories,
    allSubcategories,
    allFacilities,
  ]);
}

export default useDynamicFilterCounts;
