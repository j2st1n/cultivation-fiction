import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiSettings {
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface SettingsStore {
  api: ApiSettings;
  updateApi: (updates: Partial<ApiSettings>) => void;
}

const DEFAULT_API: ApiSettings = {
  endpoint: '',
  apiKey: '',
  model: 'gpt-4',
  temperature: 0.8,
  maxTokens: 2000,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      api: DEFAULT_API,
      updateApi: (updates) => set((state) => ({
        api: { ...state.api, ...updates }
      })),
    }),
    {
      name: 'api-settings-storage',
    }
  )
);