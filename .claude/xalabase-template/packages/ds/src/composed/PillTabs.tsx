/**
 * PillTabs Component
 *
 * A reusable pill-style tab navigation component for wizards, step indicators,
 * and tab navigation. Works in both light and dark themes.
 *
 * @example Basic tabs
 * ```tsx
 * <PillTabs
 *   tabs={[
 *     { id: 'overview', label: 'Overview' },
 *     { id: 'details', label: 'Details' },
 *     { id: 'settings', label: 'Settings' },
 *   ]}
 *   activeTab="overview"
 *   onTabChange={(id) => setActiveTab(id)}
 * />
 * ```
 *
 * @example Wizard steps with numbers
 * ```tsx
 * <PillTabs
 *   tabs={[
 *     { id: 'select', label: 'Select time' },
 *     { id: 'details', label: 'Details' },
 *     { id: 'confirm', label: 'Confirm' },
 *   ]}
 *   activeTab="details"
 *   variant="wizard"
 *   onTabChange={(id) => goToStep(id)}
 * />
 * ```
 */

import * as React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface PillTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Whether this tab is disabled */
  disabled?: boolean;
  /** Optional icon element to show before the label */
  icon?: React.ReactNode;
  /** Optional badge text (e.g., count) to show after the label */
  badge?: string;
}

export interface PillTabsProps {
  /** Array of tab configurations */
  tabs: PillTab[];
  /** ID of the currently active tab */
  activeTab: string;
  /** Callback when a tab is clicked */
  onTabChange: (tabId: string) => void;
  /** Visual variant - 'tabs' for simple tabs, 'wizard' for step indicators with numbers */
  variant?: 'tabs' | 'wizard';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to use compact mobile styling */
  compact?: boolean;
  /** Whether tabs should expand to fill container width */
  fullWidth?: boolean;
  /** Allow clicking active tab to deselect (pass empty string to onTabChange) */
  allowDeselect?: boolean;
  /** ARIA label for the tablist */
  ariaLabel?: string;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// =============================================================================
// Component
// =============================================================================

export function PillTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'tabs',
  size = 'md',
  compact = false,
  fullWidth = true,
  allowDeselect = false,
  ariaLabel = 'Navigation tabs',
  className,
  style,
}: PillTabsProps): React.ReactElement {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  const isSmall = size === 'sm' || compact;
  const isWizard = variant === 'wizard';
  const shouldExpand = fullWidth || isWizard;

  const handleTabClick = (tab: PillTab) => {
    if (tab.disabled) return;
    if (isWizard && tabs.indexOf(tab) > activeIndex) return;

    if (allowDeselect && tab.id === activeTab) {
      onTabChange('');
    } else {
      onTabChange(tab.id);
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 599px) {
          .pill-tabs-container {
            padding: 6px 8px !important;
          }
          .pill-tabs-container .pill-tab-button {
            min-width: 50px !important;
            padding: 8px 10px !important;
            font-size: 0.75rem !important;
            gap: 4px !important;
          }
          .pill-tabs-container .pill-tab-button svg {
            width: 14px !important;
            height: 14px !important;
          }
        }
      `}</style>
      <div
        className={`pill-tabs-container ${className ?? ''}`}
        style={{
          backgroundColor: 'var(--ds-color-pilltabs-bg, var(--ds-color-neutral-surface-hover))',
          borderRadius: 'var(--ds-border-radius-lg)',
          padding: 'var(--ds-spacing-2) var(--ds-spacing-4)',
          border: '1px solid var(--ds-color-pilltabs-border, var(--ds-color-neutral-border-default))',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          ...style,
        }}
      >
      <div
        role="tablist"
        aria-label={ariaLabel}
        style={{
          display: 'flex',
          gap: 'var(--ds-spacing-1, 4px)',
          minWidth: 'max-content',
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isCompleted = isWizard && index < activeIndex;
          const isClickable = !tab.disabled && (isWizard ? index <= activeIndex : true);

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`pill-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`pill-panel-${tab.id}`}
              disabled={!isClickable}
              onClick={() => isClickable && handleTabClick(tab)}
              className="pill-tab-button"
              style={{
                flex: shouldExpand ? 1 : 'none',
                minWidth: isSmall ? '60px' : '100px',
                padding: isSmall
                  ? 'var(--ds-spacing-2, 8px) var(--ds-spacing-3, 12px)'
                  : 'var(--ds-spacing-3, 12px) var(--ds-spacing-5, 20px)',
                borderRadius: 'var(--ds-border-radius-md, 8px)',
                border: 'none',
                cursor: isClickable ? 'pointer' : 'default',
                fontSize: isSmall
                  ? 'var(--ds-font-size-xs, 0.75rem)'
                  : 'var(--ds-font-size-sm, 0.875rem)',
                fontWeight: isActive
                  ? 'var(--ds-font-weight-semibold, 600)'
                  : 'var(--ds-font-weight-medium, 500)',
                transition: 'all 0.2s ease',
                backgroundColor: isActive
                  ? 'var(--ds-color-pilltabs-active-bg, var(--ds-color-accent-base-default))'
                  : isCompleted
                    ? 'var(--ds-color-accent-surface-active)'
                    : 'transparent',
                color: isActive
                  ? 'var(--ds-color-pilltabs-active-text, var(--ds-color-accent-base-contrast-default))'
                  : isCompleted
                    ? 'var(--ds-color-accent-contrast-default)'
                    : 'var(--ds-color-pilltabs-text, var(--ds-color-neutral-text-default))',
                textAlign: 'center',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.12)' : 'none',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--ds-spacing-2, 8px)',
                opacity: !isClickable ? 0.5 : 1,
              }}
            >
              {/* Wizard step number badge */}
              {isWizard && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isSmall ? '18px' : '20px',
                    height: isSmall ? '18px' : '20px',
                    borderRadius: 'var(--ds-border-radius-full, 50%)',
                    backgroundColor: isActive || isCompleted
                      ? 'var(--ds-color-accent-surface-default)'
                      : 'var(--ds-color-neutral-surface-hover)',
                    color: isActive || isCompleted
                      ? 'var(--ds-color-accent-contrast-default)'
                      : 'var(--ds-color-neutral-text-default)',
                    fontSize: isSmall ? '0.65rem' : '0.7rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? '✓' : index + 1}
                </span>
              )}

              {/* Optional icon */}
              {tab.icon && !isWizard && (
                <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                  {tab.icon}
                </span>
              )}

              {/* Label - can be hidden on compact mobile */}
              {(!compact || !isWizard) && <span>{tab.label}</span>}

              {/* Optional badge (e.g., count) */}
              {tab.badge && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: isSmall ? '16px' : '22px',
                    height: isSmall ? '16px' : '22px',
                    padding: '0 6px',
                    borderRadius: 'var(--ds-border-radius-full, 50%)',
                    backgroundColor: isActive
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'var(--ds-color-pilltabs-badge-bg, var(--ds-color-neutral-border-default))',
                    color: isActive
                      ? 'var(--ds-color-pilltabs-active-text, var(--ds-color-accent-base-contrast-default))'
                      : 'var(--ds-color-pilltabs-badge-text, var(--ds-color-neutral-text-default))',
                    fontSize: isSmall ? '0.65rem' : '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}

export default PillTabs;
