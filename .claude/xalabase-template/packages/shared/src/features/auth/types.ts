/**
 * Auth Domain Types
 */

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AuthUser | null;
}

export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    role: string;
}

export interface AuthCredentials {
    email: string;
    password?: string;
}

export interface AuthSession {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}
