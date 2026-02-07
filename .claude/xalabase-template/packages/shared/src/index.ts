/**
 * Shared Package - Domain Features
 *
 * Strategy:
 * - @xala/ds: ALL reusable UI (blocks, shells, composed)
 * - @xalabaas/sdk: ALL data hooks (useAuth, useBookings, etc.)
 * - @xalabaas/app-shell: Providers, guards, layout
 * - @xalabaas/shared: ONLY domain features
 *
 * Organization:
 * - features/     - Domain-specific feature modules (listings, bookings, etc.)
 * - types/        - Shared TypeScript types
 * - hooks/        - App-specific hooks (useRBAC)
 */

// Types
export * from "./types";

// Navigation config
export * from "./navigation";

// Constants
export * from "./constants";

// Hooks (useRBAC only - SDK has data hooks)
export * from "./hooks";

// Features - domain-based organization
export * as ListingsFeatures from "./features/listings";
export * as BookingsFeatures from "./features/bookings";
export * as CalendarFeatures from "./features/calendar";
export * as MessagingFeatures from "./features/messaging";
export * as ReviewsFeatures from "./features/reviews";
export * as SeasonsFeatures from "./features/seasons";
export * as DashboardFeatures from "./features/dashboard";
export * as AuthFeatures from "./features/auth";
