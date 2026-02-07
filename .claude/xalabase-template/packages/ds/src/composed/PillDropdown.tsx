/**
 * PillDropdown Component
 *
 * A dropdown component styled to match PillTabs height and appearance.
 * Used for location selectors, filters, and other dropdown needs that
 * need to align visually with PillTabs.
 *
 * @example Basic usage
 * ```tsx
 * <PillDropdown
 *   icon={<MapPinIcon size={16} />}
 *   label="Oslo"
 *   suffix="50 resultater"
 *   options={[
 *     { value: '', label: 'Alle steder' },
 *     { value: 'oslo', label: 'Oslo', count: 25 },
 *     { value: 'bergen', label: 'Bergen', count: 15 },
 *   ]}
 *   value=""
 *   onChange={(value) => setLocation(value)}
 *   searchable
 *   searchPlaceholder="Søk etter sted..."
 * />
 * ```
 */

import * as React from 'react';
import { createPortal } from 'react-dom';

// =============================================================================
// Types
// =============================================================================

export interface PillDropdownOption {
  /** Value for this option */
  value: string;
  /** Display label */
  label: string;
  /** Optional count to show as badge */
  count?: number;
}

export interface PillDropdownLabels {
  /** Text shown when search yields no results */
  noResults?: string;
  /** Default search placeholder */
  searchPlaceholder?: string;
}

export interface PillDropdownProps {
  /** Icon to show before the label */
  icon?: React.ReactNode;
  /** Main label text (or selected option label) */
  label: string;
  /** Optional suffix text after the label (e.g., "50 resultater") */
  suffix?: string;
  /** Dropdown options */
  options: PillDropdownOption[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Size variant to match PillTabs */
  size?: 'sm' | 'md';
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Enable search input in dropdown */
  searchable?: boolean;
  /** Placeholder for search input (overrides labels.searchPlaceholder) */
  searchPlaceholder?: string;
  /** Localized labels for UI text */
  labels?: PillDropdownLabels;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// =============================================================================
// Icons
// =============================================================================

function ChevronDownIcon({ size = 14 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SearchIcon({ size = 16 }: { size?: number }): React.ReactElement {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// =============================================================================
// Component
// =============================================================================

const DEFAULT_LABELS: Required<PillDropdownLabels> = {
  noResults: 'No results',
  searchPlaceholder: 'Search...',
};

export function PillDropdown({
  icon,
  label,
  suffix,
  options,
  value,
  onChange,
  size = 'md',
  placeholder = 'Select...',
  searchable = false,
  searchPlaceholder,
  labels,
  ariaLabel = 'Dropdown',
  className,
  style,
}: PillDropdownProps): React.ReactElement {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
  const resolvedSearchPlaceholder = searchPlaceholder ?? resolvedLabels.searchPlaceholder;
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const isSmall = size === 'sm';

  // Calculate dropdown position when opened
  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      const target = e.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string): void => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = (): void => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchQuery('');
    }
  };

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label || label || placeholder;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {/* Trigger Button - matches PillTabs container styling */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ds-spacing-2, 8px)',
          width: '100%',
          // Match PillTabs total height (container padding + button padding)
          padding: isSmall
            ? 'var(--ds-spacing-4, 16px) var(--ds-spacing-3, 12px)'
            : 'var(--ds-spacing-5, 20px) var(--ds-spacing-4, 16px)',
          backgroundColor: 'var(--ds-color-neutral-surface-default, #1e293b)',
          border: '1px solid var(--ds-color-neutral-border-default, #334155)',
          borderRadius: 'var(--ds-border-radius-lg, 12px)',
          cursor: 'pointer',
          fontSize: isSmall
            ? 'var(--ds-font-size-xs, 0.75rem)'
            : 'var(--ds-font-size-sm, 0.875rem)',
          fontWeight: 'var(--ds-font-weight-medium, 500)',
          color: 'var(--ds-color-neutral-text-default, #e2e8f0)',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
      >
        {/* Inner content - full width */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ds-spacing-2, 8px)',
            width: '100%',
          }}
        >
          {/* Icon */}
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--ds-color-accent-base-default)',
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}

          {/* Label */}
          <span style={{ fontWeight: 'var(--ds-font-weight-medium, 500)' }}>
            {displayLabel}
          </span>

          {/* Suffix */}
          {suffix && (
            <>
              <span style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>·</span>
              <span style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{suffix}</span>
            </>
          )}

          {/* Chevron - right aligned */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: 'var(--ds-color-neutral-text-subtle)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              marginLeft: 'auto',
            }}
          >
            <ChevronDownIcon size={isSmall ? 12 : 14} />
          </span>
        </span>
      </button>

      {/* Dropdown Menu - rendered in portal to escape overflow containers */}
      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="pill-dropdown-menu"
          data-color-scheme="dark"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999,
            backgroundColor: 'var(--ds-color-neutral-background-default, #1e293b)',
            border: '1px solid var(--ds-color-neutral-border-default, #334155)',
            borderRadius: 'var(--ds-border-radius-lg, 12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            animation: 'pillDropdownFadeIn 0.15s ease',
            overflow: 'hidden',
          }}
        >
          <style>{`
            @keyframes pillDropdownFadeIn {
              from { opacity: 0; transform: translateY(-8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Search Input */}
          {searchable && (
            <div
              style={{
                padding: 'var(--ds-spacing-3, 12px)',
                borderBottom: '1px solid var(--ds-color-neutral-border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ds-spacing-2, 8px)',
                  padding: 'var(--ds-spacing-2, 8px) var(--ds-spacing-3, 12px)',
                  backgroundColor: 'var(--ds-color-neutral-surface-default)',
                  border: '1px solid var(--ds-color-neutral-border-default)',
                  borderRadius: 'var(--ds-border-radius-md)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: 'var(--ds-color-neutral-text-subtle)',
                    flexShrink: 0,
                  }}
                >
                  <SearchIcon size={isSmall ? 14 : 16} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={resolvedSearchPlaceholder}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: isSmall
                      ? 'var(--ds-font-size-xs, 0.75rem)'
                      : 'var(--ds-font-size-sm, 0.875rem)',
                    color: 'var(--ds-color-neutral-text-default)',
                  }}
                  aria-label={resolvedSearchPlaceholder}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <ul
            role="listbox"
            aria-label={ariaLabel}
            style={{
              maxHeight: searchable ? '220px' : '280px',
              overflowY: 'auto',
              listStyle: 'none',
              margin: 0,
              padding: 'var(--ds-spacing-1, 4px) 0',
              backgroundColor: 'var(--ds-color-neutral-background-default, #1e293b)',
            }}
          >
            {filteredOptions.length === 0 ? (
              <li
                style={{
                  padding: 'var(--ds-spacing-3, 12px) var(--ds-spacing-4, 16px)',
                  color: 'var(--ds-color-neutral-text-subtle)',
                  fontSize: isSmall
                    ? 'var(--ds-font-size-xs, 0.75rem)'
                    : 'var(--ds-font-size-sm, 0.875rem)',
                  textAlign: 'center',
                }}
              >
                {resolvedLabels.noResults}
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(option.value);
                      }
                    }}
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--ds-spacing-3, 12px) var(--ds-spacing-4, 16px)',
                      cursor: 'pointer',
                      backgroundColor: isSelected
                        ? 'var(--ds-color-accent-surface-default, rgba(59, 130, 246, 0.2))'
                        : 'var(--ds-color-neutral-background-default, #1e293b)',
                      color: 'var(--ds-color-neutral-text-default, #e2e8f0)',
                      fontSize: isSmall ? 'var(--ds-font-size-xs, 0.75rem)' : 'var(--ds-font-size-sm, 0.875rem)',
                      fontWeight: isSelected ? 'var(--ds-font-weight-semibold, 600)' : 'var(--ds-font-weight-regular, 400)',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--ds-color-neutral-surface-hover, #334155)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--ds-color-neutral-background-default, #1e293b)';
                      }
                    }}
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span
                        style={{
                          fontSize: isSmall ? '0.65rem' : '0.75rem',
                          color: 'var(--ds-color-neutral-text-subtle)',
                          backgroundColor: 'var(--ds-color-neutral-surface-default)',
                          padding: '2px 8px',
                          borderRadius: '100px',
                          marginLeft: 'var(--ds-spacing-2, 8px)',
                        }}
                      >
                        {option.count}
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}

export default PillDropdown;
