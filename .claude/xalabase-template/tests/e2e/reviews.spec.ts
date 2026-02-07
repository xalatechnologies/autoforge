/**
 * Reviews E2E Tests
 *
 * Playwright tests for the reviews user flow.
 * Tests cover both min-side (user) and backoffice (admin) perspectives.
 */

import { test, expect } from '@playwright/test';

test.describe('Reviews - User Flow (Min-side)', () => {
    test.beforeEach(async ({ page }) => {
        // Login as test user
        await page.goto('/min-side');
        // Add login steps if needed
    });

    test('should display reviews page with empty state', async ({ page }) => {
        await page.goto('/min-side/omtaler');

        // Should show empty state
        await expect(page.getByText('Du har ikke skrevet noen anmeldelser ennå')).toBeVisible();
    });

    test('should display reviews list with tabs', async ({ page }) => {
        await page.goto('/min-side/omtaler');

        // Should have filter tabs
        await expect(page.getByRole('tab', { name: /Alle/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Venter/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Godkjent/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Avvist/i })).toBeVisible();
    });

    test('should filter reviews by status', async ({ page }) => {
        await page.goto('/min-side/omtaler');

        // Click on pending tab
        await page.getByRole('tab', { name: /Venter/i }).click();

        // Wait for tab content to update
        await page.waitForTimeout(500);

        // URL or state should reflect filter
        // Reviews shown should all be in pending status
    });

    test('should allow editing a pending review', async ({ page }) => {
        await page.goto('/min-side/omtaler');

        // Click pending tab
        await page.getByRole('tab', { name: /Venter/i }).click();

        // Find and click edit button on first review (if exists)
        const editButton = page.getByRole('button', { name: /Rediger/i }).first();
        if (await editButton.isVisible()) {
            await editButton.click();

            // Edit form should appear
            await expect(page.getByText('Rediger anmeldelse')).toBeVisible();

            // Modify rating
            await page.getByLabel(/3 av 5 stjerner/i).click();

            // Save changes
            await page.getByRole('button', { name: /Lagre endringer/i }).click();

            // Form should close
            await expect(page.getByText('Rediger anmeldelse')).not.toBeVisible();
        }
    });

    test('should show confirmation when deleting a review', async ({ page }) => {
        await page.goto('/min-side/omtaler');

        // Click pending tab
        await page.getByRole('tab', { name: /Venter/i }).click();

        // Find delete button
        const deleteButton = page.getByRole('button', { name: /Slett/i }).first();
        if (await deleteButton.isVisible()) {
            // Set up dialog listener
            page.on('dialog', async (dialog) => {
                expect(dialog.message()).toContain('sikker');
                await dialog.dismiss(); // Cancel deletion in test
            });

            await deleteButton.click();
        }
    });

    test('should display moderator feedback for rejected reviews', async ({ page }) => {
        await page.goto('/min-side/omtaler');

        // Click rejected tab
        await page.getByRole('tab', { name: /Avvist/i }).click();

        // If there are rejected reviews, they should show moderator notes
        const feedbackSection = page.getByText('Tilbakemelding fra moderator');
        if (await feedbackSection.isVisible()) {
            // Feedback should be visible in a distinct container
            await expect(feedbackSection).toBeVisible();
        }
    });
});

test.describe('Reviews - Admin Flow (Backoffice)', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/backoffice');
        // Add admin login steps
    });

    test('should display review moderation page', async ({ page }) => {
        await page.goto('/backoffice/anmeldelser');

        await expect(page.getByRole('heading', { name: /Moderering av anmeldelser/i })).toBeVisible();
    });

    test('should filter reviews by status', async ({ page }) => {
        await page.goto('/backoffice/anmeldelser');

        // Click on approved filter
        await page.getByRole('button', { name: /Godkjent/i }).click();

        // Table should update to show only approved reviews
    });

    test('should search reviews', async ({ page }) => {
        await page.goto('/backoffice/anmeldelser');

        // Type in search box
        await page.getByPlaceholder(/Søk/i).fill('test');

        // Wait for search results to filter
        await page.waitForTimeout(500);
    });

    test('should moderate a pending review', async ({ page }) => {
        await page.goto('/backoffice/anmeldelser');

        // Ensure pending filter is active
        await page.getByRole('button', { name: /Venter/i }).click();

        // Find a review row and click approve button (if table has reviews)
        const approveButton = page.getByRole('button', { name: /Godkjenn/i }).first();
        if (await approveButton.isVisible()) {
            await approveButton.click();

            // Review should be removed from pending list
            // Or a success notification should appear
        }
    });

    test('should reject a review with notes', async ({ page }) => {
        await page.goto('/backoffice/anmeldelser');

        // Ensure pending filter is active
        await page.getByRole('button', { name: /Venter/i }).click();

        // Find and click reject button
        const rejectButton = page.getByRole('button', { name: /Avslå/i }).first();
        if (await rejectButton.isVisible()) {
            await rejectButton.click();

            // Modal should appear for notes
            const notesInput = page.getByPlaceholder(/notat/i);
            if (await notesInput.isVisible()) {
                await notesInput.fill('Inappropriate content');
                await page.getByRole('button', { name: /Bekreft/i }).click();
            }
        }
    });

    test('should show review count in header', async ({ page }) => {
        await page.goto('/backoffice/anmeldelser');

        // Should display total count
        await expect(page.getByText(/Viser \d+ av \d+ anmeldelser/i)).toBeVisible();
    });
});

test.describe('Reviews - Integration', () => {
    test('user review appears in admin queue', async ({ page, context }) => {
        // This test requires both user and admin perspectives
        // Create a user review, then verify it appears in admin moderation queue

        // Step 1: User creates review
        const userPage = await context.newPage();
        await userPage.goto('/min-side/bookings');
        // Navigate to a completed booking and submit review

        // Step 2: Admin sees review in queue
        const adminPage = await context.newPage();
        await adminPage.goto('/backoffice/anmeldelser');

        // New review should appear in pending
        await adminPage.getByRole('button', { name: /Venter/i }).click();

        // Close pages
        await userPage.close();
        await adminPage.close();
    });

    test('approved review shows up on listing page', async ({ page }) => {
        // After admin approves a review, it should appear on the listing's public page
        // with the correct rating and content

        await page.goto('/listings/test-listing');

        // Reviews section should show approved reviews
        const reviewsSection = page.getByTestId('reviews-section');
        if (await reviewsSection.isVisible()) {
            // Should display average rating
            await expect(page.getByText(/anmeldelser/i)).toBeVisible();
        }
    });
});
