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

## 方式二：Cloudflare Pages

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

## AI API 配置

用户首次使用时在应用内填写 API Endpoint 和 API Key 即可。

这些配置保存在浏览器本地，不依赖部署平台环境变量。
