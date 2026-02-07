/**
 * BookingStepDetails Component
 *
 * Step 2 of booking wizard - User details form
 * - Name, email, phone (required)
 * - Organization (optional)
 * - Notes (optional)
 * - Pre-filled for logged-in users
 */

import * as React from 'react';
import type { BookingUserDetails } from './types';

export interface BookingStepDetailsProps {
  initialValues?: Partial<BookingUserDetails>;
  onSubmit: (details: BookingUserDetails) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function BookingStepDetails({
  initialValues,
  onSubmit,
  onBack,
  isSubmitting = false,
}: BookingStepDetailsProps): React.ReactElement {
  const [values, setValues] = React.useState<BookingUserDetails>({
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    phone: initialValues?.phone || '',
    organization: initialValues?.organization || '',
    notes: initialValues?.notes || '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof BookingUserDetails, string>>>({});

  const handleChange = React.useCallback((field: keyof BookingUserDetails, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validate = React.useCallback((): boolean => {
    const newErrors: Partial<Record<keyof BookingUserDetails, string>> = {};

    if (!values.name.trim()) {
      newErrors.name = 'Navn er paakrevd';
    }

    if (!values.email.trim()) {
      newErrors.email = 'E-post er paakrevd';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = 'Ugyldig e-postadresse';
    }

    if (!values.phone?.trim()) {
      newErrors.phone = 'Telefon er paakrevd';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
    }
  }, [values, validate, onSubmit]);

  return (
    <form className="booking-step-details" onSubmit={handleSubmit}>
      <h3 className="booking-step-details__title">Dine opplysninger</h3>

      <div className="booking-step-details__field">
        <label htmlFor="booking-name" className="booking-step-details__label">
          Navn <span className="booking-step-details__required">*</span>
        </label>
        <input
          id="booking-name"
          type="text"
          className={`booking-step-details__input ${errors.name ? 'booking-step-details__input--error' : ''}`}
          value={values.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Ditt fulle navn"
          disabled={isSubmitting}
        />
        {errors.name && (
          <span className="booking-step-details__error">{errors.name}</span>
        )}
      </div>

      <div className="booking-step-details__field">
        <label htmlFor="booking-email" className="booking-step-details__label">
          E-post <span className="booking-step-details__required">*</span>
        </label>
        <input
          id="booking-email"
          type="email"
          className={`booking-step-details__input ${errors.email ? 'booking-step-details__input--error' : ''}`}
          value={values.email}
          onChange={e => handleChange('email', e.target.value)}
          placeholder="din@epost.no"
          disabled={isSubmitting}
        />
        {errors.email && (
          <span className="booking-step-details__error">{errors.email}</span>
        )}
      </div>

      <div className="booking-step-details__field">
        <label htmlFor="booking-phone" className="booking-step-details__label">
          Telefon <span className="booking-step-details__required">*</span>
        </label>
        <input
          id="booking-phone"
          type="tel"
          className={`booking-step-details__input ${errors.phone ? 'booking-step-details__input--error' : ''}`}
          value={values.phone}
          onChange={e => handleChange('phone', e.target.value)}
          placeholder="+47 123 45 678"
          disabled={isSubmitting}
        />
        {errors.phone && (
          <span className="booking-step-details__error">{errors.phone}</span>
        )}
      </div>

      <div className="booking-step-details__field">
        <label htmlFor="booking-organization" className="booking-step-details__label">
          Organisasjon
        </label>
        <input
          id="booking-organization"
          type="text"
          className="booking-step-details__input"
          value={values.organization}
          onChange={e => handleChange('organization', e.target.value)}
          placeholder="Valgfritt"
          disabled={isSubmitting}
        />
      </div>

      <div className="booking-step-details__field">
        <label htmlFor="booking-notes" className="booking-step-details__label">
          Merknad
        </label>
        <textarea
          id="booking-notes"
          className="booking-step-details__textarea"
          value={values.notes}
          onChange={e => handleChange('notes', e.target.value)}
          placeholder="Noe vi bor vite?"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="booking-step-details__actions">
        <button
          type="button"
          className="booking-step-details__back-btn"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Tilbake
        </button>
        <button
          type="submit"
          className="booking-step-details__submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Laster...' : 'Fortsett'}
        </button>
      </div>

      <style>{`
        .booking-step-details {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-4, 1rem);
        }

        .booking-step-details__title {
          font-size: var(--ds-font-size-lg, 1.125rem);
          font-weight: 600;
          color: var(--ds-color-neutral-text-default, #111827);
          margin: 0 0 var(--ds-spacing-2, 0.5rem) 0;
        }

        .booking-step-details__field {
          display: flex;
          flex-direction: column;
          gap: var(--ds-spacing-1, 0.25rem);
        }

        .booking-step-details__label {
          font-size: var(--ds-font-size-sm, 0.875rem);
          font-weight: 500;
          color: var(--ds-color-neutral-text-default, #111827);
        }

        .booking-step-details__required {
          color: var(--ds-color-danger-base-default, #ef4444);
        }

        .booking-step-details__input,
        .booking-step-details__textarea {
          padding: var(--ds-spacing-2, 0.5rem) var(--ds-spacing-3, 0.75rem);
          font-size: var(--ds-font-size-md, 1rem);
          border: 1px solid var(--ds-color-neutral-border-default, #d1d5db);
          border-radius: var(--ds-border-radius-md, 6px);
          background: var(--ds-color-neutral-background-default, #fff);
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .booking-step-details__input:focus,
        .booking-step-details__textarea:focus {
          outline: none;
          border-color: var(--ds-color-accent-border-default, #2563eb);
          box-shadow: 0 0 0 3px var(--ds-color-accent-background-subtle, rgba(59, 130, 246, 0.1));
        }

        .booking-step-details__input--error {
          border-color: var(--ds-color-danger-border-default, #ef4444);
        }

        .booking-step-details__input:disabled,
        .booking-step-details__textarea:disabled {
          background: var(--ds-color-neutral-background-subtle, #f9fafb);
          cursor: not-allowed;
        }

        .booking-step-details__textarea {
          resize: vertical;
          min-height: 80px;
        }

        .booking-step-details__error {
          font-size: var(--ds-font-size-xs, 0.75rem);
          color: var(--ds-color-danger-text-default, #dc2626);
        }

        .booking-step-details__actions {
          display: flex;
          gap: var(--ds-spacing-3, 0.75rem);
          margin-top: var(--ds-spacing-2, 0.5rem);
        }

        .booking-step-details__back-btn {
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

        .booking-step-details__back-btn:hover:not(:disabled) {
          background: var(--ds-color-neutral-background-subtle, #f3f4f6);
        }

        .booking-step-details__back-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .booking-step-details__submit-btn {
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

        .booking-step-details__submit-btn:hover:not(:disabled) {
          background: var(--ds-color-accent-base-hover, #2563eb);
        }

        .booking-step-details__submit-btn:disabled {
          background: var(--ds-color-neutral-base-default, #9ca3af);
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}

export default BookingStepDetails;
