import type { Message, Character, CultivationRealm } from '../types/game';

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
  mainStoryArc: string,
  currentObjective: string,
  storyProgress: number
): string {
  return `玩家信息：
- 姓名：${playerName || '未命名'}
- 境界：${playerRealm}
- 当前地点：${location}
- 主线脉络：${mainStoryArc || '尚在展开中'}
- 当前目标：${currentObjective || '等待新的线索或行动方向'}
- 故事进度：${storyProgress}

请继续叙事，确保：
1. 根据玩家选择的选项推进剧情
2. 境界提升要有明确的修炼过程和考验
 3. 保持主线脉络连续，不要遗忘长期目标
 4. 当前目标要清晰，并能随着剧情自然推进`;
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

export function detectRealmUpgrade(text: string): CultivationRealm | null {
  const realmOrder: CultivationRealm[] = ['练气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'];
  
  for (let i = 0; i < realmOrder.length; i++) {
    const realm = realmOrder[i];
    if (text.includes(`突破到${realm}`) || 
        text.includes(`突破至${realm}`) ||
        text.includes(`晋升${realm}`) || 
        text.includes(`进阶${realm}`) ||
        text.includes(`达到${realm}`) ||
        text.includes(`迈入${realm}`) ||
        text.includes(`踏入${realm}`) ||
        text.includes(`晋入${realm}`) ||
        new RegExp(`晋级.*${realm}`).test(text) ||
        new RegExp(`突破.*${realm}`).test(text) ||
        new RegExp(`踏入.*${realm}`).test(text) ||
        new RegExp(`迈入.*${realm}`).test(text)) {
      return realm;
    }
  }
  return null;
}

export function extractMainStoryArc(text: string): string {
  const storyPart = text.split('【选项】')[0]?.trim() || text.trim();
  const patterns = [
    /主线(?:任务|目标)[：:]\s*([^\n。！？]+)/,
    /你此行是为了([^\n。！？]+)/,
    /此行的目的在于([^\n。！？]+)/,
    /这一局的核心矛盾是([^\n。！？]+)/,
    /你卷入了([^\n。！？]+)/,
    /你真正要面对的是([^\n。！？]+)/,
  ];

  for (const pattern of patterns) {
    const match = storyPart.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const sentences = storyPart
    .split(/(?<=[。！？])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const arcSentence = sentences.find((sentence) =>
    /真相|身世|宿敌|秘境|传承|预言|因果|灾劫|纷争|阴谋|遗迹|异象|复仇|线索背后|真正目的/.test(sentence)
  );

  return arcSentence || '本局主线脉络正在展开，更多核心矛盾会随着剧情推进浮现。';
}

export function extractCurrentObjective(text: string): string {
  const storyPart = text.split('【选项】')[0]?.trim() || text.trim();
  const patterns = [
    /当前(?:任务|目标)[：:]\s*([^\n。！？]+)/,
    /你的目标是([^\n。！？]+)/,
    /你必须([^\n。！？]+)/,
    /你决定([^\n。！？]+)/,
    /当务之急是([^\n。！？]+)/,
    /接下来需要([^\n。！？]+)/,
    /下一步要做的是([^\n。！？]+)/,
    /眼下最重要的是([^\n。！？]+)/,
    /如今最重要的是([^\n。！？]+)/,
    /你眼下要做的是([^\n。！？]+)/,
    /你的当务之急是([^\n。！？]+)/,
    /你接下来要([^\n。！？]+)/,
    /你准备([^\n。！？]+)/,
    /你需要前往([^\n。！？]+)/,
  ];

  for (const pattern of patterns) {
    const match = storyPart.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const sentences = storyPart
    .split(/(?<=[。！？])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const objectiveSentence = sentences.find((sentence) =>
    /前往|赶往|调查|寻找|查明|阻止|护送|打探|完成|取得|拜入|进入|逃离|营救|设法|尽快/.test(sentence)
  );

  return objectiveSentence || '当前目标正在更新，新的行动方向会随着剧情推进明确。';
}

export function shouldUpdateStoryArc(nextArc: string, currentArc: string): boolean {
  if (!nextArc.trim()) return false;
  if (!currentArc.trim()) return true;
  if (nextArc === currentArc) return false;
  if (nextArc.includes('主线脉络正在展开')) return false;
  if (nextArc.length < 8) return false;
  if (currentArc.includes(nextArc)) return false;
  return true;
}

export function shouldUpdateCurrentObjective(nextObjective: string, currentObjective: string): boolean {
  if (!nextObjective.trim()) return false;
  if (!currentObjective.trim()) return true;
  if (nextObjective === currentObjective) return false;
  if (nextObjective.includes('当前目标正在更新')) return false;
  if (nextObjective.length < 6) return false;
  if (currentObjective.includes(nextObjective)) return false;
  return true;
}

export function shouldAdvanceRealm(currentRealm: CultivationRealm, nextRealm: CultivationRealm | null): nextRealm is CultivationRealm {
  if (!nextRealm) return false;
  const realmOrder: CultivationRealm[] = ['凡人', '练气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'];
  return realmOrder.indexOf(nextRealm) > realmOrder.indexOf(currentRealm);
}
