# 修仙互动小说游戏

AI驱动的网页端互动小说游戏，部署于 Cloudflare Pages。

## 功能

- 🤖 AI 对话互动 - 支持自定义 AI API（OpenAI/DeepSeek/Claude 等）
- 📖 修仙世界设定 - 境界体系、善恶值、派系势力
- 💾 存档管理 - 保存进度、导出小说（txt）、导出存档（json）
- ⚙️ 设置面板 - 切换 AI 供应商、配置 API

## 部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages → 创建应用程序 → Pages
3. 连接到 GitHub，选择 `cultivation-fiction` 仓库
4. 配置：
   - 构建命令：`npm run build`
   - 输出目录：`out`
5. 部署完成

## 本地开发

```bash
npm install
npm run dev
```

## 构建静态页面

```bash
npm run build
# 输出在 out/ 目录
```

## 配置 AI

首次进入游戏后，在设置面板中：
- 选择预设供应商（DeepSeek/OpenAI 等）
- 或手动输入 API Endpoint 和 API Key

所有配置保存在浏览器 localStorage，不上传到服务器。

## 技术栈

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Zustand（状态管理）
- Cloudflare Pages（部署）