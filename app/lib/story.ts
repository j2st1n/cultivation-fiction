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
  recentProgress: string,
  keyClues: string[],
  storyProgress: number
): string {
  return `玩家信息：
- 姓名：${playerName || '未命名'}
- 境界：${playerRealm}
- 当前地点：${location}
- 主线脉络：${mainStoryArc || '尚在展开中'}
- 当前目标：${currentObjective || '等待新的线索或行动方向'}
- 最近进展：${recentProgress || '尚无新的阶段性进展'}
- 关键线索：${keyClues.length > 0 ? keyClues.join('、') : '尚无线索'}
- 故事进度：${storyProgress}

请继续叙事，确保：
1. 根据玩家选择的选项推进剧情
2. 境界提升要有明确的修炼过程和考验
  3. 保持主线脉络连续，不要遗忘长期目标
  4. 当前目标要清晰，并能随着剧情自然推进
  5. 最近进展与关键线索要前后呼应，不要无故丢失`;
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

export function stripThinkBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export function stripInteractiveBlocks(text: string): string {
  return stripThinkBlocks(text)
    .replace(/\n?【选项】[\s\S]*?(?=\n?【自由输入】|\n?【剧情状态】|$)/g, '')
    .replace(/\n?【自由输入】.*?(?=\n?【剧情状态】|$)/g, '')
    .replace(/\n?【剧情状态】[\s\S]*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripStoryStateBlock(text: string): string {
  return stripThinkBlocks(text).replace(/\n*【剧情状态】[\s\S]*$/,'').trim();
}

export function extractStoryState(text: string): { currentRegion: string; currentArea: string; currentLocation: string; realmStage: string; mainStoryArc: string; currentObjective: string; recentProgress: string; keyClues: string[] } {
  const match = text.match(/【剧情状态】([\s\S]*)$/);
  if (!match) {
    return { currentRegion: '', currentArea: '', currentLocation: '', realmStage: '', mainStoryArc: '', currentObjective: '', recentProgress: '', keyClues: [] };
  }

  const stateBlock = match[1];
  const regionMatch = stateBlock.match(/所在区域:\s*([^\n]+)/);
  const areaMatch = stateBlock.match(/所处场景:\s*([^\n]+)/);
  const locationMatch = stateBlock.match(/当前地点:\s*([^\n]+)/);
  const realmStageMatch = stateBlock.match(/境界层数:\s*([^\n]+)/);
  const arcMatch = stateBlock.match(/主线脉络:\s*([^\n]+)/);
  const objectiveMatch = stateBlock.match(/当前目标:\s*([^\n]+)/);
  const progressMatch = stateBlock.match(/最近进展:\s*([^\n]+)/);
  const cluesMatch = stateBlock.match(/关键线索:\s*([^\n]+)/);

  return {
    currentRegion: regionMatch?.[1]?.trim() || '',
    currentArea: areaMatch?.[1]?.trim() || '',
    currentLocation: locationMatch?.[1]?.trim() || '',
    realmStage: realmStageMatch?.[1]?.trim() || '',
    mainStoryArc: arcMatch?.[1]?.trim() || '',
    currentObjective: objectiveMatch?.[1]?.trim() || '',
    recentProgress: progressMatch?.[1]?.trim() || '',
    keyClues: cluesMatch?.[1]?.split(/[、，,]/).map((clue) => clue.trim()).filter(Boolean) || [],
  };
}

export function composeLocationLabel(region?: string, area?: string, location?: string): string {
  return [region, area, location]
    .filter((value) => value && value !== '无')
    .join(' · ')
    .trim();
}

export function getCoarseLocationLabel(region?: string, area?: string, location?: string): string {
  return region || area || location || '';
}

export function extractLocationState(text: string): { currentRegion: string; currentArea: string; currentLocation: string } {
  const structuredState = extractStoryState(text);
  const state = {
    currentRegion: structuredState.currentRegion !== '无' ? structuredState.currentRegion : '',
    currentArea: structuredState.currentArea !== '无' ? structuredState.currentArea : '',
    currentLocation: structuredState.currentLocation !== '无' ? structuredState.currentLocation : '',
  };

  if (state.currentRegion || state.currentArea || state.currentLocation) {
    return state;
  }

  const fallbackLocation = extractCurrentLocation(text);
  return {
    currentRegion: '',
    currentArea: '',
    currentLocation: fallbackLocation,
  };
}

export function extractCurrentLocation(text: string): string {
  const structuredState = extractStoryState(text);
  const composedLocation = composeLocationLabel(structuredState.currentRegion, structuredState.currentArea, structuredState.currentLocation);
  if (composedLocation) {
    return composedLocation;
  }

  const storyPart = stripInteractiveBlocks(text) || text.trim();
  const patterns = [
    /来到([^\n。！？]+)/,
    /身处([^\n。！？]+)/,
    /位于([^\n。！？]+)/,
    /踏入([^\n。！？]+)/,
    /进入([^\n。！？]+)/,
  ];

  for (const pattern of patterns) {
    const match = storyPart.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

export function extractRealmStage(text: string): string {
  const structuredState = extractStoryState(text);
  if (structuredState.realmStage && structuredState.realmStage !== '无') {
    return structuredState.realmStage;
  }

  const storyPart = stripInteractiveBlocks(text) || text.trim();
  const patterns = [
    /(第一层|第二层|第三层|第四层|第五层|第六层|第七层|第八层|第九层)/,
    /(初期|中期|后期|巅峰|大圆满)/,
  ];

  for (const pattern of patterns) {
    const match = storyPart.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
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
  const structuredState = extractStoryState(text);
  if (structuredState.mainStoryArc) {
    return structuredState.mainStoryArc;
  }

  const storyPart = stripInteractiveBlocks(text) || text.trim();
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
  const structuredState = extractStoryState(text);
  if (structuredState.currentObjective) {
    return structuredState.currentObjective;
  }

  const storyPart = stripInteractiveBlocks(text) || text.trim();
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

export function extractRecentProgress(text: string): string {
  const structuredState = extractStoryState(text);
  if (structuredState.recentProgress) {
    return structuredState.recentProgress;
  }

  const storyPart = stripInteractiveBlocks(text) || text.trim();
  const sentences = storyPart
    .split(/(?<=[。！？])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const progressSentence = [...sentences].reverse().find((sentence) =>
    /发现|得知|进入|来到|遇见|完成|结束|取得|确认|查明|突破|脱身|找到/.test(sentence)
  );

  return progressSentence || '最近进展正在形成，新的变化会随着剧情推进明确。';
}

export function extractKeyClues(text: string): string[] {
  const structuredState = extractStoryState(text);
  if (structuredState.keyClues.length > 0) {
    return structuredState.keyClues;
  }

  const storyPart = stripInteractiveBlocks(text) || text.trim();
  const clues: string[] = [];
  const cluePatterns = [
    /线索[：:]\s*([^\n。！？]+)/g,
    /发现了([^\n。！？]+)/g,
    /得知了([^\n。！？]+)/g,
    /原来([^\n。！？]+)/g,
  ];

  cluePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(storyPart)) !== null) {
      const clue = match[1]?.trim();
      if (clue && !clues.includes(clue)) {
        clues.push(clue);
      }
    }
  });

  return clues.slice(0, 3);
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

export function shouldUpdateRecentProgress(nextProgress: string, currentProgress: string): boolean {
  if (!nextProgress.trim()) return false;
  if (!currentProgress.trim()) return true;
  if (nextProgress === currentProgress) return false;
  if (nextProgress.includes('最近进展正在形成')) return false;
  return nextProgress.length >= 8;
}

export function shouldUpdateCurrentLocation(nextLocation: string, currentLocation: string): boolean {
  if (!nextLocation.trim()) return false;
  if (nextLocation === currentLocation) return false;
  if (nextLocation.length < 2) return false;
  return true;
}

export function shouldUpdateLocationField(nextValue: string, currentValue?: string): boolean {
  if (!nextValue.trim()) return false;
  if (nextValue === '无') return false;
  if (nextValue === (currentValue || '')) return false;
  return true;
}

export function shouldUpdateRealmStage(nextStage: string, currentStage?: string): boolean {
  if (!nextStage.trim()) return false;
  if (nextStage === '无') return false;
  if (nextStage === (currentStage || '')) return false;
  return true;
}

export function mergeKeyClues(currentClues: string[], nextClues: string[]): string[] {
  const merged = [...currentClues];
  nextClues.forEach((clue) => {
    if (clue && !merged.includes(clue)) {
      merged.push(clue);
    }
  });
  return merged.slice(-5);
}

export function shouldAdvanceRealm(currentRealm: CultivationRealm, nextRealm: CultivationRealm | null): nextRealm is CultivationRealm {
  if (!nextRealm) return false;
  const realmOrder: CultivationRealm[] = ['凡人', '练气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'];
  return realmOrder.indexOf(nextRealm) > realmOrder.indexOf(currentRealm);
}
