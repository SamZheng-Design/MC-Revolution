# 收入分成融资协商平台 (Revenue-Based Financing Negotiation Platform)

## 项目概述

一个专业的收入分成融资（RBF）合同协商平台，支持投资方和融资方在线协商合同条款、实时协作、版本管理和电子签署。

### 主要功能

| 模块 | 功能描述 | 状态 |
|------|---------|------|
| 👤 个人账户 | 注册登录、个人主页、角色切换（投资方/融资方） | ✅ 完成 |
| 🏭 行业模板 | 6个内置行业模板（餐饮、零售、医美、教育、演唱会、设备运营） | ✅ 完成 |
| 📝 合同协商 | 自然语言输入变更，AI解析并更新合同条款 | ✅ 完成 |
| ☁️ 云端存储 | 项目数据同步，多设备访问 | ✅ 完成 |
| 👥 协作功能 | 邀请链接生成，多方实时协商 | ✅ 完成 |
| 📚 版本管理 | 快照保存，历史回退，版本对比 | ✅ 完成 |
| ✍️ 电子签章 | 手写签名，验证码验证，签署流程管理 | ✅ 完成 |
| 🎨 模板定制 | 自定义行业模板，复制系统模板 | ✅ 完成 |
| 🤖 AI谈判助手 | 谈判建议、风险评估、市场对标 | ✅ 完成 |
| 🏢 企业SSO | 预留公司账户系统对接接口 | 🔧 预留 |

## 在线访问

- **预览地址**: https://3000-ie1nbbimj5azgqden6yaa-ad490db5.sandbox.novita.ai
- **GitHub**: https://github.com/SamZheng-Design/MC-Revolution/tree/V2

### 新功能：智能联动修改
条款变动描述现已支持智能联动分析！用自然语言说"按每月2.75%算收益"，系统会：
1. 识别直接修改（年化收益率等）
2. 自动推断关联延申修改（资金成本计算方式改为按月）
3. 展示确认面板让您勾选需要的修改

## 技术架构

### 技术栈
- **前端**: HTML5 + Tailwind CSS + Vanilla JavaScript
- **后端**: Hono (TypeScript) 
- **运行时**: Cloudflare Workers / Wrangler Pages Dev
- **存储**: LocalStorage (前端) + 内存存储 (后端演示)

### 项目结构
```
webapp/
├── src/
│   ├── index.tsx          # Hono应用主文件（前后端一体）
│   ├── agents.ts          # 多Agent工作流引擎（路由、处理、法律顾问）
│   ├── templates.ts       # 行业合同模板库（5个行业）
│   ├── knowledge.ts       # 合同知识库（滴灌通联营协议标准）
│   └── renderer.tsx       # JSX渲染器
├── public/
│   └── static/
│       └── style.css      # 设计系统（科技感UI V10）
├── dist/                   # 构建输出
├── .dev.vars              # 本地环境变量
├── ecosystem.config.cjs   # PM2配置
├── wrangler.jsonc         # Cloudflare配置
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## API接口文档

### 模板管理
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/templates` | GET | 获取系统模板列表 |
| `/api/custom-templates` | GET | 获取自定义模板列表 |
| `/api/custom-templates` | POST | 创建自定义模板 |
| `/api/custom-templates/:id` | PUT | 更新自定义模板 |
| `/api/custom-templates/:id` | DELETE | 删除自定义模板 |
| `/api/custom-templates/clone/:sourceId` | POST | 复制系统模板 |
| `/api/custom-templates/from-project` | POST | 从项目保存为模板 |

### 项目管理
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/projects` | GET | 获取项目列表 |
| `/api/projects` | POST | 创建项目 |
| `/api/projects/:id` | PUT | 更新项目 |
| `/api/projects/:id` | DELETE | 删除项目 |
| `/api/projects/sync` | POST | 同步项目到云端 |

### 协作功能
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/projects/:projectId/invite` | POST | 生成邀请链接 |
| `/api/invite/:code/verify` | GET | 验证邀请码 |
| `/api/projects/:projectId/join` | POST | 加入协作 |
| `/api/projects/:projectId/collaborators` | GET | 获取协作者列表 |
| `/api/projects/:projectId/collaborators/:odId` | DELETE | 移除协作者 |
| `/api/sign/:signId` | GET | 获取签署详情 |

### 版本管理
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/projects/:projectId/versions` | GET | 获取版本列表 |
| `/api/projects/:projectId/versions` | POST | 创建版本快照 |
| `/api/projects/:projectId/versions/:versionId` | DELETE | 删除版本 |
| `/api/projects/:projectId/versions/:versionId/restore` | POST | 恢复版本 |
| `/api/projects/:projectId/versions/compare` | POST | 版本对比 |

### 电子签章
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/projects/:id/sign/initiate` | POST | 发起签署流程 |
| `/api/projects/:id/sign/status` | GET | 获取签署状态 |
| `/api/sign/:signId/execute` | POST | 执行签署 |
| `/api/sign/:signId/cancel` | POST | 取消签署 |
| `/api/sign/:signId/remind` | POST | 发送提醒 |

| `/api/sign/:signId/update-signer` | PUT | 更新签署人信息 |

### 个人账户系统
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册（用户名、邮箱、密码、角色） |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/auth/profile` | PUT | 更新个人资料 |
| `/api/auth/my-stats` | GET | 获取用户项目统计（按角色区分） |
| `/api/auth/sso/callback` | GET | 公司SSO登录回调（预留） |
| `/api/auth/sso/logout` | POST | 公司SSO登出（预留） |
| `/api/auth/sync-company-user` | POST | 同步公司用户数据（预留） |

### AI谈判助手
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/ai/negotiate-advice` | POST | 获取谈判建议 |
| `/api/ai/risk-assessment` | POST | 风险评估 |
| `/api/ai/market-benchmark` | POST | 市场对标分析 |
| `/api/parse-change` | POST | AI解析自然语言变更（单一模式） |

### 多Agent并行工作流
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/agents` | GET | 获取所有Agent列表 |
| `/api/agents/:id` | GET | 获取单个Agent详情 |
| `/api/agents/route` | POST | 智能路由分析，判断分配给哪些Agent |
| `/api/agents/process` | POST | 多Agent并行处理（核心API） |
| `/api/agents/:id/process` | POST | 单Agent独立处理 |
| `/api/agents/legal-transform` | POST | 法律顾问转化（V3新增） |

### 智能联动修改
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/agents/smart-change` | POST | 智能联动分析V3（含法律顾问转化） |
| `/api/agents/smart-change/confirm` | POST | 确认并应用选中的修改 |

## 使用指南

### 0. 注册/登录账户
1. 打开平台进入登录页面
2. 新用户点击"注册"标签，填写：
   - 用户名、邮箱、密码（必填）
   - 姓名、手机、公司、职位（选填）
   - 选择默认角色（投资方/融资方/两者皆可）
3. 已有账户直接登录
4. 也可点击"游客模式"快速体验

### 1. 创建新项目
1. 点击"新建项目"按钮
2. 输入项目名称和备注
3. 选择行业模板（系统模板或自定义模板）
4. 点击"创建项目"

### 2. 协商合同条款
1. 打开项目进入协商界面
2. 切换视角（投资方/融资方）
3. 在输入框中用自然语言描述变更，如：
   - "把投资金额改为600万"
   - "分成比例降低到12%"
   - "违约金提高5个百分点"
4. 点击"提交变更"，AI自动解析并更新合同

### 3. 邀请协作
1. 点击工具栏"协作"按钮
2. 选择对方角色和邀请有效期
3. 点击"生成邀请链接"
4. 复制链接发送给对方

### 4. 版本管理
1. 点击工具栏"版本"按钮
2. 输入版本名称创建快照
3. 可查看、对比、回退历史版本

### 5. 电子签署
1. 协商完成后点击"签署"按钮
2. 填写双方签署人信息
3. 发起签署流程
4. 各方手写签名并输入验证码完成签署

### 6. AI谈判助手
1. 点击工具栏"AI助手"按钮
2. 选择功能标签：
   - **谈判建议**: 获取态势分析、最优报价、话术建议
   - **风险评估**: 多维度风险分析
   - **市场对标**: 与行业标准对比

## 本地开发

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run build
npm run dev:sandbox
# 或使用PM2
pm2 start ecosystem.config.cjs
```

### 配置AI功能
创建 `.dev.vars` 文件：
```
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://www.genspark.ai/api/llm_proxy/v1
```

### 部署到Cloudflare
```bash
npm run build
npx wrangler pages deploy dist
```

## 数据模型

### Project（项目）
```typescript
interface Project {
  id: string
  name: string
  note: string
  templateId: string
  status: 'negotiating' | 'pending_sign' | 'signed'
  params: ContractParams
  negotiations: NegotiationRecord[]
  versions: Version[]
  collaborators: Collaborator[]
  invites: Invite[]
  signProcess?: SignProcess
  createdAt: string
  updatedAt: string
}
```

### ContractParams（合同参数）- 基于滴灌通联营协议V3
```typescript
interface ContractParams {
  // 签约主体信息
  contractNumber: string        // 合同编号
  dgtSigningEntity: string      // 滴灌通签约主体
  mguName: string               // 联营方名称
  mguController: string         // 联营方实际控制人
  brandName: string             // 品牌方名称
  
  // 联营资金与分成
  investmentAmount: string      // 联营资金金额
  fundUsage: string             // 资金用途
  revenueShareRatio: string     // 固定分成比例
  sharingEndDate: string        // 收入分成期截止日
  annualReturnRate: string      // 年化回报率（分成终止触发）
  
  // 提前终止
  earlyTerminationNoticeDays: string  // 提前终止通知期
  lossThresholdAmount: string         // 亏损闭店收入门槛
  noEarlyCloseMonths: string          // 禁止提前闭店期
  
  // 数据传输与分成付款
  dataTransmissionMethod: string      // 数据传输方式
  dataSourceSystem: string            // 数据来源系统
  paymentMethod: string               // 分成付款方式
  reconciliationDeadline: string      // 对账截止日
  
  // 违约责任
  breachPenaltyRate: string     // 违约金比例（默认20%）
  seriousBreachDays: string     // 严重违约逾期天数（默认30天）
  
  // 争议解决
  arbitrationInstitution: string      // 仲裁机构
  arbitrationPlace: string            // 仲裁地点
  
  // 行业特定参数（根据模板不同）
  // ...
}
```

## 多Agent并行工作流系统

### 系统架构（V3 - 含法律顾问Agent）

```
┌─────────────────────────────────────────────────────────────┐
│                     用户自然语言输入                          │
│           "投资金额改成800万，违约金提高到25%"                  │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              快速路由器 (Fast Router)                        │
│  - 关键词快速匹配 + LLM辅助验证                              │
│  - 10秒超时自动降级                                         │
│  - 识别出: investment-revenue + breach-liability            │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
    ┌─────────────────────┼─────────────────────┐
    ▼                     ▼                     ▼
┌────────┐          ┌────────┐           ┌────────┐
│投资分成│          │违约责任│           │  ...   │ (并行执行, 最多3个)
│ Agent  │          │ Agent  │           │ Agent  │
│ 20s超时│          │ 20s超时│           │ 20s超时│
└────┬───┘          └────┬───┘           └────┬───┘
     │                   │                    │
     └───────────────────┼────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│             🏛️ 法律顾问Agent (Legal Counsel)                 │
│  - 将用户口语化表达转化为法律条文语言                          │
│  - 为每项变更生成合规条款文本                                  │
│  - 法律合规评分（legalScore 0-100）                           │
│  - 风险警告和改进建议                                         │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  结果聚合器 (Aggregator)                      │
│  - 合并成功Agent的修改建议 + 法律条文                         │
│  - 规则引擎推断关联修改（月利率↔年利率、投资额↔违约金等）     │
│  - 冲突检测 + 统一结果                                       │
└─────────────────────────────────────────────────────────────┘
```

### 8个专业Agent

| Agent ID | 名称 | 负责模块 | 关键词示例 |
|----------|------|---------|-----------|
| `investment-revenue` | 投资分成专家 | 联营资金、分成比例、年化收益率 | 投资、资金、分成、金额、万元 |
| `data-payment` | 数据对账专家 | 数据传输、频率、对账、付款 | 数据、上报、对账、POS、结算 |
| `early-termination` | 终止条款专家 | 提前终止、亏损闭店、补偿金 | 终止、退出、闭店、亏损、补偿 |
| `breach-liability` | 违约责任专家 | 违约情形、违约金、严重违约 | 违约、罚款、处罚、赔偿、责任 |
| `prohibited-actions` | 合规管控专家 | 控制权变更、品牌转让、禁止事项 | 禁止、控制权、转让、搬迁 |
| `guarantee` | 担保责任专家 | 连带责任、实控人责任、品牌担保 | 担保、连带、保证、无限责任 |
| `store-info` | 资产信息专家 | 门店信息、品牌、证照、设备 | 门店、地址、品牌、证照、设备 |
| `dispute-resolution` | 法律事务专家 | 仲裁、保密、通知、合规 | 仲裁、法律、争议、保密、通知 |

### 工作流特性

- **智能路由**: 关键词快速匹配 + LLM辅助验证，置信度超过80%直接使用快速匹配
- **并行执行**: 最多3个Agent同时处理，使用`Promise.allSettled`确保部分失败不影响整体
- **法律顾问转化**: V3新增Legal Counsel Agent，将口语化修改请求转化为合规法律条文
- **超时控制**: 单Agent 20秒超时，路由器 10秒超时，自动降级到备用模式
- **冲突检测**: 自动检测多个Agent对同一参数的不同建议，提示用户确认
- **结果聚合**: 合并所有Agent的修改建议、法律条文、专业建议和风险警告
- **规则引擎**: 关键联动规则确保不遗漏（月利率↔年利率、投资额↔违约金比例等）
- **模型配置**: 快速模型 claude-haiku-4-5 (路由) + 高质量模型 claude-sonnet-4-5 (Agent处理)

### API使用示例

```javascript
// 多Agent并行处理
const response = await fetch('/api/agents/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '投资金额改成800万，违约金提高到25%',
    templateId: 'catering',
    currentParams: { investmentAmount: '500万', breachPenalty: '20%' },
    perspective: 'investor'
  })
});

// 返回结果
{
  success: true,
  routing: {
    understood: '用户意图',
    targetAgents: ['investment-revenue', 'breach-liability'],
    confidence: 100
  },
  changes: [
    { key: 'investmentAmount', oldValue: '500万', newValue: '800万', ... },
    { key: 'breachPenalty', oldValue: '20%', newValue: '25%', ... }
  ],
  agentDetails: [
    { agentId: 'investment-revenue', success: true, processingTime: 1234 },
    { agentId: 'breach-liability', success: true, processingTime: 1456 }
  ],
  stats: {
    totalAgents: 2,
    respondedAgents: 2,
    totalTime: 1678
  }
}
```

## 最近更新

### V10.2 版本 (2026-02-23) - 全面功能测试 + 关键修复
- ✅ **密码验证修复** - 修复注册时密码未存储、登录时未验证的安全漏洞
- ✅ **AI模型切换** - 将AI谈判助手、风险评估、市场对标、AI聊天从 gpt-5/gpt-5-mini 切换为 claude-sonnet-4-5/claude-haiku-4-5，解决超时问题
- ✅ **API文档修正** - 修正 README 中多个接口路径与实际实现不一致的问题
- ✅ **全覆盖功能测试** - 测试了所有API接口、边界条件、错误处理

### V10.1 版本 (2026-02-22) - AI Agent稳定性修复 + 关联修改功能完成
- ✅ **修复法律顾问Agent频繁失败** - 根因：max_tokens=2000导致LLM响应截断(finish_reason=length)
  - 法律顾问 max_tokens 从 2000 提升到 4000
  - 联动分析 max_tokens 从 1500 提升到 3000
  - 新增 `extractJsonFromContent()` 鲁棒JSON提取工具
  - 新增 `repairTruncatedJson()` 截断JSON修复器（自动闭合括号/字符串）
  - 即使被截断也能正确解析部分有效的JSON内容
- ✅ **关联修改功能完善** - 修复inferredChanges无法生成的问题
  - 联动分析现在可靠地输出高/中/低置信度的关联修改建议
  - 规则引擎补充：投资金额→违约金、季度利率→年化换算/对账周期
  - 前端面板正确展示所有关联修改，支持勾选确认
- ✅ **warnings序列化修复** - 消除[object Object]渲染错误
  - 所有warning/riskWarning在聚合和渲染时强制String转化
  - 前端escapeHtml兼容string和object类型
- ✅ **Prompt工程优化** - 减少LLM输出冗余
  - 法律条款legalClauseText限制80字以内
  - 系统提示强调"不要代码块"，减少被截断概率
  - 所有JSON提取统一使用extractJsonFromContent工具

### V10 版本 (2026-02-22) - 设计系统整合 + CSS架构优化
- ✅ **设计系统全面整合** - style.css 科技感UI设计系统 V10
  - 新增 icon-container/icon-gradient 组件系统
  - 新增 stat-card 渐变文字效果（stat-value/stat-label）
  - 新增 project-card 内边距和交互微动效
  - 整合登录页视觉升级（磨砂玻璃卡片、渐变背景、浮动粒子）
  - 角色切换按钮增强（渐变背景、发光效果、悬停动效）
- ✅ **CSS架构大幅优化** - 消除 index.tsx 内联样式与 style.css 的重复
  - 移除 ~407 行重复的内联 CSS（AI聊天组件、Agent动画、智能联动面板等）
  - 所有应用级样式统一收归 style.css 管理
  - 构建产物从 548KB 降至 533KB（减少 15KB）
- ✅ **新增样式组件** - 补充之前缺失的CSS定义
  - .page/.page.active 页面切换
  - .change-badge/.value-changed/.value-old 变更标识
  - .contract-section 合同章节锚点滚动
  - .version-item 版本记录样式
  - .onboarding-step 引导教程过渡动画
  - .pattern-bg SVG背景图案
  - .confidence-high/.inferred-highlight 智能联动面板动效
  - .ai-typing-indicator/.ai-typing-dot 打字动画
  - .ai-quick-questions/.ai-quick-btn 快捷问题组件
  - .back-btn 返回按钮悬停动效
  - .route-animation 路由流动动画

### V9 版本 (2026-02-15) - 全面UI升级 - 科技感设计系统
- ✅ **style.css 设计系统** - 全新科技感 UI 设计令牌系统
  - 渐变系统（neon/aurora/glass/cyber）
  - 玻璃态效果（毛玻璃背景、边框发光）
  - 霓虹阴影预设、弹簧缓动函数
  - 导航栏玻璃效果、按钮发光动效
  - 卡片悬停霓虹边框、统计卡渐变
- ✅ **弹窗滚动修复** - 22个弹窗全部添加 backdrop-blur-sm、max-h 限制和 overflow-y-auto
- ✅ **移动端适配** - 完善响应式断点（1024px/768px/480px）

### V8.1 版本 (2026-02-15) - 自然语言识别优化
- ✅ **增强自然语言识别** - 大幅优化关键词匹配算法，支持更多自然表达方式
  - 支持"描述条款变动"、"修改条款"、"合同变更"等描述性表达
  - 支持"帮我修改"、"麻烦调整"、"能不能改"等请求类表达
  - 支持"想要"、"需要"、"希望"等意愿表达
  - 支持"变一下"、"调一下"、"改一下"等口语化表达
- ✅ **优化LLM路由提示词** - 增强路由器对模糊表达的理解能力
  - 数字识别：包含金额、比例时自动路由到投资分成专家
  - 默认处理：模糊表达默认分配给核心商业条款处理
  - 快速匹配：置信度超过80%直接使用关键词匹配，提升响应速度
- ✅ **性能优化** - 检查并优化前端渲染性能
  - DOM操作优化
  - CSS动画优化

#### 修复的问题
- 修复"描述条款变动"等自然语言表达无法识别的问题
- 优化快速关键词匹配的权重计算逻辑
- 增强变更意图检测的准确性

### V8 版本 (2026-02-14) - 智能联动修改系统
- ✅ **智能联动分析引擎** - 用自然语言描述修改，AI自动推断关联延申修改
- ✅ **直接修改 + 推断修改** - 区分用户明确要求的修改和AI推断的联动修改
- ✅ **勾选确认机制** - 推断修改需用户勾选确认后才会应用
- ✅ **规则引擎补充** - 关键联动规则确保不会遗漏（如月利率→资金成本计算方式）
- ✅ **置信度标识** - 推断修改显示置信度（高/中/低）和分类标签
- ✅ **分类标签** - unit_conversion（单位换算）、calculation_method（计算方式）、formula_update（公式更新）、related_term（关联条款）
- ✅ **智能联动确认面板** - 紫色主题的确认面板，清晰展示直接修改和关联修改
- ✅ **协商历史增强** - 协商记录显示智能联动模式标记、直接修改/联动修改数量

#### 使用示例
输入："按每个月2.75%来算收益，然后乘以已占用的时间"

系统分析结果：
- **直接修改**（3项）：
  - 年化收益率：20% → 2.75%/月（年化约33%）
  - 分成起始日期、分成结束日期
- **推断修改**（2项，需确认）：
  - 资金成本计算方式：按日计算 → 按月计算（置信度：高）
  - 年化收益率换算提示

#### 新增API
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/agents/smart-change` | POST | 智能联动分析（核心API） |
| `/api/agents/smart-change/confirm` | POST | 确认并应用选中的修改 |

### V7 版本 (2026-02-14) - 增删改功能完善
- ✅ **项目管理增强**：
  - 项目编辑功能（名称、备注）- 悬停显示编辑按钮
  - 项目删除确认弹窗（展示项目信息、影响提示）
- ✅ **协商历史管理**：
  - 单条协商记录删除功能
  - 删除确认弹窗（展示记录详情、参数变更影响）
  - 删除后自动撤销相关参数变更
- ✅ **版本快照管理**：
  - 版本删除确认弹窗
  - 展示版本信息和影响提示
- ✅ **协作者管理增强**：
  - 移除协作者确认弹窗（展示协作者信息、角色）
  - 美观的角色图标和颜色标识
- ✅ **自定义模板管理**：
  - 删除确认弹窗（展示模板信息、图标颜色）
  - 保护提示：使用此模板的项目不受影响
- ✅ **签署人信息管理**：
  - 新增签署人信息编辑功能
  - 支持修改姓名、手机、邮箱
  - 已签署的签署人信息锁定保护
  - 后端API支持更新签署人信息

### V6 版本 (2026-02-14) - 多Agent并行工作流系统
- ✅ **新增多Agent并行工作流** - 8个专业Agent并行处理用户请求
- ✅ **智能路由系统** - 关键词匹配 + LLM验证，自动分配任务到相关Agent
- ✅ **可视化处理面板** - 实时展示Agent处理状态、结果和耗时
- ✅ **Agent面板视图** - 展示所有Agent及其专长领域、关键词、负责模块
- ✅ **超时控制与降级** - 单Agent 20秒超时，自动降级到备用处理模式
- ✅ **冲突检测机制** - 自动检测多个Agent对同一参数的不同建议
- ✅ **协商历史增强** - 展示每次协商的Agent处理详情、耗时统计
- ✅ **测试路由功能** - 可快速测试各Agent的路由匹配

### V5 版本 (2026-02-14) - 合同模板系统升级（滴灌通联营协议V3标准）
- ✅ **全面升级合同模板** - 基于滴灌通联营协议（境内B类资产）MCILC260126版本
- ✅ **统一合同框架** - 所有行业模板使用统一的标准合同结构
- ✅ **新增10个主要章节**：
  - 一、联营合作商业安排（资金、分成、数据传输、账户信息）
  - 二、陈述、保证及承诺
  - 三、信息收集和提供
  - 四、各方权利义务
  - 五、违约责任（严重违约情形、违约金20%、连带责任）
  - 六、保密
  - 七、通知
  - 八、廉洁与诚信
  - 九、适用法律和争议解决
  - 十、协议的生效、变更、解除
- ✅ **新增4个附件**：定义及释义、特别陈述保证及承诺、资料清单、设备唯一识别码与地理位置
- ✅ **新增设备运营行业模板** - 支持娃娃机、自动售货机、充电宝等设备类资产
- ✅ **重要条款标识** - 添加importance属性（critical/high/medium/low）
- ✅ **完善变量系统** - 支持50+合同参数，带${...}占位符
- ✅ **重要条款高亮** - 添加isImportant标识用于UI高亮显示

### V3.1 版本 (2026-02-14) - 全面测试与稳定性优化
- ✅ **全面功能测试**：验证所有核心功能正常工作
- ✅ **用户体验优化**：流程顺畅、跳转自然、操作符合逻辑
- ✅ **API稳定性确认**：所有API接口响应正常
- ✅ **AI功能验证**：自然语言解析、AI助手、谈判建议全部可用
- ✅ **签署流程完整测试**：从发起到双方签署完成全流程通过

### V3 版本 (2026-02-14) - 个人账户体系
- ✅ **新增个人账户系统** - 完整的注册/登录功能
- ✅ **新增个人主页** - 展示个人信息、统计数据
- ✅ **角色切换视角**：
  - 作为融资方：展示我发起的项目、项目讨论、相关合同
  - 作为投资方：展示被邀请参与的项目、项目讨论、相关合同
- ✅ **项目/合同详情跳转** - 点击可进入详情页查看
- ✅ **编辑个人资料** - 修改姓名、公司、职位、简介、默认角色
- ✅ **游客模式** - 无需注册即可体验功能
- ✅ **预留公司SSO接口** - 对接企业统一认证系统

### V2.1 版本 (2026-02-13) - UX优化
- ✅ 修复JS语法错误（换行符转义问题）
- ✅ 修复SVG背景导致的HTML解析问题
- ✅ 新增favicon图标
- ✅ 空状态页面增加欢迎引导和功能亮点展示
- ✅ 新建项目弹窗增加步骤指示
- ✅ 模板选择增加勾选确认图标
- ✅ 返回按钮改为更醒目样式
- ✅ AI谈判助手入口增加发光动效
- ✅ 签名流程增加步骤进度指示器
- ✅ 增加移动端弹窗适配样式

### V2 版本 (2026-02-13)
- ✅ 完成电子签章模块
- ✅ 完成模板定制功能
- ✅ 完成AI谈判助手（谈判建议、风险评估、市场对标）
- ✅ 完善版本管理和协作功能
- ✅ 优化UI交互体验

## 开发者

- **项目负责人**: Sam Zheng

## License

MIT
