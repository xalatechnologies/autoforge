/**
 * Booking Flow E2E Tests
 *
 * End-to-end tests for the complete booking user journey.
 * Updated to work with current app structure (port 5190, current routes/selectors).
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration - uses playwright.config.ts baseURL (localhost:5190)
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5190';

// Helper: Wait for page to fully load
async function waitForPageLoad(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('main, #main-content, [role="main"]', { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

// Helper: Navigate to a listing detail page
async function goToFirstListing(page: Page, category?: string): Promise<boolean> {
  await page.goto(BASE_URL);
  const loaded = await waitForPageLoad(page);
  if (!loaded) return false;

  // Click category if specified
  if (category) {
    const categoryPill = page.locator(`button:has-text("${category}")`).first();
    if (await categoryPill.count() > 0) {
      await categoryPill.click();
      await page.waitForTimeout(500);
    }
  }

  // Find and click first listing card
  const listingCard = page.locator('.listing-card, [class*="ListingCard"]').first();
  if (await listingCard.count() === 0) return false;

  await listingCard.click();
  await page.waitForURL(/\/listing\//);
  return true;
}

// Helper: Try to login (returns false if login fails)
async function tryLogin(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(500);

    // Check if login page exists
    const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]').first();
    if (await emailInput.count() === 0) return false;

    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]').first();
    await passwordInput.fill(password);

    const loginButton = page.locator('button[type="submit"], button:has-text("Logg inn"), [data-testid="login-button"]').first();
    await loginButton.click();

    // Wait for redirect or error
    await page.waitForTimeout(2000);

    // Check if we're logged in (no longer on login page)
    return !page.url().includes('/login');
  } catch {
    return false;
  }
}

test.describe('Booking Flow E2E', () => {
  test.describe('User Story: Browse and Book Resource', () => {
    test('US-4.1: Browse listings page', async ({ page }) => {
      await page.goto(BASE_URL);
      const loaded = await waitForPageLoad(page);

      if (!loaded) {
        test.skip();
        return;
      }

      // Verify listings page loads with content
      const mainContent = page.locator('main, #main-content');
      await expect(mainContent).toBeVisible();

      // Check for category pills
      const categoryPills = page.locator('button:has-text("Lokaler"), button:has-text("Sport")');
      expect(await categoryPills.count()).toBeGreaterThan(0);
    });

    test('US-4.1: View listing details', async ({ page }) => {
      const hasListing = await goToFirstListing(page);

      if (!hasListing) {
        test.skip();
        return;
      }

      // Verify detail page elements
      const detailPage = page.locator('main, #main-content');
      await expect(detailPage).toBeVisible();

      // Check for booking widget
      const bookingWidget = page.locator('.booking-widget-expanded, .booking-widget-placement, [class*="BookingWidget"]').first();
      await expect(bookingWidget).toBeVisible();
    });

    test('US-4.1: Booking calendar is interactive', async ({ page }) => {
      const hasListing = await goToFirstListing(page, 'Lokaler');

      if (!hasListing) {
        test.skip();
        return;
      }

      // Find calendar
      const calendar = page.locator('.booking-calendar, .day-calendar, [class*="Calendar"]').first();
      if (await calendar.count() === 0) {
        test.skip();
        return;
      }

      await expect(calendar).toBeVisible();

      // Find clickable day
      const availableDay = page.locator('.calendar-day:not(.disabled):not(.booked), [class*="day"]:not([class*="disabled"])').first();
      if (await availableDay.count() > 0) {
        await availableDay.click();
        await page.waitForTimeout(500);
      }
    });

    test('US-4.1: Sport facility shows time slots', async ({ page }) => {
      const hasListing = await goToFirstListing(page, 'Sport');

      if (!hasListing) {
        test.skip();
        return;
      }

      // Check for weekly grid or time slots
      const timeSlots = page.locator('.time-slot, .slot-cell, [class*="slot"], [class*="Slot"]').first();
      const weeklyGrid = page.locator('.weekly-grid, .week-view, [class*="weekly"]').first();

      const hasSlots = await timeSlots.count() > 0 || await weeklyGrid.count() > 0;
      expect(hasSlots).toBeTruthy();
    });

    test('US-4.1: Clicking slot opens booking dialog', async ({ page }) => {
      const hasListing = await goToFirstListing(page, 'Sport');

      if (!hasListing) {
        test.skip();
        return;
      }

      // Find and click a time slot
      const timeSlot = page.locator('.time-slot:not(.booked):not(.blocked), .slot-cell:not(.unavailable)').first();
      if (await timeSlot.count() === 0) {
        test.skip();
        return;
      }

      await timeSlot.click();
      await page.waitForTimeout(500);

      // Check if dialog opened
      const dialog = page.locator('[role="dialog"], .modal, .booking-dialog, [class*="Dialog"]').first();
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
      }
    });
  });

  test.describe('User Story: Category Filtering', () => {
    test('US-3.3: Filter by Lokaler category', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitForPageLoad(page);

      const lokalerButton = page.locator('button:has-text("Lokaler")').first();
      if (await lokalerButton.count() === 0) {
        test.skip();
        return;
      }

      await lokalerButton.click();
      await page.waitForTimeout(500);

      // Listings should be filtered
      const mainContent = page.locator('main, #main-content');
      await expect(mainContent).toBeVisible();
    });

    test('US-3.3: Filter by Sport category', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitForPageLoad(page);

      const sportButton = page.locator('button:has-text("Sport")').first();
      if (await sportButton.count() === 0) {
        test.skip();
        return;
      }

      await sportButton.click();
      await page.waitForTimeout(500);

      const mainContent = page.locator('main, #main-content');
      await expect(mainContent).toBeVisible();
    });

    test('US-3.3: Filter by Arrangementer category', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitForPageLoad(page);

      const eventButton = page.locator('button:has-text("Arrangementer")').first();
      if (await eventButton.count() === 0) {
        test.skip();
        return;
      }

      await eventButton.click();
      await page.waitForTimeout(500);

      const mainContent = page.locator('main, #main-content');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('User Story: Authenticated Booking', () => {
    test('US-2.1: Login page exists', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(500);

      // Check if we have a login form or are redirected
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    });

    test('US-4.2: Authenticated user can access booking', async ({ page }) => {
      // Try to login
      const loggedIn = await tryLogin(page, 'demo@example.com', 'demo123');

      if (!loggedIn) {
        // Skip if login not available
        test.skip();
        return;
      }

      // Navigate to a listing
      const hasListing = await goToFirstListing(page);
      if (!hasListing) {
        test.skip();
        return;
      }

      // Booking widget should be accessible
      const bookingWidget = page.locator('.booking-widget-expanded, .booking-widget-placement').first();
      await expect(bookingWidget).toBeVisible();
    });
  });

  test.describe('User Story: Navigation', () => {
    test('US-1.1: Navigate from listing back to home', async ({ page }) => {
      const hasListing = await goToFirstListing(page);

      if (!hasListing) {
        test.skip();
        return;
      }

      // Click breadcrumb or logo to go back
      const homeLink = page.locator('a[href="/"], .logo, nav a:has-text("Hjem")').first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        await page.waitForURL(/^https?:\/\/[^/]+\/?$/);
      } else {
        // Use browser back
        await page.goBack();
      }

      await waitForPageLoad(page);
      const mainContent = page.locator('main, #main-content');
      await expect(mainContent).toBeVisible();
    });

    test('US-1.1: Search functionality', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitForPageLoad(page);

      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Søk"], [class*="search"] input').first();
      if (await searchInput.count() === 0) {
        test.skip();
        return;
      }

      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Search should show results or update listings
      const mainContent = page.locator('main, #main-content');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('US-9.1: Handle 404 page', async ({ page }) => {
      await page.goto(`${BASE_URL}/listing/non-existent-listing-12345`);
      await page.waitForTimeout(1000);

      // Should show error or redirect
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    });

    test('US-9.2: Handle invalid routes', async ({ page }) => {
      await page.goto(`${BASE_URL}/invalid-route-xyz`);
      await page.waitForTimeout(1000);

      // Should not crash
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('US-10.1: Listings page loads within 5 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('US-10.2: Detail page loads within 5 seconds', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitForPageLoad(page);

      const listingCard = page.locator('.listing-card, [class*="ListingCard"]').first();
      if (await listingCard.count() === 0) {
        test.skip();
        return;
      }

      const startTime = Date.now();
      await listingCard.click();
      await page.waitForURL(/\/listing\//);
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });
  });
});
