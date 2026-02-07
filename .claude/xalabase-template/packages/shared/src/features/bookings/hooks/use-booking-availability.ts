/**
 * Booking Availability Hooks
 *
 * Provides real-time availability data for booking components.
 * Supports all 4 booking modes: SLOTS, ALL_DAY, DURATION, TICKETS.
 */

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../_shared/hooks/convex-api';
import type { Id } from '../../_shared/hooks/convex-api';

// =============================================================================
// Types
// =============================================================================

export type BookingMode = 'SLOTS' | 'ALL_DAY' | 'DURATION' | 'TICKETS';

export interface SlotAvailability {
  mode: 'SLOTS';
  slots: Array<{
    date: string;
    hour: number;
    available: boolean;
    bookingId?: string;
  }>;
}

export interface DayAvailability {
  mode: 'ALL_DAY';
  days: Array<{
    date: string;
    status: 'available' | 'partial' | 'booked' | 'blocked' | 'closed';
  }>;
}

export interface DurationAvailability {
  mode: 'DURATION';
  days: Array<{
    date: string;
    available: boolean;
    maxDurationMinutes: number;
  }>;
}

export interface TicketAvailability {
  mode: 'TICKETS';
  days: Array<{
    date: string;
    available: number;
    capacity: number;
  }>;
}

export type AvailabilityData =
  | SlotAvailability
  | DayAvailability
  | DurationAvailability
  | TicketAvailability;

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// =============================================================================
// Availability Hook
// =============================================================================

/**
 * Fetch availability data for a resource within a date range.
 *
 * @param resourceId - The Convex resource ID (or string that will be cast)
 * @param startDate - Start of date range (ISO date string, e.g. "2024-02-01")
 * @param endDate - End of date range (ISO date string, e.g. "2024-02-28")
 * @param mode - The booking mode to fetch availability for
 * @returns Availability data matching the mode, or undefined while loading
 */
export function useBookingAvailability(
  resourceId: string | undefined,
  startDate: string,
  endDate: string,
  mode: BookingMode
): {
  data: AvailabilityData | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const result = useQuery(
    api.domain.bookings.getResourceAvailability,
    resourceId
      ? {
          resourceId: resourceId as Id<'resources'>,
          startDate,
          endDate,
          mode,
        }
      : 'skip'
  );

  return {
    data: result as AvailabilityData | undefined,
    isLoading: result === undefined && resourceId !== undefined,
    error: null, // Convex doesn't expose errors this way; handle via ErrorBoundary
  };
}

// =============================================================================
// Validation Hook
// =============================================================================

/**
 * Validate a booking slot before creation.
 *
 * Use this for pre-flight validation to check if a slot is still available
 * before attempting to create a booking.
 *
 * @param resourceId - The Convex resource ID
 * @param startTime - Start time as epoch milliseconds
 * @param endTime - End time as epoch milliseconds
 * @param quantity - Number of tickets (for TICKETS mode)
 * @returns Validation result with valid flag and optional reason
 */
export function useValidateBookingSlot(
  resourceId: string | undefined,
  startTime: number | undefined,
  endTime: number | undefined,
  quantity?: number
): {
  data: ValidationResult | undefined;
  isLoading: boolean;
} {
  const result = useQuery(
    api.domain.bookings.validateBookingSlot,
    resourceId && startTime && endTime
      ? {
          resourceId: resourceId as Id<'resources'>,
          startTime,
          endTime,
          ...(quantity !== undefined && { quantity }),
        }
      : 'skip'
  );

  return {
    data: result as ValidationResult | undefined,
    isLoading: result === undefined && resourceId !== undefined && startTime !== undefined && endTime !== undefined,
  };
}

// =============================================================================
// Booking Creation Hook
// =============================================================================

export interface CreateBookingParams {
  tenantId: string;
  resourceId: string;
  userId?: string;
  startTime: number;
  endTime: number;
  quantity?: number;
  metadata?: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    notes?: string;
  };
  source?: string;
}

/**
 * Create a new booking.
 *
 * @returns Mutation function and state
 */
export interface CreateBookingResult {
  id: string;
  status: string;
}

export function useCreateBookingMutation(): {
  mutate: (params: CreateBookingParams) => Promise<CreateBookingResult>;
  isLoading: boolean;
} {
  const createBooking = useMutation(api.domain.bookings.create);

  const mutate = async (params: CreateBookingParams): Promise<CreateBookingResult> => {
    if (!params.userId) {
      throw new Error('userId is required to create a booking');
    }
    const result = await createBooking({
      tenantId: params.tenantId as Id<'tenants'>,
      resourceId: params.resourceId as Id<'resources'>,
      userId: params.userId as Id<'users'>,
      startTime: params.startTime,
      endTime: params.endTime,
      ...(params.metadata?.notes && { notes: params.metadata.notes }),
      ...(params.metadata && { metadata: params.metadata }),
    });
    return { id: result.id, status: result.status };
  };

  return {
    mutate,
    isLoading: false, // Convex mutations don't have loading state
  };
}

// =============================================================================
// Week Navigation Helpers
// =============================================================================

/**
 * Get the Monday of the week containing a given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the Sunday of the week containing a given date.
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Add weeks to a date.
 */
export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

/**
 * Get ISO date string from Date in LOCAL timezone.
 * Note: We use local date parts to avoid timezone shift issues
 * (toISOString converts to UTC which can shift the date by 1 day).
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
