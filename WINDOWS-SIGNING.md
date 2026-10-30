# Windows 发行者与代码签名申请

本项目作者/产品属性使用 **Hangjay-Yang**，联系邮箱为 **2467768838@qq.com**。这是软件品牌元数据，不等于 Windows 已验证发行者。当前未取得受信任的 Authenticode 证书；安装器仍可能显示“未知发布者”。现有 Release 的 Sigstore 签名继续验证发布流程与文件完整性，不会代替 Windows 系统证书。

Windows 的已验证发行者来自 CA 核验后的证书主体。CA 不一定接受 GitHub 昵称；若要显示 `Hangjay-Yang`，需要签发机构认可该名称及相应身份/组织资料。不要通过修改字符串、自签证书或让使用者导入不受信任根证书来冒充已验证发行者。

## 申请途径

1. 查看 [Microsoft Artifact Signing 概述](https://learn.microsoft.com/en-us/azure/artifact-signing/overview) 与 [申请/配置指引](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)。该服务原名 Trusted Signing，SDK/模块仍使用 TrustedSigning 名称。本仓库已配置此服务的正式发布签名入口。
2. 先核对服务的当前地区、个人/组织资格和收费，确认适用于你的身份及所在地，再创建账户并完成身份验证。不要预先假定可以用昵称或中国个人身份直接申请。
3. 创建通过验证的 **Public Trust** 证书配置。Private Trust 配置不会被其他普通 Windows 电脑自动信任。复制证书审核通过的实际发行者名称，不要用未核验的昵称替换。
4. 若不满足 Microsoft 服务资格，可咨询 [DigiCert](https://www.digicert.com/signing/code-signing-certificates) 或 [GlobalSign](https://www.globalsign.com/en/code-signing-certificate) 的代码签名产品，核对个人/组织及地区要求、硬件密钥与费用。新签发公信代码签名证书通常要求硬件或云 HSM 保护私钥；USB/HSM 证书需要 CA 支持的签名工具或自托管 Windows runner，本仓库的 Azure 入口不能直接代替这些工具。

这是需要你本人提供身份资料、完成供应商核验和付费的步骤，不能仅凭 GitHub 用户名、邮箱由本项目自动签发。不要在聊天、仓库文件、Issue 或日志中发送私钥、PFX、证书密码或 Azure 客户端密钥。

## GitHub Actions 配置（Microsoft 服务）

申请成功后，在本仓库 **Settings → Secrets and variables → Actions** 中配置：

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Variable | `WINDOWS_SIGNING_MODE` | `azure`（未配置时默认为 `none`） |
| Variable | `WINDOWS_CERTIFICATE_PUBLISHER` | 已审核证书中的实际发行者名称 |
| Variable | `AZURE_SIGNING_ENDPOINT` | 服务区域端点，例如 `https://eus.codesigning.azure.net/`，以账户实际区域为准 |
| Variable | `AZURE_SIGNING_ACCOUNT` | Artifact/Trusted Signing 账户名称 |
| Variable | `AZURE_SIGNING_PROFILE` | 已通过核验的 Public Trust 证书配置名称 |
| Variable | `AZURE_SIGNING_TENANT_ID` | Microsoft Entra 租户 ID |
| Variable | `AZURE_SIGNING_CLIENT_ID` | 专用应用/服务主体的客户端 ID |
| **Secret** | `AZURE_SIGNING_CLIENT_SECRET` | 专用服务主体的客户端密钥 |

给该专用服务主体授予目标证书配置所需的 **Trusted Signing Certificate Profile Signer** 角色（如 Azure 界面改名，以对应的证书配置签名者角色为准），限制到实际证书配置范围。不要授予订阅 Owner。密钥只存入 GitHub Actions Secret，设定有效期并轮换；不要把登录个人账号的密码当作客户端密钥。

签名仅在正式 Release 事件中启用。普通 push/PR 构建仍为不签名的测试安装包，也不会读取客户端密钥。正式发布中一旦启用 `azure`，缺少配置、无法连接签名服务、签名证书主体不匹配、证书链无效或缺少时间戳，流水线都必须失败，不能静默发布成“已签名”。

`electron-builder` 使用 SHA-256 与 RFC 3161 时间戳，对程序、卸载程序及安装器执行标准签名流程。发布前 `scripts/verify-windows-signature.ps1` 通过 Windows `Get-AuthenticodeSignature` 验证安装器和主程序的证书链、实际发行者与时间戳，同时核对程序属性中的作者品牌。凭据仅通过构建步骤环境传入，不写入生成配置或安装包。

本次只能验证未配置证书时的构建，以及启用签名但配置缺失时拒绝构建的逻辑；取得真实服务账户/证书后，首次正式签名发布还需要完成真实链路验证。即使 Authenticode 签名有效，也不能保证 SmartScreen 完全没有提示，其信誉判断由 Microsoft 决定。

## 自行核对

在 Windows PowerShell 中运行：

```powershell
Get-AuthenticodeSignature '.\Daily-Bites-2.0.1-win-x64-setup.exe' |
  Format-List Status,StatusMessage,SignerCertificate,TimeStamperCertificate
```

未签名版本的 `Status` 为 `NotSigned`，不能称为已验证发行者。配置真实证书后的发行版应为 `Valid`，并且证书中的名称与审核身份一致。为避免误解，获取证书前保留 Release 中关于“未知发布者”的说明。
