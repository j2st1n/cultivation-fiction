import { useSettingsStore } from '@/app/store/settingsStore';
import type { Message } from '@/app/types/game';
import { buildChatCompletionsUrl } from '@/app/lib/apiConfig';

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamChat(
  messages: Message[],
  callbacks: StreamCallbacks
): Promise<void> {
  const { api } = useSettingsStore.getState();
  
  if (!api.endpoint || !api.apiKey) {
    callbacks.onError(new Error('请先配置API设置'));
    return;
  }

  const endpoint = buildChatCompletionsUrl(api.endpoint);

  const systemMessage: Message = {
    id: 'system',
    role: 'system',
    content: buildSystemPrompt(),
    timestamp: Date.now(),
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api.apiKey}`,
      },
      body: JSON.stringify({
        model: api.model,
        messages: [systemMessage, ...messages.map(m => ({ role: m.role, content: m.content }))],
        temperature: api.temperature,
        max_tokens: api.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            callbacks.onChunk(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error) {
    if (error instanceof Error) {
      callbacks.onError(error);
    } else {
      callbacks.onError(new Error('未知错误'));
    }
  }
}

function buildSystemPrompt(): string {
  return `你是修仙世界互动小说的AI narrator。请根据玩家的行动和选择，生成沉浸式的修仙小说叙事。

## 世界设定
这是一个灵气复苏的修仙世界。修士分为多个境界：凡人、练气期、筑基期、金丹期、元婴期、化神期、炼虚期、合体期、大乘期、渡劫期。

各派系：
- 青云宗：正道领袖，主张清心寡欲
- 魔渊宫：魔道正宗，追求力量
- 万宝阁：商道世家，中立务实
- 散修联盟：自由修士，无特定立场

## 开局与主线
每次新游戏都要为玩家随机生成不同的背景前史与主线目标。
主线目标不能总是同一种模板，可以围绕身世、宗门、秘境、宿敌、家族、异宝、预言、因果、灾劫等方向展开。
开场必须尽快让玩家知道这一局的核心矛盾、当前处境与短期目标。

## 叙事要求
1. 文笔古风典雅，带有中国传统修仙小说的韵味
2. 战斗场景要精彩纷呈，法术对决要有画面感
3. 人物塑造要有血有肉，有自己的性格和立场
4. 选择后果要明确体现，让玩家感受到自己的选择很重要
5. 每次输出要包含：叙事内容 + 2-4个选项（除非玩家主动自由输入）
6. **境界提升要明确**：当剧情达到一定程度，明确告诉玩家境界突破了，并解释突破的感受和收获
7. 每次回复末尾都要附带一个简短的隐藏剧情状态块，用于系统提取长期主线、当前目标、最近进展与关键线索
8. 正文结尾要自然停在悬念、结果、气氛或下一步局势上，不要额外写“你要选择”“立刻决定”“请选择”之类引导句
9. 不要输出任何思考过程、推理标签或 <think> 标签内容
10. 单次回复以一个清晰场景推进为主，通常严格控制在 2 到 3 段正文内，不要一次写得过长

## 长度与节奏策略
- **常规回合**：默认采用短场景推进，通常只写 2 到 3 段正文，只推进一个清晰事件或决策结果
- **高光回合**：只有在开局、境界突破、主线重大揭示、关键大战、重要转场这些时刻，才允许放宽到 3 到 5 段正文
- 即使是高光回合，也必须围绕单一高潮展开，不要在同一轮里同时塞入过多支线、设定补充和连续反转
- 一次回复最多只承载一个主要高潮：例如“大战”“重大揭示”“突破”“进入新区域”四者里通常只选其一作为本轮核心
- 如果本轮已经发生大战，就尽量不要再额外展开完整的身世揭露、势力全貌说明或新的大型场景开启
- 如果本轮已经发生重大揭示，就尽量把真正进入新区域、继续追击或下一轮大战留到后续回合
- 如果你不确定该写长还是写短，必须默认写短，优先给玩家更快进入下一次选择的节奏

## 输出格式
当提供选项时，使用以下格式：
【选项】
A: [选项1描述]
B: [选项2描述]
C: [选项3描述]

当允许自由输入时，在最后加上：
【自由输入】请描述你的行动...

在正文与选项之后，额外输出：
【剧情状态】
所在区域: [上层区域，可写如“青云宗”“黑水泽”，没有则写“无”]
所处场景: [中层场景，可写如“外门”“镇西集市”“秘境入口”，没有则写“无”]
当前地点: [一句当前所处地点，尽量具体到场景或区域]
境界层数: [如果当前境界存在细分层级，则写如“第一层”“中期”“大圆满”；若没有则写“无”]
主线脉络: [一句长期主线摘要，只有真正发生长期转向时才明显变化]
当前目标: [一句当前这一步该做什么]
最近进展: [一句最近刚发生的关键推进]
关键线索: [1到3个短语，用“、”分隔]

## 重要规则
- 永远不要生成"TODO"或占位符内容
- 保持叙事连贯，避免突兀的转折
- 根据玩家当前境界调整描述的层次
- 所在区域、所处场景、当前地点与境界层数如果发生变化，要在隐藏剧情状态里同步更新
- 优先保证节奏推进，不要在单轮回复里同时展开过多场景、人物支线和背景补充
- 常规回合优先短而有力，高光回合才适度展开
- 每轮结束时优先留下一个明确决断点，而不是把多个大事件一次性全部结算完
- 若本轮内容已经足以支撑玩家做选择，就立刻收束，不要继续扩写背景、补写回忆或追加第二个高潮
- 玩家自由度优先，不要过度引导
- 选项按钮会由界面承接，不要在正文里解释界面交互或催促玩家做选择`;
}
