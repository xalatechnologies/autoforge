/**
 * XalaBaaS SDK - Search Hooks (Tier 3)
 *
 * React Query-shaped hooks for global search, typeahead, saved filters,
 * recent searches, and result export.
 * Now wired to Convex backend search functions.
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../_shared/hooks/convex-api";
import { toPaginatedResponse } from "../../_shared/hooks/transforms/common";
import { Id } from "../../_shared/hooks/convex-api";

// =============================================================================
// Types
// =============================================================================

export interface SearchParams {
  query: string;
  tenantId?: string;
  categoryKey?: string;
  subcategoryKey?: string;
  status?: string;
  limit?: number;
  offset?: number;
  includeMetadata?: boolean;
}

export interface TypeaheadParams {
  query: string;
  tenantId?: string;
  categoryKey?: string;
  limit?: number;
}

export interface SavedFilterQueryParams {
  tenantId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface CreateSavedFilterDTO {
  tenantId: string;
  name: string;
  filters: Record<string, unknown>;
  type?: string;
  isDefault?: boolean;
}

export interface UpdateSavedFilterDTO {
  name?: string;
  filters?: Record<string, unknown>;
  type?: string;
  isDefault?: boolean;
}

export interface RecentSearchQueryParams {
  tenantId?: string;
  limit?: number;
}

export interface ExportSearchParams {
  query: string;
  tenantId?: string;
  types?: string[];
  format: "csv" | "xlsx" | "pdf";
}

export interface SearchMatch {
  field: string;
  value: string;
  weight: number;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  score: number;
  matches?: SearchMatch[];
  highlights?: Record<string, string[]>;
  metadata?: Record<string, unknown>;
  categoryKey?: string;
  subcategoryKeys?: string[];
  images?: any[];
}

export interface CategorySuggestion {
  type: "category";
  key: string;
  name: string;
  description: string;
  score: number;
  resourceCount?: number;
}

export interface IntentSuggestion {
  type: "intent" | "popular" | "location";
  key: string;
  label: string;
  description: string;
  score: number;
  action?: string;
  category?: string;
}

export interface SmartSuggestions {
  categories: CategorySuggestion[];
  intents: IntentSuggestion[];
  popular: IntentSuggestion[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  query: string;
  categorySuggestions?: CategorySuggestion[];
  intentSuggestions?: IntentSuggestion[];
  popularSuggestions?: IntentSuggestion[];
}

export interface TypeaheadSuggestion {
  id: string;
  type: string;
  text: string;
  subtitle?: string;
  categoryKey?: string;
  city?: string;
  score?: number;
}

export interface SearchSuggestion {
  type: "category" | "subcategory" | "city";
  value: string;
}

export interface SearchFacets {
  total: number;
  categories: Array<{ key: string; count: number }>;
  subcategories: Array<{ key: string; count: number }>;
  cities: Array<{ key: string; count: number }>;
  statuses: Array<{ key: string; count: number }>;
}

export interface SavedFilter {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  filters: Record<string, unknown>;
  type?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  resultCount: number;
  searchedAt: string;
}

// =============================================================================
// Query Keys
// =============================================================================

export const searchKeys = {
  all: ["search"] as const,
  results: (params: SearchParams) =>
    [...searchKeys.all, "results", params] as const,
  typeahead: (params: TypeaheadParams) =>
    [...searchKeys.all, "typeahead", params] as const,
  suggestions: (tenantId?: string, prefix?: string) =>
    [...searchKeys.all, "suggestions", tenantId, prefix] as const,
  facets: (tenantId?: string, searchTerm?: string) =>
    [...searchKeys.all, "facets", tenantId, searchTerm] as const,
  savedFilters: {
    all: () => [...searchKeys.all, "saved-filters"] as const,
    lists: () => [...searchKeys.savedFilters.all(), "list"] as const,
    list: (params?: SavedFilterQueryParams) =>
      [...searchKeys.savedFilters.lists(), params] as const,
    details: () => [...searchKeys.savedFilters.all(), "detail"] as const,
    detail: (id: string) =>
      [...searchKeys.savedFilters.details(), id] as const,
  },
  recent: (params?: RecentSearchQueryParams) =>
    [...searchKeys.all, "recent", params] as const,
};

// =============================================================================
// Internal Helpers
// =============================================================================

function useMutationAdapter<TArgs extends unknown[], TResult = void>(
  fn: (...args: TArgs) => Promise<TResult>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutateAsync = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      try {
        const result = await fn(...args);
        setIsSuccess(true);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [fn]
  );

  const mutate = useCallback(
    (...args: TArgs) => {
      mutateAsync(...args).catch(() => {
        /* swallow - error is captured in state */
      });
    },
    [mutateAsync]
  );

  return { mutate, mutateAsync, isLoading, error, isSuccess };
}

// =============================================================================
// Global Search Hooks
// =============================================================================

/**
 * Execute global search across resources.
 * Searches all fields including name, description, features, and metadata.
 * Requires tenantId for tenant-scoped search.
 */
export function useGlobalSearch(params: SearchParams): {
  data: SearchResponse | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { query, tenantId, categoryKey, subcategoryKey, status, limit, offset, includeMetadata } = params;

  const shouldSearch = query.trim().length >= 2 && !!tenantId;

  const result = useQuery(
    api.domain.search.globalSearch,
    shouldSearch
      ? {
          tenantId: tenantId as Id<"tenants">,
          searchTerm: query,
          categoryKey,
          subcategoryKey,
          status,
          limit: limit || 50,
          offset: offset || 0,
          includeMetadata: includeMetadata || false,
        }
      : "skip"
  );

  const data = useMemo(() => {
    if (!result) return null;

    // Transform Convex results to SearchResult format
    const transformedResults: SearchResult[] = result.results.map((r: any) => ({
      id: r.id,
      type: r.categoryKey || "resource",
      title: r.name,
      subtitle: r.categoryKey,
      description: r.description,
      url: `/listing/${r.slug}`,
      score: r.score,
      matches: r.matches,
      metadata: r.metadata,
      categoryKey: r.categoryKey,
      subcategoryKeys: r.subcategoryKeys,
      images: r.images,
    }));

    return {
      results: transformedResults,
      total: result.total,
      hasMore: result.hasMore,
      query,
    };
  }, [result, query]);

  return {
    data,
    isLoading: result === undefined && shouldSearch,
    error: null,
  };
}

/**
 * Execute public global search across all published resources.
 * Does NOT require tenantId - searches all public listings.
 * Supports single-character search with smart category suggestions.
 */
export function usePublicGlobalSearch(params: Omit<SearchParams, 'tenantId' | 'status'> & { includeCategorySuggestions?: boolean }): {
  data: SearchResponse | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { query, categoryKey, subcategoryKey, limit, offset, includeMetadata, includeCategorySuggestions = true } = params;

  // Allow single character search
  const shouldSearch = query.trim().length >= 1;

  const result = useQuery(
    api.domain.search.globalSearchPublic,
    shouldSearch
      ? {
          searchTerm: query,
          categoryKey,
          subcategoryKey,
          limit: limit || 50,
          offset: offset || 0,
          includeMetadata: includeMetadata || false,
          includeCategorySuggestions,
        }
      : "skip"
  );

  const data = useMemo(() => {
    if (!result) return null;

    // Transform Convex results to SearchResult format
    const transformedResults: SearchResult[] = result.results.map((r: any) => ({
      id: r.id,
      type: r.categoryKey || "resource",
      title: r.name,
      subtitle: r.categoryKey,
      description: r.description,
      url: `/listing/${r.slug}`,
      score: r.score,
      matches: r.matches,
      metadata: r.metadata,
      categoryKey: r.categoryKey,
      subcategoryKeys: r.subcategoryKeys,
      images: r.images,
    }));

    return {
      results: transformedResults,
      total: result.total,
      hasMore: result.hasMore,
      query,
      categorySuggestions: result.categorySuggestions as CategorySuggestion[] | undefined,
      intentSuggestions: result.intentSuggestions as IntentSuggestion[] | undefined,
      popularSuggestions: result.popularSuggestions as IntentSuggestion[] | undefined,
    };
  }, [result, query]);

  return {
    data,
    isLoading: result === undefined && shouldSearch,
    error: null,
  };
}

/**
 * Get typeahead suggestions as user types.
 */
export function useTypeahead(params: TypeaheadParams): {
  data: TypeaheadSuggestion[];
  isLoading: boolean;
  error: Error | null;
} {
  const { query, tenantId, categoryKey, limit } = params;

  const shouldSearch = query.trim().length >= 1 && !!tenantId;

  const result = useQuery(
    api.domain.search.typeahead,
    shouldSearch
      ? {
          tenantId: tenantId as Id<"tenants">,
          prefix: query,
          categoryKey,
          limit: limit || 10,
        }
      : "skip"
  );

  const data = useMemo(() => {
    if (!result) return [];

    return result.map((r: any) => ({
      id: r.id,
      type: r.categoryKey || "resource",
      text: r.name,
      subtitle: r.city || r.categoryKey,
      categoryKey: r.categoryKey,
      city: r.city,
      score: r.score,
    }));
  }, [result]);

  return {
    data,
    isLoading: result === undefined && shouldSearch,
    error: null,
  };
}

/**
 * Public typeahead - searches all published resources without requiring tenantId.
 * Now includes category suggestions for smart search guidance.
 */
export function usePublicTypeahead(params: Omit<TypeaheadParams, 'tenantId'> & { includeCategorySuggestions?: boolean }): {
  data: TypeaheadSuggestion[];
  categorySuggestions: CategorySuggestion[];
  isLoading: boolean;
  error: Error | null;
} {
  const { query, categoryKey, limit, includeCategorySuggestions = true } = params;

  const shouldSearch = query.trim().length >= 1;

  const result = useQuery(
    api.domain.search.typeaheadPublic,
    shouldSearch
      ? {
          prefix: query,
          categoryKey,
          limit: limit || 10,
          includeCategorySuggestions,
        }
      : "skip"
  );

  const data = useMemo(() => {
    if (!result?.suggestions) return [];

    return result.suggestions.map((r: any) => ({
      id: r.id,
      type: r.categoryKey || "resource",
      text: r.name,
      subtitle: r.city || r.categoryKey,
      categoryKey: r.categoryKey,
      city: r.city,
      score: r.score,
    }));
  }, [result]);

  const categorySuggestions = useMemo(() => {
    if (!result?.categorySuggestions) return [];
    return result.categorySuggestions as CategorySuggestion[];
  }, [result]);

  return {
    data,
    categorySuggestions,
    isLoading: result === undefined && shouldSearch,
    error: null,
  };
}

/**
 * Get search suggestions (categories, subcategories, cities).
 */
export function useSearchSuggestions(
  tenantId: string | undefined,
  prefix?: string,
  limit?: number
): {
  data: SearchSuggestion[];
  isLoading: boolean;
  error: Error | null;
} {
  const result = useQuery(
    api.domain.search.searchSuggestions,
    tenantId
      ? {
          tenantId: tenantId as Id<"tenants">,
          prefix,
          limit: limit || 8,
        }
      : "skip"
  );

  return {
    data: (result as SearchSuggestion[]) || [],
    isLoading: result === undefined && !!tenantId,
    error: null,
  };
}

/**
 * Get search facets (aggregated counts by category, city, etc.).
 */
export function useSearchFacets(
  tenantId: string | undefined,
  searchTerm?: string,
  status?: string
): {
  data: SearchFacets | null;
  isLoading: boolean;
  error: Error | null;
} {
  const result = useQuery(
    api.domain.search.searchFacets,
    tenantId
      ? {
          tenantId: tenantId as Id<"tenants">,
          searchTerm,
          status,
        }
      : "skip"
  );

  return {
    data: result as SearchFacets | null,
    isLoading: result === undefined && !!tenantId,
    error: null,
  };
}

// =============================================================================
// Saved Filter Hooks (Stubs - TODO: implement in Convex)
// =============================================================================

/**
 * Get user's saved filters (stub).
 */
export function useSavedFilters(
  _params?: SavedFilterQueryParams
): {
  data: { data: SavedFilter[]; meta: { total: number; page: number; limit: number; totalPages: number } };
  isLoading: boolean;
  error: Error | null;
} {
  return { data: toPaginatedResponse<SavedFilter>([]), isLoading: false, error: null };
}

/**
 * Get single saved filter by ID (stub).
 */
export function useSavedFilter(
  _id: string | undefined,
  _options?: { enabled?: boolean }
): { data: { data: SavedFilter } | null; isLoading: boolean; error: Error | null } {
  return { data: null, isLoading: false, error: null };
}

/**
 * Create new saved filter (stub).
 */
export function useCreateSavedFilter() {
  const fn = useCallback(
    async (_data: CreateSavedFilterDTO): Promise<{ id: string }> => {
      throw new Error(
        "useCreateSavedFilter: not yet implemented in Convex backend"
      );
    },
    []
  );
  return useMutationAdapter(fn);
}

/**
 * Update existing saved filter (stub).
 */
export function useUpdateSavedFilter() {
  const fn = useCallback(
    async (_input: {
      id: string;
      data: UpdateSavedFilterDTO;
    }): Promise<{ success: boolean }> => {
      throw new Error(
        "useUpdateSavedFilter: not yet implemented in Convex backend"
      );
    },
    []
  );
  return useMutationAdapter(fn);
}

/**
 * Delete saved filter (stub).
 */
export function useDeleteSavedFilter() {
  const fn = useCallback(
    async (_id: string): Promise<{ success: boolean }> => {
      throw new Error(
        "useDeleteSavedFilter: not yet implemented in Convex backend"
      );
    },
    []
  );
  return useMutationAdapter(fn);
}

// =============================================================================
// Recent Searches Hooks (Stub - TODO: implement in Convex)
// =============================================================================

/**
 * Get user's recent searches (stub).
 */
export function useRecentSearches(
  _params?: RecentSearchQueryParams
): {
  data: { data: RecentSearch[]; meta: { total: number; page: number; limit: number; totalPages: number } };
  isLoading: boolean;
  error: Error | null;
} {
  return { data: toPaginatedResponse<RecentSearch>([]), isLoading: false, error: null };
}

// =============================================================================
// Export Hooks (Stub - TODO: implement in Convex)
// =============================================================================

/**
 * Export search results (stub).
 */
export function useExportResults() {
  const fn = useCallback(
    async (_params: ExportSearchParams): Promise<Blob> => {
      throw new Error(
        "useExportResults: not yet implemented in Convex backend"
      );
    },
    []
  );
  return useMutationAdapter(fn);
}
