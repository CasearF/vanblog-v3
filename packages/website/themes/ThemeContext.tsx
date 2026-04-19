import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeName } from './types';
import { loadTheme } from './index';

interface ThemeContextValue {
  theme: Theme | null;
  themeName: ThemeName;
  loading: boolean;
  error: string | null;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  themeName: 'default',
  loading: true,
  error: null,
});

export function ThemeProvider({ 
  children, 
  themeName 
}: { 
  children: ReactNode; 
  themeName: ThemeName;
}) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    loadTheme(themeName)
      .then(setTheme)
      .catch((err) => {
        console.error(`Failed to load theme "${themeName}":`, err);
        setError(err.message);
        loadTheme('default').then(setTheme).catch(console.error);
      })
      .finally(() => setLoading(false));
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, loading, error }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeComponents() {
  const { theme } = useTheme();
  return theme?.components || null;
}
