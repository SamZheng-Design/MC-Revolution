# 收入分成融资协商平台 (Revenue-Based Financing Negotiation Platform)

## 项目概述

一个专业的收入分成融资（RBF）合同协商平台，支持投资方和融资方在线协商合同条款、实时协作、版本管理和电子签署。

### 主要功能

| 模块 | 功能描述 | 状态 |
|------|---------|------|
| 🏭 行业模板 | 5个内置行业模板（演唱会、餐饮、零售、医美、教育） | ✅ 完成 |
| 📝 合同协商 | 自然语言输入变更，AI解析并更新合同条款 | ✅ 完成 |
| ☁️ 云端存储 | 项目数据同步，多设备访问 | ✅ 完成 |
| 👥 协作功能 | 邀请链接生成，多方实时协商 | ✅ 完成 |
| 📚 版本管理 | 快照保存，历史回退，版本对比 | ✅ 完成 |
| ✍️ 电子签章 | 手写签名，验证码验证，签署流程管理 | ✅ 完成 |
| 🎨 模板定制 | 自定义行业模板，复制系统模板 | ✅ 完成 |
| 🤖 AI谈判助手 | 谈判建议、风险评估、市场对标 | ✅ 完成 |

## 在线访问

- **预览地址**: https://3000-ie1nbbimj5azgqden6yaa-ad490db5.sandbox.novita.ai
- **GitHub**: https://github.com/SamZheng-Design/MC-Revolution/tree/V2

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
│   └── index.tsx          # Hono应用主文件（前后端一体）
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
| `/api/invite/verify` | GET | 验证邀请码 |
| `/api/projects/:projectId/join` | POST | 加入协作 |
| `/api/projects/:projectId/collaborators` | GET | 获取协作者列表 |
| `/api/projects/:projectId/collaborators/:odId` | DELETE | 移除协作者 |

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
| `/api/sign/:signId/detail` | GET | 获取签署详情 |

### AI谈判助手
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/ai/negotiate-advice` | POST | 获取谈判建议 |
| `/api/ai/risk-assessment` | POST | 风险评估 |
| `/api/ai/market-benchmark` | POST | 市场对标分析 |
| `/api/parse-change` | POST | AI解析自然语言变更 |

## 使用指南

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

### ContractParams（合同参数）
```typescript
interface ContractParams {
  investmentAmount: string      // 投资金额
  revenueShareRatio: string     // 分成比例
  sharingDuration: string       // 分成期限
  minimumRevenueThreshold: string // 最低收入门槛
  terminationReturn: string     // 提前终止返还比例
  breachPenalty: string         // 违约金
}
```

## 最近更新

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
