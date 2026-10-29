# 一日食记 · Windows 桌面版

支持 Windows 10/11 x64。从 [Releases](https://github.com/HajayYang/Daily-Food-Diary/releases/latest) 下载 `Daily-Bites-版本-win-x64-setup.exe`，按向导安装。支持选择安装目录和当前用户安装，无需管理员权限。升级/卸载默认保留个人数据。

## 日常使用

左侧分为每日总览、运动与身体、餐单与库存、食谱与食物、桌面与数据。饮食、运动、健康习惯、菜谱查询均可离线使用；在线食品查询、AI 拍照识别及手动云同步需要联网，仍沿用各自的授权与核对流程。

个人资料写入独立 `personal.sqlite`，不放在安装目录或 GitHub 仓库。可以在“桌面与数据”查看实际路径并打开文件夹。Windows 默认位于 `%APPDATA%\Daily Bites`。SQLite 使用 WAL、FULL 同步和原子事务，当前 schema 版本为 1；五类健康数据及界面偏好保存为带更新时间的集合，不会上传到公开食谱数据库。会话令牌仍在 sessionStorage；API 私钥不在桌面中内置。

首次迁移：在网页版“备份与同步”导出完整 JSON，在桌面“导入网页版 JSON / SQLite 备份”选择文件，核对新增数量、冲突和设置选项，再应用。不会读取其他浏览器的用户目录。SQLite 恢复仅提取通过校验的健康记录，不执行备份中的脚本，不导入路径或桌面设置。

自动备份默认每 24 小时生成一份，保留 14 份，可关闭或设置为 6/12/24/72/168 小时，保留 1–30 份。启动、运行时会检查备份是否到期；退出期间不运行任务。备份采用 SQLite 在线备份并验证完整性，随后原子重命名；清理仅删除本应用登记的备份。导入/恢复预览前和打开更新安装包前也会备份。SQLite 备份包含数据库中的健康记录和偏好，不包含 IndexedDB 背景图片或会话令牌。备份是未加密的个人资料，请妥善管理文件夹、使用 Windows 账户和磁盘加密；建议另存到其他磁盘，单磁盘备份不能防止磁盘损坏。还原使用现有合并预览，不直接覆盖数据库。

托盘常驻与开机启动均默认关闭，可在桌面设置中开启。提醒时间在“安装与数据管理”中设置；程序运行或留在托盘时触发 Windows 通知，完全退出后不提醒。Windows 专注助手/勿扰设置可能阻止通知。通过托盘菜单“退出”可完全关闭程序。

快捷键：`Ctrl+N` 记餐、`Ctrl+F` 搜索食谱、`Ctrl+1…5` 切换页面、`Ctrl+,` 桌面设置、`Ctrl+Shift+B` 手动备份。

## 安装包与更新验证

“检查更新”仅访问本仓库最新正式 Release。它先验证 `DESKTOP-SHA256SUMS.txt` 的 Sigstore 签名（发行者为 GitHub Actions，本仓库 `desktop-release.yml`、对应版本标签），再校验安装包 SHA-256；下载失败、签名错误或文件被修改时均不会执行。下载和打开安装包需要用户点击，安装前会保存备份。GitHub/Sigstore 暂时不可达时可继续使用旧版。

当前未配置 Windows Authenticode 发行者证书，安装程序可能显示“未知发布者”或 SmartScreen 提示。Sigstore 证明发布工作流与文件完整性，不会替代 Windows 的发行者证书。请确认来自本仓库 Release。未来接入 Windows 证书后可增加系统级签名；不要将私钥提交到仓库。

手工校验：

```powershell
Get-FileHash .\Daily-Bites-2.0.0-win-x64-setup.exe -Algorithm SHA256
```

将结果与签名清单对照；完整的 Sigstore 验证可使用：

```sh
cosign verify-blob --bundle DESKTOP-SHA256SUMS.sigstore.json \
  --certificate-identity 'https://github.com/HajayYang/Daily-Food-Diary/.github/workflows/desktop-release.yml@refs/tags/v2.0.0' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com DESKTOP-SHA256SUMS.txt
```

隐私管理中的 `DELETE` 操作在桌面版还会通过原生窗口确认，删除个人数据、背景和本应用登记的备份；不会删除独立导出的 JSON 或云端记录。

## 开发与构建

Node 24.15+、npm。运行 `npm ci`、`node node_modules/electron/install.js`、`npm run desktop:dev`。Windows 执行 `npm run desktop:windows` 生成 NSIS x64 安装包；`npm run desktop:pack` 可在当前平台打出目录用于测试。打包采用明确的公开资源和桌面代码清单，不包含 `.env`、Worker 密钥、个人数据库或测试数据。Electron 渲染器启用沙盒、contextIsolation、禁用 Node，预加载桥仅开放指定存储与桌面操作；文件路径由原生选择器决定。

`npm test` 验证 SQLite 持久化、事务回滚、完整备份、恢复校验、版本比较与更新防篡改。`npm run test:desktop` 使用真实 Electron 窗口验证重启持久化、离线食谱、导入预览和快捷键；Linux 需要 X 显示服务器。CI 在 Windows 实际安装 NSIS 文件后运行相同测试，再在正式 Release 上发布签名清单。测试时的 `--desktop-test --test-data=绝对路径` 使用独立临时用户目录并停用定时任务，不影响正常启动。
