# Assess Connect · 评估通

## 项目概述
- **名称**: Assess Connect 评估通
- **目标**: 多智能体协作投资决策平台，为收入分成融资项目提供 AI 驱动的自动化评估
- **设计风格**: MC-Revolution v33 配色（Indigo #6366F1 + Purple #8B5CF6 渐变主题）

## 功能模块

### 已完成功能
1. **独立登录页** (`/`) — 深色 indigo/purple 渐变背景，玻璃态卡片，粒子动效
   - 邮箱 + 密码登录
   - 社交登录入口（微信/钉钉/企业SSO）
   - 自动登录检测与跳转
2. **评估通主界面** (`/assess`) — 登录后进入
   - 标的库浏览与筛选（8个行业赛道过滤器）
   - 文件上传自动解析（PDF/Excel/TXT/Word/CSV）
   - 外环漏斗体系（串行·一票否决）
   - 中环筛子体系（并行·赛道专属智能体）
   - 综合评分雷达图
   - 投资建议 & 改进建议
   - AI 推理过程可视化
3. **API 层**
   - `GET /api/deals` — 平台标的列表
   - `GET /api/deals/:id` — 标的详情
   - `POST /api/assess/start` — 启动评估
   - `GET /api/assess/progress/:jobId` — 评估进度
   - `ALL /api/dgt/*` — DGT 平台代理

### 未完成功能
- 真实身份认证（对接 Identity Connect）
- 社交登录对接（微信/钉钉/SSO OAuth）
- 评估报告导出（PDF/Excel）
- 历史评估记录管理
- 多用户权限管理

## 技术栈
- **后端**: Hono + TypeScript + Cloudflare Workers
- **前端**: Tailwind CSS (CDN) + Font Awesome + Chart.js
- **设计系统**: Indigo/Purple 主题（对标 MC-Revolution v33）
- **部署**: Cloudflare Pages

## URI 路由
| 路径 | 描述 | 参数 |
|------|------|------|
| `/` | 登录页（入口） | - |
| `/assess` | 评估通主界面 | `?deal=DEAL_ID` 预选标的 |
| `/api/deals` | 标的列表 | `?status=&industry=` |
| `/api/deals/:id` | 标的详情 | - |
| `/api/dgt/*` | DGT平台代理 | - |

## 配色系统
```
主色:    #6366F1 (Indigo-500)
强调色:  #8B5CF6 (Purple-500)
渐变:    linear-gradient(135deg, #6366F1, #8B5CF6)
背景:    #f9fafb (Gray-50)
卡片:    #FFFFFF + border #E5E7EB
通过:    #10B981 (Emerald-500)
否决:    #EF4444 (Red-500)
```

## 推荐下一步
1. 对接 Identity Connect 实现真实身份认证
2. 完善评估报告导出功能
3. 接入生产环境 AI Agent 工作流
4. 添加评估历史记录与对比分析

## 部署状态
- **平台**: Cloudflare Pages
- **状态**: ✅ 开发中
- **最后更新**: 2026-03-01
