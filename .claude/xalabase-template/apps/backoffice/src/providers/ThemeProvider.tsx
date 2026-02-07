/**
 * Theme Provider - Re-export from app-shell or local implementation
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
    colorScheme: ColorScheme;
    setColorScheme: (scheme: ColorScheme) => void;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
    colorScheme: 'auto',
    setColorScheme: () => { },
    toggleTheme: () => { },
    isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [colorScheme, setColorScheme] = useState<ColorScheme>('auto');
    const isDark = colorScheme === 'dark' ||
        (colorScheme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

    const toggleTheme = () => {
        setColorScheme(isDark ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ colorScheme, setColorScheme, toggleTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
