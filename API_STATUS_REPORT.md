# 合约通 Contract Connect — 功能 & API 接口现状清单

> 生成日期：2026-02-23 | 版本：V10.2 | 测试环境：Wrangler Pages Dev (本地)

---

## 一、总览

| 维度 | 数据 |
|------|------|
| API 端点总数 | **56 个** |
| 完全可用（生产就绪） | **23 个** |
| 功能可用（演示/内存存储） | **21 个** |
| 预留/桩接口（待实现） | **12 个** |
| 前端页面 | 4 页面（认证、个人中心、项目列表、协商） |
| 弹窗/模态框 | 27 个 |
| 前端 JS 报错 | 0 |
| AI 模型 | claude-sonnet-4-5（高质量）/ claude-haiku-4-5（快速） |

---

## 二、功能模块总览

| # | 模块 | 功能数 | 当前状态 | 存储方式 | 生产就绪度 |
|---|------|--------|---------|---------|-----------|
| 1 | 个人账户体系 | 8 API | ✅ 可用 | 内存 Map | ⚠️ 需持久化+密码加密 |
| 2 | SSO 企业对接 | 3 API | 🔧 预留 | — | 接口骨架完整，待实现逻辑 |
| 3 | 项目管理 | 5 API | ✅ 可用 | 前端 LocalStorage + 后端 D1 预留 | ⚠️ 后端需接 D1 |
| 4 | 模板管理 | 8 API | ✅ 可用 | 系统模板硬编码 + 自定义模板内存 Map | ⚠️ 自定义模板需持久化 |
| 5 | 协作功能 | 6 API | ✅ 可用 | 内存 Map | ⚠️ 需持久化 |
| 6 | 版本管理 | 4 API | 🔧 桩接口 | 前端 LocalStorage 管理 | ❌ 后端逻辑未实现 |
| 7 | 电子签章 | 7 API | ✅ 可用 | 内存 Map | ⚠️ 需持久化+法律合规 |
| 8 | AI 合同解析 | 2 API | ✅ 可用 | 无状态 | ✅ 仅需 API Key |
| 9 | 多 Agent 工作流 | 8 API | ✅ 可用 | 无状态 | ✅ 仅需 API Key |
| 10 | AI 谈判助手 | 4 API | ✅ 可用 | 无状态 | ✅ 仅需 API Key |
| 11 | 云端存储/同步 | 2 API | 🔧 预留 | D1 预留 | ❌ 需创建 D1 数据库 |

---

## 三、API 接口逐项清单

### 3.1 个人账户体系（8 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 存储 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 1 | POST | `/api/auth/register` | 用户注册（用户名/邮箱/密码/角色/公司等） | ✅ 可用 | 内存 userStore | 密码需 bcrypt 哈希；写入 D1/公司数据库 |
| 2 | POST | `/api/auth/login` | 用户登录（密码验证已修复） | ✅ 可用 | 内存 userStore | 加入登录频率限制；接入公司 LDAP/SSO |
| 3 | POST | `/api/auth/logout` | 用户登出（清除会话） | ✅ 可用 | 内存 sessionStore | 改为 JWT 黑名单或 KV 存储 |
| 4 | GET | `/api/auth/me` | 获取当前登录用户信息 | ✅ 可用 | 内存 sessionStore | Token 改为 JWT；校验 expiresAt |
| 5 | PUT | `/api/auth/profile` | 更新个人资料（姓名/公司/职位/简介/角色） | ✅ 可用 | 内存 userStore | 写入 D1；头像上传走 R2 |
| 6 | GET | `/api/auth/my-stats` | 获取用户项目统计（按投资方/融资方分组） | ✅ 可用 | 需前端传数据 | 改为后端查 D1 聚合 |
| 7 | — | — | 密码字段 | ⚠️ 明文存储 | 内存 | **高优先**：必须 bcrypt 加盐哈希 |
| 8 | — | — | 会话 Token | ⚠️ 随机字符串 | 内存 | **高优先**：改为 JWT + 签名密钥 |

**数据模型 userStore 字段**：
```
id, username, email, password, phone, displayName, avatar,
company, title, bio, defaultRole(investor|borrower|both),
createdAt, updatedAt,
externalId?, externalToken?, ssoProvider?  ← SSO预留字段
```

---

### 3.2 企业 SSO 对接（3 个 · 预留）

| # | 方法 | 路径 | 功能 | 当前状态 | 生产建议 |
|---|------|------|------|---------|---------|
| 9 | GET | `/api/auth/sso/callback` | 公司 SSO 登录回调 | 🔧 返回对接指南 | 实现 OAuth2/SAML 回调：验证 token→查找/创建用户→建立会话 |
| 10 | POST | `/api/auth/sso/logout` | 公司 SSO 登出 | 🔧 桩接口 | 清除本地会话 + 通知公司 SSO 端 |
| 11 | POST | `/api/auth/sync-company-user` | 同步公司用户数据 | 🔧 桩接口 | 定时/Webhook 拉取公司员工信息，映射角色权限 |

**SSO 对接步骤（已预留在代码注释中）**：
1. 配置公司 SSO 服务端点（OAuth2 authorize/token URL）
2. 实现 token 验证逻辑
3. 映射用户字段（externalId、ssoProvider）
4. 同步用户权限（部门、职位、审批权限）

---

### 3.3 项目管理（5 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 存储 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 12 | GET | `/api/projects` | 获取项目列表 | ⚠️ 需 D1 | D1 预留 | 接入 D1 后完全可用；当前前端 LocalStorage 自管理 |
| 13 | POST | `/api/projects` | 创建项目 | ⚠️ 需 D1 | D1 预留 | 同上；当前前端 LocalStorage 自管理 |
| 14 | PUT | `/api/projects/:id` | 更新项目 | ⚠️ 需 D1 | D1 预留 | 同上 |
| 15 | DELETE | `/api/projects/:id` | 删除项目 | ⚠️ 需 D1 | D1 预留 | 同上；需要软删除+关联数据清理 |
| 16 | POST | `/api/projects/sync` | 本地数据同步到云端 | ⚠️ 需 D1 | D1 预留 | UPSERT 逻辑已写好，接入 D1 即可用 |

**说明**：项目管理采用「前端 LocalStorage 为主 + 后端 D1 同步」的双轨架构。后端代码已经写好了完整的 D1 SQL（INSERT/UPDATE/DELETE/SELECT），只需创建 D1 数据库并绑定即可。

---

### 3.4 模板管理（8 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 存储 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 17 | GET | `/api/templates` | 获取系统模板列表（5个行业） | ✅ 可用 | 硬编码 | 稳定，无需改动 |
| 18 | GET | `/api/templates/:id` | 获取单个系统模板详情 | ✅ 可用 | 硬编码 | 稳定 |
| 19 | GET | `/api/custom-templates` | 获取自定义模板列表 | ✅ 可用 | 内存 Map | 持久化到 D1 |
| 20 | GET | `/api/custom-templates/:id` | 获取单个自定义模板 | ✅ 可用 | 内存 Map | 同上 |
| 21 | POST | `/api/custom-templates` | 创建自定义模板 | ✅ 可用 | 内存 Map | 同上 |
| 22 | PUT | `/api/custom-templates/:id` | 更新自定义模板 | ✅ 可用 | 内存 Map | 同上 |
| 23 | DELETE | `/api/custom-templates/:id` | 删除自定义模板 | ✅ 可用 | 内存 Map | 同上 |
| 24 | POST | `/api/custom-templates/clone/:sourceId` | 克隆系统模板为自定义模板 | ✅ 可用 | 内存 Map | 同上 |
| 25 | POST | `/api/custom-templates/from-project` | 从项目保存为模板 | ⚠️ 部分可用 | 内存 Map | 需要关联项目 ID 查找参数 |

**系统模板**（5个行业 · 基于滴灌通联营协议V3标准）：
- `concert` 演唱会/演出
- `catering` 餐饮连锁
- `retail` 零售门店
- `healthcare` 医美/健康
- `education` 教育培训

---

### 3.5 协作功能（6 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 存储 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 26 | POST | `/api/projects/:id/invite` | 生成邀请链接（含角色/有效期） | ✅ 可用 | 内存 inviteStore | 持久化到 KV（自带 TTL 过期） |
| 27 | GET | `/api/invite/:code/verify` | 验证邀请码有效性 | ✅ 可用 | 内存 inviteStore | 同上 |
| 28 | POST | `/api/join/:code` | 通过邀请码加入协作 | ✅ 可用 | 内存 inviteStore | 同上；需写入项目协作者表 |
| 29 | GET | `/api/projects/:id/collaborators` | 获取协作者列表 | 🔧 返回空数组 | — | 需从 D1 查询实际协作者 |
| 30 | DELETE | `/api/projects/:id/collaborators/:odId` | 移除协作者 | 🔧 桩接口 | — | 需操作 D1 + 权限校验 |
| 31 | PUT | `/api/projects/:id/collaborators/:odId` | 更新协作者权限 | 🔧 桩接口 | — | 需操作 D1 |

---

### 3.6 版本管理（4 个 · 前端管理为主）

| # | 方法 | 路径 | 功能 | 当前状态 | 存储 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 32 | GET | `/api/projects/:id/versions` | 获取版本列表 | 🔧 返回空数组 | — | 接入 D1 versions 表 |
| 33 | POST | `/api/projects/:id/versions` | 创建版本快照 | ⚠️ 返回演示 ID | — | 写入 D1；存储完整参数快照 |
| 34 | POST | `/api/projects/:id/versions/:versionId/restore` | 恢复到指定版本 | 🔧 桩接口 | — | 从 D1 读取快照 → 覆盖当前参数 |
| 35 | GET | `/api/projects/:id/versions/compare` | 版本对比（两版本 diff） | 🔧 桩接口 | — | JSON diff 算法 + 字段中文名映射 |

**说明**：版本管理核心逻辑在前端 LocalStorage 中已完整实现（创建快照、回退、对比）。后端接口是为云端持久化预留的。

---

### 3.7 电子签章（7 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 存储 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 36 | POST | `/api/projects/:id/sign/initiate` | 发起签署流程（设置签署人） | ✅ 可用 | 内存 signatureStore | 持久化到 D1；签署人需关联账户 |
| 37 | GET | `/api/projects/:id/sign/status` | 获取签署状态和进度 | ✅ 可用 | 内存 signatureStore | 同上 |
| 38 | POST | `/api/sign/:signId/execute` | 执行签署（提交签名+验证码） | ✅ 可用 | 内存 signatureStore | 验证码需改为真实短信/邮件发送 |
| 39 | GET | `/api/sign/:signId` | 获取签署详情（含签名数据） | ✅ 可用 | 内存 signatureStore | 签名图片存 R2；合同 PDF 归档 |
| 40 | POST | `/api/sign/:signId/cancel` | 取消签署流程 | ✅ 可用 | 内存 signatureStore | 状态保护逻辑完善 |
| 41 | POST | `/api/sign/:signId/remind` | 发送签署提醒 | ⚠️ 模拟 | 内存 signatureStore | 接入邮件/短信通知服务 |
| 42 | PUT | `/api/sign/:signId/update-signer` | 更新签署人信息 | ✅ 可用 | 内存 signatureStore | 已签署的签署人信息锁定保护 ✅ |

**签署流程**：发起(signing) → 各方签署(execute) → 全部完成(completed)，逻辑闭环完整。

---

### 3.8 AI 合同解析（2 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 模型 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 43 | POST | `/api/parse-change` | AI 解析自然语言变更（单一模式） | ✅ 可用 ~16s | claude-sonnet-4-5 | 可直接生产使用；建议加结果缓存 |
| 44 | POST | `/api/ai/chat` | AI 智能聊天助手 | ✅ 可用 | claude-haiku-4-5 | 可直接生产使用 |

---

### 3.9 多 Agent 并行工作流（8 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 模型 | 生产建议 |
|---|------|------|------|---------|------|---------|
| 45 | GET | `/api/agents` | 获取所有 Agent 列表（8个专家） | ✅ 可用 | — | 静态数据，可直接使用 |
| 46 | GET | `/api/agents/:id` | 获取单个 Agent 详情 | ✅ 可用 | — | 同上 |
| 47 | POST | `/api/agents/route` | 智能路由分析（关键词+LLM） | ✅ 可用 <1s | haiku | 关键词匹配快速；LLM 兜底 |
| 48 | POST | `/api/agents/process` | 多 Agent 并行处理（核心API） | ✅ 可用 ~5.5s | sonnet+haiku | 可直接生产使用；已有超时降级 |
| 49 | POST | `/api/agents/:id/process` | 单 Agent 独立处理 | ✅ 可用 | sonnet | 可直接生产使用 |
| 50 | POST | `/api/agents/smart-change` | 智能联动分析V3（直接+推断修改） | ✅ 可用 ~38s | sonnet | 核心功能；建议加进度回调 |
| 51 | POST | `/api/agents/smart-change-stream` | 智能联动分析（流式响应） | ✅ 可用 | sonnet | SSE 流式输出，体验更好 |
| 52 | POST | `/api/agents/smart-change/confirm` | 确认并应用选中的联动修改 | ✅ 可用 | — | 纯逻辑，无 AI 调用 |
| 53 | POST | `/api/agents/legal-transform` | 法律顾问 Agent 条文转化 | ✅ 可用 | sonnet | max_tokens=4000 已优化 |

**8 个专业 Agent**：
| Agent | 负责模块 | 关键词触发示例 |
|-------|---------|---------------|
| 投资分成专家 | 联营资金、分成比例、年化收益率 | 投资、资金、分成、金额、万元 |
| 数据对账专家 | 数据传输、频率、对账、付款 | 数据、上报、POS、结算 |
| 终止条款专家 | 提前终止、亏损闭店、补偿金 | 终止、退出、闭店、亏损 |
| 违约责任专家 | 违约情形、违约金、严重违约 | 违约、罚款、赔偿 |
| 合规管控专家 | 控制权变更、品牌转让 | 禁止、控制权、转让 |
| 担保责任专家 | 连带责任、实控人责任 | 担保、连带、保证 |
| 资产信息专家 | 门店信息、品牌、证照 | 门店、地址、品牌 |
| 法律事务专家 | 仲裁、保密、通知 | 仲裁、法律、争议 |

---

### 3.10 AI 谈判助手（3 个）

| # | 方法 | 路径 | 功能 | 当前状态 | 模型 | 响应时间 | 生产建议 |
|---|------|------|------|---------|------|---------|---------|
| 54 | POST | `/api/ai/negotiate-advice` | 谈判建议（态势分析+策略+话术） | ✅ 可用 | claude-sonnet-4-5 | ~37s | 建议加结果缓存；可并行调用 |
| 55 | POST | `/api/ai/risk-assessment` | 风险评估（多维度评分） | ✅ 可用 | claude-sonnet-4-5 | ~25s | 同上 |
| 56 | POST | `/api/ai/market-benchmark` | 市场对标分析（行业数据对比） | ✅ 可用 | claude-sonnet-4-5 | ~26s | 同上；可补充真实市场数据库 |

---

### 3.11 云端存储/同步（1 个 · 预留）

| # | 方法 | 路径 | 功能 | 当前状态 | 生产建议 |
|---|------|------|------|---------|---------|
| — | GET | `/api/storage/status` | 检查存储模式（cloud/local） | ⚠️ 始终返回 local | 接入 D1 后自动切换 |

---

## 四、内存存储层清单（5 个 Map）

| 存储名 | 数据类型 | 当前状态 | 生产迁移方案 |
|--------|---------|---------|-------------|
| `userStore` | 用户账户信息 | 内存 Map（重启丢失） | → Cloudflare D1 `users` 表 或 公司数据库 |
| `sessionStore` | 登录会话/Token | 内存 Map（重启丢失） | → Cloudflare KV（自带 TTL 过期） 或 JWT |
| `inviteStore` | 邀请链接信息 | 内存 Map（重启丢失） | → Cloudflare KV（TTL = 邀请有效期） |
| `signatureStore` | 电子签章信息 | 内存 Map（重启丢失） | → Cloudflare D1 `sign_processes` 表 |
| `customTemplateStore` | 自定义模板 | 内存 Map（重启丢失） | → Cloudflare D1 `custom_templates` 表 |

---

## 五、前端功能清单

### 5.1 页面结构

| 页面 | 元素 ID | 功能 |
|------|---------|------|
| 认证页 | `pageAuth` | 登录/注册/游客模式，切换标签动效 |
| 个人中心 | `pageProfile` | 个人信息、投资方/融资方统计、合同列表 |
| 项目列表 | `pageProjects` | 项目卡片、新建按钮、空状态引导 |
| 协商页 | `pageNegotiation` | 合同条款编辑、AI 输入框、工具栏 |

### 5.2 弹窗清单（27 个）

| 类别 | 弹窗 | 功能 |
|------|------|------|
| 引导 | `onboardingModal` | 新手引导步骤教程 |
| 个人 | `editProfileModal` | 编辑个人资料 |
| 项目 | `newProjectModal` | 新建项目（步骤+模板选择） |
| 云端 | `cloudSyncModal` | 云端同步状态 |
| 协作 | `collaboratorModal` | 协作者管理+邀请生成 |
| 协作 | `joinCollabModal` | 通过邀请码加入 |
| 版本 | `versionModal` | 版本快照创建 |
| 版本 | `versionCompareModal` | 版本对比 |
| 版本 | `versionDetailModal` | 版本详情 |
| AI | `aiAdvisorModal` | AI 谈判助手（建议/风险/对标 三标签） |
| 签署 | `signModal` | 签署流程主弹窗 |
| 签署 | `signaturePadModal` | 手写签名板 |
| 签署 | `signCompleteModal` | 签署完成确认 |
| 其他 | 确认弹窗 ×14 | 删除项目/协商记录/版本/协作者/模板等确认 |

### 5.3 前端数据管理

| 数据 | 存储位置 | Key |
|------|---------|-----|
| 项目列表 | LocalStorage | `rbf_projects` |
| 登录 Token | LocalStorage | `rbf_auth_token` |
| 用户信息 | LocalStorage | `rbf_user` |
| Onboarding | LocalStorage | `rbf_onboarding_done` |

---

## 六、本地化部署 & 公司账户接入评估

### 6.1 当前架构对接能力

```
┌─────────────────────────────────────────────────┐
│               合约通 Contract Connect             │
├────────────────────┬────────────────────────────┤
│   前端 (Browser)    │     后端 (Hono/Workers)     │
│                    │                            │
│  LocalStorage      │  ┌─ userStore (内存)        │
│  ├─ rbf_projects   │  ├─ sessionStore (内存)     │
│  ├─ rbf_auth_token │  ├─ inviteStore (内存)      │
│  └─ rbf_user       │  ├─ signatureStore (内存)   │
│                    │  └─ customTemplateStore     │
│                    │                            │
│                    │  ┌─ AI API (claude)         │
│                    │  └─ D1 接口 (已预留)         │
├────────────────────┴────────────────────────────┤
│              SSO 对接点（3 个预留接口）             │
│  /api/auth/sso/callback  → 公司 OAuth2 回调      │
│  /api/auth/sso/logout    → 公司 SSO 登出         │
│  /api/auth/sync-company-user → 员工数据同步       │
├─────────────────────────────────────────────────┤
│              用户模型预留字段                       │
│  externalId    → 公司系统用户ID                   │
│  externalToken → 公司系统 Token                   │
│  ssoProvider   → SSO 提供方标识                   │
│  ssoSessionId  → 公司 SSO 会话ID                  │
└─────────────────────────────────────────────────┘
```

### 6.2 生产部署必做清单（按优先级）

| 优先级 | 事项 | 工作量 | 说明 |
|--------|------|--------|------|
| 🔴 P0 | 密码 bcrypt 哈希 | 0.5 天 | 当前明文存储，必须加密 |
| 🔴 P0 | 创建 D1 数据库 + 迁移 | 1 天 | users/projects/versions/sign_processes/custom_templates |
| 🔴 P0 | 5 个内存 Map → D1/KV | 2 天 | 重启不丢数据 |
| 🟡 P1 | JWT 替代简单 Token | 1 天 | 签名验证 + 自动刷新 |
| 🟡 P1 | SSO 对接实现 | 2-3 天 | 取决于公司 SSO 协议（OAuth2/SAML/OIDC） |
| 🟡 P1 | 验证码真实发送 | 1 天 | 签署环节：接入短信/邮件服务 |
| 🟢 P2 | 版本管理后端实现 | 1 天 | 4 个桩接口补全逻辑 |
| 🟢 P2 | 协作者后端实现 | 1 天 | 3 个桩接口补全逻辑 |
| 🟢 P2 | 签名图片存 R2 | 0.5 天 | base64 → R2 对象存储 |
| 🟢 P2 | AI 结果缓存 | 1 天 | 相似请求 KV 缓存，减少 API 调用 |
| ⚪ P3 | Tailwind CSS 本地化 | 0.5 天 | 去掉 CDN，本地编译 |
| ⚪ P3 | 合同 PDF 导出 | 2 天 | 签署完成后生成 PDF 归档 |

### 6.3 接入公司账户体系的具体步骤

```
步骤 1：配置公司 SSO 端点
  └─ .dev.vars 添加：
     SSO_AUTHORIZE_URL=https://sso.company.com/oauth2/authorize
     SSO_TOKEN_URL=https://sso.company.com/oauth2/token
     SSO_CLIENT_ID=xxx
     SSO_CLIENT_SECRET=xxx

步骤 2：实现 /api/auth/sso/callback
  └─ 接收 code → 换取 access_token → 调用 userinfo 接口
  └─ 查找或创建本地用户（映射 externalId）
  └─ 创建会话 → 返回 JWT

步骤 3：前端添加「公司账户登录」按钮
  └─ 跳转 SSO_AUTHORIZE_URL?redirect_uri=.../api/auth/sso/callback

步骤 4：实现 /api/auth/sync-company-user
  └─ 定时/Webhook 同步员工信息
  └─ 映射部门→角色权限
```

---

## 七、AI 服务配置

| 配置项 | 当前值 | 说明 |
|--------|--------|------|
| API Key | `.dev.vars` → `OPENAI_API_KEY` | 生产环境用 `wrangler secret put` |
| Base URL | `https://www.genspark.ai/api/llm_proxy/v1` | OpenAI 兼容代理 |
| 快速模型 | `claude-haiku-4-5` | 路由分析、AI 聊天 |
| 高质量模型 | `claude-sonnet-4-5` | Agent 处理、谈判建议、风险评估、法律转化 |
| 超时控制 | 路由 10s / Agent 20s | 自动降级到备用模式 |

**替换为公司 AI 网关**：只需修改 `.dev.vars` 中的 `OPENAI_BASE_URL` 和 `OPENAI_API_KEY`，无需改代码（兼容 OpenAI Chat Completions 格式）。

---

*报告完毕。如需某个模块的详细实现代码或迁移方案，可单独展开。*
