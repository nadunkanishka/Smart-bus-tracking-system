import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme, useThemeMode } from '../theme';

// Sun / moon button. The icon turns a little on press (see .theme-toggle in admin-theme.css).
export default function ThemeToggle({ className = '' }) {
  const dark = useThemeMode() === 'dark';
  return (
    <button
      type="button"
      className={`icon-button theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun strokeWidth={1.75} aria-hidden="true" /> : <Moon strokeWidth={1.75} aria-hidden="true" />}
    </button>
  );
}
