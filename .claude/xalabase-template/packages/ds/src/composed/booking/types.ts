/**
 * Booking Widget Types
 *
 * Shared types for the multi-mode booking engine.
 */

export type BookingMode = 'SLOTS' | 'ALL_DAY' | 'DURATION' | 'TICKETS';

export interface OpeningHour {
  dayIndex: number;      // 0=Sunday, 1=Monday, etc.
  day: string;           // "Mandag", "Tirsdag", etc.
  open: string;          // "08:00"
  close: string;         // "21:00"
  isClosed?: boolean;
}

// =============================================================================
// Availability Data Types (returned by backend)
// =============================================================================

export interface SlotAvailability {
  mode: 'SLOTS';
  slots: Array<{
    date: string;      // ISO date
    hour: number;      // 0-23
    available: boolean;
    bookingId?: string;
  }>;
}

export interface DayAvailability {
  mode: 'ALL_DAY';
  days: Array<{
    date: string;
    status: 'available' | 'partial' | 'booked' | 'blocked' | 'closed';
  }>;
}

export interface DurationAvailability {
  mode: 'DURATION';
  days: Array<{
    date: string;
    available: boolean;
    maxDurationMinutes: number;
  }>;
}

export interface TicketAvailability {
  mode: 'TICKETS';
  days: Array<{
    date: string;
    available: number;
    capacity: number;
  }>;
}

export type AvailabilityData = SlotAvailability | DayAvailability | DurationAvailability | TicketAvailability;

// =============================================================================
// Booking Selection
// =============================================================================

export interface BookingSelection {
  mode: BookingMode;
  resourceId: string;
  resourceName: string;
  startTime?: number;      // epoch ms
  endTime?: number;        // epoch ms
  date?: string;           // ISO date for ALL_DAY
  dates?: string[];        // Multiple dates for multi-day
  quantity?: number;       // For TICKETS
  durationMinutes?: number; // For DURATION
  // Computed
  displayDate?: string;
  displayTime?: string;
  totalPrice?: number;
}

// =============================================================================
// User Details (Step 2 of wizard)
// =============================================================================

export interface BookingUserDetails {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  notes?: string;
}

// =============================================================================
// Component Props
// =============================================================================

export interface BookingWidgetProps {
  mode: BookingMode;
  resourceId: string;
  resourceName: string;
  pricePerUnit?: number;
  priceUnit?: string;       // "time", "dag", "stk"
  currency?: string;
  openingHours?: OpeningHour[];
  onSelectionChange: (selection: BookingSelection | null) => void;
  onBook: (selection: BookingSelection) => void;
  availability?: AvailabilityData;
  isLoadingAvailability?: boolean;
  className?: string;
}

export interface WeeklySlotGridProps {
  resourceId: string;
  resourceName: string;
  availability?: SlotAvailability;
  isLoading?: boolean;
  selectedSlots: Array<{ date: string; hour: number }>;
  onSlotToggle: (date: string, hour: number) => void;
  onWeekChange: (startDate: Date) => void;
  currentWeekStart: Date;
  openingHours?: OpeningHour[];
  pricePerHour?: number;
  currency?: string;
}

export interface DayCalendarProps {
  resourceId: string;
  resourceName: string;
  availability?: DayAvailability;
  isLoading?: boolean;
  selectedDate: string | null;
  /** Dates that have been confirmed/added to cart (also shown as selected) */
  confirmedDates?: string[];
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  currentMonth: Date;
  pricePerDay?: number;
  currency?: string;
  /** Hide the built-in month navigation header (use when parent provides navigation) */
  hideHeader?: boolean;
}

export interface PeriodPickerProps {
  resourceId: string;
  resourceName: string;
  availability?: DurationAvailability;
  isLoading?: boolean;
  selectedDate: string | null;
  selectedDuration: number | null;  // minutes
  onDateSelect: (date: string) => void;
  onDurationSelect: (minutes: number) => void;
  onMonthChange: (year: number, month: number) => void;
  currentMonth: Date;
  minDuration?: number;  // minutes
  maxDuration?: number;  // minutes
  pricePerHour?: number;
  currency?: string;
  /** Hide the built-in month navigation header (use when parent provides navigation) */
  hideHeader?: boolean;
}

export interface QuantitySelectorProps {
  resourceId: string;
  resourceName: string;
  availability?: TicketAvailability;
  isLoading?: boolean;
  selectedDate: string | null;
  selectedQuantity: number;
  onDateSelect: (date: string) => void;
  onQuantityChange: (quantity: number) => void;
  onMonthChange: (year: number, month: number) => void;
  currentMonth: Date;
  minQuantity?: number;
  maxQuantity?: number;
  pricePerTicket?: number;
  currency?: string;
  /** Hide the built-in month navigation header (use when parent provides navigation) */
  hideHeader?: boolean;
}

export interface BookingWizardProps {
  selection: BookingSelection;
  resourceId: string;
  resourceName: string;
  pricePerUnit?: number;
  priceUnit?: string;
  currency?: string;
  requiresApproval?: boolean;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
  };
  onComplete: (booking: { id: string; status: string }) => void;
  onCancel: () => void;
  className?: string;
}

// =============================================================================
// Duration Options
// =============================================================================

export const DURATION_OPTIONS = [
  { value: 60, label: '1 time' },
  { value: 120, label: '2 timer' },
  { value: 180, label: '3 timer' },
  { value: 240, label: 'Halvdag (4t)' },
  { value: 480, label: 'Heldag (8t)' },
] as const;

// =============================================================================
// Helper Functions
// =============================================================================

export function formatPrice(amount: number, currency = 'NOK'): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string, locale = 'nb-NO'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Format a date as YYYY-MM-DD in LOCAL timezone (not UTC).
 * This avoids the timezone shift bug with toISOString().
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDates(startDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getMonthDates(year: number, month: number): Array<{ date: string; isCurrentMonth: boolean }> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Array<{ date: string; isCurrentMonth: boolean }> = [];

  // Add days from previous month to start on Monday
  const startDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7
  const daysFromPrevMonth = startDayOfWeek - 1;

  for (let i = daysFromPrevMonth; i > 0; i--) {
    const date = new Date(year, month, 1 - i);
    dates.push({ date: formatLocalDate(date), isCurrentMonth: false });
  }

  // Add days from current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    dates.push({ date: formatLocalDate(date), isCurrentMonth: true });
  }

  // Add days from next month to complete the grid (6 rows x 7 days = 42)
  const remaining = 42 - dates.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    dates.push({ date: formatLocalDate(date), isCurrentMonth: false });
  }

  return dates;
}

export const WEEKDAY_NAMES = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
export const MONTH_NAMES = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
];
