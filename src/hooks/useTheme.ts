import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { ThemeMode, AccentColor } from '../types/theme';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('app-theme-mode', 'system');
  const [accent, setAccent] = useLocalStorage<AccentColor>('app-theme-accent', 'celeste');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      root.setAttribute('data-accent', accent);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, accent]);

  return {
    theme,
    setTheme,
    accent,
    setAccent,
  };
}
