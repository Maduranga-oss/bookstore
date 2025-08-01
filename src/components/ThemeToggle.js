'use client';

import { useTheme } from '../lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  const handleToggle = () => {
    console.log('Current theme:', theme);
    console.log('Document classes before:', document.documentElement.classList.toString());
    toggleTheme();
    // Check after a small delay
    setTimeout(() => {
      console.log('Document classes after:', document.documentElement.classList.toString());
    }, 100);
  };

  if (!mounted) {
    return (
      <div className="p-2 w-9 h-9 rounded-lg bg-gray-100 animate-pulse">
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        // Moon icon for switching to dark
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      ) : (
        // Sun icon for switching to light
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <path d="m12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )}
    </button>
  );
}