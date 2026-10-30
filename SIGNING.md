# 提交与 Release 数字签名

维护者：HajayYang，联系邮箱：`2467768838@qq.com`。该邮箱已在 GitHub 验证。邮箱文字和 SHA-256 校验值本身都不是数字签名。

## GitHub Verified 提交

本次签名配置通过 GitHub 的 `createCommitOnBranch` API 提交，由 GitHub 托管的签名密钥签名；提交作者为已认证的 HajayYang 账号。可在提交详情页查看 **Verified**、签名者和作者邮箱。

后续在 GitHub 网页编辑并提交，或使用同一 API 创建的提交，也可由 GitHub 签名。普通 `git commit`、设置 `user.email` 或仅推送到 GitHub 不会自动获得 Verified。当前云环境没有生成、保存或上传维护者的个人私钥，也没有改写旧提交或移动已发布的标签。

如果需要在自己的电脑上使用普通 `git commit` 自动签名，可另行生成个人 SSH 签名密钥，将公钥添加到 GitHub **Settings → SSH and GPG keys → Signing Key** 后启用 Git 签名；私钥由该电脑保管。该配置与仓库的自动发布签名互相独立。

## Release 文件签名

`.github/workflows/sign-release.yml` 使用 GitHub Actions OIDC 身份取得 Sigstore 短期证书，对已发布的 `SHA256SUMS.txt` 进行数字签名。证书、签名和透明日志证明一起保存在 `SHA256SUMS.txt.sigstore.json`。校验清单包含网站 ZIP 和 SQLite 数据库的 SHA-256，因此先验证清单签名、再校验文件，可以验证发布流程身份及两个文件的完整性。

这是仓库发布流程的 **Sigstore 无密钥签名**，不是维护者邮箱对应的个人 GPG 签名，不产生 `.asc` 文件，也不需要配置长期私钥或仓库签名密钥 Secret。签名证书的身份与签名事件会记录在 Sigstore 的公开透明日志中。

发布流程完成上传及容器验证后，会自动调用签名流程。为旧版本补签时，在 **Actions → Sign release downloads → Run workflow** 选择 `main` 并输入已有版本标签，例如 `v1.0.0`。补签直接下载并校验已有发布文件，不重新打包，不替换 ZIP、数据库或原校验清单；它只能证明本次签名时的发布流程认可这些文件，不能追溯证明旧文件最初的构建过程。

## 下载者验证

安装 [Cosign v3](https://github.com/sigstore/cosign/releases)，将 Release 的网站 ZIP、数据库、`SHA256SUMS.txt` 和 `SHA256SUMS.txt.sigstore.json` 下载到同一个目录。不要运行或部署文件，直到以下两个检查都通过。

对通过 `main` 手动补签的 v1.0.0，执行：

```sh
cosign verify-blob \
  --certificate-identity 'https://github.com/HajayYang/Daily-Food-Diary/.github/workflows/sign-release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle SHA256SUMS.txt.sigstore.json SHA256SUMS.txt

sha256sum --check SHA256SUMS.txt
```

macOS 可将第二条命令替换为 `shasum -a 256 --check SHA256SUMS.txt`。第一条验证证书身份、签名和透明日志证明；第二条验证实际 ZIP 与数据库是否匹配已签名清单。缺少签名、证书身份不符或任意文件校验失败时，验证失败。

未来通过新标签 Release 事件自动发布时，证书身份中的 `@refs/heads/main` 会变为对应的 `@refs/tags/v版本号`。预期仓库和工作流路径始终为 `HajayYang/Daily-Food-Diary/.github/workflows/sign-release.yml`；每个 Release 附带的 `SIGNATURE-VERIFICATION.txt` 记录本次证书身份、签名运行链接和验证命令。容器镜像目前不包含在这个文件签名范围内。

## Windows Authenticode

作者元数据为 Hangjay-Yang；受信任的 Windows 发行者必须由代码签名证书核验。申请、GitHub Actions 配置及当前限制见 [WINDOWS-SIGNING.md](WINDOWS-SIGNING.md)。未取得证书时不宣称已完成 Windows 可信签名。
