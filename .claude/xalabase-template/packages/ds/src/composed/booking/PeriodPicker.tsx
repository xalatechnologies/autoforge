/**
 * PeriodPicker Component
 *
 * DURATION mode - Date picker + duration dropdown
 * - Calendar for start date selection
 * - Dropdown: "1 time", "2 timer", "Halvdag (4t)", "Heldag (8t)"
 * - Shows calculated end time
 * - Respects openingHours for max duration
 *
 * Uses proper design tokens for WCAG AAA contrast compliance
 */

import * as React from 'react';
import type { PeriodPickerProps, DurationAvailability } from './types';
import { DURATION_OPTIONS, getMonthDates, WEEKDAY_NAMES, MONTH_NAMES, formatPrice } from './types';

// =============================================================================
// Helpers
// =============================================================================

function getDayAvailability(
  date: string,
  availability?: DurationAvailability
): { available: boolean; maxDurationMinutes: number } {
  if (!availability?.days) return { available: true, maxDurationMinutes: 480 };
  const day = availability.days.find(d => d.date === date);
  return day || { available: true, maxDurationMinutes: 480 };
}

function isDateInPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  return date < today;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} time${hours > 1 ? 'r' : ''}`;
  return `${hours}t ${mins}m`;
}

// =============================================================================
// Component
// =============================================================================

export function PeriodPicker({
  resourceId: _resourceId,
  resourceName: _resourceName,
  availability,
  isLoading = false,
  selectedDate,
  selectedDuration,
  onDateSelect,
  onDurationSelect,
  onMonthChange,
  currentMonth,
  minDuration = 60,
  maxDuration = 480,
  pricePerHour,
  currency = 'NOK',
  hideHeader = false,
}: PeriodPickerProps): React.ReactElement {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthDates = React.useMemo(
    () => getMonthDates(year, month),
    [year, month]
  );

  // Get available duration options based on selected date
  const availableDurations = React.useMemo(() => {
    if (!selectedDate) return [];
    const { maxDurationMinutes } = getDayAvailability(selectedDate, availability);
    const effectiveMax = Math.min(maxDurationMinutes, maxDuration);
    return DURATION_OPTIONS.filter(
      opt => opt.value >= minDuration && opt.value <= effectiveMax
    );
  }, [selectedDate, availability, minDuration, maxDuration]);

  // Calculate total price
  const totalPrice = React.useMemo(() => {
    if (!pricePerHour || !selectedDuration) return null;
    return (selectedDuration / 60) * pricePerHour;
  }, [pricePerHour, selectedDuration]);

  const handlePrevMonth = React.useCallback(() => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    onMonthChange(newYear, newMonth);
  }, [year, month, onMonthChange]);

  const handleNextMonth = React.useCallback(() => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    onMonthChange(newYear, newMonth);
  }, [year, month, onMonthChange]);

  const handleDateClick = React.useCallback(
    (date: string, isCurrentMonth: boolean) => {
      if (!isCurrentMonth) return;
      if (isDateInPast(date)) return;
      const { available } = getDayAvailability(date, availability);
      if (available) {
        onDateSelect(date);
      }
    },
    [availability, onDateSelect]
  );

  return (
    <div className="period-picker">
      {/* Step 1: Select Date */}
      <div className="period-picker__section">
        {!hideHeader && (
          <>
            <h3 className="period-picker__section-title">1. Velg dato</h3>

            {/* Month navigation */}
            <div className="period-picker__month-nav">
              <button
                type="button"
                className="period-picker__nav-btn"
                onClick={handlePrevMonth}
                aria-label="Forrige måned"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                </svg>
              </button>
              <span className="period-picker__month-label">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                className="period-picker__nav-btn"
                onClick={handleNextMonth}
                aria-label="Neste måned"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Weekday headers */}
        <div className="period-picker__weekdays" role="row">
          {WEEKDAY_NAMES.map(name => (
            <div key={name} className="period-picker__weekday" role="columnheader">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="period-picker__calendar" role="grid" aria-label="Kalender">
          {monthDates.map(({ date, isCurrentMonth }) => {
            const { available } = getDayAvailability(date, availability);
            const isPast = isDateInPast(date);
            const isSelected = selectedDate === date;
            const dayNum = new Date(date).getDate();
            const isClickable = isCurrentMonth && !isPast && available;

            return (
              <button
                key={date}
                type="button"
                className={`period-picker__day ${!isCurrentMonth ? 'period-picker__day--outside' : ''} ${isPast ? 'period-picker__day--past' : ''} ${!available ? 'period-picker__day--unavailable' : ''} ${isSelected ? 'period-picker__day--selected' : ''}`}
                onClick={() => handleDateClick(date, isCurrentMonth)}
                disabled={!isClickable}
                aria-selected={isSelected}
                aria-label={`${dayNum}. ${MONTH_NAMES[month]}${available ? ', ledig' : ', utilgjengelig'}`}
                role="gridcell"
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="period-picker__loading" role="status" aria-live="polite">
            <div className="period-picker__spinner" aria-hidden="true" />
            <span>Laster tilgjengelighet...</span>
          </div>
        )}
      </div>

      {/* Step 2: Select Duration */}
      <div className="period-picker__section">
        <h3 className="period-picker__section-title">2. Velg varighet</h3>

        {selectedDate ? (
          <div className="period-picker__duration-options" role="radiogroup" aria-label="Velg varighet">
            {availableDurations.length > 0 ? (
              availableDurations.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`period-picker__duration-btn ${selectedDuration === option.value ? 'period-picker__duration-btn--selected' : ''}`}
                  onClick={() => onDurationSelect(option.value)}
                  aria-pressed={selectedDuration === option.value}
                  role="radio"
                  aria-checked={selectedDuration === option.value}
                >
                  <span className="period-picker__duration-label">{option.label}</span>
                  {pricePerHour && (
                    <span className="period-picker__duration-price">
                      {formatPrice((option.value / 60) * pricePerHour, currency)}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="period-picker__no-durations">
                Ingen tilgjengelige varigheter for denne datoen.
              </p>
            )}
          </div>
        ) : (
          <p className="period-picker__placeholder">Velg en dato først</p>
        )}
      </div>

      {/* Summary */}
      {selectedDate && selectedDuration && (
        <div className="period-picker__summary" role="status" aria-live="polite">
          <div className="period-picker__summary-details">
            <span className="period-picker__summary-date">
              {new Date(selectedDate).toLocaleDateString('nb-NO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
            <span className="period-picker__summary-duration">
              {formatDuration(selectedDuration)}
            </span>
          </div>
          {totalPrice !== null && (
            <span className="period-picker__summary-price">
              {formatPrice(totalPrice, currency)}
            </span>
          )}
        </div>
      )}

      {/* Styles using proper design tokens */}
      <style>{`
        .period-picker {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-6);
        }

        .period-picker__section {
          position: relative;
        }

        .period-picker__section-title {
          font-size: var(--ds-font-size-md);
          font-weight: 600;
          color: var(--ds-color-neutral-text-default);
          margin: 0 0 var(--ds-spacing-3) 0;
        }

        .period-picker__month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--ds-spacing-3);
        }

        .period-picker__nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--ds-color-neutral-border-default);
          border-radius: var(--ds-border-radius-md);
          background: var(--ds-color-neutral-background-default);
          color: var(--ds-color-neutral-text-default);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .period-picker__nav-btn:hover {
          background: var(--ds-color-neutral-surface-hover);
          border-color: var(--ds-color-neutral-border-strong);
        }

        .period-picker__nav-btn:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
        }

        .period-picker__month-label {
          font-weight: 600;
          font-size: var(--ds-font-size-lg);
          color: var(--ds-color-neutral-text-default);
        }

        .period-picker__weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 4px;
        }

        .period-picker__weekday {
          text-align: center;
          padding: var(--ds-spacing-2);
          font-size: var(--ds-font-size-xs);
          font-weight: 600;
          text-transform: uppercase;
          color: var(--ds-color-neutral-text-subtle);
          letter-spacing: var(--ds-letter-spacing-wide);
        }

        .period-picker__calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .period-picker__day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--ds-color-neutral-border-subtle);
          border-radius: var(--ds-border-radius-md);
          background: var(--ds-color-neutral-background-default);
          font-size: var(--ds-font-size-sm);
          font-weight: 500;
          color: var(--ds-color-neutral-text-default);
          cursor: pointer;
          transition: all 0.15s ease;
          min-height: 44px;
        }

        .period-picker__day:hover:not(:disabled) {
          background: var(--ds-color-success-surface-hover);
          border-color: var(--ds-color-success-border-default);
        }

        .period-picker__day:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
          z-index: 1;
        }

        .period-picker__day:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .period-picker__day--outside {
          opacity: 0.35;
        }

        .period-picker__day--past {
          opacity: 0.35;
          background: var(--ds-color-neutral-surface-default);
        }

        .period-picker__day--unavailable {
          background: var(--ds-color-danger-surface-default);
          color: var(--ds-color-danger-text-default);
        }

        .period-picker__day--selected {
          background: var(--ds-color-accent-base-default) !important;
          border-color: var(--ds-color-accent-border-strong) !important;
          color: var(--ds-color-accent-base-contrast-default) !important;
        }

        .period-picker__loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--ds-spacing-2);
          background: var(--ds-color-neutral-background-default);
          opacity: 0.95;
          border-radius: var(--ds-border-radius-md);
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
        }

        .period-picker__spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--ds-color-neutral-border-default);
          border-top-color: var(--ds-color-accent-base-default);
          border-radius: var(--ds-border-radius-full);
          animation: period-picker-spin 0.8s linear infinite;
        }

        @keyframes period-picker-spin {
          to { transform: rotate(360deg); }
        }

        .period-picker__duration-options {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ds-spacing-3);
        }

        .period-picker__duration-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--ds-spacing-4) var(--ds-spacing-5);
          border: 2px solid var(--ds-color-neutral-border-default);
          border-radius: var(--ds-border-radius-lg);
          background: var(--ds-color-neutral-background-default);
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 120px;
        }

        .period-picker__duration-btn:hover {
          border-color: var(--ds-color-accent-border-default);
          background: var(--ds-color-accent-surface-default);
        }

        .period-picker__duration-btn:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
        }

        .period-picker__duration-btn--selected {
          border-color: var(--ds-color-accent-border-strong);
          background: var(--ds-color-accent-surface-default);
        }

        .period-picker__duration-label {
          font-weight: 600;
          font-size: var(--ds-font-size-md);
          color: var(--ds-color-neutral-text-default);
        }

        .period-picker__duration-btn--selected .period-picker__duration-label {
          color: var(--ds-color-accent-text-default);
        }

        .period-picker__duration-price {
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
          margin-top: var(--ds-spacing-1);
        }

        .period-picker__placeholder,
        .period-picker__no-durations {
          color: var(--ds-color-neutral-text-subtle);
          font-size: var(--ds-font-size-sm);
          font-style: italic;
        }

        .period-picker__summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--ds-spacing-4) var(--ds-spacing-5);
          background: var(--ds-color-accent-surface-default);
          border-radius: var(--ds-border-radius-lg);
          border: 1px solid var(--ds-color-accent-border-subtle);
        }

        .period-picker__summary-details {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-1);
        }

        .period-picker__summary-date {
          font-weight: 500;
          color: var(--ds-color-accent-text-default);
          text-transform: capitalize;
        }

        .period-picker__summary-duration {
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
        }

        .period-picker__summary-price {
          font-weight: 700;
          font-size: var(--ds-font-size-xl);
          color: var(--ds-color-accent-text-default);
        }

        @media (max-width: 599px) {
          .period-picker__day {
            min-height: 40px;
          }
          .period-picker__duration-btn {
            flex: 1;
            min-width: calc(50% - var(--ds-spacing-2));
          }
          .period-picker__summary {
            flex-direction: column;
            gap: var(--ds-spacing-2);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default PeriodPicker;
