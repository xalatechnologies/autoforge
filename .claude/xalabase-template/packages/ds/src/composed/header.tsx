/**
 * AppHeader Component
 *
 * Main application header with logo, search, and actions
 * Following DIGILIST design patterns - single row layout
 * Uses design system tokens for styling
 */

import React, { forwardRef } from 'react';
import { Container } from '../primitives';

export interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Logo element
   */
  logo?: React.ReactNode;

  /**
   * Search element
   */
  search?: React.ReactNode;

  /**
   * Actions element (buttons, etc.)
   */
  actions?: React.ReactNode;

  /**
   * Whether header is sticky
   * @default true
   */
  sticky?: boolean;

  /**
   * Header height
   * @default '72px'
   */
  height?: string;

  /**
   * Whether to show skip link
   * @default true
   */
  showSkipLink?: boolean;

  /**
   * Skip link target
   * @default '#main'
   */
  skipLinkTarget?: string;

  /**
   * Skip link text
   * @default 'Hopp til hovedinnhold'
   */
  skipLinkText?: string;

  /**
   * Header background variant
   * @default 'surface'
   */
  variant?: 'surface' | 'background' | 'transparent';
}

export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  ({
    logo,
    search,
    actions,
    sticky = true,
    height = 'var(--ds-size-header-height, 72px)',
    showSkipLink = true,
    skipLinkTarget = '#main',
    skipLinkText = 'Hopp til hovedinnhold',
    variant = 'surface',
    className,
    style,
    ...props
  }, ref) => {
    const backgrounds = {
      surface: 'var(--ds-color-neutral-surface-default)',
      background: 'var(--ds-color-neutral-background-default)',
      transparent: 'transparent'
    };

    const headerStyle: React.CSSProperties = {
      position: sticky ? 'sticky' : 'relative',
      top: 0,
      zIndex: 100,
      backgroundColor: backgrounds[variant],
      borderBottom: '1px solid var(--ds-color-neutral-border-subtle)',
      boxShadow: sticky ? 'var(--ds-shadow-header)' : undefined,
      transition: 'box-shadow 0.2s ease',
      ...style
    };

    const skipLinkStyle: React.CSSProperties = {
      position: 'absolute',
      left: '-9999px',
      top: 'var(--ds-spacing-3)',
      zIndex: 1000,
      padding: 'var(--ds-spacing-3) var(--ds-spacing-5)',
      backgroundColor: 'var(--ds-color-accent-base-default)',
      color: 'var(--ds-color-accent-contrast-default)',
      textDecoration: 'none',
      borderRadius: 'var(--ds-border-radius-md)',
      fontSize: 'var(--ds-font-size-md)',
      fontWeight: 'var(--ds-font-weight-semibold)' as unknown as number,
    };

    return (
      <>
        {showSkipLink && (
          <a
            href={skipLinkTarget}
            style={skipLinkStyle}
            onFocus={(e) => {
              e.currentTarget.style.left = 'var(--ds-spacing-6)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.left = '-9999px';
            }}
          >
            {skipLinkText}
          </a>
        )}
        <header ref={ref} className={className} style={headerStyle} {...props}>
          <style>{`
            @media (max-width: 599px) {
              .header-row {
                gap: var(--ds-spacing-3) !important;
              }
              .header-actions {
                gap: var(--ds-spacing-2) !important;
              }
              .header-search-wrapper { display: none !important; }
            }
          `}</style>
          <Container maxWidth="1440px" padding="0 var(--ds-size-container-padding, var(--ds-spacing-6))">
            {/* Single row: Logo | Search (centered) | Actions */}
            <div className="header-row" style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              height,
              gap: 'var(--ds-spacing-4)'
            }}>
              {/* Left: Logo */}
              <div style={{
                justifySelf: 'start'
              }}>
                {logo}
              </div>

              {/* Center: Search (truly centered) */}
              {search && (
                <div className="header-search-wrapper" style={{
                  justifySelf: 'center',
                  width: '100%',
                  maxWidth: 'var(--digilist-size-search-max-width, 560px)',
                  minWidth: 'var(--digilist-size-search-min-width, 300px)'
                }}>
                  {search}
                </div>
              )}

              {/* Right: Actions */}
              <div className="header-actions" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ds-spacing-3)',
                justifySelf: 'end'
              }}>
                {actions}
              </div>
            </div>
          </Container>
        </header>
      </>
    );
  }
);

AppHeader.displayName = 'AppHeader';
