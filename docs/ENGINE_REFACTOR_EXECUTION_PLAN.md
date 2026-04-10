# Shared Engine / Telegram 适配执行单

## 目标

这份执行单的目标不是讨论方向，而是指导实际落地：

1. 抽离平台无关的 shared story engine
2. 为 Telegram 版本复用同一套 gameplay / parser / session 逻辑
3. 在重构过程中 **不破坏当前 Web 版本**

当前原则：

> 先并行建设新 engine，再让 Web 主流程逐步接入。不要在第一阶段直接拆毁现有 Web 逻辑。

---

## 总体执行策略

### 核心策略：双轨推进

- **现有 Web 逻辑继续可用**
- **新 shared engine 并行开发**
- **重构完成前，默认不让新 engine 直接接管线上主路径**
- **所有切换必须可回退**

### 当前版本保护规则

在 shared engine 重构阶段，以下规则视为硬约束：

- 不直接重写 `app/components/GameInterface.tsx` 主流程
- 不在第一阶段重做存档 / 导入导出 / 设置页
- 不为了 Telegram 先改坏 Web
- 不因为目录重构而强行 bump 版本号
- 只有用户可感知行为稳定变化时，才发布新的 patch release

---

## Phase 0：准备期

### 目标

建立边界，避免“边拆边坏”。

### TODO

- [ ] 明确 shared engine 最小职责边界
- [ ] 明确 Telegram MVP 非目标
- [ ] 明确第一阶段不动哪些文件/功能
- [ ] 明确重构期版本策略

### 完成标准

- [ ] 新 engine 的目录边界明确
- [ ] Web 当前线上路径不被直接替换
- [ ] Telegram MVP 范围被控制住

---

## Phase 1：抽最小可用 Shared Engine

### 目标

先做一套 **可运行、可测试、平台无关** 的最小 engine，但暂时 **不接管当前 Web 主流程**。

### Phase 1 范围声明

#### 只做这些

- 定义统一 `SessionState`
- 抽 session transition / reducer helper
- 抽 parser 最关键模块
- 抽最小 engine
- 抽 LLM adapter interface
- 写第一批 parser / engine tests

#### 明确不做这些

- 不直接大改 `GameInterface.tsx`
- 不实现 Telegram API 接线
- 不重写保存/导入/导出 UI
- 不一开始就把 engine 拆成很多极细文件

---

## Phase 1 建议目录

```text
app/core/
  session/
    types.ts
    reducer.ts
  story-engine/
    index.ts
    engine.ts
  story-parser/
    choices.ts
    storyState.ts
    realm.ts
    location.ts
    updatePolicy.ts
  llm/
    types.ts
```

> 第一阶段先保持克制，不要一开始就拆成十几个 engine 文件。

---

## Phase 1 详细任务单

### 任务 1：定义统一 SessionState

#### 文件

- `app/core/session/types.ts`

#### TODO

- [ ] 定义 `SessionState`
- [ ] 覆盖当前 Web 的核心状态：
  - `player`
  - `world`
  - `messages`
  - `pendingChoices`
  - `requiresInput`
  - `status`
  - `lastError`
  - `updatedAt`
- [ ] 预留平台元信息扩展位

#### 建议结构

```ts
interface SessionState {
  sessionId: string
  player: PlayerAttributes
  world: WorldState
  messages: Message[]
  pendingChoices: string[]
  requiresInput: boolean
  status: 'idle' | 'generating' | 'waiting_choice' | 'waiting_input' | 'error'
  lastError: string | null
  updatedAt: number
  meta?: {
    platform?: 'web' | 'telegram'
  }
}
```

#### 完成标准

- [ ] 类型不依赖 React/Zustand
- [ ] 足够表达当前 Web gameplay 状态

---

### 任务 2：抽 Session reducer / transition helpers

#### 文件

- `app/core/session/reducer.ts`

#### TODO

- [ ] 抽离 session 更新 helper
- [ ] 支持以下状态变更：
  - start generating
  - append user message
  - append assistant message
  - set pending choices
  - set requires input
  - set error
  - update timestamps

#### 完成标准

- [ ] reducer/helper 可单独测试
- [ ] 不依赖浏览器环境

---

### 任务 3：拆 parser 最关键模块

#### 文件

- `app/core/story-parser/choices.ts`
- `app/core/story-parser/storyState.ts`
- `app/core/story-parser/realm.ts`
- `app/core/story-parser/location.ts`
- `app/core/story-parser/updatePolicy.ts`

#### TODO

从当前 `app/lib/story.ts` 中先迁移这些高风险逻辑：

- [ ] 选项解析
- [ ] 剧情状态块提取
- [ ] 境界识别
- [ ] 地点提取与粗粒度归一化
- [ ] 状态覆盖策略

#### 注意

- 第一阶段不要求完全删除旧 `story.ts`
- 先做到：**新 parser 可单独使用、可单测**

#### 完成标准

- [ ] parser 逻辑脱离 UI 文件
- [ ] 输入输出边界清楚

---

### 任务 4：定义最小 LLM adapter interface

#### 文件

- `app/core/llm/types.ts`

#### TODO

- [ ] 定义最小 generate interface
- [ ] 暂不实现 Telegram，只定义抽象

#### 建议结构

```ts
interface LLMGenerateInput {
  session: SessionState
  action: { type: 'start' | 'choice' | 'free_input' | 'retry'; payload?: unknown }
}

interface LLMGenerateResult {
  rawText: string
}

interface LLMAdapter {
  generateTurn(input: LLMGenerateInput): Promise<LLMGenerateResult>
}
```

#### 完成标准

- [ ] engine 不直接依赖现有浏览器调用实现
- [ ] 为后续 Web / Telegram 适配留接口

---

### 任务 5：抽最小 engine

#### 文件

- `app/core/story-engine/engine.ts`
- `app/core/story-engine/index.ts`

#### TODO

先把这些逻辑迁进去：

- [ ] `startGame`
- [ ] `submitChoice`
- [ ] `submitFreeInput`
- [ ] `retryTurn`
- [ ] `finalizeResponse`

#### 要求

- 接收 `SessionState`
- 接收 `LLMAdapter`
- 返回新的 `SessionState`
- 第一阶段先不处理流式 UI，只处理“一轮完成后的状态结果”

#### 完成标准

- [ ] 不依赖 React
- [ ] 不依赖 DOM / `window`
- [ ] 不依赖 Telegram API

---

### 任务 6：补第一批测试

#### 建议测试文件

- `app/core/story-parser/__tests__/choices.test.ts`
- `app/core/story-parser/__tests__/storyState.test.ts`
- `app/core/story-parser/__tests__/realm.test.ts`
- `app/core/story-parser/__tests__/location.test.ts`
- `app/core/story-engine/__tests__/engine.test.ts`

#### 第一批必须覆盖

- [ ] 正常响应中的 A/B/C/D 选项提取
- [ ] 完整剧情状态块解析
- [ ] 缺字段时不覆盖旧状态
- [ ] 多种表达下的境界突破识别
- [ ] malformed AI response 容错
- [ ] `submitChoice` 的 session 更新
- [ ] `submitFreeInput` 的 session 更新

#### 完成标准

- [ ] parser 风险点被测试兜底
- [ ] engine 最小闭环可验证

---

### 任务 7：保护当前版本

#### 硬规则

- [ ] 旧 Web 主流程继续保留
- [ ] 新 engine 先不直接替换 `GameInterface` 主链路
- [ ] 所有新逻辑优先落在 `app/core/`
- [ ] 当前线上版本 `0.5.6` 在重构期持续可维护

#### 版本策略

##### 当前线上线

- 继续按正常 patch 版本推进
- 只记录用户可见的稳定变更

##### 重构线

- engine 抽离期间，不要每一步都 bump release 版本
- 只有当新 engine 稳定接管 Web 主流程的一部分且无明显回归时，才发布 patch release

#### 完成标准

- [ ] 半完成重构不会污染线上主行为
- [ ] 当前用户可见版本可继续独立迭代

---

## Phase 2：Web 并行接入 Shared Engine（影子接线）

### 目标

不替换旧逻辑，先让 Web 能并行调用新 engine 进行验证。

### TODO

- [ ] 建立 Web → SessionState 映射层
- [ ] 让 start / choice / free input / retry 四条主链先能走新 engine
- [ ] 保持旧逻辑仍可回退
- [ ] 增加最小开发态对照能力

### 完成标准

- [ ] UI 基本无感
- [ ] 新 engine 能在 Web 下跑完整一轮
- [ ] 旧逻辑仍然可回退

---

## Phase 3：Parser / Update Policy 稳定化

### TODO

- [ ] choices parser 稳定化
- [ ] story state extractor 稳定化
- [ ] realm parser 稳定化
- [ ] location parser 稳定化
- [ ] update policy 稳定化
- [ ] malformed response 容错统一

### 完成标准

- [ ] `story.ts` 明显瘦身
- [ ] parser 逻辑可单测、可复用
- [ ] prompt 漂移带来的风险降低

---

## Phase 4：Web 主流程正式切到 Shared Engine

### TODO

- [ ] `GameInterface.tsx` 只保留 UI / 展示 /交互接线
- [ ] gameplay 主流程改为调用 shared engine
- [ ] `startGame` / `submitChoice` / `submitFreeInput` / `retry` 全部走 engine
- [ ] 保留一段时间旧实现作为 fallback 参考

### 暂时不要动

- [ ] Save/load/export 的大改
- [ ] SettingsPanel 的大改
- [ ] 阅读主题系统的大改

### 完成标准

- [ ] Web 仍正常跑
- [ ] `GameInterface.tsx` 显著瘦身
- [ ] gameplay 主路径不再深耦合 UI

---

## Phase 5：Telegram MVP Shell

### MVP 范围

- [ ] `/start`
- [ ] 名字 / 性别初始化
- [ ] 选项推进
- [ ] 自定义输入
- [ ] `/status`
- [ ] `/retry`
- [ ] `/restart`

### 暂不做

- [ ] 用户自配 API key
- [ ] 复杂存档
- [ ] 富导出
- [ ] 流式编辑消息
- [ ] 所有 Web UI 特性迁移

### 完成标准

- [ ] Telegram 能基于 shared engine 完成完整故事一轮
- [ ] 不重复实现 parser / engine / update policy 逻辑

---

## Phase 6：Telegram 存储与适配增强

### TODO

- [ ] 定义 `SessionStorageAdapter`
- [ ] 实现 SQLite adapter（MVP）
- [ ] 设计 `users / sessions / messages / saves` 表
- [ ] callback_data 仅保存 `sessionId + index`
- [ ] active session 规则

---

## Phase 7：双端稳定化

### TODO

- [ ] 统一 engine contract
- [ ] 双端共享测试样例
- [ ] 统一 changelog 规则
- [ ] 管理模块状态：active-development / stabilizing / stable-ish / stable

---

## 成功标准

- [ ] Web 版仍能正常跑
- [ ] `GameInterface.tsx` 显著瘦身
- [ ] story parser 有基础测试覆盖
- [ ] engine 不依赖 React/browser
- [ ] Telegram 能基于同一 engine 完成完整故事流转
- [ ] Telegram 不重复实现 story logic

---

## 当前推荐的下一步

如果立刻开工，建议只做以下 4 个动作：

1. 新建 `app/core/session/types.ts`
2. 新建 `app/core/story-parser/*` 的最小骨架
3. 新建 `app/core/story-engine/engine.ts`
4. 先补 parser 相关第一批测试

> 第一阶段先证明“shared engine 可以存在”，不要一上来就追求“shared engine 已全面替换 Web”。
