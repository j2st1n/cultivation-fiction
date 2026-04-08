import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchAvailableModels, normalizeApiBaseUrl } from '@/app/lib/apiConfig';

export interface ApiSettings {
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export type ReadingTheme = 'night' | 'bamboo' | 'paper';

interface SettingsStore {
  api: ApiSettings;
  isValidated: boolean;
  availableModels: string[];
  readingTheme: ReadingTheme;
  rememberApiKey: boolean;
  updateApi: (updates: Partial<ApiSettings>) => void;
  clearApiKey: () => void;
  setValidated: (validated: boolean) => void;
  setAvailableModels: (models: string[]) => void;
  setReadingTheme: (theme: ReadingTheme) => void;
  setRememberApiKey: (remember: boolean) => void;
  fetchModels: () => Promise<void>;
}

const DEFAULT_API: ApiSettings = {
  endpoint: '',
  apiKey: '',
  model: '',
  temperature: 0.8,
  maxTokens: 2000,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      api: DEFAULT_API,
      isValidated: false,
      availableModels: [],
      readingTheme: 'night',
      rememberApiKey: false,
      updateApi: (updates) => set((state) => ({
        api: {
          ...state.api,
          ...updates,
          endpoint: updates.endpoint !== undefined ? normalizeApiBaseUrl(updates.endpoint) : state.api.endpoint,
          apiKey: updates.apiKey !== undefined ? updates.apiKey.trim() : state.api.apiKey,
        },
        isValidated: false,
      })),
      clearApiKey: () => set((state) => ({
        api: { ...state.api, apiKey: '' },
        rememberApiKey: false,
        isValidated: false,
      })),
      setValidated: (validated) => set({ isValidated: validated }),
      setAvailableModels: (models) => set({ availableModels: models }),
      setReadingTheme: (theme) => set({ readingTheme: theme }),
      setRememberApiKey: (remember) => set((state) => ({
        rememberApiKey: remember,
        api: remember ? state.api : { ...state.api, apiKey: '' },
        isValidated: remember ? state.isValidated : false,
      })),
      fetchModels: async () => {
        const { api } = get();
        if (!api.endpoint || !api.apiKey) return;
        
        try {
          const models = await fetchAvailableModels(api.endpoint, api.apiKey);
          set({ availableModels: models });
        } catch {
          set({ availableModels: [] });
        }
      },
    }),
    {
      name: 'api-settings-storage',
      partialize: (state) => ({
        api: {
          endpoint: state.api.endpoint,
          apiKey: state.rememberApiKey ? state.api.apiKey : '',
          model: state.api.model,
          temperature: state.api.temperature,
          maxTokens: state.api.maxTokens,
        },
        availableModels: state.availableModels,
        isValidated: state.isValidated,
        readingTheme: state.readingTheme,
        rememberApiKey: state.rememberApiKey,
      }),
    }
  )
);
