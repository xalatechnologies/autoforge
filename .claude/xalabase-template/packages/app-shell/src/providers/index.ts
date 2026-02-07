/**
 * App Shell Providers
 *
 * Central provider composition for all XalaBaaS apps.
 * All providers are exported from here - apps should not have local providers.
 */

// Main provider stack
export {
    XalaProviders,
    useRuntime,
    useLocale,
    useDirection,
    type XalaProvidersProps,
    type RuntimeContext,
    type LocaleContextValue,
} from './XalaProviders';

// Auth provider (uses SDK useAuth internally)
export { AuthProvider, useAuthContext } from './AuthProvider';

// Toast notifications
export { ToastProvider, useToast } from './ToastProvider';

// Realtime/WebSocket provider
export { RealtimeProvider } from './RealtimeProvider';

// Account context (multi-account/org switching)
export { AccountContextProvider, useAccountContext } from './AccountContextProvider';
