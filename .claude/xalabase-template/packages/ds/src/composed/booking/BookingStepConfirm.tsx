/**
 * BookingStepConfirm Component
 *
 * Step 4 of booking wizard - Confirmation
 * - Success state with booking reference
 * - Pending approval state
 * - Action buttons (view booking, book another)
 */

import * as React from 'react';
import type { BookingSelection } from './types';
import { formatPrice } from './types';

export interface BookingStepConfirmProps {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'payment_required';
  selection: BookingSelection;
  currency?: string;
  paymentUrl?: string;
  onViewBooking?: () => void;
  onBookAnother?: () => void;
  onClose?: () => void;
}

export function BookingStepConfirm({
  bookingId,
  status,
  selection,
  currency = 'NOK',
  paymentUrl,
  onViewBooking,
  onBookAnother,
  onClose,
}: BookingStepConfirmProps): React.ReactElement {

  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: (
            <svg className="booking-step-confirm__icon booking-step-confirm__icon--success" width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="currentColor" opacity="0.1" />
              <circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.2" />
              <path d="M22 32l7 7 13-13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          title: 'Booking bekreftet!',
          description: 'Din booking er registrert. Du vil motta en bekreftelse pa e-post.',
        };
      case 'pending':
        return {
          icon: (
            <svg className="booking-step-confirm__icon booking-step-confirm__icon--pending" width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="currentColor" opacity="0.1" />
              <circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.2" />
              <circle cx="32" cy="32" r="4" fill="currentColor" />
              <path d="M32 20v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ),
          title: 'Foresporsel sendt',
          description: 'Din bookingforesporsel er sendt og venter pa godkjenning. Du vil bli varslet nar den er behandlet.',
        };
      case 'payment_required':
        return {
          icon: (
            <svg className="booking-step-confirm__icon booking-step-confirm__icon--payment" width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="currentColor" opacity="0.1" />
              <circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.2" />
              <rect x="20" y="26" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <line x1="20" y1="32" x2="44" y2="32" stroke="currentColor" strokeWidth="2" />
            </svg>
          ),
          title: 'Betaling kreves',
          description: 'Din booking er reservert. Fullfør betalingen for a bekrefte.',
        };
      default:
        return {
          icon: null,
          title: 'Booking',
          description: '',
        };
    }
  };

  const { icon, title, description } = getStatusConfig();

  return (
    <div className="booking-step-confirm">
      {icon}

      <h3 className="booking-step-confirm__title">{title}</h3>
      <p className="booking-step-confirm__description">{description}</p>

      {/* Booking reference */}
      <div className="booking-step-confirm__reference">
        <span className="booking-step-confirm__reference-label">Referanse</span>
        <span className="booking-step-confirm__reference-value">{bookingId}</span>
      </div>

      {/* Booking summary */}
      <div className="booking-step-confirm__summary">
        <div className="booking-step-confirm__summary-item">
          <span className="booking-step-confirm__summary-label">Ressurs</span>
          <span className="booking-step-confirm__summary-value">{selection.resourceName}</span>
        </div>
        {selection.displayDate && (
          <div className="booking-step-confirm__summary-item">
            <span className="booking-step-confirm__summary-label">Dato</span>
            <span className="booking-step-confirm__summary-value booking-step-confirm__summary-value--capitalize">
              {selection.displayDate}
            </span>
          </div>
        )}
        {selection.displayTime && (
          <div className="booking-step-confirm__summary-item">
            <span className="booking-step-confirm__summary-label">Tid</span>
            <span className="booking-step-confirm__summary-value">{selection.displayTime}</span>
          </div>
        )}
        {selection.quantity && (
          <div className="booking-step-confirm__summary-item">
            <span className="booking-step-confirm__summary-label">Antall</span>
            <span className="booking-step-confirm__summary-value">
              {selection.quantity} billett{selection.quantity !== 1 ? 'er' : ''}
            </span>
          </div>
        )}
        {selection.totalPrice !== undefined && (
          <div className="booking-step-confirm__summary-item booking-step-confirm__summary-item--total">
            <span className="booking-step-confirm__summary-label">Totalt</span>
            <span className="booking-step-confirm__summary-value booking-step-confirm__summary-value--price">
              {formatPrice(selection.totalPrice, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="booking-step-confirm__actions">
        {status === 'payment_required' && paymentUrl && (
          <a
            href={paymentUrl}
            className="booking-step-confirm__payment-btn"
          >
            Gå til betaling
          </a>
        )}

        {onViewBooking && status !== 'payment_required' && (
          <button
            type="button"
            className="booking-step-confirm__primary-btn"
            onClick={onViewBooking}
          >
            Se booking
          </button>
        )}

        {onBookAnother && (
          <button
            type="button"
            className="booking-step-confirm__secondary-btn"
            onClick={onBookAnother}
          >
            Book en til
          </button>
        )}

        {onClose && (
          <button
            type="button"
            className="booking-step-confirm__close-btn"
            onClick={onClose}
          >
            Lukk
          </button>
        )}
      </div>

      <style>{`
        .booking-step-confirm {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--ds-spacing-4, 1rem);
          padding: var(--ds-spacing-4, 1rem);
        }

        .booking-step-confirm__icon {
          margin-bottom: var(--ds-spacing-2, 0.5rem);
        }

        .booking-step-confirm__icon--success {
          color: var(--ds-color-success-base-default, #10b981);
        }

        .booking-step-confirm__icon--pending {
          color: var(--ds-color-warning-base-default, #f59e0b);
        }

        .booking-step-confirm__icon--payment {
          color: var(--ds-color-accent-base-default, #3b82f6);
        }

        .booking-step-confirm__title {
          font-size: var(--ds-font-size-xl, 1.25rem);
          font-weight: 700;
          color: var(--ds-color-neutral-text-default, #111827);
          margin: 0;
        }

        .booking-step-confirm__description {
          font-size: var(--ds-font-size-sm, 0.875rem);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
          margin: 0;
          max-width: 300px;
        }

        .booking-step-confirm__reference {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-1, 0.25rem);
          padding: var(--ds-spacing-3, 0.75rem) var(--ds-spacing-4, 1rem);
          background: var(--ds-color-neutral-background-subtle, #f9fafb);
          border-radius: var(--ds-border-radius-md, 6px);
          border: 1px dashed var(--ds-color-neutral-border-default, #d1d5db);
        }

        .booking-step-confirm__reference-label {
          font-size: var(--ds-font-size-xs, 0.75rem);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .booking-step-confirm__reference-value {
          font-size: var(--ds-font-size-lg, 1.125rem);
          font-weight: 700;
          font-family: monospace;
          color: var(--ds-color-neutral-text-default, #111827);
        }

        .booking-step-confirm__summary {
          width: 100%;
          max-width: 320px;
          padding: var(--ds-spacing-3, 0.75rem);
          background: var(--ds-color-neutral-background-subtle, #f9fafb);
          border-radius: var(--ds-border-radius-md, 6px);
          border: 1px solid var(--ds-color-neutral-border-subtle, #e5e7eb);
        }

        .booking-step-confirm__summary-item {
          display: flex;
          justify-content: space-between;
          padding: var(--ds-spacing-2, 0.5rem) 0;
          border-bottom: 1px solid var(--ds-color-neutral-border-subtle, #e5e7eb);
        }

        .booking-step-confirm__summary-item:last-child {
          border-bottom: none;
        }

        .booking-step-confirm__summary-item--total {
          margin-top: var(--ds-spacing-2, 0.5rem);
          padding-top: var(--ds-spacing-3, 0.75rem);
          border-top: 2px solid var(--ds-color-neutral-border-default, #d1d5db);
          border-bottom: none;
        }

        .booking-step-confirm__summary-label {
          font-size: var(--ds-font-size-sm, 0.875rem);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
        }

        .booking-step-confirm__summary-value {
          font-size: var(--ds-font-size-sm, 0.875rem);
          font-weight: 500;
          color: var(--ds-color-neutral-text-default, #111827);
        }

        .booking-step-confirm__summary-value--capitalize {
          text-transform: capitalize;
        }

        .booking-step-confirm__summary-value--price {
          font-size: var(--ds-font-size-md, 1rem);
          font-weight: 700;
          color: var(--ds-color-accent-text-default, #1d4ed8);
        }

        .booking-step-confirm__actions {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-2, 0.5rem);
          width: 100%;
          max-width: 320px;
          margin-top: var(--ds-spacing-2, 0.5rem);
        }

        .booking-step-confirm__payment-btn,
        .booking-step-confirm__primary-btn {
          width: 100%;
          padding: var(--ds-spacing-3, 0.75rem);
          font-size: var(--ds-font-size-md, 1rem);
          font-weight: 600;
          color: white;
          background: var(--ds-color-accent-base-default, #3b82f6);
          border: none;
          border-radius: var(--ds-border-radius-md, 6px);
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: background-color 0.15s;
        }

        .booking-step-confirm__payment-btn:hover,
        .booking-step-confirm__primary-btn:hover {
          background: var(--ds-color-accent-base-hover, #2563eb);
        }

        .booking-step-confirm__secondary-btn {
          width: 100%;
          padding: var(--ds-spacing-3, 0.75rem);
          font-size: var(--ds-font-size-md, 1rem);
          font-weight: 500;
          color: var(--ds-color-neutral-text-default, #111827);
          background: var(--ds-color-neutral-background-default, #fff);
          border: 1px solid var(--ds-color-neutral-border-default, #d1d5db);
          border-radius: var(--ds-border-radius-md, 6px);
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .booking-step-confirm__secondary-btn:hover {
          background: var(--ds-color-neutral-background-subtle, #f3f4f6);
        }

        .booking-step-confirm__close-btn {
          width: 100%;
          padding: var(--ds-spacing-2, 0.5rem);
          font-size: var(--ds-font-size-sm, 0.875rem);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
          background: transparent;
          border: none;
          cursor: pointer;
          text-decoration: underline;
        }

        .booking-step-confirm__close-btn:hover {
          color: var(--ds-color-neutral-text-default, #111827);
        }
      `}</style>
    </div>
  );
}

export default BookingStepConfirm;
