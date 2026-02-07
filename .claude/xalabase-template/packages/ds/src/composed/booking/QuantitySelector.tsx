/**
 * QuantitySelector Component
 *
 * TICKETS mode - Date + quantity stepper
 * - Date picker for event date
 * - Stepper: - [count] + with min=1, max=available
 * - Shows "X av Y tilgjengelig"
 * - Price calculation: count x pricePerUnit
 *
 * Uses proper design tokens for WCAG AAA contrast compliance
 */

import * as React from 'react';
import type { QuantitySelectorProps, TicketAvailability } from './types';
import { getMonthDates, WEEKDAY_NAMES, MONTH_NAMES, formatPrice } from './types';

// =============================================================================
// Helpers
// =============================================================================

function getDateAvailability(
  date: string,
  availability?: TicketAvailability
): { available: number; capacity: number } {
  if (!availability?.days) return { available: 0, capacity: 0 };
  const day = availability.days.find(d => d.date === date);
  return day || { available: 0, capacity: 0 };
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

export function QuantitySelector({
  resourceId: _resourceId,
  resourceName: _resourceName,
  availability,
  isLoading = false,
  selectedDate,
  selectedQuantity,
  onDateSelect,
  onQuantityChange,
  onMonthChange,
  currentMonth,
  minQuantity = 1,
  maxQuantity = 99,
  pricePerTicket,
  currency = 'NOK',
  hideHeader = false,
}: QuantitySelectorProps): React.ReactElement {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthDates = React.useMemo(
    () => getMonthDates(year, month),
    [year, month]
  );

  // Get availability for selected date
  const dateAvailability = React.useMemo(() => {
    if (!selectedDate) return { available: 0, capacity: 0 };
    return getDateAvailability(selectedDate, availability);
  }, [selectedDate, availability]);

  // Calculate effective max quantity
  const effectiveMax = React.useMemo(() => {
    return Math.min(maxQuantity, dateAvailability.available);
  }, [maxQuantity, dateAvailability.available]);

  // Calculate total price
  const totalPrice = React.useMemo(() => {
    if (!pricePerTicket || !selectedQuantity) return null;
    return selectedQuantity * pricePerTicket;
  }, [pricePerTicket, selectedQuantity]);

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
      const { available } = getDateAvailability(date, availability);
      if (available > 0) {
        onDateSelect(date);
        // Reset quantity to 1 when changing date
        onQuantityChange(1);
      }
    },
    [availability, onDateSelect, onQuantityChange]
  );

  const handleDecrement = React.useCallback(() => {
    if (selectedQuantity > minQuantity) {
      onQuantityChange(selectedQuantity - 1);
    }
  }, [selectedQuantity, minQuantity, onQuantityChange]);

  const handleIncrement = React.useCallback(() => {
    if (selectedQuantity < effectiveMax) {
      onQuantityChange(selectedQuantity + 1);
    }
  }, [selectedQuantity, effectiveMax, onQuantityChange]);

  return (
    <div className="quantity-selector">
      {/* Step 1: Select Date */}
      <div className="quantity-selector__section">
        {!hideHeader && (
          <>
            <h3 className="quantity-selector__section-title">1. Velg dato</h3>

            {/* Month navigation */}
            <div className="quantity-selector__month-nav">
              <button
                type="button"
                className="quantity-selector__nav-btn"
                onClick={handlePrevMonth}
                aria-label="Forrige måned"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                </svg>
              </button>
              <span className="quantity-selector__month-label">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                className="quantity-selector__nav-btn"
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
        <div className="quantity-selector__weekdays" role="row">
          {WEEKDAY_NAMES.map(name => (
            <div key={name} className="quantity-selector__weekday" role="columnheader">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="quantity-selector__calendar" role="grid" aria-label="Kalender">
          {monthDates.map(({ date, isCurrentMonth }) => {
            const { available, capacity } = getDateAvailability(date, availability);
            const isPast = isDateInPast(date);
            const isSelected = selectedDate === date;
            const dayNum = new Date(date).getDate();
            const hasTickets = available > 0;
            const isClickable = isCurrentMonth && !isPast && hasTickets;

            return (
              <button
                key={date}
                type="button"
                className={`quantity-selector__day ${!isCurrentMonth ? 'quantity-selector__day--outside' : ''} ${isPast ? 'quantity-selector__day--past' : ''} ${!hasTickets && capacity > 0 ? 'quantity-selector__day--soldout' : ''} ${isSelected ? 'quantity-selector__day--selected' : ''}`}
                onClick={() => handleDateClick(date, isCurrentMonth)}
                disabled={!isClickable}
                aria-selected={isSelected}
                aria-label={`${dayNum}. ${MONTH_NAMES[month]}${hasTickets ? `, ${available} billetter tilgjengelig` : capacity > 0 ? ', utsolgt' : ''}`}
                role="gridcell"
              >
                <span className="quantity-selector__day-number">{dayNum}</span>
                {isCurrentMonth && !isPast && capacity > 0 && (
                  <span className="quantity-selector__day-availability" aria-hidden="true">
                    {hasTickets ? `${available}` : 'Utsolgt'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="quantity-selector__loading" role="status" aria-live="polite">
            <div className="quantity-selector__spinner" aria-hidden="true" />
            <span>Laster tilgjengelighet...</span>
          </div>
        )}
      </div>

      {/* Step 2: Select Quantity */}
      <div className="quantity-selector__section">
        <h3 className="quantity-selector__section-title">2. Velg antall</h3>

        {selectedDate ? (
          <div className="quantity-selector__quantity-control">
            <div className="quantity-selector__stepper" role="group" aria-label="Velg antall billetter">
              <button
                type="button"
                className="quantity-selector__stepper-btn"
                onClick={handleDecrement}
                disabled={selectedQuantity <= minQuantity}
                aria-label="Reduser antall"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </button>
              <span className="quantity-selector__stepper-value" aria-live="polite" aria-atomic="true">
                {selectedQuantity}
              </span>
              <button
                type="button"
                className="quantity-selector__stepper-btn"
                onClick={handleIncrement}
                disabled={selectedQuantity >= effectiveMax}
                aria-label="Øk antall"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                </svg>
              </button>
            </div>

            <p className="quantity-selector__availability-text">
              {dateAvailability.available} av {dateAvailability.capacity} tilgjengelig
            </p>

            {pricePerTicket && (
              <p className="quantity-selector__price-per-unit">
                {formatPrice(pricePerTicket, currency)} per stk
              </p>
            )}
          </div>
        ) : (
          <p className="quantity-selector__placeholder">Velg en dato først</p>
        )}
      </div>

      {/* Summary */}
      {selectedDate && selectedQuantity > 0 && (
        <div className="quantity-selector__summary" role="status" aria-live="polite">
          <div className="quantity-selector__summary-details">
            <span className="quantity-selector__summary-date">
              {new Date(selectedDate).toLocaleDateString('nb-NO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
            <span className="quantity-selector__summary-quantity">
              {selectedQuantity} billett{selectedQuantity !== 1 ? 'er' : ''}
            </span>
          </div>
          {totalPrice !== null && (
            <span className="quantity-selector__summary-price">
              {formatPrice(totalPrice, currency)}
            </span>
          )}
        </div>
      )}

      {/* Styles using proper design tokens */}
      <style>{`
        .quantity-selector {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-6);
        }

        .quantity-selector__section {
          position: relative;
        }

        .quantity-selector__section-title {
          font-size: var(--ds-font-size-md);
          font-weight: 600;
          color: var(--ds-color-neutral-text-default);
          margin: 0 0 var(--ds-spacing-3) 0;
        }

        .quantity-selector__month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--ds-spacing-3);
        }

        .quantity-selector__nav-btn {
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

        .quantity-selector__nav-btn:hover {
          background: var(--ds-color-neutral-surface-hover);
          border-color: var(--ds-color-neutral-border-strong);
        }

        .quantity-selector__nav-btn:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
        }

        .quantity-selector__month-label {
          font-weight: 600;
          font-size: var(--ds-font-size-lg);
          color: var(--ds-color-neutral-text-default);
        }

        .quantity-selector__weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 4px;
        }

        .quantity-selector__weekday {
          text-align: center;
          padding: var(--ds-spacing-2);
          font-size: var(--ds-font-size-xs);
          font-weight: 600;
          text-transform: uppercase;
          color: var(--ds-color-neutral-text-subtle);
          letter-spacing: var(--ds-letter-spacing-wide);
        }

        .quantity-selector__calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .quantity-selector__day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border: 1px solid var(--ds-color-neutral-border-subtle);
          border-radius: var(--ds-border-radius-md);
          background: var(--ds-color-success-surface-default);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: var(--ds-spacing-1);
          min-height: 52px;
        }

        .quantity-selector__day:hover:not(:disabled) {
          background: var(--ds-color-success-surface-hover);
          border-color: var(--ds-color-success-border-default);
        }

        .quantity-selector__day:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
          z-index: 1;
        }

        .quantity-selector__day:disabled {
          cursor: not-allowed;
          background: var(--ds-color-neutral-background-default);
        }

        .quantity-selector__day--outside {
          opacity: 0.35;
          background: var(--ds-color-neutral-background-default);
        }

        .quantity-selector__day--past {
          opacity: 0.35;
          background: var(--ds-color-neutral-surface-default);
        }

        .quantity-selector__day--soldout {
          background: var(--ds-color-danger-surface-default);
        }

        .quantity-selector__day--selected {
          background: var(--ds-color-accent-base-default) !important;
          border-color: var(--ds-color-accent-border-strong) !important;
          color: var(--ds-color-accent-base-contrast-default) !important;
        }

        .quantity-selector__day-number {
          font-size: var(--ds-font-size-sm);
          font-weight: 500;
          color: var(--ds-color-neutral-text-default);
        }

        .quantity-selector__day--selected .quantity-selector__day-number {
          color: inherit;
        }

        .quantity-selector__day-availability {
          font-size: 10px;
          font-weight: 600;
          color: var(--ds-color-success-text-default);
        }

        .quantity-selector__day--soldout .quantity-selector__day-availability {
          color: var(--ds-color-danger-text-default);
          font-size: 9px;
        }

        .quantity-selector__day--selected .quantity-selector__day-availability {
          color: inherit;
        }

        .quantity-selector__loading {
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

        .quantity-selector__spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--ds-color-neutral-border-default);
          border-top-color: var(--ds-color-accent-base-default);
          border-radius: var(--ds-border-radius-full);
          animation: quantity-selector-spin 0.8s linear infinite;
        }

        @keyframes quantity-selector-spin {
          to { transform: rotate(360deg); }
        }

        .quantity-selector__quantity-control {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--ds-spacing-3);
        }

        .quantity-selector__stepper {
          display: flex;
          align-items: center;
          gap: var(--ds-spacing-4);
        }

        .quantity-selector__stepper-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 2px solid var(--ds-color-neutral-border-default);
          border-radius: var(--ds-border-radius-full);
          background: var(--ds-color-neutral-background-default);
          color: var(--ds-color-neutral-text-default);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .quantity-selector__stepper-btn:hover:not(:disabled) {
          border-color: var(--ds-color-accent-border-default);
          background: var(--ds-color-accent-surface-default);
          color: var(--ds-color-accent-text-default);
        }

        .quantity-selector__stepper-btn:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
        }

        .quantity-selector__stepper-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .quantity-selector__stepper-value {
          font-size: var(--ds-font-size-2xl);
          font-weight: 700;
          color: var(--ds-color-neutral-text-default);
          min-width: 56px;
          text-align: center;
        }

        .quantity-selector__availability-text {
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
          margin: 0;
        }

        .quantity-selector__price-per-unit {
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
          margin: 0;
        }

        .quantity-selector__placeholder {
          color: var(--ds-color-neutral-text-subtle);
          font-size: var(--ds-font-size-sm);
          font-style: italic;
          text-align: center;
        }

        .quantity-selector__summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--ds-spacing-4) var(--ds-spacing-5);
          background: var(--ds-color-accent-surface-default);
          border-radius: var(--ds-border-radius-lg);
          border: 1px solid var(--ds-color-accent-border-subtle);
        }

        .quantity-selector__summary-details {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-1);
        }

        .quantity-selector__summary-date {
          font-weight: 500;
          color: var(--ds-color-accent-text-default);
          text-transform: capitalize;
        }

        .quantity-selector__summary-quantity {
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
        }

        .quantity-selector__summary-price {
          font-weight: 700;
          font-size: var(--ds-font-size-xl);
          color: var(--ds-color-accent-text-default);
        }

        @media (max-width: 599px) {
          .quantity-selector__day {
            min-height: 44px;
          }
          .quantity-selector__day-number {
            font-size: var(--ds-font-size-xs);
          }
          .quantity-selector__day-availability {
            font-size: 8px;
          }
          .quantity-selector__summary {
            flex-direction: column;
            gap: var(--ds-spacing-2);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default QuantitySelector;
