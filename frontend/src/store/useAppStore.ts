import { create } from 'zustand';
import { DockerStatus, OllamaStatus, StorageOverview } from '../types';
import { api } from '../services/api';

type ThemeMode = 'light' | 'dark';

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cloudbase-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

const initialTheme = getInitialTheme();

// Apply initial class to document
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

interface AppState {
  backendOnline: boolean;
  docker: DockerStatus | null;
  ollama: OllamaStatus | null;
  storage: StorageOverview | null;
  stats: { projectsCount: number; templatesAvailable: number } | null;
  isLoadingStatus: boolean;
  error: string | null;

  // Light / Dark mode state
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  refreshStatus: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  backendOnline: false,
  docker: null,
  ollama: null,
  storage: null,
  stats: null,
  isLoadingStatus: false,
  error: null,

  theme: initialTheme,

  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('cloudbase-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  setTheme: (theme: ThemeMode) => {
    localStorage.setItem('cloudbase-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  refreshStatus: async () => {
    set({ isLoadingStatus: true, error: null });
    try {
      const data = await api.getStatus();
      set({
        backendOnline: !!data.backend?.online,
        docker: data.docker,
        ollama: data.ollama,
        storage: data.storage,
        stats: data.stats,
        isLoadingStatus: false
      });
    } catch (err: any) {
      set({
        backendOnline: false,
        isLoadingStatus: false,
        error: err.message
      });
    }
  }
}));
