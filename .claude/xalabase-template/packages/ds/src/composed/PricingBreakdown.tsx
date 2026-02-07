/**
 * PricingBreakdown Component
 *
 * Displays a comprehensive, transparent breakdown of how a booking price
 * is calculated. Shows all pricing factors clearly to the user.
 */

import * as React from 'react';

// =============================================================================
// Types
// =============================================================================

export type PricingModel =
  | 'per_hour'
  | 'per_day'
  | 'per_half_day'
  | 'per_session'
  | 'per_person'
  | 'per_person_hour'
  | 'per_person_day'
  | 'per_booking'
  | 'tiered_duration'
  | 'tiered_capacity'
  | 'sport_slot';

export interface DurationOption {
  minutes: number;
  label: string;
  price: number;
}

export interface PriceLineItem {
  type: 'base' | 'duration' | 'capacity' | 'addon' | 'fee' | 'person';
  label: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  explanation?: string;
}

export interface PriceDiscount {
  type: 'promo' | 'member' | 'volume' | 'age_group' | 'organization';
  label: string;
  percent?: number;
  amount: number;
}

export interface BookingConstraints {
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  minPeople?: number;
  maxPeople?: number;
  slotDurationMinutes?: number;
}

export interface PricingBreakdownProps {
  /** The pricing model used */
  model: PricingModel;
  /** Currency code */
  currency?: string;
  /** Line items in the breakdown */
  items: PriceLineItem[];
  /** Applied discounts */
  discounts?: PriceDiscount[];
  /** Tax rate (e.g., 0.25 for 25%) */
  taxRate?: number;
  /** Tax amount */
  taxAmount?: number;
  /** Subtotal before tax */
  subtotal: number;
  /** Final total */
  total: number;
  /** Deposit amount (separate from total) */
  deposit?: number;
  /** Booking constraints to display */
  constraints?: BookingConstraints;
  /** Available duration options (for sport_slot model) */
  durationOptions?: DurationOption[];
  /** Human-readable explanation of pricing */
  explanation?: string;
  /** Show detailed calculation breakdown */
  showCalculation?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Icons
// =============================================================================

function InfoIcon({ size = 16 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ClockIcon({ size = 16 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon({ size = 16 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TagIcon({ size = 16 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function getPricingModelLabel(model: PricingModel): string {
  const labels: Record<PricingModel, string> = {
    per_hour: 'Timepris',
    per_day: 'Dagspris',
    per_half_day: 'Halvdagspris',
    per_session: 'Fast pris per økt',
    per_person: 'Pris per person',
    per_person_hour: 'Pris per person/time',
    per_person_day: 'Pris per person/dag',
    per_booking: 'Fast pris per booking',
    tiered_duration: 'Stafflet pris (varighet)',
    tiered_capacity: 'Stafflet pris (antall)',
    sport_slot: 'Sportstid',
  };
  return labels[model] || model;
}

function getPricingModelDescription(model: PricingModel): string {
  const descriptions: Record<PricingModel, string> = {
    per_hour: 'Prisen beregnes basert på antall timer du booker.',
    per_day: 'Fast pris per dag, uavhengig av antall timer.',
    per_half_day: 'Pris for halv dag (inntil 4 timer).',
    per_session: 'Fast pris for hver økt/tidsluke.',
    per_person: 'Prisen beregnes per person som deltar.',
    per_person_hour: 'Prisen beregnes per person per time.',
    per_person_day: 'Prisen beregnes per person per dag.',
    per_booking: 'Fast pris for hele bookingen, uavhengig av varighet eller antall.',
    tiered_duration: 'Rabattert pris ved lengre bookinger.',
    tiered_capacity: 'Prisen varierer basert på gruppestørrelse.',
    sport_slot: 'Velg varighet for din sportstid.',
  };
  return descriptions[model] || '';
}

function formatCurrency(amount: number, currency: string = 'NOK'): string {
  return `${amount.toLocaleString('nb-NO')} ${currency}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return hours === 1 ? '1 time' : `${hours} timer`;
  return `${hours}t ${mins}min`;
}

// =============================================================================
// Component
// =============================================================================

export function PricingBreakdown({
  model,
  currency = 'NOK',
  items,
  discounts = [],
  taxRate,
  taxAmount,
  subtotal,
  total,
  deposit,
  constraints,
  durationOptions,
  explanation,
  showCalculation = true,
  compact = false,
  className,
}: PricingBreakdownProps): React.ReactElement {
  const [showDetails, setShowDetails] = React.useState(!compact);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ds-spacing-4)',
        padding: 'var(--ds-spacing-4)',
        backgroundColor: 'var(--ds-color-neutral-surface-default)',
        borderRadius: 'var(--ds-border-radius-lg)',
        border: '1px solid var(--ds-color-neutral-border-subtle)',
      }}
    >
      {/* Pricing Model Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--ds-spacing-3)',
          borderBottom: '1px solid var(--ds-color-neutral-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-2)' }}>
          <TagIcon size={18} />
          <span style={{ fontWeight: 'var(--ds-font-weight-semibold)', fontSize: 'var(--ds-font-size-md)' }}>
            {getPricingModelLabel(model)}
          </span>
        </div>
        {compact && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ds-color-accent-text-default)',
              cursor: 'pointer',
              fontSize: 'var(--ds-font-size-sm)',
              textDecoration: 'underline',
            }}
          >
            {showDetails ? 'Skjul detaljer' : 'Vis detaljer'}
          </button>
        )}
      </div>

      {/* Pricing Model Description */}
      {showDetails && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--ds-spacing-2)',
            padding: 'var(--ds-spacing-3)',
            backgroundColor: 'var(--ds-color-info-surface-default)',
            borderRadius: 'var(--ds-border-radius-md)',
            border: '1px solid var(--ds-color-info-border-subtle)',
          }}
        >
          <InfoIcon size={16} />
          <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-info-text-default)' }}>
            {explanation || getPricingModelDescription(model)}
          </span>
        </div>
      )}

      {/* Constraints Info */}
      {showDetails && constraints && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-spacing-3)' }}>
          {constraints.minDurationMinutes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-1)' }}>
              <ClockIcon size={14} />
              <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-neutral-text-subtle)' }}>
                Min: {formatDuration(constraints.minDurationMinutes)}
              </span>
            </div>
          )}
          {constraints.maxDurationMinutes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-1)' }}>
              <ClockIcon size={14} />
              <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-neutral-text-subtle)' }}>
                Maks: {formatDuration(constraints.maxDurationMinutes)}
              </span>
            </div>
          )}
          {constraints.minPeople && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-1)' }}>
              <UsersIcon size={14} />
              <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-neutral-text-subtle)' }}>
                Min {constraints.minPeople} pers.
              </span>
            </div>
          )}
          {constraints.maxPeople && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-1)' }}>
              <UsersIcon size={14} />
              <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-neutral-text-subtle)' }}>
                Maks {constraints.maxPeople} pers.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Duration Options (for sport_slot) */}
      {showDetails && durationOptions && durationOptions.length > 0 && (
        <div>
          <span style={{ fontSize: 'var(--ds-font-size-sm)', fontWeight: 'var(--ds-font-weight-medium)', marginBottom: 'var(--ds-spacing-2)', display: 'block' }}>
            Tilgjengelige varigheter:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-spacing-2)' }}>
            {durationOptions.map((opt) => (
              <span
                key={opt.minutes}
                style={{
                  padding: 'var(--ds-spacing-1) var(--ds-spacing-2)',
                  backgroundColor: 'var(--ds-color-neutral-background-default)',
                  border: '1px solid var(--ds-color-neutral-border-default)',
                  borderRadius: 'var(--ds-border-radius-sm)',
                  fontSize: 'var(--ds-font-size-sm)',
                }}
              >
                {opt.label}: {formatCurrency(opt.price, currency)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Line Items */}
      {showCalculation && showDetails && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-2)' }}>
          <span style={{ fontSize: 'var(--ds-font-size-sm)', fontWeight: 'var(--ds-font-weight-medium)', color: 'var(--ds-color-neutral-text-subtle)' }}>
            Prisberegning:
          </span>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: 'var(--ds-spacing-2)',
                backgroundColor: 'var(--ds-color-neutral-background-default)',
                borderRadius: 'var(--ds-border-radius-sm)',
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 'var(--ds-font-size-sm)' }}>{item.label}</span>
                {item.quantity && item.unitPrice && (
                  <span style={{ fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-color-neutral-text-subtle)', display: 'block' }}>
                    {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                  </span>
                )}
                {item.explanation && (
                  <span style={{ fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-color-neutral-text-subtle)', display: 'block', fontStyle: 'italic' }}>
                    {item.explanation}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 'var(--ds-font-size-sm)', fontWeight: 'var(--ds-font-weight-medium)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(item.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Discounts */}
      {showDetails && discounts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-2)' }}>
          <span style={{ fontSize: 'var(--ds-font-size-sm)', fontWeight: 'var(--ds-font-weight-medium)', color: 'var(--ds-color-success-text-default)' }}>
            Rabatter:
          </span>
          {discounts.map((discount, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--ds-spacing-2)',
                backgroundColor: 'var(--ds-color-success-surface-default)',
                borderRadius: 'var(--ds-border-radius-sm)',
              }}
            >
              <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-success-text-default)' }}>
                {discount.label}
                {discount.percent && ` (${discount.percent}%)`}
              </span>
              <span style={{ fontSize: 'var(--ds-font-size-sm)', fontWeight: 'var(--ds-font-weight-medium)', color: 'var(--ds-color-success-text-default)' }}>
                -{formatCurrency(discount.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ds-spacing-2)',
          paddingTop: 'var(--ds-spacing-3)',
          borderTop: '1px solid var(--ds-color-neutral-border-subtle)',
        }}
      >
        {/* Subtotal */}
        {taxAmount !== undefined && taxAmount > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-neutral-text-subtle)' }}>
                Sum før MVA:
              </span>
              <span style={{ fontSize: 'var(--ds-font-size-sm)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-neutral-text-subtle)' }}>
                MVA ({taxRate ? `${taxRate * 100}%` : '25%'}):
              </span>
              <span style={{ fontSize: 'var(--ds-font-size-sm)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(taxAmount, currency)}
              </span>
            </div>
          </>
        )}

        {/* Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--ds-spacing-3)',
            backgroundColor: 'var(--ds-color-accent-surface-default)',
            borderRadius: 'var(--ds-border-radius-md)',
            marginTop: 'var(--ds-spacing-2)',
          }}
        >
          <span style={{ fontWeight: 'var(--ds-font-weight-semibold)', fontSize: 'var(--ds-font-size-md)' }}>
            Totalt å betale:
          </span>
          <span
            style={{
              fontWeight: 'var(--ds-font-weight-bold)',
              fontSize: 'var(--ds-font-size-xl)',
              color: 'var(--ds-color-accent-text-default)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(total, currency)}
          </span>
        </div>

        {/* Deposit */}
        {deposit !== undefined && deposit > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'var(--ds-spacing-2)',
              backgroundColor: 'var(--ds-color-warning-surface-default)',
              borderRadius: 'var(--ds-border-radius-sm)',
              border: '1px solid var(--ds-color-warning-border-subtle)',
            }}
          >
            <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-warning-text-default)' }}>
              Depositum (refunderbart):
            </span>
            <span style={{ fontSize: 'var(--ds-font-size-sm)', fontWeight: 'var(--ds-font-weight-medium)', color: 'var(--ds-color-warning-text-default)' }}>
              {formatCurrency(deposit, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingBreakdown;
