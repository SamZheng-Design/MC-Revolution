import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { industryTemplates, templateList } from './templates'

type Bindings = {
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
  DB?: D1Database // 预留D1数据库绑定
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ==================== 模板相关API ====================
app.get('/api/templates', (c) => {
  return c.json(templateList.map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    description: t.description,
    color: t.color
  })))
})

app.get('/api/templates/:id', (c) => {
  const id = c.req.param('id')
  const template = industryTemplates[id]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }
  return c.json(template)
})

// ==================== 云端存储API（预留D1数据库接口）====================
// 存储服务状态
app.get('/api/storage/status', async (c) => {
  const db = c.env.DB
  if (db) {
    try {
      // 如果D1数据库可用，返回云端状态
      const result = await db.prepare('SELECT COUNT(*) as count FROM projects').first()
      return c.json({
        mode: 'cloud',
        available: true,
        projectCount: result?.count || 0,
        message: '云端存储已连接'
      })
    } catch (e) {
      return c.json({
        mode: 'local',
        available: false,
        message: '云端存储暂不可用，使用本地存储'
      })
    }
  }
  return c.json({
    mode: 'local',
    available: false,
    message: '当前使用本地存储，云端同步即将上线'
  })
})

// 获取用户项目列表
app.get('/api/projects', async (c) => {
  const db = c.env.DB
  if (db) {
    try {
      // D1数据库查询
      const { results } = await db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all()
      return c.json({ 
        success: true, 
        mode: 'cloud',
        projects: results || []
      })
    } catch (e) {
      return c.json({ 
        success: false, 
        mode: 'local',
        message: '数据库查询失败，请使用本地存储',
        projects: [] 
      })
    }
  }
  return c.json({ 
    success: false, 
    mode: 'local',
    message: '云端存储功能开发中，当前使用本地存储',
    projects: [] 
  })
})

// 保存项目到云端
app.post('/api/projects', async (c) => {
  const project = await c.req.json()
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO projects (id, name, template_id, status, params, negotiations, versions, collaborators, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        project.id,
        project.name,
        project.templateId,
        project.status,
        JSON.stringify(project.params),
        JSON.stringify(project.negotiations || []),
        JSON.stringify(project.versions || []),
        JSON.stringify(project.collaborators || []),
        project.createdAt,
        project.updatedAt
      ).run()
      return c.json({ 
        success: true, 
        mode: 'cloud',
        projectId: project.id,
        message: '项目已保存到云端'
      })
    } catch (e) {
      return c.json({ 
        success: false, 
        mode: 'local',
        message: '云端保存失败: ' + (e as Error).message,
        projectId: project.id 
      })
    }
  }
  return c.json({ 
    success: false, 
    mode: 'local',
    message: '云端存储功能开发中',
    projectId: project.id 
  })
})

// 更新项目
app.put('/api/projects/:id', async (c) => {
  const id = c.req.param('id')
  const project = await c.req.json()
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        UPDATE projects SET 
          name = ?, status = ?, params = ?, negotiations = ?, versions = ?, collaborators = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        project.name,
        project.status,
        JSON.stringify(project.params),
        JSON.stringify(project.negotiations || []),
        JSON.stringify(project.versions || []),
        JSON.stringify(project.collaborators || []),
        project.updatedAt,
        id
      ).run()
      return c.json({ success: true, mode: 'cloud', message: '项目已更新' })
    } catch (e) {
      return c.json({ success: false, mode: 'local', message: '更新失败' })
    }
  }
  return c.json({ success: false, mode: 'local', message: '云端存储功能开发中' })
})

// 删除项目
app.delete('/api/projects/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
      return c.json({ success: true, mode: 'cloud', message: '项目已删除' })
    } catch (e) {
      return c.json({ success: false, mode: 'local', message: '删除失败' })
    }
  }
  return c.json({ success: false, mode: 'local', message: '云端存储功能开发中' })
})

// 批量同步（本地到云端）
app.post('/api/projects/sync', async (c) => {
  const { projects: localProjects } = await c.req.json()
  const db = c.env.DB
  if (!db) {
    return c.json({ success: false, message: '云端存储不可用' })
  }
  
  try {
    let synced = 0
    for (const project of localProjects) {
      // 使用 UPSERT 语法
      await db.prepare(`
        INSERT OR REPLACE INTO projects (id, name, template_id, status, params, negotiations, versions, collaborators, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        project.id,
        project.name,
        project.templateId,
        project.status,
        JSON.stringify(project.params),
        JSON.stringify(project.negotiations || []),
        JSON.stringify(project.versions || []),
        JSON.stringify(project.collaborators || []),
        project.createdAt,
        project.updatedAt
      ).run()
      synced++
    }
    return c.json({ success: true, synced, message: `已同步 ${synced} 个项目到云端` })
  } catch (e) {
    return c.json({ success: false, message: '同步失败: ' + (e as Error).message })
  }
})

// ==================== 协作功能API ====================
// 内存存储邀请码（生产环境应使用D1/KV）
const inviteStore = new Map<string, {
  projectId: string
  role: string
  createdBy: string
  expiresAt: string
  projectName?: string
}>()

// 生成邀请链接
app.post('/api/projects/:id/invite', async (c) => {
  const id = c.req.param('id')
  const { role, expireHours, creatorName, projectName } = await c.req.json()
  
  // 生成唯一邀请码
  const inviteCode = 'INV_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase()
  const expiresAt = new Date(Date.now() + (expireHours || 24) * 3600000).toISOString()
  
  // 存储邀请信息
  inviteStore.set(inviteCode, {
    projectId: id,
    role: role || 'viewer',
    createdBy: creatorName || '项目创建者',
    expiresAt,
    projectName
  })
  
  const origin = new URL(c.req.url).origin
  return c.json({ 
    success: true,
    inviteCode,
    inviteUrl: `${origin}/join/${inviteCode}`,
    role,
    expiresAt,
    message: '邀请链接已生成'
  })
})

// 验证邀请码
app.get('/api/invite/:code/verify', async (c) => {
  const code = c.req.param('code')
  const invite = inviteStore.get(code)
  
  if (!invite) {
    return c.json({ valid: false, message: '邀请码无效或已过期' })
  }
  
  if (new Date(invite.expiresAt) < new Date()) {
    inviteStore.delete(code)
    return c.json({ valid: false, message: '邀请码已过期' })
  }
  
  return c.json({
    valid: true,
    projectId: invite.projectId,
    projectName: invite.projectName,
    role: invite.role,
    createdBy: invite.createdBy,
    expiresAt: invite.expiresAt
  })
})

// 加入协作（通过邀请码）
app.post('/api/join/:code', async (c) => {
  const code = c.req.param('code')
  const { userName, userEmail } = await c.req.json()
  
  const invite = inviteStore.get(code)
  if (!invite) {
    return c.json({ success: false, message: '邀请码无效或已过期' })
  }
  
  if (new Date(invite.expiresAt) < new Date()) {
    inviteStore.delete(code)
    return c.json({ success: false, message: '邀请码已过期' })
  }
  
  // 返回加入信息（实际项目信息需要从前端localStorage或云端获取）
  return c.json({ 
    success: true,
    projectId: invite.projectId,
    role: invite.role,
    message: '成功加入协作',
    collaborator: {
      id: 'user_' + Date.now(),
      name: userName || '协作者',
      email: userEmail,
      role: invite.role,
      joinedAt: new Date().toISOString(),
      status: 'online'
    }
  })
})

// 获取协作者列表
app.get('/api/projects/:id/collaborators', async (c) => {
  const id = c.req.param('id')
  // 演示数据 - 生产环境从D1获取
  return c.json({ 
    success: true,
    collaborators: [],
    message: '从本地存储获取协作者'
  })
})

// 移除协作者
app.delete('/api/projects/:id/collaborators/:odId', async (c) => {
  const { id, odId } = c.req.param()
  return c.json({ 
    success: true,
    message: '协作者已移除（本地操作）'
  })
})

// 更新协作者权限
app.put('/api/projects/:id/collaborators/:odId', async (c) => {
  const { id, odId } = c.req.param()
  const { role } = await c.req.json()
  return c.json({ 
    success: true,
    message: '权限已更新（本地操作）'
  })
})

// ==================== 版本管理API（预留接口）====================
// 获取版本历史
app.get('/api/projects/:id/versions', async (c) => {
  const id = c.req.param('id')
  // TODO: 从数据库获取版本历史
  return c.json({ 
    versions: [],
    message: '版本管理功能开发中'
  })
})

// 创建版本快照
app.post('/api/projects/:id/versions', async (c) => {
  const id = c.req.param('id')
  const { name, description } = await c.req.json()
  // TODO: 创建版本快照
  return c.json({ 
    success: true,
    versionId: 'v_' + Date.now(),
    message: '版本已创建（演示模式）'
  })
})

// 回退到指定版本
app.post('/api/projects/:id/versions/:versionId/restore', async (c) => {
  const { id, versionId } = c.req.param()
  // TODO: 回退版本
  return c.json({ 
    success: false, 
    message: '版本管理功能开发中'
  })
})

// 版本对比
app.get('/api/projects/:id/versions/compare', async (c) => {
  const id = c.req.param('id')
  const v1 = c.req.query('v1')
  const v2 = c.req.query('v2')
  // TODO: 对比两个版本
  return c.json({ 
    diff: [],
    message: '版本对比功能开发中'
  })
})

// ==================== 电子签章API（预留接口）====================
// 发起签署
app.post('/api/projects/:id/sign/initiate', async (c) => {
  const id = c.req.param('id')
  const { signers } = await c.req.json()
  // TODO: 对接电子签章服务（如e签宝、法大大）
  return c.json({ 
    success: true,
    signId: 'sign_' + Date.now(),
    signUrl: '#sign-demo',
    message: '签署流程已发起（演示模式）'
  })
})

// 查询签署状态
app.get('/api/projects/:id/sign/status', async (c) => {
  const id = c.req.param('id')
  // TODO: 查询签署状态
  return c.json({ 
    status: 'pending',
    signers: [],
    message: '电子签章功能开发中'
  })
})

// ==================== 自定义模板API（预留接口）====================
// 获取自定义模板
app.get('/api/custom-templates', async (c) => {
  // TODO: 从数据库获取用户自定义模板
  return c.json({ 
    templates: [],
    message: '模板定制功能开发中'
  })
})

// 创建自定义模板
app.post('/api/custom-templates', async (c) => {
  const template = await c.req.json()
  // TODO: 保存自定义模板
  return c.json({ 
    success: true,
    templateId: 'tpl_' + Date.now(),
    message: '模板已保存（演示模式）'
  })
})

// ==================== AI谈判助手API ====================
app.post('/api/ai/negotiate-advice', async (c) => {
  const { projectId, currentParams, negotiationHistory, perspective } = await c.req.json()
  
  const apiKey = c.env?.OPENAI_API_KEY || process.env.GENSPARK_TOKEN || ''
  const baseUrl = c.env?.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
  
  const systemPrompt = `你是一个专业的收入分成融资谈判顾问。根据当前协商情况，为${perspective === 'investor' ? '投资方' : '融资方'}提供谈判建议。

当前合同参数：
${JSON.stringify(currentParams, null, 2)}

协商历史：
${negotiationHistory.map((n: any, i: number) => `第${i+1}轮(${n.perspective === 'investor' ? '投资方' : '融资方'}): ${n.input}`).join('\n')}

请提供：
1. 当前态势分析（50字内）
2. 建议的下一步动作（具体的参数调整建议）
3. 谈判策略提示（如何表达更有利）
4. 风险提醒

输出JSON格式：
{
  "analysis": "态势分析",
  "suggestions": [
    { "param": "参数名", "currentValue": "当前值", "suggestedValue": "建议值", "reason": "理由" }
  ],
  "talkingPoints": ["表达建议1", "表达建议2"],
  "risks": ["风险提醒1"]
}`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请给出谈判建议' }
        ],
        temperature: 0.3
      })
    })

    if (!response.ok) {
      return c.json({ error: 'API Error' }, 500)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return c.json(JSON.parse(jsonMatch[0]))
      }
    } catch (e) {}
    
    return c.json({ error: 'Failed to parse', raw: content }, 500)
  } catch (error) {
    return c.json({ error: 'Request failed' }, 500)
  }
})

// AI解析自然语言变动
app.post('/api/parse-change', async (c) => {
  const { message, templateId, currentParams } = await c.req.json()
  
  const apiKey = c.env?.OPENAI_API_KEY || process.env.GENSPARK_TOKEN || ''
  const baseUrl = c.env?.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
  
  const template = industryTemplates[templateId]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  const systemPrompt = `你是一个专业的收入分成融资协商助手。用户会用自然语言描述项目条款的变动，你需要：

1. 理解用户描述的变动内容
2. 识别这个变动对应合同的哪个模块和参数
3. 将自然语言转换为专业的合同条款语言
4. 输出结构化的修改指令

## 当前行业：${template.name}
## 当前合同参数：
${JSON.stringify(currentParams, null, 2)}

## 可修改的参数Key：
${template.modules.flatMap(m => m.clauses.map(c => `- ${c.key}: ${c.name} (当前值: ${currentParams[c.key] || c.value})`)).join('\n')}

## 输出格式（严格JSON）：
{
  "understood": "简要复述理解的变动（1-2句话）",
  "changes": [
    {
      "moduleId": "模块ID",
      "moduleName": "模块名称",
      "paramKey": "参数key",
      "paramName": "参数名称",
      "oldValue": "原值",
      "newValue": "新值",
      "clauseText": "转换后的合同条款语言"
    }
  ],
  "suggestion": "从双方利益角度的建议（可选）"
}

注意：
1. 只输出JSON，不要其他内容
2. 如果涉及多个参数变动，changes数组包含多个对象
3. clauseText要使用正式的合同语言`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.2
      })
    })

    if (!response.ok) {
      return c.json({ error: 'API Error' }, 500)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return c.json(parsed)
      }
    } catch (e) {}
    
    return c.json({ error: 'Failed to parse response', raw: content }, 500)
  } catch (error) {
    return c.json({ error: 'Request failed' }, 500)
  }
})

// ==================== 主页面 ====================
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>收入分成融资协商平台</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    .page { display: none; }
    .page.active { display: flex; }
    .project-card { transition: all 0.3s; }
    .project-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
    .template-card { transition: all 0.3s; cursor: pointer; }
    .template-card:hover { transform: scale(1.02); }
    .template-card.selected { border-color: #6366f1; background: #eef2ff; }
    .negotiation-item { transition: all 0.2s; }
    .negotiation-item:hover { background: #f9fafb; }
    .module-card { transition: all 0.3s; }
    .module-card.has-changes { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); }
    .change-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 10px; padding: 2px 8px; border-radius: 10px; }
    .value-changed { background: linear-gradient(120deg, #10b981 0%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
    .value-old { text-decoration: line-through; color: #9ca3af; font-size: 0.9em; }
    .perspective-badge { transition: all 0.3s; }
    .perspective-investor { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
    .perspective-borrower { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .contract-section { scroll-margin-top: 80px; }
    .contract-section.has-changes { background: linear-gradient(90deg, #ecfdf5 0%, transparent 100%); border-left: 4px solid #10b981; }
    .clause-param { background: linear-gradient(120deg, #a78bfa 0%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
    .clause-param-changed { background: linear-gradient(120deg, #10b981 0%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
    .feature-coming { opacity: 0.7; }
    .feature-coming:hover { opacity: 1; }
    .tooltip { position: relative; }
    .tooltip:hover::after { content: attr(data-tip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); padding: 4px 8px; background: #1f2937; color: white; font-size: 12px; border-radius: 4px; white-space: nowrap; z-index: 100; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: slideIn 0.3s ease-out; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .pulse { animation: pulse 2s infinite; }
    .version-item { transition: all 0.2s; }
    .version-item:hover { background: #f3f4f6; }
    .version-item.current { background: #dbeafe; border-left: 3px solid #3b82f6; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  
  <!-- ==================== 页面1: 项目列表 ==================== -->
  <div id="pageProjects" class="page active flex-col min-h-screen">
    <nav class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-handshake text-white"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">收入分成融资协商平台</h1>
            <p class="text-xs text-gray-500">Revenue-Based Financing Negotiation</p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <!-- 云端同步状态 -->
          <button onclick="showCloudSyncModal()" id="btnCloudSync" class="tooltip px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center" data-tip="数据管理">
            <i class="fas fa-database mr-2"></i>
            <span class="text-sm" id="navStorageText">本地存储</span>
            <span id="navSyncIndicator" class="ml-2 w-2 h-2 bg-emerald-400 rounded-full"></span>
          </button>
          <!-- 模板管理 -->
          <button onclick="showTemplateManagerModal()" class="tooltip px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" data-tip="模板管理">
            <i class="fas fa-layer-group"></i>
          </button>
          <!-- 加入协作 -->
          <button onclick="showJoinCollabModal()" class="tooltip px-3 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center" data-tip="通过邀请码加入">
            <i class="fas fa-user-plus mr-2"></i>
            <span class="text-sm">加入协作</span>
          </button>
          <button onclick="showNewProjectModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
            <i class="fas fa-plus mr-2"></i>新建项目
          </button>
        </div>
      </div>
    </nav>
    
    <div class="flex-1 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- 统计卡片 -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl p-4 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">全部项目</p>
                <p class="text-2xl font-bold text-gray-900" id="statTotal">0</p>
              </div>
              <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-folder text-indigo-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">协商中</p>
                <p class="text-2xl font-bold text-amber-600" id="statNegotiating">0</p>
              </div>
              <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-comments text-amber-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">已签署</p>
                <p class="text-2xl font-bold text-emerald-600" id="statCompleted">0</p>
              </div>
              <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-emerald-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">总融资额</p>
                <p class="text-2xl font-bold text-gray-900" id="statAmount">¥0</p>
              </div>
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-yen-sign text-purple-600"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 项目列表头部 -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">我的项目</h2>
          <div class="flex items-center space-x-2">
            <select class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" id="filterStatus">
              <option value="all">全部状态</option>
              <option value="negotiating">协商中</option>
              <option value="completed">已完成</option>
              <option value="signed">已签署</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>
        
        <div id="projectGrid" class="grid grid-cols-3 gap-4"></div>
        
        <div id="emptyState" class="hidden text-center py-16">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-folder-open text-gray-400 text-3xl"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">暂无项目</h3>
          <p class="text-gray-500 mb-4">创建你的第一个收入分成融资项目</p>
          <button onclick="showNewProjectModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <i class="fas fa-plus mr-2"></i>新建项目
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 页面2: 协商界面 ==================== -->
  <div id="pageNegotiation" class="page flex-col h-screen">
    <nav class="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button onclick="goToProjects()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-arrow-left text-gray-600"></i>
          </button>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="font-semibold text-gray-900" id="projectTitle">项目名称</h1>
              <span id="projectStatus" class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">协商中</span>
            </div>
            <p class="text-xs text-gray-500"><span id="projectIndustry">行业</span> · <span id="projectDate">创建时间</span></p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <!-- 协作者 -->
          <button onclick="showCollaboratorModal()" class="feature-coming tooltip p-2 hover:bg-gray-100 rounded-lg text-gray-500" data-tip="邀请协作">
            <i class="fas fa-user-plus"></i>
          </button>
          <!-- 版本历史 -->
          <button onclick="showVersionModal()" class="feature-coming tooltip p-2 hover:bg-gray-100 rounded-lg text-gray-500" data-tip="版本历史">
            <i class="fas fa-history"></i>
          </button>
          <!-- AI助手 -->
          <button onclick="showAIAdvisorModal()" class="tooltip p-2 hover:bg-indigo-100 rounded-lg text-indigo-600" data-tip="AI谈判助手">
            <i class="fas fa-robot"></i>
          </button>
          <!-- 视角切换 -->
          <div class="flex items-center bg-gray-100 rounded-lg p-1 ml-2">
            <button onclick="switchPerspective('investor')" id="btnInvestor" class="perspective-badge px-3 py-1.5 rounded-md text-sm font-medium text-white perspective-investor">
              <i class="fas fa-landmark mr-1"></i>投资方
            </button>
            <button onclick="switchPerspective('borrower')" id="btnBorrower" class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600">
              <i class="fas fa-store mr-1"></i>融资方
            </button>
          </div>
          <div class="w-px h-8 bg-gray-200 mx-2"></div>
          <button onclick="saveProject()" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center text-sm">
            <i class="fas fa-save mr-1"></i>保存
          </button>
          <button onclick="showSignModal()" class="feature-coming px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center text-sm">
            <i class="fas fa-signature mr-1"></i>发起签署
          </button>
          <button onclick="showExportModal()" class="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center text-sm">
            <i class="fas fa-download mr-1"></i>导出
          </button>
        </div>
      </div>
    </nav>
    
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧：协商面板 -->
      <div class="w-2/5 border-r border-gray-200 flex flex-col bg-white">
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">
              <i class="fas fa-comment-dots mr-1 text-indigo-600"></i>描述条款变动
            </label>
            <button onclick="getAIAdvice()" class="text-xs text-indigo-600 hover:text-indigo-700 flex items-center">
              <i class="fas fa-lightbulb mr-1"></i>AI建议
            </button>
          </div>
          <textarea id="negotiationInput" rows="3" 
            placeholder="用自然语言描述你希望的变动...&#10;例如：投资金额改成2000万，分成比例调整为65%"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
          <div class="flex items-center justify-between mt-3">
            <div class="flex gap-2 flex-wrap">
              <button onclick="quickInput('投资金额调整为')" class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">金额</button>
              <button onclick="quickInput('分成比例改为')" class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">分成</button>
              <button onclick="quickInput('违约金调整为')" class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">违约金</button>
              <button onclick="quickInput('分成期限改为')" class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">期限</button>
            </div>
            <button onclick="submitNegotiation()" id="btnSubmit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center text-sm">
              <i class="fas fa-paper-plane mr-2"></i>发送
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-700 flex items-center">
              <i class="fas fa-history mr-2 text-gray-400"></i>协商记录
              <span id="negotiationCount" class="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">0</span>
            </h3>
            <button onclick="createVersionSnapshot()" class="text-xs text-gray-500 hover:text-gray-700 flex items-center">
              <i class="fas fa-camera mr-1"></i>创建快照
            </button>
          </div>
          <div id="negotiationHistory" class="space-y-3">
            <div class="text-center text-gray-400 py-8">
              <i class="fas fa-comments text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">开始协商</p>
              <p class="text-xs mt-1">输入变动内容，AI将自动解析并更新合同</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：合同预览 -->
      <div class="w-3/5 flex flex-col bg-gray-50">
        <div class="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span id="changedBadge" class="hidden px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              <i class="fas fa-edit mr-1"></i><span id="changedCount">0</span>处变更
            </span>
          </div>
          <div class="flex bg-gray-100 rounded-lg p-1">
            <button onclick="switchContractView('card')" id="btnCardView" class="px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow text-indigo-600">
              <i class="fas fa-th-large mr-1"></i>卡片
            </button>
            <button onclick="switchContractView('full')" id="btnFullView" class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600">
              <i class="fas fa-file-alt mr-1"></i>完整合同
            </button>
          </div>
        </div>
        
        <div id="cardView" class="flex-1 overflow-y-auto p-4">
          <div id="moduleCards" class="grid grid-cols-1 gap-4"></div>
        </div>
        
        <div id="fullView" class="hidden flex-1 overflow-y-auto">
          <div class="flex h-full">
            <div class="w-48 border-r border-gray-200 bg-white p-4 overflow-y-auto">
              <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">目录</h4>
              <div id="contractToc" class="space-y-1"></div>
            </div>
            <div class="flex-1 p-6 overflow-y-auto">
              <div id="contractText" class="max-w-3xl mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 新建项目 ==================== -->
  <div id="newProjectModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">新建项目</h2>
          <button onclick="hideNewProjectModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
          <input type="text" id="newProjectName" placeholder="例如：XX品牌杭州旗舰店" 
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">选择行业模板</label>
          <div id="templateGrid" class="grid grid-cols-2 gap-3"></div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
          <textarea id="newProjectNote" rows="2" placeholder="项目背景、特殊要求等..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideNewProjectModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="createProject()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <i class="fas fa-plus mr-2"></i>创建项目
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 云端同步/数据管理 ==================== -->
  <div id="cloudSyncModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-database mr-2 text-indigo-600"></i>数据管理</h2>
          <button onclick="hideCloudSyncModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[65vh]">
        <!-- 存储状态 -->
        <div class="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-800"><i class="fas fa-hdd mr-2 text-indigo-600"></i>本地存储状态</h4>
            <span id="storageStatusBadge" class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">正常</span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-white rounded-lg p-3">
              <p class="text-2xl font-bold text-indigo-600" id="storageProjectCount">0</p>
              <p class="text-xs text-gray-500">项目数</p>
            </div>
            <div class="bg-white rounded-lg p-3">
              <p class="text-2xl font-bold text-purple-600" id="storageVersionCount">0</p>
              <p class="text-xs text-gray-500">版本快照</p>
            </div>
            <div class="bg-white rounded-lg p-3">
              <p class="text-2xl font-bold text-amber-600" id="storageSize">0KB</p>
              <p class="text-xs text-gray-500">占用空间</p>
            </div>
          </div>
          <div class="mt-3">
            <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>存储空间使用</span>
              <span id="storagePercent">0%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div id="storageBar" class="bg-indigo-600 h-2 rounded-full transition-all" style="width: 0%"></div>
            </div>
          </div>
        </div>
        
        <!-- 数据操作 -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3"><i class="fas fa-cog mr-2"></i>数据操作</h4>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="exportAllData()" class="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <div class="text-center">
                <i class="fas fa-download text-indigo-600 text-xl mb-2"></i>
                <p class="text-sm font-medium text-gray-700">导出全部数据</p>
                <p class="text-xs text-gray-400">备份到JSON文件</p>
              </div>
            </button>
            <button onclick="triggerImportData()" class="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
              <div class="text-center">
                <i class="fas fa-upload text-emerald-600 text-xl mb-2"></i>
                <p class="text-sm font-medium text-gray-700">导入数据</p>
                <p class="text-xs text-gray-400">从JSON文件恢复</p>
              </div>
            </button>
          </div>
          <input type="file" id="importFileInput" accept=".json" class="hidden" onchange="importDataFromFile(event)">
        </div>
        
        <!-- 危险操作 -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-red-600 mb-3"><i class="fas fa-exclamation-triangle mr-2"></i>危险操作</h4>
          <button onclick="clearAllData()" class="w-full flex items-center justify-between p-4 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <div class="flex items-center">
              <i class="fas fa-trash-alt text-red-500 mr-3"></i>
              <div class="text-left">
                <p class="text-sm font-medium text-red-700">清除所有数据</p>
                <p class="text-xs text-red-400">删除全部项目和设置，此操作不可恢复</p>
              </div>
            </div>
            <i class="fas fa-chevron-right text-red-300"></i>
          </button>
        </div>
        
        <!-- 云端同步（预留接口） -->
        <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-700"><i class="fas fa-cloud mr-2 text-gray-400"></i>云端同步</h4>
            <span class="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">即将上线</span>
          </div>
          <p class="text-sm text-gray-500 mb-4">登录后可将项目同步到云端，支持多设备访问</p>
          <button onclick="showLoginPrompt()" class="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center cursor-not-allowed">
            <i class="fas fa-sign-in-alt mr-2"></i>登录/注册（开发中）
          </button>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <div class="flex items-center text-xs text-gray-400"><i class="fas fa-check mr-1 text-gray-300"></i>多设备同步</div>
            <div class="flex items-center text-xs text-gray-400"><i class="fas fa-check mr-1 text-gray-300"></i>自动备份</div>
            <div class="flex items-center text-xs text-gray-400"><i class="fas fa-check mr-1 text-gray-300"></i>团队协作</div>
            <div class="flex items-center text-xs text-gray-400"><i class="fas fa-check mr-1 text-gray-300"></i>版本历史</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 协作者管理 ==================== -->
  <div id="collaboratorModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-users mr-2 text-indigo-600"></i>协作管理</h2>
            <p class="text-xs text-gray-500 mt-1">邀请投资方或融资方参与合同协商</p>
          </div>
          <button onclick="hideCollaboratorModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[65vh]">
        <!-- 邀请协作者 -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3"><i class="fas fa-user-plus mr-2 text-indigo-500"></i>邀请协作者</h4>
          <div class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <button onclick="selectInviteRole('investor')" id="roleInvestor" class="invite-role-btn p-3 border-2 border-indigo-500 bg-indigo-50 rounded-xl text-center">
                <i class="fas fa-landmark text-indigo-600 text-lg mb-1"></i>
                <p class="text-xs font-medium text-indigo-700">投资方</p>
                <p class="text-xs text-indigo-500">可提议修改</p>
              </button>
              <button onclick="selectInviteRole('borrower')" id="roleBorrower" class="invite-role-btn p-3 border-2 border-gray-200 rounded-xl text-center hover:border-amber-300 hover:bg-amber-50">
                <i class="fas fa-store text-amber-600 text-lg mb-1"></i>
                <p class="text-xs font-medium text-gray-700">融资方</p>
                <p class="text-xs text-gray-500">可提议修改</p>
              </button>
              <button onclick="selectInviteRole('viewer')" id="roleViewer" class="invite-role-btn p-3 border-2 border-gray-200 rounded-xl text-center hover:border-gray-400 hover:bg-gray-50">
                <i class="fas fa-eye text-gray-500 text-lg mb-1"></i>
                <p class="text-xs font-medium text-gray-700">观察者</p>
                <p class="text-xs text-gray-500">仅可查看</p>
              </button>
            </div>
            <div class="flex space-x-2">
              <select id="inviteExpireSelect" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="24">24小时有效</option>
                <option value="72">3天有效</option>
                <option value="168">7天有效</option>
                <option value="720">30天有效</option>
              </select>
              <button onclick="generateInviteLink()" id="btnGenerateInvite" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center">
                <i class="fas fa-link mr-2"></i>生成邀请链接
              </button>
            </div>
          </div>
          
          <!-- 邀请链接结果 -->
          <div id="inviteLinkBox" class="hidden mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-emerald-700"><i class="fas fa-check-circle mr-1"></i>邀请链接已生成</span>
              <span id="inviteExpireInfo" class="text-xs text-emerald-600"></span>
            </div>
            <div class="flex items-center space-x-2 mb-3">
              <input type="text" id="inviteLinkInput" class="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-mono" readonly>
              <button onclick="copyInviteLink()" class="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <span id="inviteRoleInfo" class="text-xs text-emerald-600"></span>
              <button onclick="shareInviteLink()" class="text-xs text-emerald-700 hover:text-emerald-800 flex items-center">
                <i class="fas fa-share-alt mr-1"></i>分享
              </button>
            </div>
          </div>
        </div>
        
        <!-- 当前协作者列表 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-700"><i class="fas fa-users mr-2 text-gray-400"></i>当前协作者</h4>
            <span id="collaboratorCount" class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">1人</span>
          </div>
          <div id="collaboratorList" class="space-y-2">
            <!-- 所有者（固定） -->
            <div class="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div class="flex items-center space-x-3">
                <div class="relative">
                  <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-crown text-white text-sm"></i>
                  </div>
                  <span class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">我（项目所有者）</p>
                  <p class="text-xs text-gray-500">创建于 <span id="ownerCreateDate">-</span></p>
                </div>
              </div>
              <span class="px-2 py-1 bg-indigo-500 text-white rounded-lg text-xs">所有者</span>
            </div>
            <!-- 动态协作者列表 -->
            <div id="dynamicCollaboratorList"></div>
          </div>
        </div>
        
        <!-- 权限说明 -->
        <div class="mt-6 p-4 bg-gray-50 rounded-xl">
          <h5 class="text-xs font-medium text-gray-600 mb-2"><i class="fas fa-info-circle mr-1"></i>角色权限说明</h5>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="text-center">
              <p class="font-medium text-indigo-600">投资方</p>
              <p class="text-gray-500">查看、评论、提议修改</p>
            </div>
            <div class="text-center">
              <p class="font-medium text-amber-600">融资方</p>
              <p class="text-gray-500">查看、评论、提议修改</p>
            </div>
            <div class="text-center">
              <p class="font-medium text-gray-600">观察者</p>
              <p class="text-gray-500">仅查看</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 加入协作 ==================== -->
  <div id="joinCollabModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-handshake mr-2 text-emerald-600"></i>加入协作</h2>
          <button onclick="hideJoinCollabModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6">
        <div id="joinCollabContent">
          <div class="text-center py-4">
            <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-user-plus text-emerald-600 text-2xl"></i>
            </div>
            <h3 class="font-medium text-gray-900 mb-2">输入邀请码</h3>
            <p class="text-sm text-gray-500 mb-4">输入您收到的邀请码加入项目协商</p>
          </div>
          <div class="space-y-4">
            <input type="text" id="joinInviteCode" placeholder="请输入邀请码 (例如: INV_XXXXXX)" 
              class="w-full px-4 py-3 border border-gray-200 rounded-xl text-center font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <div class="space-y-2">
              <input type="text" id="joinUserName" placeholder="您的名称（选填）" 
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <input type="email" id="joinUserEmail" placeholder="您的邮箱（选填，用于通知）" 
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <button onclick="verifyAndJoin()" class="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium">
              <i class="fas fa-check mr-2"></i>验证并加入
            </button>
          </div>
        </div>
        <div id="joinCollabResult" class="hidden"></div>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 版本历史 ==================== -->
  <div id="versionModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-code-branch mr-2 text-purple-600"></i>版本管理</h2>
            <p class="text-xs text-gray-500 mt-1">创建快照、对比版本、回退历史状态</p>
          </div>
          <button onclick="hideVersionModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- 创建快照 -->
        <div class="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <h4 class="text-sm font-medium text-purple-800 mb-3"><i class="fas fa-camera mr-2"></i>创建版本快照</h4>
          <div class="flex space-x-2">
            <input type="text" id="versionNameInput" placeholder="版本名称（如：初稿、第一轮协商完成）" 
              class="flex-1 px-4 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <button onclick="createVersionSnapshot()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm whitespace-nowrap">
              <i class="fas fa-save mr-1"></i>保存快照
            </button>
          </div>
          <p class="text-xs text-purple-600 mt-2"><i class="fas fa-info-circle mr-1"></i>快照将保存当前所有参数和协商记录</p>
        </div>
        
        <!-- 版本列表 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-700"><i class="fas fa-history mr-2 text-gray-400"></i>版本历史</h4>
            <span id="versionCount" class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">0个版本</span>
          </div>
          
          <!-- 当前版本（固定显示） -->
          <div class="mb-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <i class="fas fa-edit text-white"></i>
                </div>
                <div>
                  <p class="font-medium text-gray-900">当前工作版本</p>
                  <p class="text-xs text-gray-500"><span id="currentVersionNegCount">0</span>轮协商 · <span id="currentVersionParamCount">0</span>项参数</p>
                </div>
              </div>
              <span class="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium">当前</span>
            </div>
          </div>
          
          <!-- 历史版本列表 -->
          <div id="versionHistoryList" class="space-y-2">
            <div class="text-center text-gray-400 py-8">
              <i class="fas fa-code-branch text-3xl mb-3 opacity-50"></i>
              <p class="text-sm">暂无历史版本</p>
              <p class="text-xs mt-1">创建快照来保存重要节点</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <button onclick="showVersionCompareModal()" id="btnVersionCompare" class="text-sm text-gray-500 hover:text-indigo-600 flex items-center disabled:opacity-50" disabled>
          <i class="fas fa-code-compare mr-2"></i>版本对比
        </button>
        <div class="text-xs text-gray-400">
          <i class="fas fa-lightbulb mr-1"></i>提示：回退版本不会删除当前工作内容
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 版本对比 ==================== -->
  <div id="versionCompareModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-code-compare mr-2 text-indigo-600"></i>版本对比</h2>
          <button onclick="hideVersionCompareModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6">
        <!-- 版本选择器 -->
        <div class="flex items-center space-x-4 mb-6">
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">基准版本</label>
            <select id="compareVersionA" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" onchange="runVersionCompare()">
              <option value="">选择版本...</option>
            </select>
          </div>
          <div class="flex items-center text-gray-400">
            <i class="fas fa-arrows-left-right"></i>
          </div>
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">对比版本</label>
            <select id="compareVersionB" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" onchange="runVersionCompare()">
              <option value="current">当前工作版本</option>
            </select>
          </div>
        </div>
        
        <!-- 对比结果 -->
        <div id="versionCompareResult" class="border border-gray-200 rounded-xl overflow-hidden">
          <div class="text-center text-gray-400 py-12">
            <i class="fas fa-exchange-alt text-3xl mb-3 opacity-50"></i>
            <p class="text-sm">选择两个版本进行对比</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 版本详情/回退确认 ==================== -->
  <div id="versionDetailModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-info-circle mr-2 text-indigo-600"></i>版本详情</h2>
          <button onclick="hideVersionDetailModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div id="versionDetailContent" class="p-6">
        <!-- 动态内容 -->
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: AI谈判助手 ==================== -->
  <div id="aiAdvisorModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-indigo-900"><i class="fas fa-robot mr-2"></i>AI谈判助手</h2>
          <button onclick="hideAIAdvisorModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div id="aiAdvisorContent" class="p-6 overflow-y-auto max-h-[60vh]">
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-robot text-indigo-600 text-2xl"></i>
          </div>
          <h3 class="font-medium text-gray-900 mb-2">获取AI谈判建议</h3>
          <p class="text-sm text-gray-500 mb-4">基于当前协商情况，AI将为您提供专业的谈判策略建议</p>
          <button onclick="getAIAdvice()" id="btnGetAdvice" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <i class="fas fa-lightbulb mr-2"></i>获取建议
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 电子签署 ==================== -->
  <div id="signModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-signature mr-2 text-emerald-600"></i>电子签署</h2>
          <button onclick="hideSignModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6">
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-file-signature text-emerald-600 text-2xl"></i>
          </div>
          <h3 class="font-medium text-gray-900 mb-2">发起电子签署</h3>
          <p class="text-sm text-gray-500 mb-6">协商完成后，可发起电子签署流程</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">投资方签署人</label>
            <input type="text" placeholder="姓名/手机号/邮箱" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">融资方签署人</label>
            <input type="text" placeholder="姓名/手机号/邮箱" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm">
          </div>
        </div>
        <div class="mt-6 p-4 bg-amber-50 rounded-lg">
          <p class="text-sm text-amber-700"><i class="fas fa-info-circle mr-1"></i>电子签章服务即将上线，敬请期待</p>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideSignModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 opacity-50 cursor-not-allowed" disabled>
          <i class="fas fa-paper-plane mr-2"></i>发起签署
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 导出 ==================== -->
  <div id="exportModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-download mr-2 text-indigo-600"></i>导出合同</h2>
          <button onclick="hideExportModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-500 mb-4">选择导出格式</p>
        <div class="space-y-3">
          <button onclick="exportAs('pdf')" class="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-file-pdf text-red-600"></i>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900">PDF格式</p>
              <p class="text-xs text-gray-500">适合打印和存档</p>
            </div>
          </button>
          <button onclick="exportAs('word')" class="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-file-word text-blue-600"></i>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900">Word格式</p>
              <p class="text-xs text-gray-500">适合继续编辑</p>
            </div>
          </button>
          <button onclick="exportAs('json')" class="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-file-code text-amber-600"></i>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900">JSON数据</p>
              <p class="text-xs text-gray-500">适合数据备份和迁移</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 模板管理 ==================== -->
  <div id="templateManagerModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-layer-group mr-2 text-indigo-600"></i>模板管理</h2>
          <button onclick="hideTemplateManagerModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex space-x-2">
            <button class="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">系统模板</button>
            <button class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">我的模板</button>
          </div>
          <button class="px-3 py-1.5 border border-indigo-300 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50">
            <i class="fas fa-plus mr-1"></i>创建模板
          </button>
        </div>
        <div id="templateManagerGrid" class="grid grid-cols-2 gap-4"></div>
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-700 mb-2">自定义模板功能</h4>
          <p class="text-sm text-gray-500">即将支持基于现有模板创建自定义行业模板，设置专属参数和条款</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    // ==================== 状态管理 ====================
    let projects = JSON.parse(localStorage.getItem('rbf_projects') || '[]');
    let currentProject = null;
    let templates = [];
    let selectedTemplateId = null;
    let currentPerspective = 'investor';
    let contractView = 'card';
    
    // ==================== 初始化 ====================
    async function init() {
      await loadTemplates();
      renderProjects();
      updateStats();
    }
    
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        templates = await res.json();
        renderTemplateGrid();
        renderTemplateManagerGrid();
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
    
    // ==================== 项目列表 ====================
    function renderProjects() {
      const grid = document.getElementById('projectGrid');
      const empty = document.getElementById('emptyState');
      
      if (projects.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
      }
      
      grid.classList.remove('hidden');
      empty.classList.add('hidden');
      
      grid.innerHTML = projects.map(p => {
        const template = templates.find(t => t.id === p.templateId) || {};
        const statusConfig = {
          draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: '草稿' },
          negotiating: { bg: 'bg-amber-100', text: 'text-amber-700', label: '协商中' },
          completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '已完成' },
          signed: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已签署' }
        };
        const status = statusConfig[p.status] || statusConfig.draft;
        const changeCount = p.negotiations?.length || 0;
        
        return \`
          <div class="project-card bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" onclick="openProject('\${p.id}')">
            <div class="flex items-start justify-between mb-3">
              <div class="w-12 h-12 rounded-xl bg-\${template.color || 'gray'}-100 flex items-center justify-center">
                <i class="fas \${template.icon || 'fa-folder'} text-\${template.color || 'gray'}-600 text-xl"></i>
              </div>
              <div class="flex items-center space-x-2">
                \${p.collaborators?.length > 0 ? '<i class="fas fa-users text-gray-400 text-sm"></i>' : ''}
                <span class="px-2 py-1 rounded-full text-xs \${status.bg} \${status.text}">\${status.label}</span>
              </div>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 truncate">\${p.name}</h3>
            <p class="text-sm text-gray-500 mb-3">\${template.name || '未知行业'}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span><i class="fas fa-comments mr-1"></i>\${changeCount}次协商</span>
              <span>\${formatDate(p.updatedAt)}</span>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span class="text-sm font-medium text-indigo-600">\${p.params?.investmentAmount || '-'}</span>
              <span class="text-xs text-gray-400">\${p.params?.revenueShareRatio || '-'}分成</span>
            </div>
          </div>
        \`;
      }).join('');
    }
    
    function updateStats() {
      document.getElementById('statTotal').textContent = projects.length;
      document.getElementById('statNegotiating').textContent = projects.filter(p => p.status === 'negotiating').length;
      document.getElementById('statCompleted').textContent = projects.filter(p => p.status === 'completed' || p.status === 'signed').length;
      
      const totalAmount = projects.reduce((sum, p) => {
        const amount = parseFloat((p.params?.investmentAmount || '0').replace(/[^0-9.]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      document.getElementById('statAmount').textContent = '¥' + totalAmount.toLocaleString() + '万';
    }
    
    // ==================== 新建项目 ====================
    function showNewProjectModal() { document.getElementById('newProjectModal').classList.remove('hidden'); }
    function hideNewProjectModal() { document.getElementById('newProjectModal').classList.add('hidden'); }
    
    function renderTemplateGrid() {
      const grid = document.getElementById('templateGrid');
      if (!grid) return;
      grid.innerHTML = templates.map(t => \`
        <div class="template-card p-4 border-2 rounded-xl \${selectedTemplateId === t.id ? 'selected border-indigo-500' : 'border-gray-200'}" 
             onclick="selectTemplate('\${t.id}')">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-lg bg-\${t.color}-100 flex items-center justify-center">
              <i class="fas \${t.icon} text-\${t.color}-600"></i>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">\${t.name}</h4>
              <p class="text-xs text-gray-500 truncate">\${t.description}</p>
            </div>
          </div>
        </div>
      \`).join('');
    }
    
    function renderTemplateManagerGrid() {
      const grid = document.getElementById('templateManagerGrid');
      if (!grid) return;
      grid.innerHTML = templates.map(t => \`
        <div class="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-\${t.color}-100 flex items-center justify-center">
              <i class="fas \${t.icon} text-\${t.color}-600"></i>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">\${t.name}</h4>
              <p class="text-xs text-gray-500">系统模板</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 mb-3">\${t.description}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400"><i class="fas fa-file-alt mr-1"></i>标准条款</span>
            <button class="text-xs text-indigo-600 hover:text-indigo-700">查看详情</button>
          </div>
        </div>
      \`).join('');
    }
    
    function selectTemplate(id) {
      selectedTemplateId = id;
      renderTemplateGrid();
    }
    
    async function createProject() {
      const name = document.getElementById('newProjectName').value.trim();
      const note = document.getElementById('newProjectNote').value.trim();
      
      if (!name) { alert('请输入项目名称'); return; }
      if (!selectedTemplateId) { alert('请选择行业模板'); return; }
      
      const res = await fetch('/api/templates/' + selectedTemplateId);
      const template = await res.json();
      
      const project = {
        id: 'proj_' + Date.now(),
        name,
        note,
        templateId: selectedTemplateId,
        status: 'negotiating',
        params: { ...template.defaultParams },
        negotiations: [],
        versions: [],
        collaborators: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      projects.unshift(project);
      saveProjects();
      hideNewProjectModal();
      renderProjects();
      updateStats();
      openProject(project.id);
    }
    
    // ==================== 协商页面 ====================
    async function openProject(id) {
      const project = projects.find(p => p.id === id);
      if (!project) return;
      
      currentProject = project;
      const res = await fetch('/api/templates/' + project.templateId);
      currentProject.template = await res.json();
      
      document.getElementById('pageProjects').classList.remove('active');
      document.getElementById('pageNegotiation').classList.add('active');
      
      document.getElementById('projectTitle').textContent = project.name;
      document.getElementById('projectIndustry').textContent = currentProject.template.name;
      document.getElementById('projectDate').textContent = formatDate(project.createdAt);
      
      const statusConfig = {
        draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: '草稿' },
        negotiating: { bg: 'bg-amber-100', text: 'text-amber-700', label: '协商中' },
        completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '已完成' },
        signed: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已签署' }
      };
      const status = statusConfig[project.status] || statusConfig.negotiating;
      document.getElementById('projectStatus').className = \`px-2 py-0.5 rounded text-xs \${status.bg} \${status.text}\`;
      document.getElementById('projectStatus').textContent = status.label;
      
      renderNegotiationHistory();
      renderModuleCards();
      renderContractText();
      updateChangedBadge();
    }
    
    function goToProjects() {
      document.getElementById('pageNegotiation').classList.remove('active');
      document.getElementById('pageProjects').classList.add('active');
      currentProject = null;
      renderProjects();
      updateStats();
    }
    
    function switchPerspective(p) {
      currentPerspective = p;
      document.getElementById('btnInvestor').className = p === 'investor' 
        ? 'perspective-badge px-3 py-1.5 rounded-md text-sm font-medium text-white perspective-investor'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
      document.getElementById('btnBorrower').className = p === 'borrower'
        ? 'perspective-badge px-3 py-1.5 rounded-md text-sm font-medium text-white perspective-borrower'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
    }
    
    function switchContractView(view) {
      contractView = view;
      document.getElementById('cardView').classList.toggle('hidden', view !== 'card');
      document.getElementById('fullView').classList.toggle('hidden', view !== 'full');
      document.getElementById('btnCardView').className = view === 'card'
        ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow text-indigo-600'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
      document.getElementById('btnFullView').className = view === 'full'
        ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow text-indigo-600'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
    }
    
    async function submitNegotiation() {
      const input = document.getElementById('negotiationInput');
      const message = input.value.trim();
      if (!message || !currentProject) return;
      
      const btn = document.getElementById('btnSubmit');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AI解析中...';
      
      try {
        const res = await fetch('/api/parse-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            templateId: currentProject.templateId,
            currentParams: currentProject.params
          })
        });
        
        const result = await res.json();
        
        if (result.changes && result.changes.length > 0) {
          const negotiation = {
            id: 'neg_' + Date.now(),
            input: message,
            understood: result.understood,
            changes: result.changes,
            suggestion: result.suggestion,
            perspective: currentPerspective,
            timestamp: new Date().toISOString()
          };
          currentProject.negotiations.push(negotiation);
          
          for (const change of result.changes) {
            currentProject.params[change.paramKey] = change.newValue;
          }
          
          currentProject.updatedAt = new Date().toISOString();
          saveProjects();
          
          input.value = '';
          renderNegotiationHistory();
          renderModuleCards();
          renderContractText();
          updateChangedBadge();
        } else {
          alert('AI未能理解您的变动描述，请尝试更具体的表述');
        }
      } catch (e) {
        console.error(e);
        alert('处理失败，请重试');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>发送';
      }
    }
    
    function quickInput(text) {
      document.getElementById('negotiationInput').value = text;
      document.getElementById('negotiationInput').focus();
    }
    
    function renderNegotiationHistory() {
      const container = document.getElementById('negotiationHistory');
      const negotiations = currentProject?.negotiations || [];
      
      document.getElementById('negotiationCount').textContent = negotiations.length;
      document.getElementById('currentVersionInfo').textContent = negotiations.length + '轮协商';
      
      if (negotiations.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8"><i class="fas fa-comments text-4xl mb-3 opacity-50"></i><p class="text-sm">开始协商</p></div>';
        return;
      }
      
      container.innerHTML = negotiations.slice().reverse().map((n, i) => {
        const pIcon = n.perspective === 'investor' ? 'fa-landmark' : 'fa-store';
        const pColor = n.perspective === 'investor' ? 'indigo' : 'amber';
        const pText = n.perspective === 'investor' ? '投资方' : '融资方';
        
        return \`
          <div class="negotiation-item bg-gray-50 rounded-xl p-4 animate-in">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-\${pColor}-100 flex items-center justify-center">
                  <i class="fas \${pIcon} text-\${pColor}-600 text-xs"></i>
                </span>
                <span class="text-xs text-\${pColor}-600 font-medium">\${pText}</span>
                <span class="change-badge">#\${negotiations.length - i}</span>
              </div>
              <span class="text-xs text-gray-400">\${formatTime(n.timestamp)}</span>
            </div>
            <p class="text-sm text-gray-800 mb-2">"\${n.input}"</p>
            <div class="space-y-2">
              \${n.changes.map(c => \`
                <div class="bg-white rounded-lg p-2 border border-gray-100">
                  <div class="flex items-center text-xs text-gray-500 mb-1"><i class="fas fa-folder-open mr-1"></i>\${c.moduleName}</div>
                  <div class="flex items-center text-sm">
                    <span class="text-gray-600">\${c.paramName}:</span>
                    <span class="value-old ml-2">\${c.oldValue}</span>
                    <i class="fas fa-arrow-right mx-2 text-emerald-500 text-xs"></i>
                    <span class="value-changed">\${c.newValue}</span>
                  </div>
                </div>
              \`).join('')}
              \${n.suggestion ? \`<div class="bg-amber-50 rounded-lg p-2 border border-amber-100"><p class="text-xs text-amber-700"><i class="fas fa-lightbulb mr-1"></i>\${n.suggestion}</p></div>\` : ''}
            </div>
          </div>
        \`;
      }).join('');
    }
    
    function renderModuleCards() {
      if (!currentProject?.template) return;
      const container = document.getElementById('moduleCards');
      const template = currentProject.template;
      const params = currentProject.params;
      const negotiations = currentProject.negotiations || [];
      
      const changeMap = {};
      negotiations.forEach((n, idx) => {
        n.changes.forEach(c => { changeMap[c.paramKey] = { ...c, negotiationIndex: idx + 1 }; });
      });
      
      container.innerHTML = template.modules.map(module => {
        const moduleChanges = module.clauses.filter(c => changeMap[c.key]);
        const hasChanges = moduleChanges.length > 0;
        
        return \`
          <div class="module-card bg-white rounded-xl p-5 border-2 \${hasChanges ? 'has-changes border-emerald-300' : 'border-gray-100'}">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mr-3">
                  <i class="fas \${module.icon} text-indigo-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="font-bold text-gray-800">\${module.title}</h3>
                  <p class="text-sm text-gray-500">\${module.description}</p>
                </div>
              </div>
              \${hasChanges ? \`<span class="change-badge">\${moduleChanges.length}项变更</span>\` : ''}
            </div>
            <div class="space-y-3">
              \${module.clauses.map(clause => {
                const change = changeMap[clause.key];
                const currentValue = params[clause.key] || clause.value;
                
                if (change) {
                  return \`
                    <div class="bg-emerald-50 rounded-lg p-3 border-l-4 border-emerald-500">
                      <div class="flex items-center justify-between">
                        <span class="text-gray-700 font-medium">\${clause.name}</span>
                        <div class="flex items-center space-x-2">
                          <span class="value-old">\${change.oldValue}</span>
                          <i class="fas fa-arrow-right text-emerald-500 text-xs"></i>
                          <span class="value-changed">\${change.newValue}</span>
                          <span class="text-xs bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded">#\${change.negotiationIndex}</span>
                        </div>
                      </div>
                      \${clause.note ? \`<p class="text-xs text-gray-500 mt-1">\${clause.note}</p>\` : ''}
                    </div>
                  \`;
                } else {
                  return \`
                    <div class="flex items-center justify-between py-2 border-b border-gray-50">
                      <span class="text-gray-600">\${clause.name}</span>
                      <span class="font-semibold text-indigo-600">\${currentValue}</span>
                    </div>
                  \`;
                }
              }).join('')}
            </div>
            \${module.risks ? \`<div class="mt-4 p-3 bg-red-50 rounded-lg"><p class="text-xs text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i>\${module.risks}</p></div>\` : ''}
          </div>
        \`;
      }).join('');
    }
    
    function renderContractText() {
      if (!currentProject?.template) return;
      
      const tocContainer = document.getElementById('contractToc');
      const textContainer = document.getElementById('contractText');
      const template = currentProject.template;
      const params = currentProject.params;
      const negotiations = currentProject.negotiations || [];
      
      const changeMap = {};
      negotiations.forEach((n, idx) => {
        n.changes.forEach(c => { changeMap[c.paramKey] = { ...c, negotiationIndex: idx + 1 }; });
      });
      
      const sectionHasChanges = (section) => section.clauses.some(c => c.keys?.some(k => changeMap[k]));
      
      tocContainer.innerHTML = template.fullText.map(section => \`
        <div class="px-3 py-2 rounded-lg cursor-pointer text-sm hover:bg-gray-100 \${sectionHasChanges(section) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'}"
             onclick="document.getElementById('section-\${section.id}').scrollIntoView({behavior:'smooth'})">
          \${section.number}. \${section.title}
          \${sectionHasChanges(section) ? '<i class="fas fa-check-circle ml-1 text-emerald-500"></i>' : ''}
        </div>
      \`).join('');
      
      textContainer.innerHTML = \`
        <div class="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h1 class="text-2xl font-bold text-gray-900">收入分成融资协议</h1>
          <p class="text-gray-500 mt-2">\${currentProject.name}</p>
          <p class="text-sm text-gray-400 mt-1">\${template.name} · \${formatDate(currentProject.createdAt)}</p>
        </div>
        \${template.fullText.map(section => {
          const hasChanges = sectionHasChanges(section);
          return \`
            <div id="section-\${section.id}" class="contract-section mb-8 p-5 rounded-xl border \${hasChanges ? 'has-changes border-emerald-200' : 'border-gray-100'}">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                  <span class="w-10 h-10 rounded-xl \${hasChanges ? 'bg-emerald-500' : 'bg-indigo-500'} text-white flex items-center justify-center text-sm font-bold mr-3">\${section.number}</span>
                  \${section.title}
                </h2>
                \${hasChanges ? '<span class="change-badge">已修改</span>' : ''}
              </div>
              <div class="space-y-4">
                \${section.clauses.map((clause, idx) => {
                  let text = clause.text;
                  const clauseChanges = clause.keys?.filter(k => changeMap[k]) || [];
                  clause.keys?.forEach(key => {
                    const value = params[key] || '';
                    const change = changeMap[key];
                    if (change) {
                      text = text.replace('\${' + key + '}', \`<span class="clause-param-changed">\${value}</span><sup class="text-xs text-emerald-600">#\${change.negotiationIndex}</sup>\`);
                    } else {
                      text = text.replace('\${' + key + '}', \`<span class="clause-param">\${value}</span>\`);
                    }
                  });
                  return \`
                    <div class="p-4 border border-gray-100 rounded-lg \${clauseChanges.length > 0 ? 'bg-emerald-50 border-emerald-200' : ''}">
                      <div class="flex items-start">
                        <span class="text-gray-400 font-mono text-sm mr-3 bg-gray-100 px-2 py-0.5 rounded">\${section.number}.\${idx + 1}</span>
                        <div class="flex-1">
                          <p class="text-gray-800 leading-relaxed">\${text}</p>
                          \${clause.note ? \`<p class="text-sm text-gray-500 mt-2 pl-3 border-l-2 border-gray-200">\${clause.note}</p>\` : ''}
                        </div>
                      </div>
                    </div>
                  \`;
                }).join('')}
              </div>
            </div>
          \`;
        }).join('')}
        <div class="mt-12 pt-8 border-t-2 border-gray-200 text-center text-gray-500 text-sm">
          <p>—— 协议正文结束 ——</p>
        </div>
      \`;
    }
    
    function updateChangedBadge() {
      const negotiations = currentProject?.negotiations || [];
      const totalChanges = negotiations.reduce((sum, n) => sum + n.changes.length, 0);
      const badge = document.getElementById('changedBadge');
      const count = document.getElementById('changedCount');
      if (totalChanges > 0) { badge.classList.remove('hidden'); count.textContent = totalChanges; }
      else { badge.classList.add('hidden'); }
    }
    
    // ==================== 保存和导出 ====================
    function saveProject() {
      if (!currentProject) return;
      currentProject.updatedAt = new Date().toISOString();
      saveProjects();
      const btn = event.target.closest('button');
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check mr-1"></i>已保存';
      setTimeout(() => { btn.innerHTML = original; }, 1500);
    }
    
    function exportAs(format) {
      hideExportModal();
      if (format === 'json') {
        const dataStr = JSON.stringify(currentProject, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentProject.name + '.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert(format.toUpperCase() + '格式导出功能即将上线');
      }
    }
    
    // ==================== 弹窗控制 ====================
    function showCloudSyncModal() { 
      document.getElementById('cloudSyncModal').classList.remove('hidden');
      updateStorageStats();
    }
    function hideCloudSyncModal() { document.getElementById('cloudSyncModal').classList.add('hidden'); }
    
    // ==================== 云端存储/数据管理 ====================
    function updateStorageStats() {
      const projectCount = projects.length;
      let versionCount = 0;
      projects.forEach(p => { versionCount += (p.versions?.length || 0); });
      
      const dataStr = localStorage.getItem('rbf_projects') || '[]';
      const sizeBytes = new Blob([dataStr]).size;
      const sizeKB = (sizeBytes / 1024).toFixed(1);
      const maxStorage = 5 * 1024 * 1024; // 5MB localStorage limit
      const percent = ((sizeBytes / maxStorage) * 100).toFixed(1);
      
      document.getElementById('storageProjectCount').textContent = projectCount;
      document.getElementById('storageVersionCount').textContent = versionCount;
      document.getElementById('storageSize').textContent = sizeKB + 'KB';
      document.getElementById('storagePercent').textContent = percent + '%';
      document.getElementById('storageBar').style.width = Math.min(percent, 100) + '%';
      
      // 状态徽章
      const badge = document.getElementById('storageStatusBadge');
      if (percent > 80) {
        badge.className = 'px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs';
        badge.textContent = '空间紧张';
      } else if (percent > 50) {
        badge.className = 'px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs';
        badge.textContent = '使用中';
      } else {
        badge.className = 'px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs';
        badge.textContent = '正常';
      }
    }
    
    function exportAllData() {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        projects: projects,
        customTemplates: JSON.parse(localStorage.getItem('rbf_custom_templates') || '[]')
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rbf_backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出', 'success');
    }
    
    function triggerImportData() {
      document.getElementById('importFileInput').click();
    }
    
    function importDataFromFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          if (data.projects && Array.isArray(data.projects)) {
            const confirmMsg = '即将导入 ' + data.projects.length + ' 个项目。\n\n选择导入模式：\n- 确定：合并到现有数据\n- 取消后重新选择覆盖模式';
            if (confirm(confirmMsg)) {
              // 合并模式
              const existingIds = projects.map(p => p.id);
              const newProjects = data.projects.filter(p => !existingIds.includes(p.id));
              projects = [...projects, ...newProjects];
              saveProjects();
              showToast('成功导入 ' + newProjects.length + ' 个新项目', 'success');
            } else if (confirm('是否覆盖所有现有数据？（此操作不可恢复）')) {
              // 覆盖模式
              projects = data.projects;
              saveProjects();
              showToast('数据已完全覆盖', 'success');
            }
            renderProjects();
            updateStats();
            updateStorageStats();
          } else {
            showToast('无效的备份文件格式', 'error');
          }
        } catch (err) {
          showToast('文件解析失败：' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // 重置以允许再次选择同一文件
    }
    
    function clearAllData() {
      const confirmText = '确定要清除所有数据吗？\n\n此操作将删除：\n- 所有项目 (' + projects.length + ' 个)\n- 所有版本快照\n- 所有自定义设置\n\n此操作不可恢复！';
      if (confirm(confirmText)) {
        if (confirm('最后确认：真的要删除所有数据吗？')) {
          localStorage.removeItem('rbf_projects');
          localStorage.removeItem('rbf_custom_templates');
          projects = [];
          renderProjects();
          updateStats();
          updateStorageStats();
          showToast('所有数据已清除', 'success');
        }
      }
    }
    
    function showLoginPrompt() {
      showToast('云端同步功能即将上线，敬请期待', 'info');
    }
    
    // Toast通知
    function showToast(message, type = 'info') {
      const colors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-indigo-500',
        warning: 'bg-amber-500'
      };
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
      };
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 ' + colors[type] + ' text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-in';
      toast.innerHTML = '<i class="fas ' + icons[type] + ' mr-2"></i>' + message;
      document.body.appendChild(toast);
      setTimeout(() => { toast.remove(); }, 3000);
    }
    function showCollaboratorModal() { 
      document.getElementById('collaboratorModal').classList.remove('hidden');
      renderCollaboratorList();
      if (currentProject) {
        document.getElementById('ownerCreateDate').textContent = formatDate(currentProject.createdAt);
      }
    }
    function hideCollaboratorModal() { document.getElementById('collaboratorModal').classList.add('hidden'); }
    function showJoinCollabModal() { document.getElementById('joinCollabModal').classList.remove('hidden'); }
    function hideJoinCollabModal() { document.getElementById('joinCollabModal').classList.add('hidden'); }
    
    // ==================== 协作功能 ====================
    let selectedInviteRole = 'investor';
    
    function selectInviteRole(role) {
      selectedInviteRole = role;
      // 更新UI
      document.querySelectorAll('.invite-role-btn').forEach(btn => {
        btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'border-amber-500', 'bg-amber-50', 'border-gray-500', 'bg-gray-100');
        btn.classList.add('border-gray-200');
      });
      const btnId = 'role' + role.charAt(0).toUpperCase() + role.slice(1);
      const btn = document.getElementById(btnId);
      if (role === 'investor') {
        btn.classList.remove('border-gray-200');
        btn.classList.add('border-indigo-500', 'bg-indigo-50');
      } else if (role === 'borrower') {
        btn.classList.remove('border-gray-200');
        btn.classList.add('border-amber-500', 'bg-amber-50');
      } else {
        btn.classList.remove('border-gray-200');
        btn.classList.add('border-gray-500', 'bg-gray-100');
      }
    }
    function showVersionModal() { 
      document.getElementById('versionModal').classList.remove('hidden');
      renderVersionList();
    }
    function hideVersionModal() { document.getElementById('versionModal').classList.add('hidden'); }
    function showVersionCompareModal() { 
      document.getElementById('versionCompareModal').classList.remove('hidden');
      populateVersionSelectors();
    }
    function hideVersionCompareModal() { document.getElementById('versionCompareModal').classList.add('hidden'); }
    function showVersionDetailModal() { document.getElementById('versionDetailModal').classList.remove('hidden'); }
    function hideVersionDetailModal() { document.getElementById('versionDetailModal').classList.add('hidden'); }
    function showAIAdvisorModal() { document.getElementById('aiAdvisorModal').classList.remove('hidden'); }
    function hideAIAdvisorModal() { document.getElementById('aiAdvisorModal').classList.add('hidden'); }
    function showSignModal() { document.getElementById('signModal').classList.remove('hidden'); }
    function hideSignModal() { document.getElementById('signModal').classList.add('hidden'); }
    function showExportModal() { document.getElementById('exportModal').classList.remove('hidden'); }
    function hideExportModal() { document.getElementById('exportModal').classList.add('hidden'); }
    function showTemplateManagerModal() { document.getElementById('templateManagerModal').classList.remove('hidden'); }
    function hideTemplateManagerModal() { document.getElementById('templateManagerModal').classList.add('hidden'); }
    
    // ==================== 协作功能 - 邀请链接 ====================
    async function generateInviteLink() {
      if (!currentProject) {
        showToast('请先打开一个项目', 'warning');
        return;
      }
      
      const btn = document.getElementById('btnGenerateInvite');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成中...';
      
      try {
        const expireHours = parseInt(document.getElementById('inviteExpireSelect').value);
        const res = await fetch('/api/projects/' + currentProject.id + '/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            role: selectedInviteRole, 
            expireHours,
            creatorName: '项目创建者',
            projectName: currentProject.name
          })
        });
        const result = await res.json();
        
        if (result.success) {
          document.getElementById('inviteLinkBox').classList.remove('hidden');
          document.getElementById('inviteLinkInput').value = result.inviteUrl;
          document.getElementById('inviteExpireInfo').textContent = '有效期至 ' + new Date(result.expiresAt).toLocaleString('zh-CN');
          
          const roleNames = { investor: '投资方', borrower: '融资方', viewer: '观察者' };
          document.getElementById('inviteRoleInfo').textContent = '角色: ' + roleNames[selectedInviteRole];
          
          // 保存邀请记录到项目
          if (!currentProject.invites) currentProject.invites = [];
          currentProject.invites.push({
            code: result.inviteCode,
            role: selectedInviteRole,
            expiresAt: result.expiresAt,
            createdAt: new Date().toISOString()
          });
          saveProjects();
          
          showToast('邀请链接已生成', 'success');
        } else {
          showToast(result.message || '生成失败', 'error');
        }
      } catch (e) {
        showToast('网络错误，请重试', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-link mr-2"></i>生成邀请链接';
      }
    }
    
    function copyInviteLink() {
      const input = document.getElementById('inviteLinkInput');
      input.select();
      document.execCommand('copy');
      showToast('邀请链接已复制到剪贴板', 'success');
    }
    
    function shareInviteLink() {
      const url = document.getElementById('inviteLinkInput').value;
      if (navigator.share) {
        navigator.share({
          title: '邀请加入合同协商',
          text: '您被邀请加入 ' + (currentProject?.name || '项目') + ' 的协商',
          url: url
        });
      } else {
        copyInviteLink();
      }
    }
    
    // 渲染协作者列表
    function renderCollaboratorList() {
      const container = document.getElementById('dynamicCollaboratorList');
      if (!currentProject) {
        container.innerHTML = '<p class="text-center text-sm text-gray-400 py-4">请先打开一个项目</p>';
        return;
      }
      
      const collaborators = currentProject.collaborators || [];
      const count = collaborators.length + 1; // +1 for owner
      document.getElementById('collaboratorCount').textContent = count + '人';
      
      if (collaborators.length === 0) {
        container.innerHTML = '<p class="text-center text-sm text-gray-400 py-4">暂无其他协作者，生成邀请链接邀请他人加入</p>';
        return;
      }
      
      container.innerHTML = collaborators.map(c => {
        const roleConfig = {
          investor: { icon: 'fa-landmark', color: 'indigo', label: '投资方' },
          borrower: { icon: 'fa-store', color: 'amber', label: '融资方' },
          viewer: { icon: 'fa-eye', color: 'gray', label: '观察者' }
        };
        const role = roleConfig[c.role] || roleConfig.viewer;
        const statusColor = c.status === 'online' ? 'bg-emerald-400' : 'bg-gray-300';
        
        return \`
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div class="w-10 h-10 bg-\${role.color}-100 rounded-full flex items-center justify-center">
                  <i class="fas \${role.icon} text-\${role.color}-600"></i>
                </div>
                <span class="absolute -bottom-1 -right-1 w-4 h-4 \${statusColor} rounded-full border-2 border-white"></span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">\${c.name || '协作者'}</p>
                <p class="text-xs text-gray-500">加入于 \${formatDate(c.joinedAt)}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 bg-\${role.color}-100 text-\${role.color}-700 rounded-lg text-xs">\${role.label}</span>
              <button onclick="removeCollaborator('\${c.id}')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="移除">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }
    
    function removeCollaborator(collaboratorId) {
      if (!currentProject) return;
      if (!confirm('确定要移除该协作者吗？')) return;
      
      currentProject.collaborators = (currentProject.collaborators || []).filter(c => c.id !== collaboratorId);
      saveProjects();
      renderCollaboratorList();
      showToast('协作者已移除', 'success');
    }
    
    // 验证并加入协作
    async function verifyAndJoin() {
      const code = document.getElementById('joinInviteCode').value.trim().toUpperCase();
      const userName = document.getElementById('joinUserName').value.trim();
      const userEmail = document.getElementById('joinUserEmail').value.trim();
      
      if (!code) {
        showToast('请输入邀请码', 'warning');
        return;
      }
      
      const resultContainer = document.getElementById('joinCollabResult');
      const contentContainer = document.getElementById('joinCollabContent');
      
      try {
        // 先验证邀请码
        const verifyRes = await fetch('/api/invite/' + code + '/verify');
        const verifyResult = await verifyRes.json();
        
        if (!verifyResult.valid) {
          showToast(verifyResult.message || '邀请码无效', 'error');
          return;
        }
        
        // 加入协作
        const joinRes = await fetch('/api/join/' + code, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, userEmail })
        });
        const joinResult = await joinRes.json();
        
        if (joinResult.success) {
          contentContainer.classList.add('hidden');
          resultContainer.classList.remove('hidden');
          resultContainer.innerHTML = \`
            <div class="text-center py-6">
              <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-emerald-600 text-2xl"></i>
              </div>
              <h3 class="font-medium text-gray-900 mb-2">成功加入协作！</h3>
              <p class="text-sm text-gray-500 mb-4">项目: \${verifyResult.projectName || '未命名项目'}</p>
              <p class="text-sm text-gray-500 mb-4">角色: \${joinResult.role === 'investor' ? '投资方' : joinResult.role === 'borrower' ? '融资方' : '观察者'}</p>
              <p class="text-xs text-amber-600 mb-4"><i class="fas fa-info-circle mr-1"></i>请在项目列表中查看已加入的项目</p>
              <button onclick="hideJoinCollabModal()" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                完成
              </button>
            </div>
          \`;
          showToast('成功加入协作', 'success');
        } else {
          showToast(joinResult.message || '加入失败', 'error');
        }
      } catch (e) {
        showToast('网络错误，请重试', 'error');
      }
    }
    
    // ==================== 版本管理 ====================
    function createVersionSnapshot() {
      if (!currentProject) {
        showToast('请先打开一个项目', 'warning');
        return;
      }
      
      const nameInput = document.getElementById('versionNameInput');
      let name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        name = '版本 ' + ((currentProject.versions?.length || 0) + 1);
      }
      
      const version = {
        id: 'v_' + Date.now(),
        name,
        params: JSON.parse(JSON.stringify(currentProject.params)), // 深拷贝
        negotiations: JSON.parse(JSON.stringify(currentProject.negotiations || [])),
        paramCount: Object.keys(currentProject.params || {}).length,
        negotiationCount: (currentProject.negotiations || []).length,
        createdAt: new Date().toISOString()
      };
      
      if (!currentProject.versions) currentProject.versions = [];
      currentProject.versions.push(version);
      currentProject.updatedAt = new Date().toISOString();
      saveProjects();
      
      if (nameInput) nameInput.value = '';
      renderVersionList();
      showToast('版本快照已创建: ' + name, 'success');
    }
    
    function renderVersionList() {
      if (!currentProject) return;
      
      const versions = currentProject.versions || [];
      const container = document.getElementById('versionHistoryList');
      const countEl = document.getElementById('versionCount');
      const compareBtn = document.getElementById('btnVersionCompare');
      
      // 更新当前版本信息
      document.getElementById('currentVersionNegCount').textContent = (currentProject.negotiations || []).length;
      document.getElementById('currentVersionParamCount').textContent = Object.keys(currentProject.params || {}).length;
      
      countEl.textContent = versions.length + '个版本';
      compareBtn.disabled = versions.length === 0;
      
      if (versions.length === 0) {
        container.innerHTML = \`
          <div class="text-center text-gray-400 py-8">
            <i class="fas fa-code-branch text-3xl mb-3 opacity-50"></i>
            <p class="text-sm">暂无历史版本</p>
            <p class="text-xs mt-1">创建快照来保存重要节点</p>
          </div>
        \`;
        return;
      }
      
      container.innerHTML = versions.slice().reverse().map((v, i) => {
        const index = versions.length - i;
        const isLatest = i === 0;
        return \`
          <div class="version-item p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span class="text-purple-600 font-bold text-sm">V\${index}</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">\${v.name}</p>
                  <p class="text-xs text-gray-500">\${v.negotiationCount || 0}轮协商 · \${v.paramCount || Object.keys(v.params || {}).length}项参数 · \${formatDateTime(v.createdAt)}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                \${isLatest ? '<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">最新</span>' : ''}
                <button onclick="viewVersionDetail('\${v.id}')" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="查看详情">
                  <i class="fas fa-eye text-sm"></i>
                </button>
                <button onclick="restoreVersion('\${v.id}')" class="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="回退到此版本">
                  <i class="fas fa-undo text-sm"></i>
                </button>
                <button onclick="deleteVersion('\${v.id}')" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除">
                  <i class="fas fa-trash text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }
    
    function viewVersionDetail(versionId) {
      if (!currentProject) return;
      const version = (currentProject.versions || []).find(v => v.id === versionId);
      if (!version) return;
      
      const content = document.getElementById('versionDetailContent');
      content.innerHTML = \`
        <div class="space-y-4">
          <div class="text-center pb-4 border-b border-gray-100">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-code-branch text-purple-600 text-2xl"></i>
            </div>
            <h3 class="font-bold text-gray-900">\${version.name}</h3>
            <p class="text-sm text-gray-500">创建于 \${formatDateTime(version.createdAt)}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-indigo-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-indigo-600">\${version.negotiationCount || (version.negotiations || []).length}</p>
              <p class="text-xs text-indigo-500">协商轮次</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-purple-600">\${version.paramCount || Object.keys(version.params || {}).length}</p>
              <p class="text-xs text-purple-500">参数数量</p>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">主要参数</h4>
            <div class="space-y-1 text-sm max-h-40 overflow-y-auto">
              \${Object.entries(version.params || {}).slice(0, 8).map(([k, v]) => \`
                <div class="flex justify-between">
                  <span class="text-gray-500">\${k}</span>
                  <span class="text-gray-900 font-medium">\${v}</span>
                </div>
              \`).join('')}
              \${Object.keys(version.params || {}).length > 8 ? '<p class="text-gray-400 text-xs mt-2">... 更多参数</p>' : ''}
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button onclick="restoreVersion('\${version.id}'); hideVersionDetailModal();" class="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <i class="fas fa-undo mr-2"></i>回退到此版本
            </button>
            <button onclick="hideVersionDetailModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              关闭
            </button>
          </div>
        </div>
      \`;
      showVersionDetailModal();
    }
    
    function restoreVersion(versionId) {
      if (!currentProject) return;
      const version = (currentProject.versions || []).find(v => v.id === versionId);
      if (!version) return;
      
      if (!confirm('确定要回退到版本「' + version.name + '」吗？\\n\\n当前工作内容将被替换为该版本的内容。\\n建议先创建一个快照保存当前状态。')) {
        return;
      }
      
      // 回退参数和协商记录
      currentProject.params = JSON.parse(JSON.stringify(version.params));
      currentProject.negotiations = JSON.parse(JSON.stringify(version.negotiations || []));
      currentProject.updatedAt = new Date().toISOString();
      saveProjects();
      
      // 重新渲染
      renderNegotiationHistory();
      renderModuleCards();
      renderContractText();
      updateChangedBadge();
      renderVersionList();
      
      showToast('已回退到版本: ' + version.name, 'success');
    }
    
    function deleteVersion(versionId) {
      if (!currentProject) return;
      if (!confirm('确定要删除此版本快照吗？此操作不可恢复。')) return;
      
      currentProject.versions = (currentProject.versions || []).filter(v => v.id !== versionId);
      saveProjects();
      renderVersionList();
      showToast('版本已删除', 'success');
    }
    
    function populateVersionSelectors() {
      if (!currentProject) return;
      const versions = currentProject.versions || [];
      
      const optionsHtml = versions.map((v, i) => \`<option value="\${v.id}">V\${i + 1}: \${v.name}</option>\`).join('');
      
      document.getElementById('compareVersionA').innerHTML = '<option value="">选择版本...</option>' + optionsHtml;
      document.getElementById('compareVersionB').innerHTML = '<option value="current">当前工作版本</option>' + optionsHtml;
    }
    
    function runVersionCompare() {
      if (!currentProject) return;
      
      const versionAId = document.getElementById('compareVersionA').value;
      const versionBId = document.getElementById('compareVersionB').value;
      const container = document.getElementById('versionCompareResult');
      
      if (!versionAId) {
        container.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="fas fa-exchange-alt text-3xl mb-3 opacity-50"></i><p class="text-sm">请选择基准版本</p></div>';
        return;
      }
      
      const versionA = currentProject.versions.find(v => v.id === versionAId);
      const versionB = versionBId === 'current' 
        ? { name: '当前工作版本', params: currentProject.params, negotiations: currentProject.negotiations }
        : currentProject.versions.find(v => v.id === versionBId);
      
      if (!versionA || !versionB) return;
      
      // 对比参数差异
      const paramsA = versionA.params || {};
      const paramsB = versionB.params || {};
      const allKeys = [...new Set([...Object.keys(paramsA), ...Object.keys(paramsB)])];
      
      const diffs = allKeys.map(key => {
        const valA = paramsA[key] || '-';
        const valB = paramsB[key] || '-';
        const changed = valA !== valB;
        return { key, valA, valB, changed };
      }).filter(d => d.changed);
      
      container.innerHTML = \`
        <div class="bg-gray-50 p-4 border-b border-gray-200">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-purple-600">\${versionA.name}</span>
            <span class="text-gray-400">VS</span>
            <span class="font-medium text-blue-600">\${versionB.name}</span>
          </div>
        </div>
        <div class="p-4">
          \${diffs.length === 0 ? \`
            <div class="text-center text-gray-400 py-8">
              <i class="fas fa-equals text-2xl mb-2"></i>
              <p class="text-sm">两个版本参数完全相同</p>
            </div>
          \` : \`
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-gray-500">共 <span class="font-bold text-red-600">\${diffs.length}</span> 处差异</span>
            </div>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              \${diffs.map(d => \`
                <div class="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-700">\${d.key}</p>
                    <div class="flex items-center mt-1 text-sm">
                      <span class="text-purple-600 bg-purple-100 px-2 py-0.5 rounded">\${d.valA}</span>
                      <i class="fas fa-arrow-right mx-2 text-gray-400"></i>
                      <span class="text-blue-600 bg-blue-100 px-2 py-0.5 rounded">\${d.valB}</span>
                    </div>
                  </div>
                </div>
              \`).join('')}
            </div>
          \`}
        </div>
      \`;
    }
    
    function formatDateTime(dateStr) {
      return new Date(dateStr).toLocaleString('zh-CN', { 
        month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
    }
    
    // ==================== AI助手 ====================
    async function getAIAdvice() {
      if (!currentProject) return;
      
      const content = document.getElementById('aiAdvisorContent');
      content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i><p class="text-gray-500">AI正在分析...</p></div>';
      showAIAdvisorModal();
      
      try {
        const res = await fetch('/api/ai/negotiate-advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProject.id,
            currentParams: currentProject.params,
            negotiationHistory: currentProject.negotiations || [],
            perspective: currentPerspective
          })
        });
        
        const advice = await res.json();
        
        if (advice.error) {
          content.innerHTML = '<div class="text-center py-8 text-red-500"><i class="fas fa-exclamation-circle text-4xl mb-4"></i><p>获取建议失败，请重试</p></div>';
          return;
        }
        
        content.innerHTML = \`
          <div class="space-y-4">
            <div class="p-4 bg-indigo-50 rounded-lg">
              <h4 class="font-medium text-indigo-900 mb-2"><i class="fas fa-chart-line mr-2"></i>态势分析</h4>
              <p class="text-sm text-indigo-700">\${advice.analysis || '暂无分析'}</p>
            </div>
            \${advice.suggestions?.length > 0 ? \`
              <div class="p-4 bg-emerald-50 rounded-lg">
                <h4 class="font-medium text-emerald-900 mb-3"><i class="fas fa-lightbulb mr-2"></i>参数建议</h4>
                <div class="space-y-2">
                  \${advice.suggestions.map(s => \`
                    <div class="bg-white p-3 rounded-lg border border-emerald-200">
                      <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-gray-700">\${s.param}</span>
                        <div class="text-sm">
                          <span class="text-gray-400">\${s.currentValue}</span>
                          <i class="fas fa-arrow-right mx-2 text-emerald-500"></i>
                          <span class="text-emerald-600 font-medium">\${s.suggestedValue}</span>
                        </div>
                      </div>
                      <p class="text-xs text-gray-500">\${s.reason}</p>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}
            \${advice.talkingPoints?.length > 0 ? \`
              <div class="p-4 bg-amber-50 rounded-lg">
                <h4 class="font-medium text-amber-900 mb-2"><i class="fas fa-comment-alt mr-2"></i>表达建议</h4>
                <ul class="space-y-1">
                  \${advice.talkingPoints.map(t => \`<li class="text-sm text-amber-700">• \${t}</li>\`).join('')}
                </ul>
              </div>
            \` : ''}
            \${advice.risks?.length > 0 ? \`
              <div class="p-4 bg-red-50 rounded-lg">
                <h4 class="font-medium text-red-900 mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>风险提醒</h4>
                <ul class="space-y-1">
                  \${advice.risks.map(r => \`<li class="text-sm text-red-700">• \${r}</li>\`).join('')}
                </ul>
              </div>
            \` : ''}
          </div>
        \`;
      } catch (e) {
        content.innerHTML = '<div class="text-center py-8 text-red-500"><i class="fas fa-exclamation-circle text-4xl mb-4"></i><p>网络错误，请重试</p></div>';
      }
    }
    
    // ==================== 工具函数 ====================
    function saveProjects() { localStorage.setItem('rbf_projects', JSON.stringify(projects)); }
    function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }); }
    function formatTime(dateStr) { return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
    
    init();
  </script>
</body>
</html>`)
})

export default app
