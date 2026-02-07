/**
 * CrudWizard Component
 *
 * A reusable wizard component for step-based CRUD workflows. Combines PillTabs
 * for step navigation with action dropdowns and content panels.
 *
 * @example Basic CRUD wizard
 * ```tsx
 * <CrudWizard
 *   title="Create Resource"
 *   steps={[
 *     { id: 'basic', label: 'Basic Info', content: <BasicInfoForm /> },
 *     { id: 'details', label: 'Details', content: <DetailsForm /> },
 *     { id: 'review', label: 'Review', content: <ReviewPanel /> },
 *   ]}
 *   activeStep="basic"
 *   onStepChange={setStep}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 *   isLoading={saving}
 * />
 * ```
 *
 * @example With validation
 * ```tsx
 * <CrudWizard
 *   steps={[
 *     { id: 'info', label: 'Info', content: <InfoForm />, isValid: infoValid },
 *     { id: 'confirm', label: 'Confirm', content: <Confirm />, isValid: true },
 *   ]}
 *   activeStep={currentStep}
 *   onStepChange={handleStepChange}
 *   requireValidationToProgress
 * />
 * ```
 */

import * as React from 'react';
import { PillTabs, PillTab } from './PillTabs';

// =============================================================================
// Types
// =============================================================================

export interface CrudWizardStep {
    /** Unique identifier for the step */
    id: string;
    /** Display label for the step tab */
    label: string;
    /** Content to render when this step is active */
    content: React.ReactNode;
    /** Whether this step's form data is valid (for requireValidationToProgress) */
    isValid?: boolean;
    /** Optional icon for the step tab */
    icon?: React.ReactNode;
    /** Description shown below the step content header */
    description?: string;
}

export interface CrudWizardAction {
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Icon to show before label */
    icon?: React.ReactNode;
    /** Action handler */
    onClick: () => void;
    /** Whether this action is disabled */
    disabled?: boolean;
    /** Color variant */
    variant?: 'default' | 'danger';
}

export interface CrudWizardLabels {
    /** Navigation button labels */
    back?: string;
    next?: string;
    save?: string;
    cancel?: string;
    /** Step counter format, e.g., "Step {current} of {total}" */
    stepCounter?: string;
}

export interface CrudWizardProps {
    /** Optional title displayed above the wizard */
    title?: string;
    /** Array of wizard steps */
    steps: CrudWizardStep[];
    /** ID of the currently active step */
    activeStep: string;
    /** Callback when step changes */
    onStepChange: (stepId: string) => void;
    /** Called when save/submit is clicked on last step */
    onSave?: () => void;
    /** Called when cancel is clicked */
    onCancel?: () => void;
    /** Whether to require step validation before allowing progress */
    requireValidationToProgress?: boolean;
    /** Whether the wizard is in a loading/saving state */
    isLoading?: boolean;
    /** Additional actions available in the header dropdown */
    actions?: CrudWizardAction[];
    /** Label customization */
    labels?: CrudWizardLabels;
    /** Size variant */
    size?: 'sm' | 'md';
    /** Whether to show the step counter below tabs */
    showStepCounter?: boolean;
    /** Whether to show navigation buttons (back/next) */
    showNavigation?: boolean;
    /** Additional CSS class name */
    className?: string;
    /** Additional inline styles */
    style?: React.CSSProperties;
}

// =============================================================================
// Default Labels
// =============================================================================

const DEFAULT_LABELS: Required<CrudWizardLabels> = {
    back: 'Tilbake',
    next: 'Neste',
    save: 'Lagre',
    cancel: 'Avbryt',
    stepCounter: 'Steg {current} av {total}',
};

// =============================================================================
// Icons
// =============================================================================

function ChevronLeftIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

function ChevronRightIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function MoreVerticalIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    );
}

// =============================================================================
// Component
// =============================================================================

export function CrudWizard({
    title,
    steps,
    activeStep,
    onStepChange,
    onSave,
    onCancel,
    requireValidationToProgress = false,
    isLoading = false,
    actions = [],
    labels,
    size = 'md',
    showStepCounter = true,
    showNavigation = true,
    className,
    style,
}: CrudWizardProps): React.ReactElement {
    const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
    const [actionsOpen, setActionsOpen] = React.useState(false);
    const actionsRef = React.useRef<HTMLDivElement>(null);

    const isSmall = size === 'sm';
    const activeIndex = steps.findIndex((s) => s.id === activeStep);
    const activeStepData = steps[activeIndex];
    const isFirstStep = activeIndex === 0;
    const isLastStep = activeIndex === steps.length - 1;

    // Close actions dropdown on outside click
    React.useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setActionsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Build PillTabs from steps
    const pillTabs: PillTab[] = steps.map((step, index) => ({
        id: step.id,
        label: step.label,
        icon: step.icon,
        // In wizard mode, disable steps that haven't been reached
        disabled: requireValidationToProgress && index > activeIndex,
    }));

    // Can we proceed to next step?
    const canProceed = !requireValidationToProgress || activeStepData?.isValid !== false;

    const handleBack = () => {
        if (!isFirstStep) {
            onStepChange(steps[activeIndex - 1].id);
        }
    };

    const handleNext = () => {
        if (isLastStep && onSave) {
            onSave();
        } else if (!isLastStep && canProceed) {
            onStepChange(steps[activeIndex + 1].id);
        }
    };

    // Format step counter
    const stepCounterText = resolvedLabels.stepCounter
        .replace('{current}', String(activeIndex + 1))
        .replace('{total}', String(steps.length));

    return (
        <div
            className={className}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--ds-spacing-4)',
                ...style,
            }}
        >
            {/* Header with title and actions */}
            {(title || actions.length > 0 || onCancel) && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--ds-spacing-4)',
                    }}
                >
                    {title && (
                        <h2
                            style={{
                                margin: 0,
                                fontSize: isSmall ? 'var(--ds-font-size-lg)' : 'var(--ds-font-size-xl)',
                                fontWeight: 'var(--ds-font-weight-semibold)',
                                color: 'var(--ds-color-neutral-text-default)',
                            }}
                        >
                            {title}
                        </h2>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--ds-spacing-2)', alignItems: 'center' }}>
                        {/* Cancel button */}
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isLoading}
                                style={{
                                    padding: isSmall ? 'var(--ds-spacing-2) var(--ds-spacing-3)' : 'var(--ds-spacing-2) var(--ds-spacing-4)',
                                    fontSize: isSmall ? 'var(--ds-font-size-xs)' : 'var(--ds-font-size-sm)',
                                    fontWeight: 'var(--ds-font-weight-medium)',
                                    color: 'var(--ds-color-neutral-text-default)',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--ds-color-neutral-border-default)',
                                    borderRadius: 'var(--ds-border-radius-md)',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.5 : 1,
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {resolvedLabels.cancel}
                            </button>
                        )}

                        {/* Actions dropdown */}
                        {actions.length > 0 && (
                            <div ref={actionsRef} style={{ position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setActionsOpen(!actionsOpen)}
                                    aria-expanded={actionsOpen}
                                    aria-haspopup="menu"
                                    aria-label="More actions"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: isSmall ? '32px' : '36px',
                                        height: isSmall ? '32px' : '36px',
                                        padding: 0,
                                        backgroundColor: 'var(--ds-color-neutral-surface-default)',
                                        border: '1px solid var(--ds-color-neutral-border-default)',
                                        borderRadius: 'var(--ds-border-radius-md)',
                                        cursor: 'pointer',
                                        color: 'var(--ds-color-neutral-text-default)',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <MoreVerticalIcon size={isSmall ? 14 : 16} />
                                </button>

                                {/* Actions menu */}
                                {actionsOpen && (
                                    <div
                                        role="menu"
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 4px)',
                                            right: 0,
                                            minWidth: '180px',
                                            backgroundColor: 'var(--ds-color-neutral-background-default)',
                                            border: '1px solid var(--ds-color-neutral-border-default)',
                                            borderRadius: 'var(--ds-border-radius-lg)',
                                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                                            zIndex: 100,
                                            overflow: 'hidden',
                                            animation: 'crudWizardFadeIn 0.15s ease',
                                        }}
                                    >
                                        <style>{`
                      @keyframes crudWizardFadeIn {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                                        {actions.map((action) => (
                                            <button
                                                key={action.id}
                                                type="button"
                                                role="menuitem"
                                                disabled={action.disabled}
                                                onClick={() => {
                                                    setActionsOpen(false);
                                                    action.onClick();
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--ds-spacing-2)',
                                                    width: '100%',
                                                    padding: 'var(--ds-spacing-3) var(--ds-spacing-4)',
                                                    fontSize: 'var(--ds-font-size-sm)',
                                                    fontWeight: 'var(--ds-font-weight-regular)',
                                                    color: action.variant === 'danger'
                                                        ? 'var(--ds-color-danger-text-default)'
                                                        : 'var(--ds-color-neutral-text-default)',
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                                                    opacity: action.disabled ? 0.5 : 1,
                                                    transition: 'background-color 0.1s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--ds-color-neutral-surface-hover)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                {action.icon && <span>{action.icon}</span>}
                                                <span>{action.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step tabs */}
            <PillTabs
                tabs={pillTabs}
                activeTab={activeStep}
                onTabChange={onStepChange}
                variant="wizard"
                size={size}
                ariaLabel="Wizard steps"
            />

            {/* Step counter */}
            {showStepCounter && (
                <div
                    style={{
                        textAlign: 'center',
                        fontSize: 'var(--ds-font-size-xs)',
                        color: 'var(--ds-color-neutral-text-subtle)',
                    }}
                >
                    {stepCounterText}
                </div>
            )}

            {/* Step content */}
            <div
                role="tabpanel"
                id={`pill-panel-${activeStep}`}
                aria-labelledby={`pill-tab-${activeStep}`}
                style={{
                    flex: 1,
                    minHeight: 0,
                }}
            >
                {/* Step header with description */}
                {activeStepData?.description && (
                    <p
                        style={{
                            margin: '0 0 var(--ds-spacing-4) 0',
                            fontSize: 'var(--ds-font-size-sm)',
                            color: 'var(--ds-color-neutral-text-subtle)',
                        }}
                    >
                        {activeStepData.description}
                    </p>
                )}

                {/* Step content */}
                {activeStepData?.content}
            </div>

            {/* Navigation buttons */}
            {showNavigation && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 'var(--ds-spacing-4)',
                        borderTop: '1px solid var(--ds-color-neutral-border-subtle)',
                    }}
                >
                    {/* Back button */}
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={isFirstStep || isLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--ds-spacing-1)',
                            padding: isSmall ? 'var(--ds-spacing-2) var(--ds-spacing-3)' : 'var(--ds-spacing-2) var(--ds-spacing-4)',
                            fontSize: isSmall ? 'var(--ds-font-size-xs)' : 'var(--ds-font-size-sm)',
                            fontWeight: 'var(--ds-font-weight-medium)',
                            color: 'var(--ds-color-neutral-text-default)',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--ds-color-neutral-border-default)',
                            borderRadius: 'var(--ds-border-radius-md)',
                            cursor: isFirstStep || isLoading ? 'not-allowed' : 'pointer',
                            opacity: isFirstStep ? 0.5 : 1,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <ChevronLeftIcon size={isSmall ? 14 : 16} />
                        {resolvedLabels.back}
                    </button>

                    {/* Next/Save button */}
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={isLoading || (!canProceed && !isLastStep)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--ds-spacing-1)',
                            padding: isSmall ? 'var(--ds-spacing-2) var(--ds-spacing-4)' : 'var(--ds-spacing-2) var(--ds-spacing-5)',
                            fontSize: isSmall ? 'var(--ds-font-size-xs)' : 'var(--ds-font-size-sm)',
                            fontWeight: 'var(--ds-font-weight-semibold)',
                            color: 'var(--ds-color-accent-base-contrast-default)',
                            backgroundColor: 'var(--ds-color-accent-base-default)',
                            border: 'none',
                            borderRadius: 'var(--ds-border-radius-md)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {isLoading && (
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: isSmall ? '12px' : '14px',
                                    height: isSmall ? '12px' : '14px',
                                    border: '2px solid currentColor',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'crudWizardSpin 0.8s linear infinite',
                                }}
                            />
                        )}
                        {isLastStep ? resolvedLabels.save : resolvedLabels.next}
                        {!isLastStep && <ChevronRightIcon size={isSmall ? 14 : 16} />}
                    </button>
                </div>
            )}

            <style>{`
        @keyframes crudWizardSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default CrudWizard;
