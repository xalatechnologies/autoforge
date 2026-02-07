/**
 * ProtectedRoute — Web App
 *
 * Route guard component that checks authentication and authorization.
 * Supports:
 * - Authentication check (redirects to /login if not authenticated)
 * - Role-based access control (admin, user, guest)
 * - Context-based access control (personal vs organization)
 */

import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Heading, Paragraph } from '@xala/ds';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { useAccountContext, type DashboardContext } from '@/providers/AccountContextProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    requiredContext?: DashboardContext;
}

export function ProtectedRoute({ children, requiredRole, requiredContext }: ProtectedRouteProps) {
    const { isLoading, isAuthenticated, checkRole } = useAuth();
    const accountContext = useAccountContext();
    const location = useLocation();

    // Show loading state while auth or account context is being determined
    if (isLoading || (requiredContext && accountContext?.isLoadingOrganizations)) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: 'var(--ds-color-neutral-background-default)',
                }}
            >
                <Spinner aria-label="Laster..." data-size="lg" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role authorization
    if (requiredRole && !checkRole(requiredRole)) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    gap: 'var(--ds-spacing-4)',
                    padding: 'var(--ds-spacing-6)',
                    textAlign: 'center',
                }}
            >
                <Heading
                    level={1}
                    data-size="lg"
                    style={{ color: 'var(--ds-color-danger-text-default)' }}
                >
                    Ingen tilgang
                </Heading>
                <Paragraph style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>
                    Du har ikke tilgang til denne siden.
                    <br />
                    Kontakt administrator hvis du mener dette er feil.
                </Paragraph>
            </div>
        );
    }

    // Check context authorization (personal vs organization)
    if (requiredContext && accountContext && accountContext.accountType !== requiredContext) {
        // Redirect messages for optional toast notification on destination page
        const redirectMessages: Record<DashboardContext, string> = {
            personal: 'Denne siden krever personlig modus. Du har blitt omdirigert.',
            organization: 'Denne siden krever organisasjonsmodus. Du har blitt omdirigert.',
        };

        // Redirect to current context's home (not the required context's home)
        const redirectTo = accountContext.accountType === 'organization' ? '/min-side/org' : '/min-side';
        const message = redirectMessages[requiredContext];

        return (
            <Navigate
                to={redirectTo}
                state={{ contextRedirectMessage: message, from: location }}
                replace
            />
        );
    }

    return <>{children}</>;
}
