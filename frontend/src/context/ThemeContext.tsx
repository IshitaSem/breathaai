import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ initialTheme?: ThemeMode; children: React.ReactNode }> = ({
  initialTheme = 'auto',
  children,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.removeAttribute('data-theme');
        setIsDark(prefersDark);
      } else if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        setIsDark(true);
      } else {
        root.setAttribute('data-theme', 'light');
        setIsDark(false);
      }
    };

    apply();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') apply();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
