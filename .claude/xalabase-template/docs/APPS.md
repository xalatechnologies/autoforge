# Application Reference

## Overview

XalaBaaS ships 5 React applications. All apps follow the **thin app pattern**: they compose providers, define routes, and render pages, but contain zero business logic. Domain logic lives exclusively in feature modules (`packages/shared/src/features/`), accessed through SDK hooks.

```
Experience Plane (apps/)
  web          (port 5190)  -- Public booking platform           [digdir]
  backoffice   (port 5175)  -- Admin management + case handling  [digdir]
  minside      (port 5174)  -- User "My Pages" dashboard        [digdir]
  saas-admin   (port 6005)  -- SaaS platform admin              [platform-ui]
  dashboard    (no fixed)   -- Tenant analytics dashboard       [platform-ui]
```

Apps are divided into two families by design system:

- **Digdir apps** (`web`, `backoffice`, `minside`): Use `@xala/ds` (built on `@digdir/designsystemet-react`), `@xala/ds-themes` for theming, and `@xalabaas/i18n` for i18n.
- **Platform apps** (`saas-admin`, `dashboard`): Use `@xala-technologies/platform-ui` and `@xalabaas/app-shell` for the full provider stack.

---

## The Thin App Pattern

Every app follows the same structural contract:

1. **Entry point** (`main.tsx`): Wrap the app in `XalaConvexProvider` (or `XalaProviders`), then render `<App />`.
2. **App component** (`App.tsx`): Compose design system providers, auth, i18n, and a `BrowserRouter`, then define `<Routes>`.
3. **Pages** (`routes/` or `pages/`): Each page is a thin composition of SDK hooks + design system components.

Apps import ONLY from:
- `@xalabaas/sdk` -- Hooks and typed IDs
- `@xalabaas/shared` -- Types, constants, navigation configs
- `@xalabaas/app-shell` -- Providers, guards, layout (platform apps)
- `@xala/ds` or `@xala-technologies/platform-ui` -- UI components
- `@xalabaas/i18n` -- Translation hooks

Apps must NEVER import from:
- `convex/` (direct function references)
- `packages/shared/src/features/` (internal feature modules)
- `packages/sdk/src/` (internal SDK source)

### Provider Composition

The provider hierarchy varies slightly by app family:

**Digdir apps** (manual provider composition):
```
ReactDOM.createRoot(root).render(
  <XalaConvexProvider>        // Convex client
    <I18nProvider>             // i18next
      <DesignsystemetProvider> // Design system theme
        <DialogProvider>       // Modal system
          <BrowserRouter>      // React Router
            <AuthProvider>     // Auth context
              <Routes>
                ...
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </DialogProvider>
      </DesignsystemetProvider>
    </I18nProvider>
  </XalaConvexProvider>
)
```

**Platform apps** (using `XalaProviders` shell):
```
ReactDOM.createRoot(root).render(
  <XalaConvexProvider>        // Convex client
    <XalaProviders appId="saas-admin" defaultLocale="nb">
      // Internally provides: ErrorBoundary > ThemeProvider > LocaleProvider
      //   > DesignsystemetProvider > RuntimeProvider
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </XalaProviders>
  </XalaConvexProvider>
)
```

---

## 1. web (Port 5190)

### Purpose

Public-facing booking platform. End users browse listings, search for resources, make bookings, and manage their accounts. This is the primary consumer-facing application.

### Target Users

General public, citizens, anyone looking to book municipal resources or spaces.

### Design System

`@xala/ds` (Designsystemet) with `digilist` theme. Imports:
- `@xala/ds/styles` -- Base CSS
- `@xala/ds-themes/themes/digilist.css` -- Theme tokens
- `@xala/ds-themes/themes/xala-navy-extensions.css` -- Theme extensions
- `@xala/ds-themes/themes/shared-mobile.css` -- Mobile responsive
- `@xala/ds/global` -- Global font settings

Also configured as a **PWA** (Progressive Web App) via `vite-plugin-pwa` with service worker caching for fonts and API responses.

### Key Routes

| Path | Page | Auth | Description |
|------|------|------|-------------|
| `/` | `ListingsPage` | No | Public listing search with filters |
| `/listing/:id` | `ListingDetailPage` | No | Listing detail with booking |
| `/login` | `LoginPage` | No | Login page (no header) |
| `/auth/callback` | `AuthCallbackPage` | No | OAuth callback handler |
| `/auth/magic-link` | `MagicLinkCallbackPage` | No | Magic link callback |
| `/payment/callback` | `PaymentCallbackPage` | No | Payment return URL |
| `/min-side` | `MinsideDashboardPage` | Yes | User dashboard |
| `/min-side/bookings` | `BookingsPage` | Yes | User's bookings |
| `/min-side/billing` | `BillingPage` | Yes | User's billing |
| `/min-side/calendar` | `CalendarPage` | Yes | User's calendar |
| `/min-side/messages` | `MessagesPage` | Yes | Messages |
| `/min-side/notifications` | `NotificationsPage` | Yes | Notifications |
| `/min-side/reviews` | `ReviewsPage` | Yes | User's reviews |
| `/min-side/settings` | `SettingsPage` | Yes | Account settings |
| `/min-side/org` | `OrgDashboardPage` | Yes | Organization dashboard |
| `/min-side/org/invoices` | `InvoicesPage` | Yes | Organization invoices |

### Architecture Notes

- The `web` app hosts both public pages and authenticated "min-side" (my pages) routes in a single SPA.
- Public pages share a `MainLayout` with the `AppHeader` component featuring real-time search via `usePublicGlobalSearch`.
- Protected routes are wrapped in `AuthProvider` + `AccountContextProvider` + `ProtectedRoute`.
- Theme (light/dark) is managed locally via `useState` + `localStorage` and exposed via outlet context.

### How to Add a New Route

1. Create a page component in `apps/web/src/pages/`.
2. Import it in `App.tsx`.
3. Add a `<Route>` entry inside the appropriate section (public or protected).
4. Use SDK hooks for data, never import from feature modules directly.

---

## 2. backoffice (Port 5175)

### Purpose

Administrative management interface for tenant operators. Supports listing management, booking approval, calendar views, season management, case handling (saksbehandling), reporting, review moderation, organization and user administration, tenant settings, and audit logging.

### Target Users

Tenant administrators, case handlers (saksbehandlere), and system administrators.

### Design System

`@xala/ds` (Designsystemet) with `digilist` theme. Uses the `AppShell` layout component from `@xala/ds` which provides the sidebar + content layout.

### Key Routes

The backoffice has the most routes of any app. Routes are organized by role.

**Core routes (all authenticated users):**

| Path | Page | Description |
|------|------|-------------|
| `/` | `DashboardPage` | Admin dashboard |
| `/listings` | `ListingsPage` | Listing management |
| `/listings/new` | `ListingEditPage` | Create listing |
| `/listings/:slug` | `ListingEditPage` | Edit listing |
| `/listings/:slug/view` | `ListingDetailPage` | Preview listing |
| `/calendar` | `CalendarPage` | Calendar view |
| `/bookings` | `BookingsPage` | Booking management |
| `/seasons` | `SeasonsListPage` | Season list |
| `/seasons/new` | `SeasonFormPage` | Create season |
| `/seasons/:id` | `SeasonDetailPage` | Season detail |
| `/seasons/:id/edit` | `SeasonFormPage` | Edit season |
| `/messages` | `MessagesPage` | Messaging |
| `/reports` | `ReportsPage` | Reports and analytics |

**Case handler routes (`case_handler` role):**

| Path | Page | Description |
|------|------|-------------|
| `/work-queue` | `WorkQueuePage` | Case work queue |
| `/season-applications` | `SeasonApplicationsReviewPage` | Review season applications |
| `/allocation-planner` | `AllocationPlannerPage` | Resource allocation planning |
| `/decision-forms` | `DecisionFormsPage` | Decision documentation |
| `/audit-timeline` | `AuditTimelinePage` | Case audit timeline |

**Admin routes (`admin` role):**

| Path | Page | Description |
|------|------|-------------|
| `/reviews/moderation` | `ReviewModerationPage` | Review moderation |
| `/audit` | `AuditPage` | Audit log |
| `/organizations` | `OrganizationsListPage` | Organization management |
| `/organizations/new` | `OrganizationFormPage` | Create organization |
| `/organizations/:id` | `OrganizationDetailPage` | Organization detail |
| `/organizations/:id/edit` | `OrganizationFormPage` | Edit organization |
| `/users` | `UsersPage` | User management |
| `/settings` | `SettingsPage` | System settings |
| `/listings/wizard` | `ListingWizardPage` | Guided listing creation |
| `/listings/wizard/:id` | `ListingWizardPage` | Edit via wizard |
| `/pricing-rules` | `PricingRulesPage` | Pricing rule management |
| `/users-management` | `UsersManagementPage` | Advanced user management |
| `/admin-reports` | `AdminReportsPage` | Admin-level reports |

**Tenant admin routes:**

| Path | Page | Description |
|------|------|-------------|
| `/tenant/settings` | `TenantSettingsPage` | Tenant configuration |
| `/tenant/branding` | `TenantBrandingPage` | Branding and themes |
| `/tenant/audit-log` | `TenantAuditLogPage` | Tenant audit log |

### Architecture Notes

- Uses `BackofficeRoleProvider` (app-specific) to manage role-based navigation.
- Uses `ThemeProvider` (app-specific) for color scheme management.
- The `AppShell` layout from `@xala/ds` provides sidebar navigation with the `Outlet` pattern.
- Routes are protected via a `ProtectedRoute` wrapper that accepts `requiredRole`.

---

## 3. minside (Port 5174)

### Purpose

User self-service portal ("My Pages" / "Min Side"). Provides personal and organizational dashboards for citizens and organization representatives to manage their bookings, billing, messages, and settings.

### Target Users

Authenticated citizens (personal context) and organization representatives (organization context).

### Design System

`@xala/ds` (Designsystemet) with `digilist` theme. Also configured as a **PWA** with offline caching for bookings data.

### Key Routes

**Personal context routes:**

| Path | Page | Auth | Context |
|------|------|------|---------|
| `/` | `DashboardPage` | Yes | Personal |
| `/bookings` | `BookingsPage` | Yes | Personal |
| `/billing` | `BillingPage` | Yes | Personal |
| `/calendar` | `CalendarPage` | Yes | Personal |
| `/messages` | `MessagesPage` | Yes | Personal |

**Shared routes (any context):**

| Path | Page | Description |
|------|------|-------------|
| `/settings` | `SettingsPage` | Account settings |
| `/preferences` | `UserPreferencesPage` | User preferences |
| `/notifications` | `NotificationsPage` | Notifications |
| `/help` | `HelpPage` | Help and FAQ |

**Organization portal routes:**

| Path | Page | Context |
|------|------|---------|
| `/org` | `OrganizationDashboardPage` | Organization |
| `/org/bookings` | `OrganizationBookingsPage` | Organization |
| `/org/invoices` | `OrganizationInvoicesPage` | Organization |
| `/org/members` | `OrganizationMembersPage` | Organization |
| `/org/season-rental` | `SeasonRentalPage` | Organization |
| `/org/settings` | `OrganizationSettingsPage` | Organization |
| `/org/activity` | `OrganizationActivityPage` | Organization |

### Architecture Notes

- The app uses an **account context** system (`AccountContextProvider` + `AccountSelectionModal`) that lets users switch between personal and organization contexts.
- On first login, an `AccountSelectionModal` appears unless the user has previously chosen to remember their preference.
- Routes are protected with `requiredContext` (either `"personal"` or `"organization"`) to ensure the correct context is active.
- A `NotificationCenterProvider` manages the notification panel state.
- Real-time updates are provided via `RealtimeProvider`.

---

## 4. saas-admin (Port 6005)

### Purpose

SaaS platform administration interface. Manages tenants, modules, feature flags, plans, users, billing, and governance across the entire platform. This is the "super-admin" portal for the XalaBaaS platform operators.

### Target Users

Platform administrators (not tenant administrators).

### Design System

`@xala-technologies/platform-ui` -- The platform design system, distinct from Designsystemet. Uses `DashboardSidebar`, `DashboardHeader`, `AppLayout`, and other platform-specific components.

### Key Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | `DashboardPage` | Platform dashboard with KPIs |
| `/tenants` | `TenantsPage` | Tenant management |
| `/modules` | `ModulesPage` | Module catalog and management |
| `/feature-flags` | `FeatureFlagsPage` | Feature flag administration |
| `/plans` | `PlansPage` | Subscription plan management |
| `/users` | `UsersPage` | Platform user management |
| `/billing` | `BillingPage` | Platform billing |
| `/audit` | `AuditPage` | Platform audit log |
| `/governance` | `GovernancePage` | Governance and compliance |
| `/settings` | `SettingsPage` | Platform settings |

### Architecture Notes

- Uses `XalaProviders` from `@xalabaas/app-shell` for the full provider stack, rather than assembling providers manually.
- Navigation is driven by shared config from `@xalabaas/shared` (`BACKOFFICE_NAV_SECTIONS`, `BACKOFFICE_BOTTOM_NAV`) translated via `useT()`.
- The sidebar is built using `DashboardSidebar` with icon mapping from `@xala-technologies/platform-ui`.
- Supports theme toggle (light/dark) via `useTheme()` from platform-ui.
- Skip links are provided via `SkipLinks` for accessibility.

---

## 5. dashboard

### Purpose

Tenant-level analytics dashboard. Provides object, booking, and user statistics for tenant administrators who need a focused analytics view without the full backoffice feature set.

### Target Users

Tenant administrators and managers.

### Design System

`@xala-technologies/platform-ui` -- Same platform design system as saas-admin.

### Key Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | `DashboardPage` | Dashboard with KPI cards |
| `/objects` | `ObjectsPage` | Object (resource) overview |
| `/bookings` | `BookingsPage` | Booking analytics |
| `/users` | `UsersPage` | User statistics |
| `/settings` | `SettingsPage` | Dashboard settings |

### Architecture Notes

- Uses `XalaProviders` from `@xalabaas/app-shell` with `appId: "dashboard"`.
- Navigation is driven by `DASHBOARD_NAV_SECTIONS` and `DASHBOARD_BOTTOM_NAV` from `@xalabaas/shared`.
- Does not include `XalaConvexProvider` at the entry point level (unlike other apps) -- this may need to be added when real data hooks are wired up.
- Currently uses placeholder pages with static KPI cards; these will be replaced with real data from `useDashboardKPIs` and related hooks.

---

## Shared Packages Used by Apps

| Package | Purpose | Used By |
|---------|---------|---------|
| `@xalabaas/sdk` | React hooks for all domains | All apps |
| `@xalabaas/shared` | Types, constants, navigation configs | All apps |
| `@xalabaas/app-shell` | Provider composition, auth, guards, layout | saas-admin, dashboard |
| `@xalabaas/i18n` | i18next provider + translations (nb/en/ar) | All apps |
| `@xala/ds` | Designsystemet-based component library | web, backoffice, minside |
| `@xala/ds-themes` | Theme CSS tokens (digilist, navy, mobile) | web, backoffice, minside |
| `@xala-technologies/platform-ui` | Platform admin component library | saas-admin, dashboard |

---

## How to Add a New Route (General)

1. Create the page component in `apps/{app}/src/routes/` (or `pages/`).
2. Import SDK hooks for data needs. Never write business logic in the page -- delegate to hooks.
3. Use the appropriate design system components for layout.
4. Import the page in `App.tsx` and add a `<Route>` entry.
5. If the route requires authentication, wrap it in `<ProtectedRoute>`.
6. If the route requires a specific role, add `requiredRole` to `ProtectedRoute`.
7. If the route requires a specific module, use `<RequireModule module="...">`.
8. Add the route to the navigation config in `@xalabaas/shared` if it should appear in the sidebar.
9. Add i18n keys for the page title and description in `packages/i18n/locales/nb.json`.
