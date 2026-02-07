/**
 * UserMenu Component
 *
 * Reusable user dropdown menu for all apps.
 * Shows user info and common navigation links.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@digdir/designsystemet-react';
import { UserIcon } from '../primitives';

// =============================================================================
// Icons
// =============================================================================

const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
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

const HomeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CalendarIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const HeartIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SettingsIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const HelpIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const LogOutIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ExternalLinkIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// =============================================================================
// Types
// =============================================================================

export interface UserMenuLink {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  divider?: boolean;
  external?: boolean;
}

export interface UserMenuProps {
  /**
   * User display name
   */
  userName: string;

  /**
   * User email (shown in header)
   */
  userEmail?: string;

  /**
   * User avatar URL
   */
  avatarUrl?: string;

  /**
   * Logout callback
   */
  onLogout: () => void;

  /**
   * Base URL for minside app
   * @default 'https://minside.digilist.no'
   */
  minsideUrl?: string;

  /**
   * Base URL for help/support
   * @default 'https://digilist.no/hjelp'
   */
  helpUrl?: string;

  /**
   * Show "Min side" link
   * @default true
   */
  showMinside?: boolean;

  /**
   * Show "Mine bookinger" link
   * @default true
   */
  showBookings?: boolean;

  /**
   * Show "Favoritter" link
   * @default true
   */
  showFavorites?: boolean;

  /**
   * Show "Innstillinger" link
   * @default true
   */
  showSettings?: boolean;

  /**
   * Show "Hjelp" link
   * @default true
   */
  showHelp?: boolean;

  /**
   * Additional custom menu items (inserted before logout)
   */
  customItems?: UserMenuLink[];

  /**
   * Completely override default menu items
   */
  menuItems?: UserMenuLink[];

  /**
   * Button color variant
   * @default 'accent'
   */
  color?: 'accent' | 'neutral' | 'danger';

  /**
   * Custom trigger button content (replaces default)
   */
  trigger?: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export const UserMenu: React.FC<UserMenuProps> = ({
  userName,
  userEmail,
  avatarUrl,
  onLogout,
  minsideUrl = 'https://minside.digilist.no',
  helpUrl = 'https://digilist.no/hjelp',
  showMinside = true,
  showBookings = true,
  showFavorites = true,
  showSettings = true,
  showHelp = true,
  customItems = [],
  menuItems: customMenuItems,
  color = 'accent',
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Build menu items
  const buildDefaultMenuItems = (): UserMenuLink[] => {
    const items: UserMenuLink[] = [];

    if (showMinside) {
      items.push({
        label: 'Min side',
        icon: <HomeIcon />,
        href: minsideUrl,
      });
    }

    if (showBookings) {
      items.push({
        label: 'Mine bookinger',
        icon: <CalendarIcon />,
        href: `${minsideUrl}/bookings`,
      });
    }

    // Calendar link
    items.push({
      label: 'Kalender',
      icon: <CalendarIcon />,
      href: `${minsideUrl}/calendar`,
    });

    // Messages link
    items.push({
      label: 'Meldinger',
      icon: <HomeIcon />, // Using HomeIcon as placeholder, could add MessageIcon
      href: `${minsideUrl}/messages`,
    });

    // Billing link
    items.push({
      label: 'Fakturering',
      icon: <HomeIcon />, // Using HomeIcon as placeholder, could add CreditCardIcon
      href: `${minsideUrl}/billing`,
    });

    if (showFavorites) {
      items.push({
        label: 'Favoritter',
        icon: <HeartIcon />,
        href: `${minsideUrl}/favorites`,
      });
    }

    if (items.length > 0 && (showSettings || showHelp || customItems.length > 0)) {
      items.push({ label: '', divider: true });
    }

    // Notifications link
    items.push({
      label: 'Varsler',
      icon: <HomeIcon />, // Using HomeIcon as placeholder, could add BellIcon
      href: `${minsideUrl}/notifications`,
    });

    if (showSettings) {
      items.push({
        label: 'Innstillinger',
        icon: <SettingsIcon />,
        href: `${minsideUrl}/settings`,
      });
    }

    if (showHelp) {
      items.push({
        label: 'Hjelp',
        icon: <HelpIcon />,
        href: helpUrl,
        external: true,
      });
    }

    // Add custom items
    if (customItems.length > 0) {
      if (items.length > 0 && !items[items.length - 1]?.divider) {
        items.push({ label: '', divider: true });
      }
      items.push(...customItems);
    }

    // Add logout
    if (items.length > 0) {
      items.push({ label: '', divider: true });
    }
    items.push({
      label: 'Logg ut',
      icon: <LogOutIcon />,
      onClick: onLogout,
    });

    return items;
  };

  const menuItems = customMenuItems || buildDefaultMenuItems();
  const colorProps = color !== 'neutral' ? { 'data-color': color } : {};

  const menuWidth = '280px';

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: menuWidth }}>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
          {trigger}
        </div>
      ) : (
        <Button
          variant="primary"
          type="button"
          {...colorProps}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Brukerinfo for ${userName}`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-2)', minWidth: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: 'var(--ds-border-radius-full)',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <UserIcon size={20} aria-hidden style={{ flexShrink: 0 }} />
            )}
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {userName}
            </span>
          </span>
          <span style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <ChevronDownIcon size={16} />
          </span>
        </Button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + var(--ds-spacing-2))',
            right: 0,
            left: 0,
            minWidth: menuWidth,
            backgroundColor: 'var(--ds-color-neutral-surface-default)',
            borderRadius: 'var(--ds-border-radius-lg)',
            boxShadow: 'var(--ds-shadow-lg)',
            border: '1px solid var(--ds-color-neutral-border-default)',
            zIndex: 1000,
            animation: 'user-menu-enter 0.15s ease',
            overflow: 'hidden',
          }}
        >
          <style>{`
            @keyframes user-menu-enter {
              from { opacity: 0; transform: translateY(-8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* User Info Header */}
          <div style={{
            padding: 'var(--ds-spacing-4) var(--ds-spacing-5)',
            borderBottom: '1px solid var(--ds-color-neutral-border-subtle)',
            backgroundColor: 'var(--ds-color-neutral-surface-hover)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-3)' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--ds-border-radius-full)',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--ds-border-radius-full)',
                  backgroundColor: 'var(--ds-color-accent-surface-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ds-color-accent-text-default)',
                }}>
                  <UserIcon size={20} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 'var(--ds-font-weight-semibold)' as unknown as number,
                  fontSize: 'var(--ds-font-size-sm)',
                  color: 'var(--ds-color-neutral-text-default)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {userName}
                </div>
                {userEmail && (
                  <div style={{
                    fontSize: 'var(--ds-font-size-xs)',
                    color: 'var(--ds-color-neutral-text-subtle)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {userEmail}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: 'var(--ds-spacing-2) 0' }}>
            {menuItems.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--ds-color-neutral-border-subtle)',
                      margin: 'var(--ds-spacing-2) 0',
                    }}
                  />
                );
              }

              const isHovered = hoveredIndex === index;
              const content = (
                <>
                  {item.icon && (
                    <span style={{
                      color: isHovered ? 'var(--ds-color-accent-text-default)' : 'var(--ds-color-neutral-text-subtle)',
                      transition: 'color 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </span>
                  )}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.external && (
                    <span style={{
                      color: 'var(--ds-color-neutral-text-subtle)',
                      opacity: 0.6,
                    }}>
                      <ExternalLinkIcon size={14} />
                    </span>
                  )}
                </>
              );

              const itemStyle: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ds-spacing-3)',
                width: '100%',
                padding: 'var(--ds-spacing-3) var(--ds-spacing-5)',
                border: 'none',
                background: isHovered ? 'var(--ds-color-neutral-surface-hover)' : 'transparent',
                color: 'var(--ds-color-neutral-text-default)',
                fontSize: 'var(--ds-font-size-sm)',
                fontWeight: 'var(--ds-font-weight-medium)' as unknown as number,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                textDecoration: 'none',
                textAlign: 'left' as const,
              };

              if (item.href) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    role="menuitem"
                    style={itemStyle}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <button
                  key={index}
                  type="button"
                  role="menuitem"
                  style={itemStyle}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

UserMenu.displayName = 'UserMenu';
