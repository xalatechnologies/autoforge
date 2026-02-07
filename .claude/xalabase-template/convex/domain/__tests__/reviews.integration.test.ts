/**
 * Reviews Domain - Integration Tests
 *
 * Tests for Convex domain/reviews functions.
 * Run with: npx convex dev --once && npm run test:convex
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// ConvexTestingHelper is not yet installed as a package.
// This test file is a placeholder for future integration testing.
// TODO: Install convex-testing package and remove this stub.
type ConvexTestingHelper = { init: () => Promise<void>; cleanup: () => Promise<void>; query: (ref: any, args: any) => Promise<any>; mutation: (ref: any, args: any) => Promise<any> };
const ConvexTestingHelper = class { async init() {} async cleanup() {} async query(_ref: any, _args: any) { return null; } async mutation(_ref: any, _args: any) { return null; } };
import { api } from '../../_generated/api';
import type { Id } from '../../_generated/dataModel';

// Test tenant and user IDs (these would be seeded in test fixtures)
const TEST_TENANT_ID = 'test-tenant-123' as Id<"tenants">;
const TEST_USER_ID = 'test-user-123' as Id<"users">;
const TEST_RESOURCE_ID = 'test-resource-123';

describe('Reviews Domain Functions', () => {
    let convex: ConvexTestingHelper;
    let createdReviewId: string;

    beforeEach(async () => {
        // Initialize test helper with clean state
        convex = new ConvexTestingHelper();
        await convex.init();
    });

    afterEach(async () => {
        await convex.cleanup();
    });

    describe('create', () => {
        it('should create a review with pending status', async () => {
            const result = await convex.mutation(api.domain.reviews.create, {
                tenantId: TEST_TENANT_ID,
                resourceId: TEST_RESOURCE_ID,
                userId: TEST_USER_ID,
                rating: 5,
                title: 'Great experience',
                text: 'I had a wonderful time!',
            });

            expect(result.id).toBeDefined();
            createdReviewId = result.id;

            // Fetch and verify
            const review = await convex.query(api.domain.reviews.get, {
                id: createdReviewId,
            });

            expect(review.rating).toBe(5);
            expect(review.status).toBe('pending');
            expect(review.title).toBe('Great experience');
        });

        it('should reject invalid ratings', async () => {
            await expect(
                convex.mutation(api.domain.reviews.create, {
                    tenantId: TEST_TENANT_ID,
                    resourceId: TEST_RESOURCE_ID,
                    userId: TEST_USER_ID,
                    rating: 6, // Invalid: must be 1-5
                    title: 'Test',
                })
            ).rejects.toThrow('Rating must be between 1 and 5');
        });

        it('should prevent duplicate reviews from same user for same resource', async () => {
            // Create first review
            await convex.mutation(api.domain.reviews.create, {
                tenantId: TEST_TENANT_ID,
                resourceId: TEST_RESOURCE_ID,
                userId: TEST_USER_ID,
                rating: 4,
            });

            // Attempt duplicate
            await expect(
                convex.mutation(api.domain.reviews.create, {
                    tenantId: TEST_TENANT_ID,
                    resourceId: TEST_RESOURCE_ID,
                    userId: TEST_USER_ID,
                    rating: 5,
                })
            ).rejects.toThrow('User has already reviewed this resource');
        });
    });

    describe('update', () => {
        it('should update review and reset status to pending', async () => {
            // Create a review
            const { id } = await convex.mutation(api.domain.reviews.create, {
                tenantId: TEST_TENANT_ID,
                resourceId: TEST_RESOURCE_ID,
                userId: TEST_USER_ID,
                rating: 3,
            });

            // Update it
            await convex.mutation(api.domain.reviews.update, {
                id,
                rating: 4,
                title: 'Updated title',
            });

            const review = await convex.query(api.domain.reviews.get, { id });
            expect(review.rating).toBe(4);
            expect(review.title).toBe('Updated title');
            expect(review.status).toBe('pending'); // Reset after edit
        });
    });

    describe('moderate', () => {
        it('should approve a review', async () => {
            const { id } = await convex.mutation(api.domain.reviews.create, {
                tenantId: TEST_TENANT_ID,
                resourceId: TEST_RESOURCE_ID,
                userId: TEST_USER_ID,
                rating: 5,
            });

            await convex.mutation(api.domain.reviews.moderate, {
                id,
                status: 'approved',
                moderatedBy: TEST_USER_ID,
            });

            const review = await convex.query(api.domain.reviews.get, { id });
            expect(review.status).toBe('approved');
            expect(review.moderatedBy).toBe(TEST_USER_ID);
            expect(review.moderatedAt).toBeDefined();
        });

        it('should reject a review with notes', async () => {
            const { id } = await convex.mutation(api.domain.reviews.create, {
                tenantId: TEST_TENANT_ID,
                resourceId: TEST_RESOURCE_ID,
                userId: TEST_USER_ID,
                rating: 1,
                text: 'Bad content',
            });

            await convex.mutation(api.domain.reviews.moderate, {
                id,
                status: 'rejected',
                moderatedBy: TEST_USER_ID,
                moderationNote: 'Inappropriate content',
            });

            const review = await convex.query(api.domain.reviews.get, { id });
            expect(review.status).toBe('rejected');
            expect(review.moderationNote).toBe('Inappropriate content');
        });
    });

    describe('stats', () => {
        it('should calculate average and distribution for approved reviews', async () => {
            // Create and approve several reviews with different ratings
            const ratings = [5, 4, 5, 3, 4];

            for (let i = 0; i < ratings.length; i++) {
                const { id } = await convex.mutation(api.domain.reviews.create, {
                    tenantId: TEST_TENANT_ID,
                    resourceId: TEST_RESOURCE_ID,
                    userId: `user-${i}` as Id<"users">,
                    rating: ratings[i],
                });

                await convex.mutation(api.domain.reviews.moderate, {
                    id,
                    status: 'approved',
                    moderatedBy: TEST_USER_ID,
                });
            }

            const stats = await convex.query(api.domain.reviews.stats, {
                resourceId: TEST_RESOURCE_ID,
            });

            expect(stats.total).toBe(5);
            expect(stats.averageRating).toBe(4.2); // (5+4+5+3+4)/5 = 4.2
            expect(stats.distribution[5]).toBe(2);
            expect(stats.distribution[4]).toBe(2);
            expect(stats.distribution[3]).toBe(1);
            expect(stats.pending).toBe(0);
        });
    });

    describe('list', () => {
        it('should list reviews by tenant', async () => {
            // Create reviews
            await convex.mutation(api.domain.reviews.create, {
                tenantId: TEST_TENANT_ID,
                resourceId: TEST_RESOURCE_ID,
                userId: TEST_USER_ID,
                rating: 4,
            });

            const reviews = await convex.query(api.domain.reviews.list, {
                tenantId: TEST_TENANT_ID,
            });

            expect(reviews.length).toBeGreaterThan(0);
            expect(reviews[0].tenantId).toBe(TEST_TENANT_ID);
        });

        it('should filter by status', async () => {
            const reviews = await convex.query(api.domain.reviews.list, {
                tenantId: TEST_TENANT_ID,
                status: 'pending',
            });

            reviews.forEach((review: any) => {
                expect(review.status).toBe('pending');
            });
        });
    });

    describe('remove', () => {
        it('should delete a review', async () => {
            const { id } = await convex.mutation(api.domain.reviews.create, {
                tenantId: TEST_TENANT_ID,
                resourceId: TEST_RESOURCE_ID,
                userId: TEST_USER_ID,
                rating: 3,
            });

            await convex.mutation(api.domain.reviews.remove, { id });

            await expect(
                convex.query(api.domain.reviews.get, { id })
            ).rejects.toThrow('Review not found');
        });
    });
});
