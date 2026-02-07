import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import {
  AppHeader,
  HeaderLogo,
  HeaderSearch,
  HeaderActions,
  HeaderThemeToggle,
  HeaderLoginButton,
  NotificationBell,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  DialogProvider,
  UserMenu,
  BuildingIcon,
  SportIcon,
  ShoppingCartIcon,
  SearchIcon,
} from '@xala/ds';
import type { SearchResultItem, SearchResultGroup } from '@xala/ds';
import { DesignsystemetProvider } from '@xala/ds';
import { DEFAULT_THEME, type ThemeId } from '@xala/ds-themes';
import { I18nProvider, useT } from '@xalabaas/i18n';
import { useAuth, useNotificationUnreadCount, usePublicGlobalSearch } from '@xalabaas/sdk';
import { ListingsPage } from '@/pages/ListingsPage';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { PaymentCallbackPage } from '@/pages/PaymentCallbackPage';
import { LoginPage } from '@/pages/login';
import { AuthCallbackPage } from '@/pages/auth-callback';
import { MagicLinkCallbackPage } from '@/pages/magic-link-callback';
import { RealtimeProvider, AuthProvider, AccountContextProvider } from '@/providers';
import { RealtimeToast, ProtectedRoute } from '@/components';
import {
  DashboardPage as MinsideDashboardPage,
  BookingsPage,
  BillingPage,
  CalendarPage,
  MessagesPage,
  NotificationsPage,
  ReviewsPage,
  SettingsPage,
  OrgDashboardPage,
  InvoicesPage,
} from '@/pages/min-side';

// Theme context type
type ColorScheme = 'auto' | 'light' | 'dark';
interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  effectiveScheme: 'light' | 'dark';
}

// Hook to use theme context from outlet
function useThemeContext() {
  return useOutletContext<ThemeContextType>();
}

// Layout with header for main pages
function MainLayout() {
  const t = useT();
  const navigate = useNavigate();
  const { setColorScheme, effectiveScheme } = useThemeContext();

  const [searchQuery, setSearchQuery] = React.useState('');

  // Use real public search
  const { data: searchData, isLoading: isSearching } = usePublicGlobalSearch({
    query: searchQuery,
    limit: 20,
  });

  // Get real unread notification count (only for logged in users)
  const { data: unreadData } = useNotificationUnreadCount();
  const unreadCount = unreadData?.data?.count ?? 0;

  // Auth state from SDK (reactive, no polling needed)
  const auth = useAuth({ appId: 'web' });
  const isLoggedIn = auth.isAuthenticated;

  // Toggle between light and dark (skip auto for manual toggle)
  const handleThemeToggle = () => {
    setColorScheme(effectiveScheme === 'dark' ? 'light' : 'dark');
  };

  // Transform search results to SearchResultGroup format for HeaderSearch
  const searchResults: SearchResultGroup[] = React.useMemo(() => {
    const groups: SearchResultGroup[] = [];

    // Add intent suggestions first (e.g., "Find available times")
    if (searchData?.intentSuggestions && searchData.intentSuggestions.length > 0) {
      const intentItems: SearchResultItem[] = searchData.intentSuggestions.map((intent) => ({
        id: `intent:${intent.key}`,
        label: intent.label,
        description: intent.description,
        icon: <SearchIcon size={18} />,
        meta: '✨',
      }));

      groups.push({
        id: 'INTENTS',
        label: t('common.quickActions', 'Hurtighandlinger'),
        items: intentItems.slice(0, 2),
      });
    }

    // Add popular searches
    if (searchData?.popularSuggestions && searchData.popularSuggestions.length > 0) {
      const popularItems: SearchResultItem[] = searchData.popularSuggestions.map((pop) => ({
        id: `popular:${pop.key}`,
        label: pop.label,
        description: pop.description,
        icon: getCategoryIcon(pop.category),
        meta: '🔥',
      }));

      groups.push({
        id: 'POPULAR',
        label: t('common.popularSearches', 'Populære søk'),
        items: popularItems.slice(0, 3),
      });
    }

    // Add category suggestions
    if (searchData?.categorySuggestions && searchData.categorySuggestions.length > 0) {
      const categoryItems: SearchResultItem[] = searchData.categorySuggestions.map((cat) => ({
        id: `category:${cat.key}`,
        label: cat.name,
        description: cat.description,
        icon: getCategoryIcon(cat.key),
        meta: cat.resourceCount ? `${cat.resourceCount} annonser` : undefined,
      }));

      groups.push({
        id: 'CATEGORIES',
        label: t('common.categories', 'Kategorier'),
        items: categoryItems.slice(0, 3),
      });
    }

    if (!searchData?.results || searchData.results.length === 0) {
      return groups;
    }

    // Group results by category
    const groupedByCategory: Record<string, SearchResultItem[]> = {};

    for (const result of searchData.results) {
      const category = result.categoryKey || 'OTHER';
      if (!groupedByCategory[category]) {
        groupedByCategory[category] = [];
      }
      // Extract slug from url (format: /listing/{slug})
      const slug = result.url?.replace('/listing/', '') || result.id;
      groupedByCategory[category].push({
        id: slug, // Use slug as id for navigation
        label: result.title,
        description: result.description,
        icon: getCategoryIcon(result.categoryKey),
        meta: result.categoryKey,
      });
    }

    // Convert to array of groups and add to result
    for (const [category, items] of Object.entries(groupedByCategory)) {
      groups.push({
        id: category,
        label: getCategoryLabel(category, t),
        items: items.slice(0, 5), // Limit to 5 per category
      });
    }

    return groups;
  }, [searchData, t]);

  // Helper to get category icon
  function getCategoryIcon(categoryKey?: string) {
    switch (categoryKey) {
      case 'LOKALER': return <BuildingIcon size={18} />;
      case 'SPORT': return <SportIcon size={18} />;
      case 'ARRANGEMENTER': return <CalendarIcon size={18} />;
      case 'TORGET': return <ShoppingCartIcon size={18} />;
      default: return <SearchIcon size={18} />;
    }
  }

  // Helper to get category label
  function getCategoryLabel(categoryKey: string, t: any) {
    switch (categoryKey) {
      case 'LOKALER': return t('categories.lokaler', 'Lokaler');
      case 'SPORT': return t('categories.sport', 'Sport');
      case 'ARRANGEMENTER': return t('categories.arrangementer', 'Arrangementer');
      case 'TORGET': return t('categories.torget', 'Torget');
      default: return categoryKey;
    }
  }

  // Search change handler - just update the query, hook handles the rest
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearch = (value: string) => {
    // Navigate to listings page with search query
    if (value.trim()) {
      navigate(`/?search=${encodeURIComponent(value.trim())}`);
      setSearchQuery('');
    }
  };

  const handleResultSelect = (result: SearchResultItem) => {
    // Check if it's an intent suggestion
    if (result.id.startsWith('intent:')) {
      const intentKey = result.id.replace('intent:', '');
      // Handle different intents
      if (intentKey === 'booking') {
        navigate(`/?sort=available`);
      } else if (intentKey === 'event') {
        navigate(`/?category=ARRANGEMENTER`);
      } else if (intentKey === 'location') {
        // Keep search query and add location filter hint
        navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      } else if (intentKey === 'price') {
        navigate(`/?sort=price_asc`);
      }
      setSearchQuery('');
      return;
    }

    // Check if it's a popular search
    if (result.id.startsWith('popular:')) {
      const popularKey = result.id.replace('popular:', '').replace('popular_', '');
      navigate(`/?search=${encodeURIComponent(popularKey)}`);
      setSearchQuery('');
      return;
    }

    // Check if it's a category suggestion
    if (result.id.startsWith('category:')) {
      const categoryKey = result.id.replace('category:', '');
      // Navigate to listings page filtered by category
      navigate(`/?category=${encodeURIComponent(categoryKey)}`);
      setSearchQuery('');
      return;
    }

    // Navigate to the selected listing - id is the slug
    navigate(`/listing/${result.id}`);
    setSearchQuery('');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.reload();
  };

  // Derive user display info from auth state
  const getUserName = () =>
    auth.user?.name || auth.user?.email?.split('@')[0] || auth.user?.email;
  const getUserEmail = () => auth.user?.email;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--ds-color-neutral-background-default)',
      margin: 0,
      padding: 0
    }}>
      {/* Site-wide layout: 1366px max-width, 25px side padding */}
      <style>{`
        .ds-container {
          max-width: 1600px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: 25px !important;
          padding-right: 25px !important;
        }

        @media (max-width: 599px) {
          .ds-container {
            padding-left: 12px !important;
            padding-right: 12px !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          .header-search-desktop { display: none !important; }
          .mobile-search-wrapper { display: block !important; }

          /* Hide view toggle on mobile - only show grid view */
          .listing-toolbar .ds-toggle-group {
            display: none !important;
          }
        }
        @media (min-width: 600px) {
          .mobile-search-wrapper { display: none !important; }
        }

        /* Centered header search box - fixed 600px */
        .header-search-desktop {
          width: 600px;
        }

        /* Improve search dropdown appearance */
        .header-search-desktop [data-ds-search-results] {
          max-height: 70vh;
          overflow-y: auto;
        }
      `}</style>

      <AppHeader
        sticky={true}
        logo={
          <HeaderLogo
            src="/logo.svg"
            title="DIGILIST"
            subtitle="ENKEL BOOKING"
            href="/"
            height="40px"
            hideTextOnMobile={true}
          />
        }
        search={
          <div className="header-search-desktop">
            <HeaderSearch
              placeholder={t('common.search')}
              value={searchQuery}
              onSearchChange={handleSearchChange}
              onSearch={handleSearch}
              results={searchResults}
              onResultSelect={handleResultSelect}
              isLoading={isSearching}
              showShortcut={true}
              enableGlobalShortcut={true}
            />
          </div>
        }
        actions={
          <HeaderActions spacing="12px">
            <HeaderThemeToggle
              isDark={effectiveScheme === 'dark'}
              onToggle={handleThemeToggle}
            />
            {isLoggedIn && (
              <NotificationBell
                count={unreadCount}
                onClick={() => {
                  // TODO: Open notification center modal
                }}
                aria-label={`Varsler${unreadCount > 0 ? ` (${unreadCount} uleste)` : ''}`}
              />
            )}
            {isLoggedIn ? (
              <UserMenu
                userName={getUserName() || ''}
                userEmail={getUserEmail()}
                onLogout={handleLogout}
                minsideUrl="/min-side"
                helpUrl="https://digilist.no/hjelp"
              />
            ) : (
              <HeaderLoginButton
                isLoggedIn={false}
                onLogin={handleLogin}
                color="accent"
                loginText="Logg inn"
              />
            )}
          </HeaderActions>
        }
      />

      <Outlet />
    </div>
  );
}

// Wrapper to provide theme context to MainLayout
function MainLayoutWithContext({ colorScheme, setColorScheme, effectiveScheme }: ThemeContextType) {
  return <Outlet context={{ colorScheme, setColorScheme, effectiveScheme }} />;
}

const THEME_STORAGE_KEY = 'theme-preference';

// App content with theme provider
function AppContent() {
  const [theme] = React.useState<ThemeId>(DEFAULT_THEME);
  // Initialize with safe defaults to avoid hydration mismatch
  const [colorScheme, setColorSchemeState] = React.useState<ColorScheme>('auto');
  const [systemScheme, setSystemScheme] = React.useState<'light' | 'dark'>('light');
  const [isThemeInitialized, setIsThemeInitialized] = React.useState(false);

  // Initialize theme from localStorage after mount
  React.useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      setColorSchemeState(stored);
    }
    setSystemScheme(
      window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );
    setIsThemeInitialized(true);
  }, []);

  const setColorScheme = React.useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    if (scheme === 'auto') {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, scheme);
    }
  }, []);

  // Detect system color scheme
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemScheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute effective scheme
  const effectiveScheme = colorScheme === 'auto' ? systemScheme : colorScheme;

  return (
    <DesignsystemetProvider theme={theme} colorScheme={colorScheme} size="auto" skipThemeLoading>
      <DialogProvider>
        <RealtimeProvider autoConnect={true} enableInDev={true}>
          <RealtimeToast />
          <style>{`
            *, *::before, *::after {
              transition: background-color 0.3s ease, border-color 0.3s ease, color 0.2s ease;
            }
          `}</style>
          <Routes>
            {/* Login page - no header */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/magic-link" element={<MagicLinkCallbackPage />} />

            {/* Main pages with header - wrapped to provide theme context */}
            <Route element={<MainLayoutWithContext colorScheme={colorScheme} setColorScheme={setColorScheme} effectiveScheme={effectiveScheme} />}>
              <Route element={<MainLayout />}>
                {/* Public pages */}
                <Route path="/" element={<ListingsPage />} />
                <Route path="/listing/:id" element={<ListingDetailPage />} />
                <Route path="/payment/callback" element={<PaymentCallbackPage />} />

                {/* Min Side - Protected Routes using SAME layout as public */}
                <Route
                  path="/min-side"
                  element={
                    <AuthProvider>
                      <AccountContextProvider>
                        <ProtectedRoute>
                          <Outlet />
                        </ProtectedRoute>
                      </AccountContextProvider>
                    </AuthProvider>
                  }
                >
                  {/* Personal context routes */}
                  <Route index element={<MinsideDashboardPage />} />
                  <Route path="bookings" element={<BookingsPage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="reviews" element={<ReviewsPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Organization context routes */}
                  <Route path="org" element={<OrgDashboardPage />} />
                  <Route path="org/invoices" element={<InvoicesPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </RealtimeProvider>
      </DialogProvider>
    </DesignsystemetProvider>
  );
}

export function App() {
  return (
    <I18nProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
