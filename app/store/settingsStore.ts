import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  updateApi: (updates: Partial<ApiSettings>) => void;
  setValidated: (validated: boolean) => void;
  setAvailableModels: (models: string[]) => void;
  setReadingTheme: (theme: ReadingTheme) => void;
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
      updateApi: (updates) => set((state) => ({
        api: { ...state.api, ...updates },
        isValidated: false,
      })),
      setValidated: (validated) => set({ isValidated: validated }),
      setAvailableModels: (models) => set({ availableModels: models }),
      setReadingTheme: (theme) => set({ readingTheme: theme }),
      fetchModels: async () => {
        const { api } = get();
        if (!api.endpoint || !api.apiKey) return;
        
        try {
          const baseUrl = api.endpoint.split('/v1')[0];
          const response = await fetch(`${baseUrl}/v1/models`, {
            headers: { 'Authorization': `Bearer ${api.apiKey}` },
          });
          if (response.ok) {
            const data = await response.json();
            const models = data.data?.map((m: { id: string }) => m.id) || [];
            set({ availableModels: models });
          }
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
          model: state.api.model,
          temperature: state.api.temperature,
          maxTokens: state.api.maxTokens,
        },
        availableModels: state.availableModels,
        isValidated: state.isValidated,
        readingTheme: state.readingTheme,
      }),
    }
  )
);
