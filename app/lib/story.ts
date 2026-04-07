import type { Message, Character } from '../types/game';

export const INITIAL_STORY = `请为玩家生成一次全新的修仙开场。

要求：
1. 随机生成本次开局背景，不要重复固定模板
2. 随机生成本次主线目标，可以是寻人、复仇、寻宝、宗门试炼、家族秘密、仙缘异象、天命任务等不同方向
3. 开局要交代玩家的处境、当前地点、眼前危机或机缘，以及为什么必须做出选择
4. 文风保持古风修仙小说质感
5. 结尾必须给出 3 到 4 个明确选项

输出格式：
先写开场叙事，再输出：
【选项】
A: ...
B: ...
C: ...`;

export const INITIAL_CHARACTERS: Record<string, Character> = {
  'old_man': {
    id: 'old_man',
    name: '神秘老者',
    title: '镇口老人',
    description: '镇口老槐树下的神秘老人，似乎知道一些关于修仙界的事情',
    relationship: 0,
    attributes: {
      realm: '金丹期',
      faction: '散修',
    },
  },
  'qingyun_elder': {
    id: 'qingyun_elder',
    name: '青云子',
    title: '青云宗长老',
    description: '青云宗负责收徒的长老，看起来严肃但眼神中透着慈祥',
    relationship: 0,
    attributes: {
      realm: '元婴期',
      faction: '青云宗',
    },
  },
  'disciple_1': {
    id: 'disciple_1',
    name: '林小羽',
    title: '青云宗弟子',
    description: '看起来亲切的青云宗外门弟子',
    relationship: 0,
    attributes: {
      realm: '练气期',
      faction: '青云宗',
    },
  },
};

export function buildContextMessage(
  playerName: string,
  playerRealm: string,
  location: string,
  storyProgress: number
): string {
  return `玩家信息：
- 姓名：${playerName || '未命名'}
- 境界：${playerRealm}
- 当前地点：${location}
- 故事进度：${storyProgress}

请继续叙事，确保：
1. 根据玩家选择的选项推进剧情
2. 境界提升要有明确的修炼过程和考验
3. 保持修仙世界的韵味和氛围`;
}

export function parseChoicesFromResponse(text: string): string[] {
  const choiceMatch = text.match(/【选项】([\s\S]*?)(?=【|$)/);
  if (!choiceMatch) return [];
  
  const choices: string[] = [];
  const optionRegex = /[A-D]:\s*(.+)/g;
  let match;
  while ((match = optionRegex.exec(choiceMatch[1])) !== null) {
    choices.push(match[1].trim());
  }
  
  return choices;
}

export function checkRequiresInput(text: string): boolean {
  return text.includes('【自由输入】') || text.includes('请描述你的行动');
}

export function detectRealmUpgrade(text: string): string | null {
  const realmOrder = ['练气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'];
  
  for (let i = 0; i < realmOrder.length; i++) {
    const realm = realmOrder[i];
    if (text.includes(`突破到${realm}`) || 
        text.includes(`晋升${realm}`) || 
        text.includes(`进阶${realm}`) ||
        text.includes(`达到${realm}`) ||
        text.includes(`迈入${realm}`) ||
        new RegExp(`晋级.*${realm}`).test(text) ||
        new RegExp(`突破.*${realm}`).test(text)) {
      return realm;
    }
  }
  return null;
}
