import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'toggle';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, toggleTheme, setTheme } = useAppStore();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 select-none shadow-2xs backdrop-blur-xs ${className}`}
        role="group"
        aria-label="Theme Mode Selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            !isDark
              ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Switch to Light Mode"
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            isDark
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
          title="Switch to Dark Mode"
        >
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'fill-blue-200 text-blue-200' : 'text-slate-500'}`} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  if (variant === 'toggle') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-2xs group ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <div className="relative w-8 h-4 bg-slate-300 dark:bg-blue-600 rounded-full transition-colors p-0.5 flex items-center">
          <div
            className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-xs transform ${
              isDark ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          )}
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`p-1.5 rounded-lg border transition-all text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 relative overflow-hidden group ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 group-hover:rotate-45 transition-transform duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 fill-slate-600/10 group-hover:-rotate-12 transition-transform duration-200" />
      )}
    </button>
  );
};
