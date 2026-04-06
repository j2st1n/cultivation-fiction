# 部署说明

## 方式一：Vercel（推荐）

1. 打开 https://vercel.com
2. 使用 GitHub 登录
3. 点击 "Add New..." → "Project"
4. 选择 `cultivation-fiction` 仓库
5. 点击 "Deploy"（无需配置）

**注意**：由于 AI API 需要用户自定义配置，首次部署后需要在 Vercel 环境变量中设置，或在应用内手动配置。

---

## 方式二：Docker Compose（本地运行）

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

访问 http://localhost:3000

---

## 方式三：Cloudflare Workers（可选）

如需部署到 Cloudflare Workers：

1. 创建 `wrangler.jsonc`：
```json
{
  "name": "cultivation-fiction",
  "compatibility_date": "2026-04-06",
  "assets": {
    "directory": "out"
  }
}
```

2. 本地安装 wrangler 并部署：
```bash
npm install -g wrangler
wrangler deploy
```

3. 需要配置 `CLOUDFLARE_API_TOKEN` 环境变量

---

## AI API 配置

应用内置设置面板，支持以下 API：
- DeepSeek
- OpenAI
- Anthropic
- 任何兼容 OpenAI API 格式的端点

用户首次使用需在设置中配置 API Endpoint 和 Key。