/**
 * Booking Components
 *
 * Multi-mode booking engine supporting:
 * - SLOTS: Weekly hourly grid (for meeting rooms, sports facilities)
 * - ALL_DAY: Day calendar (for venues, party rooms)
 * - DURATION: Period picker with duration selection (for gyms, equipment)
 * - TICKETS: Quantity selector (for events, workshops)
 */

// Main widget - routes to appropriate mode UI
export { BookingWidget } from './BookingWidget';

// Mode-specific selectors
export { WeeklySlotGrid } from './WeeklySlotGrid';
export { DayCalendar } from './DayCalendar';
export { PeriodPicker } from './PeriodPicker';
export { QuantitySelector } from './QuantitySelector';

// Wizard components
export { BookingWizard } from './BookingWizard';
export { BookingStepDetails } from './BookingStepDetails';
export { BookingStepReview } from './BookingStepReview';
export { BookingStepConfirm } from './BookingStepConfirm';

// Types
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
} from './types';

// Helper functions
export {
  formatPrice,
  formatDate,
  formatTime,
  getWeekDates,
  getMonthDates,
  WEEKDAY_NAMES,
  MONTH_NAMES,
  DURATION_OPTIONS,
} from './types';

// Step component props
export type { BookingStepDetailsProps } from './BookingStepDetails';
export type { BookingStepReviewProps } from './BookingStepReview';
export type { BookingStepConfirmProps } from './BookingStepConfirm';
