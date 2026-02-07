/**
 * Bookings Domain Types
 */

export interface Booking {
    id: string;
    tenantId: string;
    listingId: string;
    userId: string;
    startDate: string;
    endDate: string;
    status: BookingStatus;
    totalPrice: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';

export interface BookingFilters {
    status?: BookingStatus;
    startDate?: string;
    endDate?: string;
    listingId?: string;
    userId?: string;
}

export interface BookingRequest {
    listingId: string;
    startDate: string;
    endDate: string;
    guestCount?: number;
    notes?: string;
}
