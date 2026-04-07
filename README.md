# Cultivation Fiction

[中文说明](#cultivation-fiction-中文说明)

AI-powered interactive cultivation novel game for the web.

Players can start a new run with a custom name, gender, and AI provider, then experience an open-ended xianxia story with branching choices, free-form input, local save data, and dynamic AI-generated openings.

<p>
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fj2st1n%2Fcultivation-fiction&project-name=cultivation-fiction&repository-name=cultivation-fiction" target="_blank" rel="noopener noreferrer">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

## Highlights

- Dynamic AI-generated opening background and main quest for each new run
- Mixed interaction mode with structured choices and free input
- In-browser save system with TXT novel export and JSON save import/export
- Configurable AI endpoint, model selection, model fetch, and connection validation
- Static deployment target for Vercel and Cloudflare Pages
- Client-side API key usage with no server-side key storage in this project

## Current Status

This project is active and intended for continued iteration.

Current priorities include:

- improving story consistency across long conversations
- surfacing more structured world state and quest tracking
- polishing the onboarding and save/load experience
- strengthening project docs and collaboration workflows

See [ROADMAP.md](./ROADMAP.md) for planned work.

## Demo Flow

1. Open the app
2. Choose a nickname and gender
3. Configure your AI endpoint, API key, and model
4. Validate the connection
5. Enter the game and receive a unique AI-generated opening
6. Progress using options or your own custom actions

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand

## Project Structure

```text
app/
  components/      UI and gameplay screens
  lib/             AI prompt logic, parsing, helpers
  store/           Zustand state stores
  types/           Shared TypeScript types
public/            Static assets
```

## Local Development

```bash
npm install
npm run dev
```

Local static preview:

```bash
npm run build
npm run preview
```

## Deployment

### Vercel

Use the deploy button above or import the repository manually.

If Vercel shows an Output Directory field, leave it empty or use the platform default unless you explicitly need `out`.

### Cloudflare Pages

Use:

- Build command: `npm run build`
- Output directory: `out`

This project is designed around static export.

More details: [DEPLOY.md](./DEPLOY.md)

## AI Configuration Notes

- Endpoint should be a base OpenAI-compatible API URL such as `https://api.openai.com/v1`
- API keys are intentionally kept in browser memory and are not committed to the repo
- Model lists can be fetched from the provider and validated before entering the game

## Save Data

- TXT export creates a readable novel-style text file
- JSON export preserves structured save data
- JSON import restores prior game state

## Security Model

This repository is a static web app. It does not proxy AI requests through a backend.

That means:

- users provide and use their own API keys locally
- this repo should never contain real secrets
- deployment should remain static unless the architecture is intentionally changed later

## Collaboration

- Bug reports: use the GitHub bug template
- Feature requests: use the GitHub feature template
- Pull requests: follow [CONTRIBUTING.md](./CONTRIBUTING.md)

## Versioning

This project is moving toward lightweight semantic versioning.

Release notes will be tracked in [CHANGELOG.md](./CHANGELOG.md).

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

---

# Cultivation Fiction 中文说明

一个基于 AI 的网页修仙互动小说游戏。

玩家可以自定义昵称、性别和 AI 提供方，在浏览器中体验开放式修仙剧情。每次新开局都可以生成不同的背景、主线与开场选项，支持选项推进与自由输入混合交互，并提供本地存档与导出能力。

## 项目亮点

- 每局随机生成不同的开场背景与主线任务
- 支持“选项 + 自由输入”的混合互动方式
- 支持浏览器本地存档、TXT 小说导出、JSON 存档导入导出
- 支持自定义 AI Endpoint、模型获取、连接验证
- 面向静态部署，适配 Vercel 与 Cloudflare Pages
- API Key 仅在客户端本地使用，不经过本项目后端托管

## 当前状态

项目正在持续迭代中。

当前重点方向：

- 提升长对话下的剧情一致性
- 增强世界状态、主线与线索的可视化
- 继续打磨新手引导和存档体验
- 完善文档、协作规范与发布节奏

详细规划见：[ROADMAP.md](./ROADMAP.md)

## 体验流程

1. 打开应用
2. 选择昵称与性别
3. 配置 AI Endpoint、API Key、模型
4. 验证连接
5. 进入游戏，接收本局独立生成的开场剧情
6. 通过选项或自由输入推进故事

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand

## 项目结构

```text
app/
  components/      界面与核心交互组件
  lib/             AI 提示词、解析逻辑、工具函数
  store/           Zustand 状态管理
  types/           共享类型定义
public/            静态资源
```

## 本地开发

```bash
npm install
npm run dev
```

本地预览静态产物：

```bash
npm run build
npm run preview
```

## 部署

### Vercel

可直接使用上方按钮一键部署，或手动导入仓库。

如果 Vercel 显示 Output Directory，通常保持默认即可；除非明确需要，否则不要手动改动。

### Cloudflare Pages

使用以下配置：

- Build command: `npm run build`
- Output directory: `out`

项目当前以静态导出为核心。

详细说明见：[DEPLOY.md](./DEPLOY.md)

## AI 配置说明

- Endpoint 应填写 OpenAI 兼容接口的基础地址，例如 `https://api.openai.com/v1`
- API Key 仅保存在浏览器内存中，不会提交到仓库
- 模型可通过接口拉取并在进入游戏前进行验证

## 存档说明

- TXT 导出用于生成可阅读的小说文本
- JSON 导出用于完整保存结构化存档
- JSON 导入可恢复历史进度

## 安全模型

本仓库是纯静态 Web 应用，不通过项目后端代理 AI 请求。

这意味着：

- 用户自行提供并本地使用 API Key
- 仓库中不应出现真实密钥
- 除非后续明确重构，否则部署方式应保持静态架构

## 协作

- Bug 反馈请使用 GitHub bug template
- 功能建议请使用 GitHub feature template
- 提交 PR 前请参考 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 版本与发布

项目正在逐步过渡到轻量语义化版本管理。

更新记录见：[CHANGELOG.md](./CHANGELOG.md)

## 许可证

本项目使用 MIT License，详见 [LICENSE](./LICENSE)
