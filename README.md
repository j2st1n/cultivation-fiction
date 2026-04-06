# 修仙互动小说游戏

AI 驱动的网页端互动小说游戏，支持修仙世界观、多分支剧情、选项与自由输入混合交互，以及浏览器本地存档。

## 功能

- 🤖 AI 对话互动：支持自定义 AI API（OpenAI / DeepSeek / Claude / 兼容 OpenAI 格式的接口）
- 📖 修仙世界设定：境界体系、善恶值、派系势力、开放式剧情走向
- ✍️ 混合输入模式：预设选项 + 自由输入
- 💾 存档管理：保存进度、导出小说 txt、导出存档 json
- ⚙️ 设置面板：切换 AI 提供商、配置模型、Endpoint、API Key

## 推荐部署方式

### 1. Vercel

适合公开 GitHub 仓库，一键导入即可部署。

1. 打开 [Vercel](https://vercel.com)
2. 使用 GitHub 登录
3. 导入 `cultivation-fiction` 仓库
4. 直接部署

### 2. Docker Compose

适合本地或自托管服务器部署。

```bash
docker compose up -d
```

访问 `http://localhost:3000`

## 本地开发

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
```

静态输出位于 `out/` 目录。

## AI 配置

首次进入游戏后，在设置面板中：

- 选择预设供应商
- 或手动输入 API Endpoint 和 API Key

所有配置保存在浏览器 `localStorage`，不会上传到仓库或服务器。

## 部署说明

更详细的部署说明见 [DEPLOY.md](./DEPLOY.md)。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
