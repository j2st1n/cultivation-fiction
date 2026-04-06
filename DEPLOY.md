# 部署说明

本项目当前是 **静态导出 Next.js 应用**，构建后产物位于 `out/` 目录。

部署时不需要运行 Next.js 服务端，只需要托管 `out/` 中的静态文件。

## 方式一：Vercel

适合公开 GitHub 仓库，流程最简单。

一键部署按钮：

`https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fj2st1n%2Fcultivation-fiction&project-name=cultivation-fiction&repository-name=cultivation-fiction`

1. 打开 https://vercel.com
2. 使用 GitHub 登录
3. 导入 `cultivation-fiction` 仓库
4. 直接部署

注意：如果导入页面里显示 Output Directory，请保持默认或清空，不要手动填写 `out`。

部署成功后，首次打开应用时，需要在页面设置面板中手动填写 AI API Endpoint / API Key / 模型名称。

这些配置保存在浏览器本地，不依赖 Vercel 环境变量。

## 方式二：Docker Compose

适合本地运行或服务器自托管。

当前 Docker 方案会：

1. 执行 `npm run build`
2. 生成静态产物 `out/`
3. 使用静态文件服务器托管 `out/`

启动：

```bash
docker compose up -d
```

查看日志：

```bash
docker compose logs -f
```

停止：

```bash
docker compose down
```

默认访问地址：

`http://localhost:3000`

说明：这里提供的是静态站点预览，不是 `next start` 形式的 Next.js 服务。

## 方式三：Cloudflare Pages

适合当前静态导出版本。

Cloudflare Pages 配置：

- Build command: `npm run build`
- Output directory: `out`

建议流程：

1. 打开 Cloudflare Dashboard
2. 进入 **Workers & Pages**
3. 新建 **Pages** 项目
4. 连接 GitHub 仓库 `cultivation-fiction`
5. 填入上面的构建配置并部署

注意：

- 当前项目走的是静态导出路径，不需要 `next start`
- 不要切到 Worker / SSR 部署模式
- AI 配置仍然在浏览器本地保存，不依赖 Cloudflare 环境变量

## 方式三：Cloudflare Pages（静态导出路径）

适合将静态导出产物直接托管在 Cloudflare Pages 上，避免服务端渲染（SSR）与 Workers 的复杂性。

前提：项目通过 Next.js 静态导出产物输出到 out/ 目录（已在本仓库的 DEPLOY 说明中实现）。

1) 构建产物
- 运行：`npm install`，然后执行 `npm run build && npm run export`，产物将放置于 `out/` 目录。
- 如果你在本地或 CI 端想要一次性完成，请确保 `package.json` 已包含 `export` 脚本（见下方变更建议）。

2) Cloudflare Pages 配置
- Build command（构建命令）：`npm ci && npm run build && npm run export`
- Build output directory（输出目录）：`out`
- 流程说明：Pages 将直接托管 `out/` 目录中的静态文件，无需部署服务端。
- 注意：若站点使用了动态路由或需要客户端路由保护，请确保全部页面为静态导出页面，静态资源可在 `out/` 中访问。

3) 兼容性与注意事项
- 该方案明确不涉及旧的 API 令牌工作流、Worker 框架或其他 SSR 模式。
- 只要页面是静态导出产物，Cloudflare Pages 的静态托管即可工作。
- AI 配置、模型端点等配置仍保存在浏览器本地存储中，且不上传至部署端。

## AI API 配置

应用内置设置面板，支持：

- DeepSeek
- OpenAI
- Anthropic
- 任何兼容 OpenAI API 格式的端点

用户首次使用时在应用内填写 API Endpoint 和 API Key 即可。

这些配置保存在浏览器本地，不依赖部署平台环境变量。
