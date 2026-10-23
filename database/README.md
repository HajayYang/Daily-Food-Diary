# 菜品数据库

实际数据文件为 [`../data/cookbook.sqlite`](../data/cookbook.sqlite)，不是 JSON 文件改名。库中包含 **9 个分类、108 道菜、128 种食材**：原来的 12 道家常菜，以及鲁、川、粤、苏、闽、浙、湘、徽各 12 道。数据与代码采用 MIT 许可证。

## 网站如何查询

- “今天吃什么”不再导入 `recipes.js` / `regional-recipes.js` 中的菜谱数组。前端 `recipe-client.js` 调用独立 Worker，后者通过随站点提供的 sql.js 1.13.0 / SQLite WebAssembly 引擎查询真实 SQLite 文件。
- 菜系、类别、中文/英文/日文/韩文菜名、别名和食材搜索，分页、食材用量及做法均来自数据库。用量仍支持 1 / 2 / 4 人份换算。搜索使用绑定参数，不拼接用户输入为 SQL。
- GitHub Pages 直接提供公开数据库文件和引擎，无需外部 CDN、数据库账号、跨域代理或付费云服务。浏览器在本机运行查询，不向第三方发送关键词。
- 首次成功加载会把通过 SHA-256、版本、数据库类型及数量检查的数据库写入 Cache Storage。以后页面资源可加载而数据库网络请求失败时，可使用已验证缓存；页面打开后可断网继续查询。缓存关闭或额度不足时仍可使用当前页面的内存数据库。
- 这不承诺整个网页在首次离线访问或离线刷新时可用：没有缓存的 HTML、脚本或 WASM 仍需网络。数据库损坏且无有效缓存时显示重试入口，不伪装成有查询结果；饮食记录功能可独立使用。
- 公开库只含菜谱，不含任何人的身体、饮食、运动、登录或同步资料。网页不能向公开库写入。它是一份随网站发布的共享目录快照，不是已开通的云端可写数据库或多人编辑后台。

## 结构

[`schema.sql`](schema.sql) 定义外键、唯一键、数值约束、索引和 schema 版本。

| 表 | 内容 |
| --- | --- |
| `cuisines` | 菜系、地域、介绍、显示顺序 |
| `recipes` | 名称、菜系、类型、预计时间、基础人数、配餐提示 |
| `ingredients` | 食材名称、单位、已知过敏原 |
| `recipe_ingredients` | 菜品与食材关联、基础用量、显示顺序 |
| `recipe_steps` | 每道菜的有序烹饪步骤 |
| `recipe_aliases` | 常见别名与英文检索别名 |
| `translations` | 菜系、食材、菜名、步骤的英语、日语、韩语文案 |
| `recipe_search` | 每道菜四种语言的规范化检索文本 |
| `nutrient_definitions` / `ingredient_nutrients` | 热量、宏量营养素及具体维生素、矿物质、水的数值、单位、来源和计量基准 |
| `catalog_meta` | 数据版本、schema 版本、许可与用途 |

营养表按每 100 g 可食部分保存，**缺行代表未知，不是零**。初始只迁移与现有食材状态完全一致的熟米饭参考数据；生鸡肉、生西兰花、生鸡蛋不会套用熟食品数值。其余食材待补入可靠来源，不会编造完整营养或整道菜的热量，也不把食谱自动记录为已吃。

可以使用 SQLite / DB Browser for SQLite 打开文件，或查询：

```sql
SELECT c.name AS 菜系, COUNT(r.id) AS 菜数
FROM cuisines c LEFT JOIN recipes r ON r.cuisine_id = c.id
GROUP BY c.id ORDER BY c.position;

SELECT r.name, i.name AS 食材, ri.amount AS 基础用量, i.unit
FROM recipes r JOIN recipe_ingredients ri ON ri.recipe_id = r.id
JOIN ingredients i ON i.id = ri.ingredient_id
WHERE r.id = 'chuan-kungpao' ORDER BY ri.position;
```

## 维护和发布

需要 Node.js **22.13+**，建议使用已验证的 Node.js 24。不需要 `npm install`，引擎、许可证和数据库已随仓库提供。

```sh
npm run db:check
npm test
npm start
```

原有 `recipes.js` / `regional-recipes.js` 保留为可重复导入的种子文件，`locales.js` 提供初始翻译。新增或修改配方、菜系、翻译、过敏原、来源营养数据时：

1. 修改相应种子文件；营养来源映射在 `database/catalog.js`。同一食材的生熟状态、单位和来源必须对应。
2. 运行 `npm run db:build`。此命令从种子**重新生成并替换**公开 SQLite 文件及校验清单；直接在 SQLite 工具中的未回填种子的编辑会被覆盖，因此编辑前另存副本并同步回种子。
3. 运行 `npm run db:check` 和 `npm test`，并按 [`../e2e/README.md`](../e2e/README.md) 运行浏览器测试。
4. 把代码、`data/cookbook.sqlite`、`data/cookbook-manifest.json` 一起提交和发布。新内容产生新的内容版本，页面会校验并更新缓存。正在打开的页面保留当前查询快照，刷新后载入新版。使用 Node API 时需重启 Node 服务，释放旧的只读连接并读取新文件。

`db:check` 检查 SQLite 文件头、SHA-256、版本、外键、完整性、所有菜谱与导入源的一致性，防止只改种子而漏发数据库。Node CI 也执行这些检查。

静态部署必须一并发布 `data/`、`vendor/sqljs/`、`recipe-client.js`、`recipe-query.js` 和 `recipe-db-worker.js`。WebAssembly 在 Worker 中运行，无需 SharedArrayBuffer 或 GitHub Pages 不支持的 COOP/COEP 配置；浏览器需支持 Worker、WebAssembly 与 Web Crypto。

## 可选 Node 只读 API

`npm start` 除了提供网页，还通过 `node:sqlite` 查询同一文件：

| 路由 | 返回 |
| --- | --- |
| `GET /api/recipes/meta` | 数据版本、菜系与数量、翻译 |
| `GET /api/recipes?query=宫保&cuisine=chuan&category=meat&language=zh-CN&page=1` | 搜索结果与分页，每页最多 12 道，含所展示菜的食材和步骤 |
| `GET /api/recipes/chuan-kungpao` | 单道菜详情，含可用营养数值、单位和来源 |

支持 `HEAD`，拒绝 `POST` 等写操作，不提供任意 SQL 执行接口。参数仅接受 `query`、`cuisine`、`category`、`language`、`page`；无匹配返回空数组，非法请求 400、菜品不存在 404、数据库不可用 503。

Node API 只有部署 Node 服务才可用，GitHub Pages 不运行此 API。当前网页在两种托管方式中都使用浏览器 SQLite 查询路径，因此静态发布无需额外服务配置。数据库采用只读连接；如需要多人录入、审核和实时写入，再另行增加有鉴权的管理服务与迁移流程。
