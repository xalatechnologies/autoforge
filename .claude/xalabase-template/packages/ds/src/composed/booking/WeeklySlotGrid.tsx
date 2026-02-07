/**
 * WeeklySlotGrid Component
 *
 * SLOTS mode - 7-day weekly grid with hourly cells
 * - Renders 7 columns (Mon-Sun) × configurable rows (default 08:00-21:00)
 * - Each cell shows: available (clickable), booked (grayed), selected (highlighted)
 * - Week navigation arrows
 * - Mobile: horizontal scroll with sticky time column
 *
 * Uses proper design tokens for WCAG AAA contrast compliance
 */

import * as React from 'react';
import type {
  WeeklySlotGridProps,
  SlotAvailability,
  OpeningHour,
} from './types';
import { formatTime, getWeekDates, WEEKDAY_NAMES, formatPrice } from './types';

// =============================================================================
// Helpers
// =============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatWeekRange(startDate: Date): string {
  const endDate = addDays(startDate, 6);
  const startMonth = startDate.toLocaleDateString('nb-NO', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('nb-NO', { month: 'short' });
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startDate.getDate()}. - ${endDate.getDate()}. ${startMonth} ${year}`;
  }
  return `${startDate.getDate()}. ${startMonth} - ${endDate.getDate()}. ${endMonth} ${year}`;
}

function getSlotStatus(
  date: string,
  hour: number,
  availability?: SlotAvailability,
  openingHours?: OpeningHour[]
): 'available' | 'booked' | 'closed' | 'blocked' {
  // Check opening hours first
  if (openingHours) {
    const dayOfWeek = new Date(date).getDay();
    const openingHour = openingHours.find(oh => oh.dayIndex === dayOfWeek);
    if (openingHour?.isClosed) return 'closed';
    if (openingHour) {
      const openHour = parseInt(openingHour.open.split(':')[0], 10);
      const closeHour = parseInt(openingHour.close.split(':')[0], 10);
      if (hour < openHour || hour >= closeHour) return 'closed';
    }
  }

  // Check availability data
  if (availability?.slots) {
    const slot = availability.slots.find(s => s.date === date && s.hour === hour);
    if (slot) {
      return slot.available ? 'available' : 'booked';
    }
  }

  // Default to available if no data
  return 'available';
}

// =============================================================================
// Component
// =============================================================================

export function WeeklySlotGrid({
  resourceId: _resourceId,
  resourceName: _resourceName,
  availability,
  isLoading = false,
  selectedSlots,
  onSlotToggle,
  onWeekChange,
  currentWeekStart,
  openingHours,
  pricePerHour,
  currency = 'NOK',
}: WeeklySlotGridProps): React.ReactElement {
  const weekDates = React.useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Default hours: 08:00 - 21:00
  const hours = React.useMemo(() => {
    const defaultStart = 8;
    const defaultEnd = 21;
    const result: number[] = [];
    for (let h = defaultStart; h < defaultEnd; h++) {
      result.push(h);
    }
    return result;
  }, []);

  const handlePrevWeek = React.useCallback(() => {
    onWeekChange(addDays(currentWeekStart, -7));
  }, [currentWeekStart, onWeekChange]);

  const handleNextWeek = React.useCallback(() => {
    onWeekChange(addDays(currentWeekStart, 7));
  }, [currentWeekStart, onWeekChange]);

  const handleSlotClick = React.useCallback(
    (date: string, hour: number) => {
      const status = getSlotStatus(date, hour, availability, openingHours);
      if (status === 'available') {
        onSlotToggle(date, hour);
      }
    },
    [availability, openingHours, onSlotToggle]
  );

  const isSlotSelected = React.useCallback(
    (date: string, hour: number): boolean => {
      return selectedSlots.some(s => s.date === date && s.hour === hour);
    },
    [selectedSlots]
  );

  // Calculate total price
  const totalPrice = React.useMemo(() => {
    if (!pricePerHour || selectedSlots.length === 0) return null;
    return selectedSlots.length * pricePerHour;
  }, [pricePerHour, selectedSlots.length]);

  return (
    <div className="weekly-slot-grid">
      {/* Header with navigation */}
      <div className="weekly-slot-grid__header">
        <button
          type="button"
          className="weekly-slot-grid__nav-btn"
          onClick={handlePrevWeek}
          aria-label="Forrige uke"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
          </svg>
        </button>
        <span className="weekly-slot-grid__week-label">
          {formatWeekRange(currentWeekStart)}
        </span>
        <button
          type="button"
          className="weekly-slot-grid__nav-btn"
          onClick={handleNextWeek}
          aria-label="Neste uke"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="weekly-slot-grid__scroll-container">
        <table className="weekly-slot-grid__table" role="grid" aria-label="Ukentlig timeplan">
          <thead>
            <tr>
              <th className="weekly-slot-grid__time-header" scope="col">
                Tid
              </th>
              {weekDates.map((date, idx) => {
                const dayDate = new Date(date);
                return (
                  <th key={date} className="weekly-slot-grid__day-header" scope="col">
                    <span className="weekly-slot-grid__day-name">{WEEKDAY_NAMES[idx]}</span>
                    <span className="weekly-slot-grid__day-date">{dayDate.getDate()}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td className="weekly-slot-grid__time-cell">{formatTime(hour)}</td>
                {weekDates.map(date => {
                  const status = getSlotStatus(date, hour, availability, openingHours);
                  const selected = isSlotSelected(date, hour);
                  const isClickable = status === 'available';
                  const statusLabel = status === 'available' ? 'ledig' : status === 'booked' ? 'opptatt' : 'stengt';

                  return (
                    <td
                      key={`${date}-${hour}`}
                      className={`weekly-slot-grid__slot weekly-slot-grid__slot--${status} ${selected ? 'weekly-slot-grid__slot--selected' : ''}`}
                      role="gridcell"
                      aria-selected={selected}
                      aria-disabled={!isClickable}
                      aria-label={`${formatTime(hour)}, ${new Date(date).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'short' })}, ${statusLabel}${selected ? ', valgt' : ''}`}
                      tabIndex={isClickable ? 0 : -1}
                      onClick={() => handleSlotClick(date, hour)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSlotClick(date, hour);
                        }
                      }}
                    >
                      {status === 'booked' && (
                        <span className="weekly-slot-grid__slot-icon" aria-hidden="true">●</span>
                      )}
                      {selected && (
                        <span className="weekly-slot-grid__slot-icon" aria-hidden="true">✓</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div className="weekly-slot-grid__loading" role="status" aria-live="polite">
            <div className="weekly-slot-grid__spinner" aria-hidden="true" />
            <span>Laster tilgjengelighet...</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="weekly-slot-grid__legend" aria-label="Forklaring">
        <div className="weekly-slot-grid__legend-item">
          <span className="weekly-slot-grid__legend-box weekly-slot-grid__legend-box--available" aria-hidden="true" />
          <span>Ledig</span>
        </div>
        <div className="weekly-slot-grid__legend-item">
          <span className="weekly-slot-grid__legend-box weekly-slot-grid__legend-box--booked" aria-hidden="true" />
          <span>Opptatt</span>
        </div>
        <div className="weekly-slot-grid__legend-item">
          <span className="weekly-slot-grid__legend-box weekly-slot-grid__legend-box--selected" aria-hidden="true" />
          <span>Valgt</span>
        </div>
        <div className="weekly-slot-grid__legend-item">
          <span className="weekly-slot-grid__legend-box weekly-slot-grid__legend-box--closed" aria-hidden="true" />
          <span>Stengt</span>
        </div>
      </div>

      {/* Selection summary */}
      {selectedSlots.length > 0 && (
        <div className="weekly-slot-grid__summary" role="status" aria-live="polite">
          <span className="weekly-slot-grid__summary-count">
            {selectedSlots.length} time{selectedSlots.length !== 1 ? 'r' : ''} valgt
          </span>
          {totalPrice !== null && (
            <span className="weekly-slot-grid__summary-price">
              {formatPrice(totalPrice, currency)}
            </span>
          )}
        </div>
      )}

      {/* Styles using proper design tokens */}
      <style>{`
        .weekly-slot-grid {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-4);
        }

        .weekly-slot-grid__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--ds-spacing-2) 0;
        }

        .weekly-slot-grid__nav-btn {
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

        .weekly-slot-grid__nav-btn:hover {
          background: var(--ds-color-neutral-surface-hover);
          border-color: var(--ds-color-neutral-border-strong);
        }

        .weekly-slot-grid__nav-btn:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: 2px;
        }

        .weekly-slot-grid__week-label {
          font-weight: 600;
          font-size: var(--ds-font-size-lg);
          color: var(--ds-color-neutral-text-default);
        }

        .weekly-slot-grid__scroll-container {
          position: relative;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid var(--ds-color-neutral-border-subtle);
          border-radius: var(--ds-border-radius-md);
        }

        .weekly-slot-grid__table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .weekly-slot-grid__time-header,
        .weekly-slot-grid__day-header {
          padding: var(--ds-spacing-2) var(--ds-spacing-3);
          text-align: center;
          font-weight: 600;
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
          background: var(--ds-color-neutral-surface-default);
          border-bottom: 1px solid var(--ds-color-neutral-border-subtle);
        }

        .weekly-slot-grid__time-header {
          width: 60px;
          position: sticky;
          left: 0;
          background: var(--ds-color-neutral-surface-default);
          z-index: 2;
          border-right: 1px solid var(--ds-color-neutral-border-subtle);
        }

        .weekly-slot-grid__day-header {
          min-width: 70px;
        }

        .weekly-slot-grid__day-name {
          display: block;
          font-size: var(--ds-font-size-xs);
          text-transform: uppercase;
          letter-spacing: var(--ds-letter-spacing-wide);
        }

        .weekly-slot-grid__day-date {
          display: block;
          font-size: var(--ds-font-size-lg);
          font-weight: 700;
          color: var(--ds-color-neutral-text-default);
        }

        .weekly-slot-grid__time-cell {
          padding: var(--ds-spacing-2);
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
          text-align: center;
          position: sticky;
          left: 0;
          background: var(--ds-color-neutral-background-default);
          z-index: 1;
          border-right: 1px solid var(--ds-color-neutral-border-subtle);
        }

        .weekly-slot-grid__slot {
          height: 40px;
          border: 1px solid var(--ds-color-neutral-border-subtle);
          text-align: center;
          vertical-align: middle;
          transition: all 0.15s ease;
        }

        .weekly-slot-grid__slot--available {
          background: var(--ds-color-success-surface-default);
          cursor: pointer;
        }

        .weekly-slot-grid__slot--available:hover {
          background: var(--ds-color-success-surface-hover);
          border-color: var(--ds-color-success-border-default);
        }

        .weekly-slot-grid__slot--available:focus-visible {
          outline: 2px solid var(--ds-color-focus-outer);
          outline-offset: -2px;
          z-index: 1;
        }

        .weekly-slot-grid__slot--booked {
          background: var(--ds-color-neutral-surface-default);
          cursor: not-allowed;
        }

        .weekly-slot-grid__slot--closed {
          background: var(--ds-color-neutral-background-subtle);
          cursor: not-allowed;
        }

        .weekly-slot-grid__slot--blocked {
          background: var(--ds-color-warning-surface-default);
          cursor: not-allowed;
        }

        .weekly-slot-grid__slot--selected {
          background: var(--ds-color-accent-base-default) !important;
          border-color: var(--ds-color-accent-border-strong) !important;
          color: var(--ds-color-accent-base-contrast-default);
        }

        .weekly-slot-grid__slot-icon {
          font-size: var(--ds-font-size-xs);
        }

        .weekly-slot-grid__slot--booked .weekly-slot-grid__slot-icon {
          color: var(--ds-color-neutral-text-subtle);
        }

        .weekly-slot-grid__loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--ds-spacing-2);
          background: var(--ds-color-neutral-background-default);
          opacity: 0.95;
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-subtle);
        }

        .weekly-slot-grid__spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--ds-color-neutral-border-default);
          border-top-color: var(--ds-color-accent-base-default);
          border-radius: var(--ds-border-radius-full);
          animation: weekly-slot-grid-spin 0.8s linear infinite;
        }

        @keyframes weekly-slot-grid-spin {
          to { transform: rotate(360deg); }
        }

        .weekly-slot-grid__legend {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ds-spacing-4);
          padding: var(--ds-spacing-3);
          background: var(--ds-color-neutral-surface-default);
          border-radius: var(--ds-border-radius-md);
          border: 1px solid var(--ds-color-neutral-border-subtle);
        }

        .weekly-slot-grid__legend-item {
          display: flex;
          align-items: center;
          gap: var(--ds-spacing-2);
          font-size: var(--ds-font-size-sm);
          color: var(--ds-color-neutral-text-default);
        }

        .weekly-slot-grid__legend-box {
          width: 16px;
          height: 16px;
          border-radius: var(--ds-border-radius-sm);
          border: 1px solid var(--ds-color-neutral-border-subtle);
        }

        .weekly-slot-grid__legend-box--available {
          background: var(--ds-color-success-surface-default);
          border-color: var(--ds-color-success-border-default);
        }

        .weekly-slot-grid__legend-box--booked {
          background: var(--ds-color-neutral-surface-default);
        }

        .weekly-slot-grid__legend-box--selected {
          background: var(--ds-color-accent-base-default);
          border-color: var(--ds-color-accent-border-strong);
        }

        .weekly-slot-grid__legend-box--closed {
          background: var(--ds-color-neutral-background-subtle);
        }

        .weekly-slot-grid__summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--ds-spacing-3) var(--ds-spacing-4);
          background: var(--ds-color-accent-surface-default);
          border-radius: var(--ds-border-radius-md);
          border: 1px solid var(--ds-color-accent-border-subtle);
        }

        .weekly-slot-grid__summary-count {
          font-weight: 500;
          color: var(--ds-color-accent-text-default);
        }

        .weekly-slot-grid__summary-price {
          font-weight: 700;
          font-size: var(--ds-font-size-lg);
          color: var(--ds-color-accent-text-default);
        }

        @media (max-width: 599px) {
          .weekly-slot-grid__table {
            min-width: 500px;
          }
          .weekly-slot-grid__slot {
            height: 36px;
          }
          .weekly-slot-grid__day-header {
            min-width: 55px;
          }
          .weekly-slot-grid__legend {
            gap: var(--ds-spacing-3);
            padding: var(--ds-spacing-2);
          }
        }
      `}</style>
    </div>
  );
}

export default WeeklySlotGrid;
