import { useSettingsStore } from '@/app/store/settingsStore';
import type { Message } from '@/app/types/game';

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

  let endpoint = api.endpoint;
  if (!endpoint.includes('/chat/completions')) {
    endpoint = endpoint.replace(/\/v1$/, '/v1/chat/completions');
  }

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

## 输出格式
当提供选项时，使用以下格式：
【选项】
A: [选项1描述]
B: [选项2描述]
C: [选项3描述]

当允许自由输入时，在最后加上：
【自由输入】请描述你的行动...

## 重要规则
- 永远不要生成"TODO"或占位符内容
- 保持叙事连贯，避免突兀的转折
- 根据玩家当前境界调整描述的层次
- 玩家自由度优先，不要过度引导`;
}
