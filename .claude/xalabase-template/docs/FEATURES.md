# Feature Module Reference

All domain logic lives in `packages/shared/src/features/`. Each module is a self-contained vertical slice with its own types, Convex backend functions, React hooks, adapters, presenters, and utilities.

---

## Module Structure

Every feature module follows the same directory layout:

```
features/{domain}/
  index.ts              Barrel export
  types.ts              Domain-specific TypeScript types
  constants.ts          Domain constants (optional, e.g. seasons)
  convex/               Backend functions
    convex.config.ts    Component registration (defineComponent)
    schema.ts           Table definitions (defineSchema)
    queries.ts          Read operations (component-level)
    mutations.ts        Write operations (component-level)
    contract.ts         API contract (defineContract)
    {domain}.ts         Facade function(s) (app-level, delegates to component)
    _generated/         Convex auto-generated code
  hooks/                React hooks
    index.ts            Hook barrel export
    use-{domain}.ts     Primary hook
  adapters/             Data transformation between layers
  presenters/           Presentation/display logic
  utils/                Domain-specific utilities
  __tests__/            Unit tests
```

Modules that do not own a Convex component (listings, calendar, organizations, dashboard) omit `convex.config.ts`, `_generated/`, and `contract.ts`, and work directly against core tables or delegate to other components.

---

## 1. `_shared` -- Cross-Cutting Infrastructure

**Category:** Infrastructure (always loaded)
**Convex Component:** None (app-level)
**Description:** Provides the foundational libraries, hooks, and Convex utilities that all other features depend on. This is not a domain module but a shared infrastructure layer.

### Library (`lib/`)

| File | Purpose |
|------|---------|
| `auth.ts` | `requireActiveUser()` validates a userId against the core users table. Deprecated `requireAuth()` wrapper around Convex built-in auth. |
| `eventBus.ts` | Outbox pattern implementation. `emit()` inserts into `outboxEvents`, `processEvents()` dispatches to subscribers, `emitEvent()` helper for facades. |
| `functions.ts` | Tenant-aware custom function builders (`tenantQuery`, `tenantMutation`, `publicQuery`, `publicMutation`) using convex-helpers. |
| `rateLimits.ts` | Rate limit definitions (token bucket and fixed window) for bookings, reviews, messaging, auth, admin, search. Key builders: `rateLimitKeys.tenant()`, `.user()`, `.tenantUser()`, `.ip()`. |
| `rls.ts` | Row-level security rules for core tables (tenants, users, organizations, tenantUsers, custodyGrants, custodySubgrants). Default policy: deny. |
| `triggers.ts` | Database trigger registry using convex-helpers `Triggers`. Provides trigger-wrapped `mutation` and `internalMutation` builders. |
| `componentMiddleware.ts` | `hasModuleEnabled()` checks componentRegistry for module gating. `hasFeatureFlag()` evaluates flags via tenant-config component. `withRateLimit()` enforces rate limits in facades. |
| `componentContract.ts` | `defineContract()` factory for declaring component API shapes. Validates name, semver version, category, and event topic format (`{component}.{entity}.{action}`). |
| `crud.ts` | Auto-generated CRUD operations for core tables (tenants, users, organizations) using convex-helpers `crud()`. |
| `batchGet.ts` | `batchGet()` fetches documents by ID array, returns a `Map` for O(1) lookup. Avoids N+1 query patterns. |
| `validators.ts` | Branded string type validators (`TenantId`, `ResourceId`, `BookingId`, `UserId`, `OrganizationId`) and status validators (`resourceStatusValidator`, `bookingStatusValidator`). |
| `index.ts` | Barrel export for all library modules. |

### Hooks (`hooks/`)

| File | Purpose |
|------|---------|
| `convex-utils.ts` | Cached Convex query hooks from convex-helpers. |
| `convex-api.ts` | Generated API references and typed IDs used by all feature hooks. |
| `transforms/common.ts` | Pagination helpers and response wrapper utilities. |
| `index.ts` | Barrel export. |

### Convex Functions (`convex/`)

| File | Purpose |
|------|---------|
| `types.ts` | Status enums (`TenantStatus`, `UserStatus`, `BookingStatus`, etc.), document interfaces (`TenantDoc`, `UserDoc`, `ResourceDoc`, `BookingDoc`), auth types, RBAC permission strings. |
| `storage.ts` | File storage API: `generateUploadUrl`, `storeFile`, `getFileUrl`, `deleteFile`, `seedImagesFromUrls`. |
| `modules.ts` | Legacy module catalog and management functions (deprecated; replaced by `componentRegistry` table). |
| `ops.ts` | System health check (`health`), tenant/system metrics (`metrics`), legacy feature flag read/write (`getFlags`, `setFlag`). |
| `cleanup.ts` | Data consolidation utilities. |
| `index.ts` | Barrel export. |

### Standalone Hooks

| File | Purpose |
|------|---------|
| `use-help.ts` | FAQ and guide content hook. |
| `use-accessibility-monitoring.ts` | Accessibility metrics collection hook. |

### Event Bus Topics

Emits: None (infrastructure layer)
Subscribes: None (infrastructure layer)

---

## 2. `auth` -- Authentication

**Category:** Platform (Phase 4a)
**Convex Component:** `auth`
**Description:** Session management, OAuth flows (BankID, Vipps, Google, Azure), magic link authentication, password-based auth, and demo token support.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `authSessions.ts` | Session validation and management via auth component |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `sessions.ts` | Session CRUD operations |
| `oauthStates.ts` | OAuth state management |
| `magicLink.ts` | Magic link creation and consumption |
| `demoToken.ts` | Demo token generation |
| `password.ts` | Password-based authentication |
| `callback.ts` | OAuth callback handling |
| `claims.ts` | Token claims processing |
| `link.ts` | Account linking |
| `start.ts` | Auth flow initiation |
| `seedTestUsers.ts` | Test user seeding |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-auth` | Session state, login/logout, user context |
| `use-magic-link` | Magic link request and verification |
| `use-oauth-callback` | OAuth redirect handling |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `sessions` | userId, token, appId, provider, expiresAt, lastActiveAt, isActive | by_token, by_user |
| `oauthStates` | state, provider, appOrigin, returnPath, appId, signicatSessionId, createdAt, expiresAt, consumed | by_state |
| `magicLinks` | email, token, appOrigin, returnPath, appId, createdAt, expiresAt, consumed, consumedAt | by_token, by_email |
| `authDemoTokens` | key, tenantId, organizationId, userId, tokenHash, isActive, expiresAt | by_key, by_user |

### Event Bus Topics

**Emits:** `auth.session.created`, `auth.session.invalidated`, `auth.magic-link.created`, `auth.demo-token.created`
**Subscribes:** None

---

## 3. `bookings` -- Booking Management

**Category:** Domain (Phase 3a)
**Convex Component:** `bookings`
**Description:** Core booking lifecycle (create, approve, reject, cancel), time blocks for resource unavailability, allocation scheduling, conflict detection, and rental agreements.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `bookings.ts` | Booking CRUD, delegates to bookings component, enriches with user/resource names |
| `allocations.ts` | Allocation management |
| `bookingAddons.ts` | Booking addon associations |
| `blocks.ts` | Time block management |
| `domain-allocations.ts` | Domain-level allocation logic |
| `availability.ts` | Availability checking and slot validation |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-bookings` | Booking list, create, update, approve, reject, cancel |
| `use-booking-availability` | Check resource availability, get available slots |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `bookings` | tenantId, resourceId, userId, organizationId, status, startTime, endTime, totalPrice, currency, notes, metadata, version, submittedAt, approvedBy, approvedAt, rejectionReason | by_tenant, by_resource, by_user, by_status, by_organization, by_time_range |
| `blocks` | tenantId, resourceId, title, reason, startDate, endDate, allDay, recurring, recurrenceRule, visibility, status, createdBy | by_tenant, by_resource, by_time_range |
| `allocations` | tenantId, organizationId, resourceId, title, startTime, endTime, status, bookingId, userId, notes, recurring, metadata | by_tenant, by_resource, by_time |
| `bookingConflicts` | tenantId, resourceId, bookingId, conflictingBookingId, conflictType, severity, description, overlapStart, overlapEnd, resolvedAt, resolvedBy, resolution, resolutionNotes, metadata | by_tenant, by_resource, by_booking |
| `rentalAgreements` | tenantId, bookingId, resourceId, userId, agreementType, agreementVersion, agreementText, isSigned, signatureData, ipAddress, userAgent, metadata, signedAt | by_booking, by_user |

### Event Bus Topics

**Emits:** `bookings.booking.created`, `bookings.booking.updated`, `bookings.booking.approved`, `bookings.booking.rejected`, `bookings.booking.cancelled`, `bookings.block.created`, `bookings.block.removed`
**Subscribes:** `resources.resource.deleted`, `seasons.allocation.created`

---

## 4. `billing` -- Payments and Invoicing

**Category:** Domain (Phase 4c)
**Convex Component:** `billing`
**Description:** Payment processing (Vipps, Stripe), invoice generation with line items, billing summaries, and payment lifecycle management.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `billing.ts` | Payment and invoice operations, delegates to billing component |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `vipps.ts` | Vipps payment integration |
| `webhooks.ts` | Payment webhook handlers |
| `import.ts` | Billing data import utilities |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-billing` | Payment summaries, invoice listing, payment status |
| `use-economy` | Financial overview, revenue tracking |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `payments` | tenantId, bookingId, userId, provider, reference, externalId, amount, currency, description, status, redirectUrl, capturedAmount, refundedAmount, metadata, createdAt, updatedAt | by_tenant, by_booking, by_reference, by_status |
| `invoices` | tenantId, userId, organizationId, invoiceNumber, reference, status, issueDate, dueDate, paidDate, subtotal, taxAmount, totalAmount, currency, lineItems[], bookingIds, paymentId, paymentMethod, customerName, customerEmail, customerAddress, customerOrgNumber, billingAddress, notes, internalNotes, createdAt, updatedAt, createdBy, pdfStorageId, metadata | by_tenant, by_user, by_organization, by_status, by_invoice_number, by_due_date |

### Event Bus Topics

**Emits:** `billing.payment.created`, `billing.payment.completed`, `billing.payment.failed`, `billing.invoice.created`, `billing.invoice.sent`, `billing.invoice.paid`, `billing.invoice.credited`
**Subscribes:** `bookings.booking.approved`, `bookings.booking.cancelled`

---

## 5. `catalog` -- Categories and Amenities

**Category:** Domain (Phase 2b)
**Convex Component:** `catalog`
**Description:** Hierarchical category trees, amenity groups, individual amenities, and resource-amenity associations.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `categories.ts` | Category CRUD and tree building |
| `admin-categories.ts` | Admin-level category management |
| `admin-amenities.ts` | Admin-level amenity management |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `import.ts` | Category/amenity data import |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-categories` | Category listing, tree navigation, amenity lookups |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `categories` | tenantId, parentId, key, name, slug, description, icon, color, sortOrder, settings, isActive | by_tenant, by_parent, by_slug, by_key, by_tenant_active |
| `amenityGroups` | tenantId, name, slug, description, icon, displayOrder, isActive, metadata | by_tenant, by_slug |
| `amenities` | tenantId, groupId, name, slug, description, icon, displayOrder, isHighlighted, isActive, metadata | by_tenant, by_group, by_slug |
| `resourceAmenities` | tenantId, resourceId, amenityId, quantity, notes, isIncluded, additionalCost, metadata | by_tenant, by_resource, by_amenity |

### Event Bus Topics

**Emits:** `catalog.category.created`, `catalog.category.updated`, `catalog.category.deleted`, `catalog.amenity.created`, `catalog.amenity.updated`, `catalog.amenity.deleted`
**Subscribes:** `resources.resource.deleted`

---

## 6. `listings` -- Search and Discovery

**Category:** Core Domain
**Convex Component:** None (composite -- uses `resources` and `catalog` components)
**Description:** Full-text search with fuzzy matching, Norwegian character normalization, typeahead, faceted search, favorite management, and geocoding. Operates across resources from the resources component.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `search.ts` | `globalSearch`, `globalSearchPublic`, `typeahead`, `typeaheadPublic`, `searchSuggestions`, `searchFacets` -- weighted search with Levenshtein distance fuzzy matching |
| `favorites.ts` | Favorite toggling (delegates to user-prefs component) |
| `amenities.ts` | Amenity listing for search filters (delegates to catalog component) |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-listings` | Resource listing with filters |
| `use-search` | Full-text search and typeahead |
| `use-amenities` | Amenity data for filter UIs |
| `use-favorites` | Favorite toggle and listing |
| `use-geocode` | Location-based search |
| `use-dynamic-filter-counts` | Live filter count updates |
| `useListingFilters` | Filter state management |
| `useListingPermissions` | Permission checking for listings |
| `useListingWizard` | Multi-step listing creation |

### Key Tables

None (uses resources, catalog, and user-prefs component tables)

### Event Bus Topics

**Emits:** None
**Subscribes:** None

---

## 7. `calendar` -- Block Scheduling

**Category:** Core Domain
**Convex Component:** None (uses `bookings` component)
**Description:** Calendar UI logic for managing time blocks on resources. Provides drag-and-drop, conflict detection, and real-time calendar state hooks. Backend operations delegate to the bookings component's blocks table.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `blocks.ts` | Block CRUD (delegates to bookings component) |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-blocks` | Block listing and management |
| `useCalendarPermissions` | Calendar operation permission checks |
| `useCalendarState` | Calendar view state (date range, zoom level) |
| `useConflictDetection` | Real-time overlap conflict detection |
| `useDragAndDrop` | Drag-and-drop block rescheduling |
| `useRealtimeCalendar` | Live calendar event subscription |

### Key Tables

None (uses bookings component's `blocks` table)

### Event Bus Topics

**Emits:** None (emitted by bookings component)
**Subscribes:** None

---

## 8. `pricing` -- Pricing Engine

**Category:** Domain (Phase 3b)
**Convex Component:** `pricing`
**Description:** Pricing groups with priority/discount rules, per-resource pricing configuration, holiday surcharges, weekday pricing, discount codes with usage tracking, org/user pricing group assignments, and price calculation with breakdown.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `pricing.ts` | Price calculation, pricing group management, delegates to pricing component |
| `calculations.ts` | Price calculation with breakdown logic |
| `discounts.ts` | Discount code management and validation |
| `holidays.ts` | Holiday surcharge management |
| `surcharges.ts` | General surcharge rules |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `import.ts` | Pricing data import utilities |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-pricing` | Pricing configuration, price calculations, discount code validation |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `pricingGroups` | tenantId, name, description, groupType, discountPercent, discountAmount, applicableBookingModes, validFrom, validUntil, isDefault, priority, isActive, metadata | by_tenant, by_tenant_active |
| `resourcePricing` | tenantId, resourceId, pricingGroupId, priceType, basePrice, currency, pricePerHour/Day/HalfDay/Person/PersonHour, slotOptions, min/maxDuration, min/maxPeople, min/maxAge, slotDurationMinutes, advanceBookingDays, sameDayBookingAllowed, cancellationHours, depositAmount, cleaningFee, serviceFee, taxRate, taxIncluded, weekendMultiplier, peakHoursMultiplier, holidayMultiplier, enableDiscountCodes/Surcharges/PriceGroups, rules, isActive, metadata | by_tenant, by_resource, by_pricing_group |
| `holidays` | tenantId, name, date, isRecurring, surchargeType (percent/fixed/multiplier), surchargeValue, appliesToResources, appliesToCategories, isActive, metadata | by_tenant, by_date, by_tenant_active |
| `weekdayPricing` | tenantId, resourceId, dayOfWeek (0-6), surchargeType, surchargeValue, startTime, endTime, label, isActive, metadata | by_tenant, by_resource, by_tenant_day, by_tenant_active |
| `discountCodes` | tenantId, code, name, description, discountType (percent/fixed/free_hours), discountValue, minBookingAmount, maxDiscountAmount, minDurationMinutes, appliesToResources/Categories/BookingModes, maxUsesTotal/PerUser, currentUses, validFrom, validUntil, restrictToUsers/Orgs/PriceGroups, firstTimeBookersOnly, isActive, metadata | by_tenant, by_code, by_active |
| `discountCodeUsage` | tenantId, discountCodeId, userId, bookingId, discountAmount, usedAt | by_tenant, by_code, by_user, by_booking |
| `orgPricingGroups` | tenantId, organizationId, pricingGroupId, discountPercent, validFrom, validUntil, isActive, metadata | by_tenant, by_organization, by_pricing_group |
| `userPricingGroups` | tenantId, userId, pricingGroupId, validFrom, validUntil, isActive, metadata | by_tenant, by_user, by_pricing_group |
| `additionalServices` | tenantId, resourceId, name, description, price, currency, isRequired, displayOrder, isActive, metadata | by_tenant, by_resource |

### Event Bus Topics

**Emits:** `pricing.pricing.created`, `pricing.pricing.updated`, `pricing.pricing.deleted`, `pricing.discount.applied`, `pricing.holiday.created`
**Subscribes:** `resources.resource.deleted`

---

## 9. `reviews` -- Review Management

**Category:** Domain (Phase 1c)
**Convex Component:** `reviews`
**Description:** User reviews with star ratings, moderation workflow (approve, reject, flag), and aggregate statistics per resource.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `reviews.ts` | Review CRUD with moderation, delegates to reviews component, enriches with user names |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-reviews` | Review listing, creation, moderation, stats |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `reviews` | tenantId, resourceId, userId, rating, title, text, status (pending/approved/rejected/flagged), moderatedBy, moderatedAt, moderationNote, metadata | by_tenant, by_resource, by_user, by_status |

### Event Bus Topics

**Emits:** `reviews.review.created`, `reviews.review.updated`, `reviews.review.deleted`, `reviews.review.moderated`
**Subscribes:** `resources.resource.deleted`

---

## 10. `messaging` -- Conversations

**Category:** Domain (Phase 2a)
**Convex Component:** `messaging`
**Description:** Threaded conversations between users and admins, message read tracking, conversation assignment and resolution, and unread count management.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `messaging.ts` | Conversation and message management, delegates to messaging component |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `import.ts` | Message data import |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-conversations` | Conversation listing, creation, messaging, read status |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `conversations` | tenantId, userId, bookingId, resourceId, participants[], subject, status, unreadCount, lastMessageAt, assigneeId, assignedAt, resolvedAt, resolvedBy, reopenedAt, priority, metadata | by_tenant, by_user, by_booking, by_status, by_assignee |
| `messages` | tenantId, conversationId, senderId, senderType, content, messageType, attachments[], readAt, metadata, sentAt | by_tenant, by_conversation, by_sender |

### Event Bus Topics

**Emits:** `messaging.conversation.created`, `messaging.conversation.resolved`, `messaging.message.sent`
**Subscribes:** `bookings.booking.created`

---

## 11. `notifications` -- In-App Notifications

**Category:** Infrastructure (Phase 1d)
**Convex Component:** `notifications`
**Description:** In-app notification delivery, unread count tracking, bulk mark-as-read, and per-user notification preferences by channel and category.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `notifications.ts` | Notification CRUD, preference management, delegates to notifications component |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-notifications` | Notification listing, unread count, mark read, preferences |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `notifications` | tenantId, userId, type, title, body, link, readAt, metadata | by_tenant, by_user, by_user_unread |
| `notificationPreferences` | tenantId, userId, channel, category, enabled | by_tenant, by_user |

### Event Bus Topics

**Emits:** `notifications.notification.created`, `notifications.notification.read`
**Subscribes:** `bookings.booking.created`, `bookings.booking.approved`, `bookings.booking.rejected`, `messaging.message.sent`

---

## 12. `seasons` -- Seasonal Leasing

**Category:** Domain (Phase 3d)
**Convex Component:** `seasons`
**Description:** Season definitions with application periods, season applications with priority scoring and review workflow, seasonal leases with weekday/time slots, and priority rules for allocation.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `seasons.ts` | Season lifecycle management |
| `seasonApplications.ts` | Application submission and review |
| `seasonalLeases.ts` | Lease creation and management |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `import.ts` | Season data import |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-seasons` | Season listing, creation, publishing, closing |
| `use-season-applications` | Application submission, status tracking |
| `use-seasonal-leases` | Lease management, renewal |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `seasons` | tenantId, name, description, startDate, endDate, applicationStartDate, applicationEndDate, status (draft/open/closed/archived), type (standard/summer/winter/custom), settings, metadata, isActive | by_tenant, by_status, by_dates |
| `seasonApplications` | tenantId, seasonId, userId, organizationId, resourceId, weekday, startTime, endTime, priority, status (draft/submitted/approved/rejected/waitlisted/withdrawn), applicantName, applicantEmail, applicantPhone, applicationData, notes, rejectionReason, reviewedBy, reviewedAt, metadata | by_tenant, by_season, by_user, by_organization, by_status |
| `seasonalLeases` | tenantId, resourceId, organizationId, startDate, endDate, weekdays[], startTime, endTime, status (active/expired/cancelled/pending), totalPrice, currency, notes, metadata | by_tenant, by_resource, by_organization |
| `priorityRules` | tenantId, seasonId, name, description, rules[], priority, isActive | by_tenant, by_season |

### Event Bus Topics

**Emits:** `seasons.season.created`, `seasons.season.published`, `seasons.season.closed`, `seasons.application.submitted`, `seasons.application.reviewed`, `seasons.allocation.created`, `seasons.lease.created`, `seasons.lease.cancelled`
**Subscribes:** `resources.resource.deleted`

---

## 13. `addons` -- Add-On Services

**Category:** Domain (Phase 3c)
**Convex Component:** `addons`
**Description:** Add-on services that can be attached to resources and bookings. Supports approval workflows, per-resource addon configuration, and booking addon lifecycle.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `addons.ts` | Addon CRUD, delegates to addons component |
| `additionalServices.ts` | Additional service management |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `import.ts` | Addon data import |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-addons` | Addon listing, creation, resource association |
| `use-additional-services` | Additional service management |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `addons` | tenantId, name, slug, description, category, priceType (fixed/per_hour/per_person/per_unit), price, currency, maxQuantity, requiresApproval, leadTimeHours, icon, images[], displayOrder, isActive, metadata | by_tenant, by_slug, by_category |
| `bookingAddons` | tenantId, bookingId, addonId, quantity, unitPrice, totalPrice, currency, notes, status (pending/confirmed/cancelled/approved/rejected), metadata | by_tenant, by_booking, by_addon |
| `resourceAddons` | tenantId, resourceId, addonId, isRequired, isRecommended, customPrice, displayOrder, isActive, metadata | by_tenant, by_resource, by_addon |

### Event Bus Topics

**Emits:** `addons.addon.created`, `addons.addon.updated`, `addons.addon.deleted`, `addons.booking-addon.added`, `addons.booking-addon.approved`, `addons.booking-addon.rejected`
**Subscribes:** `resources.resource.deleted`, `bookings.booking.cancelled`

---

## 14. `resources` -- Resource Management

**Category:** Domain (Workstream 1)
**Convex Component:** `resources`
**Description:** Central resource entity used by bookings, pricing, reviews, and all other domains. Supports publishing lifecycle (draft, published, archived), resource cloning, and slug-based lookups.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `resources.ts` | Resource CRUD, publishing lifecycle, delegates to resources component |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-resources` | Resource listing, creation, publishing, archiving |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `resources` | tenantId, organizationId, name, slug, description, categoryKey, subcategoryKeys[], timeMode (PERIOD/SLOT/DAY/WEEK), features[], ruleSetKey, status (draft/published/archived), requiresApproval, capacity, inventoryTotal, images[], pricing, metadata, allowSeasonRental, allowRecurringBooking, openingHours[], slotDurationMinutes, minBookingDuration, maxBookingDuration | by_tenant, by_slug, by_category, by_status |

### Event Bus Topics

**Emits:** `resources.resource.created`, `resources.resource.updated`, `resources.resource.deleted`, `resources.resource.published`, `resources.resource.unpublished`, `resources.resource.archived`
**Subscribes:** None

---

## 15. `integrations` -- External Integrations

**Category:** Infrastructure (Phase 4d)
**Convex Component:** `integrations`
**Description:** Integration configuration management for external services (Stripe, Vipps, Google Calendar, Outlook, ERP, SMS, email, webhooks, Altinn). Tracks sync status and webhook registrations.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `altinn.ts` | Altinn (Norwegian government service) integration |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-integrations` | Integration configuration, status monitoring |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `integrationConfigs` | tenantId, integrationType, name, isEnabled, config, apiKey, secretKey, webhookSecret, environment (production/sandbox), lastSyncAt, lastSyncStatus, metadata, createdAt, updatedAt | by_tenant, by_type, by_enabled |
| `webhookRegistrations` | tenantId, integrationId, events[], callbackUrl, secret, isActive, lastTriggeredAt, failureCount, metadata, createdAt | by_tenant, by_integration, by_active |
| `syncLogs` | tenantId, integrationId, syncType (full/incremental/manual), status (started/completed/failed/partial), recordsProcessed, recordsFailed, error, startedAt, completedAt, metadata | by_tenant, by_integration, by_status |

### Event Bus Topics

**Emits:** `integrations.config.created`, `integrations.config.updated`, `integrations.webhook.registered`, `integrations.sync.started`, `integrations.sync.completed`
**Subscribes:** None

---

## 16. `audit` -- Audit Logging

**Category:** Infrastructure (Phase 1b)
**Convex Component:** `audit`
**Description:** General-purpose polymorphic audit log for all entities across the platform. Records who did what, when, and captures state changes.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `audit.ts` | Audit entry creation and querying, delegates to audit component |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `events.ts` | Audit event processing |
| `lifecycle.ts` | Audit log lifecycle management |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-audit` | Audit log viewing, filtering by entity/user/action |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `auditLog` | tenantId, userId, userEmail, userName, entityType, entityId, action, previousState, newState, changedFields[], details, reason, sourceComponent, ipAddress, userAgent, timestamp, metadata | by_tenant, by_entity, by_tenant_entity, by_user, by_action, by_timestamp |

### Event Bus Topics

**Emits:** `audit.entry.created`
**Subscribes:** None (receives audit entries from all other components via direct facade calls, not event bus)

---

## 17. `organizations` -- Organization Management

**Category:** Core Domain
**Convex Component:** None (uses core `organizations` and `users` tables directly)
**Description:** Organization CRUD within tenants, hierarchical organization structure (parent/child), and user management within organizations.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `organizations.ts` | Organization listing, creation, hierarchy navigation |
| `users-queries.ts` | User queries within organizations |
| `users-mutations.ts` | User management within organizations |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-organizations` | Organization CRUD, member management |

### Key Tables

Uses core tables directly: `organizations`, `users`, `tenantUsers`

### Event Bus Topics

**Emits:** None
**Subscribes:** None

---

## 18. `rbac` -- Role-Based Access Control

**Category:** Platform (Phase 4b)
**Convex Component:** `rbac`
**Description:** Role definitions with permission arrays, user-role bindings, permission checking, and role assignment/revocation.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `rbacFacade.ts` | Role and permission management, delegates to rbac component |

### Additional Convex Files

| File | Purpose |
|------|---------|
| `import.ts` | Role/permission import utilities |

### SDK Hooks

None (RBAC is consumed via `RequirePermission` guard in app-shell, not through SDK hooks directly)

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `roles` | tenantId, name, description, permissions[], isDefault, isSystem | by_tenant, by_name |
| `userRoles` | userId, roleId, tenantId, assignedAt | by_user, by_role, by_tenant_user |

### Event Bus Topics

**Emits:** `rbac.role.created`, `rbac.role.updated`, `rbac.role.deleted`, `rbac.role.assigned`, `rbac.role.revoked`
**Subscribes:** None

---

## 19. `analytics` -- Metrics and Reporting

**Category:** Infrastructure (Phase 2c)
**Convex Component:** `analytics`
**Description:** Booking and availability metrics storage, report scheduling with cron expressions, and generated report management. Dashboard-facing queries that read across core tables stay in the facade layer.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `admin-stats.ts` | Admin statistics aggregation |
| `monitoring.ts` | System monitoring queries |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-reports` | Report schedule management, report viewing |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `bookingMetrics` | tenantId, resourceId, metricType, period, value, count, metadata, periodStart, periodEnd, calculatedAt | by_type, by_resource, by_tenant |
| `availabilityMetrics` | tenantId, resourceId, period, totalSlots, bookedSlots, utilizationRate, popularTimeSlots[], metadata, periodStart, periodEnd, calculatedAt | by_resource, by_utilization, by_tenant |
| `reportSchedules` | tenantId, name, description, reportType, cronExpression, recipients[], filters, format, enabled, lastRunAt, nextRunAt, createdBy, metadata | by_tenant, by_enabled, by_next_run, by_type |
| `scheduledReports` | scheduleId, tenantId, status, startedAt, completedAt, fileUrl, fileSize, error, metadata | by_schedule, by_tenant, by_status |

### Event Bus Topics

**Emits:** `analytics.metrics.stored`, `analytics.report.scheduled`
**Subscribes:** `bookings.booking.created`, `bookings.booking.approved`, `bookings.booking.cancelled`

---

## 20. `tenant-config` -- Feature Flags and Branding

**Category:** Infrastructure (Phase 2e)
**Convex Component:** `tenant-config` (registered as `tenantConfig`)
**Description:** Two responsibilities: (1) fine-grained feature flag management with targeting rules (tenant, org, user, role), and (2) per-tenant branding/white-labeling with theme overrides.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `featureFlags.ts` | Flag evaluation with targeting rules, delegates to tenant-config component |
| `moduleRegistry.ts` | Module enablement queries against componentRegistry table |
| `tenants.ts` | Tenant configuration and settings |

### SDK Hooks

| Hook | Purpose |
|------|---------|
| `use-tenant-id` | Current tenant context |
| `use-feature-flags` | Feature flag evaluation, flag listing |

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `flagDefinitions` | tenantId, key, name, description, type (boolean/string/number), defaultValue, isActive, metadata | by_tenant, by_key |
| `flagRules` | tenantId, flagId, targetType (tenant/organization/user/role), targetId, value, priority | by_tenant, by_flag, by_target |
| `brandConfigs` | tenantId, primaryColor, secondaryColor, accentColor, fontFamily, borderRadius, darkMode, customCSS, metadata | by_tenant |
| `brandAssets` | tenantId, assetType (logo/favicon/background/header_image), storageId, url, alt, metadata | by_tenant, by_type |
| `themeOverrides` | tenantId, componentKey, property, value | by_tenant, by_component |

### Event Bus Topics

**Emits:** `tenant-config.flag.created`, `tenant-config.flag.updated`, `tenant-config.branding.updated`, `tenant-config.theme.updated`
**Subscribes:** None

---

## 21. `user-prefs` -- User Preferences

**Category:** Platform (Phase 1e)
**Convex Component:** `user-prefs` (registered as `userPrefs`)
**Description:** User favorites (bookmarked resources) and saved filter configurations for search.

### Domain Facades

Favorites operations are accessed through the `listings` feature's `favorites.ts` facade, which delegates to the user-prefs component.

### SDK Hooks

None directly (favorites are exposed through `use-favorites` in the listings feature)

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `favorites` | tenantId, userId, resourceId, notes, tags[], metadata | by_tenant, by_user, by_resource, by_user_resource |
| `savedFilters` | tenantId, userId, name, type, filters, isDefault | by_tenant, by_user |

### Event Bus Topics

**Emits:** `user-prefs.favorite.added`, `user-prefs.favorite.removed`, `user-prefs.filter.created`
**Subscribes:** `resources.resource.deleted`

---

## 22. `compliance` -- GDPR Compliance

**Category:** Infrastructure (Phase 2d)
**Convex Component:** `compliance`
**Description:** Consent record management (marketing, analytics, third-party), DSAR (Data Subject Access Request) tracking with lifecycle management, and policy versioning with publish/rollback.

### Domain Facades

None (queries and mutations are accessed directly through the component)

### SDK Hooks

None (compliance is managed through admin interfaces)

### Key Tables

| Table | Fields | Indexes |
|-------|--------|---------|
| `consentRecords` | tenantId, userId, category (marketing/analytics/thirdParty/necessary), isConsented, consentedAt, withdrawnAt, ipAddress, userAgent, version, metadata | by_tenant, by_user, by_user_category |
| `dsarRequests` | tenantId, userId, requestType (access/deletion/rectification/portability/restriction), details, status (submitted/in_progress/completed/rejected), submittedAt, completedAt, processedBy, responseData, metadata | by_tenant, by_user, by_status |
| `policyVersions` | tenantId, policyType (privacy/terms/cookies/data_processing), version, title, content, isPublished, publishedAt, publishedBy, previousVersionId, metadata | by_tenant, by_type, by_published |

### Event Bus Topics

**Emits:** `compliance.consent.updated`, `compliance.dsar.submitted`, `compliance.dsar.completed`, `compliance.policy.published`
**Subscribes:** None

---

## 23. `dashboard` -- Dashboard KPIs

**Category:** Core Domain
**Convex Component:** None (reads from core tables and delegates to bookings, resources, audit components)
**Description:** Aggregated KPIs, detailed statistics with period filtering, and recent activity feeds. Reads across multiple components and core tables to produce dashboard views.

### Domain Facades

| Facade | Purpose |
|--------|---------|
| `dashboard.ts` | `getKPIs` (resource/booking/user/revenue counts), `getStats` (period-filtered breakdowns by status/category/resource), `getActivity` (recent audit entries enriched with user details) |

### SDK Hooks

None (consumed by dashboard app directly)

### Key Tables

None (aggregates data from `tenantUsers` core table and `bookings`, `resources`, `audit` components)

### Event Bus Topics

**Emits:** None
**Subscribes:** None

---

## Domain Mapping Summary

| # | Feature | Component | Category | Facades | SDK Hooks |
|---|---------|-----------|----------|---------|-----------|
| 1 | `_shared` | -- | infrastructure | -- | convex-utils, convex-api, transforms |
| 2 | `auth` | auth | platform | authSessions | use-auth, use-magic-link, use-oauth-callback |
| 3 | `bookings` | bookings | domain | bookings, allocations, bookingAddons, blocks, availability | use-bookings, use-booking-availability |
| 4 | `billing` | billing | domain | billing | use-billing, use-economy |
| 5 | `catalog` | catalog | domain | categories, admin-categories, admin-amenities | use-categories |
| 6 | `listings` | -- | domain | search, favorites, amenities | use-listings, use-search, use-amenities, use-favorites, use-geocode, +4 |
| 7 | `calendar` | -- | domain | blocks | use-blocks, +5 calendar hooks |
| 8 | `pricing` | pricing | domain | pricing, calculations, discounts, holidays, surcharges | use-pricing |
| 9 | `reviews` | reviews | domain | reviews | use-reviews |
| 10 | `messaging` | messaging | domain | messaging | use-conversations |
| 11 | `notifications` | notifications | infrastructure | notifications | use-notifications |
| 12 | `seasons` | seasons | domain | seasons, seasonApplications, seasonalLeases | use-seasons, use-season-applications, use-seasonal-leases |
| 13 | `addons` | addons | domain | addons, additionalServices | use-addons, use-additional-services |
| 14 | `resources` | resources | domain | resources | use-resources |
| 15 | `integrations` | integrations | infrastructure | altinn | use-integrations |
| 16 | `audit` | audit | infrastructure | audit | use-audit |
| 17 | `organizations` | -- | core | organizations, users-queries, users-mutations | use-organizations |
| 18 | `rbac` | rbac | platform | rbacFacade | -- |
| 19 | `analytics` | analytics | infrastructure | admin-stats, monitoring | use-reports |
| 20 | `tenant-config` | tenant-config | infrastructure | featureFlags, moduleRegistry, tenants | use-tenant-id, use-feature-flags |
| 21 | `user-prefs` | user-prefs | platform | (via listings) | -- |
| 22 | `compliance` | compliance | infrastructure | -- | -- |
| 23 | `dashboard` | -- | core | dashboard | -- |
