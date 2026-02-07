/**
 * Features - Self-contained vertical slices
 * 
 * Each domain contains: types, convex, hooks, adapters, presenters, utils
 */

// Shared utilities
export * as shared from './_shared';

// Core Domains
export * as auth from './auth';
export * as bookings from './bookings';
export * as calendar from './calendar';
export * as dashboard from './dashboard';
export * as listings from './listings';
export * as messaging from './messaging';
export * as organizations from './organizations';
export * as reviews from './reviews';
export * as seasons from './seasons';

// Business Domains
export * as addons from './addons';
export * as analytics from './analytics';
export * as audit from './audit';
export * as billing from './billing';
export * as catalog from './catalog';
export * as compliance from './compliance';
export * as integrations from './integrations';
export * as notifications from './notifications';
export * as pricing from './pricing';
export * as resources from './resources';

// Platform Domains
export * as rbac from './rbac';
export * as tenantConfig from './tenant-config';
export * as userPrefs from './user-prefs';
