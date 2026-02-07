/**
 * BookingWidget Component
 *
 * Main widget that routes to the appropriate booking UI based on mode.
 * - SLOTS → WeeklySlotGrid
 * - ALL_DAY → DayCalendar
 * - DURATION → PeriodPicker
 * - TICKETS → QuantitySelector
 */

import * as React from 'react';
import type {
  BookingWidgetProps,
  BookingSelection,
  BookingMode,
  SlotAvailability,
  DayAvailability,
  DurationAvailability,
  TicketAvailability,
} from './types';
import { WeeklySlotGrid } from './WeeklySlotGrid';
import { DayCalendar } from './DayCalendar';
import { PeriodPicker } from './PeriodPicker';
import { QuantitySelector } from './QuantitySelector';

// =============================================================================
// Helpers
// =============================================================================

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// =============================================================================
// Component
// =============================================================================

export function BookingWidget({
  mode,
  resourceId,
  resourceName,
  pricePerUnit,
  priceUnit,
  currency = 'NOK',
  openingHours,
  onSelectionChange,
  onBook,
  availability,
  isLoadingAvailability = false,
  className,
}: BookingWidgetProps): React.ReactElement {
  // State for SLOTS mode
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() => getMonday(new Date()));
  const [selectedSlots, setSelectedSlots] = React.useState<Array<{ date: string; hour: number }>>([]);

  // State for ALL_DAY mode
  const [currentMonth, setCurrentMonth] = React.useState(() => getFirstOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // State for DURATION mode
  const [selectedDuration, setSelectedDuration] = React.useState<number | null>(null);

  // State for TICKETS mode
  const [selectedQuantity, setSelectedQuantity] = React.useState(1);

  // Reset state when mode changes
  React.useEffect(() => {
    setSelectedSlots([]);
    setSelectedDate(null);
    setSelectedDuration(null);
    setSelectedQuantity(1);
    onSelectionChange(null);
  }, [mode, onSelectionChange]);

  // Build selection object based on current state
  const buildSelection = React.useCallback((): BookingSelection | null => {
    switch (mode) {
      case 'SLOTS': {
        if (selectedSlots.length === 0) return null;
        // Sort slots and compute start/end times
        const sorted = [...selectedSlots].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.hour - b.hour;
        });
        const firstSlot = sorted[0];
        const lastSlot = sorted[sorted.length - 1];
        const startTime = new Date(`${firstSlot.date}T${String(firstSlot.hour).padStart(2, '0')}:00:00`).getTime();
        const endTime = new Date(`${lastSlot.date}T${String(lastSlot.hour + 1).padStart(2, '0')}:00:00`).getTime();
        return {
          mode: 'SLOTS',
          resourceId,
          resourceName,
          startTime,
          endTime,
          displayDate: new Date(firstSlot.date).toLocaleDateString('nb-NO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
          displayTime: `${String(firstSlot.hour).padStart(2, '0')}:00 - ${String(lastSlot.hour + 1).padStart(2, '0')}:00`,
          totalPrice: pricePerUnit ? selectedSlots.length * pricePerUnit : undefined,
        };
      }
      case 'ALL_DAY': {
        if (!selectedDate) return null;
        const dateObj = new Date(selectedDate);
        return {
          mode: 'ALL_DAY',
          resourceId,
          resourceName,
          date: selectedDate,
          startTime: dateObj.setHours(0, 0, 0, 0),
          endTime: dateObj.setHours(23, 59, 59, 999),
          displayDate: new Date(selectedDate).toLocaleDateString('nb-NO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          totalPrice: pricePerUnit,
        };
      }
      case 'DURATION': {
        if (!selectedDate || !selectedDuration) return null;
        const startTime = new Date(`${selectedDate}T08:00:00`).getTime(); // Default start at 08:00
        const endTime = startTime + selectedDuration * 60 * 1000;
        return {
          mode: 'DURATION',
          resourceId,
          resourceName,
          date: selectedDate,
          startTime,
          endTime,
          durationMinutes: selectedDuration,
          displayDate: new Date(selectedDate).toLocaleDateString('nb-NO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          displayTime: `${selectedDuration / 60} time${selectedDuration > 60 ? 'r' : ''}`,
          totalPrice: pricePerUnit ? (selectedDuration / 60) * pricePerUnit : undefined,
        };
      }
      case 'TICKETS': {
        if (!selectedDate || selectedQuantity < 1) return null;
        const dateObj = new Date(selectedDate);
        return {
          mode: 'TICKETS',
          resourceId,
          resourceName,
          date: selectedDate,
          startTime: dateObj.setHours(0, 0, 0, 0),
          quantity: selectedQuantity,
          displayDate: new Date(selectedDate).toLocaleDateString('nb-NO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          totalPrice: pricePerUnit ? selectedQuantity * pricePerUnit : undefined,
        };
      }
      default:
        return null;
    }
  }, [mode, resourceId, resourceName, selectedSlots, selectedDate, selectedDuration, selectedQuantity, pricePerUnit]);

  // Update selection when state changes
  React.useEffect(() => {
    const selection = buildSelection();
    onSelectionChange(selection);
  }, [buildSelection, onSelectionChange]);

  // Handler for slot toggle (SLOTS mode)
  const handleSlotToggle = React.useCallback((date: string, hour: number) => {
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.date === date && s.hour === hour);
      if (exists) {
        return prev.filter(s => !(s.date === date && s.hour === hour));
      }
      return [...prev, { date, hour }];
    });
  }, []);

  // Handler for date select (ALL_DAY, DURATION, TICKETS)
  const handleDateSelect = React.useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  // Handler for month change
  const handleMonthChange = React.useCallback((year: number, month: number) => {
    setCurrentMonth(new Date(year, month, 1));
  }, []);

  // Handler for booking
  const handleBook = React.useCallback(() => {
    const selection = buildSelection();
    if (selection) {
      onBook(selection);
    }
  }, [buildSelection, onBook]);

  // Get price unit label
  const getPriceUnitLabel = (m: BookingMode): string => {
    if (priceUnit) return priceUnit;
    switch (m) {
      case 'SLOTS': return 'time';
      case 'ALL_DAY': return 'dag';
      case 'DURATION': return 'time';
      case 'TICKETS': return 'stk';
      default: return '';
    }
  };

  // Check if selection is valid for booking
  const isSelectionValid = React.useMemo(() => {
    const selection = buildSelection();
    return selection !== null;
  }, [buildSelection]);

  return (
    <div className={`booking-widget ${className || ''}`}>
      {/* Mode-specific UI */}
      <div className="booking-widget__selector">
        {mode === 'SLOTS' && (
          <WeeklySlotGrid
            resourceId={resourceId}
            resourceName={resourceName}
            availability={availability as SlotAvailability | undefined}
            isLoading={isLoadingAvailability}
            selectedSlots={selectedSlots}
            onSlotToggle={handleSlotToggle}
            onWeekChange={setCurrentWeekStart}
            currentWeekStart={currentWeekStart}
            openingHours={openingHours}
            pricePerHour={pricePerUnit}
            currency={currency}
          />
        )}

        {mode === 'ALL_DAY' && (
          <DayCalendar
            resourceId={resourceId}
            resourceName={resourceName}
            availability={availability as DayAvailability | undefined}
            isLoading={isLoadingAvailability}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            currentMonth={currentMonth}
            pricePerDay={pricePerUnit}
            currency={currency}
          />
        )}

        {mode === 'DURATION' && (
          <PeriodPicker
            resourceId={resourceId}
            resourceName={resourceName}
            availability={availability as DurationAvailability | undefined}
            isLoading={isLoadingAvailability}
            selectedDate={selectedDate}
            selectedDuration={selectedDuration}
            onDateSelect={handleDateSelect}
            onDurationSelect={setSelectedDuration}
            onMonthChange={handleMonthChange}
            currentMonth={currentMonth}
            pricePerHour={pricePerUnit}
            currency={currency}
          />
        )}

        {mode === 'TICKETS' && (
          <QuantitySelector
            resourceId={resourceId}
            resourceName={resourceName}
            availability={availability as TicketAvailability | undefined}
            isLoading={isLoadingAvailability}
            selectedDate={selectedDate}
            selectedQuantity={selectedQuantity}
            onDateSelect={handleDateSelect}
            onQuantityChange={setSelectedQuantity}
            onMonthChange={handleMonthChange}
            currentMonth={currentMonth}
            pricePerTicket={pricePerUnit}
            currency={currency}
          />
        )}
      </div>

      {/* Book button */}
      <div className="booking-widget__actions">
        {pricePerUnit && (
          <p className="booking-widget__price-info">
            {new Intl.NumberFormat('nb-NO', {
              style: 'currency',
              currency,
              minimumFractionDigits: 0,
            }).format(pricePerUnit)}{' '}
            / {getPriceUnitLabel(mode)}
          </p>
        )}
        <button
          type="button"
          className="booking-widget__book-btn"
          onClick={handleBook}
          disabled={!isSelectionValid}
        >
          Book nå
        </button>
      </div>

      {/* Styles */}
      <style>{`
        .booking-widget {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-6, 1.5rem);
          padding: var(--ds-spacing-4, 1rem);
          background: var(--ds-color-neutral-background-default, #fff);
          border-radius: var(--ds-border-radius-lg, 8px);
          border: 1px solid var(--ds-color-neutral-border-subtle, #e5e7eb);
        }

        .booking-widget__selector {
          flex: 1;
        }

        .booking-widget__actions {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-2, 0.5rem);
          padding-top: var(--ds-spacing-4, 1rem);
          border-top: 1px solid var(--ds-color-neutral-border-subtle, #e5e7eb);
        }

        .booking-widget__price-info {
          margin: 0;
          font-size: var(--ds-font-size-sm, 0.875rem);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
          text-align: center;
        }

        .booking-widget__book-btn {
          width: 100%;
          padding: var(--ds-spacing-3, 0.75rem) var(--ds-spacing-4, 1rem);
          font-size: var(--ds-font-size-md, 1rem);
          font-weight: 600;
          color: white;
          background: var(--ds-color-accent-base-default, #3b82f6);
          border: none;
          border-radius: var(--ds-border-radius-md, 6px);
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .booking-widget__book-btn:hover:not(:disabled) {
          background: var(--ds-color-accent-base-hover, #2563eb);
        }

        .booking-widget__book-btn:disabled {
          background: var(--ds-color-neutral-base-default, #9ca3af);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default BookingWidget;
