# 拍照识别服务（Cloudflare Worker + OpenAI）

浏览器拍照、压缩为 JPEG，明确同意发送后请求此 Worker。Worker 调用 OpenAI Responses API，以结构化 JSON 返回最多 10 种食物；浏览器让用户编辑、选择并确认后写入本地记录。GitHub Pages 只能托管网页，不能直接运行此服务。

## 部署

需要 Cloudflare 账号、已开通 API 计费/额度且可使用视觉模型的 OpenAI 项目。ChatGPT 订阅不等于 OpenAI API 额度。

1. 从仓库根目录执行下面命令，按提示登录 Cloudflare：

   ```sh
   npx wrangler@4 login
   ```

2. 编辑 `worker/wrangler.toml` 中 `ALLOWED_ORIGIN`。GitHub Pages 默认示例为 `https://hajayyang.github.io`，不包含 `/Daily-Food-Diary/` 路径；自定义域名需使用自己的精确 origin。多来源用逗号分隔，不使用 `*`。
3. 在安全的本地终端逐条执行，并在交互提示中输入值，不写在命令、源码或聊天里：

   ```sh
   npx wrangler@4 secret put OPENAI_API_KEY --config worker/wrangler.toml
   npx wrangler@4 secret put PHOTO_ACCESS_TOKEN --config worker/wrangler.toml
   ```

   `OPENAI_API_KEY` 是服务端模型密钥；`PHOTO_ACCESS_TOKEN` 使用至少 24 字符的随机访问码，由服务管理员保管、分发给获准使用者。两者不能相同，不要在网页填写模型密钥。
4. 部署：

   ```sh
   npx wrangler@4 deploy --config worker/wrangler.toml
   ```

5. 打开网页“拍照记餐 → 识别服务设置”，填入部署后得到的 `https://你的服务.workers.dev` 根地址与访问码，点击“检测服务连接”。也可在 `index.html` 的 `photo-service` meta 标签中预设服务根地址，**不能预设访问码或模型密钥**。
6. 选择一张真实餐食图片，勾选发送同意，开始识别；核对份量与营养值后保存。连接检测只验证 Worker 配置与访问码，不验证 OpenAI 权限或余额，需完成一次实际识别。

默认 `VISION_MODEL=gpt-4.1-mini`。更换时应选择支持图像输入与结构化输出的模型；不兼容或无权限时会显示服务异常，不回退到伪造结果。

## 本地开发

需要 Node.js 22.9+（运行可选 env 文件命令），不需要安装应用依赖。

1. 将 `.dev.vars.example` 复制为 `worker/.dev.vars`，在本机安全编辑填入真实值。该文件已忽略，请勿提交。
2. 两个终端从仓库根目录分别运行：

   ```sh
   npm start
   npm run photo:dev
   ```

3. 前端服务端口为 3000，开发识别 API 仅监听本机 8787；在页面中填写 `http://localhost:8787` 与本地访问码。`.dev.vars` 的 `ALLOWED_ORIGIN` 示例允许本地前端。

`npm start` 仅提供白名单中的网页资源，不提供 `worker/`、本地密钥文件、Git 元数据或测试文件。不要使用会公开整个仓库目录的文件服务器来运行包含真实 `.dev.vars` 的本地项目。

## API 与限制

- `GET /api/health`：需要允许的网站 Origin 和 Bearer 访问码；返回 `ready: true` 只表示配置存在。
- `POST /api/recognize-meal`：`Authorization: Bearer <访问码>`，JSON `{ "image": "data:image/jpeg;base64,...", "language": "zh-CN" }`。语言还支持 `en`、`ja`、`ko`。
- 请求最大约 2.1 MB，JPEG 最大 1.5 MB；不接受外部图片 URL。客户端原图最大 12 MB，压缩最长边至 1600px 并重新编码，原始 EXIF 不发送。
- 模型调用最长 45 秒。每个 Worker 实例按来源 IP 最多 6 次/分钟；这是尽力限流，不是跨实例的严格配额。
- 访问码用于个人或有限分享场景。大规模公开使用应增加用户认证、持久化配额与费用上限，不能移除鉴权后无限制调用模型。
- 应用不记录或持久化照片、请求体和密钥；请求使用 `store: false`。这不等于模型服务商零保留，仍适用服务商的数据处理政策。
- 图中指令视为不可信内容；只提取餐食，结果仍按字段、数量及数值范围检查。识别值是图中整份食物的估算，不是食品成分表，也不保证热量、油脂、份量、过敏原或食品安全判断。

## 验证

仓库根目录运行 `npm test`。测试通过受控模型响应覆盖鉴权、来源、限流、大小限制、结构化请求、空值、拒绝与错误处理，不消耗 API 额度。

部署前可执行：

```sh
npx wrangler@4 deploy --dry-run --config worker/wrangler.toml
```

试运行打包成功不代表服务已部署或真实视觉识别已验证；上线后需用真实照片测试。
