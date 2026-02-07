# Component Architecture Reference

XalaBaaS uses 18 Convex components for domain isolation. Each component has its own schema, queries, mutations, and contract definition. Components communicate exclusively through the event bus (outbox pattern), never through direct cross-component function calls.

---

## Component Overview

| # | Component | Registered Name | Category | Tables | Feature Module |
|---|-----------|-----------------|----------|--------|----------------|
| 1 | audit | `audit` | infrastructure | 1 | `audit` |
| 2 | reviews | `reviews` | domain | 1 | `reviews` |
| 3 | notifications | `notifications` | infrastructure | 2 | `notifications` |
| 4 | user-prefs | `userPrefs` | platform | 2 | `user-prefs` |
| 5 | messaging | `messaging` | domain | 2 | `messaging` |
| 6 | catalog | `catalog` | domain | 4 | `catalog` |
| 7 | analytics | `analytics` | infrastructure | 4 | `analytics` |
| 8 | compliance | `compliance` | infrastructure | 3 | `compliance` |
| 9 | tenant-config | `tenantConfig` | infrastructure | 5 | `tenant-config` |
| 10 | resources | `resources` | domain | 1 | `resources` |
| 11 | bookings | `bookings` | domain | 5 | `bookings` |
| 12 | pricing | `pricing` | domain | 9 | `pricing` |
| 13 | addons | `addons` | domain | 3 | `addons` |
| 14 | seasons | `seasons` | domain | 4 | `seasons` |
| 15 | auth | `auth` | platform | 4 | `auth` |
| 16 | rbac | `rbac` | platform | 2 | `rbac` |
| 17 | billing | `billing` | domain | 2 | `billing` |
| 18 | integrations | `integrations` | infrastructure | 3 | `integrations` |

**Total:** 55 component tables + 9 core tables = 64 tables

---

## Registration in convex.config.ts

All components are registered in `convex/convex.config.ts`:

```typescript
import { defineApp } from "convex/server";
const app = defineApp();

// Phase 1b-1e
import audit from "./components/audit/convex.config";
app.use(audit);
import reviews from "./components/reviews/convex.config";
app.use(reviews);
import notifications from "./components/notifications/convex.config";
app.use(notifications);
import userPrefs from "./components/user-prefs/convex.config";
app.use(userPrefs);

// Phase 2a-2e
import messaging from "./components/messaging/convex.config";
app.use(messaging);
import catalog from "./components/catalog/convex.config";
app.use(catalog);
import analytics from "./components/analytics/convex.config";
app.use(analytics);
import compliance from "./components/compliance/convex.config";
app.use(compliance);
import tenantConfig from "./components/tenant-config/convex.config";
app.use(tenantConfig);

// Workstream 1
import resources from "./components/resources/convex.config";
app.use(resources);

// Phase 3a-3d
import bookings from "./components/bookings/convex.config";
app.use(bookings);
import pricing from "./components/pricing/convex.config";
app.use(pricing);
import addons from "./components/addons/convex.config";
app.use(addons);
import seasons from "./components/seasons/convex.config";
app.use(seasons);

// Phase 4a-4d
import auth from "./components/auth/convex.config";
app.use(auth);
import rbac from "./components/rbac/convex.config";
app.use(rbac);
import billing from "./components/billing/convex.config";
app.use(billing);
import integrations from "./components/integrations/convex.config";
app.use(integrations);

export default app;
```

Each component's `convex.config.ts` in `convex/components/{name}/` is a re-export of the real config in `features/{name}/convex/convex.config.ts`.

---

## Component Details

### 1. audit

**Purpose:** General-purpose polymorphic audit log for all entities across the platform.

**Tables:**

| Table | Description |
|-------|-------------|
| `auditLog` | Stores audit entries with entityType/entityId polymorphism, state change tracking (previousState, newState, changedFields), and source component attribution. |

**Queries:**

| Function | Description |
|----------|-------------|
| `listForTenant` | List audit entries for a tenant, optionally filtered by entity type with cursor pagination |
| `listByEntity` | List entries for a specific entity (by entityType + entityId) |
| `listByUser` | List entries by a specific user |
| `listByAction` | List entries by action type (created, updated, deleted, etc.) |
| `get` | Get a single audit entry by ID |
| `getSummary` | Get audit summary statistics for a tenant within a time period |

**Mutations:**

| Function | Description |
|----------|-------------|
| `create` | Create an audit log entry (called by all facade mutations) |

**Contract:** `v1.0.0`, category `infrastructure`
**Dependencies:** Core tables: tenants, users

---

### 2. reviews

**Purpose:** Resource reviews with star ratings and moderation workflow.

**Tables:**

| Table | Description |
|-------|-------------|
| `reviews` | User reviews with rating (1-5), title, text, moderation status (pending/approved/rejected/flagged), and moderator details. |

**Queries:**

| Function | Description |
|----------|-------------|
| `list` | List reviews with optional filters (tenantId, resourceId, status, limit) |
| `get` | Get a single review by ID |
| `stats` | Get aggregate statistics for a resource (total, averageRating, distribution, pending count) |

**Mutations:**

| Function | Description |
|----------|-------------|
| `create` | Create a review (tenantId, resourceId, userId, rating, title, text) |
| `update` | Update a review (rating, title, text) |
| `remove` | Delete a review |
| `moderate` | Moderate a review (approve, reject, flag) with moderator info |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, users, resources

---

### 3. notifications

**Purpose:** In-app notification delivery with per-user channel/category preferences.

**Tables:**

| Table | Description |
|-------|-------------|
| `notifications` | Notification records with type, title, body, link, and readAt timestamp. |
| `notificationPreferences` | Per-user preferences by channel (email, push, sms) and category (booking, review, etc.). |

**Queries:**

| Function | Description |
|----------|-------------|
| `listByUser` | List notifications for a user in a tenant |
| `unreadCount` | Get unread notification count |
| `get` | Get a single notification |
| `getPreferences` | Get notification preferences for a user |

**Mutations:**

| Function | Description |
|----------|-------------|
| `create` | Create a notification (tenantId, userId, type, title, body, link) |
| `markAsRead` | Mark a single notification as read |
| `markAllAsRead` | Mark all notifications as read for a user |
| `remove` | Delete a notification |
| `updatePreference` | Update a notification preference |

**Contract:** `v1.0.0`, category `infrastructure`
**Dependencies:** Core tables: tenants, users

---

### 4. user-prefs

**Purpose:** User favorites (bookmarked resources) and saved search filter configurations.

**Tables:**

| Table | Description |
|-------|-------------|
| `favorites` | Resource bookmarks with optional notes and tags. Unique per user+resource. |
| `savedFilters` | Named filter configurations (type, filters JSON, isDefault flag). |

**Queries:**

| Function | Description |
|----------|-------------|
| `listFavorites` | List favorites for a user in a tenant |
| `isFavorite` | Check if a resource is favorited by a user |
| `listFilters` | List saved filters for a user |

**Mutations:**

| Function | Description |
|----------|-------------|
| `addFavorite` | Add a resource to favorites |
| `removeFavorite` | Remove a resource from favorites |
| `toggleFavorite` | Toggle favorite status (add or remove) |
| `createFilter` | Save a filter configuration |
| `updateFilter` | Update a saved filter |
| `removeFilter` | Delete a saved filter |

**Contract:** `v1.0.0`, category `platform`
**Dependencies:** Core tables: tenants, users, resources

---

### 5. messaging

**Purpose:** Threaded conversations between users and admins with read tracking.

**Tables:**

| Table | Description |
|-------|-------------|
| `conversations` | Conversation threads with participants, subject, status (open/closed/archived), assignment, priority, and unread count. |
| `messages` | Individual messages with sender info, content, type (text/system/notification), attachments, and read timestamp. |

**Queries:**

| Function | Description |
|----------|-------------|
| `listConversations` | List conversations for a tenant |
| `getConversation` | Get a conversation with details |
| `listConversationsByAssignee` | List conversations assigned to a user |
| `unreadMessageCount` | Count unread messages for a user |
| `listMessages` | List messages in a conversation |

**Mutations:**

| Function | Description |
|----------|-------------|
| `createConversation` | Create a new conversation |
| `archiveConversation` | Archive a conversation |
| `resolveConversation` | Mark as resolved |
| `reopenConversation` | Reopen a resolved conversation |
| `assignConversation` | Assign to an agent |
| `sendMessage` | Send a message in a conversation |
| `markMessagesAsRead` | Mark messages as read |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, users

---

### 6. catalog

**Purpose:** Hierarchical categories, amenity groups, amenities, and resource-amenity associations.

**Tables:**

| Table | Description |
|-------|-------------|
| `categories` | Hierarchical category tree with parentId self-reference, slug, key, icon, color, sort order, and tenant settings. |
| `amenityGroups` | Logical groupings for amenities (e.g., "Facilities", "Equipment") with display ordering. |
| `amenities` | Individual amenities belonging to groups, with highlight flag and display ordering. |
| `resourceAmenities` | Join table linking resources to amenities with quantity, notes, inclusion status, and additional cost. |

**Queries:**

| Function | Description |
|----------|-------------|
| `listCategories` | List all categories for a tenant |
| `getCategory` | Get a category by ID |
| `getCategoryByKey` | Look up a category by its key |
| `getCategoryTree` | Get full hierarchical category tree |
| `listAmenityGroups` | List amenity groups |
| `listAmenities` | List all amenities |
| `getAmenity` | Get a single amenity |
| `listForResource` | List amenities associated with a resource |

**Mutations:**

| Function | Description |
|----------|-------------|
| `createCategory` | Create a category |
| `updateCategory` | Update a category |
| `removeCategory` | Delete a category |
| `createAmenityGroup` | Create an amenity group |
| `createAmenity` | Create an amenity |
| `updateAmenity` | Update an amenity |
| `removeAmenity` | Delete an amenity |
| `addToResource` | Associate an amenity with a resource |
| `removeFromResource` | Remove an amenity association |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, resources

---

### 7. analytics

**Purpose:** Metrics storage for booking and availability analytics, with scheduled report generation.

**Tables:**

| Table | Description |
|-------|-------------|
| `bookingMetrics` | Aggregated booking metrics by type, period, and resource. |
| `availabilityMetrics` | Availability/utilization metrics per resource per period, including popular time slots. |
| `reportSchedules` | Scheduled report definitions with cron expressions, recipients, format, and filters. |
| `scheduledReports` | Generated report instances with status tracking, file URLs, and error details. |

**Queries:**

| Function | Description |
|----------|-------------|
| `getBookingMetrics` | Get booking metrics for a tenant |
| `getAvailabilityMetrics` | Get availability metrics for a tenant |
| `listReportSchedules` | List report schedules |

**Mutations:**

| Function | Description |
|----------|-------------|
| `storeBookingMetrics` | Store a booking metrics snapshot |
| `storeAvailabilityMetrics` | Store an availability metrics snapshot |
| `createReportSchedule` | Create a scheduled report |
| `updateReportSchedule` | Update schedule configuration |
| `deleteReportSchedule` | Remove a schedule |

**Contract:** `v1.0.0`, category `infrastructure`
**Dependencies:** Core tables: tenants, resources

---

### 8. compliance

**Purpose:** GDPR compliance with consent management, DSAR tracking, and policy versioning.

**Tables:**

| Table | Description |
|-------|-------------|
| `consentRecords` | Per-user consent by category (marketing, analytics, thirdParty, necessary) with consent/withdrawal timestamps and IP/UA tracking. |
| `dsarRequests` | Data Subject Access Requests with type (access, deletion, rectification, portability, restriction), status lifecycle, and processor tracking. |
| `policyVersions` | Versioned policy documents (privacy, terms, cookies, data_processing) with publish status and version chain (previousVersionId). |

**Queries:**

| Function | Description |
|----------|-------------|
| `getConsent` | Get consent records for a user |
| `listConsent` | List all consent records for a tenant |
| `getConsentSummary` | Get aggregated consent statistics |
| `getDSAR` | Get a DSAR request by ID |
| `listDSARRequests` | List DSAR requests for a tenant |
| `getPolicy` | Get current published policy by type |
| `listPolicies` | List all policies |
| `getPolicyHistory` | Get version history for a policy type |

**Mutations:**

| Function | Description |
|----------|-------------|
| `updateConsent` | Update consent for a user/category |
| `submitDSAR` | Submit a new DSAR request |
| `updateDSARStatus` | Update DSAR processing status |
| `publishPolicy` | Publish a new policy version |
| `rollbackPolicy` | Rollback to a previous policy version |

**Contract:** `v1.0.0`, category `infrastructure`
**Dependencies:** Core tables: tenants, users

---

### 9. tenant-config

**Purpose:** Per-tenant feature flags with targeting rules, branding/white-labeling, and CSS theme overrides.

**Tables:**

| Table | Description |
|-------|-------------|
| `flagDefinitions` | Feature flag definitions with key, type (boolean/string/number), default value, and active status. |
| `flagRules` | Targeting rules for flags. Each rule specifies a target type (tenant/organization/user/role), target ID, override value, and priority. Higher priority rules win. |
| `brandConfigs` | Per-tenant brand settings: primary/secondary/accent colors, font family, border radius, dark mode, custom CSS. |
| `brandAssets` | Uploaded brand assets (logo, favicon, background, header_image) with storage IDs and alt text. |
| `themeOverrides` | Per-component CSS property overrides (componentKey + property + value). |

**Queries:**

| Function | Description |
|----------|-------------|
| `listFlags` | List all flag definitions for a tenant |
| `getFlag` | Get a flag definition by key |
| `evaluateFlag` | Evaluate a flag's value considering targeting rules |
| `evaluateAllFlags` | Evaluate all flags for a tenant at once |
| `getBranding` | Get brand configuration |
| `listBrandAssets` | List uploaded brand assets |
| `listThemeOverrides` | List theme overrides |
| `getThemeCSS` | Generate CSS from theme overrides |

**Mutations:**

| Function | Description |
|----------|-------------|
| `createFlag` | Create a flag definition |
| `updateFlag` | Update a flag |
| `deleteFlag` | Delete a flag and its rules |
| `createFlagRule` | Create a targeting rule |
| `deleteFlagRule` | Delete a targeting rule |
| `updateBranding` | Update brand configuration |
| `uploadBrandAsset` | Upload a brand asset |
| `removeBrandAsset` | Remove a brand asset |
| `setThemeOverride` | Set a component theme override |
| `removeThemeOverride` | Remove a theme override |

**Contract:** `v1.0.0`, category `infrastructure`
**Dependencies:** Core tables: tenants

---

### 10. resources

**Purpose:** Central resource entity -- the primary bookable/sellable item.

**Tables:**

| Table | Description |
|-------|-------------|
| `resources` | Resources with name, slug, category, time mode (PERIOD/SLOT/DAY/WEEK), features array, publishing status lifecycle (draft/published/archived), capacity, images, pricing config, opening hours, and booking duration constraints. |

**Queries:**

| Function | Description |
|----------|-------------|
| `list` | List resources for a tenant |
| `listAll` | List all resources (including drafts) |
| `listPublic` | List published resources (no tenant filter) |
| `get` | Get a resource by ID |
| `getBySlug` | Look up by tenant + slug |
| `getBySlugPublic` | Public slug lookup |

**Mutations:**

| Function | Description |
|----------|-------------|
| `create` | Create a resource |
| `update` | Update a resource |
| `remove` | Delete a resource |
| `publish` | Set status to published |
| `unpublish` | Revert to draft |
| `archive` | Set status to archived |
| `restore` | Restore from archived |
| `cloneResource` | Duplicate a resource |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants

---

### 11. bookings

**Purpose:** Booking lifecycle, time blocks, allocations, conflict detection, and rental agreements.

**Tables:**

| Table | Description |
|-------|-------------|
| `bookings` | Core booking records with status lifecycle (pending/confirmed/cancelled/completed/rejected), time range, pricing, approval workflow, and optimistic concurrency (version). |
| `blocks` | Time blocks marking resource unavailability, supporting recurring rules and visibility levels. |
| `allocations` | Pre-scheduled time allocations (e.g., from seasonal leases), optionally linked to bookings. |
| `bookingConflicts` | Detected booking conflicts with severity levels and resolution tracking. |
| `rentalAgreements` | Digital rental agreements with signature data, version tracking, and IP/UA audit fields. |

**Queries:**

| Function | Description |
|----------|-------------|
| `list` | List bookings for a tenant |
| `get` | Get a booking by ID |
| `calendar` | Get calendar view data |
| `getResourceAvailability` | Check availability for a resource in a date range |
| `validateBookingSlot` | Validate a proposed booking time slot |
| `listBlocks` | List blocks for a tenant |
| `getBlock` | Get a block by ID |
| `checkAvailability` | Check resource availability |
| `getAvailableSlots` | Get available time slots |
| `listAllocations` | List allocations |
| `getAllocation` | Get an allocation |

**Mutations:**

| Function | Description |
|----------|-------------|
| `create` | Create a booking |
| `update` | Update a booking |
| `approve` | Approve a pending booking |
| `reject` | Reject a pending booking |
| `cancel` | Cancel a booking |
| `createBlock` | Create a time block |
| `updateBlock` | Update a block |
| `removeBlock` | Delete a block |
| `createAllocation` | Create an allocation |
| `removeAllocation` | Delete an allocation |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, users, resources

---

### 12. pricing

**Purpose:** Comprehensive pricing engine with groups, per-resource pricing, holidays, weekday surcharges, discount codes, and price calculations.

**Tables:**

| Table | Description |
|-------|-------------|
| `pricingGroups` | Named pricing tiers with discount percentages/amounts, validity periods, and priority ordering. |
| `resourcePricing` | Per-resource pricing configuration: base price, per-unit rates, duration/people/age constraints, fees, tax, surcharge multipliers, and feature toggles. |
| `holidays` | Holiday surcharge definitions (percent, fixed, multiplier) that can apply to specific resources or categories. |
| `weekdayPricing` | Day-of-week surcharges with optional time ranges (e.g., weekend evenings). |
| `discountCodes` | Discount codes with type (percent, fixed, free_hours), usage limits, validity periods, and scope restrictions. |
| `discountCodeUsage` | Usage tracking per discount code per user per booking. |
| `orgPricingGroups` | Organization-to-pricing-group assignments with custom discounts. |
| `userPricingGroups` | User-to-pricing-group assignments. |
| `additionalServices` | Per-resource additional services with pricing. |

**Queries:**

| Function | Description |
|----------|-------------|
| `listGroups` | List pricing groups |
| `getGroup` | Get a pricing group |
| `listForResource` | List pricing for a resource |
| `get` | Get a resource pricing config |
| `listByTenant` | List all pricing configs |
| `getResourcePricingConfig` | Get full pricing config for a resource |
| `calculatePrice` | Calculate price for a time range |
| `calculatePriceWithBreakdown` | Calculate with line-item breakdown |
| `listHolidays` | List holidays |
| `listDiscountCodes` | List discount codes |
| `validateDiscountCode` | Validate a discount code |
| `listWeekdayPricing` | List weekday pricing rules |
| `listAdditionalServices` | List additional services |

**Mutations:**

| Function | Description |
|----------|-------------|
| `createGroup` | Create a pricing group |
| `updateGroup` | Update a group |
| `removeGroup` | Delete a group |
| `create` | Create resource pricing |
| `update` | Update resource pricing |
| `remove` | Delete resource pricing |
| `createHoliday` | Create a holiday |
| `updateHoliday` | Update a holiday |
| `deleteHoliday` | Delete a holiday |
| `createDiscountCode` | Create a discount code |
| `applyDiscountCode` | Apply and consume a discount code |
| `createWeekdayPricing` | Create weekday pricing |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, resources

---

### 13. addons

**Purpose:** Add-on services that can be associated with resources and booked alongside bookings.

**Tables:**

| Table | Description |
|-------|-------------|
| `addons` | Add-on service definitions with pricing (fixed, per_hour, per_person, per_unit), approval settings, and lead time requirements. |
| `bookingAddons` | Booking-addon associations with quantity, pricing, status (pending/confirmed/cancelled/approved/rejected), and notes. |
| `resourceAddons` | Resource-addon associations specifying which addons are available, required, or recommended for each resource, with optional custom pricing. |

**Queries:**

| Function | Description |
|----------|-------------|
| `list` | List addons for a tenant |
| `get` | Get an addon by ID |
| `listForResource` | List addons available for a resource |
| `listForBooking` | List addons attached to a booking |

**Mutations:**

| Function | Description |
|----------|-------------|
| `create` | Create an addon |
| `update` | Update an addon |
| `remove` | Delete an addon |
| `addToResource` | Associate addon with a resource |
| `removeFromResource` | Remove resource association |
| `addToBooking` | Add addon to a booking |
| `removeFromBooking` | Remove from a booking |
| `approve` | Approve a booking addon |
| `reject` | Reject a booking addon |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, resources. Components: bookings

---

### 14. seasons

**Purpose:** Seasonal leasing -- season definitions, application lifecycle, lease management, and priority-based allocation.

**Tables:**

| Table | Description |
|-------|-------------|
| `seasons` | Season definitions with date ranges, application windows, status lifecycle (draft/open/closed/archived), type classification, and settings. |
| `seasonApplications` | Applications to seasons with priority scoring, weekday/time preferences, review workflow (draft/submitted/approved/rejected/waitlisted/withdrawn), and applicant contact info. |
| `seasonalLeases` | Active leases with resource, organization, date range, weekday array, time range, pricing, and status. |
| `priorityRules` | Configurable priority rules for allocation sorting, optionally scoped to a specific season. |

**Queries:**

| Function | Description |
|----------|-------------|
| `list` | List seasons for a tenant |
| `get` | Get a season by ID |
| `listApplications` | List applications for a season |
| `listAllocations` | List allocations for a season |
| `listLeases` | List leases for a tenant |

**Mutations:**

| Function | Description |
|----------|-------------|
| `create` | Create a season |
| `update` | Update a season |
| `remove` | Delete a season |
| `publish` | Open a season for applications |
| `close` | Close a season |
| `submitApplication` | Submit an application |
| `reviewApplication` | Review (approve/reject/waitlist) an application |
| `createAllocation` | Create a seasonal allocation |
| `updateAllocation` | Update an allocation |
| `removeAllocation` | Remove an allocation |
| `createLease` | Create a seasonal lease |
| `cancelLease` | Cancel a lease |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, users, resources

---

### 15. auth

**Purpose:** Authentication -- sessions, OAuth state management, magic links, and demo tokens.

**Tables:**

| Table | Description |
|-------|-------------|
| `sessions` | Active sessions with token, provider, expiration, and last activity tracking. |
| `oauthStates` | CSRF state tokens for OAuth flows with provider, app origin, return path, and Signicat session ID. |
| `magicLinks` | Magic link tokens with email, app context, expiration, and consumption tracking. |
| `authDemoTokens` | Demo tokens for development/testing with key-based lookup and user/tenant binding. |

**Queries:**

| Function | Description |
|----------|-------------|
| `validateSession` | Validate a session token and return session data |
| `getSessionByToken` | Get session details by token |
| `validateDemoToken` | Validate a demo token |

**Mutations:**

| Function | Description |
|----------|-------------|
| `createSession` | Create a new session |
| `invalidateSession` | Invalidate (logout) a session |
| `createOAuthState` | Create an OAuth state token |
| `consumeOAuthState` | Consume and validate an OAuth state |
| `createMagicLink` | Generate a magic link |
| `consumeMagicLink` | Consume a magic link token |
| `createDemoToken` | Create a demo token |
| `cleanupExpired` | Remove expired sessions, states, and links |

**Contract:** `v1.0.0`, category `platform`
**Dependencies:** Core tables: tenants, users

---

### 16. rbac

**Purpose:** Role-based access control with role definitions and user-role bindings.

**Tables:**

| Table | Description |
|-------|-------------|
| `roles` | Role definitions with name, description, permissions array, and system/default flags. System roles cannot be deleted. |
| `userRoles` | User-to-role bindings scoped to a tenant with assignment timestamp. |

**Queries:**

| Function | Description |
|----------|-------------|
| `listRoles` | List roles for a tenant |
| `getRole` | Get a role by ID |
| `listUserRoles` | List roles assigned to a user |
| `checkPermission` | Check if a user has a specific permission |
| `getUserPermissions` | Get all permissions for a user (union of all role permissions) |

**Mutations:**

| Function | Description |
|----------|-------------|
| `createRole` | Create a role |
| `updateRole` | Update role name, description, or permissions |
| `deleteRole` | Delete a non-system role |
| `assignRole` | Assign a role to a user |
| `revokeRole` | Revoke a role from a user |

**Contract:** `v1.0.0`, category `platform`
**Dependencies:** Core tables: tenants, users

---

### 17. billing

**Purpose:** Payment processing and invoice management with line items.

**Tables:**

| Table | Description |
|-------|-------------|
| `payments` | Payment records with provider (Vipps, Stripe), reference, external ID, amount in minor units, status lifecycle, capture/refund tracking. |
| `invoices` | Full invoices with line items, customer info (denormalized for display), billing address, status (draft/sent/paid/overdue/credited/cancelled), PDF storage, and audit timestamps. |

**Queries:**

| Function | Description |
|----------|-------------|
| `getSummary` | Get billing summary for a user (totals, period breakdown) |
| `listInvoices` | List invoices with optional status filter |
| `getInvoice` | Get an invoice by ID |
| `getPayment` | Get a payment by ID |
| `listPayments` | List payments for a tenant |
| `pendingCount` | Count pending invoices |
| `listUserInvoices` | List invoices for a user with pagination |
| `listOrgInvoices` | List invoices for an organization |
| `getOrgBillingSummary` | Get billing summary for an organization |
| `getInvoiceDownloadUrl` | Get PDF download URL |

**Mutations:**

| Function | Description |
|----------|-------------|
| `createPayment` | Initiate a payment |
| `updatePaymentStatus` | Update payment status (capture, refund) |
| `createInvoice` | Create an invoice with line items |
| `updateInvoiceStatus` | Update invoice status |
| `sendInvoice` | Send invoice to customer |
| `markInvoicePaid` | Mark invoice as paid |
| `creditInvoice` | Issue a credit note |
| `storeInvoicePdf` | Store generated PDF |

**Contract:** `v1.0.0`, category `domain`
**Dependencies:** Core tables: tenants, users. Components: bookings

---

### 18. integrations

**Purpose:** External service integration management with webhook registration and sync logging.

**Tables:**

| Table | Description |
|-------|-------------|
| `integrationConfigs` | Integration configurations per tenant with type (stripe, vipps, google_calendar, outlook_calendar, erp, sms, email, webhook, altinn), credentials (masked), environment, and sync status. |
| `webhookRegistrations` | Registered webhook endpoints with event subscriptions, callback URLs, secrets, and failure tracking. |
| `syncLogs` | Sync operation logs with type (full/incremental/manual), status, record counts, errors, and timing. |

**Queries:**

| Function | Description |
|----------|-------------|
| `getConfig` | Get integration config by tenant + provider |
| `listConfigs` | List all integrations for a tenant |
| `listWebhooks` | List webhook registrations |
| `listSyncLogs` | List sync operation logs |
| `getSyncLog` | Get a sync log by ID |

**Mutations:**

| Function | Description |
|----------|-------------|
| `configure` | Create an integration config |
| `updateConfig` | Update config |
| `disableIntegration` | Disable an integration |
| `enableIntegration` | Enable an integration |
| `removeIntegration` | Delete an integration |
| `testConnection` | Test integration connectivity |
| `registerWebhook` | Register a webhook endpoint |
| `updateWebhook` | Update webhook config |
| `deleteWebhook` | Delete a webhook |
| `startSync` | Start a sync operation |
| `completeSyncLog` | Complete/update a sync log |

**Contract:** `v1.0.0`, category `infrastructure`
**Dependencies:** Core tables: tenants

---

## How to Add a New Component

Follow these steps to add a new Convex component:

### Step 1: Create the Feature Module

Create the feature directory at `packages/shared/src/features/{name}/`:

```
features/{name}/
  index.ts              # Barrel export
  types.ts              # Domain types
  convex/
    convex.config.ts    # Component registration
    schema.ts           # Table definitions
    queries.ts          # Read operations
    mutations.ts        # Write operations
    contract.ts         # API contract
    {name}.ts           # Facade functions (app-level)
    index.ts            # Convex barrel export
  hooks/
    index.ts            # Hook barrel export
    use-{name}.ts       # Primary React hook
  adapters/             # Data transformations
  presenters/           # Display logic
  utils/                # Domain utilities
```

### Step 2: Define the Component

In `features/{name}/convex/convex.config.ts`:

```typescript
import { defineComponent } from "convex/server";

const component = defineComponent("{name}");

export default component;
```

### Step 3: Define the Schema

In `features/{name}/convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    myTable: defineTable({
        tenantId: v.string(),    // MUST be v.string() for all external refs
        // ... domain fields
        metadata: v.optional(v.any()),
    })
        .index("by_tenant", ["tenantId"]),
});
```

**Critical rule:** All external references (tenantId, userId, resourceId, organizationId) must use `v.string()`, never `v.id("tableName")`. Only references to tables within the same component may use `v.id()`.

### Step 4: Define the Contract

In `features/{name}/convex/contract.ts`:

```typescript
import { v } from "convex/values";
import { defineContract } from "../../_shared/lib/componentContract";

export const CONTRACT = defineContract({
    name: "{name}",
    version: "1.0.0",
    category: "domain",  // "domain" | "infrastructure" | "platform"
    description: "Description of this component",

    queries: {
        list: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
    },

    mutations: {
        create: {
            args: { tenantId: v.string() },
            returns: v.object({ id: v.string() }),
        },
    },

    emits: [
        "{name}.{entity}.created",  // Topic format: {component}.{entity}.{action}
    ],

    subscribes: [
        "resources.resource.deleted",
    ],

    dependencies: {
        core: ["tenants"],       // Core tables referenced
        components: [],          // Other components this depends on
    },
});
```

### Step 5: Implement Queries and Mutations

In `features/{name}/convex/queries.ts`:

```typescript
import { query } from "./_generated/server";  // Component's own server
import { v } from "convex/values";

export const list = query({
    args: { tenantId: v.string() },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        return ctx.db.query("myTable")
            .withIndex("by_tenant", q => q.eq("tenantId", args.tenantId))
            .collect();
    },
});
```

### Step 6: Create the Facade

In `features/{name}/convex/{name}.ts`:

```typescript
import { query, mutation } from "../../../../../../convex/_generated/server";  // App server
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

export const list = query({
    args: { tenantId: v.id("tenants") },  // Typed IDs at facade level
    handler: async (ctx, { tenantId }) => {
        return ctx.runQuery(components.{name}.queries.list, {
            tenantId: tenantId as string,  // Convert to string for component
        });
    },
});
```

### Step 7: Create Re-export Wrappers

In `convex/components/{name}/`:

```typescript
// convex/components/{name}/convex.config.ts (this is a real file, NOT a re-export)
import { defineComponent } from "convex/server";
const component = defineComponent("{name}");
export default component;

// convex/components/{name}/queries.ts (re-export)
export * from '../../../packages/shared/src/features/{name}/convex/queries';

// convex/components/{name}/mutations.ts (re-export)
export * from '../../../packages/shared/src/features/{name}/convex/mutations';

// convex/components/{name}/schema.ts (re-export)
export * from '../../../packages/shared/src/features/{name}/convex/schema';
```

Create a facade re-export in `convex/domain/{name}.ts`:

```typescript
export * from '../../packages/shared/src/features/{name}/convex/{name}';
```

### Step 8: Register in convex.config.ts

Add to `convex/convex.config.ts`:

```typescript
import {name} from "./components/{name}/convex.config";
app.use({name});
```

### Step 9: Create SDK Hook

In `packages/sdk/src/hooks/use-{name}.ts`:

```typescript
export * from '../../../shared/src/features/{name}/hooks';
```

### Step 10: Add to Seed Script

Add component seed data in `convex/seedComponents.ts`.

### Step 11: Generate and Test

```bash
npx convex dev             # Generate _generated/ for the new component
pnpm test:convex           # Run backend tests
pnpm sdk:test              # Run SDK tests
```

---

## Component Contract Pattern

Every component declares its public API shape through a contract (`contract.ts`). The contract serves three purposes:

1. **Documentation** -- Declares what queries, mutations, and events a component provides
2. **Plug-and-play** -- Two components implementing the same contract are interchangeable
3. **Validation** -- `defineContract()` validates the contract at definition time (name, version format, event topic format)

### Contract Structure

```typescript
interface ComponentContract {
    name: string;           // Unique identifier (e.g., "reviews")
    version: string;        // Semantic version (e.g., "1.0.0")
    category: "domain" | "infrastructure" | "platform";
    description?: string;

    queries: Record<string, ContractFunction>;
    mutations: Record<string, ContractFunction>;
    actions?: Record<string, ContractFunction>;

    emits: string[];        // Event topics this component produces
    subscribes: string[];   // Event topics this component consumes

    dependencies: {
        core: string[];     // Core tables referenced (by string ID)
        components: string[]; // Other components required
    };
}
```

### Event Topic Format

All event topics must follow the pattern `{component}.{entity}.{action}`:

- `reviews.review.created`
- `bookings.booking.approved`
- `billing.invoice.paid`

The `defineContract()` function enforces this format at definition time.

### Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `domain` | Business logic components | bookings, resources, reviews, pricing, addons, seasons, messaging, catalog, billing |
| `infrastructure` | Platform services | audit, notifications, analytics, compliance, tenant-config, integrations |
| `platform` | Identity and access | auth, rbac, user-prefs |

---

## Component Isolation Rules

1. **No direct table access.** Components cannot query other components' tables. All cross-component data access goes through the facade layer.

2. **String IDs only.** Component tables must use `v.string()` for any reference to a table outside the component. Only intra-component references may use `v.id("tableName")`.

3. **Event bus for communication.** Components communicate through the outbox pattern (`outboxEvents` table), never through direct function calls between components.

4. **Facade enrichment.** When a query needs data from multiple components (e.g., a booking with user name and resource name), the facade function in `features/{domain}/convex/{domain}.ts` fetches from each component and enriches the result.

5. **Audit through the audit component.** All mutations should create audit entries by calling `components.audit.functions.create` from the facade layer.

6. **Import paths.** Component functions import from `./_generated/server` (local). Facade functions import from `../../../../../../convex/_generated/server` (app-level, 6 directories up).

7. **Rate limiting in facades.** Rate limits are enforced at the facade layer using `withRateLimit()` from `_shared/lib/componentMiddleware`, not inside component functions.

8. **Module gating in facades.** Component enablement checks (`hasModuleEnabled()`) happen at the facade level before delegating to component functions.
