# 拍照识别服务：OpenAI / 阿里云百炼 Qwen / DeepSeek

浏览器拍照并压缩为 JPEG，明确同意后发送给独立的识别服务。服务端选择 OpenAI Responses API、百炼或 DeepSeek OpenAI 兼容 Chat Completions API，并将结果归一化为相同的餐食 JSON。用户仍需编辑、选择并确认后才能记入饮食。GitHub Pages 只能提供网页，不能运行此服务。

## DeepSeek 接入

当前官方视觉指南推荐 **`deepseek-flash`**，支持在用户消息中发送图片与文字。本项目使用官方 `https://api.deepseek.com/chat/completions`，显式设置 `thinking={"type":"disabled"}` 和 JSON Object 输出，再执行相同的食物字段校验。不要将百炼的 `enable_thinking` 参数套用到 DeepSeek，也不要根据旧文本模型名推断图片能力。

1. 在 [DeepSeek 开放平台](https://platform.deepseek.com/) 创建 API Key 并确认账号额度与模型权限。这里需要 DeepSeek 官方 API Key，不是阿里云百炼密钥。
2. 仓库已提供独立 `[env.deepseek]` 配置：

   ```toml
   [env.deepseek.vars]
   ALLOWED_ORIGIN = "https://hajayyang.github.io"
   VISION_PROVIDER = "deepseek"
   DEEPSEEK_MODEL = "deepseek-flash"
   ```

   DeepSeek 上游地址固定为官方接口，不接受浏览器传入或任意代理覆盖。若修改模型，需先确认该模型支持图片输入及 JSON 输出；连接检测不会验证模型权限。
3. 在已登录 Cloudflare 的本地安全终端执行，密钥和访问码只在交互提示中输入：

   ```sh
   npx wrangler@4 secret put DEEPSEEK_API_KEY --env deepseek --config worker/wrangler.toml
   npx wrangler@4 secret put PHOTO_ACCESS_TOKEN --env deepseek --config worker/wrangler.toml
   npx wrangler@4 deploy --env deepseek --config worker/wrangler.toml
   ```

   若尚未登录，先执行 `npx wrangler@4 login`。服务访问码使用另行生成的 24–512 字符随机值，不能与模型 API Key 相同。DeepSeek、Qwen 与默认 OpenAI 环境的 secrets 独立，不会继承或相互替代。
4. 网页“拍照记餐 → 识别服务设置”填写部署后的 Worker 根地址和服务访问码，检测连接应显示 `DeepSeek / deepseek-flash`。不能填写 DeepSeek API 根地址或 API Key。
5. 用真实餐食照片做一次识别，核对名称、份量及营养估算后再保存。测试和打包不消耗模型额度，也不代表生产服务已经启用；真实识别必须在配置密钥后验证。服务异常时不自动切换到 OpenAI 或百炼，不重复发出收费请求。

仅照片和界面语言发送到模型，不发送用户身体数据或历史饮食记录。DeepSeek 返回的推理过程不传给网页，截断、无效 JSON、非法营养值或模型拒绝不会生成饮食记录。图片按服务商规则计费、处理，不能承诺模型服务商零保留。

官方资料：[视觉输入](https://api-docs.deepseek.com/guides/vision)、[JSON 输出](https://api-docs.deepseek.com/guides/json_mode)、[Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion)。已于 2026-10-29 核对当前文档；后续模型与价格以官方为准。

## 百炼 Qwen 接入

仓库提供独立的 Wrangler `qwen` 环境，默认示例模型为 **`qwen3-vl-flash`**，也可设置为 **`qwen3-vl-plus`**。两者的非思考模式支持图片输入和 JSON Object 输出；服务会设置 `enable_thinking=false`，再对返回内容执行本地字段、数量、范围和未知值校验。模型是否可用取决于具体地域、账号权限和额度；不能将纯文本模型当作视觉模型使用。

1. 在阿里云百炼开通模型服务与额度，创建 API Key，并确认对应地域及业务空间的 **OpenAI 兼容 Base URL**。
2. 编辑 `worker/wrangler.toml` 的 `[env.qwen.vars]`：

   ```toml
   ALLOWED_ORIGIN = "https://hajayyang.github.io"
   VISION_PROVIDER = "dashscope"
   DASHSCOPE_MODEL = "qwen3-vl-flash"
   DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
   ```

   上例为北京共享域名，官方目前仍支持。生产环境优先使用控制台提供的业务空间专属 URL，例如 `https://你的业务空间ID.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`。**Base URL 必须与 API Key 的地域、业务空间和计费方案匹配**，不要把北京地址与新加坡密钥混用。这里填写模型 API 的地址，网页里填写的是部署后的识别服务根地址，两者不同。

   | 地域 | 共享 OpenAI 兼容 Base URL |
   | --- | --- |
   | 北京 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
   | 新加坡 | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
   | 美国弗吉尼亚 | `https://dashscope-us.aliyuncs.com/compatible-mode/v1` |
   | 中国香港 | `https://cn-hongkong.dashscope.aliyuncs.com/compatible-mode/v1` |

   业务空间专属域名支持 `cn-beijing`、`ap-southeast-1`、`us-east-1`、`eu-central-1`、`cn-hongkong`。服务只允许上述阿里云官方主机和 `/compatible-mode/v1` 路径，拒绝任意代理、HTTP、用户凭据、查询参数和非标准端口。模型在各地域的供应以控制台为准。
3. 在安全的本地终端登录 Cloudflare，再逐条执行下列命令，在交互提示中输入值。**不要将真实密钥写入命令、仓库或聊天**：

   ```sh
   npx wrangler@4 login
   npx wrangler@4 secret put DASHSCOPE_API_KEY --env qwen --config worker/wrangler.toml
   npx wrangler@4 secret put PHOTO_ACCESS_TOKEN --env qwen --config worker/wrangler.toml
   npx wrangler@4 deploy --env qwen --config worker/wrangler.toml
   ```

   `DASHSCOPE_API_KEY` 是百炼的模型密钥；`PHOTO_ACCESS_TOKEN` 是另行生成的 24–512 字符随机访问码，不能与任何模型密钥相同。访问码用于授权使用本服务。Qwen 环境不需要 OpenAI 密钥，也不会自动回退到 OpenAI。
4. 在应用打开“拍照记餐 → 识别服务设置”，填入部署结果中的 `https://你的服务.workers.dev` 根地址和**服务访问码**，点击“检测服务连接”。新服务会显示 `阿里云百炼 Qwen / 模型名`。不要把百炼密钥或模型 API Base URL 填进网页。
5. 选择真实餐食照片，勾选发送同意，识别并核对后保存。连接检测仅验证服务端配置和访问码，**不验证真实模型权限、密钥有效性、余额或识别效果**，必须再完成一次真实照片识别。

官方资料：[图像与视频理解](https://help.aliyun.com/zh/model-studio/vision)、[结构化输出](https://help.aliyun.com/zh/model-studio/json-mode)、[Base URL 与地域](https://help.aliyun.com/zh/model-studio/base-url)。接入依据核对日期：2026-10-29；模型、地域、价格及额度以百炼控制台最新信息为准。

## 保留 OpenAI 方案

原有默认环境不变：`VISION_PROVIDER=openai`（未填写也默认为 OpenAI），`VISION_MODEL=gpt-4.1-mini`。需要已开通 API 计费/额度且有视觉模型权限的 OpenAI 项目；ChatGPT 订阅不等于 API 额度。

1. 编辑 `worker/wrangler.toml` 中默认 `[vars]` 的 `ALLOWED_ORIGIN`。
2. 在本地安全终端执行，值仅在交互提示中输入：

   ```sh
   npx wrangler@4 login
   npx wrangler@4 secret put OPENAI_API_KEY --config worker/wrangler.toml
   npx wrangler@4 secret put PHOTO_ACCESS_TOKEN --config worker/wrangler.toml
   npx wrangler@4 deploy --config worker/wrangler.toml
   ```

3. 在网页填写部署后的识别服务根地址及访问码，再检测连接、发送真实照片验证。

默认环境、`--env qwen` 和 `--env deepseek` 的 secrets 互相独立。更换 OpenAI 模型时选择支持图像输入和 Responses API 结构化输出的模型。未配置、无权限或不兼容时返回错误，不生成虚假结果。

## 来源与网页配置

`ALLOWED_ORIGIN` 采用精确 origin。GitHub Pages 示例为 `https://hajayyang.github.io`，不包含 `/Daily-Food-Diary/` 路径；多个来源以逗号分隔，不使用 `*`。

也可在 `index.html` 的 `photo-service` meta 标签中预设部署后的服务根地址。不能预设访问码或模型密钥。浏览器只保存服务地址，访问码仅保留在当前页面内存。

## 本地开发

建议 Node.js 24，项目最低要求 22.13，不需要安装应用运行依赖。

1. 将 `worker/.dev.vars.example` 复制为 `worker/.dev.vars`，在本机安全编辑；该文件已忽略，不要提交。
2. 测试 Qwen 时设置 `VISION_PROVIDER=dashscope`，填写 `DASHSCOPE_API_KEY`、`DASHSCOPE_BASE_URL` 和独立访问码；测试 DeepSeek 时使用 `VISION_PROVIDER=deepseek`、`DEEPSEEK_API_KEY` 与 `DEEPSEEK_MODEL=deepseek-flash`；测试 OpenAI 时使用 `VISION_PROVIDER=openai` 与 `OPENAI_API_KEY`。
3. 两个终端从仓库根目录分别运行：

   ```sh
   npm start
   npm run photo:dev
   ```

4. 页面填写 `http://localhost:8787` 与本地访问码。识别开发服务仅监听本机 8787，前端端口为 3000。Node.js 24 会沿用已有 HTTP(S) 代理配置及 CA 信任，不关闭 TLS 验证。

`npm start` 仅公开白名单资源，不提供 `worker/`、密钥文件、Git 元数据或测试文件。不要使用公开整个仓库目录的文件服务器运行含真实密钥的项目。

## API 与限制

- `GET /api/health`：需允许的 Origin 和 Bearer 访问码；返回 `ready: true`、当前 `provider`、`model`，百炼另有 `region`。仅代表配置完整，不会调用收费模型或返回密钥。
- `POST /api/recognize-meal`：`Authorization: Bearer <访问码>`，JSON `{ "image": "data:image/jpeg;base64,...", "language": "zh-CN" }`；也支持 `en`、`ja`、`ko`。客户端不能指定提供方、模型或上游 URL，不转发身体数据和已有记录。
- 请求最大约 2.1 MB，JPEG 最大 1.5 MB；不接受外部图片 URL。原图最大 12 MB，客户端压缩最长边至 1600px 并重新编码，不发送原始 EXIF。
- 调用最长 45 秒。每 Worker 实例每来源 IP 最多 6 次/分钟，这是尽力限流而非跨实例配额。公开服务应另加用户认证、持久化配额与费用上限。
- 百炼与 DeepSeek 使用各自的非思考 JSON Object 模式，格式正确不代表字段正确，因此返回结果再次验证。截断、拒绝、无效 JSON、非法数值和缺失字段均拒绝入账；服务异常不会暗中切换模型提供方或重试产生多次调用。
- 应用不记录或持久化照片、请求体和模型密钥。OpenAI 请求使用 `store:false`；百炼与 DeepSeek 不发送这个 OpenAI 专用选项。各家均适用各自数据处理政策，这不等于服务商零保留。
- 图中指令视为不可信内容，只提取餐食。数值是整份食物的估算，不是每 100 g 成分表；重量、油脂和热量仍需人工核对，不能依靠照片诊断过敏、判断食品安全或推断维生素、矿物质与水含量。

## 验证

仓库根目录运行 `npm test`。测试以受控模型响应覆盖 OpenAI、Qwen 和 DeepSeek 的请求/响应格式、非思考 JSON 输出、地域/业务空间地址校验、鉴权、来源、限流、大小限制、未知值、截断、拒绝及错误脱敏，不消耗模型额度。`e2e/photo.mjs` 验证 Qwen 完整拍照核对保存流程及四语言连接状态；`e2e/photo.mjs deepseek` 以同一流程验证 DeepSeek。两者使用模拟服务而非真实模型。

部署前可执行：

```sh
npx wrangler@4 deploy --dry-run --env qwen --config worker/wrangler.toml
npx wrangler@4 deploy --dry-run --env deepseek --config worker/wrangler.toml
```

打包成功和受控测试通过不代表服务已部署、密钥已配置或真实 Qwen / DeepSeek 识别已验证。上线后需要在对应账号与地域用真实餐食照片测试。
