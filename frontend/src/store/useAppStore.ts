import { create } from 'zustand';
import { DockerStatus, OllamaStatus, StorageOverview } from '../types';
import { api } from '../services/api';

interface AppState {
  backendOnline: boolean;
  docker: DockerStatus | null;
  ollama: OllamaStatus | null;
  storage: StorageOverview | null;
  stats: { projectsCount: number; templatesAvailable: number } | null;
  isLoadingStatus: boolean;
  error: string | null;

  refreshStatus: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  backendOnline: false,
  docker: null,
  ollama: null,
  storage: null,
  stats: null,
  isLoadingStatus: false,
  error: null,

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
