# 修仙互动小说游戏

AI 驱动的网页端互动小说游戏，支持修仙世界观、多分支剧情、选项与自由输入混合交互，以及浏览器本地存档。

<p>
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fj2st1n%2Fcultivation-fiction&project-name=cultivation-fiction&repository-name=cultivation-fiction" target="_blank" rel="noopener noreferrer">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

## 功能

- 🤖 AI 对话互动：支持自定义 AI API（OpenAI / DeepSeek / Claude / 兼容 OpenAI 格式的接口）
- 📖 修仙世界设定：境界体系、善恶值、派系势力、开放式剧情走向
- ✍️ 混合输入模式：预设选项 + 自由输入
- 💾 存档管理：保存进度、导出小说 txt、导出存档 json
- ⚙️ 设置面板：切换 AI 提供商、配置模型、Endpoint、API Key

## 推荐部署方式

### 1. Vercel

适合公开 GitHub 仓库，一键导入即可部署。

#### 一键部署

点击上方 **Deploy with Vercel** 按钮即可。

> 如果 Vercel 导入页面里出现 Output Directory，请保持默认或留空，不要手动填写 `out`。

如果手动导入：

1. 打开 [Vercel](https://vercel.com)
2. 使用 GitHub 登录
3. 导入 `cultivation-fiction` 仓库
4. 直接部署

#### 部署后首次使用

部署成功后，首次打开应用时需要在设置面板中填写：

- AI API Endpoint
- API Key
- 模型名称

这些配置保存在浏览器 `localStorage`，不会上传到仓库或服务器。

### 2. Docker Compose

适合本地或自托管服务器部署。Docker 容器会先构建静态站点，再以静态文件服务器方式托管 `out/`。

```bash
docker compose up -d
```

访问 `http://localhost:3000`

> 这里运行的是静态文件服务，不是 `next start`。

## 本地开发

```bash
npm install
npm run dev
```

上面是开发模式。

如果要本地预览最终静态产物：

```bash
npm run build
npm run preview
```

## 生产构建

```bash
npm run build
```

静态输出位于 `out/` 目录，可直接交给任意静态文件服务器托管。

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
