/**
 * AuthProvider — Web App
 *
 * Context provider for authentication state.
 * Wraps the SDK useAuth hook and provides a unified context.
 */

import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useSdkAuth } from '@xalabaas/sdk';
import { AuthContext, type AuthContextType, type WebUser, type UserRole } from '@/hooks/useAuth';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const navigate = useNavigate();
    const sdk = useSdkAuth({ appId: 'web' });

    // Derive user from SDK
    const user: WebUser | null = useMemo(() => {
        if (!sdk.user) return null;
        return {
            id: sdk.user.id,
            name: sdk.user.name || sdk.user.email,
            email: sdk.user.email,
            avatarUrl: sdk.user.avatarUrl,
            tenantId: sdk.user.tenantId,
            role: sdk.user.role,
        };
    }, [sdk.user]);

    // Role checking
    const checkRole = useCallback(
        (role: UserRole): boolean => {
            if (!user) return false;
            if (role === 'admin') return user.role === 'admin';
            if (role === 'user') return user.role === 'admin' || user.role === 'user';
            return true; // guest
        },
        [user]
    );

    // Login handler wraps SDK OAuth
    const login = useCallback(
        (provider: 'idporten' | 'microsoft' | 'vipps', _returnTo?: string) => {
            sdk.signInWithOAuth(provider);
        },
        [sdk]
    );

    // Logout handler
    const logout = useCallback(() => {
        sdk.signOut();
        navigate('/');
    }, [sdk, navigate]);

    // Legacy auth callback handler
    const handleAuthCallback = useCallback((userData: WebUser) => {
        localStorage.setItem('xalabaas_web_user', JSON.stringify(userData));
    }, []);

    // Build context value
    const value = useMemo<AuthContextType>(
        () => ({
            isAuthenticated: sdk.isAuthenticated,
            isLoading: sdk.isLoading,
            user,
            isAdmin: user?.role === 'admin',
            error: sdk.error,
            login,
            loginWithPassword: sdk.signIn,
            loginAsDemo: sdk.signInAsDemo,
            logout,
            checkRole,
            handleAuthCallback,
        }),
        [
            sdk.isAuthenticated,
            sdk.isLoading,
            sdk.error,
            sdk.signIn,
            sdk.signInAsDemo,
            user,
            login,
            logout,
            checkRole,
            handleAuthCallback,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
