/**
 * Reviews Domain Types
 */

export interface Review {
    id: string;
    tenantId: string;
    listingId: string;
    bookingId?: string;
    userId: string;
    rating: number;
    title?: string;
    comment?: string;
    status: ReviewStatus;
    moderatedBy?: string;
    moderatedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface ReviewFilters {
    status?: ReviewStatus;
    minRating?: number;
    maxRating?: number;
    listingId?: string;
    userId?: string;
}

export interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
}

export interface ReviewRequest {
    listingId: string;
    bookingId?: string;
    rating: number;
    title?: string;
    comment?: string;
}
