/**
 * E2E Test Auth Helpers
 *
 * Provides authentication utilities for E2E tests.
 * Supports both real login (when available) and mock/bypass methods.
 */

import { Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5190';

// Demo credentials (matches seed data)
export const DEMO_USER = {
  email: 'demo@example.com',
  password: 'demo123',
  name: 'Demo User',
};

export const DEMO_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Admin User',
};

/**
 * Try to login via the login page.
 * Returns true if successful, false otherwise.
 */
export async function tryLogin(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(500);

    // Check for login form
    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[placeholder*="e-post"], [data-testid="email-input"]'
    ).first();

    if ((await emailInput.count()) === 0) {
      console.log('Login form not found');
      return false;
    }

    await emailInput.fill(email);

    const passwordInput = page.locator(
      'input[type="password"], input[name="password"], [data-testid="password-input"]'
    ).first();
    await passwordInput.fill(password);

    const loginButton = page.locator(
      'button[type="submit"], button:has-text("Logg inn"), button:has-text("Login"), [data-testid="login-button"]'
    ).first();
    await loginButton.click();

    // Wait for navigation or error
    await page.waitForTimeout(2000);

    // Check if still on login page (failed)
    if (page.url().includes('/login')) {
      const errorMsg = page.locator('[class*="error"], [role="alert"], .error-message');
      if ((await errorMsg.count()) > 0) {
        console.log('Login failed with error');
        return false;
      }
    }

    return !page.url().includes('/login');
  } catch (error) {
    console.log('Login error:', error);
    return false;
  }
}

/**
 * Login as demo user.
 */
export async function loginAsDemo(page: Page): Promise<boolean> {
  return tryLogin(page, DEMO_USER.email, DEMO_USER.password);
}

/**
 * Login as admin user.
 */
export async function loginAsAdmin(page: Page): Promise<boolean> {
  return tryLogin(page, DEMO_ADMIN.email, DEMO_ADMIN.password);
}

/**
 * Set auth state directly in localStorage (bypass login UI).
 * This is useful when the login UI doesn't work in tests.
 */
export async function setAuthState(
  page: Page,
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  }
): Promise<void> {
  await page.goto(BASE_URL);

  await page.evaluate((userData) => {
    const authData = {
      id: userData.id,
      _id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      isAuthenticated: true,
    };

    // Set in all possible storage keys used by the app
    localStorage.setItem('xalabaas_web_user', JSON.stringify(authData));
    localStorage.setItem('xalabaas_user', JSON.stringify(authData));
    localStorage.setItem('xalabaas_auth_token', 'test-token-' + userData.id);
  }, user);

  // Reload to apply auth state
  await page.reload();
  await page.waitForTimeout(500);
}

/**
 * Set demo user auth state directly.
 */
export async function setDemoAuthState(page: Page): Promise<void> {
  await setAuthState(page, {
    id: 'demo-user-id',
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    role: 'user',
  });
}

/**
 * Set admin auth state directly.
 */
export async function setAdminAuthState(page: Page): Promise<void> {
  await setAuthState(page, {
    id: 'admin-user-id',
    email: DEMO_ADMIN.email,
    name: DEMO_ADMIN.name,
    role: 'admin',
  });
}

/**
 * Clear all auth state.
 */
export async function logout(page: Page): Promise<void> {
  await page.goto(BASE_URL);

  await page.evaluate(() => {
    localStorage.removeItem('xalabaas_web_user');
    localStorage.removeItem('xalabaas_user');
    localStorage.removeItem('xalabaas_auth_token');
    localStorage.removeItem('xalabaas_web_tenant_id');
    localStorage.removeItem('xalabaas_tenant_id');
  });

  await page.reload();
}

/**
 * Check if currently authenticated.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const user =
      localStorage.getItem('xalabaas_web_user') ||
      localStorage.getItem('xalabaas_user');
    return !!user;
  });
}

/**
 * Get current user from localStorage.
 */
export async function getCurrentUser(page: Page): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  return page.evaluate(() => {
    const stored =
      localStorage.getItem('xalabaas_web_user') ||
      localStorage.getItem('xalabaas_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
}
