/**
 * Composed Components
 * 
 * Higher-level components built from primitives
 */

// DataTable - Generic data table with sorting, pagination, selection
export { DataTable } from './DataTable';
export type {
  DataTableProps,
  DataTableColumn,
  SortState,
  PaginationState,
} from './DataTable';

export { ContentLayout } from './content-layout';
export type { ContentLayoutProps } from './content-layout';

export { ContentSection } from './content-section';
export type { ContentSectionProps } from './content-section';

export { PageHeader } from './page-header';
export type { PageHeaderProps } from './page-header';

// Header Components
export { AppHeader } from './header';
export type { AppHeaderProps } from './header';

export {
  HeaderLogo,
  HeaderSearch,
  HeaderActions,
  HeaderActionButton,
  HeaderIconButton,
  HeaderThemeToggle,
  HeaderLanguageSwitch,
  HeaderLoginButton
} from './header-parts';
export type {
  HeaderLogoProps,
  HeaderSearchProps,
  HeaderActionsProps,
  HeaderIconButtonProps,
  HeaderThemeToggleProps,
  HeaderLanguageSwitchProps,
  HeaderLoginButtonProps,
  SearchResultItem,
  SearchResultGroup
} from './header-parts';

// Navigation
export { Navigation, NavigationLink } from './navigation';
export type { NavigationProps, NavigationLinkProps } from './navigation';

// Filter Bar
export { FilterBar } from './filter-bar';
export type { FilterBarProps } from './filter-bar';

// Listing Filter (Enhanced)
export { ListingFilter } from './listing-filter';
export type {
  ListingFilterProps,
  ListingFilterState,
  ListingFilterLabels,
  CategoryOption,
  SubcategoryOption,
  FacilityOption,
  SortOption,
  CityOption,
} from './listing-filter';

// Filter Types
export type {
  ListingType,
  VenueType,
  PriceUnit,
  AvailabilityStatus,
  FilterOption,
  PriceRangeFilter,
  CapacityRangeFilter,
  RatingFilter,
  LocationFilter,
  FacilitiesFilter,
  DateTimeFilter,
  FilterState,
  FilterConfig
} from '../types/filters';
export { mockFilterData } from '../types/filters';

// Drawer / Slide Panel
export { Drawer, DrawerSection, DrawerItem, DrawerEmptyState } from './Drawer';
export type {
  DrawerProps,
  DrawerPosition,
  DrawerSize,
  DrawerSectionProps,
  DrawerItemProps,
  DrawerEmptyStateProps
} from './Drawer';

// Breadcrumb
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps } from './Breadcrumb';

// Booking Stepper
export { BookingStepper } from './BookingStepper';
export type { BookingStepperProps } from './BookingStepper';

// Dialogs
export {
  ConfirmDialog,
  AlertDialog,
  DialogProvider,
  useDialog
} from './dialogs';
export type {
  ConfirmDialogProps,
  AlertDialogProps,
  DialogVariant
} from './dialogs';

// Mobile Navigation
export { MobileNav, MobileNavToggle } from './mobile-nav';
export type {
  MobileNavProps,
  MobileNavToggleProps,
  MobileNavItem,
  MobileNavSection
} from './mobile-nav';

export { BottomNavigation } from './bottom-navigation';
export type {
  BottomNavigationProps,
  BottomNavigationItem
} from './bottom-navigation';

// Pill Tabs
export { PillTabs } from './PillTabs';
export type { PillTabsProps, PillTab } from './PillTabs';

// Pill Dropdown (matches PillTabs styling)
export { PillDropdown } from './PillDropdown';
export type { PillDropdownProps, PillDropdownOption, PillDropdownLabels } from './PillDropdown';

// CRUD Wizard (step-based CRUD workflows using PillTabs)
export { CrudWizard } from './CrudWizard';
export type { CrudWizardProps, CrudWizardStep, CrudWizardAction, CrudWizardLabels } from './CrudWizard';

// User Menu
export { UserMenu } from './user-menu';
export type { UserMenuProps, UserMenuLink } from './user-menu';

// Booking Components (Multi-mode booking engine)
export {
  BookingWidget,
  WeeklySlotGrid,
  DayCalendar,
  PeriodPicker,
  QuantitySelector,
  BookingWizard,
  BookingStepDetails,
  BookingStepReview,
  BookingStepConfirm,
  formatPrice,
  formatDate,
  formatTime,
  getWeekDates,
  getMonthDates,
  WEEKDAY_NAMES,
  MONTH_NAMES,
  DURATION_OPTIONS,
} from './booking';
export type {
  BookingMode,
  BookingSelection,
  BookingUserDetails,
  BookingWidgetProps,
  BookingWizardProps,
  WeeklySlotGridProps,
  DayCalendarProps,
  PeriodPickerProps,
  QuantitySelectorProps,
  OpeningHour,
  SlotAvailability,
  DayAvailability,
  DurationAvailability,
  TicketAvailability,
  AvailabilityData,
  BookingStepDetailsProps,
  BookingStepReviewProps,
  BookingStepConfirmProps,
} from './booking';
