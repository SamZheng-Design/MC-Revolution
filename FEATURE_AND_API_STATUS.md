# 收入分成融资协商平台 — 功能 & API 完整状态清单

> 生成日期：2026-02-23 ｜ 版本：V10.2 ｜ 负责人：Sam Zheng

---

## 一、功能模块总览

| # | 模块 | 当前状态 | 存储层 | 生产就绪度 |
|---|------|---------|--------|-----------|
| 1 | 个人账户体系 | ✅ 可用 | 内存 Map | 🟡 需持久化+密码哈希 |
| 2 | 企业SSO对接 | 🔧 接口预留 | — | 🔴 待实现业务逻辑 |
| 3 | 项目管理 | ✅ 可用 | 前端 LocalStorage + 后端 D1(可选) | 🟡 前端可用，后端需D1 |
| 4 | 行业合同模板 | ✅ 可用 | 代码内置 5 套 | 🟢 可直接使用 |
| 5 | 自定义模板 | ✅ 可用 | 内存 Map | 🟡 需持久化 |
| 6 | 合同协商(AI) | ✅ 可用 | 前端 LocalStorage | 🟢 AI功能完整 |
| 7 | 多Agent工作流 | ✅ 可用 | 无状态 | 🟢 可直接使用 |
| 8 | 智能联动修改 | ✅ 可用 | 无状态 | 🟢 可直接使用 |
| 9 | 协作邀请 | ✅ 可用 | 内存 Map | 🟡 需持久化 |
| 10 | 版本管理 | ⚠️ 前端可用/后端桩 | 前端 LocalStorage | 🟡 后端需实现 |
| 11 | 电子签章 | ✅ 可用 | 内存 Map | 🟡 需持久化+法律效力 |
| 12 | AI谈判助手 | ✅ 可用 | 无状态 | 🟢 可直接使用 |
| 13 | AI风险评估 | ✅ 可用 | 无状态 | 🟢 可直接使用 |
| 14 | AI市场对标 | ✅ 可用 | 无状态 | 🟢 可直接使用 |
| 15 | AI自由对话 | ✅ 可用 | 前端会话 | 🟢 可直接使用 |
| 16 | 云端同步 | ⚠️ 接口就绪/需D1 | D1(待绑定) | 🟡 需绑定D1数据库 |

---

## 二、数据存储层现状

平台共有 **5 个内存 Map** 作为运行时存储，**服务重启后数据全部丢失**。

| 存储实例 | 存什么 | 当前实现 | 生产建议 |
|----------|--------|---------|---------|
| `userStore` | 用户账户（含预留SSO字段） | `Map<string, User>` | → Cloudflare D1 `users` 表 或公司数据库 |
| `sessionStore` | 登录会话/Token（含预留SSO字段） | `Map<string, Session>` | → JWT + Cloudflare KV（TTL自动过期） 或公司SSO |
| `inviteStore` | 邀请链接 | `Map<string, Invite>` | → D1 `invites` 表（有过期时间） |
| `signatureStore` | 电子签署流程+签名数据 | `Map<string, SignProcess>` | → D1 `sign_processes` 表 + R2 存签名图片 |
| `customTemplateStore` | 用户自定义模板 | `Map<string, Template>` | → D1 `custom_templates` 表 |

### 密码安全现状

| 项目 | 当前 | 生产要求 |
|------|------|---------|
| 密码存储 | 明文存于 `userStore` 对象 | bcrypt/scrypt 哈希 + 随机盐值 |
| 密码传输 | HTTPS（Cloudflare自带） | ✅ 已满足 |
| 密码校验 | 字符串直接比对 | `bcrypt.compare()` 哈希比对 |
| Token生成 | `Date.now().toString(36) + Math.random()` | JWT（RS256/HS256）签名 + 刷新机制 |
| Token有效期 | 7天固定 | 短Token(15min) + RefreshToken(7天) |

---

## 三、全部 API 接口清单（56 个端点）

### 3.1 个人账户系统（8 个）

| # | 方法 | 路径 | 功能 | 状态 | 存储 | 生产建议 |
|---|------|------|------|------|------|---------|
| 1 | POST | `/api/auth/register` | 用户注册（用户名/邮箱/密码/角色） | ✅ 可用 | 内存Map | 密码改bcrypt哈希，存D1 |
| 2 | POST | `/api/auth/login` | 用户登录（密码校验已修复） | ✅ 可用 | 内存Map | 改JWT签发，加登录频率限制 |
| 3 | POST | `/api/auth/logout` | 登出（清除会话Token） | ✅ 可用 | 内存Map | Token加入黑名单/KV |
| 4 | GET | `/api/auth/me` | 获取当前用户信息（Bearer Token） | ✅ 可用 | 内存Map | 改JWT解析，无需查Store |
| 5 | PUT | `/api/auth/profile` | 更新个人资料（姓名/公司/职位/简介/角色） | ✅ 可用 | 内存Map | 写D1，加字段校验 |
| 6 | GET | `/api/auth/my-stats` | 获取用户项目统计（按投资方/融资方分类） | ✅ 可用 | 从前端LocalStorage计算 | 改从D1聚合查询 |
| 7 | GET | `/api/auth/sso/callback` | 公司SSO登录回调 | 🔧 预留 | — | 实现：验证SSO Token→创建/映射用户→签发会话 |
| 8 | POST | `/api/auth/sso/logout` | 公司SSO登出 | 🔧 预留 | — | 实现：通知SSO服务端销毁会话 |
| 9 | POST | `/api/auth/sync-company-user` | 同步公司用户数据 | 🔧 预留 | — | 实现：接收公司员工信息→UPSERT本地用户 |

### 3.2 项目管理（6 个）

| # | 方法 | 路径 | 功能 | 状态 | 存储 | 生产建议 |
|---|------|------|------|------|------|---------|
| 10 | GET | `/api/projects` | 获取项目列表 | ⚠️ 需D1 | D1(未绑定) | 绑定D1后直接可用 |
| 11 | POST | `/api/projects` | 创建项目 | ⚠️ 需D1 | D1(未绑定) | 绑定D1后直接可用 |
| 12 | PUT | `/api/projects/:id` | 更新项目（名称/备注/参数） | ⚠️ 需D1 | D1(未绑定) | 绑定D1后直接可用 |
| 13 | DELETE | `/api/projects/:id` | 删除项目 | ⚠️ 需D1 | D1(未绑定) | 绑定D1后直接可用 |
| 14 | POST | `/api/projects/sync` | 批量同步前端项目到云端 | ⚠️ 需D1 | D1(未绑定) | UPSERT逻辑已写好 |
| 15 | GET | `/api/storage/status` | 检查存储模式（云端/本地） | ✅ 可用 | — | 无需改动 |

> **说明**：项目数据核心在前端 LocalStorage 管理，后端 API 是 D1 云同步通道。前端功能（新建/编辑/删除/列表）完全可用，不依赖后端。

### 3.3 模板管理（8 个）

| # | 方法 | 路径 | 功能 | 状态 | 存储 | 生产建议 |
|---|------|------|------|------|------|---------|
| 16 | GET | `/api/templates` | 获取5个系统模板列表 | ✅ 可用 | 代码内置 | 可扩展为D1配置 |
| 17 | GET | `/api/templates/:id` | 获取单个系统模板详情 | ✅ 可用 | 代码内置 | 同上 |
| 18 | GET | `/api/custom-templates` | 获取自定义模板列表 | ✅ 可用 | 内存Map | 改D1持久化 |
| 19 | GET | `/api/custom-templates/:id` | 获取单个自定义模板 | ✅ 可用 | 内存Map | 改D1持久化 |
| 20 | POST | `/api/custom-templates` | 创建自定义模板 | ✅ 可用 | 内存Map | 改D1持久化 |
| 21 | PUT | `/api/custom-templates/:id` | 更新自定义模板 | ✅ 可用 | 内存Map | 改D1持久化 |
| 22 | DELETE | `/api/custom-templates/:id` | 删除自定义模板 | ✅ 可用 | 内存Map | 改D1持久化 |
| 23 | POST | `/api/custom-templates/clone/:sourceId` | 克隆系统模板为自定义模板 | ✅ 可用 | 内存Map | 改D1持久化 |
| 24 | POST | `/api/custom-templates/from-project` | 从项目保存为模板 | ✅ 可用 | 内存Map | 改D1持久化 |

### 3.4 协作功能（6 个）

| # | 方法 | 路径 | 功能 | 状态 | 存储 | 生产建议 |
|---|------|------|------|------|------|---------|
| 25 | POST | `/api/projects/:id/invite` | 生成邀请链接（角色+有效期） | ✅ 可用 | 内存Map | 改D1，加邀请次数限制 |
| 26 | GET | `/api/invite/:code/verify` | 验证邀请码有效性 | ✅ 可用 | 内存Map | 改D1查询 |
| 27 | POST | `/api/join/:code` | 通过邀请码加入项目 | ✅ 可用 | 内存Map | 改D1，写入collaborators |
| 28 | GET | `/api/projects/:id/collaborators` | 获取协作者列表 | ⚠️ 桩接口 | 返回空数组 | 从D1 collaborators表查询 |
| 29 | DELETE | `/api/projects/:id/collaborators/:odId` | 移除协作者 | ⚠️ 桩接口 | 仅返回成功 | D1删除+通知 |
| 30 | PUT | `/api/projects/:id/collaborators/:odId` | 更新协作者权限 | ⚠️ 桩接口 | 仅返回成功 | D1更新 |

### 3.5 版本管理（4 个）

| # | 方法 | 路径 | 功能 | 状态 | 存储 | 生产建议 |
|---|------|------|------|------|------|---------|
| 31 | GET | `/api/projects/:id/versions` | 获取版本列表 | ⚠️ 桩接口 | 返回空 | D1 `versions` 表 |
| 32 | POST | `/api/projects/:id/versions` | 创建版本快照 | ⚠️ 演示模式 | 仅返回ID | D1存全量快照JSON |
| 33 | POST | `/api/projects/:id/versions/:versionId/restore` | 恢复到指定版本 | 🔴 未实现 | — | D1读取快照→覆写项目 |
| 34 | GET | `/api/projects/:id/versions/compare` | 两个版本差异对比 | 🔴 未实现 | — | JSON diff算法 |

> **说明**：版本管理在前端 LocalStorage 中完整可用（创建快照/回退/对比），后端API是云端备份通道，待D1接入。

### 3.6 电子签章（7 个）

| # | 方法 | 路径 | 功能 | 状态 | 存储 | 生产建议 |
|---|------|------|------|------|------|---------|
| 35 | POST | `/api/projects/:id/sign/initiate` | 发起签署流程（设定签署人） | ✅ 可用 | 内存Map | D1存储，加权限校验 |
| 36 | GET | `/api/projects/:id/sign/status` | 获取签署状态（进度/签署人状态） | ✅ 可用 | 内存Map | D1查询 |
| 37 | POST | `/api/sign/:signId/execute` | 执行签署（签名图+验证码） | ✅ 可用 | 内存Map | D1+R2存签名，对接短信验证 |
| 38 | GET | `/api/sign/:signId` | 获取签署详情 | ✅ 可用 | 内存Map | D1查询 |
| 39 | POST | `/api/sign/:signId/cancel` | 取消签署（已完成不可取消） | ✅ 可用 | 内存Map | D1更新状态 |
| 40 | POST | `/api/sign/:signId/remind` | 发送签署提醒 | ✅ 可用 | 内存Map | 对接邮件/短信通知服务 |
| 41 | PUT | `/api/sign/:signId/update-signer` | 更新签署人信息（已签锁定） | ✅ 可用 | 内存Map | D1更新 |

### 3.7 AI 合同解析（2 个）

| # | 方法 | 路径 | 功能 | 状态 | 模型 | 生产建议 |
|---|------|------|------|------|------|---------|
| 42 | POST | `/api/parse-change` | 自然语言→结构化合同参数变更 | ✅ 可用 | claude-sonnet-4-5 | 可直接使用，~16s |
| 43 | POST | `/api/ai/chat` | AI自由对话助手 | ✅ 可用 | claude-haiku-4-5 | 可直接使用，~3s |

### 3.8 AI 谈判助手（3 个）

| # | 方法 | 路径 | 功能 | 状态 | 模型 | 生产建议 |
|---|------|------|------|------|------|---------|
| 44 | POST | `/api/ai/negotiate-advice` | 谈判建议（态势分析/最优报价/话术/让步策略） | ✅ 可用 | claude-sonnet-4-5 | 可直接使用，~37s |
| 45 | POST | `/api/ai/risk-assessment` | 风险评估（多维度评分/风险等级） | ✅ 可用 | claude-sonnet-4-5 | 可直接使用，~25s |
| 46 | POST | `/api/ai/market-benchmark` | 市场对标（8项对比/竞争力评分） | ✅ 可用 | claude-sonnet-4-5 | 可直接使用，~26s |

### 3.9 多Agent工作流（8 个）

| # | 方法 | 路径 | 功能 | 状态 | 模型 | 生产建议 |
|---|------|------|------|------|------|---------|
| 47 | GET | `/api/agents` | 获取8个专业Agent列表 | ✅ 可用 | — | 无需改动 |
| 48 | GET | `/api/agents/:id` | 获取单个Agent详情 | ✅ 可用 | — | 无需改动 |
| 49 | POST | `/api/agents/route` | 智能路由（关键词匹配+LLM验证） | ✅ 可用 | haiku(快) | 可直接使用，<1s |
| 50 | POST | `/api/agents/process` | 多Agent并行处理（核心API） | ✅ 可用 | haiku+sonnet | 可直接使用，~5.5s |
| 51 | POST | `/api/agents/:id/process` | 单Agent独立处理 | ✅ 可用 | sonnet | 可直接使用 |
| 52 | POST | `/api/agents/smart-change` | 智能联动分析V3（直接+推断修改） | ✅ 可用 | haiku+sonnet | 可直接使用，~38s |
| 53 | POST | `/api/agents/smart-change-stream` | 智能联动（流式返回） | ✅ 可用 | sonnet | 可直接使用 |
| 54 | POST | `/api/agents/legal-transform` | 法律顾问Agent（口语→法律条文） | ✅ 可用 | sonnet | 可直接使用 |
| 55 | POST | `/api/agents/smart-change/confirm` | 确认并应用选中的联动修改 | ✅ 可用 | — | 可直接使用 |

### 3.10 页面路由（1 个）

| # | 方法 | 路径 | 功能 | 状态 |
|---|------|------|------|------|
| 56 | GET | `/` | 主页（SPA全部HTML/JS/CSS） | ✅ 可用 |

---

## 四、8 个专业 Agent 清单

| Agent ID | 名称 | 负责模块 | 模型 | 关键词触发 |
|----------|------|---------|------|-----------|
| `investment-revenue` | 投资分成专家 | 联营资金、分成比例、年化收益率 | sonnet | 投资、资金、分成、金额、万元 |
| `data-payment` | 数据对账专家 | 数据传输、频率、对账、付款 | sonnet | 数据、上报、对账、POS、结算 |
| `early-termination` | 终止条款专家 | 提前终止、亏损闭店、补偿金 | sonnet | 终止、退出、闭店、亏损、补偿 |
| `breach-liability` | 违约责任专家 | 违约情形、违约金、严重违约 | sonnet | 违约、罚款、处罚、赔偿、责任 |
| `prohibited-actions` | 合规管控专家 | 控制权变更、品牌转让、禁止事项 | sonnet | 禁止、控制权、转让、搬迁 |
| `guarantee` | 担保责任专家 | 连带责任、实控人责任、品牌担保 | sonnet | 担保、连带、保证、无限责任 |
| `store-info` | 资产信息专家 | 门店信息、品牌、证照、设备 | sonnet | 门店、地址、品牌、证照、设备 |
| `dispute-resolution` | 法律事务专家 | 仲裁、保密、通知、合规 | sonnet | 仲裁、法律、争议、保密、通知 |

---

## 五、5 套行业合同模板

| 模板ID | 行业 | 合同框架 | 特色参数 |
|--------|------|---------|---------|
| `concert` | 演唱会/演出 | 滴灌通联营协议V3 | 票房分成、场次、艺人费用、票价区间 |
| `catering` | 餐饮连锁 | 滴灌通联营协议V3 | 门店坪效、翻台率、食材成本比、外卖分成 |
| `retail` | 零售门店 | 滴灌通联营协议V3 | SKU数量、库存周转、会员复购率 |
| `healthcare` | 医美/健康 | 滴灌通联营协议V3 | 客单价、复购率、医疗资质、设备折旧 |
| `education` | 教育培训 | 滴灌通联营协议V3 | 续费率、课时单价、师资成本、招生季节 |

---

## 六、前端页面 & 弹窗清单

### 4 个主页面

| 页面ID | 名称 | 功能 |
|--------|------|------|
| `pageAuth` | 登录/注册页 | 登录、注册、游客模式入口 |
| `pageProfile` | 个人主页 | 个人信息、投资方/融资方双视角统计、项目列表 |
| `pageProjects` | 项目列表 | 项目卡片、新建/编辑/删除、模板选择 |
| `pageNegotiation` | 协商工作台 | 合同条款编辑、AI输入、协商历史、工具栏 |

### 27 个弹窗

| 弹窗ID | 功能 | 类型 |
|--------|------|------|
| `onboardingModal` | 新手引导教程 | 引导 |
| `editProfileModal` | 编辑个人资料 | 表单 |
| `newProjectModal` | 新建项目（步骤引导） | 向导 |
| `cloudSyncModal` | 云端同步面板 | 状态 |
| `collaboratorModal` | 协作管理（邀请/移除） | 管理 |
| `joinCollabModal` | 加入协作 | 表单 |
| `versionModal` | 版本管理（创建/列表/回退） | 管理 |
| `versionCompareModal` | 版本差异对比 | 对比 |
| `versionDetailModal` | 版本详情 | 详情 |
| `aiAdvisorModal` | AI谈判助手（3个Tab） | AI |
| `signModal` | 签署流程管理 | 流程 |
| `signaturePadModal` | 手写签名板 | 交互 |
| `signCompleteModal` | 签署完成确认 | 状态 |
| 其余14个 | 删除确认、编辑表单、Agent面板等 | 确认/管理 |

---

## 七、本地化部署对接能力评估

### 7.1 SSO 对接就绪度

```
已预留 3 个 API 端点：
  ├─ GET  /api/auth/sso/callback        ← 公司SSO回调入口
  ├─ POST /api/auth/sso/logout           ← 通知SSO服务端销毁会话
  └─ POST /api/auth/sync-company-user    ← 增量同步公司员工数据

用户数据模型已预留 SSO 字段：
  ├─ externalId       ← 公司系统用户ID
  ├─ externalToken    ← 公司系统Token
  └─ ssoProvider      ← SSO提供方标识

会话模型已预留 SSO 字段：
  └─ ssoSessionId     ← 公司SSO会话ID
```

### 7.2 对接公司账户体系 — 4 步实现路径

| 步骤 | 工作内容 | 工作量评估 |
|------|---------|-----------|
| **Step 1** | 配置公司SSO服务端点（OAuth2/OIDC/SAML） | 0.5天 |
| **Step 2** | 实现 `/api/auth/sso/callback`：验证token→获取员工信息→创建/映射本地用户→签发JWT | 1天 |
| **Step 3** | 实现字段映射：公司员工号→`externalId`，部门/职位→`company`/`title`，角色→`defaultRole` | 0.5天 |
| **Step 4** | 同步权限：公司审批流→签署权限，部门层级→项目可见范围 | 1-2天 |

### 7.3 生产部署 — 优先级排序

#### P0 - 上线前必须完成

| 项目 | 当前 | 目标 | 工作量 |
|------|------|------|--------|
| 密码哈希 | 明文存储+比对 | bcrypt加盐哈希 | 0.5天 |
| Token安全 | 随机字符串 | JWT(RS256)+Refresh机制 | 1天 |
| 数据持久化 | 5个内存Map | Cloudflare D1 或公司数据库 | 2天 |
| 登录频率限制 | 无 | 5次/分钟，失败锁定 | 0.5天 |

#### P1 - 正式运营前完成

| 项目 | 当前 | 目标 | 工作量 |
|------|------|------|--------|
| SSO对接 | 3个桩接口 | OAuth2/OIDC完整流程 | 2-3天 |
| 协作者后端 | 3个桩接口 | D1 CRUD + 实时通知 | 1天 |
| 版本管理后端 | 4个桩/演示接口 | D1快照存储+diff算法 | 1-2天 |
| 签名图片存储 | 内存base64 | R2对象存储 | 0.5天 |
| 短信/邮件通知 | 无 | 签署提醒、邀请通知 | 1天 |

#### P2 - 持续优化

| 项目 | 当前 | 目标 | 工作量 |
|------|------|------|--------|
| 操作审计日志 | 无 | 全操作记录，满足合规要求 | 2天 |
| 电子签章法律效力 | 手写签名模拟 | 对接CA证书/可信时间戳 | 5-10天 |
| AI模型成本优化 | 全用sonnet(贵) | 简单任务用haiku，复杂用sonnet | 1天 |
| CDN替换Tailwind | CDN引用 | PostCSS编译，消除运行时 | 0.5天 |
| 国际化(i18n) | 纯中文 | 按需扩展英文 | 3-5天 |

---

## 八、API 响应时间基准（实测）

| API | 响应时间 | 涉及AI | 备注 |
|-----|---------|--------|------|
| 注册/登录/登出 | <50ms | 否 | |
| 模板列表/CRUD | <50ms | 否 | |
| 邀请/签署/版本 | <50ms | 否 | |
| Agent路由分析 | <1s | 否 | 关键词快速匹配 |
| AI解析变更 | ~16s | claude-sonnet | 单Agent处理 |
| 多Agent并行处理 | ~5.5s | haiku+sonnet | 路由+并行 |
| 智能联动分析 | ~38s | haiku+sonnet | 路由+Agent+法律顾问+联动 |
| AI谈判建议 | ~37s | claude-sonnet | 复杂长文本生成 |
| AI风险评估 | ~25s | claude-sonnet | 多维度分析 |
| AI市场对标 | ~26s | claude-sonnet | 8项市场对比 |
| AI自由对话 | ~3s | claude-haiku | 轻量对话 |

---

## 九、接口状态统计

```
✅ 完全可用      36 个 （64%）— 生产可直接使用或仅需持久化
⚠️ 桩接口/演示    9 个 （16%）— 前端功能可用，后端待D1接入
🔧 预留待实现     3 个 （ 5%）— SSO对接接口
🔴 未实现         2 个 （ 4%）— 版本恢复、版本对比的后端
📊 D1就绪(需绑定)  6 个 （11%）— SQL已写好，绑定D1即可运作
─────────────────────────────
   合计          56 个
```

---

*文档生成：2026-02-23 | 合约通 Contract Connect V10.2*
