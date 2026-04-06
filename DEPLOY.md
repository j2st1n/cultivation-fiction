# 部署说明

本项目当前是 **静态导出 Next.js 应用**，构建后产物位于 `out/` 目录。

## 方式一：Vercel

适合公开 GitHub 仓库，流程最简单。

1. 打开 https://vercel.com
2. 使用 GitHub 登录
3. 导入 `cultivation-fiction` 仓库
4. 直接部署

## 方式二：Docker Compose

适合本地运行或服务器自托管。

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

## AI API 配置

应用内置设置面板，支持：

- DeepSeek
- OpenAI
- Anthropic
- 任何兼容 OpenAI API 格式的端点

用户首次使用时在应用内填写 API Endpoint 和 API Key 即可。

这些配置保存在浏览器本地，不依赖部署平台环境变量。
