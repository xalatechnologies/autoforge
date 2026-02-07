/**
 * BookingStepReview Component
 *
 * Step 3 of booking wizard - Review & terms
 * - Summary of booking details
 * - User details
 * - Terms acceptance checkbox
 */

import * as React from 'react';
import type { BookingSelection, BookingUserDetails } from './types';
import { formatPrice } from './types';

export interface BookingStepReviewProps {
  selection: BookingSelection;
  userDetails: BookingUserDetails;
  currency?: string;
  requiresApproval?: boolean;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function BookingStepReview({
  selection,
  userDetails,
  currency = 'NOK',
  requiresApproval = false,
  onSubmit,
  onBack,
  isSubmitting = false,
}: BookingStepReviewProps): React.ReactElement {
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (termsAccepted) {
      onSubmit();
    }
  }, [termsAccepted, onSubmit]);

  const getModeLabel = (mode: string): string => {
    switch (mode) {
      case 'SLOTS': return 'Timebasert';
      case 'ALL_DAY': return 'Heldagsbooking';
      case 'DURATION': return 'Periodebooking';
      case 'TICKETS': return 'Billett';
      default: return mode;
    }
  };

  return (
    <form className="booking-step-review" onSubmit={handleSubmit}>
      <h3 className="booking-step-review__title">Bekreft booking</h3>

      {/* Booking summary */}
      <div className="booking-step-review__section">
        <h4 className="booking-step-review__section-title">Booking</h4>
        <div className="booking-step-review__card">
          <div className="booking-step-review__row">
            <span className="booking-step-review__label">Ressurs</span>
            <span className="booking-step-review__value">{selection.resourceName}</span>
          </div>
          <div className="booking-step-review__row">
            <span className="booking-step-review__label">Type</span>
            <span className="booking-step-review__value">{getModeLabel(selection.mode)}</span>
          </div>
          {selection.displayDate && (
            <div className="booking-step-review__row">
              <span className="booking-step-review__label">Dato</span>
              <span className="booking-step-review__value booking-step-review__value--capitalize">
                {selection.displayDate}
              </span>
            </div>
          )}
          {selection.displayTime && (
            <div className="booking-step-review__row">
              <span className="booking-step-review__label">Tid</span>
              <span className="booking-step-review__value">{selection.displayTime}</span>
            </div>
          )}
          {selection.quantity && (
            <div className="booking-step-review__row">
              <span className="booking-step-review__label">Antall</span>
              <span className="booking-step-review__value">
                {selection.quantity} billett{selection.quantity !== 1 ? 'er' : ''}
              </span>
            </div>
          )}
          {selection.totalPrice !== undefined && (
            <div className="booking-step-review__row booking-step-review__row--total">
              <span className="booking-step-review__label">Totalt</span>
              <span className="booking-step-review__value booking-step-review__value--price">
                {formatPrice(selection.totalPrice, currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* User details */}
      <div className="booking-step-review__section">
        <h4 className="booking-step-review__section-title">Kontaktinformasjon</h4>
        <div className="booking-step-review__card">
          <div className="booking-step-review__row">
            <span className="booking-step-review__label">Navn</span>
            <span className="booking-step-review__value">{userDetails.name}</span>
          </div>
          <div className="booking-step-review__row">
            <span className="booking-step-review__label">E-post</span>
            <span className="booking-step-review__value">{userDetails.email}</span>
          </div>
          <div className="booking-step-review__row">
            <span className="booking-step-review__label">Telefon</span>
            <span className="booking-step-review__value">{userDetails.phone}</span>
          </div>
          {userDetails.organization && (
            <div className="booking-step-review__row">
              <span className="booking-step-review__label">Organisasjon</span>
              <span className="booking-step-review__value">{userDetails.organization}</span>
            </div>
          )}
          {userDetails.notes && (
            <div className="booking-step-review__row">
              <span className="booking-step-review__label">Merknad</span>
              <span className="booking-step-review__value">{userDetails.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Approval notice */}
      {requiresApproval && (
        <div className="booking-step-review__notice">
          <svg className="booking-step-review__notice-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p>
            Denne bookingen krever godkjenning. Du vil motta en bekreftelse nar bookingen er behandlet.
          </p>
        </div>
      )}

      {/* Terms checkbox */}
      <label className="booking-step-review__terms">
        <input
          type="checkbox"
          className="booking-step-review__terms-checkbox"
          checked={termsAccepted}
          onChange={e => setTermsAccepted(e.target.checked)}
          disabled={isSubmitting}
        />
        <span className="booking-step-review__terms-text">
          Jeg godtar{' '}
          <a href="/vilkar" target="_blank" rel="noopener noreferrer">
            vilkar og betingelser
          </a>
        </span>
      </label>

      {/* Actions */}
      <div className="booking-step-review__actions">
        <button
          type="button"
          className="booking-step-review__back-btn"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Tilbake
        </button>
        <button
          type="submit"
          className="booking-step-review__submit-btn"
          disabled={!termsAccepted || isSubmitting}
        >
          {isSubmitting ? 'Behandler...' : requiresApproval ? 'Send forespørsel' : 'Bekreft booking'}
        </button>
      </div>

      <style>{`
        .booking-step-review {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-4, 1rem);
        }

        .booking-step-review__title {
          font-size: var(--ds-font-size-lg, 1.125rem);
          font-weight: 600;
          color: var(--ds-color-neutral-text-default, #111827);
          margin: 0;
        }

        .booking-step-review__section {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-2, 0.5rem);
        }

        .booking-step-review__section-title {
          font-size: var(--ds-font-size-sm, 0.875rem);
          font-weight: 600;
          color: var(--ds-color-neutral-text-subtle, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .booking-step-review__card {
          padding: var(--ds-spacing-3, 0.75rem);
          background: var(--ds-color-neutral-background-subtle, #f9fafb);
          border-radius: var(--ds-border-radius-md, 6px);
          border: 1px solid var(--ds-color-neutral-border-subtle, #e5e7eb);
        }

        .booking-step-review__row {
          display: flex;
          justify-content: space-between;
          padding: var(--ds-spacing-2, 0.5rem) 0;
          border-bottom: 1px solid var(--ds-color-neutral-border-subtle, #e5e7eb);
        }

        .booking-step-review__row:last-child {
          border-bottom: none;
        }

        .booking-step-review__row--total {
          margin-top: var(--ds-spacing-2, 0.5rem);
          padding-top: var(--ds-spacing-3, 0.75rem);
          border-top: 2px solid var(--ds-color-neutral-border-default, #d1d5db);
          border-bottom: none;
        }

        .booking-step-review__label {
          font-size: var(--ds-font-size-sm, 0.875rem);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
        }

        .booking-step-review__value {
          font-size: var(--ds-font-size-sm, 0.875rem);
          font-weight: 500;
          color: var(--ds-color-neutral-text-default, #111827);
          text-align: right;
        }

        .booking-step-review__value--capitalize {
          text-transform: capitalize;
        }

        .booking-step-review__value--price {
          font-size: var(--ds-font-size-md, 1rem);
          font-weight: 700;
          color: var(--ds-color-accent-text-default, #1d4ed8);
        }

        .booking-step-review__notice {
          display: flex;
          gap: var(--ds-spacing-2, 0.5rem);
          padding: var(--ds-spacing-3, 0.75rem);
          background: var(--ds-color-info-background-subtle, #eff6ff);
          border-radius: var(--ds-border-radius-md, 6px);
          border: 1px solid var(--ds-color-info-border-subtle, #bfdbfe);
        }

        .booking-step-review__notice-icon {
          flex-shrink: 0;
          color: var(--ds-color-info-base-default, #3b82f6);
        }

        .booking-step-review__notice p {
          margin: 0;
          font-size: var(--ds-font-size-sm, 0.875rem);
          color: var(--ds-color-info-text-default, #1e40af);
        }

        .booking-step-review__terms {
          display: flex;
          align-items: flex-start;
          gap: var(--ds-spacing-2, 0.5rem);
          cursor: pointer;
        }

        .booking-step-review__terms-checkbox {
          margin-top: 2px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .booking-step-review__terms-text {
          font-size: var(--ds-font-size-sm, 0.875rem);
          color: var(--ds-color-neutral-text-default, #111827);
        }

        .booking-step-review__terms-text a {
          color: var(--ds-color-accent-text-default, #2563eb);
          text-decoration: underline;
        }

        .booking-step-review__actions {
          display: flex;
          gap: var(--ds-spacing-3, 0.75rem);
          margin-top: var(--ds-spacing-2, 0.5rem);
        }

        .booking-step-review__back-btn {
          flex: 1;
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

        .booking-step-review__back-btn:hover:not(:disabled) {
          background: var(--ds-color-neutral-background-subtle, #f3f4f6);
        }

        .booking-step-review__back-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .booking-step-review__submit-btn {
          flex: 2;
          padding: var(--ds-spacing-3, 0.75rem);
          font-size: var(--ds-font-size-md, 1rem);
          font-weight: 600;
          color: white;
          background: var(--ds-color-accent-base-default, #3b82f6);
          border: none;
          border-radius: var(--ds-border-radius-md, 6px);
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .booking-step-review__submit-btn:hover:not(:disabled) {
          background: var(--ds-color-accent-base-hover, #2563eb);
        }

        .booking-step-review__submit-btn:disabled {
          background: var(--ds-color-neutral-base-default, #9ca3af);
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}

export default BookingStepReview;
