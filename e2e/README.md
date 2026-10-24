# 浏览器验证

应用运行无需额外依赖。以下开发用脚本使用 Playwright，外部食品库与 Supabase 均拦截为模拟接口，不需要真实密钥或云账号，不会发出真实云同步请求。

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm start
```

另开终端：

```sh
npm run test:browser
```

可使用 `APP_URL` 指向自己的本地测试地址，`CHROMIUM_PATH` 指向已有 Chromium。不要指向保存真实记录的浏览器实例；脚本使用新的独立浏览器上下文和模拟记录。

- `food-search.mjs`：查询网关与模拟 GitHub Pages 项目路径的快照回退；设置 `LIVE_FOOD_SEARCH=1` 时额外验证真实官方数据，经网关返回。
- `lifestyle.mjs`：收藏与餐单复用、禁忌筛选、购物清单去重与已购状态、周报完整日、条码缩放、无自动保存、非法 JSON 拒绝、预览合并、完整导出、持久化和四语言 320/390/1440 px 布局。
- `storage-tabs.mjs`：另一标签页更新数据后阻止旧状态写入，刷新后载入新记录。
- `camera.mjs`：使用本机模拟视频和解码器验证扫码、无画面上传、扫描完成/关闭/等待权限后关闭时清理摄像头、无原生支持时回退手填。
- `sync.mjs`：默认无云请求、secret key 拒绝、账号登录/邮箱确认、标签页会话恢复、下载预览合并、上传确认、云端缺少本地记录保护、旧版本拒绝、退出。

原生摄像头扫描需要目标浏览器支持 `BarcodeDetector`，另应在真实手机 HTTPS 环境核对摄像头权限与对焦；不支持时始终保留数字输入。

`recipes.mjs` 验证今天吃什么的 108 道菜和九类各 12 道、所有菜谱详情、菜系与类型筛选、跨菜系搜索和九页分页、菜名/食材搜索、人数换算、分类、空结果、键盘操作、过敏原提示、四种语言与主题、手机布局及断网查询；不写入饮食记录。

`recipe-database.mjs` 使用真实 SQLite/WASM 文件验证运行时不加载种子数组、快速查询不被旧回复覆盖、数据库缓存回退、断网检索、损坏拒绝、重试及记餐独立可用。延迟回复仅用于模拟时序，不模拟数据库查询结果。

`habits.mjs` 覆盖按食物调整套餐份量、菜谱计划与实际入账、临期库存推荐、饮水撤销、身体测量、提醒偏好持久化、v4 完整备份和新增集合导入、四语言手机布局；另在真实 `/Daily-Food-Diary/` 子路径服务器安装 Service Worker，断网重开并查 SQLite、记餐，检查仅缓存公开资源，最后验证本机数据删除不会清除同域其他应用数据。

旧用例主动屏蔽 Service Worker，以独立控制食品 API、数据库损坏和缓存失败场景；`habits.mjs` 使用真实 Service Worker 验证完整应用的离线行为。
