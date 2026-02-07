/**
 * BookingWizard Component
 *
 * 4-step booking wizard:
 * Step 1: Select Time/Date (mode-specific via BookingWidget)
 * Step 2: Your Details (BookingStepDetails)
 * Step 3: Review & Terms (BookingStepReview)
 * Step 4: Confirmation (BookingStepConfirm)
 */

import * as React from 'react';
import type { BookingWizardProps, BookingUserDetails, BookingSelection } from './types';
import { BookingStepDetails } from './BookingStepDetails';
import { BookingStepReview } from './BookingStepReview';
import { BookingStepConfirm } from './BookingStepConfirm';
import { formatPrice } from './types';

type WizardStep = 'details' | 'review' | 'confirm';

export function BookingWizard({
  selection,
  resourceId: _resourceId,
  resourceName: _resourceName,
  pricePerUnit: _pricePerUnit,
  priceUnit: _priceUnit,
  currency = 'NOK',
  requiresApproval = false,
  user,
  onComplete,
  onCancel,
  className,
}: BookingWizardProps): React.ReactElement {
  const [currentStep, setCurrentStep] = React.useState<WizardStep>('details');
  const [userDetails, setUserDetails] = React.useState<BookingUserDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingResult, setBookingResult] = React.useState<{ id: string; status: string } | null>(null);

  // Handle details form submission
  const handleDetailsSubmit = React.useCallback((details: BookingUserDetails) => {
    setUserDetails(details);
    setCurrentStep('review');
  }, []);

  // Handle back from review
  const handleBackToDetails = React.useCallback(() => {
    setCurrentStep('details');
  }, []);

  // Handle booking submission
  const handleSubmitBooking = React.useCallback(async () => {
    if (!userDetails) return;

    setIsSubmitting(true);
    try {
      // Simulate booking creation - in real usage this would call the SDK
      // The parent component should handle the actual mutation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate a mock booking ID
      const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;
      const status = requiresApproval ? 'pending' : 'confirmed';

      setBookingResult({ id: bookingId, status });
      setCurrentStep('confirm');
      onComplete({ id: bookingId, status });
    } catch (error) {
      console.error('Booking failed:', error);
      // Could show error state here
    } finally {
      setIsSubmitting(false);
    }
  }, [userDetails, requiresApproval, onComplete]);

  // Handle booking another
  const handleBookAnother = React.useCallback(() => {
    onCancel(); // Close wizard and reset
  }, [onCancel]);

  // Get step number for progress indicator
  const getStepNumber = (step: WizardStep): number => {
    switch (step) {
      case 'details': return 2;
      case 'review': return 3;
      case 'confirm': return 4;
      default: return 1;
    }
  };

  return (
    <div className={`booking-wizard ${className || ''}`}>
      {/* Header with progress */}
      <div className="booking-wizard__header">
        <button
          type="button"
          className="booking-wizard__close-btn"
          onClick={onCancel}
          aria-label="Lukk"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="booking-wizard__progress">
          <span className="booking-wizard__progress-text">
            Steg {getStepNumber(currentStep)} av 4
          </span>
          <div className="booking-wizard__progress-bar">
            <div
              className="booking-wizard__progress-fill"
              style={{ width: `${(getStepNumber(currentStep) / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Selection summary (always visible) */}
      {currentStep !== 'confirm' && (
        <div className="booking-wizard__selection-summary">
          <div className="booking-wizard__selection-info">
            <span className="booking-wizard__selection-resource">{selection.resourceName}</span>
            <span className="booking-wizard__selection-details">
              {selection.displayDate}
              {selection.displayTime && ` · ${selection.displayTime}`}
              {selection.quantity && ` · ${selection.quantity} billett${selection.quantity !== 1 ? 'er' : ''}`}
            </span>
          </div>
          {selection.totalPrice !== undefined && (
            <span className="booking-wizard__selection-price">
              {formatPrice(selection.totalPrice, currency)}
            </span>
          )}
        </div>
      )}

      {/* Step content */}
      <div className="booking-wizard__content">
        {currentStep === 'details' && (
          <BookingStepDetails
            initialValues={{
              name: user?.name || '',
              email: user?.email || '',
              phone: user?.phone || '',
              organization: user?.organization || '',
            }}
            onSubmit={handleDetailsSubmit}
            onBack={onCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {currentStep === 'review' && userDetails && (
          <BookingStepReview
            selection={selection}
            userDetails={userDetails}
            currency={currency}
            requiresApproval={requiresApproval}
            onSubmit={handleSubmitBooking}
            onBack={handleBackToDetails}
            isSubmitting={isSubmitting}
          />
        )}

        {currentStep === 'confirm' && bookingResult && (
          <BookingStepConfirm
            bookingId={bookingResult.id}
            status={bookingResult.status as 'confirmed' | 'pending' | 'payment_required'}
            selection={selection}
            currency={currency}
            onViewBooking={() => {
              // Could navigate to booking details
              window.location.href = `/bookings/${bookingResult.id}`;
            }}
            onBookAnother={handleBookAnother}
            onClose={onCancel}
          />
        )}
      </div>

      <style>{`
        .booking-wizard {
          display: flex;
          flex-direction: column;
          background: var(--ds-color-neutral-background-default, #fff);
          border-radius: var(--ds-border-radius-lg, 12px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
        }

        .booking-wizard__header {
          display: flex;
          align-items: center;
          gap: var(--ds-spacing-3, 0.75rem);
          padding: var(--ds-spacing-4, 1rem);
          border-bottom: 1px solid var(--ds-color-neutral-border-subtle, #e5e7eb);
        }

        .booking-wizard__close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: var(--ds-border-radius-full, 9999px);
          background: var(--ds-color-neutral-background-subtle, #f3f4f6);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
          cursor: pointer;
          transition: background-color 0.15s, color 0.15s;
        }

        .booking-wizard__close-btn:hover {
          background: var(--ds-color-neutral-background-default, #e5e7eb);
          color: var(--ds-color-neutral-text-default, #111827);
        }

        .booking-wizard__progress {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-1, 0.25rem);
        }

        .booking-wizard__progress-text {
          font-size: var(--ds-font-size-sm, 0.875rem);
          font-weight: 500;
          color: var(--ds-color-neutral-text-default, #111827);
        }

        .booking-wizard__progress-bar {
          height: 4px;
          background: var(--ds-color-neutral-background-subtle, #e5e7eb);
          border-radius: 2px;
          overflow: hidden;
        }

        .booking-wizard__progress-fill {
          height: 100%;
          background: var(--ds-color-accent-base-default, #3b82f6);
          transition: width 0.3s ease;
        }

        .booking-wizard__selection-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--ds-spacing-3, 0.75rem) var(--ds-spacing-4, 1rem);
          background: var(--ds-color-accent-background-subtle, #eff6ff);
          border-bottom: 1px solid var(--ds-color-accent-border-subtle, #bfdbfe);
        }

        .booking-wizard__selection-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .booking-wizard__selection-resource {
          font-size: var(--ds-font-size-sm, 0.875rem);
          font-weight: 600;
          color: var(--ds-color-accent-text-default, #1d4ed8);
        }

        .booking-wizard__selection-details {
          font-size: var(--ds-font-size-xs, 0.75rem);
          color: var(--ds-color-neutral-text-subtle, #6b7280);
          text-transform: capitalize;
        }

        .booking-wizard__selection-price {
          font-size: var(--ds-font-size-lg, 1.125rem);
          font-weight: 700;
          color: var(--ds-color-accent-text-default, #1d4ed8);
        }

        .booking-wizard__content {
          flex: 1;
          overflow-y: auto;
          padding: var(--ds-spacing-4, 1rem);
        }

        @media (max-width: 599px) {
          .booking-wizard {
            max-width: 100%;
            max-height: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default BookingWizard;
