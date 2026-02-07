/**
 * Listing Filter Component
 *
 * Filter component with category tabs, subcategory pills, location autocomplete,
 * facility pill toggles, price/capacity sliders with labels, sorting, and active filter chips.
 *
 * Uses Designsystemet primitives for consistent styling.
 */

import React, { forwardRef, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    Button,
    Textfield,
    Heading,
    Paragraph,
    Label,
    Tag,
} from '@digdir/designsystemet-react';
import { GridIcon, ListIcon, MapIcon, TableIcon, FilterIcon, MapPinIcon, SortIcon, WalletIcon, UsersIcon, TagIcon, SparklesIcon } from '../primitives/icons';
import { PillTabs, type PillTab } from './PillTabs';
import { PillDropdown, type PillDropdownOption } from './PillDropdown';

// =============================================================================
// Types
// =============================================================================

export interface CategoryOption {
    id: string;
    key: string;
    label: string;
    icon?: string | React.ReactNode;
    count?: number;
}

export interface SubcategoryOption {
    id: string;
    key: string;
    label: string;
    parentKey: string;
}

export interface FacilityOption {
    id: string;
    key: string;
    label: string;
    icon?: string;
}

export interface SortOption {
    id: string;
    label: string;
    field: string;
    order: 'asc' | 'desc';
}

export interface CityOption {
    name: string;
    count: number;
}

export interface ListingFilterState {
    category?: string;
    subcategories?: string[];
    facilities?: string[];
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    minCapacity?: number;
    date?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    newThisWeek?: boolean;
    requiresApproval?: boolean;
    cateringAvailable?: boolean;
}

export interface ListingFilterLabels {
    /** Label for "All locations" option in dropdown */
    allLocations?: string;
    /** Placeholder for location search input */
    searchLocationPlaceholder?: string;
    /** Label shown when no search results */
    noResults?: string;
    /** Filter button label */
    filter?: string;
    /** New this week toggle label */
    newThisWeek?: string;
    /** Max price label */
    maxPrice?: string;
    /** Min capacity label */
    minCapacity?: string;
    /** Sort by label */
    sortBy?: string;
    /** Facilities section label */
    facilities?: string;
    /** Clear all filters button */
    clearAll?: string;
    /** Location chip prefix */
    locationPrefix?: string;
    /** Max price chip prefix */
    maxPricePrefix?: string;
    /** Min capacity chip suffix */
    minCapacitySuffix?: string;
    /** View mode labels */
    viewModes?: {
        grid?: string;
        list?: string;
        map?: string;
        table?: string;
    };
    /** Empty state labels */
    emptyState?: {
        /** Title when no results */
        title?: string;
        /** Description when no results */
        description?: string;
        /** Clear filters button text */
        clearFilters?: string;
    };
}

export interface ListingFilterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Current filter state */
    value: ListingFilterState;

    /** Filter change handler */
    onChange: (filters: ListingFilterState) => void;

    /** Category options with counts (excluding 'Alle') */
    categories: CategoryOption[];

    /** Subcategory options (filtered by selected category) */
    subcategories?: SubcategoryOption[];

    /** Facility/amenity options */
    facilities?: FacilityOption[];

    /** Sort options */
    sortOptions?: SortOption[];

    /** City options with listing counts for autocomplete */
    cities?: CityOption[];

    /** Maximum price for slider */
    maxPriceLimit?: number;

    /** View mode */
    viewMode?: 'grid' | 'list' | 'map' | 'table';

    /** View mode change handler */
    onViewModeChange?: (mode: 'grid' | 'list' | 'map' | 'table') => void;

    /** Available view modes */
    availableViews?: Array<'grid' | 'list' | 'map' | 'table'>;

    /** Total results count */
    resultsCount?: number;

    /** Results label */
    resultsLabel?: string;

    /** Show expanded filter panel */
    showFilterPanel?: boolean;

    /** Loading state */
    isLoading?: boolean;

    /** Compact mode (mobile) */
    compact?: boolean;

    /** Localized labels for UI text */
    labels?: ListingFilterLabels;
}

// =============================================================================
// Default Options
// =============================================================================

const DEFAULT_SORT_OPTIONS: SortOption[] = [
    { id: 'relevant', label: 'Mest relevant', field: 'relevance', order: 'desc' },
    { id: 'price-asc', label: 'Pris: Lav til høy', field: 'price', order: 'asc' },
    { id: 'price-desc', label: 'Pris: Høy til lav', field: 'price', order: 'desc' },
    { id: 'name-asc', label: 'Navn: A-Å', field: 'name', order: 'asc' },
    { id: 'newest', label: 'Nyeste først', field: 'createdAt', order: 'desc' },
];

const DEFAULT_LABELS: Required<ListingFilterLabels> = {
    allLocations: 'All locations',
    searchLocationPlaceholder: 'Search location...',
    noResults: 'No results',
    filter: 'Flere filtre',
    newThisWeek: 'New this week',
    maxPrice: 'Max price',
    minCapacity: 'Min capacity',
    sortBy: 'Sort by',
    facilities: 'Facilities',
    clearAll: 'Clear all',
    locationPrefix: 'Location:',
    maxPricePrefix: 'Max',
    minCapacitySuffix: 'persons',
    viewModes: {
        grid: 'Grid',
        list: 'List',
        map: 'Map',
        table: 'Table',
    },
    emptyState: {
        title: 'No results found',
        description: 'Try adjusting your filters or search criteria to find what you\'re looking for.',
        clearFilters: 'Clear all filters',
    },
};

// =============================================================================
// Styles
// =============================================================================

const styles = {
    select: {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid var(--ds-color-neutral-border-default)',
        borderRadius: 'var(--ds-border-radius-md)',
        fontSize: '0.9375rem',
        backgroundColor: 'var(--ds-color-neutral-background-default)',
        color: 'var(--ds-color-neutral-text-default)',
        cursor: 'pointer',
        appearance: 'none' as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '32px',
    } as React.CSSProperties,
    slider: {
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        accentColor: 'var(--ds-color-accent-base-default)',
        cursor: 'pointer',
        WebkitAppearance: 'none' as const,
        appearance: 'none' as const,
        background: 'rgba(255, 255, 255, 0.15)',
        outline: 'none',
    } as React.CSSProperties,
    sectionLabel: {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--ds-color-neutral-text-default)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '2px solid var(--ds-color-neutral-border-default)',
    } as React.CSSProperties,
    fieldLabel: {
        display: 'block',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: 'var(--ds-color-neutral-text-default)',
        marginBottom: '6px',
    } as React.CSSProperties,
    chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        backgroundColor: 'var(--ds-color-accent-surface-default)',
        color: 'var(--ds-color-accent-text-default)',
        borderRadius: '100px',
        fontSize: '0.8125rem',
        lineHeight: '1.4',
        border: '1px solid var(--ds-color-accent-border-default)',
    } as React.CSSProperties,
    chipRemove: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '18px',
        height: '18px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: 0,
        color: 'var(--ds-color-accent-text-default)',
        borderRadius: '100px',
        fontSize: '14px',
        lineHeight: 1,
        opacity: 0.7,
    } as React.CSSProperties,
    pillBase: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '100px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        lineHeight: '1.4',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,
    sliderLabels: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.6875rem',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: '4px',
    } as React.CSSProperties,
    sliderValue: {
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--ds-color-accent-text-default)',
        fontVariantNumeric: 'tabular-nums',
    } as React.CSSProperties,
};

function pillStyle(active: boolean): React.CSSProperties {
    return {
        ...styles.pillBase,
        backgroundColor: active ? 'var(--ds-color-accent-base-default)' : 'var(--ds-color-neutral-surface-default)',
        color: active ? 'var(--ds-color-accent-contrast-default)' : 'var(--ds-color-neutral-text-default)',
        border: active ? '1px solid var(--ds-color-accent-base-default)' : '1px solid var(--ds-color-neutral-border-default)',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
    };
}

// =============================================================================
// Component
// =============================================================================

export const ListingFilter = forwardRef<HTMLDivElement, ListingFilterProps>(
    ({
        value,
        onChange,
        categories,
        subcategories = [],
        facilities = [],
        sortOptions = DEFAULT_SORT_OPTIONS,
        cities = [],
        maxPriceLimit = 10000,
        viewMode = 'grid',
        onViewModeChange,
        availableViews = ['grid', 'list', 'map', 'table'],
        resultsCount,
        resultsLabel = 'results',
        showFilterPanel = true,
        compact = false,
        labels,
        className,
        style,
        ...props
    }, ref) => {
        // Merge labels with defaults
        const t = useMemo(() => ({
            ...DEFAULT_LABELS,
            ...labels,
            viewModes: { ...DEFAULT_LABELS.viewModes, ...labels?.viewModes },
            emptyState: { ...DEFAULT_LABELS.emptyState, ...labels?.emptyState },
        }), [labels]);

        const [priceValue, setPriceValue] = useState(value.maxPrice ?? maxPriceLimit);
        const [isFilterExpanded, setIsFilterExpanded] = useState(false);
        const filterContentRef = useRef<HTMLDivElement>(null);
        const [filterHeight, setFilterHeight] = useState(0);

        // Measure filter content height for animation
        useEffect(() => {
            if (isFilterExpanded && filterContentRef.current) {
                setFilterHeight(filterContentRef.current.scrollHeight);
            } else {
                setFilterHeight(0);
            }
        }, [isFilterExpanded, compact]);

        // Sync locationInput when value.location changes externally (e.g. clear all)
        const [locationInput, setLocationInput] = useState(value.location ?? '');
        useEffect(() => {
            setLocationInput(value.location ?? '');
        }, [value.location]);

        // Keep a ref to the current value to avoid stale closures in callbacks
        const valueRef = useRef(value);
        valueRef.current = value;

        // Filter out 'ALL' category
        const displayCategories = useMemo(() =>
            categories.filter(c => c.key !== 'ALL'),
            [categories]
        );

        // Build active filter chips
        // Use valueRef.current in callbacks to always get the latest value
        const activeFilters = useMemo(() => {
            const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

            if (value.category) {
                const cat = categories.find(c => c.key === value.category);
                chips.push({
                    key: 'category',
                    label: cat?.label ?? value.category,
                    onRemove: () => onChange({ ...valueRef.current, category: undefined, subcategories: undefined }),
                });
            }
            if (value.subcategories && value.subcategories.length > 0) {
                for (const sKey of value.subcategories) {
                    const sub = subcategories.find(s => s.key === sKey);
                    chips.push({
                        key: `subcategory-${sKey}`,
                        label: sub?.label ?? sKey,
                        onRemove: () => {
                            const current = valueRef.current;
                            const updated = (current.subcategories ?? []).filter(k => k !== sKey);
                            onChange({
                                ...current,
                                subcategories: updated.length > 0 ? updated : undefined,
                            });
                        },
                    });
                }
            }
            if (value.location) {
                chips.push({
                    key: 'location',
                    label: `${t.locationPrefix} ${value.location}`,
                    onRemove: () => onChange({ ...valueRef.current, location: undefined }),
                });
            }
            if (value.maxPrice != null && value.maxPrice < maxPriceLimit) {
                chips.push({
                    key: 'maxPrice',
                    label: `${t.maxPricePrefix} ${value.maxPrice.toLocaleString('nb-NO')} kr`,
                    onRemove: () => {
                        setPriceValue(maxPriceLimit);
                        onChange({ ...valueRef.current, maxPrice: undefined });
                    },
                });
            }
            if (value.minCapacity && value.minCapacity > 0) {
                chips.push({
                    key: 'capacity',
                    label: `${t.minCapacity} ${value.minCapacity} ${t.minCapacitySuffix}`,
                    onRemove: () => onChange({ ...valueRef.current, minCapacity: undefined }),
                });
            }
            if (value.newThisWeek) {
                chips.push({
                    key: 'newThisWeek',
                    label: t.newThisWeek,
                    onRemove: () => onChange({ ...valueRef.current, newThisWeek: undefined }),
                });
            }
            if (value.facilities && value.facilities.length > 0) {
                for (const fKey of value.facilities) {
                    const fac = facilities.find(f => f.key === fKey);
                    chips.push({
                        key: `facility-${fKey}`,
                        label: fac?.label ?? fKey,
                        onRemove: () => {
                            const current = valueRef.current;
                            const updated = (current.facilities ?? []).filter(k => k !== fKey);
                            onChange({
                                ...current,
                                facilities: updated.length > 0 ? updated : undefined,
                            });
                        },
                    });
                }
            }
            if (value.sortBy && value.sortBy !== 'relevance') {
                const sortOpt = sortOptions.find(o => o.field === value.sortBy && o.order === value.sortOrder);
                if (sortOpt) {
                    chips.push({
                        key: 'sort',
                        label: sortOpt.label,
                        onRemove: () => onChange({ ...valueRef.current, sortBy: undefined, sortOrder: undefined }),
                    });
                }
            }

            return chips;
        }, [value, categories, subcategories, facilities, sortOptions, maxPriceLimit, onChange, t]);

        const handleClearAll = useCallback(() => {
            setPriceValue(maxPriceLimit);
            setLocationInput('');
            onChange({});
        }, [maxPriceLimit, onChange]);

        // Handlers
        const handleCategoryChange = useCallback((categoryKey: string) => {
            const newCategory = value.category === categoryKey ? undefined : categoryKey;
            onChange({
                ...value,
                category: newCategory,
                subcategories: undefined,
            });
        }, [value, onChange]);

        const handleSubcategoryToggle = useCallback((subcategoryKey: string) => {
            const current = value.subcategories ?? [];
            const updated = current.includes(subcategoryKey)
                ? current.filter(k => k !== subcategoryKey)
                : [...current, subcategoryKey];
            onChange({ ...value, subcategories: updated.length > 0 ? updated : undefined });
        }, [value, onChange]);

        const handleFacilityToggle = useCallback((facilityKey: string) => {
            const current = value.facilities ?? [];
            const updated = current.includes(facilityKey)
                ? current.filter(k => k !== facilityKey)
                : [...current, facilityKey];
            onChange({ ...value, facilities: updated.length > 0 ? updated : undefined });
        }, [value, onChange]);

        // Handler for smart location dropdown (PillDropdown)
        const handleLocationChange = useCallback((locationValue: string) => {
            if (locationValue === '') {
                setLocationInput('');
                onChange({ ...value, location: undefined });
            } else {
                setLocationInput(locationValue);
                onChange({ ...value, location: locationValue });
            }
        }, [value, onChange]);

        const handlePriceChange = useCallback((maxPrice: number) => {
            setPriceValue(maxPrice);
            onChange({ ...value, maxPrice: maxPrice < maxPriceLimit ? maxPrice : undefined });
        }, [value, onChange, maxPriceLimit]);

        const handleCapacityChange = useCallback((minCapacity: number) => {
            onChange({ ...value, minCapacity: minCapacity > 0 ? minCapacity : undefined });
        }, [value, onChange]);

        const handleSortChange = useCallback((sortId: string) => {
            const option = sortOptions.find(o => o.id === sortId);
            if (option) {
                onChange({ ...value, sortBy: option.field, sortOrder: option.order });
            }
        }, [value, onChange, sortOptions]);

        const handleNewThisWeekToggle = useCallback(() => {
            onChange({ ...value, newThisWeek: value.newThisWeek ? undefined : true });
        }, [value, onChange]);

        const currentSortId = sortOptions.find(
            o => o.field === value.sortBy && o.order === value.sortOrder
        )?.id ?? 'relevant';

        // View mode icons
        const viewIcons: Record<string, React.ReactNode> = {
            grid: <GridIcon size={20} />,
            list: <ListIcon size={20} />,
            map: <MapIcon size={20} />,
            table: <TableIcon size={20} />,
        };

        const viewLabels: Record<string, string> = {
            grid: t.viewModes.grid ?? 'Grid',
            list: t.viewModes.list ?? 'List',
            map: t.viewModes.map ?? 'Map',
            table: t.viewModes.table ?? 'Table',
        };

        return (
            <div
                ref={ref}
                className={className}
                style={style}
                {...props}
            >
                <style>{`
                    @keyframes dsFilterFadeSlideIn {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes dsFilterChipPop {
                        0% { opacity: 0; transform: scale(0.85); }
                        60% { transform: scale(1.05); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes dsFilterStaggerIn {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes dsFilterPulse {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 0.7; }
                    }
                    /* Range slider styling for better visibility */
                    .listing-filter-panel input[type="range"] {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 100%;
                        height: 6px;
                        border-radius: 3px;
                        background: rgba(255, 255, 255, 0.12);
                        outline: none;
                        cursor: pointer;
                    }
                    .listing-filter-panel input[type="range"]::-webkit-slider-track {
                        height: 6px;
                        border-radius: 3px;
                        background: rgba(255, 255, 255, 0.12);
                    }
                    .listing-filter-panel input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 18px;
                        height: 18px;
                        border-radius: 50%;
                        background: var(--ds-color-accent-base-default, #6366f1);
                        cursor: pointer;
                        border: 3px solid var(--ds-color-neutral-background-default, #1a1a2e);
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                        transition: transform 0.15s ease, box-shadow 0.15s ease;
                    }
                    .listing-filter-panel input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.15);
                        box-shadow: 0 3px 10px rgba(99, 102, 241, 0.4);
                    }
                    .listing-filter-panel input[type="range"]::-moz-range-track {
                        height: 6px;
                        border-radius: 3px;
                        background: rgba(255, 255, 255, 0.12);
                    }
                    .listing-filter-panel input[type="range"]::-moz-range-thumb {
                        width: 18px;
                        height: 18px;
                        border-radius: 50%;
                        background: var(--ds-color-accent-base-default, #6366f1);
                        cursor: pointer;
                        border: 3px solid var(--ds-color-neutral-background-default, #1a1a2e);
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                    }
                `}</style>

                {/* Category Pills Row + Location Dropdown + View Toggle */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Left: Location Dropdown */}
                    {resultsCount !== undefined && (
                        <PillDropdown
                            icon={<MapPinIcon size={16} />}
                            label={value.location || t.allLocations}
                            suffix={`${resultsCount} ${resultsLabel}`}
                            options={[
                                { value: '', label: t.allLocations },
                                ...cities.map(city => ({
                                    value: city.name,
                                    label: city.name,
                                    count: city.count,
                                })),
                            ]}
                            value={value.location || ''}
                            onChange={handleLocationChange}
                            ariaLabel={t.allLocations}
                            searchable
                            searchPlaceholder={t.searchLocationPlaceholder}
                            labels={{
                                noResults: t.noResults,
                                searchPlaceholder: t.searchLocationPlaceholder,
                            }}
                        />
                    )}

                    {/* Center: Category Pills */}
                    <PillTabs
                        tabs={displayCategories.map((cat) => ({
                            id: cat.key,
                            label: cat.label,
                            icon: cat.icon,
                            badge: cat.count !== undefined ? String(cat.count) : undefined,
                        }))}
                        activeTab={value.category ?? ''}
                        onTabChange={(tabId) => handleCategoryChange(tabId)}
                        size="md"
                        ariaLabel="Kategorier"
                        allowDeselect
                        fullWidth={false}
                    />

                    {/* Mobile Filter Button - right aligned, opens bottom drawer */}
                    {showFilterPanel && (
                        <button
                            type="button"
                            className="mobile-filter-button"
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            style={{
                                display: 'none', // Hidden by default, shown via CSS on mobile
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: isFilterExpanded
                                    ? 'var(--ds-color-accent-base-default)'
                                    : 'var(--ds-color-neutral-surface-hover)',
                                color: isFilterExpanded
                                    ? 'var(--ds-color-accent-base-contrast-default)'
                                    : 'var(--ds-color-neutral-text-default)',
                                border: '1px solid var(--ds-color-neutral-border-default)',
                                borderRadius: 'var(--ds-border-radius-md)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                marginLeft: 'auto', // Push to right
                            }}
                        >
                            <FilterIcon size={16} />
                            {t.filter}
                            {activeFilters.length > 0 && (
                                <span style={{
                                    backgroundColor: isFilterExpanded
                                        ? 'var(--ds-color-accent-base-contrast-default)'
                                        : 'var(--ds-color-accent-base-default)',
                                    color: isFilterExpanded
                                        ? 'var(--ds-color-accent-base-default)'
                                        : 'var(--ds-color-accent-base-contrast-default)',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    marginLeft: '4px',
                                }}>
                                    {activeFilters.length}
                                </span>
                            )}
                        </button>
                    )}

                    {/* View Toggle - right aligned, same height as PillTabs */}
                    {onViewModeChange && (
                        <div
                            className="view-toggle-container"
                            style={{
                                display: 'flex',
                                gap: '4px',
                                backgroundColor: 'var(--ds-color-pilltabs-bg, var(--ds-color-neutral-surface-hover))',
                                padding: '8px 16px',
                                borderRadius: 'var(--ds-border-radius-lg)',
                                border: '1px solid var(--ds-color-pilltabs-border, var(--ds-color-neutral-border-default))',
                                alignSelf: 'stretch',
                                flexShrink: 0,
                            }}
                        >
                            {availableViews.map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => onViewModeChange(mode)}
                                    title={viewLabels[mode]}
                                    aria-label={viewLabels[mode]}
                                    aria-pressed={viewMode === mode}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '40px',
                                        padding: '8px 12px',
                                        border: 'none',
                                        borderRadius: 'var(--ds-border-radius-md)',
                                        cursor: 'pointer',
                                        backgroundColor: viewMode === mode
                                            ? 'var(--ds-color-pilltabs-active-bg, var(--ds-color-accent-base-default))'
                                            : 'transparent',
                                        color: viewMode === mode
                                            ? 'var(--ds-color-pilltabs-active-text, var(--ds-color-accent-base-contrast-default))'
                                            : 'var(--ds-color-pilltabs-text, var(--ds-color-neutral-text-default))',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {viewIcons[mode]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subcategory Pills Row + Results Count + View Toggle + Active Filters */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        animation: (value.category && subcategories.length > 0) ? 'dsFilterFadeSlideIn 0.3s ease both' : undefined,
                    }}
                >
                    {/* Subcategories */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            flex: '1 1 auto',
                        }}
                    >
                        {value.category && subcategories.length > 0 && subcategories.map((sub) => {
                            const isActive = value.subcategories?.includes(sub.key) ?? false;
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => handleSubcategoryToggle(sub.key)}
                                    aria-pressed={isActive}
                                    style={pillStyle(isActive)}
                                >
                                    {sub.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right side: Results Count + View Toggle + Active Filters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Active filter chips */}
                        {activeFilters.length > 0 && (
                            <>
                                {activeFilters.map((chip) => (
                                    <span key={chip.key} style={{ ...styles.chip, animation: 'dsFilterChipPop 0.25s ease both' }}>
                                        <span>{chip.label}</span>
                                        <button
                                            type="button"
                                            onClick={chip.onRemove}
                                            style={styles.chipRemove}
                                            aria-label={`Fjern filter: ${chip.label}`}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--ds-color-accent-text-default)',
                                        fontSize: '0.8125rem',
                                        textDecoration: 'underline',
                                        padding: '4px 8px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Nullstill alle
                                </button>
                            </>
                        )}

                    </div>
                </div>

                {/* Filter Panel */}
                {showFilterPanel && (
                    <div
                        className={`listing-filter-panel ${isFilterExpanded ? 'filter-expanded' : ''}`}
                        style={{
                            backgroundColor: 'var(--ds-color-pilltabs-bg, var(--ds-color-neutral-surface-hover))',
                            borderRadius: '12px',
                            border: '0.5px solid rgba(255, 255, 255, 0.06)',
                            marginBottom: '20px',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Filter Header */}
                        <button
                            type="button"
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '14px 20px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                borderBottom: isFilterExpanded ? '1px solid var(--ds-color-neutral-border-subtle)' : 'none',
                            }}
                        >
                            <FilterIcon size={18} style={{ color: 'var(--ds-color-neutral-text-default)' }} />
                            <Heading data-size="xs" style={{ margin: 0, flex: 1, textAlign: 'left' }}>
                                {t.filter}
                            </Heading>
                            {activeFilters.length > 0 && !isFilterExpanded && (
                                <Tag data-size="sm" style={{ backgroundColor: 'var(--ds-color-accent-surface-default)' }}>
                                    {activeFilters.length}
                                </Tag>
                            )}
                            <span style={{
                                transform: isFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                                color: 'var(--ds-color-neutral-text-subtle)',
                                fontSize: '12px',
                            }}>
                                &#9660;
                            </span>
                        </button>

                        {/* Filter Content — 3-column layout (animated) */}
                        <div style={{
                            maxHeight: isFilterExpanded ? `${filterHeight + 48}px` : '0px',
                            opacity: isFilterExpanded ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
                        }}>
                            <div ref={filterContentRef} style={{ padding: compact ? '16px' : '20px 24px' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: compact ? '1fr' : '180px 1fr 1fr',
                                    gap: compact ? '20px' : '0',
                                }}>
                                    {/* Column 1: Sort */}
                                    <div style={{
                                        paddingRight: compact ? '0' : '24px',
                                        borderRight: compact ? 'none' : '1px solid var(--ds-color-neutral-border-subtle)',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '12px',
                                        }}>
                                            <SortIcon size={15} style={{ opacity: 0.5 }} />
                                            <span style={{
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                color: 'var(--ds-color-neutral-text-subtle)',
                                            }}>
                                                {t.sortBy}
                                            </span>
                                        </div>
                                        <select
                                            id="filter-sort"
                                            value={currentSortId}
                                            onChange={(e) => handleSortChange(e.target.value)}
                                            style={{
                                                ...styles.select,
                                                padding: '10px 12px',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {sortOptions.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Column 2: Price + Capacity */}
                                    <div style={{
                                        padding: compact ? '0' : '0 24px',
                                        borderRight: compact ? 'none' : '1px solid var(--ds-color-neutral-border-subtle)',
                                        display: 'flex',
                                        gap: '20px',
                                    }}>
                                        {/* Price Slider */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '14px',
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}>
                                                    <WalletIcon size={15} style={{ opacity: 0.5 }} />
                                                    <span style={{
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: 'var(--ds-color-neutral-text-subtle)',
                                                    }}>
                                                        {t.maxPrice}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: 'var(--ds-color-accent-text-default)',
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    {priceValue.toLocaleString('nb-NO')} kr
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={maxPriceLimit}
                                                step={100}
                                                value={priceValue}
                                                onChange={(e) => handlePriceChange(Number(e.target.value))}
                                                style={styles.slider}
                                                aria-label={t.maxPrice}
                                            />
                                            <div style={{ ...styles.sliderLabels, marginTop: '6px', fontSize: '0.625rem' }}>
                                                <span>0 kr</span>
                                                <span>{maxPriceLimit.toLocaleString('nb-NO')} kr</span>
                                            </div>
                                        </div>

                                        {/* Capacity Slider */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '14px',
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}>
                                                    <UsersIcon size={15} style={{ opacity: 0.5 }} />
                                                    <span style={{
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: 'var(--ds-color-neutral-text-subtle)',
                                                    }}>
                                                        {t.minCapacity}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: 'var(--ds-color-accent-text-default)',
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    {value.minCapacity ?? 0} {t.minCapacitySuffix}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={500}
                                                step={10}
                                                value={value.minCapacity ?? 0}
                                                onChange={(e) => handleCapacityChange(Number(e.target.value))}
                                                style={styles.slider}
                                                aria-label={t.minCapacity}
                                            />
                                            <div style={{ ...styles.sliderLabels, marginTop: '6px', fontSize: '0.625rem' }}>
                                                <span>0</span>
                                                <span>500</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Facilities */}
                                    <div style={{
                                        paddingLeft: compact ? '0' : '24px',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '12px',
                                        }}>
                                            <TagIcon size={15} style={{ opacity: 0.5 }} />
                                            <span style={{
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                color: 'var(--ds-color-neutral-text-subtle)',
                                            }}>
                                                {t.facilities}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '8px',
                                                alignContent: 'flex-start',
                                            }}
                                        >
                                            {facilities.slice(0, 8).map((facility) => {
                                                const isActive = value.facilities?.includes(facility.key) ?? false;
                                                return (
                                                    <button
                                                        key={facility.id}
                                                        type="button"
                                                        onClick={() => handleFacilityToggle(facility.key)}
                                                        aria-pressed={isActive}
                                                        style={{
                                                            ...pillStyle(isActive),
                                                            padding: '6px 12px',
                                                            fontSize: '0.8125rem',
                                                        }}
                                                    >
                                                        {facility.icon && <span>{facility.icon}</span>}
                                                        {facility.label}
                                                    </button>
                                                );
                                            })}

                                            {/* New This Week — Special highlight button */}
                                            <button
                                                type="button"
                                                onClick={handleNewThisWeekToggle}
                                                aria-pressed={value.newThisWeek ?? false}
                                                style={{
                                                    ...pillStyle(value.newThisWeek ?? false),
                                                    padding: '6px 14px',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 500,
                                                    gap: '6px',
                                                    ...(!(value.newThisWeek) && {
                                                        border: '1.5px dashed var(--ds-color-accent-border-default)',
                                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                                                    }),
                                                    ...((value.newThisWeek) && {
                                                        background: 'linear-gradient(135deg, var(--ds-color-accent-surface-default) 0%, rgba(168, 85, 247, 0.35) 100%)',
                                                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                                                    }),
                                                }}
                                            >
                                                <SparklesIcon size={14} style={{ opacity: value.newThisWeek ? 1 : 0.7 }} />
                                                {t.newThisWeek}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

ListingFilter.displayName = 'ListingFilter';
