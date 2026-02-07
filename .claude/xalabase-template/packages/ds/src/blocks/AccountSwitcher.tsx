/**
 * AccountSwitcher — Web App
 *
 * Dropdown component for switching between personal and organization accounts.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    BuildingIcon,
    UserIcon,
    CheckIcon,
} from '@xala/ds';
import { useRequiredAccountContext } from '@/providers/AccountContextProvider';
import { useAuth } from '@/hooks/useAuth';

export function AccountSwitcher() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        accountType,
        organizations,
        selectedOrganization,
        switchToPersonal,
        switchToOrganization,
        isLoadingOrganizations,
    } = useRequiredAccountContext();

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    // Close dropdown on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [open]);

    const handleSwitchPersonal = () => {
        switchToPersonal();
        navigate('/min-side');
        setOpen(false);
    };

    const handleSwitchOrganization = (orgId: string) => {
        switchToOrganization(orgId);
        navigate('/min-side/org');
        setOpen(false);
    };

    const currentLabel =
        accountType === 'organization' && selectedOrganization
            ? selectedOrganization.name
            : user?.name || 'Personlig';

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <Button
                variant="secondary"
                data-size="sm"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="menu"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--ds-spacing-2)',
                }}
            >
                {accountType === 'organization' ? <BuildingIcon /> : <UserIcon />}
                <span
                    style={{
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {currentLabel}
                </span>
                {/* Chevron indicator */}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </Button>

            {open && (
                <Card
                    role="menu"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        right: 0,
                        width: '280px',
                        padding: 'var(--ds-spacing-2)',
                        zIndex: 100,
                        boxShadow: 'var(--ds-shadow-md)',
                    }}
                >
                    {/* Personal account option */}
                    <button
                        role="menuitem"
                        onClick={handleSwitchPersonal}
                        style={{
                            width: '100%',
                            padding: 'var(--ds-spacing-3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--ds-spacing-3)',
                            border: 'none',
                            borderRadius: 'var(--ds-border-radius-md)',
                            backgroundColor:
                                accountType === 'personal'
                                    ? 'var(--ds-color-first-surface-default)'
                                    : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <UserIcon />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{user?.name || 'Personlig konto'}</div>
                            <div
                                style={{
                                    fontSize: 'var(--ds-font-size-sm)',
                                    color: 'var(--ds-color-neutral-text-subtle)',
                                }}
                            >
                                {user?.email}
                            </div>
                        </div>
                        {accountType === 'personal' && (
                            <CheckIcon style={{ color: 'var(--ds-color-first-base-default)' }} />
                        )}
                    </button>

                    {/* Divider if organizations exist */}
                    {organizations.length > 0 && (
                        <>
                            <div
                                style={{
                                    borderTop: '1px solid var(--ds-color-neutral-border-subtle)',
                                    margin: 'var(--ds-spacing-2) 0',
                                }}
                            />
                            <div
                                style={{
                                    padding: 'var(--ds-spacing-2) var(--ds-spacing-3)',
                                    fontSize: 'var(--ds-font-size-sm)',
                                    color: 'var(--ds-color-neutral-text-subtle)',
                                    fontWeight: '500',
                                }}
                            >
                                Organisasjoner
                            </div>
                        </>
                    )}

                    {/* Organization options */}
                    {isLoadingOrganizations ? (
                        <div
                            style={{
                                padding: 'var(--ds-spacing-3)',
                                fontSize: 'var(--ds-font-size-sm)',
                                color: 'var(--ds-color-neutral-text-subtle)',
                            }}
                        >
                            Laster organisasjoner...
                        </div>
                    ) : (
                        organizations.map((org) => (
                            <button
                                key={org.id}
                                role="menuitem"
                                onClick={() => handleSwitchOrganization(org.id)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--ds-spacing-3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--ds-spacing-3)',
                                    border: 'none',
                                    borderRadius: 'var(--ds-border-radius-md)',
                                    backgroundColor:
                                        accountType === 'organization' && selectedOrganization?.id === org.id
                                            ? 'var(--ds-color-first-surface-default)'
                                            : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <BuildingIcon />
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            fontWeight: '500',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {org.name}
                                    </div>
                                </div>
                                {accountType === 'organization' && selectedOrganization?.id === org.id && (
                                    <CheckIcon style={{ color: 'var(--ds-color-first-base-default)' }} />
                                )}
                            </button>
                        ))
                    )}
                </Card>
            )}
        </div>
    );
}
