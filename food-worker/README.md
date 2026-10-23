# 食品实时搜索服务

旧版 Open Food Facts `/cgi/search.pl` 可能返回 503；官方 Search-a-licious `/search` 可查询，但不向任意网页开放跨域读取。GitHub Pages 是静态托管，不能运行 Node API。不能用 `mode: no-cors` 读取 JSON，也不应把用户查询发给不受控的公共 CORS 转发站。

## 已内置的静态备用结果

根目录 `food-cache.json` 是从 **正式服务** `https://search.openfoodfacts.org` 抓取的有限食品库快照，覆盖面包、牛奶、米饭等常见查询；不是测试库，不补造未知营养素。每组查询有独立抓取时间。实时查询不可用时页面明确显示“快照 / 非实时”，并只报告快照内数量，不冒充完整食品库。没有对应快照的查询仍显示服务状态，不假装“没有食品”。

手动刷新：

```sh
npm run food:update-cache
# 或只更新特定英文查询
npm run food:update-cache -- bread milk
```

需要可访问正式服务的 Node.js；代理环境建议 Node.js 24.5+。查询间隔至少 6.5 秒，保留失败查询的旧快照和旧日期，不把失败当作新数据。数据授权见 [food-cache.LICENSE.md](../food-cache.LICENSE.md)。

## GitHub Pages 启用完整实时搜索

备用快照不等于完整实时搜索。需要在自己的 Cloudflare 账号部署本目录 Worker，不需要 OpenAI 或食品 API 密钥：

1. 修改 `wrangler.toml` 的 `ALLOWED_ORIGIN` 为网页 origin（例如 `https://hajayyang.github.io`，不包含项目路径）。多个 origin 用逗号分隔，不填通配符。
2. 在安全终端登录并部署：

   ```sh
   npx wrangler@4 login
   npx wrangler@4 deploy --config food-worker/wrangler.toml
   ```

3. 把部署得到的服务**根地址**写入 `index.html`：

   ```html
   <meta name="food-service" content="https://你的食品服务.workers.dev">
   ```

4. 提交并等 GitHub Pages 完成构建。搜索面包，确认结果不再显示“快照”；再测试新的关键词及下一页。

此目录提供部署代码，仓库没有预设已开通的公共 Worker 地址或账号令牌。不得填写模型密钥或 Cloudflare token 到网页。

## Node 部署

`npm start` 内置同源 `GET /api/food-search?query=面包&page=1`，无需填写 meta 地址。正式部署确保反向代理转发 `/api/food-search`；HTTPS 代理可提供 `X-Forwarded-Proto: https`。已有网页的静态部署仅更新 `server.js` 不会生效。

查询服务只访问固定官方搜索 origin 和固定字段，不接受任意 URL，不转发 Cookie/Authorization，不接收饮食/身体记录。单次最多 8 项，最多 100 页，12 秒超时，响应最多 1 MiB。相同查询合并在途请求，缓存 10 分钟/最多 50 组，实例内最多每分钟 10 个新查询；公共服务部署者还应根据并发规模设置平台级流量限制。

本地或 Worker 的上游 5xx、无效 JSON、超时和限流会返回结构化状态。页面区分服务错误与网络连接失败，不一律归因于用户网络。快照仅为只读公共食品资料，不写入健康记录或账号备份。
