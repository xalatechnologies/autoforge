/**
 * DayCalendar Component
 *
 * ALL_DAY mode - Month calendar with day availability
 * - Month navigation
 * - Days colored: green (available), yellow (partial), red (booked/blocked)
 * - Click day to select
 * - Shows selected date range if multi-day booking
 *
 * Uses proper design tokens for WCAG AAA contrast compliance
 */

import * as React from 'react';
import type { DayCalendarProps, DayAvailability } from './types';
import { getMonthDates, WEEKDAY_NAMES, MONTH_NAMES, formatPrice } from './types';

// =============================================================================
// Helpers
// =============================================================================

function getDayStatus(
  date: string,
  availability?: DayAvailability
): 'available' | 'partial' | 'booked' | 'blocked' | 'closed' | 'unknown' {
  // If we have availability data, use it
  if (availability?.days) {
    const day = availability.days.find(d => d.date === date);
    if (day?.status) return day.status;
  }
  // Default: past dates are closed, future dates are available
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateObj = new Date(date);
  if (dateObj < today) {
    return 'closed';
  }
  return 'available';
}

function isDateInPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  return date < today;
}

// =============================================================================
// Component
// =============================================================================

export function DayCalendar({
  resourceId: _resourceId,
  resourceName: _resourceName,
  availability,
  isLoading = false,
  selectedDate,
  confirmedDates = [],
  onDateSelect,
  onMonthChange,
  currentMonth,
  pricePerDay,
  currency = 'NOK',
  hideHeader = false,
}: DayCalendarProps): React.ReactElement {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthDates = React.useMemo(
    () => getMonthDates(year, month),
    [year, month]
  );

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
      const status = getDayStatus(date, availability);
      if (status === 'available' || status === 'partial' || status === 'unknown') {
        onDateSelect(date);
      }
    },
    [availability, onDateSelect]
  );

  return (
    <div className="day-calendar">
      {/* Header with navigation */}
      {!hideHeader && (
        <div className="day-calendar__header">
          <button
            type="button"
            className="day-calendar__nav-btn"
            onClick={handlePrevMonth}
            aria-label="Forrige måned"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
            </svg>
          </button>
          <span className="day-calendar__month-label">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            className="day-calendar__nav-btn"
            onClick={handleNextMonth}
            aria-label="Neste måned"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Weekday headers */}
      <div className="day-calendar__weekdays" role="row">
        {WEEKDAY_NAMES.map(name => (
          <div key={name} className="day-calendar__weekday" role="columnheader">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="day-calendar__grid" role="grid" aria-label="Kalender">
        {monthDates.map(({ date, isCurrentMonth }) => {
          const status = getDayStatus(date, availability);
          const isPast = isDateInPast(date);
          const isSelected = selectedDate === date || confirmedDates.includes(date);
          const dayNum = new Date(date).getDate();
          const isClickable =
            isCurrentMonth &&
            !isPast &&
            (status === 'available' || status === 'partial' || status === 'unknown');

          return (
            <button
              key={date}
              type="button"
              className={`day-calendar__day day-calendar__day--${status} ${!isCurrentMonth ? 'day-calendar__day--outside' : ''} ${isPast ? 'day-calendar__day--past' : ''} ${isSelected ? 'day-calendar__day--selected' : ''}`}
              onClick={() => handleDateClick(date, isCurrentMonth)}
              disabled={!isClickable}
              aria-selected={isSelected}
              aria-label={`${dayNum}. ${MONTH_NAMES[month]}${status === 'available' ? ', ledig' : status === 'booked' ? ', opptatt' : ''}`}
              role="gridcell"
            >
              <span className="day-calendar__day-number">{dayNum}</span>
              {isCurrentMonth && !isPast && status !== 'unknown' && (
                <span className={`day-calendar__day-indicator day-calendar__day-indicator--${status}`} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="day-calendar__loading" role="status" aria-live="polite">
          <div className="day-calendar__spinner" aria-hidden="true" />
          <span>Laster tilgjengelighet...</span>
        </div>
      )}

      {/* Legend */}
      <div className="day-calendar__legend" aria-label="Forklaring">
        <div className="day-calendar__legend-item">
          <span className="day-calendar__legend-dot day-calendar__legend-dot--available" aria-hidden="true" />
          <span>Ledig</span>
        </div>
        <div className="day-calendar__legend-item">
          <span className="day-calendar__legend-dot day-calendar__legend-dot--selected" aria-hidden="true" />
          <span>Valgt</span>
        </div>
        <div className="day-calendar__legend-item">
          <span className="day-calendar__legend-dot day-calendar__legend-dot--partial" aria-hidden="true" />
          <span>Reservert</span>
        </div>
        <div className="day-calendar__legend-item">
          <span className="day-calendar__legend-dot day-calendar__legend-dot--booked" aria-hidden="true" />
          <span>Booket</span>
        </div>
        <div className="day-calendar__legend-item">
          <span className="day-calendar__legend-dot day-calendar__legend-dot--blocked" aria-hidden="true" />
          <span>Utilgjengelig</span>
        </div>
        <div className="day-calendar__legend-item">
          <span className="day-calendar__legend-dot day-calendar__legend-dot--closed" aria-hidden="true" />
          <span>Stengt</span>
        </div>
      </div>

      {/* Selection summary */}
      {selectedDate && (
        <div className="day-calendar__summary" role="status" aria-live="polite">
          <span className="day-calendar__summary-date">
            {new Date(selectedDate).toLocaleDateString('nb-NO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
          {pricePerDay && (
            <span className="day-calendar__summary-price">
              {formatPrice(pricePerDay, currency)} / dag
            </span>
          )}
        </div>
      )}

      {/* Styles using proper design tokens */}
      <style>{`
        .day-calendar {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-4);
          position: relative;
        }

        .day-calendar__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--ds-spacing-2) 0;
        }

        .day-calendar__nav-btn {
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

        .day-calendar__nav-btn:hover {
          background: var(--ds-color-neutral-surface-hover);
          border-color: var(--ds-color-neutral-border-strong);
        }

        .day-calendar__nav-btn:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
        }

        .day-calendar__month-label {
          font-weight: 600;
          font-size: var(--ds-font-size-lg);
          color: var(--ds-color-neutral-text-default);
        }

        .day-calendar__weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .day-calendar__weekday {
          text-align: center;
          padding: var(--ds-spacing-2);
          font-size: var(--ds-font-size-xs);
          font-weight: 600;
          text-transform: uppercase;
          color: var(--ds-color-neutral-text-subtle);
          letter-spacing: var(--ds-letter-spacing-wide);
        }

        .day-calendar__grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .day-calendar__day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border: 1px solid var(--ds-color-neutral-border-subtle);
          border-radius: var(--ds-border-radius-md);
          background: var(--ds-color-neutral-background-default);
          color: var(--ds-color-neutral-text-default);
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          min-height: 48px;
        }

        .day-calendar__day:hover:not(:disabled) {
          background: var(--ds-color-neutral-surface-hover);
          border-color: var(--ds-color-neutral-border-default);
        }

        .day-calendar__day:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
          z-index: 1;
        }

        .day-calendar__day:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .day-calendar__day--outside {
          opacity: 0.35;
        }

        .day-calendar__day--past {
          opacity: 0.35;
          background: var(--ds-color-neutral-surface-default);
        }

        .day-calendar__day--selected {
          background: var(--ds-color-accent-base-default) !important;
          border-color: var(--ds-color-accent-border-strong) !important;
          color: var(--ds-color-accent-base-contrast-default) !important;
        }

        .day-calendar__day--available {
          background: var(--ds-color-success-surface-default);
        }

        .day-calendar__day--available:hover:not(:disabled) {
          background: var(--ds-color-success-surface-hover);
        }

        .day-calendar__day--partial {
          background: var(--ds-color-warning-surface-default);
        }

        .day-calendar__day--partial:hover:not(:disabled) {
          background: var(--ds-color-warning-surface-hover);
        }

        .day-calendar__day--booked,
        .day-calendar__day--blocked,
        .day-calendar__day--closed {
          background: var(--ds-color-danger-surface-default);
          cursor: not-allowed;
        }

        .day-calendar__day-number {
          font-size: var(--ds-font-size-sm);
          font-weight: 500;
        }

        .day-calendar__day-indicator {
          width: 6px;
          height: 6px;
          border-radius: var(--ds-border-radius-full);
        }

        .day-calendar__day-indicator--available {
          background: var(--ds-color-success-base-default);
        }

        .day-calendar__day-indicator--partial {
          background: var(--ds-color-warning-base-default);
        }

        .day-calendar__day-indicator--booked,
        .day-calendar__day-indicator--blocked,
        .day-calendar__day-indicator--closed {
          background: var(--ds-color-danger-base-default);
        }

        .day-calendar__loading {
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

        .day-calendar__spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--ds-color-neutral-border-default);
          border-top-color: var(--ds-color-accent-base-default);
          border-radius: var(--ds-border-radius-full);
          animation: day-calendar-spin 0.8s linear infinite;
        }

        @keyframes day-calendar-spin {
          to { transform: rotate(360deg); }
        }

        .day-calendar__legend {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ds-spacing-4);
          padding: var(--ds-spacing-3);
          background: var(--ds-color-neutral-surface-default);
          border-radius: var(--ds-border-radius-md);
          border: 1px solid var(--ds-color-neutral-border-subtle);
        }

        .day-calendar__legend-item {
          display: flex;
          align-items: center;
          gap: var(--ds-spacing-2);
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-default);
        }

        .day-calendar__legend-dot {
          width: 12px;
          height: 12px;
          border-radius: var(--ds-border-radius-full);
          border: 1px solid transparent;
        }

        .day-calendar__legend-dot--available {
          background: var(--ds-color-success-base-default);
        }

        .day-calendar__legend-dot--selected {
          background: var(--ds-color-accent-base-default);
        }

        .day-calendar__legend-dot--partial {
          background: var(--ds-color-warning-base-default);
        }

        .day-calendar__legend-dot--booked {
          background: var(--ds-color-danger-base-default);
        }

        .day-calendar__legend-dot--blocked {
          background: #cbd5e1;
        }

        .day-calendar__legend-dot--closed {
          background: #1e293b;
        }

        .day-calendar__summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--ds-spacing-3) var(--ds-spacing-4);
          background: var(--ds-color-accent-surface-default);
          border-radius: var(--ds-border-radius-md);
          border: 1px solid var(--ds-color-accent-border-subtle);
        }

        .day-calendar__summary-date {
          font-weight: 500;
          color: var(--ds-color-accent-text-default);
          text-transform: capitalize;
        }

        .day-calendar__summary-price {
          font-weight: 700;
          font-size: var(--ds-font-size-lg);
          color: var(--ds-color-accent-text-default);
        }

        @media (max-width: 599px) {
          .day-calendar__day {
            min-height: 40px;
          }
          .day-calendar__day-number {
            font-size: var(--ds-font-size-xs);
          }
          .day-calendar__legend {
            gap: var(--ds-spacing-3);
            padding: var(--ds-spacing-2);
          }
          .day-calendar__summary {
            flex-direction: column;
            gap: var(--ds-spacing-1);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default DayCalendar;
