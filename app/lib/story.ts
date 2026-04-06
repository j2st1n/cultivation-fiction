import type { Message, Character } from '../types/game';

export const INITIAL_STORY = `青云镇外，青云山脚。

晨雾未散，山脚下的无名小镇还笼罩在一片朦胧之中。你站在镇口的老槐树下，望着那条蜿蜒向上的青石山路——据说山顶便是青云宗所在。

今日是青云宗三年一度的开山收徒大典。你出身平凡，自幼父母双亡，由爷爷抚养长大。爷爷临终前将一块残缺的玉佩交给你，说是你爹留下的唯一遗物。

"孩子，去修仙吧……找出你爹的下落……"

这是爷爷最后的遗愿。

深吸一口气，你踏上了登山之路。山路并不好走，雾气越来越浓，而你却感觉体内似乎有一丝奇异的气息在流动……

【选项】
A: 运起体内那股微弱的气息，继续登山
B: 小心谨慎地放慢脚步，观察四周
C: 尝试与同样登山的其他少年交谈，打听消息
D: 感觉身体不适，考虑是否继续`;

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
  karma: number,
  storyProgress: number
): string {
  return `玩家信息：
- 姓名：${playerName || '未命名'}
- 境界：${playerRealm}
- 当前地点：${location}
- 善恶值：${karma} (${karma > 0 ? '偏向善良' : karma < 0 ? '偏向邪恶' : '中立'})
- 故事进度：${storyProgress}

请继续叙事，确保：
1. 根据玩家选择的选项推进剧情
2. 根据玩家善恶值安排遭遇的人物和事件
3. 境界提升要有明确的修炼过程和考验
4. 保持修仙世界的韵味和氛围`;
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