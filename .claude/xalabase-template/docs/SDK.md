# SDK Reference

## SDK Architecture

The XalaBaaS SDK (`@xalabaas/sdk`) is a **source-only** package -- it has no build step and is consumed directly by apps via Vite's `resolve.alias`. It provides React hooks for every domain in the platform, backed by Convex's real-time subscription engine.

The SDK follows a **thin re-export** pattern:

```
@xalabaas/sdk                              (packages/sdk/src/)
  hooks/use-bookings.ts                    re-exports from:
    -> packages/shared/src/features/bookings/hooks/use-bookings.ts  (REAL LOGIC)
```

All business logic lives in `packages/shared/src/features/{domain}/hooks/`. The SDK barrel (`packages/sdk/src/hooks/index.ts`) re-exports every hook so apps import from a single namespace:

```typescript
import { useBookings, useAuth, useResources } from '@xalabaas/sdk';
```

The SDK also re-exports:

- **`XalaConvexProvider`** -- Convex client provider that wraps the entire app
- **`api`** -- Typed Convex API object for direct function references
- **Typed IDs** -- `TenantId`, `ResourceId`, `BookingId`, `UserId`, `OrganizationId`
- **Transforms** -- `toPaginatedResponse`, `convexResourceToListing`, etc.
- **Formatters** -- `formatDate`, `formatCurrency`, `formatWeekRange`, etc.
- **Upload utilities** -- `UploadProgressTracker`, `formatBytes`, `formatSpeed`
- **Pricing utilities** -- `calculateBookingPrice`, `getPriceLabel`, etc.
- **Compatibility shims** -- No-op stubs for code migrated from the old REST backend

---

## Hook Patterns

Every hook in the SDK follows one of two shapes, modeled after React Query conventions.

### Query Hooks

Query hooks subscribe to Convex queries and return reactive data:

```typescript
interface QueryHookResult<T> {
  data: T | undefined;       // The resolved data (or a response envelope)
  isLoading: boolean;         // true while the Convex subscription is resolving
  error: Error | null;        // Always null (Convex uses error boundaries)
}
```

Example usage:

```typescript
const { data, isLoading, error } = useReviews(tenantId, { status: 'pending' });
```

Many query hooks also expose a convenience alias alongside the `data` envelope. For instance, `useReviews` returns both `data` (the envelope `{ data: Review[] }`) and `reviews` (the raw array).

Hooks use Convex's `"skip"` sentinel to defer queries when required parameters are not yet available:

```typescript
const data = useQuery(api.domain.bookings.list, tenantId ? { tenantId } : "skip");
```

### Mutation Hooks

Mutation hooks wrap Convex mutations and expose both fire-and-forget and async APIs:

```typescript
interface MutationHookResult<TInput, TOutput> {
  mutate: (input: TInput) => void;              // Fire-and-forget (errors captured in state)
  mutateAsync: (input: TInput) => Promise<TOutput>;  // Awaitable (throws on error)
  isLoading: boolean;                            // true during the mutation
  error: Error | null;                           // Last error, if any
  isSuccess: boolean;                            // true after successful completion
}
```

Example usage:

```typescript
const { mutateAsync, isLoading } = useCreateReview();
await mutateAsync({ tenantId, resourceId, userId, rating: 5, body: 'Great!' });
```

### Cached Queries

All query hooks import `useQuery` from `convex-helpers/react/cache` instead of `convex/react`. This enables automatic subscription caching across page navigations when `ConvexQueryCacheProvider` is present.

---

## Tenant Resolution

Most hooks require a `tenantId` to scope data. The SDK resolves this automatically via `useResolveTenantId()`.

### `useResolveTenantId(explicit?, appId?)`

Returns the tenant ID to use for queries:

1. If an explicit `tenantId` is provided, it is returned directly.
2. Otherwise, delegates to `useSessionTenantId(appId)`.

### `useSessionTenantId(appId?)`

Reads the tenant ID from localStorage using a priority chain:

1. **App-specific key**: `xalabaas_{appId}_tenant_id`
2. **Known app keys**: scans `web`, `backoffice`, `minside`, `saas-admin`, `default`
3. **Legacy key**: `xalabaas_tenant_id`
4. **User object fallback**: parses the stored user JSON for a `tenantId` field
5. Returns `undefined` if no tenant is found

This means most hooks can be called without an explicit tenant ID -- the SDK resolves it from the authenticated session automatically.

---

## Complete Hook Reference

All hooks are exported from `@xalabaas/sdk`. Hooks are grouped by domain below.

### Auth

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useAuth` | Query + Actions | `(options?: { appId?: string }) => UseAuthResult` | Unified auth state: `user`, `isAuthenticated`, `isLoading`, `error`, `sessionToken`, `signIn`, `signInAsDemo`, `signInWithOAuth`, `signOut` |
| `useSession` | Query | `() => { data, isLoading, error }` | Session data envelope: `{ data: { user, token } }` or `null` |
| `useLogin` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Accepts `{ email, password? }` |
| `useEmailLogin` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Accepts `{ email, password }` |
| `useLogout` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Signs out and clears session |
| `useRefreshToken` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | No-op stub (Convex manages session lifetime) |
| `useAuthProviders` | Query | `() => { data, isLoading, error }` | Returns supported providers: `password`, `demo`, `idporten`, `vipps`, `microsoft` |
| `useOAuthCallback` | Hook | `() => ...` | Handles OAuth redirect callback |
| `useMagicLink` | Hook | `() => ...` | Passwordless magic link authentication |

### Resources

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useResources` | Query | `(options?: { tenantId?, categoryKey?, status?, limit? }) => { resources, data, isLoading, error }` | List resources with real-time updates |
| `useResource` | Query | `(resourceId: ResourceId \| undefined) => { resource, data, isLoading, error }` | Get single resource by ID |
| `useCreateResource` | Mutation | `() => { createResource, isLoading }` | Create a new resource |
| `useUpdateResource` | Mutation | `() => { updateResource }` | Update resource fields |
| `useDeleteResource` | Mutation | `() => { deleteResource }` | Soft-delete a resource |
| `usePublishResource` | Mutation | `() => { publishResource }` | Set resource status to published |
| `useUnpublishResource` | Mutation | `() => { unpublishResource }` | Revert resource to draft |
| `usePublicResources` | Query | `(options?: { categoryKey?, status?, limit? }) => { resources, data, isLoading, error }` | List public resources (no tenantId required) |

### Bookings

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useBookings` | Query | `(options?: { tenantId?, resourceId?, userId?, status?, limit? }) => { bookings, data, isLoading, error }` | List bookings with real-time updates |
| `useBooking` | Query | `(id: BookingId \| undefined, options?) => { data, isLoading, error }` | Get single booking |
| `useMyBookings` | Query | `(params?) => { data, isLoading, error }` | Current user's bookings |
| `useRecurringBookings` | Query | `(params?) => { data, isLoading, error }` | Recurring bookings (stub) |
| `useBookingPricing` | Query | `(id?, start?, end?) => { data, isLoading, error }` | Calculate booking price (stub) |
| `useCreateBooking` | Mutation | `() => { createBooking, isLoading }` | Create a new booking |
| `useUpdateBooking` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update booking (stub) |
| `useApproveBooking` | Mutation | `() => { approveBooking }` | Approve a pending booking |
| `useRejectBooking` | Mutation | `() => { rejectBooking }` | Reject a booking with reason |
| `useCancelBooking` | Mutation | `() => { cancelBooking }` | Cancel a booking with reason |
| `useConfirmBooking` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Confirm/approve (digdir compat) |
| `useCompleteBooking` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Mark booking complete (stub) |
| `useDeleteBooking` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete booking (stub) |
| `useCalendar` | Query | `(tenantId, resourceId?, startDate, endDate) => { bookings, blocks, isLoading, error }` | Calendar view with blocks |
| `useCalendarEvents` | Query | `(params) => { data, isLoading, error }` | Calendar events in `CalendarEvent` shape |
| `useAvailabilitySlots` | Query | `(params) => { data, isLoading, error }` | Time slot availability (stub) |
| `useAllocations` | Query | `(params?) => { data, isLoading, error }` | Resource allocations (stub) |
| `useCreateAllocation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create allocation (stub) |
| `useDeleteAllocation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete allocation (stub) |
| `usePaymentHistory` | Query | `(bookingId?) => { data, isLoading, error }` | Payment history (stub) |
| `usePaymentReconciliation` | Query | `(params?) => { data, isLoading, error }` | Reconciliation report (stub) |

### Booking Availability

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useBookingAvailability` | Query | `(...) => AvailabilityData` | Multi-mode booking availability engine |
| `useValidateBookingSlot` | Query | `(...) => ValidationResult` | Validate a specific booking slot |
| `useCreateBookingMutation` | Mutation | `(...) => CreateBookingResult` | Create booking with availability check |

### Listings

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useListings` | Query | `(params?) => { data, isLoading, error }` | List tenant listings |
| `useListing` | Query | `(id?) => { data, isLoading, error }` | Get listing by ID |
| `useListingBySlug` | Query | `(slug?) => { data, isLoading, error }` | Get listing by slug |
| `useListingAvailability` | Query | `(id?, params?) => { data, isLoading, error }` | Listing availability |
| `useListingStats` | Query | `(id?) => { data, isLoading, error }` | Listing statistics |
| `usePublicListings` | Query | `(params?) => { data, isLoading, error }` | Public listing search |
| `usePublicUiListings` | Query | `(params?) => { data, isLoading, error }` | Public listings in UI shape |
| `usePublicListing` | Query | `(id?) => { data, isLoading, error }` | Single public listing |
| `usePublicUiListing` | Query | `(slug?) => { data, isLoading, error }` | Public listing in UI shape |
| `usePublicAvailability` | Query | `(id?, params?) => { data, isLoading, error }` | Public availability |
| `usePublicCategories` | Query | `() => { data, isLoading, error }` | Public category list |
| `usePublicCities` | Query | `() => { data, isLoading, error }` | Public city list |
| `usePublicMunicipalities` | Query | `() => { data, isLoading, error }` | Public municipality list |
| `useFeaturedListings` | Query | `(params?) => { data, isLoading, error }` | Featured/promoted listings |
| `useCreateListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create listing |
| `useUpdateListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update listing |
| `useDeleteListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete listing |
| `usePublishListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Publish listing |
| `useUnpublishListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Unpublish listing |
| `useArchiveListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Archive listing |
| `useRestoreListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Restore archived listing |
| `useDuplicateListing` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Duplicate listing |
| `useUploadListingMedia` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Upload listing images |
| `useDeleteListingMedia` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete listing image |

### Blocks (Calendar)

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useBlocks` | Query | `(params?) => { data, isLoading, error }` | List calendar blocks |
| `useBlock` | Query | `(id?) => { data, isLoading, error }` | Get single block |
| `useCreateBlock` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create block |
| `useUpdateBlock` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update block |
| `useDeleteBlock` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete block |
| `useCheckConflicts` | Query | `(params?) => { data, isLoading, error }` | Check for scheduling conflicts |

### Organizations and Users

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useOrganizations` | Query | `(params?) => { data, isLoading, error }` | List organizations |
| `useOrganization` | Query | `(id?) => { data, isLoading, error }` | Get single organization |
| `useOrganizationMembers` | Query | `(orgId?) => { data, isLoading, error }` | List org members |
| `useCreateOrganization` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create organization |
| `useUpdateOrganization` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update organization |
| `useDeleteOrganization` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete organization |
| `useVerifyOrganization` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Verify via BRREG |
| `useUploadOrganizationLogo` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Upload org logo |
| `useUsers` | Query | `(params?) => { data, isLoading, error }` | List users |
| `useUser` | Query | `(id?) => { data, isLoading, error }` | Get single user |
| `useCurrentUser` | Query | `() => { data, isLoading, error }` | Get current user |
| `useCreateUser` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create user |
| `useUpdateUser` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update user |
| `useUpdateCurrentUser` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update own profile |
| `useDeactivateUser` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Deactivate user |
| `useReactivateUser` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Reactivate user |
| `useUploadUserAvatar` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Upload avatar |
| `useExportData` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | GDPR data export |
| `useDeleteAccount` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete own account |
| `useConsents` | Query | `() => { data, isLoading, error }` | Get consent settings |
| `useUpdateConsents` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update consent settings |

### Seasons

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useSeasons` | Query | `(params?) => { data, isLoading, error }` | List seasons |
| `useSeason` | Query | `(id?) => { data, isLoading, error }` | Get single season |
| `useSeasonStats` | Query | `(id?) => { data, isLoading, error }` | Season statistics |
| `useCreateSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create season |
| `useUpdateSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update season |
| `useOpenSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Open for applications |
| `useCloseSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Close applications |
| `useActivateSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Activate season |
| `useCompleteSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Mark season complete |
| `useCancelSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Cancel season |
| `useDeleteSeason` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete season |

### Seasonal Leases

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useSeasonalLeases` | Query | `(params?) => { data, isLoading, error }` | List seasonal leases |
| `useSeasonalLease` | Query | `(id?) => { data, isLoading, error }` | Get single lease |
| `useCreateSeasonalLease` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create lease |
| `useUpdateSeasonalLease` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update lease |
| `useApproveSeasonalLease` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Approve lease |
| `useRejectSeasonalLease` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Reject lease |
| `useCancelSeasonalLease` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Cancel lease |
| `useDeleteSeasonalLease` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete lease |
| `useGenerateAllocations` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Generate allocations from lease |

### Season Applications

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useSeasonApplications` | Query | `(params?) => { data, isLoading, error }` | List applications |
| `useSeasonApplication` | Query | `(id?) => { data, isLoading, error }` | Get single application |
| `useCreateSeasonApplication` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Submit application |
| `useUpdateSeasonApplication` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update application |
| `useApproveSeasonApplication` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Approve application |
| `useRejectSeasonApplication` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Reject application |
| `useAllocateApplication` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Allocate resources to application |
| `useFinalizeSeasonAllocations` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Finalize all season allocations |
| `useDeleteSeasonApplication` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete application |

### Reviews

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useReviews` | Query | `(tenantId?, params?) => { data, reviews, isLoading, error }` | List reviews for tenant |
| `useReview` | Query | `(id?) => { data, review, isLoading, error }` | Get single review |
| `useListingReviews` | Query | `(tenantId?, resourceId?, params?) => { data, reviews, isLoading, error }` | Reviews for a specific resource |
| `useReviewStats` | Query | `(resourceId?) => { data, stats, isLoading, error }` | Rating statistics |
| `useReviewSummary` | Query | `(tenantId?, resourceId?) => { data, summary, isLoading, error }` | Stats + recent reviews combined |
| `useMyReviews` | Query | `(tenantId?, userId?, params?) => { data, reviews, isLoading, error }` | Current user's reviews |
| `useCreateReview` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create review |
| `useUpdateReview` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update review |
| `useDeleteReview` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete review |
| `useModerateReview` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Moderate (approve/reject/flag) |
| `useApproveReview` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Approve review (convenience) |
| `useRejectReview` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Reject review (convenience) |

### Messaging

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useConversations` | Query | `(params?) => { data, isLoading, error }` | List conversations |
| `useConversation` | Query | `(id?) => { data, isLoading, error }` | Get single conversation |
| `useMessages` | Query | `(conversationId?) => { data, isLoading, error }` | List messages in conversation |
| `useUnreadMessageCount` | Query | `() => { data, isLoading, error }` | Unread message count |
| `useUnreadCount` | Query | `() => { data, isLoading, error }` | Alias for unread count |
| `useCreateConversation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Start new conversation |
| `useSendMessage` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Send message |
| `useMarkMessagesAsRead` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Mark messages read |
| `useMarkMessagesRead` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Alias for mark read |
| `useArchiveConversation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Archive conversation |
| `useResolveConversation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Mark as resolved |
| `useReopenConversation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Reopen conversation |
| `useAssignConversation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Assign to handler |
| `useUnassignConversation` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Remove assignment |
| `useSetConversationPriority` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Set priority |
| `useConversationsByAssignee` | Query | `(assigneeId?) => { data, isLoading, error }` | Conversations by assignee |

### Notifications

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useNotifications` | Query | `(params?) => { data, isLoading, error }` | List notifications |
| `useMyNotifications` | Query | `(params?) => { data, isLoading, error }` | Current user's notifications |
| `useNotificationUnreadCount` | Query | `() => { data, isLoading, error }` | Unread notification count |
| `useNotificationTemplates` | Query | `() => { data, isLoading, error }` | Notification templates |
| `useMarkNotificationRead` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Mark single as read |
| `useMarkAllNotificationsRead` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Mark all as read |
| `useDeleteNotification` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete notification |
| `usePushSubscriptions` | Query | `() => { data, isLoading, error }` | Push subscriptions |
| `useNotificationPreferences` | Query | `() => { data, isLoading, error }` | User notification preferences |
| `usePushPermission` | Query | `() => { data, isLoading, error }` | Browser push permission state |
| `useRegisterPushSubscription` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Register push endpoint |
| `useUnsubscribePush` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Unsubscribe from push |
| `useDeletePushSubscription` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete push subscription |
| `useUpdateNotificationPreferences` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update preferences |
| `useTestPushNotification` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Send test push |
| `usePushSubscriptionFlow` | Hook | `() => ...` | Complete push subscription flow |

### Billing

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useBillingSummary` | Query | `(params?) => { data, isLoading, error }` | Billing summary |
| `useInvoices` | Query | `(params?) => { data, isLoading, error }` | List invoices |
| `useInvoice` | Query | `(id?) => { data, isLoading, error }` | Get single invoice |
| `useDownloadInvoice` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Download invoice PDF |
| `useInvoiceDownloadUrl` | Query | `(id?) => { data, isLoading, error }` | Get download URL |
| `useOrgBillingSummary` | Query | `(orgId?) => { data, isLoading, error }` | Organization billing summary |
| `useOrgInvoices` | Query | `(orgId?, params?) => { data, isLoading, error }` | Organization invoices |
| `useOrgInvoice` | Query | `(id?) => { data, isLoading, error }` | Single org invoice |
| `useDownloadOrgInvoice` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Download org invoice |
| `usePendingPaymentsCount` | Query | `() => { data, isLoading, error }` | Pending payment count |
| `useCreatePayment` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create payment |
| `useUpdatePaymentStatus` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update payment status |
| `useCreateBillingInvoice` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create invoice |
| `useUpdateInvoiceStatus` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update invoice status |
| `useSendInvoice` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Send invoice |
| `useMarkInvoicePaid` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Mark invoice as paid |
| `useCreditInvoice` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Issue credit note |

### Economy (Visma Integration)

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useInvoiceBases` | Query | `(params?) => { data, isLoading, error }` | Invoice bases |
| `useInvoiceBasis` | Query | `(id?) => { data, isLoading, error }` | Single invoice basis |
| `useCreateInvoiceBasis` | Mutation | Creates invoice basis |
| `useGenerateFromBookings` | Mutation | Generate invoices from bookings |
| `useUpdateInvoiceBasis` | Mutation | Update invoice basis |
| `useApproveInvoiceBasis` | Mutation | Approve invoice basis |
| `useFinalizeInvoiceBasis` | Mutation | Finalize for sending |
| `useDeleteInvoiceBasis` | Mutation | Delete invoice basis |
| `useSalesDocuments` | Query | List sales documents |
| `useSalesDocument` | Query | Get single sales document |
| `useSendSalesDocument` | Mutation | Send sales document |
| `useMarkAsPaid` | Mutation | Mark document as paid |
| `useDownloadInvoicePdf` | Mutation | Download PDF |
| `useCancelSalesDocument` | Mutation | Cancel sales document |
| `useCreditNotes` | Query | List credit notes |
| `useCreditNote` | Query | Get single credit note |
| `useCreateCreditNote` | Mutation | Create credit note |
| `useApproveCreditNote` | Mutation | Approve credit note |
| `useProcessCreditNote` | Mutation | Process credit note |
| `useDownloadCreditNotePdf` | Mutation | Download credit note PDF |
| `useSyncToVisma` | Mutation | Sync to Visma |
| `useVismaInvoiceStatus` | Query | Visma sync status |
| `useExportEconomy` | Mutation | Export economy data |
| `useEconomyStatistics` | Query | Economy statistics |

### Pricing

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useCalculatePrice` | Query | `(params?) => { data, isLoading, error }` | Calculate price for booking |
| `useResourcePricing` | Query | `(resourceId?) => { data, isLoading, error }` | Resource pricing config |
| `usePricingGroups` | Query | `(tenantId?) => { data, isLoading, error }` | List pricing groups |
| `useResourcePricingList` | Query | `(tenantId?) => { data, isLoading, error }` | All resource pricing configs |
| `useCreateResourcePricing` | Mutation | Create pricing config |
| `useUpdateResourcePricing` | Mutation | Update pricing config |
| `useDeleteResourcePricing` | Mutation | Delete pricing config |
| `useCreatePricingGroup` | Mutation | Create pricing group |
| `useUpdatePricingGroup` | Mutation | Update pricing group |
| `useDeletePricingGroup` | Mutation | Delete pricing group |
| `useBookingPrice` | Query | `(options?) => UseBookingPriceResult` | Calculate booking price |
| `useResourcePriceGroups` | Query | `(resourceId?) => { data, isLoading, error }` | Groups for a resource |
| `useHolidays` | Query | `(tenantId?) => { data, isLoading, error }` | Holiday surcharge list |
| `useCreateHoliday` | Mutation | Create holiday surcharge |
| `useUpdateHoliday` | Mutation | Update holiday surcharge |
| `useDeleteHoliday` | Mutation | Delete holiday surcharge |
| `useWeekdayPricing` | Query | `(tenantId?) => { data, isLoading, error }` | Weekday/peak hour pricing |
| `useCreateWeekdayPricing` | Mutation | Create weekday pricing |
| `useUpdateWeekdayPricing` | Mutation | Update weekday pricing |
| `useDeleteWeekdayPricing` | Mutation | Delete weekday pricing |
| `useDiscountCodes` | Query | `(tenantId?) => { data, isLoading, error }` | Discount codes |
| `useValidateDiscountCode` | Query | `(code?, tenantId?) => { data, isLoading, error }` | Validate a discount code |
| `useCreateDiscountCode` | Mutation | Create discount code |
| `useUpdateDiscountCode` | Mutation | Update discount code |
| `useDeleteDiscountCode` | Mutation | Delete discount code |
| `useApplyDiscountCode` | Mutation | Apply discount to booking |
| `useApplicableSurcharges` | Query | `(params?) => { data, isLoading, error }` | Combined applicable surcharges |

### Feature Flags and Modules

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useFeatureFlag` | Query | `(key, tenantId?) => { data, value, isEnabled, isLoading, error }` | Evaluate single flag |
| `useFeatureFlags` | Query | `(tenantId?) => { data, flags, isLoading, error }` | Evaluate all flags |
| `useModuleEnabled` | Query | `(moduleId, tenantId?) => { isEnabled, isLoading, error }` | Check if module is enabled |
| `useModules` | Query | `(tenantId?) => { data, modules, isLoading, error }` | List all modules |
| `useCreateFlag` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Create flag definition |
| `useUpdateFlag` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Update flag |
| `useDeleteFlag` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Delete flag and rules |
| `useEnableModule` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Enable module for tenant |
| `useDisableModule` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Disable module (non-core only) |
| `useFlagDefinitions` | Query | `(tenantId?) => { data, flags, isLoading, error }` | Raw flag definitions (admin UI) |

### Audit

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useAuditLog` | Query | `(params?) => { data, isLoading, error }` | Query audit log |
| `useAuditEvent` | Query | `(id?) => { data, isLoading, error }` | Get single audit event |
| `useAuditStats` | Query | `(params?) => { data, isLoading, error }` | Audit statistics |
| `useResourceAudit` | Query | `(resourceId?) => { data, isLoading, error }` | Audit log for a resource |
| `useUserAudit` | Query | `(userId?) => { data, isLoading, error }` | Audit log for a user |

### Dashboard and Analytics

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useDashboardKPIs` | Query | `(params?) => { data, isLoading, error }` | Key performance indicators |
| `useDashboardStats` | Query | `(params?) => { data, isLoading, error }` | Dashboard statistics |
| `useDashboardActivity` | Query | `(params?) => { data, isLoading, error }` | Recent activity feed |
| `usePendingItems` | Query | `(params?) => { data, isLoading, error }` | Items requiring attention |
| `useUpcomingBookings` | Query | `(params?) => { data, isLoading, error }` | Upcoming bookings |
| `useQuickActions` | Query | `(params?) => { data, isLoading, error }` | Available quick actions |
| `useBookingStats` | Query | `(params?) => { data, isLoading, error }` | Booking statistics |
| `useRevenueReport` | Query | `(params?) => { data, isLoading, error }` | Revenue report |
| `useUsageReport` | Query | `(params?) => { data, isLoading, error }` | Usage report |
| `useTimeSlotHeatmap` | Query | `(params?) => { data, isLoading, error }` | Time slot popularity heatmap |
| `useSeasonalPatterns` | Query | `(params?) => { data, isLoading, error }` | Seasonal usage patterns |
| `useComparisonData` | Query | `(params?) => { data, isLoading, error }` | Period-over-period comparison |
| `useExportReport` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Export report data |

### Integrations

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useTenantSettings` | Query | `(tenantId?) => { data, isLoading, error }` | Tenant configuration |
| `useUpdateTenantSettings` | Mutation | Update tenant settings |
| `useIntegrationSettings` | Query | `(tenantId?) => { data, isLoading, error }` | Integration configs |
| `useUpdateIntegration` | Mutation | Update integration config |
| `useRcoStatus` | Query | RCO lock system status |
| `useRcoLocks` | Query | List RCO locks |
| `useGenerateAccessCode` | Mutation | Generate access code |
| `useRemoteUnlock` | Mutation | Remote unlock door |
| `useVismaStatus` | Query | Visma integration status |
| `useVismaInvoices` | Query | Visma invoice list |
| `useCreateInvoice` | Mutation | Create Visma invoice |
| `useSyncVisma` | Mutation | Sync with Visma |
| `useBrregLookup` | Query | BRREG organization lookup |
| `useVerifyBrreg` | Mutation | Verify org via BRREG |
| `useNifLookup` | Query | NIF organization lookup |
| `useVippsStatus` | Query | Vipps payment status |
| `useVippsPayment` | Query | Get Vipps payment |
| `useVippsPaymentHistory` | Query | Vipps payment history |
| `useInitiatePayment` | Mutation | Initiate Vipps payment |
| `useCapturePayment` | Mutation | Capture Vipps payment |
| `useRefundPayment` | Mutation | Refund Vipps payment |
| `useCalendarSyncStatus` | Query | Calendar sync status |
| `useSyncCalendar` | Mutation | Trigger calendar sync |

### Search and Filters

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useGlobalSearch` | Query | `(params?) => { data, isLoading, error }` | Authenticated global search |
| `usePublicGlobalSearch` | Query | `(params?) => { data, isLoading, error }` | Public global search |
| `useTypeahead` | Query | `(params?) => { data, isLoading, error }` | Typeahead suggestions |
| `usePublicTypeahead` | Query | `(params?) => { data, isLoading, error }` | Public typeahead |
| `useSearchSuggestions` | Query | `(query?) => { data, isLoading, error }` | Smart search suggestions |
| `useSearchFacets` | Query | `(params?) => { data, isLoading, error }` | Faceted search counts |
| `useSavedFilters` | Query | `() => { data, isLoading, error }` | User's saved filters |
| `useSavedFilter` | Query | `(id?) => { data, isLoading, error }` | Get single saved filter |
| `useCreateSavedFilter` | Mutation | Create saved filter |
| `useUpdateSavedFilter` | Mutation | Update saved filter |
| `useDeleteSavedFilter` | Mutation | Delete saved filter |
| `useRecentSearches` | Query | `() => { data, isLoading, error }` | Recent search history |
| `useExportResults` | Mutation | Export search results |
| `useDynamicFilterCounts` | Query | `(params?) => DynamicFilterResult` | Interactive filter counts |

### Categories and Amenities

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useCategories` | Query | `(tenantId?) => { data, isLoading, error }` | Tenant categories |
| `useCategoryTree` | Query | `(tenantId?) => { data, isLoading, error }` | Hierarchical category tree |
| `useCategoryOptions` | Query | `(tenantId?) => { data, isLoading, error }` | Category select options |
| `useCategoryLabel` | Hook | `(key) => string` | Get category label by key |
| `useAmenities` | Query | `(tenantId?) => { data, isLoading, error }` | Tenant amenities |
| `useAmenitiesGrouped` | Query | `(tenantId?) => { data, isLoading, error }` | Amenities grouped |
| `useAmenityOptions` | Query | `(tenantId?) => { data, isLoading, error }` | Amenity select options |
| `useAmenityLabel` | Hook | `(key) => string` | Get amenity label by key |

### Addons

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useAddons` | Query | `(tenantId?) => { data, isLoading, error }` | List all addons |
| `useAddon` | Query | `(id?) => { data, isLoading, error }` | Get single addon |
| `useAddonsForResource` | Query | `(resourceId?) => { data, isLoading, error }` | Addons for a resource |
| `useAddonsForBooking` | Query | `(bookingId?) => { data, isLoading, error }` | Addons for a booking |
| `useCreateAddon` | Mutation | Create addon |
| `useUpdateAddon` | Mutation | Update addon |
| `useDeleteAddon` | Mutation | Delete addon |
| `useAddAddonToResource` | Mutation | Associate addon with resource |
| `useRemoveAddonFromResource` | Mutation | Remove addon from resource |
| `useAddAddonToBooking` | Mutation | Add addon to booking |
| `useUpdateBookingAddon` | Mutation | Update booking addon |
| `useRemoveAddonFromBooking` | Mutation | Remove addon from booking |
| `useApproveBookingAddon` | Mutation | Approve booking addon |
| `useRejectBookingAddon` | Mutation | Reject booking addon |
| `useAdditionalServices` | Query | `(resourceId?) => { data, isLoading, error }` | Additional services for resource |
| `useAdditionalServicesForDisplay` | Query | `(resourceId?) => { data, isLoading, error }` | Services formatted for UI display |

### Favorites

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useFavorites` | Hook | `(options?) => UseFavoritesResult` | Unified guest/user favorites |
| `useFavoriteIds` | Hook | `(options?) => Set<string>` | Set of favorited IDs |

### Utility Hooks

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useFaq` | Query | `(category?) => { data, isLoading, error }` | FAQ entries by category |
| `useGuides` | Query | `(role?) => { data, isLoading, error }` | User guides by role |
| `useTraining` | Query | `() => { data, isLoading, error }` | Training modules |
| `useTooltips` | Query | `() => { data, isLoading, error }` | UI tooltip strings |
| `useSubmitContact` | Mutation | `() => { mutate, mutateAsync, isLoading, error, isSuccess }` | Submit contact form |
| `useGeocode` | Hook | `(address) => GeocodedLocation` | Client-side geocoding |
| `useGeocodeListings` | Hook | `(options?) => UseGeocodeListingsResult` | Geocode listing addresses |
| `useAccessibilityMonitoring` | Hook | `(options?) => AccessibilityMonitoringAPI` | A11y metrics collection |
| `useScreenReaderDetection` | Hook | `() => boolean` | Detect screen reader presence |
| `useKeyboardNavigationDetection` | Hook | `() => boolean` | Detect keyboard navigation |

### Tenant Resolution

| Hook | Type | Signature | Description |
|------|------|-----------|-------------|
| `useSessionTenantId` | Hook | `(appId?) => TenantId \| undefined` | Read tenant from session storage |
| `useResolveTenantId` | Hook | `(explicit?, appId?) => TenantId \| undefined` | Resolve tenant: explicit or session |
