// 游戏状态类型定义

export type CultivationRealm = 
  | '凡人'
  | '练气期'
  | '筑基期'
  | '金丹期'
  | '元婴期'
  | '化神期'
  | '炼虚期'
  | '合体期'
  | '大乘期'
  | '渡劫期';

export interface PlayerAttributes {
  name: string;
  realm: CultivationRealm;
  age: number;
  spirit: number;      // 灵根资质 1-100
  fortune: number;     // 气运 1-100
  karma: number;       // 善恶值 -100到100
  strength: number;    // 力量
  intelligence: number;// 悟性
  constitution: number;// 体质
}

export interface WorldState {
  currentLocation: string;
  currentScene: string;
  visitedLocations: string[];
  metCharacters: string[];
  plotFlags: Record<string, boolean>;
  worldEvents: string[];
}

export interface Character {
  id: string;
  name: string;
  title?: string;
  description: string;
  relationship: number; // -100到100 友好度
  attributes: {
    realm?: CultivationRealm;
    faction?: string;
  };
}

export interface StoryNode {
  id: string;
  content: string;
  choices?: Choice[];
  requiresInput?: boolean;
}

export interface Choice {
  id: string;
  text: string;
  nextNodeId: string;
  effects?: Partial<PlayerAttributes> & Partial<WorldState>;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface GameState {
  // 玩家状态
  player: PlayerAttributes;
  // 世界状态
  world: WorldState;
  // 角色关系
  characters: Record<string, Character>;
  // 聊天历史
  messages: Message[];
  // 当前剧情节点
  currentNode: string;
  // 游戏进度
  storyProgress: number;
  // 是否正在生成中
  isGenerating: boolean;
}

export interface SaveData {
  id: string;
  name: string;
  createdAt: number;
  gameState: GameState;
}