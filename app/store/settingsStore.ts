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
      partialize: (state) => ({
        // 只持久化非敏感配置，不保存 apiKey
        api: {
          endpoint: state.api.endpoint,
          model: state.api.model,
          temperature: state.api.temperature,
          maxTokens: state.api.maxTokens,
          // 排除 apiKey，不持久化到 localStorage
        },
      }),
    }
  )
);