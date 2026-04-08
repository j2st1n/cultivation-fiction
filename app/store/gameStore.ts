import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GameState, 
  PlayerAttributes, 
  WorldState, 
  Character, 
  Message,
  SaveData,
  CultivationRealm
} from '@/app/types/game';

interface SaveSlot {
  id: string;
  name: string;
  createdAt: number;
  preview: string;
  gameState: GameState;
}

interface GameStore extends GameState {
  saveSlots: SaveSlot[];
  addSaveSlot: (saveData: SaveData) => void;
  removeSaveSlot: (id: string) => void;
}

const INITIAL_PLAYER: PlayerAttributes = {
  name: '',
  gender: '男',
  realm: '凡人',
  age: 16,
  spirit: 50,
  fortune: 50,
  strength: 10,
  intelligence: 10,
  constitution: 10,
};

const INITIAL_WORLD: WorldState = {
  currentLocation: '青云镇',
  currentRegion: '青云镇',
  currentArea: '镇中',
  currentScene: 'start',
  mainStoryArc: '',
  currentObjective: '',
  recentProgress: '',
  keyClues: [],
  visitedLocations: ['青云镇'],
  metCharacters: [],
  plotFlags: {},
  worldEvents: [],
};

interface GameStore extends GameState {

  setPlayerName: (name: string) => void;
  updatePlayer: (updates: Partial<PlayerAttributes>) => void;
  advanceRealm: (newRealm: CultivationRealm) => void;
  
  updateWorld: (updates: Partial<WorldState>) => void;
  setLocation: (location: string, scene?: string) => void;
  setPlotFlag: (flag: string, value: boolean) => void;
  addWorldEvent: (event: string) => void;
  
  addCharacter: (character: Character) => void;
  updateCharacterRelationship: (characterId: string, delta: number) => void;
  
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  
  setCurrentNode: (nodeId: string) => void;
  incrementProgress: () => void;
  
  setGenerating: (generating: boolean) => void;
  

  saveGame: (name: string) => SaveData;
  loadGame: (saveData: SaveData) => void;
  

  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: INITIAL_PLAYER,
      world: INITIAL_WORLD,
      characters: {},
      messages: [],
      currentNode: 'start',
      storyProgress: 0,
      isGenerating: false,

      setPlayerName: (name) => set((state) => ({
        player: { ...state.player, name }
      })),

      updatePlayer: (updates) => set((state) => ({
        player: { ...state.player, ...updates }
      })),

      advanceRealm: (newRealm) => set((state) => ({
        player: { ...state.player, realm: newRealm }
      })),

      updateWorld: (updates) => set((state) => ({
        world: { ...state.world, ...updates }
      })),

      setLocation: (location, scene) => set((state) => ({
        world: {
          ...state.world,
          currentLocation: location,
          currentScene: scene || state.world.currentScene,
          visitedLocations: state.world.visitedLocations.includes(location)
            ? state.world.visitedLocations
            : [...state.world.visitedLocations, location],
        }
      })),

      setPlotFlag: (flag, value) => set((state) => ({
        world: {
          ...state.world,
          plotFlags: { ...state.world.plotFlags, [flag]: value },
        }
      })),

      addWorldEvent: (event) => set((state) => ({
        world: {
          ...state.world,
          worldEvents: [...state.world.worldEvents, event],
        }
      })),

      addCharacter: (character) => set((state) => ({
        characters: { ...state.characters, [character.id]: character },
        world: {
          ...state.world,
          metCharacters: state.world.metCharacters.includes(character.id)
            ? state.world.metCharacters
            : [...state.world.metCharacters, character.id],
        }
      })),

      updateCharacterRelationship: (characterId, delta) => set((state) => {
        const character = state.characters[characterId];
        if (!character) return state;
        return {
          characters: {
            ...state.characters,
            [characterId]: {
              ...character,
              relationship: Math.max(-100, Math.min(100, character.relationship + delta)),
            }
          }
        };
      }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),

      clearMessages: () => set({ messages: [] }),

      setCurrentNode: (nodeId) => set({ currentNode: nodeId }),

      incrementProgress: () => set((state) => ({
        storyProgress: state.storyProgress + 1
      })),

      setGenerating: (generating) => set({ isGenerating: generating }),

      saveSlots: [],
      addSaveSlot: (saveData) => set((state) => ({
        saveSlots: [
          {
            id: saveData.id,
            name: saveData.name,
            createdAt: saveData.createdAt,
            preview: state.messages[state.messages.length - 1]?.content?.slice(0, 50) || '',
            gameState: saveData.gameState,
          },
          ...state.saveSlots.slice(0, 9),
        ]
      })),
      removeSaveSlot: (id) => set((state) => ({
        saveSlots: state.saveSlots.filter(s => s.id !== id)
      })),

      saveGame: (name) => {
        const state = get();
        const saveData: SaveData = {
          id: `save_${Date.now()}`,
          name,
          createdAt: Date.now(),
          gameState: {
            player: state.player,
            world: state.world,
            characters: state.characters,
            messages: state.messages,
            currentNode: state.currentNode,
            storyProgress: state.storyProgress,
            isGenerating: state.isGenerating,
          }
        };
        return saveData;
      },

      loadGame: (saveData) => set({
        player: saveData.gameState.player,
        world: saveData.gameState.world,
        characters: saveData.gameState.characters,
        messages: saveData.gameState.messages,
        currentNode: saveData.gameState.currentNode,
        storyProgress: saveData.gameState.storyProgress,
        isGenerating: false,
      }),

      resetGame: () => set({
        player: INITIAL_PLAYER,
        world: INITIAL_WORLD,
        characters: {},
        messages: [],
        currentNode: 'start',
        storyProgress: 0,
        isGenerating: false,
      }),
    }),
    {
      name: 'cultivation-game-storage',
      partialize: (state) => ({
        player: state.player,
        world: state.world,
        characters: state.characters,
        messages: state.messages,
        currentNode: state.currentNode,
        storyProgress: state.storyProgress,
        saveSlots: state.saveSlots,
      }),
    }
  )
);
