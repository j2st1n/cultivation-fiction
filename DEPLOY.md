# 部署说明

本项目当前是 **静态导出 Next.js 应用**，构建后产物位于 `out/` 目录。

部署时不需要运行 Next.js 服务端，只需要托管 `out/` 中的静态文件。

## 方式一：Vercel

适合公开 GitHub 仓库，流程最简单。

一键部署按钮：

`https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fj2st1n%2Fcultivation-fiction&project-name=cultivation-fiction&repository-name=cultivation-fiction&output-directory=out`

1. 打开 https://vercel.com
2. 使用 GitHub 登录
3. 导入 `cultivation-fiction` 仓库
4. 直接部署

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

## AI API 配置

应用内置设置面板，支持：

- DeepSeek
- OpenAI
- Anthropic
- 任何兼容 OpenAI API 格式的端点

用户首次使用时在应用内填写 API Endpoint 和 API Key 即可。

这些配置保存在浏览器本地，不依赖部署平台环境变量。
