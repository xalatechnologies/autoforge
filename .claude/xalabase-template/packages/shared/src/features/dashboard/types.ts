/**
 * Dashboard Domain Types
 */

export interface DashboardStats {
    totalListings: number;
    activeListings: number;
    totalBookings: number;
    pendingBookings: number;
    pendingReviews: number;
    revenue: number;
    averageRating: number;
}

export interface DashboardFilters {
    period: DashboardPeriod;
    tenantId?: string;
    organizationId?: string;
}

export type DashboardPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface RevenueData {
    date: string;
    amount: number;
    currency: string;
}

export interface ActivityItem {
    id: string;
    type: 'booking' | 'review' | 'message' | 'listing';
    title: string;
    description: string;
    timestamp: string;
}
