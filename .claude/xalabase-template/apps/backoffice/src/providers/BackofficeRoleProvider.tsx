/**
 * Backoffice Role Provider - App-specific role selection
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

type BackofficeRole = 'admin' | 'case_handler' | 'viewer';

interface BackofficeRoleContextValue {
    role: BackofficeRole;
    setRole: (role: BackofficeRole) => void;
}

const BackofficeRoleContext = createContext<BackofficeRoleContextValue>({
    role: 'viewer',
    setRole: () => { },
});

export function BackofficeRoleProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<BackofficeRole>('viewer');

    return (
        <BackofficeRoleContext.Provider value={{ role, setRole }}>
            {children}
        </BackofficeRoleContext.Provider>
    );
}

export function useBackofficeRole() {
    return useContext(BackofficeRoleContext);
}
