import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { industryTemplates, templateList } from './templates'
import { 
  contractAgents, 
  agentList, 
  routeToAgents, 
  executeMultiAgentWorkflow,
  executeAgentTask,
  executeSmartChangeWorkflow,
  executeSmartChangeWorkflowV3,
  executeSmartChangeAnalysis,
  executeLegalCounselTransform,
  executeProgressiveWorkflow,
  type AgentTask,
  type SmartChange,
  type SmartChangeResult,
  type LegalTransformRequest,
  type LegalTransformResult
} from './agents'

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

// ==================== 电子签章API ====================
// 内存存储签署信息（生产环境应使用D1/KV）
const signatureStore = new Map<string, {
  signId: string
  projectId: string
  projectName: string
  status: 'pending' | 'signing' | 'completed' | 'cancelled'
  signers: Array<{
    id: string
    name: string
    email: string
    phone: string
    role: 'investor' | 'borrower'
    status: 'pending' | 'signed'
    signedAt?: string
    signatureData?: string // base64 签名图片
  }>
  contractHash: string
  createdAt: string
  completedAt?: string
}>()

// 发起签署
app.post('/api/projects/:id/sign/initiate', async (c) => {
  const id = c.req.param('id')
  const { signers, projectName, contractHash } = await c.req.json()
  
  if (!signers || signers.length < 2) {
    return c.json({ success: false, message: '至少需要两位签署人（投资方和融资方各一位）' })
  }
  
  const signId = 'SIGN_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase()
  
  const signData = {
    signId,
    projectId: id,
    projectName: projectName || '未命名项目',
    status: 'signing' as const,
    signers: signers.map((s: any, i: number) => ({
      id: 'signer_' + Date.now() + '_' + i,
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      role: s.role,
      status: 'pending' as const
    })),
    contractHash: contractHash || 'hash_' + Date.now(),
    createdAt: new Date().toISOString()
  }
  
  signatureStore.set(signId, signData)
  
  return c.json({ 
    success: true,
    signId,
    status: 'signing',
    signers: signData.signers,
    message: '签署流程已发起，请各签署人完成签署'
  })
})

// 查询签署状态
app.get('/api/projects/:id/sign/status', async (c) => {
  const id = c.req.param('id')
  
  // 查找该项目的签署记录
  let signData = null
  for (const [signId, data] of signatureStore) {
    if (data.projectId === id) {
      signData = data
      break
    }
  }
  
  if (!signData) {
    return c.json({ 
      success: true,
      hasSignProcess: false,
      message: '该项目尚未发起签署'
    })
  }
  
  const signedCount = signData.signers.filter(s => s.status === 'signed').length
  const totalCount = signData.signers.length
  
  return c.json({ 
    success: true,
    hasSignProcess: true,
    signId: signData.signId,
    status: signData.status,
    progress: `${signedCount}/${totalCount}`,
    signers: signData.signers,
    createdAt: signData.createdAt,
    completedAt: signData.completedAt
  })
})

// 执行签名
app.post('/api/sign/:signId/execute', async (c) => {
  const signId = c.req.param('signId')
  const { signerId, signatureData, verificationCode } = await c.req.json()
  
  const signData = signatureStore.get(signId)
  if (!signData) {
    return c.json({ success: false, message: '签署流程不存在或已过期' })
  }
  
  const signer = signData.signers.find(s => s.id === signerId)
  if (!signer) {
    return c.json({ success: false, message: '签署人不存在' })
  }
  
  if (signer.status === 'signed') {
    return c.json({ success: false, message: '您已完成签署' })
  }
  
  // 验证码校验（演示模式跳过）
  if (verificationCode && verificationCode !== '123456') {
    return c.json({ success: false, message: '验证码错误' })
  }
  
  // 更新签署状态
  signer.status = 'signed'
  signer.signedAt = new Date().toISOString()
  signer.signatureData = signatureData
  
  // 检查是否所有人都已签署
  const allSigned = signData.signers.every(s => s.status === 'signed')
  if (allSigned) {
    signData.status = 'completed'
    signData.completedAt = new Date().toISOString()
  }
  
  signatureStore.set(signId, signData)
  
  return c.json({ 
    success: true,
    message: '签署成功',
    allCompleted: allSigned,
    status: signData.status,
    signers: signData.signers
  })
})

// 获取签署详情（用于签署页面）
app.get('/api/sign/:signId', async (c) => {
  const signId = c.req.param('signId')
  const signData = signatureStore.get(signId)
  
  if (!signData) {
    return c.json({ success: false, message: '签署流程不存在' })
  }
  
  return c.json({
    success: true,
    ...signData
  })
})

// 取消签署流程
app.post('/api/sign/:signId/cancel', async (c) => {
  const signId = c.req.param('signId')
  const signData = signatureStore.get(signId)
  
  if (!signData) {
    return c.json({ success: false, message: '签署流程不存在' })
  }
  
  if (signData.status === 'completed') {
    return c.json({ success: false, message: '已完成的签署无法取消' })
  }
  
  signData.status = 'cancelled'
  signatureStore.set(signId, signData)
  
  return c.json({ success: true, message: '签署流程已取消' })
})

// 发送签署提醒（模拟）
app.post('/api/sign/:signId/remind', async (c) => {
  const signId = c.req.param('signId')
  const { signerId } = await c.req.json()
  
  const signData = signatureStore.get(signId)
  if (!signData) {
    return c.json({ success: false, message: '签署流程不存在' })
  }
  
  const signer = signData.signers.find(s => s.id === signerId)
  if (!signer) {
    return c.json({ success: false, message: '签署人不存在' })
  }
  
  // 实际应发送短信/邮件提醒
  return c.json({ 
    success: true, 
    message: `已向 ${signer.name} 发送签署提醒（演示模式）`
  })
})

// 更新签署人信息
app.put('/api/sign/:signId/update-signer', async (c) => {
  const signId = c.req.param('signId')
  const { signerId, name, phone, email } = await c.req.json()
  
  const signData = signatureStore.get(signId)
  if (!signData) {
    return c.json({ success: false, message: '签署流程不存在' })
  }
  
  const signer = signData.signers.find((s: any) => s.id === signerId)
  if (!signer) {
    return c.json({ success: false, message: '签署人不存在' })
  }
  
  // 已签署的签署人不能修改信息
  if (signer.status === 'signed') {
    return c.json({ success: false, message: '该签署人已完成签署，无法修改信息' })
  }
  
  // 更新签署人信息
  if (name) signer.name = name
  if (phone !== undefined) signer.phone = phone
  if (email !== undefined) signer.email = email
  signer.updatedAt = new Date().toISOString()
  
  return c.json({ 
    success: true, 
    message: '签署人信息已更新',
    signer: {
      id: signer.id,
      name: signer.name,
      phone: signer.phone,
      email: signer.email
    }
  })
})

// ==================== 自定义模板API ====================
// 内存存储自定义模板（生产环境应使用D1/KV）
const customTemplateStore = new Map<string, any>()

// 获取自定义模板列表
app.get('/api/custom-templates', async (c) => {
  const templates = Array.from(customTemplateStore.values())
  return c.json({ 
    success: true,
    templates,
    count: templates.length
  })
})

// 获取单个自定义模板
app.get('/api/custom-templates/:id', async (c) => {
  const id = c.req.param('id')
  const template = customTemplateStore.get(id)
  if (!template) {
    return c.json({ success: false, message: '模板不存在' }, 404)
  }
  return c.json({ success: true, template })
})

// 创建自定义模板
app.post('/api/custom-templates', async (c) => {
  const template = await c.req.json()
  const templateId = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6)
  
  const newTemplate = {
    id: templateId,
    name: template.name || '未命名模板',
    icon: template.icon || 'fa-file-contract',
    description: template.description || '',
    color: template.color || 'gray',
    industry: template.industry || '自定义',
    defaultParams: template.defaultParams || {},
    modules: template.modules || [],
    fullText: template.fullText || [],
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  customTemplateStore.set(templateId, newTemplate)
  
  return c.json({ 
    success: true,
    templateId,
    template: newTemplate,
    message: '模板已创建'
  })
})

// 更新自定义模板
app.put('/api/custom-templates/:id', async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const existing = customTemplateStore.get(id)
  if (!existing) {
    return c.json({ success: false, message: '模板不存在' }, 404)
  }
  
  const updated = {
    ...existing,
    ...updates,
    id, // 确保ID不变
    isCustom: true,
    updatedAt: new Date().toISOString()
  }
  
  customTemplateStore.set(id, updated)
  
  return c.json({ 
    success: true,
    template: updated,
    message: '模板已更新'
  })
})

// 删除自定义模板
app.delete('/api/custom-templates/:id', async (c) => {
  const id = c.req.param('id')
  
  if (!customTemplateStore.has(id)) {
    return c.json({ success: false, message: '模板不存在' }, 404)
  }
  
  customTemplateStore.delete(id)
  
  return c.json({ 
    success: true,
    message: '模板已删除'
  })
})

// 复制系统模板为自定义模板
app.post('/api/custom-templates/clone/:sourceId', async (c) => {
  const sourceId = c.req.param('sourceId')
  const { name } = await c.req.json()
  
  // 获取源模板（系统模板）
  const sourceTemplate = industryTemplates[sourceId]
  if (!sourceTemplate) {
    return c.json({ success: false, message: '源模板不存在' }, 404)
  }
  
  const templateId = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6)
  
  const newTemplate = {
    ...JSON.parse(JSON.stringify(sourceTemplate)), // 深拷贝
    id: templateId,
    name: name || sourceTemplate.name + ' (副本)',
    isCustom: true,
    sourceTemplateId: sourceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  customTemplateStore.set(templateId, newTemplate)
  
  return c.json({ 
    success: true,
    templateId,
    template: newTemplate,
    message: '模板已复制'
  })
})

// 从项目创建模板
app.post('/api/custom-templates/from-project', async (c) => {
  const { name, description, projectParams, sourceTemplateId } = await c.req.json()
  
  // 获取源模板结构
  const sourceTemplate = industryTemplates[sourceTemplateId]
  if (!sourceTemplate) {
    return c.json({ success: false, message: '源模板不存在' }, 404)
  }
  
  const templateId = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6)
  
  const newTemplate = {
    ...JSON.parse(JSON.stringify(sourceTemplate)),
    id: templateId,
    name: name || '从项目创建的模板',
    description: description || '基于项目参数创建',
    defaultParams: projectParams || sourceTemplate.defaultParams,
    isCustom: true,
    sourceTemplateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  customTemplateStore.set(templateId, newTemplate)
  
  return c.json({ 
    success: true,
    templateId,
    template: newTemplate,
    message: '模板已从项目创建'
  })
})

// ==================== 个人账户体系API ====================
// 模拟个人账户系统，预留对接公司整体账户系统的接口

// 内存存储用户数据（生产环境应使用D1/KV + 公司SSO）
const userStore = new Map<string, {
  id: string
  username: string
  email: string
  phone: string
  displayName: string
  avatar?: string
  company?: string
  title?: string
  bio?: string
  defaultRole: 'investor' | 'borrower' | 'both'  // 默认角色
  createdAt: string
  updatedAt: string
  // 预留字段：对接公司账户系统
  externalId?: string  // 公司系统用户ID
  externalToken?: string  // 公司系统Token
  ssoProvider?: string  // SSO提供方
}>()

// 内存存储会话（生产环境应使用JWT/公司SSO）
const sessionStore = new Map<string, {
  userId: string
  token: string
  expiresAt: string
  // 预留：公司SSO会话信息
  ssoSessionId?: string
}>()

// ========== 预留：公司账户系统对接接口 ==========
// 这些接口在对接公司SSO时实现

// 预留：公司SSO登录回调
app.get('/api/auth/sso/callback', async (c) => {
  // TODO: 处理公司SSO回调
  // 1. 验证SSO token
  // 2. 获取用户信息
  // 3. 创建或更新本地用户
  // 4. 创建会话
  return c.json({
    success: false,
    message: '公司SSO对接接口预留，待实现',
    integrationGuide: {
      step1: '配置公司SSO服务端点',
      step2: '实现token验证逻辑',
      step3: '映射用户字段',
      step4: '同步用户权限'
    }
  })
})

// 预留：公司SSO登出
app.post('/api/auth/sso/logout', async (c) => {
  // TODO: 通知公司SSO系统登出
  return c.json({
    success: false,
    message: '公司SSO登出接口预留，待实现'
  })
})

// 预留：同步公司用户数据
app.post('/api/auth/sync-company-user', async (c) => {
  // TODO: 从公司系统同步用户数据
  return c.json({
    success: false,
    message: '公司用户同步接口预留，待实现'
  })
})

// ========== 本地模拟账户系统 ==========

// 用户注册
app.post('/api/auth/register', async (c) => {
  const { username, email, phone, password, displayName, defaultRole, company, title } = await c.req.json()
  
  // 验证必填字段
  if (!username || !email || !password) {
    return c.json({ success: false, message: '请填写用户名、邮箱和密码' }, 400)
  }
  
  // 检查用户名是否已存在
  for (const [_, user] of userStore) {
    if (user.username === username) {
      return c.json({ success: false, message: '用户名已被注册' }, 400)
    }
    if (user.email === email) {
      return c.json({ success: false, message: '邮箱已被注册' }, 400)
    }
  }
  
  // 创建用户
  const userId = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6)
  const now = new Date().toISOString()
  
  const newUser = {
    id: userId,
    username,
    email,
    password,
    phone: phone || '',
    displayName: displayName || username,
    company: company || '',
    title: title || '',
    bio: '',
    defaultRole: (defaultRole as 'investor' | 'borrower' | 'both') || 'both',
    createdAt: now,
    updatedAt: now
  }
  
  userStore.set(userId, newUser)
  
  // 创建会话
  const token = 'tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600000).toISOString() // 7天有效
  
  sessionStore.set(token, {
    userId,
    token,
    expiresAt
  })
  
  return c.json({
    success: true,
    message: '注册成功',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      defaultRole: newUser.defaultRole
    },
    token,
    expiresAt
  })
})

// 用户登录
app.post('/api/auth/login', async (c) => {
  const { username, email, password } = await c.req.json()
  
  const loginId = username || email
  if (!loginId || !password) {
    return c.json({ success: false, message: '请输入用户名/邮箱和密码' }, 400)
  }
  
  // 查找用户（模拟验证，生产环境需要密码哈希验证）
  let foundUser = null
  for (const [_, user] of userStore) {
    if (user.username === loginId || user.email === loginId) {
      foundUser = user
      break
    }
  }
  
  if (!foundUser) {
    return c.json({ success: false, message: '用户不存在' }, 401)
  }
  
  // 密码验证
  if (foundUser.password !== password) {
    return c.json({ success: false, message: '密码错误' }, 401)
  }
  
  // 创建会话
  const token = 'tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600000).toISOString()
  
  sessionStore.set(token, {
    userId: foundUser.id,
    token,
    expiresAt
  })
  
  return c.json({
    success: true,
    message: '登录成功',
    user: {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      displayName: foundUser.displayName,
      phone: foundUser.phone,
      company: foundUser.company,
      title: foundUser.title,
      bio: foundUser.bio,
      defaultRole: foundUser.defaultRole,
      avatar: foundUser.avatar
    },
    token,
    expiresAt
  })
})

// 登出
app.post('/api/auth/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (token) {
    sessionStore.delete(token)
  }
  
  return c.json({ success: true, message: '已登出' })
})

// 验证会话/获取当前用户
app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ success: false, message: '未登录' }, 401)
  }
  
  const session = sessionStore.get(token)
  if (!session || new Date(session.expiresAt) < new Date()) {
    sessionStore.delete(token)
    return c.json({ success: false, message: '会话已过期，请重新登录' }, 401)
  }
  
  const user = userStore.get(session.userId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' }, 404)
  }
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      company: user.company,
      title: user.title,
      bio: user.bio,
      defaultRole: user.defaultRole,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  })
})

// 更新个人信息
app.put('/api/auth/profile', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ success: false, message: '未登录' }, 401)
  }
  
  const session = sessionStore.get(token)
  if (!session || new Date(session.expiresAt) < new Date()) {
    return c.json({ success: false, message: '会话已过期' }, 401)
  }
  
  const user = userStore.get(session.userId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' }, 404)
  }
  
  const updates = await c.req.json()
  const allowedFields = ['displayName', 'phone', 'company', 'title', 'bio', 'avatar', 'defaultRole']
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      (user as any)[field] = updates[field]
    }
  }
  user.updatedAt = new Date().toISOString()
  
  userStore.set(session.userId, user)
  
  return c.json({
    success: true,
    message: '个人信息已更新',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      company: user.company,
      title: user.title,
      bio: user.bio,
      defaultRole: user.defaultRole,
      avatar: user.avatar
    }
  })
})

// 获取用户的项目统计（按角色区分）
app.get('/api/auth/my-stats', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ success: false, message: '未登录' }, 401)
  }
  
  const session = sessionStore.get(token)
  if (!session) {
    return c.json({ success: false, message: '会话无效' }, 401)
  }
  
  const user = userStore.get(session.userId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' }, 404)
  }
  
  // 返回统计信息（实际数据从前端localStorage获取并传入，这里返回结构）
  return c.json({
    success: true,
    userId: user.id,
    stats: {
      asBorrower: {
        totalProjects: 0,
        negotiating: 0,
        completed: 0,
        signed: 0,
        totalAmount: 0
      },
      asInvestor: {
        totalProjects: 0,
        negotiating: 0,
        completed: 0,
        signed: 0,
        totalAmount: 0
      }
    },
    message: '统计数据需从本地存储计算'
  })
})

// ==================== AI谈判助手API ====================

// 辅助函数：获取API配置
function getAIConfig(c: any) {
  // 优先从Cloudflare绑定获取，然后尝试process.env
  const apiKey = c.env?.OPENAI_API_KEY || 
                 (typeof process !== 'undefined' ? (process.env?.OPENAI_API_KEY || process.env?.GENSPARK_TOKEN) : '') || 
                 ''
  const baseUrl = c.env?.OPENAI_BASE_URL || 
                  (typeof process !== 'undefined' ? process.env?.OPENAI_BASE_URL : '') || 
                  'https://www.genspark.ai/api/llm_proxy/v1'
  return { apiKey, baseUrl }
}

// 获取综合谈判建议
app.post('/api/ai/negotiate-advice', async (c) => {
  const { projectId, currentParams, negotiationHistory, perspective, templateName } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  const perspectiveName = perspective === 'investor' ? '投资方' : '融资方'
  const oppositeParty = perspective === 'investor' ? '融资方' : '投资方'
  
  const systemPrompt = `你是一个专业的收益分成合作谈判顾问，具有丰富的投资和法律经验。

## 你的任务
为【${perspectiveName}】提供专业的谈判策略建议，帮助其在协商中获得最佳结果。

## 当前项目行业：${templateName || '未知'}

## 当前合同参数：
${JSON.stringify(currentParams, null, 2)}

## 协商历史（共${negotiationHistory?.length || 0}轮）：
${negotiationHistory?.length > 0 ? negotiationHistory.map((n: any, i: number) => `第${i+1}轮 [${n.perspective === 'investor' ? '投资方' : '融资方'}]: ${n.input}
  变更: ${n.changes?.map((c: any) => c.paramName + ': ' + c.oldValue + '→' + c.newValue).join(', ') || '无'}`).join('\n') : '暂无协商记录'}

## 市场参考数据（收益分成合作行业）：
- 餐饮行业：投资金额200-800万，分成比例10-18%，期限24-48个月
- 零售行业：投资金额100-500万，分成比例8-15%，期限36-60个月
- 演唱会/娱乐：投资金额1000-5000万，分成比例60-80%，期限按项目
- 违约金：通常为投资金额的15-25%

## 请提供：
1. **态势分析**：当前谈判进展评估（对${perspectiveName}的有利/不利因素）
2. **最优报价建议**：基于市场数据和对方立场，给出具体参数建议
3. **谈判策略**：如何在表达上争取更好条件
4. **让步空间**：可接受的底线和可交换的条件
5. **风险预警**：当前条款中的潜在风险
6. **预测对方动作**：${oppositeParty}可能的下一步反应

## 输出JSON格式：
{
  "analysis": "态势分析（100字内）",
  "positionScore": 65,
  "suggestions": [
    { "param": "参数名", "currentValue": "当前值", "suggestedValue": "建议值", "minAcceptable": "最低可接受值", "reason": "理由", "priority": "high" }
  ],
  "talkingPoints": ["表达话术1", "表达话术2"],
  "concessionStrategy": {
    "canGive": ["可以让步的点"],
    "mustKeep": ["必须坚持的点"],
    "tradeOff": "交换策略建议"
  },
  "risks": [
    { "level": "high", "description": "风险描述", "mitigation": "应对建议" }
  ],
  "opponentPrediction": "预测对方下一步动作",
  "confidence": 85
}`

  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请基于以上信息，为我提供详细的谈判建议。' }
        ],
        temperature: 0.4
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return c.json({ success: false, error: 'AI服务暂时不可用，请稍后重试', detail: errorText }, 500)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return c.json({
          success: true,
          ...result,
          generatedAt: new Date().toISOString()
        })
      }
    } catch (e) {}
    
    return c.json({ success: false, error: 'Failed to parse response', raw: content }, 500)
  } catch (error) {
    return c.json({ success: false, error: 'Request failed: ' + (error as Error).message }, 500)
  }
})

// 风险评估API
app.post('/api/ai/risk-assessment', async (c) => {
  const { currentParams, templateName, negotiationHistory } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  const systemPrompt = `你是收益分成合作风险评估专家。请对当前合同条款进行全面风险评估。

## 行业：${templateName || '未知'}
## 当前合同参数：${JSON.stringify(currentParams, null, 2)}
## 协商轮次：${negotiationHistory?.length || 0}

请从以下维度评估风险：
1. 投资回报风险
2. 违约风险
3. 市场风险
4. 法律合规风险
5. 操作风险

输出JSON：
{
  "overallRiskScore": 65,
  "overallRiskLevel": "medium",
  "riskBreakdown": [
    {
      "category": "风险类别",
      "score": 70,
      "level": "high",
      "description": "风险描述",
      "factors": ["具体因素1", "具体因素2"],
      "recommendations": ["建议措施1"]
    }
  ],
  "criticalIssues": ["最需要关注的问题"],
  "safetyMargin": "安全边际评估"
}`

  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请进行风险评估' }
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
        return c.json({ success: true, ...JSON.parse(jsonMatch[0]) })
      }
    } catch (e) {}
    
    return c.json({ success: false, error: 'Parse failed' }, 500)
  } catch (error) {
    return c.json({ success: false, error: 'Request failed' }, 500)
  }
})

// 市场对标分析API
app.post('/api/ai/market-benchmark', async (c) => {
  const { currentParams, templateName, industry } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  const systemPrompt = `你是收益分成合作市场分析专家。请对当前条款与市场标准进行对标分析。

## 行业：${industry || templateName || '未知'}
## 当前合同参数：${JSON.stringify(currentParams, null, 2)}

请分析各参数与市场标准的对比，并给出优化建议。

输出JSON：
{
  "marketAnalysis": "市场整体情况概述",
  "benchmarks": [
    {
      "param": "参数名",
      "currentValue": "当前值",
      "marketLow": "市场最低",
      "marketAvg": "市场平均",
      "marketHigh": "市场最高",
      "position": "below",
      "recommendation": "调整建议"
    }
  ],
  "competitiveness": 75,
  "summary": "综合评价"
}`

  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请进行市场对标分析' }
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
        return c.json({ success: true, ...JSON.parse(jsonMatch[0]) })
      }
    } catch (e) {}
    
    return c.json({ success: false, error: 'Parse failed' }, 500)
  } catch (error) {
    return c.json({ success: false, error: 'Request failed' }, 500)
  }
})

// ==================== 多Agent并行工作流API ====================

// 获取Agent列表
app.get('/api/agents', (c) => {
  return c.json(agentList)
})

// 获取单个Agent配置
app.get('/api/agents/:id', (c) => {
  const id = c.req.param('id')
  const agent = contractAgents[id]
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404)
  }
  return c.json({
    id: agent.id,
    name: agent.name,
    icon: agent.icon,
    color: agent.color,
    description: agent.description,
    moduleIds: agent.moduleIds,
    expertise: agent.expertise
  })
})

// 路由分析API - 分析输入应该分配给哪些Agent
app.post('/api/agents/route', async (c) => {
  const { message } = await c.req.json()
  const { apiKey, baseUrl } = getAIConfig(c)
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
  }
  
  try {
    const result = await routeToAgents(message, apiKey, baseUrl)
    return c.json({
      success: true,
      ...result,
      agents: result.targetAgents.map(id => {
        const agent = contractAgents[id]
        return agent ? {
          id: agent.id,
          name: agent.name,
          icon: agent.icon,
          color: agent.color
        } : null
      }).filter(Boolean)
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Routing failed: ' + (error as Error).message 
    }, 500)
  }
})

// 多Agent并行处理API（核心API）
app.post('/api/agents/process', async (c) => {
  const { 
    message, 
    templateId, 
    currentParams, 
    negotiationHistory,
    perspective 
  } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
  }
  
  const template = industryTemplates[templateId]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }
  
  const context = {
    currentParams: currentParams || template.defaultParams,
    templateId,
    templateName: template.name,
    negotiationHistory: negotiationHistory || [],
    perspective: perspective || 'borrower'
  }
  
  try {
    const startTime = Date.now()
    const result = await executeMultiAgentWorkflow(message, context, apiKey, baseUrl)
    
    return c.json({
      success: result.success,
      // 路由信息
      routing: (result as any).routerResult,
      // 聚合结果
      understood: result.understood,
      changes: result.allChanges,
      suggestions: result.allSuggestions,
      warnings: result.allWarnings,
      // Agent详情
      agentDetails: result.agentResponses.map(r => ({
        agentId: r.agentId,
        agentName: r.agentName,
        agentIcon: contractAgents[r.agentId]?.icon,
        agentColor: contractAgents[r.agentId]?.color,
        success: r.success,
        understood: r.understood,
        changes: r.changes,
        suggestions: r.suggestions,
        warnings: r.warnings,
        processingTime: r.processingTime
      })),
      // 性能统计
      stats: {
        totalAgents: result.totalAgents,
        respondedAgents: result.respondedAgents,
        parallelProcessingTime: result.totalProcessingTime,
        totalTime: Date.now() - startTime
      }
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Processing failed: ' + (error as Error).message 
    }, 500)
  }
})

// 单Agent处理API（用于单独调用特定Agent）
app.post('/api/agents/:id/process', async (c) => {
  const agentId = c.req.param('id')
  const { 
    message, 
    templateId, 
    currentParams, 
    negotiationHistory,
    perspective 
  } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
  }
  
  const agent = contractAgents[agentId]
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404)
  }
  
  const template = industryTemplates[templateId]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }
  
  const task: AgentTask = {
    agentId,
    input: message,
    context: {
      currentParams: currentParams || template.defaultParams,
      templateId,
      templateName: template.name,
      negotiationHistory: negotiationHistory || [],
      perspective: perspective || 'borrower'
    }
  }
  
  try {
    const result = await executeAgentTask(task, apiKey, baseUrl)
    return c.json({
      success: result.success,
      agent: {
        id: agent.id,
        name: agent.name,
        icon: agent.icon,
        color: agent.color
      },
      understood: result.understood,
      changes: result.changes,
      suggestions: result.suggestions,
      warnings: result.warnings,
      processingTime: result.processingTime
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Agent processing failed: ' + (error as Error).message 
    }, 500)
  }
})

// ==================== 智能联动修改API V3 - 法律顾问增强版 ====================

/**
 * 智能变更分析API V3 - 核心API（法律顾问增强版）
 * 流程：用户自然语言 → 模块Agent识别 → 法律顾问转化 → 联动分析 → 输出
 * 
 * 新增功能：
 * - 法律顾问Agent将用户自然语言转化为专业法律条款语言
 * - 每个修改项包含：原始表达 + 法律条款 + 法律注意事项
 * - 法律审核评分和改进建议
 */
app.post('/api/agents/smart-change', async (c) => {
  const { 
    message, 
    templateId, 
    currentParams, 
    negotiationHistory,
    perspective,
    enableLegalTransform = true  // 新增：是否启用法律顾问转化，默认启用
  } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
  }
  
  const template = industryTemplates[templateId]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }
  
  const context = {
    currentParams: currentParams || template.defaultParams,
    templateId,
    templateName: template.name,
    negotiationHistory: negotiationHistory || [],
    perspective: perspective || 'borrower'
  }
  
  try {
    const startTime = Date.now()
    
    // 使用V3工作流（包含法律顾问转化）
    const result = await executeSmartChangeWorkflowV3(
      message, 
      context, 
      apiKey, 
      baseUrl,
      { enableLegalTransform }
    )
    
    return c.json({
      success: result.success,
      // 用户理解
      understood: result.understood,
      analysisExplanation: result.analysisExplanation,
      // 直接修改（经法律顾问转化后的专业条款）
      primaryChanges: result.primaryChanges,
      // 推断修改（AI分析的关联延伸）
      inferredChanges: result.inferredChanges,
      // 警告信息（包含法律风险警告）
      warnings: result.warnings,
      // 法律顾问信息（V3新增）
      legalTransform: result.legalTransform,
      // Agent详情
      agentDetails: result.agentResponses?.map(r => ({
        agentId: r.agentId,
        agentName: r.agentName,
        success: r.success,
        processingTime: r.processingTime
      })),
      // 处理统计
      stats: {
        totalPrimaryChanges: result.primaryChanges.length,
        totalInferredChanges: result.inferredChanges.length,
        processingTime: result.processingTime,
        legalTransformTime: result.legalTransform?.transformTime,
        totalTime: Date.now() - startTime
      }
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Smart change analysis failed: ' + (error as Error).message 
    }, 500)
  }
})

/**
 * 渐进式智能分析API (SSE流式)
 * Phase 1 (~5s): Agent识别 → 直接修改 + 规则联动（用户立即能操作）
 * Phase 2 (~15s): 法律顾问 + LLM联动 并行（追加法律条款和深层关联）
 */
app.post('/api/agents/smart-change-stream', async (c) => {
  const { 
    message, 
    templateId, 
    currentParams, 
    negotiationHistory,
    perspective
  } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
  }
  
  const template = industryTemplates[templateId]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }
  
  const context = {
    currentParams: currentParams || template.defaultParams,
    templateId,
    templateName: template.name,
    negotiationHistory: negotiationHistory || [],
    perspective: perspective || 'borrower'
  }

  // SSE 流式响应
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      executeProgressiveWorkflow(
        message,
        context,
        apiKey,
        baseUrl,
        (phase, data) => {
          try {
            sendEvent(phase, data)
          } catch (e) {
            // 连接可能已关闭
          }
        }
      ).then(() => {
        try {
          sendEvent('done', { timestamp: Date.now() })
          controller.close()
        } catch (e) {}
      }).catch((err) => {
        try {
          sendEvent('error', { message: err.message || 'Workflow failed' })
          controller.close()
        } catch (e) {}
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  })
})

/**
 * 单独调用法律顾问转化API
 * 用于对已有的修改进行法律语言转化
 */
app.post('/api/agents/legal-transform', async (c) => {
  const { 
    originalInput,
    moduleChanges,
    templateId,
    currentParams,
    perspective
  } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
  }
  
  const template = industryTemplates[templateId]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }
  
  const request: LegalTransformRequest = {
    originalInput,
    moduleChanges: moduleChanges || [],
    context: {
      templateName: template.name,
      perspective: perspective || 'borrower',
      currentParams: currentParams || template.defaultParams
    }
  }
  
  try {
    const result = await executeLegalCounselTransform(request, apiKey, baseUrl)
    
    return c.json({
      success: result.success,
      transformedChanges: result.transformedChanges,
      legalSummary: result.legalSummary,
      riskWarnings: result.riskWarnings,
      clauseRecommendations: result.clauseRecommendations,
      processingTime: result.processingTime
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Legal transform failed: ' + (error as Error).message 
    }, 500)
  }
})

/**
 * 确认并应用选中的修改
 * 用户在前端勾选确认后调用此API应用修改
 */
app.post('/api/agents/smart-change/confirm', async (c) => {
  const { 
    projectId,
    confirmedPrimaryChanges,
    confirmedInferredChanges,
    originalMessage,
    perspective
  } = await c.req.json()
  
  // 合并所有确认的修改
  const allConfirmedChanges = [
    ...(confirmedPrimaryChanges || []),
    ...(confirmedInferredChanges || [])
  ]
  
  if (allConfirmedChanges.length === 0) {
    return c.json({ 
      success: false, 
      message: '没有选中任何修改'
    })
  }
  
  // 构建协商记录
  const negotiation = {
    id: 'neg_' + Date.now(),
    input: originalMessage,
    understood: `已确认 ${confirmedPrimaryChanges?.length || 0} 项直接修改，${confirmedInferredChanges?.length || 0} 项联动修改`,
    changes: allConfirmedChanges.map((c: SmartChange) => ({
      paramKey: c.key,
      paramName: c.paramName,
      oldValue: c.oldValue,
      newValue: c.newValue,
      clauseText: c.clauseText,
      changeType: c.changeType,
      confidence: c.confidence,
      reason: c.reason
    })),
    perspective,
    timestamp: new Date().toISOString(),
    smartChangeMode: true // 标记为智能联动模式
  }
  
  return c.json({
    success: true,
    negotiation,
    appliedChanges: allConfirmedChanges,
    message: `成功应用 ${allConfirmedChanges.length} 项修改`
  })
})

// AI解析自然语言变动（保留原API兼容性）
app.post('/api/parse-change', async (c) => {
  const { message, templateId, currentParams } = await c.req.json()
  
  const { apiKey, baseUrl: _ } = getAIConfig(c)
  const baseUrl = c.env?.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
  
  const template = industryTemplates[templateId]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  const systemPrompt = `你是一个专业的收益分成合作协商助手。用户会用自然语言描述项目条款的变动，你需要：

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
  "understood": "用一句完整通顺的中文复述您理解的变动内容",
  "changes": [
    {
      "moduleId": "模块ID",
      "moduleName": "模块名称",
      "paramKey": "参数key",
      "paramName": "参数名称",
      "oldValue": "原值",
      "newValue": "新值",
      "clauseText": "用正式、完整的合同条款语言描述变更，至少15字，主谓宾齐全"
    }
  ],
  "suggestion": "从双方利益角度提出的完整建议句子（可选）"
}

## 语言要求
- understood必须是完整通顺的中文句子，如"投资方希望将联营资金从500万元提高至800万元"
- clauseText必须是可以直接写入合同的正式条款语言，完整句子
- suggestion必须是完整通顺的中文句子
- 所有文本严禁出现断句、语病或碎片化表述

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
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
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

// ==================== AI智能助手API ====================
// 对程序功能有完整了解的AI助手，接入大模型支持自由聊天

const AI_ASSISTANT_SYSTEM_PROMPT = `你是"合约通 Contract Connect"的AI智能助手，名叫"小通"。你对这个平台非常了解，可以帮助用户解答使用问题，也可以进行友好的自由对话。

## 关于这个平台

### 平台简介
这是一个专业的收益分成合作协议协商平台（基于 Revenue-Based Financing 模式），帮助合作各方在线协商合同条款、项目协作、版本管理和智能签署。

### 核心功能模块

1. **个人账户系统** 👤
   - 支持注册/登录，也可使用游客模式体验
   - 个人主页展示统计数据
   - 可切换角色视角：作为融资方或投资方
   - 融资方可查看自己发起的项目
   - 投资方可查看被邀请参与的项目

2. **行业模板** 🏭
   - 内置5个行业模板：演唱会/娱乐、餐饮连锁、零售门店、医美诊所、教育培训
   - 每个模板包含该行业常用的合同条款和参数
   - 支持自定义模板，可以复制系统模板进行修改

3. **合同协商** 📝
   - 使用自然语言描述条款变更，如"把投资金额改为600万"
   - AI自动解析并更新合同条款
   - 支持投资方/融资方双视角切换
   - 实时记录协商历史

4. **协作功能** 👥
   - 生成邀请链接，邀请对方加入协商
   - 支持多方实时协作
   - 可设置协作者权限（编辑、评论、只读）

5. **版本管理** 📚
   - 创建版本快照，保存重要节点
   - 支持版本对比，查看差异
   - 可回退到历史版本

6. **电子签章** ✍️
   - 发起签署流程
   - 手写签名功能
   - 短信验证码验证
   - 签署状态跟踪

7. **AI谈判助手** 🤖
   - 谈判建议：分析当前态势，提供策略建议
   - 风险评估：多维度评估合同风险
   - 市场对标：与行业标准对比分析

### 使用流程

1. **新用户**：注册账号 → 登录 → 查看教程 → 创建项目
2. **创建项目**：点击"新建项目" → 输入项目名称 → 选择行业模板 → 创建
3. **协商条款**：进入项目 → 用自然语言描述变更 → AI解析并更新
4. **邀请协作**：点击"协作"按钮 → 生成邀请链接 → 发送给对方
5. **签署合同**：协商完成 → 点击"签署" → 填写签署人信息 → 手写签名 → 完成

### 常见问题

Q: 如何修改合同条款？
A: 进入项目后，在输入框中用自然语言描述变更，如"投资金额改为500万"、"分成比例降低到10%"，系统会自动解析并更新。

Q: 如何邀请对方协商？
A: 在项目协商页面，点击工具栏的"协作"按钮，选择对方角色，生成邀请链接后发送给对方。

Q: 数据存储在哪里？
A: 目前数据存储在浏览器本地（localStorage），支持导出备份。云端同步功能即将上线。

Q: 可以自定义模板吗？
A: 可以。点击"模板管理"，可以创建新模板或复制系统模板进行修改。

## 你的角色

1. 热情友好，用简洁清晰的语言回答
2. 对平台功能了如指掌，能准确解答使用问题
3. 如果用户问的不是平台相关问题，也可以友好地聊天
4. 回答要简洁，一般不超过150字，除非用户要求详细说明
5. 适当使用emoji让对话更生动 😊

## 回复格式
直接用中文回复，不需要任何格式标记。`

// AI助手聊天API
app.post('/api/ai/chat', async (c) => {
  const { messages } = await c.req.json()
  
  const { apiKey, baseUrl } = getAIConfig(c)
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      message: '抱歉，AI服务暂时不可用，请稍后再试~' 
    }, 500)
  }
  
  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        messages: [
          { role: 'system', content: AI_ASSISTANT_SYSTEM_PROMPT },
          ...messages.slice(-10) // 保留最近10条对话历史
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      return c.json({ 
        success: false, 
        message: '网络繁忙，请稍后再试~' 
      }, 500)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '抱歉，我没有理解您的问题，请换个方式问问？'
    
    return c.json({
      success: true,
      message: content
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: '服务暂时不可用，请稍后再试~' 
    }, 500)
  }
})

// ==================== 主页面 ====================
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>合约通 Contract Connect</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <!-- DNS预解析加速 -->
  <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- FontAwesome -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <!-- Google Fonts - Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <!-- 现代化UI优化样式 -->
  <link href="/static/style.css" rel="stylesheet">
  <!-- 应用特定样式 - 精简版 -->
  <style>
    /* Base Reset & Fallback Styles */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; line-height: 1.5; background: #f5f5f7; color: #1d1d1f; }
    .hidden { display: none !important; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .space-x-2 > * + * { margin-left: 0.5rem; }
    .space-x-3 > * + * { margin-left: 0.75rem; }
    .space-x-4 > * + * { margin-left: 1rem; }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .grid { display: grid; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .min-h-screen { min-height: 100vh; }
    .max-w-md { max-width: 28rem; }
    .max-w-lg { max-width: 32rem; }
    .max-w-xl { max-width: 36rem; }
    .max-w-2xl { max-width: 42rem; }
    .max-w-4xl { max-width: 56rem; }
    .max-w-6xl { max-width: 72rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .mx-4 { margin-left: 1rem; margin-right: 1rem; }
    .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-5 { padding: 1.25rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .mr-1 { margin-right: 0.25rem; }
    .mr-2 { margin-right: 0.5rem; }
    .mr-3 { margin-right: 0.75rem; }
    .ml-2 { margin-left: 0.5rem; }
    .ml-3 { margin-left: 0.75rem; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-base { font-size: 1rem; }
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-3xl { font-size: 1.875rem; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-center { text-align: center; }
    .text-white { color: #fff; }
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-700 { color: #374151; }
    .text-gray-800 { color: #1f2937; }
    .text-gray-900 { color: #111827; }
    .text-teal-600 { color: #49A89A; }
    .text-teal-700 { color: #4338ca; }
    .text-emerald-600 { color: #059669; }
    .text-amber-600 { color: #d97706; }
    .text-red-500 { color: #ef4444; }
    .text-red-600 { color: #dc2626; }
    .bg-white { background-color: #fff; }
    .bg-gray-50 { background-color: #f9fafb; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .bg-gray-200 { background-color: #e5e7eb; }
    .bg-teal-50 { background-color: #F0FDFA; }
    .bg-teal-100 { background-color: #CCFBF1; }
    .bg-teal-500 { background-color: #5DC4B3; }
    .bg-teal-600 { background-color: #49A89A; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .bg-emerald-100 { background-color: #d1fae5; }
    .bg-emerald-500 { background-color: #10b981; }
    .bg-emerald-600 { background-color: #059669; }
    .bg-amber-50 { background-color: #fffbeb; }
    .bg-amber-100 { background-color: #fef3c7; }
    .bg-amber-500 { background-color: #f59e0b; }
    .bg-red-50 { background-color: #fef2f2; }
    .bg-red-100 { background-color: #fee2e2; }
    .bg-red-500 { background-color: #ef4444; }
    .bg-red-600 { background-color: #dc2626; }
    .bg-cyan-50 { background-color: #faf5ff; }
    .bg-cyan-100 { background-color: #f3e8ff; }
    .bg-cyan-500 { background-color: #0D9488; }
    .bg-cyan-600 { background-color: #0D9488; }
    .bg-rose-50 { background-color: #fff1f2; }
    .bg-rose-100 { background-color: #ffe4e6; }
    .bg-rose-600 { background-color: #e11d48; }
    .bg-orange-50 { background-color: #fff7ed; }
    .bg-orange-100 { background-color: #ffedd5; }
    .bg-orange-600 { background-color: #ea580c; }
    .bg-teal-50 { background-color: #f0fdfa; }
    .bg-teal-100 { background-color: #ccfbf1; }
    .bg-teal-600 { background-color: #0d9488; }
    .bg-cyan-100 { background-color: #cffafe; }
    .border { border-width: 1px; border-style: solid; }
    .border-2 { border-width: 2px; }
    .border-t { border-top-width: 1px; }
    .border-b { border-bottom-width: 1px; }
    .border-gray-100 { border-color: #f3f4f6; }
    .border-gray-200 { border-color: #e5e7eb; }
    .border-gray-300 { border-color: #d1d5db; }
    .border-teal-200 { border-color: #99F6E4; }
    .border-teal-500 { border-color: #5DC4B3; }
    .border-emerald-200 { border-color: #a7f3d0; }
    .border-amber-200 { border-color: #fde68a; }
    .border-rose-200 { border-color: #fecdd3; }
    .border-orange-200 { border-color: #fed7aa; }
    .border-cyan-200 { border-color: #CCFBF1; }
    .rounded { border-radius: 0.25rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-2xl { border-radius: 1rem; }
    .rounded-full { border-radius: 9999px; }
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .shadow-md { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .shadow-lg { box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
    .shadow-xl { box-shadow: 0 20px 25px rgba(0,0,0,0.1); }
    .overflow-hidden { overflow: hidden; }
    .overflow-y-auto { overflow-y: auto; }
    .cursor-pointer { cursor: pointer; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .fixed { position: fixed; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .top-0 { top: 0; }
    .right-0 { right: 0; }
    .bottom-0 { bottom: 0; }
    .left-0 { left: 0; }
    .z-50 { z-index: 50; }
    .opacity-0 { opacity: 0; }
    .opacity-50 { opacity: 0.5; }
    .transition { transition: all 0.15s ease; }
    .transition-all { transition: all 0.15s ease; }
    .transition-colors { transition: color 0.15s ease, background-color 0.15s ease; }
    .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
    .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
    .hover\\:bg-teal-50:hover { background-color: #F0FDFA; }
    .hover\\:bg-teal-700:hover { background-color: #4338ca; }
    .hover\\:bg-emerald-700:hover { background-color: #047857; }
    .hover\\:bg-red-50:hover { background-color: #fef2f2; }
    .hover\\:bg-red-700:hover { background-color: #b91c1c; }
    .hover\\:text-teal-600:hover { color: #49A89A; }
    .hover\\:text-red-500:hover { color: #ef4444; }
    .group:hover .group-hover\\:opacity-100 { opacity: 1; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    input, textarea, select { font-family: inherit; font-size: 1rem; }
    input[type="checkbox"], input[type="radio"] { width: auto; padding: 0; border: none; background: transparent; box-shadow: none !important; flex-shrink: 0; }
    input:focus, textarea:focus, select:focus { outline: none; box-shadow: 0 0 0 2px rgba(93, 196, 179, 0.5); }
    input[type="checkbox"]:focus, input[type="radio"]:focus { box-shadow: none !important; transform: none; }
    button { cursor: pointer; font-family: inherit; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    /* Grid responsive */
    @media (min-width: 640px) { .sm\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 768px) { .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1024px) { .lg\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); } }
    /* Flex wrap */
    .flex-wrap { flex-wrap: wrap; }
    .flex-1 { flex: 1 1 0%; }
    .shrink-0 { flex-shrink: 0; }
    /* Additional utility classes */
    .w-8 { width: 2rem; }
    .w-10 { width: 2.5rem; }
    .w-12 { width: 3rem; }
    .w-16 { width: 4rem; }
    .h-8 { height: 2rem; }
    .h-10 { height: 2.5rem; }
    .h-12 { height: 3rem; }
    .h-16 { height: 4rem; }
    .max-h-\\[90vh\\] { max-height: 90vh; }
    .max-h-\\[70vh\\] { max-height: 70vh; }
    .bg-black { background-color: #000; }
    .bg-opacity-50 { background-color: rgba(0,0,0,0.5); }
    
    /* ============================================================
       完整颜色系统 - 基于实际使用分析生成
       ============================================================ */
    
    /* Gray Scale */
    .text-gray-300 { color: #d1d5db; }
    .bg-gray-300 { background-color: #d1d5db; }
    .bg-gray-400 { background-color: #9ca3af; }
    .bg-gray-800 { background-color: #1f2937; }
    .border-gray-400 { border-color: #9ca3af; }
    .border-gray-500 { border-color: #6b7280; }
    .border-gray-50 { border-color: #f9fafb; }
    
    /* Indigo Extended */
    .text-teal-300 { color: #a5b4fc; }
    .text-teal-500 { color: #5DC4B3; }
    .text-teal-800 { color: #3730a3; }
    .text-teal-900 { color: #312e81; }
    .bg-teal-200 { background-color: #99F6E4; }
    .bg-teal-700 { background-color: #4338ca; }
    .border-teal-100 { border-color: #CCFBF1; }
    .border-teal-300 { border-color: #a5b4fc; }
    .border-teal-600 { border-color: #49A89A; }
    
    /* Emerald Extended */
    .text-emerald-400 { color: #34d399; }
    .text-emerald-500 { color: #10b981; }
    .text-emerald-700 { color: #047857; }
    .text-emerald-800 { color: #065f46; }
    .text-emerald-900 { color: #064e3b; }
    .bg-emerald-200 { background-color: #a7f3d0; }
    .bg-emerald-400 { background-color: #34d399; }
    .bg-emerald-700 { background-color: #047857; }
    .border-emerald-100 { border-color: #d1fae5; }
    .border-emerald-300 { border-color: #6ee7b7; }
    .border-emerald-500 { border-color: #10b981; }
    .border-emerald-600 { border-color: #059669; }
    
    /* Amber Extended */
    .text-amber-500 { color: #f59e0b; }
    .text-amber-700 { color: #b45309; }
    .text-amber-800 { color: #92400e; }
    .text-amber-900 { color: #78350f; }
    .bg-amber-600 { background-color: #d97706; }
    .bg-amber-700 { background-color: #b45309; }
    .border-amber-100 { border-color: #fef3c7; }
    .border-amber-300 { border-color: #fcd34d; }
    .border-amber-500 { border-color: #f59e0b; }
    .border-amber-600 { border-color: #d97706; }
    
    /* Red Extended */
    .text-red-300 { color: #fca5a5; }
    .text-red-400 { color: #f87171; }
    .text-red-700 { color: #b91c1c; }
    .text-red-800 { color: #991b1b; }
    .text-red-900 { color: #7f1d1d; }
    .bg-red-700 { background-color: #b91c1c; }
    .border-red-100 { border-color: #fee2e2; }
    .border-red-200 { border-color: #fecaca; }
    
    /* Purple Extended */
    .text-cyan-500 { color: #0D9488; }
    .text-cyan-700 { color: #7e22ce; }
    .text-cyan-800 { color: #6b21a8; }
    .text-cyan-900 { color: #581c87; }
    .bg-cyan-700 { background-color: #7e22ce; }
    .border-cyan-100 { border-color: #f3e8ff; }
    .border-cyan-600 { border-color: #0D9488; }
    
    /* Blue Extended */
    .text-blue-500 { color: #3b82f6; }
    .text-blue-600 { color: #2563eb; }
    .text-blue-700 { color: #1d4ed8; }
    .text-blue-900 { color: #1e3a8a; }
    .bg-blue-50 { background-color: #eff6ff; }
    .bg-blue-100 { background-color: #dbeafe; }
    .bg-blue-500 { background-color: #3b82f6; }
    .border-blue-200 { border-color: #bfdbfe; }
    
    /* Rose Extended */
    .text-rose-500 { color: #f43f5e; }
    .text-rose-600 { color: #e11d48; }
    .text-rose-700 { color: #be123c; }
    .text-rose-900 { color: #881337; }
    .bg-rose-500 { background-color: #f43f5e; }
    .bg-rose-700 { background-color: #be123c; }
    
    /* Orange Extended */
    .text-orange-600 { color: #ea580c; }
    .text-orange-700 { color: #c2410c; }
    .text-orange-900 { color: #7c2d12; }
    .bg-orange-700 { background-color: #c2410c; }
    
    /* Pink Extended */
    .text-pink-500 { color: #ec4899; }
    .text-pink-600 { color: #db2777; }
    .bg-pink-50 { background-color: #fdf2f8; }
    .bg-pink-100 { background-color: #fce7f3; }
    
    /* Teal Extended */
    .text-teal-600 { color: #0d9488; }
    .text-teal-900 { color: #134e4a; }
    .bg-teal-700 { background-color: #0f766e; }
    
    /* Violet Extended */
    .text-violet-600 { color: #3D8F83; }
    .text-violet-700 { color: #6d28d9; }
    .text-violet-800 { color: #5b21b6; }
    .bg-violet-50 { background-color: #F0FDFA; }
    .bg-violet-100 { background-color: #F0FDFA; }
    .border-violet-100 { border-color: #F0FDFA; }
    .border-violet-200 { border-color: #CCFBF1; }
    .border-violet-400 { border-color: #7DD4C7; }
    
    /* Cyan Extended */
    .bg-cyan-500 { background-color: #06b6d4; }
    .border-cyan-600 { border-color: #0891b2; }
    
    /* Slate Extended */
    .text-slate-700 { color: #334155; }
    .text-slate-900 { color: #0f172a; }
    .bg-slate-50 { background-color: #f8fafc; }
    .border-slate-200 { border-color: #e2e8f0; }
    
    /* ============================================================
       补充布局和交互类
       ============================================================ */
    
    /* Additional spacing */
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-5 { gap: 1.25rem; }
    .gap-8 { gap: 2rem; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .space-y-8 > * + * { margin-top: 2rem; }
    .space-x-1 > * + * { margin-left: 0.25rem; }
    .space-x-6 > * + * { margin-left: 1.5rem; }
    
    /* Additional padding/margin */
    .p-1 { padding: 0.25rem; }
    .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
    .px-8 { padding-left: 2rem; padding-right: 2rem; }
    .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
    .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .pt-4 { padding-top: 1rem; }
    .pt-6 { padding-top: 1.5rem; }
    .pb-4 { padding-bottom: 1rem; }
    .pb-6 { padding-bottom: 1.5rem; }
    .pl-4 { padding-left: 1rem; }
    .pl-6 { padding-left: 1.5rem; }
    .pr-4 { padding-right: 1rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-8 { margin-top: 2rem; }
    .mb-8 { margin-bottom: 2rem; }
    .ml-1 { margin-left: 0.25rem; }
    .ml-4 { margin-left: 1rem; }
    .mr-4 { margin-right: 1rem; }
    .-mt-1 { margin-top: -0.25rem; }
    .-mt-2 { margin-top: -0.5rem; }
    .-ml-1 { margin-left: -0.25rem; }
    .-mr-1 { margin-right: -0.25rem; }
    
    /* Additional widths/heights */
    .w-1 { width: 0.25rem; }
    .w-2 { width: 0.5rem; }
    .w-3 { width: 0.75rem; }
    .w-4 { width: 1rem; }
    .w-5 { width: 1.25rem; }
    .w-6 { width: 1.5rem; }
    .w-7 { width: 1.75rem; }
    .w-14 { width: 3.5rem; }
    .w-20 { width: 5rem; }
    .w-24 { width: 6rem; }
    .w-32 { width: 8rem; }
    .w-40 { width: 10rem; }
    .w-48 { width: 12rem; }
    .w-64 { width: 16rem; }
    .w-auto { width: auto; }
    .h-1 { height: 0.25rem; }
    .h-2 { height: 0.5rem; }
    .h-3 { height: 0.75rem; }
    .h-4 { height: 1rem; }
    .h-5 { height: 1.25rem; }
    .h-6 { height: 1.5rem; }
    .h-7 { height: 1.75rem; }
    .h-14 { height: 3.5rem; }
    .h-20 { height: 5rem; }
    .h-24 { height: 6rem; }
    .h-32 { height: 8rem; }
    .h-40 { height: 10rem; }
    .h-48 { height: 12rem; }
    .h-64 { height: 16rem; }
    .h-auto { height: auto; }
    .min-w-0 { min-width: 0; }
    .min-w-\\[200px\\] { min-width: 200px; }
    .min-h-\\[200px\\] { min-height: 200px; }
    .max-w-xs { max-width: 20rem; }
    .max-w-sm { max-width: 24rem; }
    .max-w-3xl { max-width: 48rem; }
    .max-w-5xl { max-width: 64rem; }
    .max-w-7xl { max-width: 80rem; }
    .max-w-full { max-width: 100%; }
    .max-h-60 { max-height: 15rem; }
    .max-h-96 { max-height: 24rem; }
    .max-h-\\[60vh\\] { max-height: 60vh; }
    .max-h-\\[80vh\\] { max-height: 80vh; }
    
    /* Additional border styles */
    .border-l { border-left-width: 1px; }
    .border-r { border-right-width: 1px; }
    .border-l-2 { border-left-width: 2px; }
    .border-l-4 { border-left-width: 4px; }
    .border-t-2 { border-top-width: 2px; }
    .border-b-2 { border-bottom-width: 2px; }
    .border-0 { border-width: 0; }
    .border-transparent { border-color: transparent; }
    .rounded-md { border-radius: 0.375rem; }
    .rounded-3xl { border-radius: 1.5rem; }
    .rounded-t-xl { border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; }
    .rounded-b-xl { border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; }
    .rounded-l-xl { border-top-left-radius: 0.75rem; border-bottom-left-radius: 0.75rem; }
    .rounded-r-xl { border-top-right-radius: 0.75rem; border-bottom-right-radius: 0.75rem; }
    
    /* Additional text styles */
    .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
    .text-5xl { font-size: 3rem; line-height: 1; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .lowercase { text-transform: lowercase; }
    .capitalize { text-transform: capitalize; }
    .tracking-wide { letter-spacing: 0.025em; }
    .tracking-wider { letter-spacing: 0.05em; }
    .leading-none { line-height: 1; }
    .leading-tight { line-height: 1.25; }
    .leading-snug { line-height: 1.375; }
    .leading-normal { line-height: 1.5; }
    .leading-relaxed { line-height: 1.625; }
    .leading-loose { line-height: 2; }
    .underline { text-decoration: underline; }
    .line-through { text-decoration: line-through; }
    .no-underline { text-decoration: none; }
    .whitespace-nowrap { white-space: nowrap; }
    .whitespace-pre-wrap { white-space: pre-wrap; }
    .break-words { word-wrap: break-word; overflow-wrap: break-word; }
    .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    
    /* Additional flex/grid */
    .inline-flex { display: inline-flex; }
    .inline-block { display: inline-block; }
    .block { display: block; }
    .flex-row { flex-direction: row; }
    .flex-row-reverse { flex-direction: row-reverse; }
    .flex-col-reverse { flex-direction: column-reverse; }
    .flex-grow { flex-grow: 1; }
    .flex-grow-0 { flex-grow: 0; }
    .flex-shrink { flex-shrink: 1; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-auto { flex: 1 1 auto; }
    .flex-initial { flex: 0 1 auto; }
    .flex-none { flex: none; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .items-baseline { align-items: baseline; }
    .items-stretch { align-items: stretch; }
    .justify-start { justify-content: flex-start; }
    .justify-end { justify-content: flex-end; }
    .justify-around { justify-content: space-around; }
    .justify-evenly { justify-content: space-evenly; }
    .self-start { align-self: flex-start; }
    .self-end { align-self: flex-end; }
    .self-center { align-self: center; }
    .content-center { align-content: center; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .col-span-1 { grid-column: span 1 / span 1; }
    .col-span-2 { grid-column: span 2 / span 2; }
    .col-span-3 { grid-column: span 3 / span 3; }
    .col-span-full { grid-column: 1 / -1; }
    .row-span-2 { grid-row: span 2 / span 2; }
    
    /* Additional positioning */
    .static { position: static; }
    .sticky { position: sticky; }
    .top-1 { top: 0.25rem; }
    .top-2 { top: 0.5rem; }
    .top-4 { top: 1rem; }
    .top-full { top: 100%; }
    .right-1 { right: 0.25rem; }
    .right-2 { right: 0.5rem; }
    .right-4 { right: 1rem; }
    .bottom-2 { bottom: 0.5rem; }
    .bottom-4 { bottom: 1rem; }
    .left-1 { left: 0.25rem; }
    .left-2 { left: 0.5rem; }
    .left-4 { left: 1rem; }
    .-top-1 { top: -0.25rem; }
    .-top-2 { top: -0.5rem; }
    .-right-1 { right: -0.25rem; }
    .-right-2 { right: -0.5rem; }
    .z-0 { z-index: 0; }
    .z-10 { z-index: 10; }
    .z-20 { z-index: 20; }
    .z-30 { z-index: 30; }
    .z-40 { z-index: 40; }
    .z-\\[100\\] { z-index: 100; }
    .z-\\[200\\] { z-index: 200; }
    .z-\\[300\\] { z-index: 300; }
    .z-\\[400\\] { z-index: 400; }
    .z-\\[500\\] { z-index: 500; }
    .z-\\[900\\] { z-index: 900; }
    .z-\\[999\\] { z-index: 999; }
    .z-\\[9999\\] { z-index: 9999; }
    
    /* Additional backgrounds */
    .bg-transparent { background-color: transparent; }
    .bg-current { background-color: currentColor; }
    .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
    .bg-gradient-to-l { background-image: linear-gradient(to left, var(--tw-gradient-stops)); }
    .bg-gradient-to-t { background-image: linear-gradient(to top, var(--tw-gradient-stops)); }
    .bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-stops)); }
    .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
    .bg-gradient-to-tr { background-image: linear-gradient(to top right, var(--tw-gradient-stops)); }
    .bg-gradient-to-bl { background-image: linear-gradient(to bottom left, var(--tw-gradient-stops)); }
    .bg-gradient-to-tl { background-image: linear-gradient(to top left, var(--tw-gradient-stops)); }
    .from-teal-500 { --tw-gradient-from: #5DC4B3; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
    .from-teal-600 { --tw-gradient-from: #49A89A; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
    .from-cyan-500 { --tw-gradient-from: #0D9488; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
    .from-cyan-600 { --tw-gradient-from: #0D9488; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
    .from-emerald-500 { --tw-gradient-from: #10b981; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
    .from-amber-500 { --tw-gradient-from: #f59e0b; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
    .from-rose-500 { --tw-gradient-from: #f43f5e; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
    .via-cyan-500 { --tw-gradient-stops: var(--tw-gradient-from), #0D9488, var(--tw-gradient-to, transparent); }
    .via-teal-500 { --tw-gradient-stops: var(--tw-gradient-from), #5DC4B3, var(--tw-gradient-to, transparent); }
    .via-pink-500 { --tw-gradient-stops: var(--tw-gradient-from), #ec4899, var(--tw-gradient-to, transparent); }
    .to-teal-600 { --tw-gradient-to: #49A89A; }
    .to-teal-700 { --tw-gradient-to: #4338ca; }
    .to-cyan-600 { --tw-gradient-to: #0D9488; }
    .to-cyan-700 { --tw-gradient-to: #7e22ce; }
    .to-pink-500 { --tw-gradient-to: #ec4899; }
    .to-pink-600 { --tw-gradient-to: #db2777; }
    .to-emerald-600 { --tw-gradient-to: #059669; }
    .to-amber-600 { --tw-gradient-to: #d97706; }
    .to-rose-600 { --tw-gradient-to: #e11d48; }
    .to-transparent { --tw-gradient-to: transparent; }
    .bg-black\\/60, .bg-black\\/50 { background-color: rgba(0, 0, 0, 0.5); }
    .bg-white\\/50 { background-color: rgba(255, 255, 255, 0.5); }
    .bg-white\\/80 { background-color: rgba(255, 255, 255, 0.8); }
    .bg-white\\/90 { background-color: rgba(255, 255, 255, 0.9); }
    
    /* Additional effects */
    .opacity-100 { opacity: 1; }
    .opacity-75 { opacity: 0.75; }
    .opacity-60 { opacity: 0.6; }
    .opacity-70 { opacity: 0.7; }
    .opacity-80 { opacity: 0.8; }
    .opacity-90 { opacity: 0.9; }
    .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
    .shadow-none { box-shadow: none; }
    .ring-1 { box-shadow: 0 0 0 1px var(--tw-ring-color, rgba(93, 196, 179, 0.5)); }
    .ring-2 { box-shadow: 0 0 0 2px var(--tw-ring-color, rgba(93, 196, 179, 0.5)); }
    .ring-teal-500 { --tw-ring-color: #5DC4B3; }
    .ring-offset-2 { --tw-ring-offset-width: 2px; }
    .backdrop-blur-sm { backdrop-filter: blur(4px); }
    .backdrop-blur { backdrop-filter: blur(8px); }
    .backdrop-blur-md { backdrop-filter: blur(12px); }
    .backdrop-blur-lg { backdrop-filter: blur(16px); }
    .blur-sm { filter: blur(4px); }
    .blur { filter: blur(8px); }
    .brightness-95 { filter: brightness(0.95); }
    .brightness-105 { filter: brightness(1.05); }
    .grayscale { filter: grayscale(100%); }
    
    /* Additional interactions */
    .pointer-events-none { pointer-events: none; }
    .pointer-events-auto { pointer-events: auto; }
    .select-none { user-select: none; }
    .select-text { user-select: text; }
    .select-all { user-select: all; }
    .resize-none { resize: none; }
    .resize-y { resize: vertical; }
    .resize-x { resize: horizontal; }
    .resize { resize: both; }
    .outline-none { outline: 2px solid transparent; outline-offset: 2px; }
    .outline { outline-style: solid; }
    .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
    .focus\\:ring-2:focus { box-shadow: 0 0 0 2px var(--tw-ring-color, rgba(93, 196, 179, 0.5)); }
    .focus\\:ring-teal-500:focus { --tw-ring-color: #5DC4B3; }
    .focus\\:border-teal-500:focus { border-color: #5DC4B3; }
    
    /* Additional hover states */
    .hover\\:bg-gray-200:hover { background-color: #e5e7eb; }
    .hover\\:bg-teal-100:hover { background-color: #CCFBF1; }
    .hover\\:bg-teal-600:hover { background-color: #49A89A; }
    .hover\\:bg-teal-800:hover { background-color: #3730a3; }
    .hover\\:bg-emerald-50:hover { background-color: #ecfdf5; }
    .hover\\:bg-emerald-100:hover { background-color: #d1fae5; }
    .hover\\:bg-emerald-600:hover { background-color: #059669; }
    .hover\\:bg-emerald-800:hover { background-color: #065f46; }
    .hover\\:bg-amber-50:hover { background-color: #fffbeb; }
    .hover\\:bg-amber-100:hover { background-color: #fef3c7; }
    .hover\\:bg-rose-50:hover { background-color: #fff1f2; }
    .hover\\:bg-rose-100:hover { background-color: #ffe4e6; }
    .hover\\:bg-cyan-50:hover { background-color: #faf5ff; }
    .hover\\:bg-cyan-100:hover { background-color: #f3e8ff; }
    .hover\\:text-gray-600:hover { color: #4b5563; }
    .hover\\:text-gray-700:hover { color: #374151; }
    .hover\\:text-gray-800:hover { color: #1f2937; }
    .hover\\:text-gray-900:hover { color: #111827; }
    .hover\\:text-teal-700:hover { color: #4338ca; }
    .hover\\:text-teal-800:hover { color: #3730a3; }
    .hover\\:text-emerald-700:hover { color: #047857; }
    .hover\\:text-red-600:hover { color: #dc2626; }
    .hover\\:text-red-700:hover { color: #b91c1c; }
    .hover\\:text-white:hover { color: #fff; }
    .hover\\:border-teal-300:hover { border-color: #a5b4fc; }
    .hover\\:border-teal-500:hover { border-color: #5DC4B3; }
    .hover\\:border-gray-300:hover { border-color: #d1d5db; }
    .hover\\:shadow-md:hover { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
    .hover\\:scale-105:hover { transform: scale(1.05); }
    .hover\\:scale-110:hover { transform: scale(1.1); }
    .hover\\:-translate-y-1:hover { transform: translateY(-0.25rem); }
    .hover\\:opacity-100:hover { opacity: 1; }
    
    /* Additional transforms */
    .transform { transform: translateX(var(--tw-translate-x, 0)) translateY(var(--tw-translate-y, 0)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1)); }
    .scale-95 { transform: scale(0.95); }
    .scale-100 { transform: scale(1); }
    .scale-105 { transform: scale(1.05); }
    .scale-110 { transform: scale(1.1); }
    .scale-125 { transform: scale(1.25); }
    .scale-150 { transform: scale(1.5); }
    .rotate-45 { transform: rotate(45deg); }
    .rotate-90 { transform: rotate(90deg); }
    .rotate-180 { transform: rotate(180deg); }
    .-rotate-45 { transform: rotate(-45deg); }
    .-rotate-90 { transform: rotate(-90deg); }
    .translate-x-0 { transform: translateX(0); }
    .translate-x-1 { transform: translateX(0.25rem); }
    .translate-x-2 { transform: translateX(0.5rem); }
    .translate-y-0 { transform: translateY(0); }
    .translate-y-1 { transform: translateY(0.25rem); }
    .translate-y-2 { transform: translateY(0.5rem); }
    .-translate-x-1 { transform: translateX(-0.25rem); }
    .-translate-x-1\\/2 { transform: translateX(-50%); }
    .-translate-y-1 { transform: translateY(-0.25rem); }
    .-translate-y-1\\/2 { transform: translateY(-50%); }
    .origin-center { transform-origin: center; }
    .origin-top { transform-origin: top; }
    .origin-bottom { transform-origin: bottom; }
    
    /* Additional transitions/animations */
    .transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .transition-shadow { transition-property: box-shadow; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .duration-75 { transition-duration: 75ms; }
    .duration-100 { transition-duration: 100ms; }
    .duration-150 { transition-duration: 150ms; }
    .duration-200 { transition-duration: 200ms; }
    .duration-300 { transition-duration: 300ms; }
    .duration-500 { transition-duration: 500ms; }
    .ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
    .ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    .ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
    .animate-spin { animation: spin 1s linear infinite; }
    .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .animate-bounce { animation: bounce 1s infinite; }
    @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
    @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); } }
    
    /* Additional overflow */
    .overflow-x-auto { overflow-x: auto; }
    .overflow-x-hidden { overflow-x: hidden; }
    .overflow-y-hidden { overflow-y: hidden; }
    .overflow-visible { overflow: visible; }
    .overflow-scroll { overflow: scroll; }
    
    /* Additional display */
    .invisible { visibility: hidden; }
    .visible { visibility: visible; }
    .collapse { visibility: collapse; }
    
    /* Group hover */
    .group:hover .group-hover\\:visible { visibility: visible; }
    .group:hover .group-hover\\:block { display: block; }
    .group:hover .group-hover\\:flex { display: flex; }
    .group:hover .group-hover\\:bg-gray-50 { background-color: #f9fafb; }
    .group:hover .group-hover\\:bg-teal-50 { background-color: #F0FDFA; }
    .group:hover .group-hover\\:text-teal-600 { color: #49A89A; }
    .group:hover .group-hover\\:scale-105 { transform: scale(1.05); }
    .group:hover .group-hover\\:translate-x-1 { transform: translateX(0.25rem); }
    
    /* Responsive variants */
    @media (min-width: 640px) {
      .sm\\:flex { display: flex; }
      .sm\\:hidden { display: none; }
      .sm\\:block { display: block; }
      .sm\\:inline-flex { display: inline-flex; }
      .sm\\:w-auto { width: auto; }
      .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
      .sm\\:py-4 { padding-top: 1rem; padding-bottom: 1rem; }
      .sm\\:text-sm { font-size: 0.875rem; }
      .sm\\:text-base { font-size: 1rem; }
      .sm\\:text-lg { font-size: 1.125rem; }
      .sm\\:text-xl { font-size: 1.25rem; }
      .sm\\:flex-row { flex-direction: row; }
      .sm\\:items-center { align-items: center; }
      .sm\\:justify-between { justify-content: space-between; }
      .sm\\:space-x-4 > * + * { margin-left: 1rem; }
      .sm\\:gap-4 { gap: 1rem; }
    }
    @media (min-width: 768px) {
      .md\\:flex { display: flex; }
      .md\\:hidden { display: none; }
      .md\\:block { display: block; }
      .md\\:w-auto { width: auto; }
      .md\\:w-1\\/2 { width: 50%; }
      .md\\:w-1\\/3 { width: 33.333333%; }
      .md\\:w-2\\/3 { width: 66.666667%; }
      .md\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
      .md\\:py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
      .md\\:text-lg { font-size: 1.125rem; }
      .md\\:text-xl { font-size: 1.25rem; }
      .md\\:text-2xl { font-size: 1.5rem; }
      .md\\:text-3xl { font-size: 1.875rem; }
      .md\\:flex-row { flex-direction: row; }
      .md\\:items-center { align-items: center; }
      .md\\:justify-between { justify-content: space-between; }
      .md\\:space-x-6 > * + * { margin-left: 1.5rem; }
      .md\\:gap-6 { gap: 1.5rem; }
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .lg\\:flex { display: flex; }
      .lg\\:hidden { display: none; }
      .lg\\:block { display: block; }
      .lg\\:w-auto { width: auto; }
      .lg\\:w-1\\/3 { width: 33.333333%; }
      .lg\\:w-1\\/4 { width: 25%; }
      .lg\\:w-2\\/3 { width: 66.666667%; }
      .lg\\:w-3\\/4 { width: 75%; }
      .lg\\:px-12 { padding-left: 3rem; padding-right: 3rem; }
      .lg\\:py-8 { padding-top: 2rem; padding-bottom: 2rem; }
      .lg\\:text-xl { font-size: 1.25rem; }
      .lg\\:text-2xl { font-size: 1.5rem; }
      .lg\\:text-3xl { font-size: 1.875rem; }
      .lg\\:text-4xl { font-size: 2.25rem; }
      .lg\\:flex-row { flex-direction: row; }
      .lg\\:items-center { align-items: center; }
      .lg\\:justify-between { justify-content: space-between; }
      .lg\\:space-x-8 > * + * { margin-left: 2rem; }
      .lg\\:gap-8 { gap: 2rem; }
      .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 1280px) {
      .xl\\:flex { display: flex; }
      .xl\\:hidden { display: none; }
      .xl\\:block { display: block; }
      .xl\\:w-1\\/4 { width: 25%; }
      .xl\\:w-1\\/5 { width: 20%; }
      .xl\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .xl\\:gap-10 { gap: 2.5rem; }
    }
    
    /* Dark mode (if needed in future) */
    @media (prefers-color-scheme: dark) {
      .dark\\:bg-gray-800 { background-color: #1f2937; }
      .dark\\:bg-gray-900 { background-color: #111827; }
      .dark\\:text-white { color: #fff; }
      .dark\\:text-gray-300 { color: #d1d5db; }
      .dark\\:border-gray-700 { border-color: #374151; }
    }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Loading Screen -->
  <div id="app-loading">
    <!-- Contract Connect dual-circle logo -->
    <div style="width:56px; height:72px; position:relative; margin-bottom:8px;">
      <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #2EC4B6 0%, #3DD8CA 100%); position:absolute; top:0; left:4px; box-shadow: 0 4px 20px rgba(46,196,182,0.4); animation: pulse 2s ease-in-out infinite;"></div>
      <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #28A696 0%, #2EC4B6 100%); position:absolute; bottom:0; left:4px; box-shadow: 0 4px 20px rgba(40,166,150,0.35); opacity:0.85; animation: pulse 2s ease-in-out infinite 0.3s;"></div>
    </div>
    <div class="loading-text" style="font-family:'Montserrat',sans-serif; font-weight:900; letter-spacing:0.05em;">CONTRACT CONNECT</div>
    <div class="loading-sub" style="font-size:14px; letter-spacing:0.15em; margin-top:4px;">合约通</div>
    <div class="loading-sub" id="loadingStatus" style="margin-top:12px;">正在初始化...</div>
    <div style="width: 200px; height: 3px; background: rgba(255,255,255,0.15); border-radius: 99px; margin-top: 16px; overflow: hidden;">
      <div id="loadingBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #2EC4B6, #3DD8CA); border-radius: 99px; transition: width 0.4s ease;"></div>
    </div>
    <div style="margin-top:24px; font-size:9px; letter-spacing:0.2em; color:rgba(255,255,255,0.4); font-family:'Montserrat',sans-serif;">POWERED BY MICRO CONNECT GROUP</div>
  </div>

  <!-- ==================== 产品引导教程弹窗 ==================== -->
  <div id="onboardingModal" class="hidden fixed inset-0 bg-black/60 onboarding-modal flex items-center justify-center z-[300]">
    <div class="onboarding-card bg-white rounded-3xl max-w-2xl w-full mx-4 overflow-hidden">
      <!-- 顶部渐变背景 -->
      <div class="relative h-48 overflow-hidden" style="background: linear-gradient(135deg, #5DC4B3 0%, #49A89A 50%, #ff375f 100%);">
        <div class="absolute inset-0 pattern-bg"></div>
        
        <!-- 关闭按钮 -->
        <button onclick="closeOnboarding()" class="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
          <i class="fas fa-times"></i>
        </button>
        
        <!-- 步骤指示器 -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <button onclick="goToStep(0)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50 active" data-step="0"></button>
          <button onclick="goToStep(1)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50" data-step="1"></button>
          <button onclick="goToStep(2)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50" data-step="2"></button>
          <button onclick="goToStep(3)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50" data-step="3"></button>
          <button onclick="goToStep(4)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50" data-step="4"></button>
        </div>
        
        <!-- 动态图标区域 -->
        <div id="onboardingIconArea" class="absolute inset-0 flex items-center justify-center">
          <div class="float-animation">
            <div class="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <i id="onboardingMainIcon" class="fas fa-handshake text-white text-4xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="p-8 relative overflow-hidden" style="min-height: 320px;">
        <!-- 步骤0: 欢迎 -->
        <div id="step0" class="onboarding-step active">
          <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900 mb-3 fade-in-up">欢迎使用合约通</h2>
            <p class="text-gray-500 mb-8 fade-in-up delay-100">一站式完成合同协商、项目协作和智能签署</p>
            
            <div class="grid grid-cols-3 gap-4 mb-8">
              <div class="p-4 bg-teal-50 rounded-2xl fade-in-up delay-100">
                <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3 feature-icon">
                  <i class="fas fa-file-contract text-teal-600 text-xl"></i>
                </div>
                <p class="text-sm font-medium text-gray-700">智能合同</p>
              </div>
              <div class="p-4 bg-cyan-50 rounded-2xl fade-in-up delay-200">
                <div class="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3 feature-icon">
                  <i class="fas fa-users text-cyan-600 text-xl"></i>
                </div>
                <p class="text-sm font-medium text-gray-700">多方协作</p>
              </div>
              <div class="p-4 bg-pink-50 rounded-2xl fade-in-up delay-300">
                <div class="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3 feature-icon">
                  <i class="fas fa-signature text-pink-600 text-xl"></i>
                </div>
                <p class="text-sm font-medium text-gray-700">电子签章</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 步骤1: 创建项目 -->
        <div id="step1" class="onboarding-step next">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <i class="fas fa-plus-circle text-white text-2xl"></i>
              </div>
            </div>
            <div class="flex-1">
              <span class="text-xs font-semibold text-blue-600 uppercase tracking-wide">第一步</span>
              <h3 class="text-xl font-bold text-gray-900 mt-1 mb-3">创建融资项目</h3>
              <p class="text-gray-500 mb-4">点击右上角"新建项目"按钮，选择适合的行业模板（演唱会、餐饮、零售等），系统会自动生成合同框架。</p>
              <div class="flex items-center space-x-4 text-sm">
                <div class="flex items-center text-gray-400">
                  <i class="fas fa-check-circle text-emerald-500 mr-2"></i>
                  <span>5种行业模板</span>
                </div>
                <div class="flex items-center text-gray-400">
                  <i class="fas fa-check-circle text-emerald-500 mr-2"></i>
                  <span>自定义模板</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 步骤2: 协商合同 -->
        <div id="step2" class="onboarding-step next">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0">
              <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <i class="fas fa-comments text-white text-2xl"></i>
              </div>
            </div>
            <div class="flex-1">
              <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wide">第二步</span>
              <h3 class="text-xl font-bold text-gray-900 mt-1 mb-3">自然语言协商</h3>
              <p class="text-gray-500 mb-4">用日常语言描述您想要的变更，例如"把投资金额改为600万"或"分成比例降低到12%"，AI会自动解析并更新合同。</p>
              <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-magic text-cyan-500 mr-2"></i>
                  <span class="italic">"提前终止的返还比例提高5个百分点"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 步骤3: 邀请协作 -->
        <div id="step3" class="onboarding-step next">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0">
              <div class="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                <i class="fas fa-user-plus text-white text-2xl"></i>
              </div>
            </div>
            <div class="flex-1">
              <span class="text-xs font-semibold text-amber-600 uppercase tracking-wide">第三步</span>
              <h3 class="text-xl font-bold text-gray-900 mt-1 mb-3">邀请对方协作</h3>
              <p class="text-gray-500 mb-4">生成邀请链接发送给对方，支持投资方和融资方双视角，实时同步协商进度，所有变更自动记录。</p>
              <div class="flex items-center space-x-3">
                <div class="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium">
                  <i class="fas fa-landmark mr-1"></i>投资方
                </div>
                <i class="fas fa-exchange-alt text-gray-300"></i>
                <div class="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                  <i class="fas fa-store mr-1"></i>融资方
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 步骤4: 完成签署 -->
        <div id="step4" class="onboarding-step next">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0">
              <div class="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                <i class="fas fa-file-signature text-white text-2xl"></i>
              </div>
            </div>
            <div class="flex-1">
              <span class="text-xs font-semibold text-rose-600 uppercase tracking-wide">第四步</span>
              <h3 class="text-xl font-bold text-gray-900 mt-1 mb-3">电子签章完成</h3>
              <p class="text-gray-500 mb-4">协商完成后发起电子签署，支持手写签名和验证码验证，签署完成后可下载正式合同文件。</p>
              <div class="flex items-center space-x-4 text-sm">
                <div class="flex items-center text-gray-400">
                  <i class="fas fa-pen-nib text-rose-500 mr-2"></i>
                  <span>手写签名</span>
                </div>
                <div class="flex items-center text-gray-400">
                  <i class="fas fa-shield-alt text-rose-500 mr-2"></i>
                  <span>安全验证</span>
                </div>
                <div class="flex items-center text-gray-400">
                  <i class="fas fa-download text-rose-500 mr-2"></i>
                  <span>合同下载</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部按钮区域 -->
      <div class="px-8 pb-8 flex items-center justify-between">
        <button onclick="skipOnboarding()" class="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          跳过教程
        </button>
        <div class="flex items-center space-x-3">
          <button id="btnPrevStep" onclick="prevStep()" class="hidden px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
            <i class="fas fa-arrow-left mr-2"></i>上一步
          </button>
          <button id="btnNextStep" onclick="nextStep()" class="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-200 transition-all font-medium">
            开始探索<i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 页面0: 登录/注册页 ==================== -->
  <div id="pageAuth" class="page active flex-col min-h-screen cyber-bg particles-bg">
    <div class="flex-1 flex items-center justify-center p-4 relative z-10">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden animate-scale-in" style="box-shadow: 0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08);">
        <!-- Logo区域 - Contract Connect -->
        <div class="p-8 text-center" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
          <!-- 双圆叠合 Logo -->
          <div class="mx-auto mb-5 animate-float" style="width:52px; height:68px; position:relative;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #2EC4B6 0%, #3DD8CA 100%); position:absolute; top:0; left:4px; box-shadow: 0 4px 16px rgba(46,196,182,0.35);"></div>
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #28A696 0%, #2EC4B6 100%); position:absolute; bottom:0; left:4px; box-shadow: 0 4px 16px rgba(40,166,150,0.3); opacity:0.85;"></div>
          </div>
          <h1 style="font-family:'Montserrat',sans-serif; font-weight:900; font-size:22px; letter-spacing:0.04em; color:#1a1a1a; line-height:1.15; margin-bottom:6px;">CONTRACT<br>CONNECT</h1>
          <div style="width:120px; height:2.5px; background:#2EC4B6; margin:8px auto 10px; border-radius:2px;"></div>
          <p style="font-family:'Montserrat',sans-serif; font-size:9px; letter-spacing:0.2em; color:#666; font-weight:500;">POWERED BY MICRO CONNECT GROUP</p>
          <p class="text-lg font-bold mt-3" style="color:#1a1a1a;">合约通</p>
        </div>
        
        <!-- 登录/注册切换 -->
        <div class="flex" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
          <button onclick="switchAuthTab('login')" id="tabLogin" class="flex-1 py-3 text-center font-semibold" style="color:#2EC4B6; border-bottom: 2px solid #2EC4B6;">登录</button>
          <button onclick="switchAuthTab('register')" id="tabRegister" class="flex-1 py-3 text-center font-semibold" style="color:#86868b;">注册</button>
        </div>
        
        <!-- 登录表单 -->
        <div id="formLogin" class="p-6">
          <form onsubmit="event.preventDefault(); handleLogin();" autocomplete="on">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">用户名 / 邮箱</label>
              <input type="text" id="loginUsername" placeholder="请输入用户名或邮箱" autocomplete="username"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                onkeydown="if(event.key==='Enter')document.getElementById('loginPassword').focus()">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <div class="password-wrapper">
                <input type="password" id="loginPassword" placeholder="请输入密码" autocomplete="current-password"
                  class="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                <button type="button" onclick="togglePasswordVisibility('loginPassword', this)" class="password-toggle" tabindex="-1">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center text-gray-600 cursor-pointer whitespace-nowrap">
                <input type="checkbox" id="rememberMe" class="mr-2 rounded" style="width:16px;height:16px;flex-shrink:0;">
                <span>记住我</span>
              </label>
              <a href="#" class="text-teal-600 hover:text-teal-700">忘记密码？</a>
            </div>
            <button type="submit" class="w-full py-3 btn-primary rounded-xl font-medium shadow-lg">
              <i class="fas fa-sign-in-alt mr-2"></i>登录
            </button>
            <button type="button" onclick="handleGuestLogin()" class="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              <i class="fas fa-user-secret mr-2"></i>游客模式（体验功能）
            </button>
          </div>
          <p id="loginError" class="hidden mt-4 text-sm text-red-500 text-center"></p>
          </form>
          
          <!-- 预留：公司SSO登录入口 -->
          <div class="mt-6 pt-6 border-t border-gray-100">
            <p class="text-xs text-gray-400 text-center mb-3">企业用户</p>
            <button onclick="handleSSOLogin()" class="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center">
              <i class="fas fa-building mr-2"></i>公司SSO登录（即将上线）
            </button>
          </div>
        </div>
        
        <!-- 注册表单 -->
        <div id="formRegister" class="hidden p-6">
          <form onsubmit="event.preventDefault(); handleRegister();" autocomplete="on">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">用户名 <span class="text-red-500">*</span></label>
                <input type="text" id="regUsername" placeholder="用于登录" 
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input type="text" id="regDisplayName" placeholder="显示名称" 
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">邮箱 <span class="text-red-500">*</span></label>
              <input type="email" id="regEmail" placeholder="your@email.com" 
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <input type="tel" id="regPhone" placeholder="13800138000" 
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">密码 <span class="text-red-500">*</span></label>
              <div class="password-wrapper">
                <input type="password" id="regPassword" placeholder="至少6位" autocomplete="new-password"
                  class="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  onkeydown="if(event.key==='Enter')handleRegister()">
                <button type="button" onclick="togglePasswordVisibility('regPassword', this)" class="password-toggle" tabindex="-1">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">默认角色</label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" onclick="selectRegRole('investor')" id="regRoleInvestor" class="py-2 px-3 border-2 border-gray-200 rounded-lg text-sm hover:border-teal-300 text-center">
                  <i class="fas fa-landmark text-teal-500 block mb-1"></i>投资方
                </button>
                <button type="button" onclick="selectRegRole('borrower')" id="regRoleBorrower" class="py-2 px-3 border-2 border-gray-200 rounded-lg text-sm hover:border-amber-300 text-center">
                  <i class="fas fa-store text-amber-500 block mb-1"></i>融资方
                </button>
                <button type="button" onclick="selectRegRole('both')" id="regRoleBoth" class="py-2 px-3 border-2 border-teal-500 bg-teal-50 rounded-lg text-sm text-center">
                  <i class="fas fa-exchange-alt text-cyan-500 block mb-1"></i>两者皆可
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">公司</label>
                <input type="text" id="regCompany" placeholder="所属公司" 
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">职位</label>
                <input type="text" id="regTitle" placeholder="您的职位" 
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
              </div>
            </div>
            <button type="submit" class="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-lg">
              <i class="fas fa-user-plus mr-2"></i>注册
            </button>
          </div>
          <p id="registerError" class="hidden mt-4 text-sm text-red-500 text-center"></p>
          </form>
        </div>
      </div>
    </div>
    <p class="text-center text-sm pb-4" style="color: rgba(255,255,255,0.4);">&copy; 2026 RBF协商平台 · 预留公司系统对接接口</p>
  </div>
  
  <!-- ==================== 页面0.5: 个人主页 ==================== -->
  <div id="pageProfile" class="page flex-col min-h-screen grid-bg">
    <!-- 顶部导航 -->
    <nav class="px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer" onclick="goToMyProjects()" style="background: linear-gradient(135deg, #5DC4B3 0%, #49A89A 100%); box-shadow: 0 4px 12px rgba(93,196,179,0.25);">
            <i class="fas fa-handshake text-white"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold nav-brand">个人中心</h1>
            <p class="text-xs" style="color:#86868b;">My Profile</p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <button onclick="goToMyProjects()" class="px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg flex items-center">
            <i class="fas fa-folder-open mr-2"></i>我的项目
          </button>
          <button onclick="handleLogout()" class="px-4 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center">
            <i class="fas fa-sign-out-alt mr-2"></i>退出
          </button>
        </div>
      </div>
    </nav>
    
    <!-- 主内容区 -->
    <div class="flex-1 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- 个人信息卡片 -->
        <div class="card rounded-2xl overflow-hidden mb-6 animate-fade-in">
          <div class="h-32 relative" style="background: linear-gradient(135deg, #5DC4B3 0%, #49A89A 50%, #ff375f 100%);">
            <button onclick="showEditProfileModal()" class="absolute top-4 right-4 px-3 py-1.5 text-white rounded-lg text-sm" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15);">
              <i class="fas fa-edit mr-1"></i>编辑资料
            </button>
          </div>
          <div class="px-6 pb-6 relative">
            <div class="flex items-end space-x-4 -mt-12">
              <div id="profileAvatar" class="w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                U
              </div>
              <div class="pb-2">
                <h2 id="profileName" class="text-2xl font-bold text-gray-900">用户名</h2>
                <p id="profileMeta" class="text-gray-500">
                  <span id="profileCompany">-</span> · <span id="profileTitle">-</span>
                </p>
              </div>
            </div>
            <div class="mt-6 grid grid-cols-4 gap-4">
              <div class="stat-card text-center animate-fade-in">
                <p class="stat-value" id="profileStatProjects">0</p>
                <p class="stat-label">总项目</p>
              </div>
              <div class="stat-card text-center animate-fade-in delay-100">
                <p class="stat-value" id="profileStatNegotiating">0</p>
                <p class="stat-label">协商中</p>
              </div>
              <div class="stat-card text-center animate-fade-in delay-200">
                <p class="stat-value" id="profileStatSigned">0</p>
                <p class="stat-label">已签署</p>
              </div>
              <div class="stat-card text-center animate-fade-in delay-300">
                <p class="stat-value" id="profileStatAmount">¥0</p>
                <p class="stat-label">总金额</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 角色切换标签 -->
        <div class="flex items-center space-x-4 mb-6 animate-slide-up">
          <button onclick="switchProfileRole('borrower')" id="profileRoleBorrower" class="flex-1 py-4 bg-white rounded-xl border-2 border-amber-500 text-amber-700 font-medium flex items-center justify-center shadow-sm">
            <i class="fas fa-store mr-2 text-xl"></i>
            <div class="text-left">
              <p class="font-bold">作为融资方</p>
              <p class="text-xs opacity-70">我发起的项目</p>
            </div>
          </button>
          <button onclick="switchProfileRole('investor')" id="profileRoleInvestor" class="flex-1 py-4 bg-white rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center justify-center hover:border-teal-300">
            <i class="fas fa-landmark mr-2 text-xl"></i>
            <div class="text-left">
              <p class="font-bold">作为投资方</p>
              <p class="text-xs opacity-70">我参与的项目</p>
            </div>
          </button>
        </div>
        
        <!-- 融资方视角内容 -->
        <div id="borrowerView" class="space-y-6">
          <!-- 我发起的项目 -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-bold text-gray-800 flex items-center">
                <i class="fas fa-folder text-amber-500 mr-2"></i>
                我发起的项目
                <span id="borrowerProjectCount" class="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">0</span>
              </h3>
              <button onclick="goToMyProjects()" class="text-sm text-teal-600 hover:text-teal-700">
                查看全部 <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
            <div id="borrowerProjectList" class="divide-y divide-gray-50">
              <div class="p-8 text-center text-gray-400">
                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                <p>暂无发起的项目</p>
                <button onclick="goToMyProjects(); setTimeout(showNewProjectModal, 300)" class="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">
                  <i class="fas fa-plus mr-1"></i>发起新项目
                </button>
              </div>
            </div>
          </div>
          
          <!-- 项目讨论 -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
              <h3 class="font-bold text-gray-800 flex items-center">
                <i class="fas fa-comments text-amber-500 mr-2"></i>
                项目讨论
                <span id="borrowerDiscussionCount" class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">0</span>
              </h3>
            </div>
            <div id="borrowerDiscussionList" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400">
                <p class="text-sm">项目协商记录将在这里显示</p>
              </div>
            </div>
          </div>
          
          <!-- 相关合同 -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
              <h3 class="font-bold text-gray-800 flex items-center">
                <i class="fas fa-file-contract text-amber-500 mr-2"></i>
                相关合同
                <span id="borrowerContractCount" class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">0</span>
              </h3>
            </div>
            <div id="borrowerContractList" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400">
                <p class="text-sm">签署的合同将在这里显示</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 投资方视角内容 -->
        <div id="investorView" class="hidden space-y-6">
          <!-- 我参与的项目 -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-bold text-gray-800 flex items-center">
                <i class="fas fa-folder text-teal-500 mr-2"></i>
                我参与的项目
                <span id="investorProjectCount" class="ml-2 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs">0</span>
              </h3>
              <button onclick="showJoinCollabModal()" class="text-sm text-teal-600 hover:text-teal-700">
                <i class="fas fa-user-plus mr-1"></i>加入新项目
              </button>
            </div>
            <div id="investorProjectList" class="divide-y divide-gray-50">
              <div class="p-8 text-center text-gray-400">
                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                <p>暂无参与的项目</p>
                <button onclick="showJoinCollabModal()" class="mt-3 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600">
                  <i class="fas fa-link mr-1"></i>通过邀请码加入
                </button>
              </div>
            </div>
          </div>
          
          <!-- 项目讨论 -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
              <h3 class="font-bold text-gray-800 flex items-center">
                <i class="fas fa-comments text-teal-500 mr-2"></i>
                项目讨论
                <span id="investorDiscussionCount" class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">0</span>
              </h3>
            </div>
            <div id="investorDiscussionList" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400">
                <p class="text-sm">参与的项目协商记录将在这里显示</p>
              </div>
            </div>
          </div>
          
          <!-- 相关合同 -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
              <h3 class="font-bold text-gray-800 flex items-center">
                <i class="fas fa-file-contract text-teal-500 mr-2"></i>
                相关合同
                <span id="investorContractCount" class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">0</span>
              </h3>
            </div>
            <div id="investorContractList" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400">
                <p class="text-sm">签署的合同将在这里显示</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 编辑个人资料 ==================== -->
  <div id="editProfileModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 max-h-[85vh] overflow-hidden animate-in flex flex-col">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-user-edit mr-2 text-teal-600"></i>编辑个人资料</h2>
          <button onclick="hideEditProfileModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">显示名称</label>
          <input type="text" id="editDisplayName" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">手机号</label>
          <input type="tel" id="editPhone" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">公司</label>
            <input type="text" id="editCompany" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">职位</label>
            <input type="text" id="editTitle" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
          <textarea id="editBio" rows="2" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">默认角色</label>
          <select id="editDefaultRole" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="both">两者皆可</option>
            <option value="investor">投资方</option>
            <option value="borrower">融资方</option>
          </select>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3 flex-shrink-0">
        <button onclick="hideEditProfileModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="saveProfile()" class="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">保存</button>
      </div>
    </div>
  </div>
  
  <!-- ==================== 页面1: 项目列表 ==================== -->
  <div id="pageProjects" class="page flex-col min-h-screen grid-bg">
    <nav class="px-5 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <!-- Nav Logo: 双圆叠合 mini -->
          <div style="width:32px; height:36px; position:relative; flex-shrink:0;">
            <div style="width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #2EC4B6, #3DD8CA); position:absolute; top:0; left:3px;"></div>
            <div style="width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #28A696, #2EC4B6); position:absolute; bottom:0; left:3px; opacity:0.85;"></div>
          </div>
          <div>
            <h1 class="text-base font-bold tracking-tight nav-brand" style="color:#1a1a1a;">合约通</h1>
            <p class="text-xs -mt-0.5" style="color:#86868b; font-family:'Montserrat',sans-serif; letter-spacing:0.05em; font-weight:600; font-size:9px;">CONTRACT CONNECT</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <!-- 云端同步状态 -->
          <button onclick="showCloudSyncModal()" id="btnCloudSync" class="tooltip px-2.5 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center text-xs" data-tip="数据管理">
            <i class="fas fa-database mr-1.5"></i>
            <span id="navStorageText">本地</span>
            <span id="navSyncIndicator" class="ml-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
          </button>
          <!-- 使用帮助 -->
          <button onclick="showOnboarding()" class="tooltip p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm" data-tip="帮助">
            <i class="fas fa-question-circle"></i>
          </button>
          <!-- 模板管理 -->
          <button onclick="showTemplateManagerModal()" class="tooltip p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm" data-tip="模板">
            <i class="fas fa-layer-group"></i>
          </button>
          <!-- 加入协作 -->
          <button onclick="showJoinCollabModal()" class="tooltip px-2.5 py-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center text-xs" data-tip="邀请码加入">
            <i class="fas fa-user-plus mr-1"></i>
            <span>加入</span>
          </button>
          <button onclick="showNewProjectModal()" class="btn-primary text-xs">
            <i class="fas fa-plus mr-1.5"></i>新建项目
          </button>
          <!-- 用户头像/登录入口 -->
          <div class="border-l border-gray-200 pl-2 ml-1 relative">
            <button onclick="toggleUserDropdown(event)" id="navUserBtn" class="flex items-center space-x-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-lg">
              <div id="navUserAvatar" class="w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                U
              </div>
              <span id="navUserName" class="text-xs font-medium text-gray-700 max-w-[60px] truncate">用户</span>
              <i class="fas fa-chevron-down text-gray-400 text-xs transition-transform" id="navUserChevron"></i>
            </button>
            <div id="userDropdown" class="user-dropdown">
              <div class="user-dropdown-header">
                <div class="flex items-center space-x-3">
                  <div id="dropdownAvatar" class="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold">U</div>
                  <div>
                    <div id="dropdownName" class="font-semibold text-gray-900 text-sm">用户</div>
                    <div id="dropdownRole" class="text-xs text-gray-500">游客模式</div>
                  </div>
                </div>
              </div>
              <div class="py-1">
                <button class="user-dropdown-item" onclick="goToProfile(); closeUserDropdown();">
                  <i class="fas fa-user-circle"></i>个人中心
                </button>
                <button class="user-dropdown-item" onclick="showOnboarding(); closeUserDropdown();">
                  <i class="fas fa-graduation-cap"></i>新手引导
                </button>
                <div class="user-dropdown-divider"></div>
                <button class="user-dropdown-item danger" onclick="closeUserDropdown(); handleLogout();">
                  <i class="fas fa-sign-out-alt"></i>退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="flex-1 p-4">
      <div class="max-w-7xl mx-auto">
        <!-- 欢迎区域 Hero Banner -->
        <div class="relative overflow-hidden rounded-2xl mb-5 p-6" style="background: linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #1e1b4b 100%);">
          <div class="absolute inset-0" style="background: radial-gradient(ellipse at 70% 30%, rgba(93,196,179,0.3) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(175,82,222,0.2) 0%, transparent 50%); pointer-events:none;"></div>
          <div class="relative z-10 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white mb-1" style="letter-spacing: -0.02em;" id="welcomeText">欢迎回来</h2>
              <p class="text-sm" style="color: rgba(255,255,255,0.6);">管理您的融资协商项目，追踪每一笔交易进展</p>
            </div>
            <div class="flex items-center gap-3">
              <button onclick="showJoinCollabModal()" class="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2" style="background: rgba(255,255,255,0.12); color: white; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(8px);">
                <i class="fas fa-user-plus"></i>加入协作
              </button>
              <button onclick="showNewProjectModal()" class="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2" style="background: white; color: #1a1040; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <i class="fas fa-plus"></i>新建项目
              </button>
            </div>
          </div>
        </div>
        
        <!-- 统计卡片 - 紧凑型 / 移动2列 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div class="stat-card animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <p class="stat-label">全部项目</p>
                <p class="stat-value" id="statTotal">0</p>
              </div>
              <div class="icon-container icon-container-sm icon-gradient-primary">
                <i class="fas fa-folder text-white text-sm"></i>
              </div>
            </div>
          </div>
          <div class="stat-card animate-fade-in delay-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="stat-label">协商中</p>
                <p class="stat-value" id="statNegotiating">0</p>
              </div>
              <div class="icon-container icon-container-sm icon-gradient-warning">
                <i class="fas fa-comments text-white text-sm"></i>
              </div>
            </div>
          </div>
          <div class="stat-card animate-fade-in delay-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="stat-label">已签署</p>
                <p class="stat-value" id="statCompleted">0</p>
              </div>
              <div class="icon-container icon-container-sm icon-gradient-success">
                <i class="fas fa-check-circle text-white text-sm"></i>
              </div>
            </div>
          </div>
          <div class="stat-card animate-fade-in delay-300">
            <div class="flex items-center justify-between">
              <div>
                <p class="stat-label">总融资额</p>
                <p class="stat-value" id="statAmount">¥0</p>
              </div>
              <div class="icon-container icon-container-sm" style="background: linear-gradient(135deg, #0D9488 0%, #3D8F83 100%); box-shadow: 0 4px 12px rgba(73, 168, 154, 0.3);">
                <i class="fas fa-yen-sign text-white text-sm"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 项目列表头部 -->
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold text-gray-800">我的项目</h2>
          <div class="flex items-center space-x-2">
            <select class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" id="filterStatus" onchange="renderProjects()">
              <option value="all">全部状态</option>
              <option value="negotiating">协商中</option>
              <option value="completed">已完成</option>
              <option value="signed">已签署</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>
        
        <div id="projectGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"></div>
        
        <div id="emptyState" class="hidden py-6 animate-fade-in">
          <div class="max-w-3xl mx-auto">
            <!-- 欢迎标题 -->
            <div class="text-center mb-6">
              <div class="empty-state-icon mx-auto animate-float">
                <i class="fas fa-handshake"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-800 mb-2" style="letter-spacing:-0.02em;">开始您的第一个融资项目</h3>
              <p class="text-sm text-gray-500">让合同协商与项目协作变得简单、透明、高效</p>
            </div>
            
            <!-- 快速开始引导 - 两列卡片 -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <button onclick="showNewProjectModal()" class="group text-left p-5 rounded-2xl border transition-all" style="background: rgba(255,255,255,0.9); border-color: rgba(0,0,0,0.06);" onmouseover="this.style.borderColor='rgba(93,196,179,0.3)';this.style.boxShadow='0 8px 32px rgba(93,196,179,0.08)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(0,0,0,0.06)';this.style.boxShadow='none';this.style.transform='none'">
                <div class="w-12 h-12 icon-container icon-container-lg icon-gradient-primary mb-4 group-hover:scale-105 transition-transform" style="border-radius:16px;">
                  <i class="fas fa-plus text-white text-lg"></i>
                </div>
                <h4 class="font-bold text-gray-800 mb-1 text-base">创建新项目</h4>
                <p class="text-sm text-gray-500 leading-relaxed">选择行业模板，AI自动生成合同框架，开始融资协商</p>
              </button>
              <button onclick="showJoinCollabModal()" class="group text-left p-5 rounded-2xl border transition-all" style="background: rgba(255,255,255,0.9); border-color: rgba(0,0,0,0.06);" onmouseover="this.style.borderColor='rgba(52,199,89,0.3)';this.style.boxShadow='0 8px 32px rgba(52,199,89,0.08)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(0,0,0,0.06)';this.style.boxShadow='none';this.style.transform='none'">
                <div class="w-12 h-12 icon-container icon-container-lg icon-gradient-success mb-4 group-hover:scale-105 transition-transform" style="border-radius:16px;">
                  <i class="fas fa-user-plus text-white text-lg"></i>
                </div>
                <h4 class="font-bold text-gray-800 mb-1 text-base">加入协作</h4>
                <p class="text-sm text-gray-500 leading-relaxed">通过邀请码参与他人的项目协商，实时同步进度</p>
              </button>
            </div>
            
            <!-- 功能亮点 - 更丰富 -->
            <div class="rounded-2xl p-5 border" style="background: rgba(255,255,255,0.8); border-color: rgba(0,0,0,0.04);">
              <h4 class="text-xs font-bold uppercase tracking-wider mb-4" style="color: #86868b;"><i class="fas fa-sparkles mr-1.5" style="color: #5DC4B3;"></i>平台核心能力</h4>
              <div class="grid grid-cols-4 gap-4">
                <div class="text-center group">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all" style="background: linear-gradient(135deg, rgba(93,196,179,0.08) 0%, rgba(175,82,222,0.08) 100%);">
                    <i class="fas fa-robot text-base" style="color: #5DC4B3;"></i>
                  </div>
                  <p class="font-medium text-xs text-gray-700">AI智能解析</p>
                  <p class="text-xs text-gray-400 mt-0.5">自然语言驱动</p>
                </div>
                <div class="text-center group">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all" style="background: linear-gradient(135deg, rgba(175,82,222,0.08) 0%, rgba(255,55,95,0.06) 100%);">
                    <i class="fas fa-users text-base" style="color: #49A89A;"></i>
                  </div>
                  <p class="font-medium text-xs text-gray-700">多方协作</p>
                  <p class="text-xs text-gray-400 mt-0.5">实时同步变更</p>
                </div>
                <div class="text-center group">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all" style="background: linear-gradient(135deg, rgba(50,173,230,0.08) 0%, rgba(93,196,179,0.06) 100%);">
                    <i class="fas fa-history text-base" style="color: #32ade6;"></i>
                  </div>
                  <p class="font-medium text-xs text-gray-700">版本快照</p>
                  <p class="text-xs text-gray-400 mt-0.5">完整变更追踪</p>
                </div>
                <div class="text-center group">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all" style="background: linear-gradient(135deg, rgba(255,55,95,0.06) 0%, rgba(255,159,10,0.06) 100%);">
                    <i class="fas fa-signature text-base" style="color: #ff375f;"></i>
                  </div>
                  <p class="font-medium text-xs text-gray-700">电子签章</p>
                  <p class="text-xs text-gray-400 mt-0.5">法律效力保障</p>
                </div>
              </div>
            </div>
            
            <!-- 帮助提示 -->
            <p class="mt-4 text-xs text-gray-400">
              <i class="fas fa-question-circle mr-1"></i>
              首次使用？<button onclick="showOnboarding()" class="text-teal-500 hover:text-teal-600 underline font-medium">查看新手引导</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 页面2: 协商界面 ==================== -->
  <div id="pageNegotiation" class="page flex-col h-screen grid-bg">
    <nav class="px-4 py-2.5 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button onclick="goToProjects()" class="back-btn flex items-center px-2.5 py-1.5 text-gray-600 hover:text-teal-600 rounded-lg text-sm">
            <i class="fas fa-arrow-left mr-1.5"></i>
            <span class="font-medium">返回</span>
          </button>
          <div class="border-l border-gray-200 pl-3">
            <div class="flex items-center space-x-2">
              <h1 class="font-bold text-gray-900 text-sm" id="projectTitle">项目名称</h1>
              <span id="projectStatus" class="badge badge-warning">协商中</span>
            </div>
            <p class="text-xs text-gray-500"><span id="projectIndustry">行业</span> · <span id="projectDate">创建时间</span></p>
          </div>
        </div>
        <div class="flex items-center space-x-1.5">
          <!-- 协作者 -->
          <button onclick="showCollaboratorModal()" class="tooltip p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 text-sm" data-tip="邀请协作">
            <i class="fas fa-user-plus"></i>
          </button>
          <!-- 版本历史 -->
          <button onclick="showVersionModal()" class="tooltip p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 text-sm" data-tip="版本历史">
            <i class="fas fa-history"></i>
          </button>
          <!-- AI助手 -->
          <button onclick="showAIAdvisorModal()" class="tooltip p-1.5 hover:bg-teal-100 rounded-lg text-teal-600 text-sm" data-tip="AI谈判助手">
            <i class="fas fa-robot"></i>
          </button>
          <!-- 视角切换 -->
          <div class="flex items-center bg-gray-100 rounded-lg p-0.5 ml-1">
            <button onclick="switchPerspective('investor')" id="btnInvestor" class="perspective-badge px-2.5 py-1 rounded-md text-xs font-semibold text-white perspective-investor">
              <i class="fas fa-landmark mr-1"></i>投资方
            </button>
            <button onclick="switchPerspective('borrower')" id="btnBorrower" class="px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600">
              <i class="fas fa-store mr-1"></i>融资方
            </button>
          </div>
          <div class="w-px h-6 bg-gray-200 mx-1"></div>
          <button onclick="saveProject()" class="btn-secondary text-xs py-1.5 px-2.5">
            <i class="fas fa-save mr-1"></i>保存
          </button>
          <button onclick="showSignModal()" class="btn-primary text-xs py-1.5 px-2.5" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
            <i class="fas fa-signature mr-1"></i>签署
          </button>
          <button onclick="showExportModal()" class="btn-secondary text-xs py-1.5 px-2.5">
            <i class="fas fa-download mr-1"></i>导出
          </button>
        </div>
      </div>
    </nav>
    
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧：协商面板 -->
      <div class="w-2/5 border-r border-gray-200 flex flex-col bg-white">
        <div class="p-3 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-semibold text-gray-700 flex items-center">
              <i class="fas fa-comment-dots mr-1.5 text-teal-500"></i>描述条款变动
            </label>
            <button onclick="showAIAdvisorPanel()" id="btnAIAdvisor" class="text-xs bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-2.5 py-1 rounded-full hover:from-teal-600 hover:to-cyan-600 flex items-center shadow-md pulse-glow">
              <i class="fas fa-robot mr-1"></i>AI助手
            </button>
          </div>
          <textarea id="negotiationInput" rows="2" 
            placeholder="用自然语言描述变动...&#10;例如：投资金额改成600万，分成比例降到12%&#10;提示：Ctrl+Enter 快速发送"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm"></textarea>
          
          <!-- 快捷输入提示 - 更紧凑 -->
          <div class="mt-2 p-2 bg-teal-50/70 rounded-lg border border-teal-100">
            <p class="text-xs text-teal-600 mb-1.5 font-medium"><i class="fas fa-bolt mr-1"></i>快捷输入</p>
            <div class="flex gap-1.5 flex-wrap">
              <button onclick="quickInput('投资金额调整为')" class="quick-input-btn">
                <i class="fas fa-yen-sign"></i>金额
              </button>
              <button onclick="quickInput('分成比例改为')" class="quick-input-btn">
                <i class="fas fa-percent"></i>分成
              </button>
              <button onclick="quickInput('违约金调整为')" class="quick-input-btn">
                <i class="fas fa-exclamation-triangle"></i>违约
              </button>
              <button onclick="quickInput('分成期限改为')" class="quick-input-btn">
                <i class="fas fa-calendar"></i>期限
              </button>
              <button onclick="quickInput('终止返还比例提高')" class="quick-input-btn">
                <i class="fas fa-undo"></i>返还
              </button>
            </div>
          </div>
          
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-gray-300 flex items-center">
              <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-400 text-xs font-mono mr-0.5">Ctrl</kbd>
              <span class="text-gray-300 mx-0.5">+</span>
              <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-400 text-xs font-mono">Enter</kbd>
              <span class="ml-1.5 text-gray-400">快速发送</span>
            </span>
            <button onclick="submitNegotiation()" id="btnSubmit" class="btn-primary text-sm flex items-center">
              <i class="fas fa-paper-plane mr-1.5"></i>发送变更
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-semibold text-gray-600 flex items-center">
              <i class="fas fa-history mr-1.5 text-gray-400"></i>协商记录
              <span id="negotiationCount" class="ml-1.5 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs">0</span>
            </h3>
            <button onclick="createVersionSnapshot()" class="text-xs text-blue-600 hover:text-blue-700 flex items-center px-2 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors" title="保存当前合同版本">
              <i class="fas fa-save mr-1"></i>保存版本
            </button>
          </div>
          <div id="negotiationHistory" class="space-y-2">
            <div class="text-center text-gray-400 py-6">
              <i class="fas fa-comments text-3xl mb-2 opacity-40"></i>
              <p class="text-xs font-medium">开始协商</p>
              <p class="text-xs mt-0.5 opacity-70">输入变动内容，AI将自动解析</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：合同预览 -->
      <div class="w-3/5 flex flex-col bg-slate-50">
        <div class="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span id="changedBadge" class="hidden badge badge-success">
              <i class="fas fa-edit mr-1"></i><span id="changedCount">0</span>处变更
            </span>
          </div>
          <div class="flex bg-gray-100 rounded-lg p-0.5">
            <button onclick="switchContractView('card')" id="btnCardView" class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white shadow text-teal-600">
              <i class="fas fa-th-large mr-1"></i>卡片
            </button>
            <button onclick="switchContractView('full')" id="btnFullView" class="px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600">
              <i class="fas fa-file-alt mr-1"></i>合同
            </button>
            <button onclick="switchContractView('agents')" id="btnAgentsView" class="px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600">
              <i class="fas fa-robot mr-1"></i>Agent
            </button>
          </div>
        </div>
        
        <div id="cardView" class="flex-1 overflow-y-auto p-3">
          <div id="moduleCards" class="grid grid-cols-1 gap-3"></div>
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
        
        <!-- Agent专家面板 -->
        <div id="agentsView" class="hidden flex-1 overflow-y-auto p-6 bg-gradient-to-br from-teal-50 via-cyan-50 to-pink-50">
          <div class="max-w-4xl mx-auto">
            <!-- 顶部介绍 -->
            <div class="text-center mb-8">
              <div class="w-20 h-20 bg-gradient-to-br from-teal-500 via-cyan-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i class="fas fa-users-cog text-white text-3xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">多Agent并行工作流</h2>
              <p class="text-gray-600 max-w-xl mx-auto">
                我们的AI系统由8位专业Agent组成，各自负责合同的不同模块。
                当您输入修改请求时，系统会智能路由到相关Agent并行处理，确保专业性与效率。
              </p>
            </div>
            
            <!-- 工作流程图 -->
            <div class="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-project-diagram mr-2 text-teal-600"></i>
                工作流程
              </h3>
              <div class="flex items-center justify-center space-x-4 py-4">
                <div class="text-center">
                  <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-keyboard text-blue-600 text-xl"></i>
                  </div>
                  <p class="text-sm font-medium text-gray-700">用户输入</p>
                  <p class="text-xs text-gray-500">自然语言</p>
                </div>
                <i class="fas fa-arrow-right text-gray-300 text-2xl"></i>
                <div class="text-center">
                  <div class="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-route text-cyan-600 text-xl"></i>
                  </div>
                  <p class="text-sm font-medium text-gray-700">智能路由</p>
                  <p class="text-xs text-gray-500">关键词+LLM</p>
                </div>
                <i class="fas fa-arrow-right text-gray-300 text-2xl"></i>
                <div class="text-center">
                  <div class="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-users-cog text-emerald-600 text-xl"></i>
                  </div>
                  <p class="text-sm font-medium text-gray-700">并行处理</p>
                  <p class="text-xs text-gray-500">多Agent协作</p>
                </div>
                <i class="fas fa-arrow-right text-gray-300 text-2xl"></i>
                <div class="text-center">
                  <div class="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-object-group text-amber-600 text-xl"></i>
                  </div>
                  <p class="text-sm font-medium text-gray-700">结果聚合</p>
                  <p class="text-xs text-gray-500">冲突检测</p>
                </div>
                <i class="fas fa-arrow-right text-gray-300 text-2xl"></i>
                <div class="text-center">
                  <div class="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-file-contract text-pink-600 text-xl"></i>
                  </div>
                  <p class="text-sm font-medium text-gray-700">合同更新</p>
                  <p class="text-xs text-gray-500">精准修改</p>
                </div>
              </div>
            </div>
            
            <!-- Agent卡片网格 -->
            <div class="grid grid-cols-2 gap-4" id="agentExpertCards">
              <!-- 动态生成Agent卡片 -->
            </div>
            
            <!-- 底部说明 -->
            <div class="mt-8 p-4 bg-white/60 rounded-xl border border-teal-100">
              <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-lightbulb text-teal-600"></i>
                </div>
                <div>
                  <h4 class="font-medium text-gray-800 mb-1">使用提示</h4>
                  <p class="text-sm text-gray-600">
                    您可以在输入框中使用自然语言描述多个条款的变动，例如：
                    <span class="inline-block mt-1 px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                      "投资金额改成800万，违约金提高到25%，数据上报改为每周"
                    </span>
                    系统会自动识别并分配给相应的专家Agent处理。
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 新建项目 ==================== -->
  <div id="newProjectModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900"><i class="fas fa-plus-circle mr-2 text-teal-600"></i>创建融资项目</h2>
            <p class="text-sm text-gray-500 mt-1">选择行业模板，开始协商您的项目合约</p>
          </div>
          <button onclick="hideNewProjectModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- 步骤1: 项目名称 -->
        <div class="mb-6">
          <div class="flex items-center mb-3">
            <span class="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">1</span>
            <label class="text-sm font-medium text-gray-700">为项目命名</label>
          </div>
          <input type="text" id="newProjectName" placeholder="例如：XX品牌杭州旗舰店融资、2024春季巡演" 
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
          <p class="text-xs text-gray-400 mt-1"><i class="fas fa-lightbulb mr-1 text-amber-500"></i>建议使用品牌+项目类型命名，便于后续管理</p>
        </div>
        
        <!-- 步骤2: 选择模板 -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <span class="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">2</span>
              <label class="text-sm font-medium text-gray-700">选择行业模板</label>
            </div>
            <span id="selectedTemplateHint" class="text-xs text-gray-400">请选择一个模板</span>
          </div>
          <div id="templateGrid" class="grid grid-cols-2 gap-3"></div>
          <p class="text-xs text-gray-400 mt-2"><i class="fas fa-info-circle mr-1"></i>不同行业模板包含针对性条款，选择后仍可自由修改</p>
        </div>
        
        <!-- 备注（可选） -->
        <div>
          <div class="flex items-center mb-2">
            <span class="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs mr-2">+</span>
            <label class="text-sm font-medium text-gray-500">备注（可选）</label>
          </div>
          <textarea id="newProjectNote" rows="2" placeholder="项目背景、特殊要求等..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm"></textarea>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-between items-center">
        <p class="text-xs text-gray-400"><i class="fas fa-shield-alt mr-1 text-emerald-500"></i>数据安全存储在本地浏览器</p>
        <div class="flex space-x-3">
          <button onclick="hideNewProjectModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
          <button onclick="createProject()" class="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-lg hover:shadow-xl transition-all">
            <i class="fas fa-rocket mr-2"></i>开始协商
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 云端同步/数据管理 ==================== -->
  <div id="cloudSyncModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-database mr-2 text-teal-600"></i>数据管理</h2>
          <button onclick="hideCloudSyncModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[65vh]">
        <!-- 存储状态 -->
        <div class="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-800"><i class="fas fa-hdd mr-2 text-teal-600"></i>本地存储状态</h4>
            <span id="storageStatusBadge" class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">正常</span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-white rounded-lg p-3">
              <p class="text-2xl font-bold text-teal-600" id="storageProjectCount">0</p>
              <p class="text-xs text-gray-500">项目数</p>
            </div>
            <div class="bg-white rounded-lg p-3">
              <p class="text-2xl font-bold text-cyan-600" id="storageVersionCount">0</p>
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
              <div id="storageBar" class="bg-teal-600 h-2 rounded-full transition-all" style="width: 0%"></div>
            </div>
          </div>
        </div>
        
        <!-- 数据操作 -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3"><i class="fas fa-cog mr-2"></i>数据操作</h4>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="exportAllData()" class="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors">
              <div class="text-center">
                <i class="fas fa-download text-teal-600 text-xl mb-2"></i>
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
  <div id="collaboratorModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-users mr-2 text-teal-600"></i>协作管理</h2>
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
          <h4 class="text-sm font-medium text-gray-700 mb-3"><i class="fas fa-user-plus mr-2 text-teal-500"></i>邀请协作者</h4>
          <div class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <button onclick="selectInviteRole('investor')" id="roleInvestor" class="invite-role-btn p-3 border-2 border-teal-500 bg-teal-50 rounded-xl text-center">
                <i class="fas fa-landmark text-teal-600 text-lg mb-1"></i>
                <p class="text-xs font-medium text-teal-700">投资方</p>
                <p class="text-xs text-teal-500">可提议修改</p>
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
              <button onclick="generateInviteLink()" id="btnGenerateInvite" class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center">
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
            <div class="flex items-center justify-between p-3 bg-teal-50 rounded-xl border border-teal-100">
              <div class="flex items-center space-x-3">
                <div class="relative">
                  <div class="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-crown text-white text-sm"></i>
                  </div>
                  <span class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">我（项目所有者）</p>
                  <p class="text-xs text-gray-500">创建于 <span id="ownerCreateDate">-</span></p>
                </div>
              </div>
              <span class="px-2 py-1 bg-teal-500 text-white rounded-lg text-xs">所有者</span>
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
              <p class="font-medium text-teal-600">投资方</p>
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
  <div id="joinCollabModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
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
  <div id="versionModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-teal-50">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-code-branch mr-2 text-cyan-600"></i>版本管理</h2>
            <p class="text-xs text-gray-500 mt-1">创建快照、对比版本、回退历史状态</p>
          </div>
          <button onclick="hideVersionModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- 创建快照 -->
        <div class="mb-6 p-4 bg-cyan-50 rounded-xl border border-cyan-100">
          <h4 class="text-sm font-medium text-cyan-800 mb-3"><i class="fas fa-camera mr-2"></i>创建版本快照</h4>
          <div class="flex space-x-2">
            <input type="text" id="versionNameInput" placeholder="版本名称（如：初稿、第一轮协商完成）" 
              class="flex-1 px-4 py-2 border border-cyan-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <button onclick="createVersionSnapshot()" class="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm whitespace-nowrap">
              <i class="fas fa-save mr-1"></i>保存快照
            </button>
          </div>
          <p class="text-xs text-cyan-600 mt-2"><i class="fas fa-info-circle mr-1"></i>快照将保存当前所有参数和协商记录</p>
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
        <button onclick="showVersionCompareModal()" id="btnVersionCompare" class="text-sm text-gray-500 hover:text-teal-600 flex items-center disabled:opacity-50" disabled>
          <i class="fas fa-code-compare mr-2"></i>版本对比
        </button>
        <div class="text-xs text-gray-400">
          <i class="fas fa-lightbulb mr-1"></i>提示：回退版本不会删除当前工作内容
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 版本对比 ==================== -->
  <div id="versionCompareModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-code-compare mr-2 text-teal-600"></i>版本对比</h2>
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
  <div id="versionDetailModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-info-circle mr-2 text-teal-600"></i>版本详情</h2>
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
  <div id="aiAdvisorModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-500 to-cyan-600">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
              <i class="fas fa-robot text-white text-xl"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">AI谈判助手</h2>
              <p class="text-sm text-white/70">智能分析 · 策略建议 · 风险预警</p>
            </div>
          </div>
          <button onclick="hideAIAdvisorModal()" class="p-2 hover:bg-white/20 rounded-lg">
            <i class="fas fa-times text-white"></i>
          </button>
        </div>
      </div>
      
      <!-- 功能标签页 -->
      <div class="border-b border-gray-200 bg-gray-50">
        <div class="flex">
          <button onclick="switchAITab('advice')" id="tabAIAdvice" class="ai-tab flex-1 px-4 py-3 text-sm font-medium text-teal-600 border-b-2 border-teal-600 bg-white">
            <i class="fas fa-lightbulb mr-2"></i>谈判建议
          </button>
          <button onclick="switchAITab('risk')" id="tabAIRisk" class="ai-tab flex-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            <i class="fas fa-shield-alt mr-2"></i>风险评估
          </button>
          <button onclick="switchAITab('market')" id="tabAIMarket" class="ai-tab flex-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            <i class="fas fa-chart-bar mr-2"></i>市场对标
          </button>
        </div>
      </div>
      
      <div id="aiAdvisorContent" class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- 初始状态：谈判建议 -->
        <div id="aiAdvicePanel">
          <div class="text-center py-6">
            <div class="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-brain text-teal-600 text-3xl"></i>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">智能谈判顾问</h3>
            <p class="text-sm text-gray-500 mb-6">基于历史数据和市场行情，为您量身定制谈判策略</p>
            
            <div class="grid grid-cols-2 gap-3 mb-6 text-left">
              <div class="p-3 bg-teal-50 rounded-xl">
                <div class="flex items-center text-teal-700 mb-1">
                  <i class="fas fa-bullseye mr-2"></i>
                  <span class="text-sm font-medium">最优报价</span>
                </div>
                <p class="text-xs text-teal-600">基于对方立场给出建议值</p>
              </div>
              <div class="p-3 bg-cyan-50 rounded-xl">
                <div class="flex items-center text-cyan-700 mb-1">
                  <i class="fas fa-chess mr-2"></i>
                  <span class="text-sm font-medium">策略指导</span>
                </div>
                <p class="text-xs text-cyan-600">专业话术和谈判技巧</p>
              </div>
              <div class="p-3 bg-amber-50 rounded-xl">
                <div class="flex items-center text-amber-700 mb-1">
                  <i class="fas fa-balance-scale mr-2"></i>
                  <span class="text-sm font-medium">让步空间</span>
                </div>
                <p class="text-xs text-amber-600">底线分析和交换条件</p>
              </div>
              <div class="p-3 bg-rose-50 rounded-xl">
                <div class="flex items-center text-rose-700 mb-1">
                  <i class="fas fa-eye mr-2"></i>
                  <span class="text-sm font-medium">预测对方</span>
                </div>
                <p class="text-xs text-rose-600">分析对方下一步动作</p>
              </div>
            </div>
            
            <button onclick="getAIAdvice()" id="btnGetAdvice" class="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 font-medium shadow-lg shadow-teal-200">
              <i class="fas fa-magic mr-2"></i>获取AI建议
            </button>
          </div>
          
          <!-- AI建议结果区域 -->
          <div id="aiAdviceResult" class="hidden"></div>
        </div>
        
        <!-- 风险评估面板 -->
        <div id="aiRiskPanel" class="hidden">
          <div class="text-center py-6">
            <div class="w-20 h-20 bg-gradient-to-br from-rose-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-shield-alt text-rose-600 text-3xl"></i>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">合同风险评估</h3>
            <p class="text-sm text-gray-500 mb-6">多维度分析当前条款的潜在风险</p>
            <button onclick="getRiskAssessment()" id="btnRiskAssess" class="px-8 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl hover:from-rose-600 hover:to-orange-600 font-medium">
              <i class="fas fa-search mr-2"></i>开始评估
            </button>
          </div>
          <div id="aiRiskResult" class="hidden"></div>
        </div>
        
        <!-- 市场对标面板 -->
        <div id="aiMarketPanel" class="hidden">
          <div class="text-center py-6">
            <div class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-chart-line text-emerald-600 text-3xl"></i>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">市场对标分析</h3>
            <p class="text-sm text-gray-500 mb-6">对比行业标准，评估条款竞争力</p>
            <button onclick="getMarketBenchmark()" id="btnMarketBench" class="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-medium">
              <i class="fas fa-chart-bar mr-2"></i>开始分析
            </button>
          </div>
          <div id="aiMarketResult" class="hidden"></div>
        </div>
      </div>
      
      <!-- 底部信息 -->
      <div class="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <div class="text-xs text-gray-400">
          <i class="fas fa-info-circle mr-1"></i>AI建议仅供参考，请结合实际情况决策
        </div>
        <div id="aiLastUpdate" class="text-xs text-gray-400"></div>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 电子签署 ==================== -->
  <div id="signModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-emerald-900"><i class="fas fa-file-signature mr-2"></i>电子签署</h2>
          <button onclick="hideSignModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div id="signModalContent" class="p-6 overflow-y-auto max-h-[70vh]">
        <!-- 签署状态区域 -->
        <div id="signStatusArea" class="hidden mb-6">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 text-white mb-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold">签署进度</h3>
              <span id="signProgressBadge" class="px-3 py-1 bg-white/20 rounded-full text-sm">签署中</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="flex-1 bg-white/20 rounded-full h-3">
                <div id="signProgressBar" class="bg-white rounded-full h-3 transition-all" style="width: 0%"></div>
              </div>
              <span id="signProgressText" class="text-sm font-medium">0/0</span>
            </div>
          </div>
          <!-- 签署人状态列表 -->
          <div id="signersStatusList" class="space-y-3"></div>
        </div>
        
        <!-- 发起签署表单 -->
        <div id="signInitiateForm">
          <!-- 签署流程步骤指示 -->
          <div class="flex items-center justify-center mb-6 px-4">
            <div class="flex items-center">
              <div class="sign-progress-step active w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-teal-100 text-teal-600">1</div>
              <span class="ml-2 text-sm font-medium text-teal-600">填写信息</span>
            </div>
            <div class="w-12 h-0.5 bg-gray-200 mx-3"></div>
            <div class="flex items-center">
              <div class="sign-progress-step w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-100 text-gray-400">2</div>
              <span class="ml-2 text-sm text-gray-400">手写签名</span>
            </div>
            <div class="w-12 h-0.5 bg-gray-200 mx-3"></div>
            <div class="flex items-center">
              <div class="sign-progress-step w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-100 text-gray-400">3</div>
              <span class="ml-2 text-sm text-gray-400">验证完成</span>
            </div>
          </div>
          
          <div class="text-center py-2 mb-4">
            <h3 class="font-medium text-gray-900 mb-2"><i class="fas fa-users mr-2 text-emerald-600"></i>添加签署人信息</h3>
            <p class="text-sm text-gray-500">填写投资方和融资方的签署人信息，系统将发送签署邀请</p>
          </div>
          
          <!-- 签署人表单 -->
          <div class="space-y-4">
            <div class="p-4 border-2 border-teal-200 rounded-xl bg-teal-50/50">
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-landmark text-white text-sm"></i>
                </div>
                <h4 class="font-medium text-teal-900">投资方签署人</h4>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">姓名 <span class="text-red-500">*</span></label>
                  <input type="text" id="signerInvestorName" placeholder="签署人姓名" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">手机号</label>
                  <input type="tel" id="signerInvestorPhone" placeholder="接收签署通知" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-xs text-gray-500 mb-1">邮箱</label>
                  <input type="email" id="signerInvestorEmail" placeholder="接收签署文件" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                </div>
              </div>
            </div>
            
            <div class="p-4 border-2 border-amber-200 rounded-xl bg-amber-50/50">
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-store text-white text-sm"></i>
                </div>
                <h4 class="font-medium text-amber-900">融资方签署人</h4>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">姓名 <span class="text-red-500">*</span></label>
                  <input type="text" id="signerBorrowerName" placeholder="签署人姓名" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">手机号</label>
                  <input type="tel" id="signerBorrowerPhone" placeholder="接收签署通知" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-xs text-gray-500 mb-1">邮箱</label>
                  <input type="email" id="signerBorrowerEmail" placeholder="接收签署文件" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 class="text-sm font-medium text-gray-700 mb-2"><i class="fas fa-shield-alt mr-2 text-emerald-600"></i>签署安全保障</h4>
            <ul class="text-xs text-gray-500 space-y-1">
              <li><i class="fas fa-check text-emerald-500 mr-2"></i>合同内容哈希校验，确保文件完整性</li>
              <li><i class="fas fa-check text-emerald-500 mr-2"></i>签署时间精确记录，具有法律效力</li>
              <li><i class="fas fa-check text-emerald-500 mr-2"></i>手写签名图像存储，真实还原签署意愿</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="p-4 border-t border-gray-100 flex justify-between items-center">
        <div id="signModalLeftAction"></div>
        <div class="flex space-x-3">
          <button onclick="hideSignModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
          <button id="btnInitiateSign" onclick="initiateSignProcess()" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <i class="fas fa-paper-plane mr-2"></i>发起签署
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 签名板 ==================== -->
  <div id="signaturePadModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden animate-in flex flex-col">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-pen-nib mr-2 text-emerald-600"></i>手写签名</h2>
            <p id="signaturePadSignerName" class="text-sm text-gray-500">签署人</p>
          </div>
          <button onclick="hideSignaturePadModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto flex-1">
        <!-- 合同摘要确认 -->
        <div class="mb-4 p-4 bg-gray-50 rounded-xl">
          <h4 class="text-sm font-medium text-gray-700 mb-2"><i class="fas fa-file-contract mr-2"></i>签署确认</h4>
          <p id="signatureContractSummary" class="text-xs text-gray-500">正在签署：项目合同</p>
          <p class="text-xs text-amber-600 mt-2"><i class="fas fa-exclamation-triangle mr-1"></i>请仔细阅读合同内容，签署后具有法律效力</p>
        </div>
        
        <!-- 签名画布 -->
        <div class="border-2 border-dashed border-gray-300 rounded-xl p-2 bg-white">
          <canvas id="signatureCanvas" width="400" height="200" class="w-full cursor-crosshair" style="touch-action: none;"></canvas>
        </div>
        <div class="flex items-center justify-between mt-3">
          <button onclick="clearSignatureCanvas()" class="text-sm text-gray-500 hover:text-gray-700">
            <i class="fas fa-eraser mr-1"></i>清除重签
          </button>
          <p class="text-xs text-gray-400">请在框内手写签名</p>
        </div>
        
        <!-- 验证码输入 -->
        <div class="mt-4 p-4 bg-teal-50 rounded-xl">
          <label class="block text-sm font-medium text-teal-700 mb-2">
            <i class="fas fa-shield-alt mr-1"></i>签署验证码
          </label>
          <div class="flex space-x-3">
            <input type="text" id="signVerifyCode" placeholder="请输入验证码" maxlength="6" class="flex-1 px-4 py-2 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <button onclick="sendSignVerifyCode()" id="btnSendVerifyCode" class="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 text-sm whitespace-nowrap">
              发送验证码
            </button>
          </div>
          <p class="text-xs text-teal-500 mt-2"><i class="fas fa-info-circle mr-1"></i>演示模式：验证码为 123456</p>
        </div>
      </div>
      <div class="p-4 border-t border-gray-100 flex justify-end space-x-3 flex-shrink-0">
        <button onclick="hideSignaturePadModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button id="btnConfirmSignature" onclick="confirmSignature()" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <i class="fas fa-check mr-2"></i>确认签署
        </button>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 签署完成 ==================== -->
  <div id="signCompleteModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-8 text-center">
        <div class="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-check text-white text-3xl"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">签署完成！</h2>
        <p class="text-gray-500 mb-6">所有签署人已完成电子签署，合同正式生效</p>
        
        <div class="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-500">合同编号</span>
            <span id="signCompleteContractId" class="font-mono text-gray-700">-</span>
          </div>
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-500">签署时间</span>
            <span id="signCompleteTime" class="text-gray-700">-</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">签署人数</span>
            <span id="signCompleteSignerCount" class="text-emerald-600 font-medium">-</span>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button onclick="downloadSignedContract()" class="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <i class="fas fa-download mr-2"></i>下载合同
          </button>
          <button onclick="hideSignCompleteModal()" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            完成
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 导出 ==================== -->
  <div id="exportModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-download mr-2 text-teal-600"></i>导出合同</h2>
          <button onclick="hideExportModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-500 mb-4">选择导出格式</p>
        <div class="space-y-3">
          <button onclick="exportAs('pdf')" class="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-file-pdf text-red-600"></i>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900">PDF格式</p>
              <p class="text-xs text-gray-500">适合打印和存档</p>
            </div>
          </button>
          <button onclick="exportAs('word')" class="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-file-word text-blue-600"></i>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900">Word格式</p>
              <p class="text-xs text-gray-500">适合继续编辑</p>
            </div>
          </button>
          <button onclick="exportAs('json')" class="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors">
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
  <div id="templateManagerModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-layer-group mr-2 text-teal-600"></i>模板管理</h2>
            <p class="text-xs text-gray-500 mt-1">管理系统模板和自定义行业模板</p>
          </div>
          <button onclick="hideTemplateManagerModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[65vh]">
        <!-- 标签切换和操作 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex space-x-2 bg-gray-100 rounded-lg p-1">
            <button onclick="switchTemplateTab('system')" id="tabSystemTemplate" class="px-4 py-2 bg-white text-teal-700 rounded-lg text-sm font-medium shadow-sm">
              <i class="fas fa-building mr-1"></i>系统模板
            </button>
            <button onclick="switchTemplateTab('custom')" id="tabCustomTemplate" class="px-4 py-2 text-gray-600 rounded-lg text-sm font-medium hover:bg-white/50">
              <i class="fas fa-user mr-1"></i>我的模板 <span id="customTemplateCount" class="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">0</span>
            </button>
          </div>
          <button onclick="showCreateTemplateModal()" class="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 flex items-center">
            <i class="fas fa-plus mr-2"></i>创建模板
          </button>
        </div>
        
        <!-- 系统模板列表 -->
        <div id="systemTemplateList" class="grid grid-cols-2 gap-4">
          <!-- 动态渲染 -->
        </div>
        
        <!-- 自定义模板列表 -->
        <div id="customTemplateList" class="hidden">
          <div id="customTemplateGrid" class="grid grid-cols-2 gap-4">
            <!-- 动态渲染 -->
          </div>
          <div id="emptyCustomTemplate" class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-folder-open text-gray-400 text-2xl"></i>
            </div>
            <h4 class="font-medium text-gray-700 mb-2">暂无自定义模板</h4>
            <p class="text-sm text-gray-500 mb-4">基于系统模板创建专属行业模板</p>
            <button onclick="showCreateTemplateModal()" class="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
              <i class="fas fa-plus mr-2"></i>创建第一个模板
            </button>
          </div>
        </div>
        
        <!-- 模板操作提示 -->
        <div class="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <h4 class="font-medium text-amber-800 mb-2"><i class="fas fa-lightbulb mr-2"></i>模板使用提示</h4>
          <ul class="text-sm text-amber-700 space-y-1">
            <li><i class="fas fa-check text-amber-500 mr-2"></i>复制系统模板后可自由修改参数默认值</li>
            <li><i class="fas fa-check text-amber-500 mr-2"></i>从项目另存可保留已协商的参数作为模板</li>
            <li><i class="fas fa-check text-amber-500 mr-2"></i>自定义模板仅保存在本地浏览器中</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 创建/编辑模板 ==================== -->
  <div id="createTemplateModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 id="createTemplateTitle" class="text-lg font-bold text-gray-900"><i class="fas fa-plus-circle mr-2 text-teal-600"></i>创建自定义模板</h2>
          <button onclick="hideCreateTemplateModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto max-h-[65vh]">
        <!-- 创建方式选择 -->
        <div id="templateCreateMethod" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">选择创建方式</label>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="selectCreateMethod('clone')" id="methodClone" class="create-method-btn p-4 border-2 border-teal-500 bg-teal-50 rounded-xl text-left">
              <div class="flex items-center mb-2">
                <div class="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-copy text-white"></i>
                </div>
                <div>
                  <h4 class="font-medium text-teal-900">复制系统模板</h4>
                  <p class="text-xs text-teal-600">基于现有模板修改</p>
                </div>
              </div>
            </button>
            <button onclick="selectCreateMethod('blank')" id="methodBlank" class="create-method-btn p-4 border-2 border-gray-200 rounded-xl text-left hover:border-gray-400">
              <div class="flex items-center mb-2">
                <div class="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-file text-white"></i>
                </div>
                <div>
                  <h4 class="font-medium text-gray-700">空白模板</h4>
                  <p class="text-xs text-gray-500">从零开始创建</p>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <!-- 源模板选择（复制模式） -->
        <div id="sourceTemplateSelect" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择源模板</label>
          <div id="sourceTemplateOptions" class="grid grid-cols-3 gap-2">
            <!-- 动态渲染 -->
          </div>
        </div>
        
        <!-- 模板基本信息 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">模板名称 <span class="text-red-500">*</span></label>
            <input type="text" id="newTemplateName" placeholder="例如：杭州餐饮连锁专用模板" 
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">行业分类</label>
              <select id="newTemplateIndustry" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="餐饮">餐饮</option>
                <option value="零售">零售</option>
                <option value="医疗">医疗</option>
                <option value="教育">教育</option>
                <option value="娱乐">娱乐</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">图标颜色</label>
              <div class="flex space-x-2">
                <button onclick="selectTemplateColor('indigo')" class="color-btn w-10 h-10 bg-teal-500 rounded-lg border-2 border-teal-600"></button>
                <button onclick="selectTemplateColor('amber')" class="color-btn w-10 h-10 bg-amber-500 rounded-lg border-2 border-transparent hover:border-amber-600"></button>
                <button onclick="selectTemplateColor('emerald')" class="color-btn w-10 h-10 bg-emerald-500 rounded-lg border-2 border-transparent hover:border-emerald-600"></button>
                <button onclick="selectTemplateColor('rose')" class="color-btn w-10 h-10 bg-rose-500 rounded-lg border-2 border-transparent hover:border-rose-600"></button>
                <button onclick="selectTemplateColor('purple')" class="color-btn w-10 h-10 bg-cyan-500 rounded-lg border-2 border-transparent hover:border-cyan-600"></button>
                <button onclick="selectTemplateColor('cyan')" class="color-btn w-10 h-10 bg-cyan-500 rounded-lg border-2 border-transparent hover:border-cyan-600"></button>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">模板描述</label>
            <textarea id="newTemplateDesc" rows="2" placeholder="简要描述此模板的适用场景..."
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"></textarea>
          </div>
          
          <!-- 默认参数编辑 -->
          <div id="defaultParamsEditor" class="hidden">
            <label class="block text-sm font-medium text-gray-700 mb-2">默认参数值</label>
            <div id="defaultParamsFields" class="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-xl">
              <!-- 动态渲染参数字段 -->
            </div>
          </div>
        </div>
      </div>
      <div class="p-4 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideCreateTemplateModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button id="btnSaveTemplate" onclick="saveCustomTemplate()" class="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <i class="fas fa-save mr-2"></i>保存模板
        </button>
      </div>
    </div>
  </div>
  
  <!-- ==================== 弹窗: 模板详情 ==================== -->
  <div id="templateDetailModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-info-circle mr-2 text-teal-600"></i>模板详情</h2>
          <button onclick="hideTemplateDetailModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div id="templateDetailContent" class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- 动态内容 -->
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 编辑项目 ==================== -->
  <div id="editProjectModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-edit mr-2 text-teal-600"></i>编辑项目</h2>
          <button onclick="hideEditProjectModal()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <input type="hidden" id="editProjectId">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">项目名称 <span class="text-red-500">*</span></label>
          <input type="text" id="editProjectName" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="输入项目名称">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea id="editProjectNote" rows="3" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="项目备注..."></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">项目状态</label>
          <select id="editProjectStatus" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="negotiating">协商中</option>
            <option value="completed">已完成</option>
            <option value="signed">已签署</option>
            <option value="draft">草稿</option>
          </select>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideEditProjectModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="saveEditProject()" class="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <i class="fas fa-save mr-2"></i>保存
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 删除项目确认 ==================== -->
  <div id="deleteProjectModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100 bg-red-50">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-red-900">删除项目</h2>
            <p class="text-sm text-red-600">此操作不可恢复</p>
          </div>
        </div>
      </div>
      <div class="p-6">
        <input type="hidden" id="deleteProjectId">
        <p class="text-gray-700 mb-4">确定要删除项目 "<span id="deleteProjectName" class="font-bold text-gray-900"></span>" 吗？</p>
        <div class="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p class="text-sm text-amber-700"><i class="fas fa-info-circle mr-2"></i>删除后以下内容将被永久移除：</p>
          <ul class="text-sm text-amber-600 mt-2 ml-6 list-disc">
            <li>所有协商记录（<span id="deleteNegotiationCount">0</span>条）</li>
            <li>所有版本快照（<span id="deleteVersionCount">0</span>个）</li>
            <li>所有协作者关联</li>
          </ul>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideDeleteProjectModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="confirmDeleteProject()" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <i class="fas fa-trash-alt mr-2"></i>确认删除
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 直接编辑合同参数 ==================== -->
  <div id="editParamModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900"><i class="fas fa-pen mr-2 text-emerald-600"></i>编辑参数</h2>
            <p id="editParamName" class="text-sm text-gray-500"></p>
          </div>
          <button onclick="hideEditParamModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <input type="hidden" id="editParamKey">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">当前值</label>
          <div id="editParamOldValue" class="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500"></div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">新值 <span class="text-red-500">*</span></label>
          <input type="text" id="editParamNewValue" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="输入新值">
        </div>
        <div id="editParamNote" class="p-3 bg-teal-50 rounded-xl border border-teal-100 text-sm text-teal-700">
          <!-- 参数说明 -->
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideEditParamModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="saveEditParam()" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <i class="fas fa-check mr-2"></i>确认修改
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 删除协商记录确认 ==================== -->
  <div id="deleteNegotiationModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100 bg-amber-50">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-comment-slash text-amber-600 text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-amber-900">删除协商记录</h2>
            <p class="text-sm text-amber-600">此操作将撤销相关参数变更</p>
          </div>
        </div>
      </div>
      <div class="p-6">
        <input type="hidden" id="deleteNegotiationId">
        <p class="text-gray-700 mb-4">确定要删除此协商记录吗？</p>
        <div id="deleteNegotiationPreview" class="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <!-- 动态显示要删除的内容 -->
        </div>
        <div class="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p class="text-sm text-amber-700"><i class="fas fa-exclamation-triangle mr-2"></i>删除后，相关参数将恢复到此次协商前的值</p>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideDeleteNegotiationModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="confirmDeleteNegotiation()" class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
          <i class="fas fa-trash-alt mr-2"></i>确认删除
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 删除版本快照确认 ==================== -->
  <div id="deleteVersionModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100 bg-cyan-50">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-history text-cyan-600 text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-cyan-900">删除版本快照</h2>
            <p class="text-sm text-cyan-600">此操作不可恢复</p>
          </div>
        </div>
      </div>
      <div class="p-6">
        <input type="hidden" id="deleteVersionId">
        <p class="text-gray-700 mb-4">确定要删除版本 "<span id="deleteVersionName" class="font-bold text-gray-900"></span>" 吗？</p>
        <div class="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
          <p class="text-sm text-cyan-700"><i class="fas fa-info-circle mr-2"></i>删除后将无法恢复到此版本的合同状态</p>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideDeleteVersionModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="confirmDeleteVersion()" class="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
          <i class="fas fa-trash-alt mr-2"></i>确认删除
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 删除协作者确认 ==================== -->
  <div id="deleteCollaboratorModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100 bg-rose-50">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-user-minus text-rose-600 text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-rose-900">移除协作者</h2>
            <p class="text-sm text-rose-600">移除后对方将无法访问此项目</p>
          </div>
        </div>
      </div>
      <div class="p-6">
        <input type="hidden" id="deleteCollaboratorId">
        <div id="deleteCollaboratorPreview" class="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
          <div class="flex items-center space-x-3">
            <div id="deleteCollaboratorAvatar" class="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-teal-600"></i>
            </div>
            <div>
              <p id="deleteCollaboratorName" class="font-medium text-gray-900">协作者名称</p>
              <p id="deleteCollaboratorRole" class="text-sm text-gray-500">角色</p>
            </div>
          </div>
        </div>
        <div class="p-3 bg-rose-50 rounded-lg border border-rose-200">
          <p class="text-sm text-rose-700"><i class="fas fa-exclamation-triangle mr-2"></i>移除后，该协作者的所有修改记录将保留，但无法继续参与协商</p>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideDeleteCollaboratorModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="confirmDeleteCollaborator()" class="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
          <i class="fas fa-user-minus mr-2"></i>确认移除
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 删除自定义模板确认 ==================== -->
  <div id="deleteTemplateModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100 bg-orange-50">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-file-alt text-orange-600 text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-orange-900">删除自定义模板</h2>
            <p class="text-sm text-orange-600">此操作不可恢复</p>
          </div>
        </div>
      </div>
      <div class="p-6">
        <input type="hidden" id="deleteTemplateId">
        <div id="deleteTemplatePreview" class="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
          <div class="flex items-center space-x-3">
            <div id="deleteTemplateIcon" class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-file-contract text-teal-600"></i>
            </div>
            <div>
              <p id="deleteTemplateName" class="font-medium text-gray-900">模板名称</p>
              <p id="deleteTemplateIndustry" class="text-sm text-gray-500">行业类型</p>
            </div>
          </div>
        </div>
        <div class="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p class="text-sm text-orange-700"><i class="fas fa-info-circle mr-2"></i>使用此模板创建的项目不受影响，仍可正常使用</p>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideDeleteTemplateModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="confirmDeleteTemplate()" class="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
          <i class="fas fa-trash-alt mr-2"></i>确认删除
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== 弹窗: 编辑签署人信息 ==================== -->
  <div id="editSignerModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-md w-full mx-4 animate-in">
      <div class="p-6 border-b border-gray-100 bg-teal-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div id="editSignerIcon" class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
              <i class="fas fa-user-edit text-teal-600"></i>
            </div>
            <h2 class="text-lg font-bold text-teal-900">编辑签署人信息</h2>
          </div>
          <button onclick="hideEditSignerModal()" class="p-2 hover:bg-white/50 rounded-lg">
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
      </div>
      <div class="p-6">
        <input type="hidden" id="editSignerId">
        <input type="hidden" id="editSignerType">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名 <span class="text-red-500">*</span></label>
            <input type="text" id="editSignerName" placeholder="签署人姓名" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input type="tel" id="editSignerPhone" placeholder="用于接收签署通知" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input type="email" id="editSignerEmail" placeholder="用于接收签署文件" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
          </div>
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideEditSignerModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
        <button onclick="saveSignerInfo()" class="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <i class="fas fa-save mr-2"></i>保存修改
        </button>
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
    
    // ==================== Toast通知系统 ====================
    function initToastContainer() {
      if (!document.getElementById('toastContainer')) {
        const c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
      }
    }
    
    function showToast(typeOrMsg, titleOrType, message, duration) {
      // 兼容两种调用方式:
      // 新: showToast('success', '标题', '消息')
      // 旧: showToast('消息文本', 'success') 或 showToast('消息文本')
      const validTypes = ['success', 'error', 'warning', 'info'];
      let type, title;
      if (validTypes.includes(typeOrMsg)) {
        type = typeOrMsg;
        title = titleOrType || '';
      } else {
        type = validTypes.includes(titleOrType) ? titleOrType : 'info';
        title = typeOrMsg || '';
        message = '';
      }
      
      initToastContainer();
      const container = document.getElementById('toastContainer');
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      };
      duration = duration || (type === 'error' ? 5000 : 3000);
      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.innerHTML = \`
        <div class="toast-icon"><i class="\${icons[type] || icons.info}"></i></div>
        <div class="toast-body">
          <div class="toast-title">\${title}</div>
          \${message ? '<div class="toast-message">' + message + '</div>' : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.classList.add('toast-exit'); setTimeout(() => this.parentElement.remove(), 300);">
          <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress" style="animation-duration: \${duration}ms;"></div>
      \`;
      container.appendChild(toast);
      setTimeout(() => {
        if (toast.parentElement) {
          toast.classList.add('toast-exit');
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }
    
    // ==================== 弹窗滚动锁定工具 ====================
    let _scrollLockCount = 0;
    let _savedScrollY = 0;
    
    // ==================== 密码可见性切换 ====================
    function togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
      }
    }
    
    // ==================== 按钮Ripple效果 ====================
    function addRippleEffect(e) {
      const btn = e.currentTarget;
      if (btn.classList.contains('btn-loading') || btn.disabled) return;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
    
    // ripple效果已由 initRippleEffect() 统一处理，此处不再重复绑定
    
    // ==================== 按钮Loading状态 ====================
    function setBtnLoading(btn, loading) {
      if (!btn) return;
      if (loading) {
        btn._originalHTML = btn.innerHTML;
        btn.classList.add('btn-loading');
        btn.disabled = true;
      } else {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        if (btn._originalHTML) {
          btn.innerHTML = btn._originalHTML;
          delete btn._originalHTML;
        }
      }
    }
    
    function lockBodyScroll() {
      if (_scrollLockCount === 0) {
        _savedScrollY = window.scrollY;
        document.body.classList.add('modal-open');
        document.body.style.top = '-' + _savedScrollY + 'px';
      }
      _scrollLockCount++;
    }
    
    function unlockBodyScroll() {
      _scrollLockCount = Math.max(0, _scrollLockCount - 1);
      if (_scrollLockCount === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, _savedScrollY);
      }
    }
    
    // 通用弹窗显示（带滚动锁定和动画）
    function showModal(id) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('hidden', 'modal-closing');
        lockBodyScroll();
      }
    }
    
    // 通用弹窗关闭（带动画和滚动解锁）
    function hideModal(id, skipAnimation) {
      const el = document.getElementById(id);
      if (!el) return;
      if (skipAnimation) {
        el.classList.add('hidden');
        unlockBodyScroll();
      } else {
        el.classList.add('modal-closing');
        setTimeout(() => {
          el.classList.add('hidden');
          el.classList.remove('modal-closing');
          unlockBodyScroll();
        }, 180);
      }
    }
    
    // 点击蒙层关闭弹窗
    document.addEventListener('click', function(e) {
      const target = e.target;
      // 点到蒙层本身（fixed inset-0 的div）才关闭
      if (target.classList.contains('backdrop-blur-sm') && target.id && target.id.endsWith('Modal')) {
        hideModal(target.id);
      }
      if (target.classList.contains('onboarding-modal') && target.id === 'onboardingModal') {
        closeOnboarding();
      }
    });
    
    // ESC键关闭最上层弹窗
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        // 先检查引导弹窗
        const onboarding = document.getElementById('onboardingModal');
        if (onboarding && !onboarding.classList.contains('hidden')) {
          closeOnboarding();
          return;
        }
        // 关闭最后一个打开的modal
        const modals = document.querySelectorAll('[id$="Modal"]:not(.hidden)');
        if (modals.length > 0) {
          hideModal(modals[modals.length - 1].id);
        }
      }
    });
    
    // ==================== 账户状态管理 ====================
    let currentUser = JSON.parse(localStorage.getItem('rbf_current_user') || 'null');
    let authToken = localStorage.getItem('rbf_auth_token') || null;
    let selectedRegRole = 'both';
    let profileViewRole = 'borrower'; // 个人主页当前查看角色
    
    // ==================== 账户功能 ====================
    function switchAuthTab(tab) {
      document.getElementById('tabLogin').className = tab === 'login' 
        ? 'flex-1 py-3 text-center font-medium border-b-2' 
        : 'flex-1 py-3 text-center font-medium text-gray-500 hover:text-gray-700';
      document.getElementById('tabRegister').className = tab === 'register' 
        ? 'flex-1 py-3 text-center font-medium border-b-2' 
        : 'flex-1 py-3 text-center font-medium text-gray-500 hover:text-gray-700';
      // 动态设置 teal 品牌色
      const activeTab = document.getElementById(tab === 'login' ? 'tabLogin' : 'tabRegister');
      if (activeTab) { activeTab.style.color = '#2EC4B6'; activeTab.style.borderBottomColor = '#2EC4B6'; }
      const inactiveTab = document.getElementById(tab === 'login' ? 'tabRegister' : 'tabLogin');
      if (inactiveTab) { inactiveTab.style.color = ''; inactiveTab.style.borderBottomColor = ''; }
      document.getElementById('formLogin').classList.toggle('hidden', tab !== 'login');
      document.getElementById('formRegister').classList.toggle('hidden', tab !== 'register');
    }
    
    function selectRegRole(role) {
      selectedRegRole = role;
      ['investor', 'borrower', 'both'].forEach(r => {
        const btn = document.getElementById('regRole' + r.charAt(0).toUpperCase() + r.slice(1));
        if (btn) {
          btn.className = r === role 
            ? 'py-2 px-3 border-2 rounded-lg text-sm text-center'
            : 'py-2 px-3 border-2 border-gray-200 rounded-lg text-sm hover:border-gray-300 text-center';
          if (r === role) { btn.style.borderColor = '#2EC4B6'; btn.style.backgroundColor = 'rgba(46,196,182,0.08)'; }
          else { btn.style.borderColor = ''; btn.style.backgroundColor = ''; }
        }
      });
    }
    
    async function handleLogin() {
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      const loginBtn = document.querySelector('#formLogin .btn-primary, #formLogin button[onclick*="handleLogin"]');
      
      if (!username || !password) {
        errorEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>请输入用户名和密码';
        errorEl.className = 'form-error mt-4';
        return;
      }
      
      // Loading状态
      if (loginBtn) { loginBtn.classList.add('btn-loading'); loginBtn.disabled = true; }
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
          currentUser = data.user;
          authToken = data.token;
          localStorage.setItem('rbf_current_user', JSON.stringify(currentUser));
          localStorage.setItem('rbf_auth_token', authToken);
          errorEl.className = 'hidden';
          onLoginSuccess();
        } else {
          errorEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>' + (data.message || '登录失败');
          errorEl.className = 'form-error mt-4';
        }
      } catch (e) {
        errorEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>网络错误，请重试';
        errorEl.className = 'form-error mt-4';
      } finally {
        if (loginBtn) { loginBtn.classList.remove('btn-loading'); loginBtn.disabled = false; }
      }
    }
    
    async function handleRegister() {
      const username = document.getElementById('regUsername').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const displayName = document.getElementById('regDisplayName').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const company = document.getElementById('regCompany').value.trim();
      const title = document.getElementById('regTitle').value.trim();
      const errorEl = document.getElementById('registerError');
      const regBtn = document.querySelector('#formRegister button[onclick*="handleRegister"]');
      
      if (!username || !email || !password) {
        errorEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>请填写必填项（用户名、邮箱、密码）';
        errorEl.className = 'form-error mt-4';
        return;
      }
      
      if (password.length < 6) {
        errorEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>密码至少6位';
        errorEl.className = 'form-error mt-4';
        return;
      }
      
      if (regBtn) { regBtn.classList.add('btn-loading'); regBtn.disabled = true; }
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, displayName, phone, company, title, defaultRole: selectedRegRole })
        });
        const data = await res.json();
        
        if (data.success) {
          currentUser = data.user;
          authToken = data.token;
          localStorage.setItem('rbf_current_user', JSON.stringify(currentUser));
          localStorage.setItem('rbf_auth_token', authToken);
          errorEl.className = 'hidden';
          showToast('success', '注册成功', '欢迎加入合约通！');
          onLoginSuccess();
        } else {
          errorEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>' + (data.message || '注册失败');
          errorEl.className = 'form-error mt-4';
        }
      } catch (e) {
        errorEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>网络错误，请重试';
        errorEl.className = 'form-error mt-4';
      } finally {
        if (regBtn) { regBtn.classList.remove('btn-loading'); regBtn.disabled = false; }
      }
    }
    
    function handleGuestLogin() {
      // 游客模式：创建临时用户
      currentUser = {
        id: 'guest_' + Date.now(),
        username: 'guest',
        displayName: '游客用户',
        email: '',
        defaultRole: 'both',
        isGuest: true
      };
      authToken = 'guest_token';
      localStorage.setItem('rbf_current_user', JSON.stringify(currentUser));
      localStorage.setItem('rbf_auth_token', authToken);
      
      // 清除旧项目数据，确保每次游客登录都有完整 demo 体验
      projects = [];
      localStorage.removeItem('rbf_projects');
      
      // 注入 demo 项目数据
      injectDemoProjects();
      
      showToast('info', '游客模式', '已加载 ' + projects.length + ' 个演示项目，可自由体验所有功能');
      onLoginSuccess();
    }
    
    function injectDemoProjects() {
      const now = new Date();
      const d = (daysAgo) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
      
      const demoProjects = [
        // ===== 1. 演唱会 — 已签署（完整流程案例）=====
        {
          id: 'demo_concert_signed',
          name: '周杰伦2026巡回演唱会·深圳站',
          note: '嘉禾年华文化联合出品，预计3场共4.5万观众',
          templateId: 'concert',
          status: 'signed',
          params: {
            investmentAmount: '1800万',
            fundUsage: '场地租赁、艺人费用、舞美搭建、宣传推广',
            revenueShareRatio: '68',
            revenueDefinition: '票房收入+赞助收入+衍生品收入（税前）',
            sharingStartDate: '首场演出日',
            sharingEndDate: '末场演出后90天',
            annualYieldRate: '28',
            lossClosurePeriod: '3',
            lossClosureThreshold: '5万',
            dataReportFrequency: '每自然日',
            dataTransmissionMethod: '系统自动传输',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: '嘉禾年华文化传媒有限公司',
            prerequisites: '完成场地审批、艺人合同签署、票务系统对接'
          },
          negotiations: [
            { id: 'n1', input: '投资方提出分成比例70%', understood: '设定初始分成比例', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '70', newValue: '70' }], perspective: 'investor', timestamp: d(30) },
            { id: 'n2', input: '融资方认为70%过高，希望降至60%', understood: '融资方希望降低分成比例', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '70', newValue: '60' }], perspective: 'borrower', timestamp: d(28) },
            { id: 'n3', input: '投资方同意让步到68%，但要求增加保底条款', understood: '双方妥协至68%', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '60', newValue: '68' }], perspective: 'investor', timestamp: d(25) },
            { id: 'n4', input: '融资方接受68%，同意增加衍生品收入纳入分成基数', understood: '最终确认分成条款', changes: [{ paramKey: 'revenueDefinition', paramName: '收入定义', oldValue: '票房收入（税前）', newValue: '票房收入+赞助收入+衍生品收入（税前）' }], perspective: 'borrower', timestamp: d(22) },
            { id: 'n5', input: '双方确认所有条款，进入签署流程', understood: '条款定稿', changes: [], perspective: 'investor', timestamp: d(15) }
          ],
          collaborators: [
            { id: 'col_1', name: '张伟（投资方）', role: 'investor', status: 'online' },
            { id: 'col_2', name: '李雪梅（融资方）', role: 'borrower', status: 'online' }
          ],
          versions: [
            { id: 'v1', label: 'V1 初始版本', createdAt: d(30) },
            { id: 'v2', label: 'V2 调整分成比例', createdAt: d(25) },
            { id: 'v3', label: 'V3 最终签署版', createdAt: d(15) }
          ],
          createdAt: d(35),
          updatedAt: d(5)
        },
        
        // ===== 2. 餐饮连锁 — 协商中（活跃谈判）=====
        {
          id: 'demo_catering_negotiating',
          name: '霸王茶姬·华南区30店联营',
          note: '覆盖广州、深圳、东莞核心商圈，目标月均营收150万/店',
          templateId: 'catering',
          status: 'negotiating',
          params: {
            investmentAmount: '600万',
            fundUsage: '门店装修、设备采购、首批原料、流动资金',
            revenueShareRatio: '15',
            revenueDefinition: '门店全部营业收入（含外卖）',
            sharingStartDate: '门店开业之日',
            sharingEndDate: '协议签署后36个月',
            annualYieldRate: '22',
            lossClosurePeriod: '6',
            lossClosureThreshold: '3万',
            dataReportFrequency: '每自然日',
            dataTransmissionMethod: '系统自动传输（POS直连）',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: '霸王茶姬华南运营中心',
            prerequisites: '品牌授权、选址确认、POS系统对接'
          },
          negotiations: [
            { id: 'n1', input: '投资方提出分成比例18%，期限36个月', understood: '初始报价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '12', newValue: '18' }], perspective: 'investor', timestamp: d(10) },
            { id: 'n2', input: '融资方希望分成降到12%，原因是新店前期需要更多利润积累', understood: '融资方议价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '18', newValue: '12' }], perspective: 'borrower', timestamp: d(8) },
            { id: 'n3', input: '投资方同意降至15%，但要求增加月度保底分成5万元', understood: '投资方让步并加保底', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '12', newValue: '15' }], perspective: 'investor', timestamp: d(5) }
          ],
          collaborators: [
            { id: 'col_3', name: '王建国（投资方）', role: 'investor', status: 'online' },
            { id: 'col_4', name: '陈小丽（融资方）', role: 'borrower', status: 'away' }
          ],
          versions: [
            { id: 'v1', label: 'V1 初始版本', createdAt: d(10) },
            { id: 'v2', label: 'V2 分成比例调整', createdAt: d(5) }
          ],
          createdAt: d(12),
          updatedAt: d(2)
        },
        
        // ===== 3. 零售门店 — 已完成（成功案例）=====
        {
          id: 'demo_retail_completed',
          name: '名创优品·杭州城西银泰旗舰店',
          note: '300㎡旗舰店，位于银泰城B1层主通道，日均客流3万+',
          templateId: 'retail',
          status: 'completed',
          params: {
            investmentAmount: '350万',
            fundUsage: '门店装修、首批铺货、租赁押金',
            revenueShareRatio: '12',
            revenueDefinition: '门店全部营业收入',
            sharingStartDate: '2025年6月1日',
            sharingEndDate: '2027年5月31日',
            annualYieldRate: '18',
            lossClosurePeriod: '4',
            lossClosureThreshold: '2万',
            dataReportFrequency: '每自然日',
            dataTransmissionMethod: '系统自动传输',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: '名创优品（杭州）零售有限公司',
            prerequisites: '物业合同签署、装修方案审批'
          },
          negotiations: [
            { id: 'n1', input: '投资方初始报价15%分成', understood: '初始报价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '15', newValue: '15' }], perspective: 'investor', timestamp: d(90) },
            { id: 'n2', input: '融资方希望12%，提供过去6个月经营数据佐证', understood: '以数据支撑议价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '15', newValue: '12' }], perspective: 'borrower', timestamp: d(85) },
            { id: 'n3', input: '投资方同意12%，条件是增加KPI对赌条款', understood: '附条件同意', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '15', newValue: '12' }], perspective: 'investor', timestamp: d(80) },
            { id: 'n4', input: '双方就所有条款达成一致', understood: '最终确认', changes: [], perspective: 'borrower', timestamp: d(75) }
          ],
          collaborators: [
            { id: 'col_5', name: '刘芳（投资方）', role: 'investor', status: 'offline' }
          ],
          versions: [
            { id: 'v1', label: 'V1 初始版本', createdAt: d(90) },
            { id: 'v2', label: 'V2 最终版本', createdAt: d(75) }
          ],
          createdAt: d(95),
          updatedAt: d(60)
        },
        
        // ===== 4. 医美/健康 — 协商中（早期阶段）=====
        {
          id: 'demo_healthcare_early',
          name: '瑞丽医美·上海陆家嘴旗舰店',
          note: '轻医美+皮肤管理，面积500㎡，锁定高净值客群',
          templateId: 'healthcare',
          status: 'negotiating',
          params: {
            investmentAmount: '800万',
            fundUsage: '医疗设备采购、装修、品牌推广启动资金',
            revenueShareRatio: '20',
            revenueDefinition: '全部营业收入（含线上预约）',
            sharingStartDate: '开业之日',
            sharingEndDate: '协议签署后48个月',
            annualYieldRate: '25',
            lossClosurePeriod: '6',
            lossClosureThreshold: '8万',
            dataReportFrequency: '每周',
            dataTransmissionMethod: 'API自动同步',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: '瑞丽医美管理（上海）有限公司',
            prerequisites: '医疗机构许可证、设备采购清单审批'
          },
          negotiations: [
            { id: 'n1', input: '投资方报价分成22%，期限48个月', understood: '初始报价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '22', newValue: '22' }], perspective: 'investor', timestamp: d(3) },
            { id: 'n2', input: '融资方提出降至20%，理由是医疗设备成本高、回本周期长', understood: '融资方首轮还价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '22', newValue: '20' }], perspective: 'borrower', timestamp: d(1) }
          ],
          collaborators: [],
          versions: [
            { id: 'v1', label: 'V1 初始版本', createdAt: d(3) }
          ],
          createdAt: d(5),
          updatedAt: d(1)
        },
        
        // ===== 5. 教育培训 — 草稿（刚创建）=====
        {
          id: 'demo_education_draft',
          name: '新东方·成都春熙路学习中心',
          note: '1200㎡旗舰校区，聚焦K12+成人英语+留学咨询',
          templateId: 'education',
          status: 'draft',
          params: {
            investmentAmount: '500万',
            fundUsage: '校区装修、教学设备、师资培训、市场推广',
            revenueShareRatio: '10',
            revenueDefinition: '全部课程收入（含线上课程）',
            sharingStartDate: '待定',
            sharingEndDate: '待定',
            annualYieldRate: '16',
            lossClosurePeriod: '5',
            lossClosureThreshold: '3万',
            dataReportFrequency: '每月',
            dataTransmissionMethod: '手动上报+系统校验',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: '新东方教育科技集团成都分公司',
            prerequisites: '办学许可证、消防验收、教师资质审核'
          },
          negotiations: [],
          collaborators: [],
          versions: [],
          createdAt: d(1),
          updatedAt: d(1)
        },
        
        // ===== 6. 餐饮连锁 — 已签署（另一个行业案例）=====
        {
          id: 'demo_catering_signed',
          name: '海底捞·北京三里屯新店',
          note: '800㎡双层商铺，预计日均翻台率4.5次',
          templateId: 'catering',
          status: 'signed',
          params: {
            investmentAmount: '1200万',
            fundUsage: '门店装修、厨房设备、智能点餐系统、员工培训',
            revenueShareRatio: '14',
            revenueDefinition: '堂食+外卖全部营业收入（税前）',
            sharingStartDate: '2025年9月1日',
            sharingEndDate: '2028年8月31日',
            annualYieldRate: '20',
            lossClosurePeriod: '5',
            lossClosureThreshold: '10万',
            dataReportFrequency: '每自然日',
            dataTransmissionMethod: '系统自动传输（ERP直连）',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: '海底捞国际控股北京运营中心'
          },
          negotiations: [
            { id: 'n1', input: '投资方初始报价16%', understood: '初始报价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '16', newValue: '16' }], perspective: 'investor', timestamp: d(60) },
            { id: 'n2', input: '海底捞方提出13%，基于品牌溢价和稳定客流', understood: '品牌方议价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '16', newValue: '13' }], perspective: 'borrower', timestamp: d(55) },
            { id: 'n3', input: '投资方同意14%，增加投资额至1200万覆盖智能化改造', understood: '最终协商', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '13', newValue: '14' }, { paramKey: 'investmentAmount', paramName: '投资金额', oldValue: '1000万', newValue: '1200万' }], perspective: 'investor', timestamp: d(50) }
          ],
          collaborators: [
            { id: 'col_6', name: '赵强（投资方）', role: 'investor', status: 'offline' },
            { id: 'col_7', name: '孙婷婷（融资方）', role: 'borrower', status: 'offline' },
            { id: 'col_8', name: '周律师（法务）', role: 'observer', status: 'offline' }
          ],
          versions: [
            { id: 'v1', label: 'V1 初始版本', createdAt: d(60) },
            { id: 'v2', label: 'V2 终版（已签署）', createdAt: d(45) }
          ],
          createdAt: d(65),
          updatedAt: d(40)
        },
        
        // ===== 7. 演唱会 — 协商中（大型项目）=====
        {
          id: 'demo_concert_negotiating',
          name: 'BLACKPINK回归演唱会·上海站',
          note: '虹口足球场，预计2场共8万观众，联合YG Entertainment',
          templateId: 'concert',
          status: 'negotiating',
          params: {
            investmentAmount: '5000万',
            fundUsage: '场地租赁、艺人费用、舞美制作、安保、宣传推广',
            revenueShareRatio: '75',
            revenueDefinition: '票房+赞助+直播版权+衍生品（税前全口径）',
            sharingStartDate: '首场演出日',
            sharingEndDate: '末场演出后120天',
            annualYieldRate: '35',
            lossClosurePeriod: '2',
            lossClosureThreshold: '20万',
            dataReportFrequency: '每自然日',
            dataTransmissionMethod: '系统自动传输',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: 'YG Entertainment China Co., Ltd.'
          },
          negotiations: [
            { id: 'n1', input: '投资方报价80%分成，5000万投资', understood: '大型项目初始报价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '80', newValue: '80' }], perspective: 'investor', timestamp: d(7) },
            { id: 'n2', input: '融资方提出70%分成，理由是直播版权收益不确定性高', understood: '融资方还价', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '80', newValue: '70' }], perspective: 'borrower', timestamp: d(5) },
            { id: 'n3', input: '投资方妥协至75%，但要求将直播版权纳入分成基数', understood: '中间方案', changes: [{ paramKey: 'revenueShareRatio', paramName: '分成比例', oldValue: '70', newValue: '75' }, { paramKey: 'revenueDefinition', paramName: '收入定义', oldValue: '票房+赞助+衍生品', newValue: '票房+赞助+直播版权+衍生品（税前全口径）' }], perspective: 'investor', timestamp: d(3) }
          ],
          collaborators: [
            { id: 'col_9', name: 'Michael Chen（投资方）', role: 'investor', status: 'online' },
            { id: 'col_10', name: 'Park Soo-jin（YG）', role: 'borrower', status: 'away' }
          ],
          versions: [
            { id: 'v1', label: 'V1 初始版本', createdAt: d(7) },
            { id: 'v2', label: 'V2 分成方案调整', createdAt: d(3) }
          ],
          createdAt: d(10),
          updatedAt: d(1)
        },
        
        // ===== 8. 零售门店 — 草稿 =====
        {
          id: 'demo_retail_draft',
          name: 'KKV·广州天河正佳旗舰店',
          note: '潮玩集合店，600㎡，Z世代客群聚集地',
          templateId: 'retail',
          status: 'draft',
          params: {
            investmentAmount: '450万',
            fundUsage: '门店装修（含IP主题区）、首批选品、智能货架系统',
            revenueShareRatio: '11',
            revenueDefinition: '全部营业收入',
            sharingStartDate: '待定',
            sharingEndDate: '待定',
            annualYieldRate: '17',
            dgtName: '滴灌通（深圳）投资管理有限公司',
            mguName: 'KKV品牌运营（广州）有限公司'
          },
          negotiations: [],
          collaborators: [],
          versions: [],
          createdAt: d(2),
          updatedAt: d(2)
        }
      ];
      
      // 注入 demo 数据（不覆盖已有项目）
      const existingIds = projects.map(p => p.id);
      const newDemos = demoProjects.filter(p => !existingIds.includes(p.id));
      console.log('[injectDemoProjects] Existing:', existingIds.length, 'New demos:', newDemos.length);
      if (newDemos.length > 0) {
        projects = [...newDemos, ...projects];
        saveProjects();
        console.log('[injectDemoProjects] Injected', newDemos.length, 'demo projects. Total:', projects.length);
      } else if (projects.length === 0) {
        // 极端情况：没有新demo也没有现有项目，强制注入所有
        projects = demoProjects;
        saveProjects();
        console.log('[injectDemoProjects] Force injected all', demoProjects.length, 'demo projects');
      }
      renderProjects();
      updateStats();
    }
    
    function handleSSOLogin() {
      showToast('info', 'SSO登录即将上线', '企业统一认证接口已预留，敬请期待');
    }
    
    function handleLogout() {
      showConfirmDialog({
        icon: 'warning',
        title: '确认退出',
        message: '退出后需要重新登录才能使用平台功能',
        confirmText: '退出登录',
        cancelText: '取消',
        confirmClass: 'btn-danger',
        onConfirm: function() {
          // 游客用户退出时清除 demo 项目数据，确保下次登录获得全新体验
          if (currentUser && currentUser.isGuest) {
            projects = [];
            localStorage.removeItem('rbf_projects');
          }
          currentUser = null;
          authToken = null;
          localStorage.removeItem('rbf_current_user');
          localStorage.removeItem('rbf_auth_token');
          showToast('info', '已退出', '您已安全退出账号');
          showPage('pageAuth');
        }
      });
    }
    
    function onLoginSuccess() {
      updateNavUserInfo();
      showPage('pageProjects');
      showToast('success', '登录成功', '欢迎回来，' + (currentUser?.displayName || currentUser?.username || '用户'));
      checkShowOnboarding();
    }
    
    // ==================== 美化确认对话框 ====================
    function showConfirmDialog(opts) {
      const id = 'confirmDialog_' + Date.now();
      const iconHtml = opts.icon ? '<div class="confirm-icon ' + opts.icon + '"><i class="fas ' + 
        (opts.icon === 'warning' ? 'fa-exclamation-triangle' : opts.icon === 'danger' ? 'fa-trash-alt' : 'fa-info-circle') + '"></i></div>' : '';
      const div = document.createElement('div');
      div.id = id;
      div.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]';
      div.innerHTML = \`
        <div class="bg-white rounded-2xl max-w-sm w-full mx-4 animate-in overflow-hidden" style="isolation: isolate;">
          <div class="confirm-dialog">
            \${iconHtml}
            <div class="confirm-title">\${opts.title || '确认操作'}</div>
            <div class="confirm-message">\${opts.message || '确定要执行此操作吗？'}</div>
            <div class="confirm-actions">
              <button onclick="document.getElementById('\${id}').remove(); unlockBodyScroll();" class="btn-secondary">\${opts.cancelText || '取消'}</button>
              <button id="\${id}_confirm" class="\${opts.confirmClass || 'btn-primary'}">\${opts.confirmText || '确认'}</button>
            </div>
          </div>
        </div>
      \`;
      document.body.appendChild(div);
      lockBodyScroll();
      // 绑定确认事件
      document.getElementById(id + '_confirm').addEventListener('click', function() {
        div.remove();
        unlockBodyScroll();
        if (opts.onConfirm) opts.onConfirm();
      });
      // 点击蒙层关闭
      div.addEventListener('click', function(e) {
        if (e.target === div) {
          div.remove();
          unlockBodyScroll();
        }
      });
    }
    
    function updateNavUserInfo() {
      if (currentUser) {
        const initial = (currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase();
        document.getElementById('navUserAvatar').textContent = initial;
        document.getElementById('navUserName').textContent = currentUser.displayName || currentUser.username || '用户';
        // 更新下拉菜单
        const da = document.getElementById('dropdownAvatar');
        const dn = document.getElementById('dropdownName');
        const dr = document.getElementById('dropdownRole');
        if (da) da.textContent = initial;
        if (dn) dn.textContent = currentUser.displayName || currentUser.username || '用户';
        if (dr) dr.textContent = currentUser.isGuest ? '游客模式' : (currentUser.company || currentUser.email || '已登录');
      }
    }
    
    // ==================== 用户下拉菜单 ====================
    function toggleUserDropdown(e) {
      e.stopPropagation();
      const dropdown = document.getElementById('userDropdown');
      const chevron = document.getElementById('navUserChevron');
      if (dropdown) {
        const isOpen = dropdown.classList.contains('show');
        dropdown.classList.toggle('show');
        if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
      }
    }
    
    function closeUserDropdown() {
      const dropdown = document.getElementById('userDropdown');
      const chevron = document.getElementById('navUserChevron');
      if (dropdown) dropdown.classList.remove('show');
      if (chevron) chevron.style.transform = '';
    }
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#navUserBtn') && !e.target.closest('#userDropdown')) {
        closeUserDropdown();
      }
    });
    
    function goToProfile() {
      updateProfilePage();
      showPage('pageProfile');
    }
    
    function goToMyProjects() {
      showPage('pageProjects');
    }
    
    function showPage(pageId) {
      const currentPage = document.querySelector('.page.active');
      const nextPage = document.getElementById(pageId);
      if (!nextPage || (currentPage && currentPage.id === pageId)) return;
      
      if (currentPage) {
        currentPage.style.animation = 'pageExit 0.2s ease forwards';
        setTimeout(() => {
          currentPage.classList.remove('active');
          currentPage.style.animation = '';
          nextPage.classList.add('active');
          window.scrollTo(0, 0);
        }, 180);
      } else {
        nextPage.classList.add('active');
      }
    }
    
    function switchProfileRole(role) {
      profileViewRole = role;
      document.getElementById('profileRoleBorrower').className = role === 'borrower'
        ? 'flex-1 py-4 bg-white rounded-xl border-2 border-amber-500 text-amber-700 font-medium flex items-center justify-center shadow-sm'
        : 'flex-1 py-4 bg-white rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center justify-center hover:border-amber-300';
      document.getElementById('profileRoleInvestor').className = role === 'investor'
        ? 'flex-1 py-4 bg-white rounded-xl border-2 border-teal-500 text-teal-700 font-medium flex items-center justify-center shadow-sm'
        : 'flex-1 py-4 bg-white rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center justify-center hover:border-teal-300';
      document.getElementById('borrowerView').classList.toggle('hidden', role !== 'borrower');
      document.getElementById('investorView').classList.toggle('hidden', role !== 'investor');
      renderProfileProjects();
    }
    
    function updateProfilePage() {
      if (!currentUser) return;
      
      const initial = (currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase();
      document.getElementById('profileAvatar').textContent = initial;
      document.getElementById('profileName').textContent = currentUser.displayName || currentUser.username || '用户';
      document.getElementById('profileCompany').textContent = currentUser.company || '未填写公司';
      document.getElementById('profileTitle').textContent = currentUser.title || '未填写职位';
      
      // 计算统计
      const myProjects = projects.filter(p => p.createdBy === currentUser.id || !p.createdBy);
      const participatedProjects = projects.filter(p => 
        p.collaborators?.some(c => c.id === currentUser.id || c.email === currentUser.email)
      );
      const allProjects = [...new Set([...myProjects, ...participatedProjects])];
      
      document.getElementById('profileStatProjects').textContent = allProjects.length;
      document.getElementById('profileStatNegotiating').textContent = allProjects.filter(p => p.status === 'negotiating').length;
      document.getElementById('profileStatSigned').textContent = allProjects.filter(p => p.status === 'signed').length;
      
      const totalAmount = allProjects.reduce((sum, p) => {
        const amount = parseFloat((p.params?.investmentAmount || '0').replace(/[^0-9.]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      document.getElementById('profileStatAmount').textContent = '¥' + totalAmount.toLocaleString() + '万';
      
      renderProfileProjects();
    }
    
    function renderProfileProjects() {
      // 融资方视角：我发起的项目
      const myProjects = projects.filter(p => p.createdBy === currentUser?.id || (!p.createdBy && !p.isParticipated));
      document.getElementById('borrowerProjectCount').textContent = myProjects.length;
      
      const borrowerListEl = document.getElementById('borrowerProjectList');
      if (myProjects.length === 0) {
        borrowerListEl.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fas fa-inbox text-4xl mb-3 opacity-50"></i><p>暂无发起的项目</p><button onclick="goToMyProjects(); setTimeout(showNewProjectModal, 300)" class="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"><i class="fas fa-plus mr-1"></i>发起新项目</button></div>';
      } else {
        borrowerListEl.innerHTML = myProjects.slice(0, 5).map(p => renderProfileProjectItem(p, 'borrower')).join('');
      }
      
      // 投资方视角：我参与的项目（通过邀请加入的）
      const participatedProjects = projects.filter(p => p.isParticipated || 
        p.collaborators?.some(c => c.id === currentUser?.id || c.email === currentUser?.email)
      );
      document.getElementById('investorProjectCount').textContent = participatedProjects.length;
      
      const investorListEl = document.getElementById('investorProjectList');
      if (participatedProjects.length === 0) {
        investorListEl.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fas fa-inbox text-4xl mb-3 opacity-50"></i><p>暂无参与的项目</p><button onclick="showJoinCollabModal()" class="mt-3 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600"><i class="fas fa-link mr-1"></i>通过邀请码加入</button></div>';
      } else {
        investorListEl.innerHTML = participatedProjects.slice(0, 5).map(p => renderProfileProjectItem(p, 'investor')).join('');
      }
      
      // 讨论和合同统计
      const borrowerDiscussions = myProjects.reduce((sum, p) => sum + (p.negotiations?.length || 0), 0);
      const investorDiscussions = participatedProjects.reduce((sum, p) => sum + (p.negotiations?.length || 0), 0);
      document.getElementById('borrowerDiscussionCount').textContent = borrowerDiscussions;
      document.getElementById('investorDiscussionCount').textContent = investorDiscussions;
      
      const borrowerContracts = myProjects.filter(p => p.status === 'signed' || p.status === 'completed').length;
      const investorContracts = participatedProjects.filter(p => p.status === 'signed' || p.status === 'completed').length;
      document.getElementById('borrowerContractCount').textContent = borrowerContracts;
      document.getElementById('investorContractCount').textContent = investorContracts;
      
      // 渲染讨论列表
      renderDiscussionList('borrower', myProjects);
      renderDiscussionList('investor', participatedProjects);
      
      // 渲染合同列表
      renderContractList('borrower', myProjects);
      renderContractList('investor', participatedProjects);
    }
    
    function renderProfileProjectItem(project, role) {
      const template = templates.find(t => t.id === project.templateId) || {};
      const statusColors = {
        draft: 'bg-gray-100 text-gray-600',
        negotiating: 'bg-amber-100 text-amber-700',
        completed: 'bg-emerald-100 text-emerald-700',
        signed: 'bg-blue-100 text-blue-700'
      };
      const statusText = { draft: '草稿', negotiating: '协商中', completed: '已完成', signed: '已签署' };
      const iconColor = role === 'borrower' ? 'amber' : 'teal';
      
      return \`
        <div class="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onclick="openProjectFromProfile('\${project.id}')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-\${iconColor}-100 rounded-lg flex items-center justify-center">
                <i class="fas \${template.icon || 'fa-folder'} text-\${iconColor}-600"></i>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">\${project.name}</h4>
                <p class="text-xs text-gray-500">\${template.name || '未知行业'} · \${project.negotiations?.length || 0}次协商</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 rounded-full text-xs \${statusColors[project.status] || statusColors.draft}">\${statusText[project.status] || '草稿'}</span>
              <i class="fas fa-chevron-right text-gray-300"></i>
            </div>
          </div>
        </div>
      \`;
    }
    
    function renderDiscussionList(role, projectList) {
      const listEl = document.getElementById(role + 'DiscussionList');
      const discussions = [];
      projectList.forEach(p => {
        (p.negotiations || []).slice(-3).forEach(n => {
          discussions.push({ ...n, projectName: p.name, projectId: p.id });
        });
      });
      discussions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (discussions.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-gray-400"><p class="text-sm">项目协商记录将在这里显示</p></div>';
      } else {
        listEl.innerHTML = discussions.slice(0, 5).map(d => \`
          <div class="p-4 hover:bg-gray-50 cursor-pointer" onclick="openProjectFromProfile('\${d.projectId}')">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-comment text-gray-500 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">\${d.input || d.understood || '协商记录'}</p>
                <p class="text-xs text-gray-500">\${d.projectName} · \${formatTime(d.timestamp)}</p>
              </div>
            </div>
          </div>
        \`).join('');
      }
    }
    
    function renderContractList(role, projectList) {
      const listEl = document.getElementById(role + 'ContractList');
      const contracts = projectList.filter(p => p.status === 'signed' || p.status === 'completed');
      
      if (contracts.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-gray-400"><p class="text-sm">签署的合同将在这里显示</p></div>';
      } else {
        listEl.innerHTML = contracts.map(p => {
          const template = templates.find(t => t.id === p.templateId) || {};
          return \`
            <div class="p-4 hover:bg-gray-50 cursor-pointer" onclick="openProjectFromProfile('\${p.id}')">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-file-contract text-emerald-600"></i>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-900">\${p.name}</h4>
                    <p class="text-xs text-gray-500">\${template.name || '未知行业'} · 签署于 \${formatDate(p.signedAt || p.updatedAt)}</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">已签署</span>
              </div>
            </div>
          \`;
        }).join('');
      }
    }
    
    function openProjectFromProfile(projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        openProject(projectId);
      }
    }
    
    function showEditProfileModal() {
      if (!currentUser) return;
      document.getElementById('editDisplayName').value = currentUser.displayName || '';
      document.getElementById('editPhone').value = currentUser.phone || '';
      document.getElementById('editCompany').value = currentUser.company || '';
      document.getElementById('editTitle').value = currentUser.title || '';
      document.getElementById('editBio').value = currentUser.bio || '';
      document.getElementById('editDefaultRole').value = currentUser.defaultRole || 'both';
      showModal('editProfileModal');
    }
    
    function hideEditProfileModal() {
      hideModal('editProfileModal');
    }
    
    async function saveProfile() {
      const updates = {
        displayName: document.getElementById('editDisplayName').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        company: document.getElementById('editCompany').value.trim(),
        title: document.getElementById('editTitle').value.trim(),
        bio: document.getElementById('editBio').value.trim(),
        defaultRole: document.getElementById('editDefaultRole').value
      };
      
      // 更新本地状态
      currentUser = { ...currentUser, ...updates };
      localStorage.setItem('rbf_current_user', JSON.stringify(currentUser));
      
      // 尝试同步到服务器
      if (authToken && !currentUser.isGuest) {
        try {
          await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify(updates)
          });
        } catch (e) {
          console.log('Profile sync failed, saved locally');
        }
      }
      
      updateNavUserInfo();
      updateProfilePage();
      hideEditProfileModal();
      showToast('success', '资料已更新', '个人信息保存成功');
    }
    
    // 检查登录状态
    function checkAuthStatus() {
      if (currentUser && authToken) {
        updateNavUserInfo();
        showPage('pageProjects');
        return true;
      }
      showPage('pageAuth');
      return false;
    }
    
    // ==================== 引导教程 ====================
    let currentOnboardingStep = 0;
    const totalSteps = 5;
    const stepIcons = ['fa-handshake', 'fa-plus-circle', 'fa-comments', 'fa-user-plus', 'fa-file-signature'];
    const stepColors = [
      'from-teal-500 via-cyan-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-500'
    ];
    
    function checkShowOnboarding() {
      // 首次登录或未看过教程才弹出
      const seen = localStorage.getItem('rbf_onboarding_seen');
      if (!seen) {
        showOnboarding();
      }
    }
    
    function showOnboarding() {
      currentOnboardingStep = 0;
      updateOnboardingUI();
      const modal = document.getElementById('onboardingModal');
      modal.classList.remove('hidden');
      modal.classList.remove('modal-closing');
      lockBodyScroll();
    }
    
    function closeOnboarding() {
      const modal = document.getElementById('onboardingModal');
      modal.classList.add('modal-closing');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('modal-closing');
        unlockBodyScroll();
      }, 200);
      localStorage.setItem('rbf_onboarding_seen', 'true');
    }
    
    function skipOnboarding() {
      closeOnboarding();
    }
    
    function goToStep(step) {
      if (step >= 0 && step < totalSteps) {
        const prevStep = currentOnboardingStep;
        currentOnboardingStep = step;
        animateStepTransition(prevStep, step);
        updateOnboardingUI();
      }
    }
    
    function nextStep() {
      if (currentOnboardingStep < totalSteps - 1) {
        goToStep(currentOnboardingStep + 1);
      } else {
        closeOnboarding();
      }
    }
    
    function prevStep() {
      if (currentOnboardingStep > 0) {
        goToStep(currentOnboardingStep - 1);
      }
    }
    
    function animateStepTransition(fromStep, toStep) {
      const fromEl = document.getElementById('step' + fromStep);
      const toEl = document.getElementById('step' + toStep);
      
      if (fromEl && toEl) {
        // 设置离开的步骤
        fromEl.classList.remove('active');
        fromEl.classList.add(toStep > fromStep ? 'prev' : 'next');
        
        // 设置进入的步骤
        toEl.classList.remove('prev', 'next');
        toEl.classList.add('active');
      }
    }
    
    function updateOnboardingUI() {
      // 更新步骤指示器
      document.querySelectorAll('.step-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentOnboardingStep);
      });
      
      // 更新主图标
      const mainIcon = document.getElementById('onboardingMainIcon');
      if (mainIcon) {
        mainIcon.className = 'fas ' + stepIcons[currentOnboardingStep] + ' text-white text-4xl';
      }
      
      // 更新背景渐变
      const iconArea = document.getElementById('onboardingIconArea');
      if (iconArea && iconArea.parentElement) {
        const gradientClasses = ['from-teal-500', 'via-cyan-500', 'to-pink-500', 'from-blue-500', 'to-cyan-500', 'from-emerald-500', 'to-teal-500', 'from-amber-500', 'to-orange-500', 'from-rose-500'];
        gradientClasses.forEach(cls => iconArea.parentElement.classList.remove(cls));
        stepColors[currentOnboardingStep].split(' ').forEach(cls => iconArea.parentElement.classList.add(cls));
      }
      
      // 更新按钮状态
      const prevBtn = document.getElementById('btnPrevStep');
      const nextBtn = document.getElementById('btnNextStep');
      
      if (prevBtn) {
        prevBtn.classList.toggle('hidden', currentOnboardingStep === 0);
      }
      
      if (nextBtn) {
        if (currentOnboardingStep === totalSteps - 1) {
          nextBtn.innerHTML = '开始使用<i class="fas fa-rocket ml-2"></i>';
        } else if (currentOnboardingStep === 0) {
          nextBtn.innerHTML = '开始探索<i class="fas fa-arrow-right ml-2"></i>';
        } else {
          nextBtn.innerHTML = '下一步<i class="fas fa-arrow-right ml-2"></i>';
        }
      }
      
      // 确保所有步骤的初始状态正确
      for (let i = 0; i < totalSteps; i++) {
        const stepEl = document.getElementById('step' + i);
        if (stepEl) {
          stepEl.classList.remove('active', 'prev', 'next');
          if (i === currentOnboardingStep) {
            stepEl.classList.add('active');
          } else if (i < currentOnboardingStep) {
            stepEl.classList.add('prev');
          } else {
            stepEl.classList.add('next');
          }
        }
      }
    }
    
    // ==================== 初始化 ====================
    // 隐藏loading屏幕
    function hideLoadingScreen() {
      const loading = document.getElementById('app-loading');
      if (loading) {
        loading.classList.add('fade-out');
        setTimeout(() => {
          loading.style.display = 'none';
        }, 600);
      }
    }
    
    function updateLoadingProgress(pct, text) {
      const bar = document.getElementById('loadingBar');
      const status = document.getElementById('loadingStatus');
      if (bar) bar.style.width = pct + '%';
      if (status) status.textContent = text;
    }
    
    async function init() {
      updateLoadingProgress(20, '正在加载模板数据...');
      await loadTemplates();
      
      updateLoadingProgress(50, '正在加载用户数据...');
      await loadCustomTemplatesOnInit();
      
      updateLoadingProgress(75, '正在渲染界面...');
      renderProjects();
      updateStats();
      
      updateLoadingProgress(100, '准备就绪');
      
      // 短暂延迟后隐藏loading，让用户看到100%
      setTimeout(() => hideLoadingScreen(), 300);
      
      // 初始化按钮ripple效果
      initRippleEffect();
      
      // 登录页回车键支持
      ['loginUsername', 'loginPassword'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') handleLogin();
        });
      });
      
      // 注册页回车键支持
      ['regUsername', 'regEmail', 'regPassword'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') handleRegister();
        });
      });
      
      // 协商输入框回车键支持（Ctrl+Enter发送）
      const negInput = document.getElementById('negotiationInput');
      if (negInput) negInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitNegotiation();
      });
      
      // 新建项目名称回车键：聚焦模板区域
      const projNameInput = document.getElementById('newProjectName');
      if (projNameInput) projNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const grid = document.getElementById('templateGrid');
          if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      
      // 检查用户是否已登录
      if (currentUser) {
        // 游客用户：检测 demo 数据是否完整，否则自动注入
        if (currentUser.isGuest) {
          const hasDemoProjects = projects.some(p => p.id && p.id.startsWith('demo_'));
          if (!hasDemoProjects || projects.length === 0) {
            console.log('[init] Guest user detected, injecting demo projects. Current count:', projects.length);
            injectDemoProjects();
          }
        }
        // 已登录用户：跳转到项目页并显示教程
        updateNavUserInfo();
        showPage('pageProjects');
        // 确保项目列表在页面切换后再次渲染（防止 DOM 时序问题）
        setTimeout(() => {
          renderProjects();
          updateStats();
          checkShowOnboarding();
        }, 300);
      }
      // 未登录用户：保持在登录页，等待登录成功后再显示教程
    }
    
    // ==================== 按钮Ripple效果 ====================
    function initRippleEffect() {
      document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-primary, .btn-secondary, .btn-success, .btn-danger');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(function() { ripple.remove(); }, 600);
      });
    }
    
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        templates = await res.json();
        renderTemplateGrid();
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
    
    async function loadCustomTemplatesOnInit() {
      // 从localStorage加载自定义模板
      customTemplates = JSON.parse(localStorage.getItem('rbf_custom_templates') || '[]');
    }
    
    // ==================== 项目列表 ====================
    function renderProjects() {
      const grid = document.getElementById('projectGrid');
      const empty = document.getElementById('emptyState');
      const filterVal = document.getElementById('filterStatus')?.value || 'all';
      
      const filtered = filterVal === 'all' ? projects : projects.filter(function(p) {
        if (filterVal === 'completed') return p.status === 'completed' || p.status === 'signed';
        return p.status === filterVal;
      });
      
      if (projects.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
      }
      
      grid.classList.remove('hidden');
      empty.classList.add('hidden');
      
      if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-3 text-center py-12 text-gray-400"><i class="fas fa-filter text-3xl mb-3 opacity-50"></i><p class="text-sm font-medium">没有符合筛选条件的项目</p><p class="text-xs mt-1">尝试更改筛选条件查看更多项目</p></div>';
        return;
      }
      
      // 模板颜色映射 - 直接用真实颜色值，避免CSS变量缺失
      const colorMap = {
        purple: { bg: 'rgba(147,51,234,0.12)', bgHover: 'rgba(147,51,234,0.18)', text: '#3D8F83', icon: '#0D9488' },
        orange: { bg: 'rgba(249,115,22,0.12)', bgHover: 'rgba(249,115,22,0.18)', text: '#ea580c', icon: '#f97316' },
        blue: { bg: 'rgba(59,130,246,0.12)', bgHover: 'rgba(59,130,246,0.18)', text: '#2563eb', icon: '#3b82f6' },
        pink: { bg: 'rgba(236,72,153,0.12)', bgHover: 'rgba(236,72,153,0.18)', text: '#db2777', icon: '#ec4899' },
        green: { bg: 'rgba(16,185,129,0.12)', bgHover: 'rgba(16,185,129,0.18)', text: '#059669', icon: '#10b981' },
        gray: { bg: 'rgba(107,114,128,0.12)', bgHover: 'rgba(107,114,128,0.18)', text: '#4b5563', icon: '#6b7280' },
        red: { bg: 'rgba(239,68,68,0.12)', bgHover: 'rgba(239,68,68,0.18)', text: '#dc2626', icon: '#ef4444' },
        indigo: { bg: 'rgba(99,102,241,0.12)', bgHover: 'rgba(99,102,241,0.18)', text: '#49A89A', icon: '#5DC4B3' },
        teal: { bg: 'rgba(93,196,179,0.12)', bgHover: 'rgba(93,196,179,0.18)', text: '#49A89A', icon: '#5DC4B3' },
      };
      
      grid.innerHTML = filtered.map((p, idx) => {
        const template = templates.find(t => t.id === p.templateId) || {};
        const statusConfig = {
          draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: '草稿', dot: '#9ca3af' },
          negotiating: { bg: 'bg-amber-50', text: 'text-amber-700', label: '协商中', dot: '#f59e0b' },
          completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '已完成', dot: '#10b981' },
          signed: { bg: 'bg-blue-50', text: 'text-blue-700', label: '已签署', dot: '#3b82f6' }
        };
        const status = statusConfig[p.status] || statusConfig.draft;
        const changeCount = p.negotiations?.length || 0;
        const animDelay = Math.min(idx * 60, 360);
        const colors = colorMap[template.color] || colorMap.gray;
        
        return \`
          <div class="project-card cursor-pointer relative group animate-slide-up" style="animation-delay: \${animDelay}ms; animation-fill-mode: both;" onclick="openProject('\${p.id}')">
            <!-- 操作按钮（悬停显示） -->
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-1.5 z-10" onclick="event.stopPropagation()">
              <button onclick="showEditProjectModal('\${p.id}')" class="w-7 h-7 flex items-center justify-center bg-white hover:bg-teal-50 rounded-lg shadow-md border border-gray-100 transition-all hover:scale-110" title="编辑">
                <i class="fas fa-pen text-teal-500 text-xs"></i>
              </button>
              <button onclick="showDeleteProjectModal('\${p.id}')" class="w-7 h-7 flex items-center justify-center bg-white hover:bg-red-50 rounded-lg shadow-md border border-gray-100 transition-all hover:scale-110" title="删除">
                <i class="fas fa-trash-alt text-red-400 text-xs"></i>
              </button>
            </div>
            <div class="flex items-start justify-between mb-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style="background: \${colors.bg};">
                <i class="fas \${template.icon || 'fa-folder'} text-base" style="color: \${colors.icon};"></i>
              </div>
              <div class="flex items-center space-x-1.5">
                \${p.collaborators?.length > 0 ? \`<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs text-gray-400 bg-gray-50"><i class="fas fa-users text-xs mr-0.5"></i>\${p.collaborators.length}</span>\` : ''}
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${status.bg} \${status.text}">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" style="background: \${status.dot};"></span>
                  \${status.label}
                </span>
              </div>
            </div>
            <h3 class="font-bold text-gray-900 mb-0.5 truncate text-sm leading-snug">\${p.name}</h3>
            <p class="text-xs text-gray-400 mb-3">\${template.name || '未知行业'}</p>
            <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span class="flex items-center"><i class="fas fa-comments mr-1 text-teal-300"></i>\${changeCount}次协商</span>
              <span class="flex items-center"><i class="far fa-clock mr-1"></i>\${formatDate(p.updatedAt)}</span>
            </div>
            <div class="pt-2.5 border-t border-gray-100/80 flex items-center justify-between">
              <span class="text-sm font-bold" style="color: \${colors.text};">\${p.params?.investmentAmount || '-'}</span>
              <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">\${p.params?.revenueShareRatio || '-'} 分成</span>
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
    function showNewProjectModal() { showModal('newProjectModal'); }
    function hideNewProjectModal() { hideModal('newProjectModal'); }
    
    // renderTemplateGrid 已在下方定义（支持自定义模板），此处省略
    
    function renderTemplateManagerGrid() {
      const grid = document.getElementById('templateManagerGrid');
      if (!grid) return;
      const tmColorMap = {
        purple: { bg: '#f3e8ff', icon: '#0D9488' },
        orange: { bg: '#fff7ed', icon: '#ea580c' },
        blue: { bg: '#eff6ff', icon: '#2563eb' },
        pink: { bg: '#fdf2f8', icon: '#db2777' },
        green: { bg: '#ecfdf5', icon: '#059669' },
        gray: { bg: '#f9fafb', icon: '#6b7280' },
        teal: { bg: '#F0FDFA', icon: '#49A89A' },
        indigo: { bg: '#F0FDFA', icon: '#49A89A' },
      };
      grid.innerHTML = templates.map(t => {
        const tc = tmColorMap[t.color] || tmColorMap.gray;
        return \`
        <div class="p-4 border border-gray-200 rounded-xl hover:border-teal-300 transition-colors">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: \${tc.bg};">
              <i class="fas \${t.icon}" style="color: \${tc.icon};"></i>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">\${t.name}</h4>
              <p class="text-xs text-gray-500">系统模板</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 mb-3">\${t.description}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400"><i class="fas fa-file-alt mr-1"></i>标准条款</span>
            <button class="text-xs text-teal-600 hover:text-teal-700">查看详情</button>
          </div>
        </div>
      \`;
      }).join('');
    }
    
    function selectTemplate(id) {
      selectedTemplateId = id;
      renderTemplateGrid();
      // 更新选择提示
      const hint = document.getElementById('selectedTemplateHint');
      if (hint) {
        const template = templates.find(t => t.id === id);
        hint.innerHTML = template ? '<i class="fas fa-check-circle text-emerald-500 mr-1"></i><span class="text-emerald-600 font-medium">' + template.name + '</span>' : '请选择一个模板';
      }
    }
    
    async function createProject() {
      const name = document.getElementById('newProjectName').value.trim();
      const note = document.getElementById('newProjectNote').value.trim();
      
      if (!name) { showToast('warning', '请输入项目名称', '项目名称是必填项'); return; }
      if (!selectedTemplateId) { showToast('warning', '请选择行业模板', '请从下方模板列表中选择一个'); return; }
      
      let template;
      
      // 检查是系统模板还是自定义模板
      const customTemplate = customTemplates.find(t => t.id === selectedTemplateId);
      if (customTemplate) {
        template = customTemplate;
      } else {
        const res = await fetch('/api/templates/' + selectedTemplateId);
        template = await res.json();
      }
      
      const project = {
        id: 'proj_' + Date.now(),
        name,
        note,
        templateId: selectedTemplateId,
        isCustomTemplate: !!customTemplate,
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
      showToast('success', '项目创建成功', project.name + ' 已准备就绪');
      openProject(project.id);
    }
    
    // ==================== 协商页面 ====================
    async function openProject(id) {
      const project = projects.find(p => p.id === id);
      if (!project) return;
      
      currentProject = project;
      
      // 检查是系统模板还是自定义模板
      const customTemplate = customTemplates.find(t => t.id === project.templateId);
      if (customTemplate) {
        currentProject.template = customTemplate;
      } else {
        const res = await fetch('/api/templates/' + project.templateId);
        currentProject.template = await res.json();
      }
      
      showPage('pageNegotiation');
      
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
      showPage('pageProjects');
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
      document.getElementById('agentsView').classList.toggle('hidden', view !== 'agents');
      document.getElementById('btnCardView').className = view === 'card'
        ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow text-teal-600'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
      document.getElementById('btnFullView').className = view === 'full'
        ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow text-teal-600'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
      document.getElementById('btnAgentsView').className = view === 'agents'
        ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow text-teal-600'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
      
      // 渲染Agent卡片
      if (view === 'agents') {
        renderAgentExpertCards();
      }
    }
    
    // 渲染Agent专家卡片
    async function renderAgentExpertCards() {
      const container = document.getElementById('agentExpertCards');
      if (!container) return;
      
      try {
        const res = await fetch('/api/agents');
        const agents = await res.json();
        
        const bgColors = {
          'yellow': 'from-yellow-400 to-amber-500',
          'blue': 'from-blue-400 to-cyan-500',
          'orange': 'from-orange-400 to-red-500',
          'red': 'from-red-400 to-rose-500',
          'purple': 'from-cyan-400 to-teal-500',
          'green': 'from-green-400 to-emerald-500',
          'indigo': 'from-teal-400 to-emerald-500',
          'teal': 'from-teal-400 to-cyan-500',
          'gray': 'from-gray-400 to-slate-500'
        };
        
        container.innerHTML = agents.map(agent => \`
          <div class="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all border border-gray-100">
            <div class="flex items-start space-x-4">
              <div class="w-14 h-14 bg-gradient-to-br \${bgColors[agent.color] || 'from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center shadow-lg">
                <i class="fas \${agent.icon} text-white text-xl"></i>
              </div>
              <div class="flex-1">
                <h4 class="font-bold text-gray-900 mb-1">\${agent.name}</h4>
                <p class="text-sm text-gray-500 mb-3">\${agent.description}</p>
                <div class="flex flex-wrap gap-1">
                  \${agent.expertise.slice(0, 6).map(kw => \`
                    <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">\${kw}</span>
                  \`).join('')}
                  \${agent.expertise.length > 6 ? \`<span class="px-2 py-0.5 bg-teal-50 text-teal-600 rounded text-xs">+\${agent.expertise.length - 6}更多</span>\` : ''}
                </div>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span class="text-xs text-gray-400">
                <i class="fas fa-layer-group mr-1"></i>负责模块: \${agent.moduleIds.join(', ')}
              </span>
              <button onclick="testAgentRoute('\${agent.id}')" class="text-xs text-teal-600 hover:text-teal-700 flex items-center">
                <i class="fas fa-vial mr-1"></i>测试路由
              </button>
            </div>
          </div>
        \`).join('');
      } catch (e) {
        container.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-8"><i class="fas fa-exclamation-triangle text-2xl mb-2"></i><p>加载Agent列表失败</p></div>';
      }
    }
    
    // 测试Agent路由
    async function testAgentRoute(agentId) {
      const agent = agentColorMap[agentId];
      const testMessages = {
        'investment-revenue': '投资金额改成800万',
        'data-payment': '数据上报频率改为每周',
        'early-termination': '提前终止补偿金降低',
        'breach-liability': '违约金提高到25%',
        'prohibited-actions': '控制权变更需要提前通知',
        'guarantee': '取消品牌方连带担保',
        'store-info': '门店地址变更为新址',
        'dispute-resolution': '仲裁机构改为北京'
      };
      
      const testMessage = testMessages[agentId] || '测试输入';
      document.getElementById('negotiationInput').value = testMessage;
      document.getElementById('negotiationInput').focus();
      
      // 提示用户
      showToast('info', '测试输入已填入', '点击"发送变更"将由 ' + (agent?.name || agentId) + ' 处理此请求');
    }
    
    // ==================== 多Agent并行处理系统 ====================
    let activeAgentProcessing = false;
    let agentProcessingResults = null;
    
    // Agent颜色映射
    const agentColorMap = {
      'investment-revenue': { bg: 'yellow', icon: 'fa-coins', name: '投资分成专家' },
      'data-payment': { bg: 'blue', icon: 'fa-chart-line', name: '数据对账专家' },
      'early-termination': { bg: 'orange', icon: 'fa-door-open', name: '终止条款专家' },
      'breach-liability': { bg: 'red', icon: 'fa-gavel', name: '违约责任专家' },
      'prohibited-actions': { bg: 'purple', icon: 'fa-ban', name: '禁止行为专家' },
      'guarantee': { bg: 'indigo', icon: 'fa-shield-halved', name: '担保责任专家' },
      'store-info': { bg: 'teal', icon: 'fa-store', name: '门店资产专家' },
      'dispute-resolution': { bg: 'gray', icon: 'fa-balance-scale', name: '争议解决专家' }
    };
    
    // 存储智能联动分析结果，供确认使用
    let smartChangeResult = null;
    let pendingMessage = '';
    
    async function submitNegotiation() {
      const input = document.getElementById('negotiationInput');
      const message = input.value.trim();
      if (!message || !currentProject) return;
      
      const btn = document.getElementById('btnSubmit');
      btn.disabled = true;
      btn.classList.add('btn-loading');
      activeAgentProcessing = true;
      pendingMessage = message;
      
      // 显示智能分析面板
      showSmartChangeAnalysisPanel(message);
      
      try {
        // 使用SSE流式API，渐进式展示结果
        updateSmartChangeStatus('analyzing', '正在识别修改意图...');
        
        const res = await fetch('/api/agents/smart-change-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            templateId: currentProject.templateId,
            currentParams: currentProject.params,
            negotiationHistory: currentProject.negotiations,
            perspective: currentPerspective
          })
        });
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // 解析SSE事件
          const lines = buffer.split('\\n');
          buffer = lines.pop() || '';
          
          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.substring(7).trim();
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.substring(6));
                handleStreamEvent(currentEvent, data, message);
              } catch (e) {}
              currentEvent = '';
            }
          }
        }
        
        // 如果最终没有收到结果，视为失败
        if (!smartChangeResult) {
          updateSmartChangeStatus('error', '分析超时，请重试');
          setTimeout(() => hideSmartChangePanel(), 2000);
        }
      } catch (e) {
        console.error('Smart change analysis error:', e);
        updateSmartChangeStatus('error', '分析失败: ' + e.message);
        setTimeout(() => hideSmartChangePanel(), 2000);
      } finally {
        btn.disabled = false;
        btn.classList.remove('btn-loading');
        btn.innerHTML = '<i class="fas fa-paper-plane mr-1.5"></i>发送变更';
        activeAgentProcessing = false;
      }
    }
    
    // 处理SSE流事件 — 渐进式渲染
    function handleStreamEvent(event, data, message) {
      switch (event) {
        case 'status':
          // 状态更新
          if (data.phase === 1) {
            updateSmartChangeStatus('analyzing', data.message || '正在识别修改意图...');
          } else if (data.phase === 2) {
            updateSmartChangeStatus('phase2', data.message || '法律顾问审核 + 深度联动分析中...');
          }
          break;
          
        case 'phase1':
          // Phase 1 完成：立即展示直接修改 + 规则联动
          smartChangeResult = data;
          if (data.success && (data.primaryChanges?.length > 0 || data.inferredChanges?.length > 0)) {
            updateSmartChangeStatus('phase1-done', '已识别修改，正在进行法律审核...');
            showSmartChangeConfirmPanel(data, message);
            // 显示"法律审核中"指示器
            showPhase2LoadingIndicator();
          } else {
            updateSmartChangeStatus('no-changes', data.warnings?.length > 0 
              ? '提示: ' + cleanWarningText(data.warnings[0]) 
              : 'AI未能理解您的变动描述，请尝试更具体的表述');
            setTimeout(() => hideSmartChangePanel(), 3000);
          }
          break;
          
        case 'phase2':
          // Phase 2 完成：更新为最终结果（含法律条款 + 深层联动）
          smartChangeResult = data;
          updateSmartChangeStatus('confirm', '分析完成，请确认修改');
          showSmartChangeConfirmPanel(data, message);
          break;
          
        case 'complete':
          // 单次完整结果（fallback模式）
          smartChangeResult = data;
          if (data.success && (data.primaryChanges?.length > 0 || data.inferredChanges?.length > 0)) {
            updateSmartChangeStatus('confirm', '分析完成，请确认修改');
            showSmartChangeConfirmPanel(data, message);
          } else {
            updateSmartChangeStatus('no-changes', data.warnings?.length > 0 
              ? '提示: ' + cleanWarningText(data.warnings[0]) 
              : 'AI未能理解您的变动描述，请尝试更具体的表述');
            setTimeout(() => hideSmartChangePanel(), 3000);
          }
          break;
          
        case 'error':
          updateSmartChangeStatus('error', data.message || '分析失败');
          setTimeout(() => hideSmartChangePanel(), 2000);
          break;
      }
    }
    
    // Phase 2 加载指示器 — 告诉用户法律审核还在进行中
    function showPhase2LoadingIndicator() {
      const resultArea = document.getElementById('smartChangeResultArea');
      if (!resultArea) return;
      
      // 在结果区域顶部插入法律审核进度条
      const indicator = document.createElement('div');
      indicator.id = 'phase2Indicator';
      indicator.className = 'mb-4 p-3 bg-teal-50 rounded-xl border border-teal-200 animate-pulse';
      indicator.innerHTML = \`
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <i class="fas fa-spinner fa-spin text-teal-600 text-sm"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-teal-800">
              <i class="fas fa-gavel mr-1"></i>法律顾问审核中 + 深度联动分析中...
            </p>
            <p class="text-xs text-teal-500 mt-0.5">完成后将自动追加法律条款和更多关联修改建议</p>
          </div>
        </div>
      \`;
      resultArea.insertBefore(indicator, resultArea.firstChild);
    }
    
    // 显示智能联动分析面板
    function showSmartChangeAnalysisPanel(message) {
      let panel = document.getElementById('smartChangePanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'smartChangePanel';
        panel.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[200]';
        document.body.appendChild(panel);
      }
      
      panel.innerHTML = \`
        <div class="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
          <div class="p-6 bg-gradient-to-r from-violet-600 via-cyan-600 to-fuchsia-600">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <i class="fas fa-wand-magic-sparkles text-white text-xl"></i>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white">智能联动分析</h2>
                  <p class="text-sm text-white/70">AI分析 · 关联推断 · 确认修改</p>
                </div>
              </div>
              <button onclick="hideSmartChangePanel()" class="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          <!-- 用户输入 -->
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-violet-600 text-sm"></i>
              </div>
              <div class="flex-1">
                <p class="text-xs text-gray-500 mb-1">您的输入</p>
                <p class="text-gray-800 font-medium">\${escapeHtml(message)}</p>
              </div>
            </div>
          </div>
          
          <!-- 状态显示 -->
          <div class="px-6 py-4 border-b border-gray-100">
            <div id="smartChangeStatusArea" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                <i class="fas fa-spinner fa-spin text-violet-600"></i>
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-800">正在分析...</p>
                <p class="text-sm text-gray-500">智能识别直接修改和关联修改</p>
              </div>
            </div>
          </div>
          
          <!-- 结果区域 -->
          <div id="smartChangeResultArea" class="p-6 overflow-y-auto max-h-[55vh]">
            <div class="text-center text-gray-400 py-8">
              <i class="fas fa-wand-magic-sparkles text-4xl mb-3 opacity-50"></i>
              <p>正在分析中...</p>
            </div>
          </div>
          
          <!-- 操作按钮区域 -->
          <div id="smartChangeActions" class="hidden px-6 py-4 border-t border-gray-100 bg-gray-50">
            <!-- 动态填充 -->
          </div>
        </div>
      \`;
      
      panel.classList.remove('hidden');
    }
    
    // 更新状态
    function updateSmartChangeStatus(status, message) {
      const statusArea = document.getElementById('smartChangeStatusArea');
      if (!statusArea) return;
      
      const configs = {
        'analyzing': {
          icon: '<i class="fas fa-spinner fa-spin text-violet-600"></i>',
          bg: 'bg-violet-100',
          title: '正在分析...',
          desc: message
        },
        'phase1-done': {
          icon: '<i class="fas fa-check text-emerald-600"></i>',
          bg: 'bg-emerald-100',
          title: '已识别修改',
          desc: message
        },
        'phase2': {
          icon: '<i class="fas fa-spinner fa-spin text-teal-600"></i>',
          bg: 'bg-teal-100',
          title: '深度分析中...',
          desc: message
        },
        'confirm': {
          icon: '<i class="fas fa-check-circle text-emerald-600"></i>',
          bg: 'bg-emerald-100',
          title: '分析完成',
          desc: message
        },
        'no-changes': {
          icon: '<i class="fas fa-info-circle text-amber-600"></i>',
          bg: 'bg-amber-100',
          title: '未识别到修改',
          desc: message
        },
        'error': {
          icon: '<i class="fas fa-exclamation-circle text-red-600"></i>',
          bg: 'bg-red-100',
          title: '分析出错',
          desc: message
        }
      };
      
      const cfg = configs[status] || configs['analyzing'];
      statusArea.innerHTML = \`
        <div class="w-10 h-10 \${cfg.bg} rounded-full flex items-center justify-center">
          \${cfg.icon}
        </div>
        <div class="flex-1">
          <p class="font-medium text-gray-800">\${cfg.title}</p>
          <p class="text-sm text-gray-500">\${cfg.desc}</p>
        </div>
      \`;
    }
    
    // 显示智能联动确认面板
    function showSmartChangeConfirmPanel(result, originalMessage) {
      const resultArea = document.getElementById('smartChangeResultArea');
      const actionsArea = document.getElementById('smartChangeActions');
      
      if (!resultArea || !actionsArea) return;
      
      // 渲染结果
      let html = '';
      
      // AI理解
      if (result.understood) {
        html += \`
          <div class="mb-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
            <div class="flex items-start space-x-3">
              <i class="fas fa-robot text-violet-600 mt-1"></i>
              <div>
                <p class="text-sm font-medium text-violet-800 mb-1">AI理解</p>
                <p class="text-gray-700">\${escapeHtml(result.understood)}</p>
                \${result.analysisExplanation ? \`<p class="text-sm text-gray-500 mt-2">\${escapeHtml(result.analysisExplanation)}</p>\` : ''}
              </div>
            </div>
          </div>
        \`;
      }
      
      // 法律顾问转化信息（V3新增）
      // 只有真正产出有价值内容才显示（有完善建议或有真实风险分析）
      const legalHasRealContent = result.legalTransform?.enabled && (
        (result.legalTransform.clauseRecommendations?.length > 0) ||
        (result.legalTransform.riskWarnings?.length > 0 && !result.legalTransform.riskWarnings.some(w => w.includes('无法解析'))) ||
        (result.legalTransform.legalSummary && !result.legalTransform.legalSummary.includes('未能生成') && !result.legalTransform.legalSummary.includes('不可用'))
      );
      if (legalHasRealContent) {
        html += \`
          <div class="mb-6 p-4 bg-teal-50 rounded-xl border border-teal-200">
            <div class="flex items-start space-x-3">
              <div class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-balance-scale text-teal-600"></i>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-teal-800 mb-1">
                  <i class="fas fa-gavel mr-1"></i>法律顾问审核
                </p>
                \${result.legalTransform.legalSummary ? \`<p class="text-gray-700 mb-2">\${escapeHtml(result.legalTransform.legalSummary)}</p>\` : ''}
                \${result.legalTransform.clauseRecommendations?.length > 0 ? \`
                  <div class="mt-2 p-2 bg-white/50 rounded-lg">
                    <p class="text-xs font-medium text-teal-700 mb-1"><i class="fas fa-lightbulb mr-1"></i>条款完善建议：</p>
                    <ul class="text-xs text-teal-600 space-y-1">
                      \${result.legalTransform.clauseRecommendations.map(r => \`<li class="flex items-start"><i class="fas fa-check-circle mr-1 mt-0.5"></i>\${escapeHtml(r)}</li>\`).join('')}
                    </ul>
                  </div>
                \` : ''}
                \${result.legalTransform.riskWarnings?.length > 0 ? \`
                  <div class="mt-2 p-2 bg-red-50 rounded-lg">
                    <p class="text-xs font-medium text-red-700 mb-1"><i class="fas fa-exclamation-triangle mr-1"></i>法律风险提示：</p>
                    <ul class="text-xs text-red-600 space-y-1">
                      \${result.legalTransform.riskWarnings.map(w => \`<li>\${escapeHtml(cleanWarningText(w))}</li>\`).join('')}
                    </ul>
                  </div>
                \` : ''}
              </div>
            </div>
          </div>
        \`;
      }
      
      // 直接修改（Primary Changes）
      if (result.primaryChanges?.length > 0) {
        html += \`
          <div class="mb-6">
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-bullseye text-emerald-600"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800">直接修改</h3>
                <p class="text-xs text-gray-500">您明确要求的修改，默认选中</p>
              </div>
              <span class="ml-auto px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                \${result.primaryChanges.length} 项
              </span>
            </div>
            <div class="space-y-3">
              \${result.primaryChanges.map((c, i) => renderSmartChangeItem(c, 'primary', i)).join('')}
            </div>
          </div>
        \`;
      }
      
      // 推断修改（Inferred Changes）
      if (result.inferredChanges?.length > 0) {
        html += \`
          <div class="mb-4">
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-lightbulb text-amber-600"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800">关联修改建议</h3>
                <p class="text-xs text-gray-500">AI推断可能需要联动调整的相关条款，请勾选确认</p>
              </div>
              <span class="ml-auto px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                \${result.inferredChanges.length} 项
              </span>
            </div>
            <div class="space-y-3">
              \${result.inferredChanges.map((c, i) => renderSmartChangeItem(c, 'inferred', i)).join('')}
            </div>
          </div>
        \`;
      }
      
      // 警告信息
      if (result.warnings?.length > 0) {
        html += \`
          <div class="p-4 bg-red-50 rounded-xl border border-red-200">
            <div class="flex items-start space-x-3">
              <i class="fas fa-exclamation-triangle text-red-600 mt-1"></i>
              <div>
                <p class="text-sm font-medium text-red-800 mb-1">风险提示</p>
                \${result.warnings.map(w => \`<p class="text-sm text-red-700">\${escapeHtml(cleanWarningText(w))}</p>\`).join('')}
              </div>
            </div>
          </div>
        \`;
      }
      
      resultArea.innerHTML = html;
      
      // 操作按钮
      actionsArea.innerHTML = \`
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            <span id="selectedCount">已选 <strong>\${result.primaryChanges?.length || 0}</strong> 项直接修改，<strong>0</strong> 项关联修改</span>
          </div>
          <div class="flex space-x-3">
            <button onclick="hideSmartChangePanel()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              取消
            </button>
            <button onclick="confirmSmartChanges()" class="px-6 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg hover:from-violet-700 hover:to-cyan-700 transition shadow-lg">
              <i class="fas fa-check mr-2"></i>确认修改
            </button>
          </div>
        </div>
      \`;
      actionsArea.classList.remove('hidden');
    }
    
    // 渲染单个修改项
    function renderSmartChangeItem(change, type, index) {
      const isInferred = type === 'inferred';
      const checked = change.selected !== false;
      const bgColor = isInferred ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';
      const checkColor = isInferred ? 'text-amber-600' : 'text-emerald-600';
      
      // 置信度标签
      let confidenceBadge = '';
      if (isInferred && change.confidence) {
        const confColors = {
          'high': 'bg-emerald-100 text-emerald-700',
          'medium': 'bg-amber-100 text-amber-700',
          'low': 'bg-gray-100 text-gray-600'
        };
        const confLabels = { 'high': '高', 'medium': '中', 'low': '低' };
        confidenceBadge = \`<span class="px-2 py-0.5 \${confColors[change.confidence] || confColors.medium} rounded text-xs">置信度：\${confLabels[change.confidence] || '中'}</span>\`;
      }
      
      // 分类标签
      let categoryBadge = '';
      if (change.category) {
        const categoryLabels = {
          'unit_conversion': '单位换算',
          'calculation_method': '计算方式',
          'formula_update': '公式更新',
          'related_term': '关联条款'
        };
        categoryBadge = \`<span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">\${categoryLabels[change.category] || change.category}</span>\`;
      }
      
      // 法律条款显示（V3新增）
      let legalClauseHtml = '';
      if (change.legalClauseText) {
        legalClauseHtml = \`
          <div class="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
            <div class="flex items-center mb-2">
              <i class="fas fa-gavel text-teal-600 mr-2 text-sm"></i>
              <span class="text-xs font-semibold text-teal-700">法律条款语言</span>
              \${change.legalReview?.reviewed ? \`<span class="ml-auto px-2 py-0.5 bg-teal-100 text-teal-600 rounded text-xs"><i class="fas fa-check-circle mr-1"></i>已审核</span>\` : ''}
            </div>
            <p class="text-sm text-teal-900 leading-relaxed">\${escapeHtml(change.legalClauseText)}</p>
            \${change.legalNotes?.length > 0 ? \`
              <div class="mt-2 pt-2 border-t border-teal-100">
                <p class="text-xs text-teal-600 font-medium mb-1"><i class="fas fa-sticky-note mr-1"></i>法律注意事项：</p>
                <ul class="text-xs text-teal-500 space-y-0.5">
                  \${change.legalNotes.map(n => \`<li class="flex items-start"><span class="mr-1">•</span>\${escapeHtml(n)}</li>\`).join('')}
                </ul>
              </div>
            \` : ''}
            \${change.legalReview?.legalScore ? \`
              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-teal-500">法律规范性评分</span>
                <span class="font-semibold \${change.legalReview.legalScore >= 80 ? 'text-emerald-600' : change.legalReview.legalScore >= 60 ? 'text-amber-600' : 'text-red-600'}">\${change.legalReview.legalScore}/100</span>
              </div>
            \` : ''}
          </div>
        \`;
      }
      
      // 用户原始表达
      let originalExpressionHtml = '';
      if (change.originalExpression && change.legalClauseText) {
        originalExpressionHtml = \`
          <div class="text-xs text-gray-400 mt-2 flex items-center">
            <i class="fas fa-comment mr-1"></i>
            <span>您的表达："\${escapeHtml(change.originalExpression)}"</span>
          </div>
        \`;
      }
      
      return \`
        <div class="p-4 \${bgColor} rounded-xl border transition-all hover:shadow-md" data-change-type="\${type}" data-index="\${index}">
          <div class="flex items-start">
            <label class="flex items-center cursor-pointer mr-3 mt-1">
              <input type="checkbox" 
                     \${checked ? 'checked' : ''} 
                     onchange="toggleSmartChange('\${type}', \${index}, this.checked)"
                     class="\${checkColor} rounded border-gray-300 focus:ring-violet-500"
                     style="width:20px;height:20px;flex-shrink:0;">
            </label>
            <div class="flex-1">
              <div class="flex items-center flex-wrap gap-2 mb-2">
                <span class="font-semibold text-gray-800">\${escapeHtml(change.paramName || change.key)}</span>
                \${confidenceBadge}
                \${categoryBadge}
                \${change.legalReview?.reviewed ? '<span class="px-2 py-0.5 bg-teal-100 text-teal-600 rounded text-xs"><i class="fas fa-balance-scale mr-1"></i>法律审核</span>' : ''}
              </div>
              <div class="flex items-center text-sm mb-2">
                <span class="text-gray-500 line-through mr-2">\${escapeHtml(change.oldValue || '-')}</span>
                <i class="fas fa-arrow-right text-gray-400 mx-2"></i>
                <span class="font-semibold text-emerald-600">\${escapeHtml(change.newValue)}</span>
              </div>
              \${change.clauseText && !change.legalClauseText ? \`<p class="text-sm text-gray-600 bg-white/50 rounded p-2 mb-2">\${escapeHtml(change.clauseText)}</p>\` : ''}
              \${legalClauseHtml}
              \${originalExpressionHtml}
              \${change.reason ? \`
                <div class="flex items-start text-sm text-gray-500 mt-2">
                  <i class="fas fa-info-circle mr-2 mt-0.5 text-amber-500"></i>
                  <span>\${escapeHtml(change.reason)}</span>
                </div>
              \` : ''}
              \${change.relatedTo ? \`
                <div class="text-xs text-gray-400 mt-1">
                  <i class="fas fa-link mr-1"></i>关联自：\${escapeHtml(change.relatedTo)}
                </div>
              \` : ''}
            </div>
          </div>
        </div>
      \`;
    }
    
    // 切换修改项选中状态
    function toggleSmartChange(type, index, checked) {
      if (!smartChangeResult) return;
      
      const list = type === 'primary' ? smartChangeResult.primaryChanges : smartChangeResult.inferredChanges;
      if (list && list[index]) {
        list[index].selected = checked;
      }
      
      updateSelectedCount();
    }
    
    // 更新选中计数
    function updateSelectedCount() {
      if (!smartChangeResult) return;
      
      const primarySelected = (smartChangeResult.primaryChanges || []).filter(c => c.selected !== false).length;
      const inferredSelected = (smartChangeResult.inferredChanges || []).filter(c => c.selected === true).length;
      
      const countEl = document.getElementById('selectedCount');
      if (countEl) {
        countEl.innerHTML = \`已选 <strong>\${primarySelected}</strong> 项直接修改，<strong>\${inferredSelected}</strong> 项关联修改\`;
      }
    }
    
    // 确认智能修改
    async function confirmSmartChanges() {
      if (!smartChangeResult || !currentProject) return;
      
      const confirmedPrimary = (smartChangeResult.primaryChanges || []).filter(c => c.selected !== false);
      const confirmedInferred = (smartChangeResult.inferredChanges || []).filter(c => c.selected === true);
      
      const allConfirmed = [...confirmedPrimary, ...confirmedInferred];
      
      if (allConfirmed.length === 0) {
        showToast('warning', '请至少选择一项修改', '勾选您想要应用的变更项');
        return;
      }
      
      // 创建协商记录（V3增强：包含法律信息）
      const negotiation = {
        id: 'neg_' + Date.now(),
        input: pendingMessage,
        understood: smartChangeResult.understood,
        changes: allConfirmed.map(c => ({
          paramKey: c.key,
          paramName: c.paramName,
          moduleName: c.paramName || '条款修改',
          oldValue: c.oldValue,
          newValue: c.newValue,
          clauseText: c.clauseText,
          changeType: c.changeType,
          confidence: c.confidence,
          reason: c.reason,
          category: c.category,
          // V3新增：法律信息
          originalExpression: c.originalExpression,
          legalClauseText: c.legalClauseText,
          legalNotes: c.legalNotes,
          legalReview: c.legalReview
        })),
        smartChangeMode: true,
        primaryCount: confirmedPrimary.length,
        inferredCount: confirmedInferred.length,
        analysisExplanation: smartChangeResult.analysisExplanation,
        warnings: smartChangeResult.warnings,
        perspective: currentPerspective,
        timestamp: new Date().toISOString(),
        // V3新增：法律顾问转化信息
        legalTransform: smartChangeResult.legalTransform
      };
      currentProject.negotiations.push(negotiation);
      
      // 更新参数
      for (const change of allConfirmed) {
        currentProject.params[change.key] = change.newValue;
      }
      
      currentProject.updatedAt = new Date().toISOString();
      saveProjects();
      
      // 关闭面板并更新UI
      hideSmartChangePanel();
      document.getElementById('negotiationInput').value = '';
      renderNegotiationHistory();
      renderModuleCards();
      renderContractText();
      updateChangedBadge();
      
      // 显示成功提示
      showToast('success', '修改已应用', \`成功应用 \${confirmedPrimary.length} 项直接修改\${confirmedInferred.length > 0 ? \`，\${confirmedInferred.length} 项关联修改\` : ''}\`);
    }
    
    // 隐藏智能联动面板
    function hideSmartChangePanel() {
      const panel = document.getElementById('smartChangePanel');
      if (panel) {
        panel.classList.add('hidden');
      }
      smartChangeResult = null;
      pendingMessage = '';
    }
    
    // 回退到单一解析模式（保留兼容）
    async function fallbackToSingleParse(message, input) {
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
        
        hideSmartChangePanel();
        input.value = '';
        renderNegotiationHistory();
        renderModuleCards();
        renderContractText();
        updateChangedBadge();
      } else {
        updateSmartChangeStatus('no-changes', 'AI未能理解您的变动描述，请尝试更具体的表述');
        setTimeout(() => hideSmartChangePanel(), 3000);
      }
    }
    
    // 显示多Agent处理面板
    function showMultiAgentProcessingPanel(message) {
      // 检查是否已存在面板
      let panel = document.getElementById('multiAgentPanel');
      if (!panel) {
        // 创建面板
        panel = document.createElement('div');
        panel.id = 'multiAgentPanel';
        panel.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[200]';
        panel.innerHTML = \`
          <div class="bg-white rounded-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="p-6 bg-gradient-to-r from-teal-600 via-cyan-600 to-pink-600">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-robot text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-white">多Agent并行处理</h2>
                    <p class="text-sm text-white/70">智能路由 · 专家协作 · 并行执行</p>
                  </div>
                </div>
                <button onclick="hideMultiAgentProcessingPanel()" class="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <!-- 用户输入展示 -->
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-user text-teal-600 text-sm"></i>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-500 mb-1">您的输入</p>
                  <p id="agentPanelInput" class="text-gray-800 font-medium">\${escapeHtml(message)}</p>
                </div>
              </div>
            </div>
            
            <!-- 处理状态 -->
            <div class="px-6 py-4 border-b border-gray-100">
              <div class="flex items-center space-x-3">
                <div id="agentStatusIcon" class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-spinner fa-spin text-teal-600"></i>
                </div>
                <div class="flex-1">
                  <p id="agentStatusTitle" class="font-medium text-gray-800">初始化中...</p>
                  <p id="agentStatusDesc" class="text-sm text-gray-500">正在连接AI系统</p>
                </div>
                <div id="agentStatusBadge" class="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                  处理中
                </div>
              </div>
            </div>
            
            <!-- Agent卡片区域 -->
            <div id="agentCardsContainer" class="p-6 overflow-y-auto max-h-[50vh]">
              <div class="text-center text-gray-400 py-8">
                <i class="fas fa-cogs text-4xl mb-3 opacity-50"></i>
                <p>等待Agent分配...</p>
              </div>
            </div>
            
            <!-- 处理结果汇总 -->
            <div id="agentResultsSummary" class="hidden px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <!-- 动态填充 -->
            </div>
          </div>
        \`;
        document.body.appendChild(panel);
      } else {
        // 更新输入内容
        const inputEl = document.getElementById('agentPanelInput');
        if (inputEl) inputEl.textContent = message;
        panel.classList.remove('hidden');
      }
    }
    
    // 隐藏多Agent处理面板
    function hideMultiAgentProcessingPanel() {
      const panel = document.getElementById('multiAgentPanel');
      if (panel) {
        panel.classList.add('hidden');
      }
    }
    
    // 更新Agent面板状态
    function updateAgentPanelStatus(status, message, data) {
      const icon = document.getElementById('agentStatusIcon');
      const title = document.getElementById('agentStatusTitle');
      const desc = document.getElementById('agentStatusDesc');
      const badge = document.getElementById('agentStatusBadge');
      
      const statusConfig = {
        'routing': {
          icon: '<i class="fas fa-route text-blue-600"></i>',
          iconBg: 'bg-blue-100',
          title: '智能路由分析',
          badge: '分析中',
          badgeBg: 'bg-blue-100 text-blue-700'
        },
        'matched': {
          icon: '<i class="fas fa-check-circle text-emerald-600"></i>',
          iconBg: 'bg-emerald-100',
          title: 'Agent匹配完成',
          badge: '已匹配',
          badgeBg: 'bg-emerald-100 text-emerald-700'
        },
        'processing': {
          icon: '<i class="fas fa-cogs fa-spin text-cyan-600"></i>',
          iconBg: 'bg-cyan-100',
          title: '并行处理中',
          badge: '执行中',
          badgeBg: 'bg-cyan-100 text-cyan-700'
        },
        'completed': {
          icon: '<i class="fas fa-check-double text-emerald-600"></i>',
          iconBg: 'bg-emerald-100',
          title: '处理完成',
          badge: '成功',
          badgeBg: 'bg-emerald-500 text-white'
        },
        'no-changes': {
          icon: '<i class="fas fa-info-circle text-amber-600"></i>',
          iconBg: 'bg-amber-100',
          title: '处理完成（无变更）',
          badge: '无变更',
          badgeBg: 'bg-amber-100 text-amber-700'
        },
        'fallback': {
          icon: '<i class="fas fa-sync text-gray-600"></i>',
          iconBg: 'bg-gray-100',
          title: '回退模式',
          badge: '备用',
          badgeBg: 'bg-gray-100 text-gray-700'
        },
        'error': {
          icon: '<i class="fas fa-exclamation-triangle text-red-600"></i>',
          iconBg: 'bg-red-100',
          title: '处理失败',
          badge: '错误',
          badgeBg: 'bg-red-100 text-red-700'
        }
      };
      
      const config = statusConfig[status] || statusConfig['processing'];
      
      if (icon) {
        icon.innerHTML = config.icon;
        icon.className = 'w-10 h-10 rounded-full flex items-center justify-center ' + config.iconBg;
      }
      if (title) title.textContent = config.title;
      if (desc) desc.textContent = message;
      if (badge) {
        badge.textContent = config.badge;
        badge.className = 'px-3 py-1 rounded-full text-sm ' + config.badgeBg;
      }
    }
    
    // 显示Agent处理卡片
    function showAgentProcessingCards(agentIds) {
      const container = document.getElementById('agentCardsContainer');
      if (!container) return;
      
      container.innerHTML = \`
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-3">
            <i class="fas fa-users-cog mr-2 text-teal-600"></i>
            正在调用 \${agentIds.length} 个专业Agent并行处理
          </h4>
          <div class="grid grid-cols-2 gap-3">
            \${agentIds.map(agentId => {
              const agentInfo = agentColorMap[agentId] || { bg: 'gray', icon: 'fa-robot', name: agentId };
              return \`
                <div id="agentCard_\${agentId}" class="agent-card p-4 border-2 border-\${agentInfo.bg}-200 rounded-xl bg-\${agentInfo.bg}-50/50 transition-all">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-\${agentInfo.bg}-100 rounded-lg flex items-center justify-center">
                      <i class="fas \${agentInfo.icon} text-\${agentInfo.bg}-600"></i>
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-gray-800">\${agentInfo.name}</p>
                      <p class="text-xs text-gray-500" id="agentStatus_\${agentId}">
                        <i class="fas fa-spinner fa-spin mr-1"></i>处理中...
                      </p>
                    </div>
                    <div id="agentBadge_\${agentId}" class="w-6 h-6 bg-\${agentInfo.bg}-200 rounded-full flex items-center justify-center">
                      <i class="fas fa-ellipsis-h text-\${agentInfo.bg}-600 text-xs"></i>
                    </div>
                  </div>
                  <div id="agentResult_\${agentId}" class="hidden mt-3 pt-3 border-t border-\${agentInfo.bg}-200">
                    <!-- 处理结果 -->
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        </div>
        <div class="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100">
          <div class="flex items-center space-x-2 text-sm text-teal-700">
            <i class="fas fa-info-circle"></i>
            <span>多Agent并行架构：各专家同时处理，提高效率并确保专业性</span>
          </div>
        </div>
      \`;
    }
    
    // 显示Agent处理结果
    function showAgentProcessingResults(result) {
      // 更新各Agent卡片状态
      if (result.agentDetails) {
        result.agentDetails.forEach(agent => {
          const statusEl = document.getElementById('agentStatus_' + agent.agentId);
          const badgeEl = document.getElementById('agentBadge_' + agent.agentId);
          const resultEl = document.getElementById('agentResult_' + agent.agentId);
          const cardEl = document.getElementById('agentCard_' + agent.agentId);
          
          if (statusEl) {
            if (agent.success) {
              statusEl.innerHTML = \`<i class="fas fa-check text-emerald-600 mr-1"></i>\${agent.changes?.length || 0}项建议 · \${agent.processingTime}ms\`;
            } else {
              statusEl.innerHTML = '<i class="fas fa-times text-red-600 mr-1"></i>处理失败';
            }
          }
          
          if (badgeEl) {
            if (agent.success) {
              badgeEl.innerHTML = '<i class="fas fa-check text-white text-xs"></i>';
              badgeEl.className = 'w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center';
            } else {
              badgeEl.innerHTML = '<i class="fas fa-times text-white text-xs"></i>';
              badgeEl.className = 'w-6 h-6 bg-red-500 rounded-full flex items-center justify-center';
            }
          }
          
          if (resultEl && agent.success && agent.changes?.length > 0) {
            resultEl.classList.remove('hidden');
            resultEl.innerHTML = agent.changes.map(c => \`
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-600">\${c.paramName}</span>
                <div>
                  <span class="text-gray-400 line-through mr-2">\${c.oldValue}</span>
                  <span class="text-emerald-600 font-medium">\${c.newValue}</span>
                </div>
              </div>
            \`).join('');
          }
          
          if (cardEl && agent.success) {
            cardEl.classList.add('border-emerald-300');
          }
        });
      }
      
      // 显示结果汇总
      const summaryEl = document.getElementById('agentResultsSummary');
      if (summaryEl) {
        summaryEl.classList.remove('hidden');
        summaryEl.innerHTML = \`
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex items-center text-emerald-700">
                <i class="fas fa-check-circle mr-2"></i>
                <span class="font-medium">\${result.changes?.length || 0} 项变更</span>
              </div>
              <div class="flex items-center text-teal-700">
                <i class="fas fa-robot mr-2"></i>
                <span>\${result.stats?.respondedAgents || 0}/\${result.stats?.totalAgents || 0} Agent响应</span>
              </div>
              <div class="flex items-center text-cyan-700">
                <i class="fas fa-clock mr-2"></i>
                <span>耗时 \${result.stats?.totalTime || 0}ms</span>
              </div>
            </div>
            <div class="text-sm text-gray-500">
              \${result.warnings?.length > 0 ? '<i class="fas fa-exclamation-triangle text-amber-500 mr-1"></i>' + result.warnings.length + ' 项提醒' : ''}
            </div>
          </div>
          \${result.suggestions?.length > 0 ? \`
            <div class="mt-3 pt-3 border-t border-emerald-200">
              <p class="text-sm text-emerald-700"><i class="fas fa-lightbulb mr-2"></i>建议：\${result.suggestions[0]}</p>
            </div>
          \` : ''}
        \`;
      }
    }
    
    // HTML转义
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // 清理警告文本：去掉各种前缀标签，保持文本自然通顺
    function cleanWarningText(w) {
      if (typeof w !== 'string') return typeof w === 'object' ? JSON.stringify(w) : String(w);
      let text = w;
      // 去掉 [xxx] 前缀（如 [投资分成专家]）
      text = text.replace(/^\[.*?\]\s*/, '');
      // 去掉 【xxx】 前缀（如 【资金缺口风险】）
      text = text.replace(/^【.*?】\s*/, '');
      // 去掉开头的"警告："或"提示："
      text = text.replace(/^(警告|提示|注意)[：:]\s*/, '');
      return text;
    }
    
    function quickInput(text) {
      document.getElementById('negotiationInput').value = text;
      document.getElementById('negotiationInput').focus();
    }
    
    function renderNegotiationHistory() {
      const container = document.getElementById('negotiationHistory');
      const negotiations = currentProject?.negotiations || [];
      
      document.getElementById('negotiationCount').textContent = negotiations.length;
      
      // 检查currentVersionInfo是否存在
      const versionInfoEl = document.getElementById('currentVersionInfo');
      if (versionInfoEl) {
        versionInfoEl.textContent = negotiations.length + '轮协商';
      }
      
      if (negotiations.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8"><i class="fas fa-comments text-4xl mb-3 opacity-50"></i><p class="text-sm">开始协商</p><p class="text-xs mt-1">输入变动内容，AI将自动解析并更新合同</p></div>';
        return;
      }
      
      container.innerHTML = negotiations.slice().reverse().map((n, i) => {
        const pIcon = n.perspective === 'investor' ? 'fa-landmark' : 'fa-store';
        const pColor = n.perspective === 'investor' ? 'teal' : 'amber';
        const pText = n.perspective === 'investor' ? '投资方' : '融资方';
        
        // 检查是否有多Agent处理信息
        const hasAgentDetails = n.agentDetails && n.agentDetails.length > 0;
        const agentCount = hasAgentDetails ? n.agentDetails.length : 0;
        const respondedAgents = hasAgentDetails ? n.agentDetails.filter(a => a.success).length : 0;
        
        // 检查是否是智能联动模式
        const isSmartChange = n.smartChangeMode === true;
        const primaryCount = n.primaryCount || 0;
        const inferredCount = n.inferredCount || 0;
        
        return \`
          <div class="negotiation-item bg-gray-50 rounded-xl p-4 animate-in relative group \${isSmartChange ? 'border-l-4 border-violet-400' : ''}">
            <!-- 删除按钮（悬停显示） -->
            <button onclick="showDeleteNegotiationModal('\${n.id}')" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white hover:bg-red-50 rounded-lg border border-gray-200 shadow-sm" title="删除此协商记录">
              <i class="fas fa-trash-alt text-red-400 hover:text-red-600 text-xs"></i>
            </button>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2 flex-wrap gap-1">
                <span class="w-6 h-6 rounded-full bg-\${pColor}-100 flex items-center justify-center">
                  <i class="fas \${pIcon} text-\${pColor}-600 text-xs"></i>
                </span>
                <span class="text-xs text-\${pColor}-600 font-medium">\${pText}</span>
                <span class="change-badge">#\${negotiations.length - i}</span>
                \${n.isDirectEdit ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs"><i class="fas fa-pen mr-1"></i>直接编辑</span>' : ''}
                \${isSmartChange ? \`
                  <span class="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center">
                    <i class="fas fa-wand-magic-sparkles mr-1"></i>智能联动
                  </span>
                  \${primaryCount > 0 ? \`<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">\${primaryCount}直接</span>\` : ''}
                  \${inferredCount > 0 ? \`<span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">\${inferredCount}联动</span>\` : ''}
                \` : (hasAgentDetails ? \`
                  <span class="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs flex items-center">
                    <i class="fas fa-robot mr-1"></i>\${respondedAgents} Agent
                  </span>
                \` : '')}
              </div>
              <span class="text-xs text-gray-400 mr-6">\${formatTime(n.timestamp)}</span>
            </div>
            <p class="text-sm text-gray-800 mb-2">"\${n.input}"</p>
            
            \${isSmartChange && n.analysisExplanation ? \`
              <div class="bg-violet-50 rounded-lg p-2 mb-3 border border-violet-100">
                <p class="text-xs text-violet-700"><i class="fas fa-brain mr-1"></i>\${n.analysisExplanation}</p>
              </div>
            \` : ''}
            
            \${hasAgentDetails ? \`
              <!-- 多Agent处理详情展开/收起 -->
              <div class="mb-3">
                <button onclick="toggleAgentDetails('\${n.id}')" class="text-xs text-teal-600 hover:text-teal-700 flex items-center">
                  <i class="fas fa-chevron-down mr-1" id="agentDetailsIcon_\${n.id}"></i>
                  查看Agent处理详情 (\${n.processingStats?.totalTime || 0}ms)
                </button>
                <div id="agentDetails_\${n.id}" class="hidden mt-2 p-3 bg-white rounded-lg border border-teal-100">
                  <div class="grid grid-cols-2 gap-2">
                    \${n.agentDetails.map(agent => {
                      const agentInfo = agentColorMap[agent.agentId] || { bg: 'gray', icon: 'fa-robot', name: agent.agentName };
                      return \`
                        <div class="p-2 rounded-lg bg-\${agentInfo.bg}-50 border border-\${agentInfo.bg}-100">
                          <div class="flex items-center space-x-2 mb-1">
                            <i class="fas \${agentInfo.icon} text-\${agentInfo.bg}-600 text-xs"></i>
                            <span class="text-xs font-medium text-gray-700">\${agent.agentName}</span>
                            \${agent.success 
                              ? '<i class="fas fa-check-circle text-emerald-500 text-xs ml-auto"></i>'
                              : '<i class="fas fa-times-circle text-red-500 text-xs ml-auto"></i>'
                            }
                          </div>
                          <p class="text-xs text-gray-500">\${agent.changes?.length || 0}项变更 · \${agent.processingTime || 0}ms</p>
                        </div>
                      \`;
                    }).join('')}
                  </div>
                </div>
              </div>
            \` : ''}
            
            <div class="space-y-2">
              \${n.changes.map(c => {
                const isInferred = c.changeType === 'inferred';
                const borderColor = isInferred ? 'border-amber-200' : 'border-gray-100';
                const bgColor = isInferred ? 'bg-amber-50' : 'bg-white';
                const categoryLabels = {
                  'unit_conversion': '单位换算',
                  'calculation_method': '计算方式',
                  'formula_update': '公式更新',
                  'related_term': '关联条款'
                };
                return \`
                  <div class="\${bgColor} rounded-lg p-2 border \${borderColor}">
                    <div class="flex items-center text-xs text-gray-500 mb-1">
                      <i class="fas fa-folder-open mr-1"></i>\${c.moduleName || c.paramName || '条款修改'}
                      \${isInferred ? \`
                        <span class="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">
                          <i class="fas fa-link mr-0.5"></i>联动修改
                        </span>
                        \${c.category ? \`<span class="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">\${categoryLabels[c.category] || c.category}</span>\` : ''}
                      \` : ''}
                    </div>
                    <div class="flex items-center text-sm">
                      <span class="text-gray-600">\${c.paramName}:</span>
                      <span class="value-old ml-2">\${c.oldValue}</span>
                      <i class="fas fa-arrow-right mx-2 text-emerald-500 text-xs"></i>
                      <span class="value-changed">\${c.newValue}</span>
                    </div>
                    \${c.reason ? \`<p class="text-xs text-gray-400 mt-1"><i class="fas fa-info-circle mr-1"></i>\${c.reason}</p>\` : ''}
                  </div>
                \`;
              }).join('')}
              
              \${n.suggestions?.length > 0 ? \`
                <div class="bg-teal-50 rounded-lg p-2 border border-teal-100">
                  <p class="text-xs text-teal-700"><i class="fas fa-lightbulb mr-1"></i>\${n.suggestions[0]}</p>
                </div>
              \` : (n.suggestion ? \`<div class="bg-amber-50 rounded-lg p-2 border border-amber-100"><p class="text-xs text-amber-700"><i class="fas fa-lightbulb mr-1"></i>\${n.suggestion}</p></div>\` : '')}
              
              \${n.warnings?.length > 0 ? \`
                <div class="bg-red-50 rounded-lg p-2 border border-red-100">
                  <p class="text-xs text-red-700"><i class="fas fa-exclamation-triangle mr-1"></i>\${escapeHtml(cleanWarningText(n.warnings[0]))}</p>
                </div>
              \` : ''}
            </div>
          </div>
        \`;
      }).join('');
    }
    
    // 切换Agent详情展开/收起
    function toggleAgentDetails(negId) {
      const detailsEl = document.getElementById('agentDetails_' + negId);
      const iconEl = document.getElementById('agentDetailsIcon_' + negId);
      if (detailsEl && iconEl) {
        detailsEl.classList.toggle('hidden');
        iconEl.classList.toggle('fa-chevron-down');
        iconEl.classList.toggle('fa-chevron-up');
      }
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
                <div class="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mr-3">
                  <i class="fas \${module.icon} text-teal-600 text-xl"></i>
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
                const escapedNote = (clause.note || '').replace(/'/g, "\\\\'").replace(/"/g, "&quot;");
                
                if (change) {
                  return \`
                    <div class="bg-emerald-50 rounded-lg p-3 border-l-4 border-emerald-500 cursor-pointer hover:bg-emerald-100 transition-colors" onclick="showEditParamModal('\${clause.key}', '\${clause.name}', '\${change.newValue}', '\${escapedNote}')" title="点击编辑">
                      <div class="flex items-center justify-between">
                        <span class="text-gray-700 font-medium flex items-center">\${clause.name} <i class="fas fa-pen text-emerald-400 text-xs ml-2 opacity-50"></i></span>
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
                    <div class="flex items-center justify-between py-2 border-b border-gray-50 cursor-pointer hover:bg-teal-50 rounded-lg px-2 -mx-2 transition-colors" onclick="showEditParamModal('\${clause.key}', '\${clause.name}', '\${currentValue}', '\${escapedNote}')" title="点击编辑">
                      <span class="text-gray-600 flex items-center">\${clause.name} <i class="fas fa-pen text-gray-300 text-xs ml-2 opacity-0 group-hover:opacity-100"></i></span>
                      <span class="font-semibold text-teal-600 flex items-center">\${currentValue} <i class="fas fa-edit text-teal-300 text-xs ml-2"></i></span>
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
          <h1 class="text-2xl font-bold text-gray-900">收益分成合作协议</h1>
          <p class="text-gray-500 mt-2">\${currentProject.name}</p>
          <p class="text-sm text-gray-400 mt-1">\${template.name} · \${formatDate(currentProject.createdAt)}</p>
        </div>
        \${template.fullText.map(section => {
          const hasChanges = sectionHasChanges(section);
          return \`
            <div id="section-\${section.id}" class="contract-section mb-8 p-5 rounded-xl border \${hasChanges ? 'has-changes border-emerald-200' : 'border-gray-100'}">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                  <span class="w-10 h-10 rounded-xl \${hasChanges ? 'bg-emerald-500' : 'bg-teal-500'} text-white flex items-center justify-center text-sm font-bold mr-3">\${section.number}</span>
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
      showToast('success', '保存成功', '项目数据已安全保存');
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
        showToast('info', format.toUpperCase() + '格式导出即将上线', '目前仅支持JSON格式导出');
      }
    }
    
    // ==================== 弹窗控制 ====================
    function showCloudSyncModal() { 
      showModal('cloudSyncModal');
      updateStorageStats();
    }
    function hideCloudSyncModal() { hideModal('cloudSyncModal'); }
    
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
            showConfirmDialog({
              icon: 'info',
              title: '导入数据',
              message: '即将导入 ' + data.projects.length + ' 个项目，选择导入模式：',
              confirmText: '合并导入',
              cancelText: '覆盖导入',
              onConfirm: function() {
                // 合并模式
                const existingIds = projects.map(p => p.id);
                const newProjects = data.projects.filter(p => !existingIds.includes(p.id));
                projects = [...projects, ...newProjects];
                saveProjects();
                renderProjects();
                updateStats();
                updateStorageStats();
                showToast('成功导入 ' + newProjects.length + ' 个新项目', 'success');
              },
              onCancel: function() {
                showConfirmDialog({
                  icon: 'danger',
                  title: '覆盖确认',
                  message: '是否覆盖所有现有数据？此操作不可恢复！',
                  confirmText: '确认覆盖',
                  cancelText: '取消',
                  onConfirm: function() {
                    projects = data.projects;
                    saveProjects();
                    renderProjects();
                    updateStats();
                    updateStorageStats();
                    showToast('数据已完全覆盖', 'success');
                  }
                });
              }
            });
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
      showConfirmDialog({
        icon: 'danger',
        title: '清除所有数据',
        message: '此操作将删除所有项目（' + projects.length + ' 个）、版本快照和自定义设置，且不可恢复！',
        confirmText: '确认清除',
        cancelText: '取消',
        onConfirm: function() {
          showConfirmDialog({
            icon: 'danger',
            title: '最终确认',
            message: '真的要删除所有数据吗？这是最后一次确认机会。',
            confirmText: '是，全部删除',
            cancelText: '不，保留数据',
            onConfirm: function() {
              localStorage.removeItem('rbf_projects');
              localStorage.removeItem('rbf_custom_templates');
              projects = [];
              renderProjects();
              updateStats();
              updateStorageStats();
              showToast('所有数据已清除', 'success');
            }
          });
        }
      });
    }
    
    function showLoginPrompt() {
      showToast('云端同步功能即将上线，敬请期待', 'info');
    }
    
    function showCollaboratorModal() { 
      showModal('collaboratorModal');
      renderCollaboratorList();
      if (currentProject) {
        document.getElementById('ownerCreateDate').textContent = formatDate(currentProject.createdAt);
      }
    }
    function hideCollaboratorModal() { hideModal('collaboratorModal'); }
    function showJoinCollabModal() { showModal('joinCollabModal'); }
    function hideJoinCollabModal() { hideModal('joinCollabModal'); }
    
    // ==================== 协作功能 ====================
    let selectedInviteRole = 'investor';
    
    function selectInviteRole(role) {
      selectedInviteRole = role;
      // 更新UI
      document.querySelectorAll('.invite-role-btn').forEach(btn => {
        btn.classList.remove('border-teal-500', 'bg-teal-50', 'border-amber-500', 'bg-amber-50', 'border-gray-500', 'bg-gray-100');
        btn.classList.add('border-gray-200');
      });
      const btnId = 'role' + role.charAt(0).toUpperCase() + role.slice(1);
      const btn = document.getElementById(btnId);
      if (role === 'investor') {
        btn.classList.remove('border-gray-200');
        btn.classList.add('border-teal-500', 'bg-teal-50');
      } else if (role === 'borrower') {
        btn.classList.remove('border-gray-200');
        btn.classList.add('border-amber-500', 'bg-amber-50');
      } else {
        btn.classList.remove('border-gray-200');
        btn.classList.add('border-gray-500', 'bg-gray-100');
      }
    }
    function showVersionModal() { 
      showModal('versionModal');
      renderVersionList();
    }
    function hideVersionModal() { hideModal('versionModal'); }
    function showVersionCompareModal() { 
      showModal('versionCompareModal');
      populateVersionSelectors();
    }
    function hideVersionCompareModal() { hideModal('versionCompareModal'); }
    function showVersionDetailModal() { showModal('versionDetailModal'); }
    function hideVersionDetailModal() { hideModal('versionDetailModal'); }
    function showAIAdvisorModal() { showModal('aiAdvisorModal'); }
    function hideAIAdvisorModal() { hideModal('aiAdvisorModal'); }
    
    // AI助手面板入口（便捷别名）
    function showAIAdvisorPanel() { showAIAdvisorModal(); }
    function getAIAdvice() { showAIAdvisorModal(); }
    
    // ==================== 项目编辑/删除功能 ====================
    function showEditProjectModal(projectId) {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      document.getElementById('editProjectId').value = projectId;
      document.getElementById('editProjectName').value = project.name || '';
      document.getElementById('editProjectNote').value = project.note || '';
      document.getElementById('editProjectStatus').value = project.status || 'negotiating';
      document.getElementById('editProjectModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideEditProjectModal() {
      hideModal('editProjectModal');
    }
    
    function saveEditProject() {
      const projectId = document.getElementById('editProjectId').value;
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      const newName = document.getElementById('editProjectName').value.trim();
      if (!newName) {
        showToast('项目名称不能为空', 'warning');
        return;
      }
      
      project.name = newName;
      project.note = document.getElementById('editProjectNote').value.trim();
      project.status = document.getElementById('editProjectStatus').value;
      project.updatedAt = new Date().toISOString();
      
      saveProjects();
      renderProjects();
      updateStats();
      hideEditProjectModal();
      showToast('项目已更新', 'success');
    }
    
    function showDeleteProjectModal(projectId) {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      document.getElementById('deleteProjectId').value = projectId;
      document.getElementById('deleteProjectName').textContent = project.name;
      document.getElementById('deleteNegotiationCount').textContent = project.negotiations?.length || 0;
      document.getElementById('deleteVersionCount').textContent = project.versions?.length || 0;
      document.getElementById('deleteProjectModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideDeleteProjectModal() {
      hideModal('deleteProjectModal');
    }
    
    function confirmDeleteProject() {
      const projectId = document.getElementById('deleteProjectId').value;
      const index = projects.findIndex(p => p.id === projectId);
      if (index === -1) return;
      
      projects.splice(index, 1);
      saveProjects();
      renderProjects();
      updateStats();
      hideDeleteProjectModal();
      showToast('success', '项目已删除', '已从列表中移除');
    }
    
    // ==================== 直接编辑合同参数功能 ====================
    function showEditParamModal(paramKey, paramName, currentValue, note) {
      document.getElementById('editParamKey').value = paramKey;
      document.getElementById('editParamName').textContent = paramName;
      document.getElementById('editParamOldValue').textContent = currentValue || '（未设置）';
      document.getElementById('editParamNewValue').value = currentValue || '';
      document.getElementById('editParamNote').innerHTML = note ? '<i class="fas fa-info-circle mr-2"></i>' + note : '<i class="fas fa-lightbulb mr-2"></i>直接修改参数值，无需通过自然语言协商';
      document.getElementById('editParamModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideEditParamModal() {
      hideModal('editParamModal');
    }
    
    function saveEditParam() {
      if (!currentProject) return;
      
      const paramKey = document.getElementById('editParamKey').value;
      const newValue = document.getElementById('editParamNewValue').value.trim();
      const oldValue = currentProject.params[paramKey] || '';
      
      if (newValue === oldValue) {
        hideEditParamModal();
        return;
      }
      
      // 创建一条协商记录
      const negotiation = {
        id: 'neg_' + Date.now(),
        input: '直接修改: ' + document.getElementById('editParamName').textContent,
        understood: '用户直接编辑参数',
        changes: [{
          paramKey: paramKey,
          paramName: document.getElementById('editParamName').textContent,
          oldValue: oldValue,
          newValue: newValue,
          moduleId: 'direct-edit',
          moduleName: '直接编辑'
        }],
        perspective: currentPerspective,
        timestamp: new Date().toISOString(),
        isDirectEdit: true
      };
      
      currentProject.negotiations.push(negotiation);
      currentProject.params[paramKey] = newValue;
      currentProject.updatedAt = new Date().toISOString();
      
      saveProjects();
      hideEditParamModal();
      renderNegotiationHistory();
      renderModuleCards();
      renderContractText();
      updateChangedBadge();
      showToast('参数已更新', 'success');
    }
    
    // ==================== 删除协商记录功能 ====================
    function showDeleteNegotiationModal(negId) {
      if (!currentProject) return;
      
      const negotiation = currentProject.negotiations.find(n => n.id === negId);
      if (!negotiation) return;
      
      document.getElementById('deleteNegotiationId').value = negId;
      
      // 显示要删除的内容预览
      const preview = document.getElementById('deleteNegotiationPreview');
      preview.innerHTML = \`
        <div class="text-sm">
          <p class="font-medium text-gray-900 mb-2">"\${negotiation.input}"</p>
          <div class="space-y-1">
            \${negotiation.changes.map(c => \`
              <div class="flex items-center text-gray-600">
                <span class="w-24 truncate">\${c.paramName}:</span>
                <span class="text-red-500 line-through mx-2">\${c.newValue}</span>
                <i class="fas fa-arrow-right text-gray-400 mx-1"></i>
                <span class="text-emerald-600">\${c.oldValue}</span>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
      
      document.getElementById('deleteNegotiationModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideDeleteNegotiationModal() {
      hideModal('deleteNegotiationModal', true);
    }
    
    function confirmDeleteNegotiation() {
      if (!currentProject) return;
      
      const negId = document.getElementById('deleteNegotiationId').value;
      const negIndex = currentProject.negotiations.findIndex(n => n.id === negId);
      if (negIndex === -1) return;
      
      const negotiation = currentProject.negotiations[negIndex];
      
      // 恢复参数到协商前的值
      for (const change of negotiation.changes) {
        currentProject.params[change.paramKey] = change.oldValue;
      }
      
      // 删除协商记录
      currentProject.negotiations.splice(negIndex, 1);
      currentProject.updatedAt = new Date().toISOString();
      
      saveProjects();
      hideDeleteNegotiationModal();
      renderNegotiationHistory();
      renderModuleCards();
      renderContractText();
      updateChangedBadge();
      showToast('协商记录已删除，参数已恢复', 'success');
    }
    
    // ==================== 删除版本快照功能 ====================
    function showDeleteVersionModal(versionId, versionName) {
      document.getElementById('deleteVersionId').value = versionId;
      document.getElementById('deleteVersionName').textContent = versionName || '未命名版本';
      document.getElementById('deleteVersionModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideDeleteVersionModal() {
      hideModal('deleteVersionModal', true);
    }
    
    function confirmDeleteVersion() {
      if (!currentProject) return;
      
      const versionId = document.getElementById('deleteVersionId').value;
      const versionIndex = currentProject.versions?.findIndex(v => v.id === versionId);
      if (versionIndex === -1 || versionIndex === undefined) return;
      
      currentProject.versions.splice(versionIndex, 1);
      currentProject.updatedAt = new Date().toISOString();
      
      saveProjects();
      hideDeleteVersionModal();
      renderVersionList();
      showToast('版本快照已删除', 'success');
    }
    
    // ==================== 电子签章功能 ====================
    let currentSignProcess = null;
    let currentSignerId = null;
    let signatureCtx = null;
    let isDrawing = false;
    
    function showSignModal() { 
      showModal('signModal');
      checkExistingSignProcess();
    }
    function hideSignModal() { 
      hideModal('signModal');
      resetSignModal();
    }
    
    async function checkExistingSignProcess() {
      if (!currentProject) return;
      
      try {
        const res = await fetch('/api/projects/' + currentProject.id + '/sign/status');
        const result = await res.json();
        
        if (result.hasSignProcess && result.status === 'signing') {
          currentSignProcess = result;
          showSignStatus(result);
        } else if (result.hasSignProcess && result.status === 'completed') {
          currentSignProcess = result;
          showSignStatus(result);
        } else {
          showSignInitiateForm();
        }
      } catch (e) {
        showSignInitiateForm();
      }
    }
    
    function showSignStatus(signData) {
      document.getElementById('signStatusArea').classList.remove('hidden');
      document.getElementById('signInitiateForm').classList.add('hidden');
      
      const signedCount = signData.signers.filter(s => s.status === 'signed').length;
      const totalCount = signData.signers.length;
      const progress = (signedCount / totalCount) * 100;
      
      document.getElementById('signProgressBar').style.width = progress + '%';
      document.getElementById('signProgressText').textContent = signedCount + '/' + totalCount;
      
      if (signData.status === 'completed') {
        document.getElementById('signProgressBadge').textContent = '已完成';
        document.getElementById('signProgressBadge').className = 'px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm';
      } else {
        document.getElementById('signProgressBadge').textContent = '签署中';
        document.getElementById('signProgressBadge').className = 'px-3 py-1 bg-white/20 rounded-full text-sm';
      }
      
      // 渲染签署人状态
      const container = document.getElementById('signersStatusList');
      container.innerHTML = signData.signers.map(s => {
        const roleConfig = {
          investor: { icon: 'fa-landmark', color: 'teal', label: '投资方' },
          borrower: { icon: 'fa-store', color: 'amber', label: '融资方' }
        };
        const role = roleConfig[s.role] || roleConfig.investor;
        const isSigned = s.status === 'signed';
        
        return \`
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border \${isSigned ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'}">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-\${role.color}-100 rounded-full flex items-center justify-center">
                <i class="fas \${role.icon} text-\${role.color}-600 text-lg"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">\${s.name}</p>
                <p class="text-xs text-gray-500">\${role.label} · \${s.phone || s.email || '未提供联系方式'}</p>
                \${isSigned ? \`<p class="text-xs text-emerald-600 mt-1"><i class="fas fa-check-circle mr-1"></i>已于 \${formatDateTime(s.signedAt)} 签署</p>\` : ''}
              </div>
            </div>
            <div class="flex items-center space-x-2">
              \${isSigned ? \`
                <span class="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm"><i class="fas fa-check mr-1"></i>已签署</span>
              \` : \`
                <button onclick="showEditSignerModal('\${s.id}', '\${s.role}', '\${s.name}', '\${s.phone || ''}', '\${s.email || ''}', '\${signData.signId}')" class="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="编辑信息">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="openSignaturePad('\${s.id}', '\${s.name}', '\${s.role}')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                  <i class="fas fa-pen mr-1"></i>去签署
                </button>
                <button onclick="sendSignReminder('\${signData.signId}', '\${s.id}')" class="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="发送提醒">
                  <i class="fas fa-bell"></i>
                </button>
              \`}
            </div>
          </div>
        \`;
      }).join('');
      
      // 更新底部操作按钮
      const leftAction = document.getElementById('signModalLeftAction');
      if (signData.status === 'completed') {
        leftAction.innerHTML = '<button onclick="downloadSignedContract()" class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"><i class="fas fa-download mr-2"></i>下载已签合同</button>';
        document.getElementById('btnInitiateSign').classList.add('hidden');
      } else {
        leftAction.innerHTML = '<button onclick="cancelSignProcess()" class="text-sm text-red-500 hover:text-red-700"><i class="fas fa-times mr-1"></i>取消签署流程</button>';
        document.getElementById('btnInitiateSign').classList.add('hidden');
      }
    }
    
    function showSignInitiateForm() {
      document.getElementById('signStatusArea').classList.add('hidden');
      document.getElementById('signInitiateForm').classList.remove('hidden');
      document.getElementById('btnInitiateSign').classList.remove('hidden');
      document.getElementById('signModalLeftAction').innerHTML = '';
    }
    
    function resetSignModal() {
      document.getElementById('signerInvestorName').value = '';
      document.getElementById('signerInvestorPhone').value = '';
      document.getElementById('signerInvestorEmail').value = '';
      document.getElementById('signerBorrowerName').value = '';
      document.getElementById('signerBorrowerPhone').value = '';
      document.getElementById('signerBorrowerEmail').value = '';
      currentSignProcess = null;
    }
    
    async function initiateSignProcess() {
      if (!currentProject) {
        showToast('请先打开一个项目', 'warning');
        return;
      }
      
      const investorName = document.getElementById('signerInvestorName').value.trim();
      const investorPhone = document.getElementById('signerInvestorPhone').value.trim();
      const investorEmail = document.getElementById('signerInvestorEmail').value.trim();
      const borrowerName = document.getElementById('signerBorrowerName').value.trim();
      const borrowerPhone = document.getElementById('signerBorrowerPhone').value.trim();
      const borrowerEmail = document.getElementById('signerBorrowerEmail').value.trim();
      
      if (!investorName || !borrowerName) {
        showToast('请填写所有签署人姓名', 'warning');
        return;
      }
      
      const btn = document.getElementById('btnInitiateSign');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>发起中...';
      
      try {
        const res = await fetch('/api/projects/' + currentProject.id + '/sign/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: currentProject.name,
            contractHash: 'hash_' + Date.now(),
            signers: [
              { name: investorName, phone: investorPhone, email: investorEmail, role: 'investor' },
              { name: borrowerName, phone: borrowerPhone, email: borrowerEmail, role: 'borrower' }
            ]
          })
        });
        
        const result = await res.json();
        
        if (result.success) {
          currentSignProcess = {
            signId: result.signId,
            status: result.status,
            signers: result.signers
          };
          
          // 保存签署ID到项目
          currentProject.signId = result.signId;
          currentProject.signStatus = 'signing';
          saveProjects();
          
          showToast('签署流程已发起', 'success');
          showSignStatus(currentSignProcess);
        } else {
          showToast(result.message || '发起失败', 'error');
        }
      } catch (e) {
        showToast('网络错误，请重试', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>发起签署';
      }
    }
    
    async function cancelSignProcess() {
      if (!currentSignProcess) return;
      showConfirmDialog({
        icon: 'danger',
        title: '取消签署流程',
        message: '确定要取消签署流程吗？已完成的签名将作废，此操作不可恢复。',
        confirmText: '确认取消',
        cancelText: '返回',
        confirmClass: 'btn-danger',
        onConfirm: async function() {
          try {
            const res = await fetch('/api/sign/' + currentSignProcess.signId + '/cancel', {
              method: 'POST'
            });
            const result = await res.json();
            
            if (result.success) {
              currentProject.signStatus = 'cancelled';
              saveProjects();
              showToast('success', '已取消', '签署流程已取消');
              hideSignModal();
            } else {
              showToast('error', '取消失败', result.message || '请稍后重试');
            }
          } catch (e) {
            showToast('error', '操作失败', '网络错误，请稍后重试');
          }
        }
      });
    }
    
    async function sendSignReminder(signId, signerId) {
      try {
        const res = await fetch('/api/sign/' + signId + '/remind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signerId })
        });
        const result = await res.json();
        showToast(result.message || '提醒已发送', 'success');
      } catch (e) {
        showToast('发送失败', 'error');
      }
    }
    
    // ==================== 编辑签署人信息 ====================
    let currentEditingSignId = null; // 当前正在编辑的签署流程ID
    
    function showEditSignerModal(signerId, signerType, name, phone, email, signId) {
      currentEditingSignId = signId;
      document.getElementById('editSignerId').value = signerId;
      document.getElementById('editSignerType').value = signerType;
      document.getElementById('editSignerName').value = name || '';
      document.getElementById('editSignerPhone').value = phone || '';
      document.getElementById('editSignerEmail').value = email || '';
      
      // 更新弹窗标题图标颜色
      const iconColors = { investor: 'teal', borrower: 'amber' };
      const iconTypes = { investor: 'fa-landmark', borrower: 'fa-store' };
      const color = iconColors[signerType] || 'teal';
      const icon = iconTypes[signerType] || 'fa-user-edit';
      
      document.getElementById('editSignerIcon').className = 'w-10 h-10 bg-' + color + '-100 rounded-full flex items-center justify-center mr-3';
      document.getElementById('editSignerIcon').innerHTML = '<i class="fas ' + icon + ' text-' + color + '-600"></i>';
      
      document.getElementById('editSignerModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideEditSignerModal() {
      hideModal('editSignerModal', true);
      currentEditingSignId = null;
    }
    
    async function saveSignerInfo() {
      const signerId = document.getElementById('editSignerId').value;
      const name = document.getElementById('editSignerName').value.trim();
      const phone = document.getElementById('editSignerPhone').value.trim();
      const email = document.getElementById('editSignerEmail').value.trim();
      
      if (!name) {
        showToast('请输入签署人姓名', 'warning');
        return;
      }
      
      try {
        // 调用后端API更新签署人信息
        const res = await fetch('/api/sign/' + currentEditingSignId + '/update-signer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signerId, name, phone, email })
        });
        
        const result = await res.json();
        
        if (result.success) {
          hideEditSignerModal();
          showToast('签署人信息已更新', 'success');
          // 刷新签署状态显示
          await checkExistingSignStatus();
        } else {
          showToast(result.message || '更新失败', 'error');
        }
      } catch (e) {
        // 如果后端不支持，只更新前端显示（演示模式）
        console.log('后端API不支持，仅更新前端显示');
        hideEditSignerModal();
        showToast('签署人信息已更新（本地）', 'success');
        // 刷新签署状态显示
        await checkExistingSignStatus();
      }
    }
    
    // ==================== 签名板功能 ====================
    function showSignaturePadModal() { showModal('signaturePadModal'); initSignatureCanvas(); }
    function hideSignaturePadModal() { hideModal('signaturePadModal'); currentSignerId = null; }
    function showSignCompleteModal() { showModal('signCompleteModal'); }
    function hideSignCompleteModal() { 
      hideModal('signCompleteModal');
      // 更新项目状态
      if (currentProject) {
        currentProject.status = 'signed';
        saveProjects();
        // 更新顶部状态显示
        document.getElementById('projectStatus').className = 'px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700';
        document.getElementById('projectStatus').textContent = '已签署';
      }
    }
    
    function openSignaturePad(signerId, signerName, signerRole) {
      currentSignerId = signerId;
      document.getElementById('signaturePadSignerName').textContent = signerName + ' (' + (signerRole === 'investor' ? '投资方' : '融资方') + ')';
      document.getElementById('signatureContractSummary').textContent = '正在签署：' + (currentProject?.name || '项目合同');
      document.getElementById('signVerifyCode').value = '';
      showSignaturePadModal();
    }
    
    function initSignatureCanvas() {
      const canvas = document.getElementById('signatureCanvas');
      signatureCtx = canvas.getContext('2d');
      
      // 清空画布
      signatureCtx.fillStyle = 'white';
      signatureCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 设置画笔样式
      signatureCtx.strokeStyle = '#1f2937';
      signatureCtx.lineWidth = 2;
      signatureCtx.lineCap = 'round';
      signatureCtx.lineJoin = 'round';
      
      // 移除旧的事件监听器
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', stopDrawing);
      
      // 添加事件监听器
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
      
      // 触摸支持
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);
    }
    
    function startDrawing(e) {
      isDrawing = true;
      const rect = e.target.getBoundingClientRect();
      signatureCtx.beginPath();
      signatureCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    
    function draw(e) {
      if (!isDrawing) return;
      const rect = e.target.getBoundingClientRect();
      signatureCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      signatureCtx.stroke();
    }
    
    function stopDrawing() {
      isDrawing = false;
    }
    
    function handleTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      isDrawing = true;
      signatureCtx.beginPath();
      signatureCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }
    
    function handleTouchMove(e) {
      e.preventDefault();
      if (!isDrawing) return;
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      signatureCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      signatureCtx.stroke();
    }
    
    function clearSignatureCanvas() {
      if (!signatureCtx) return;
      const canvas = document.getElementById('signatureCanvas');
      signatureCtx.fillStyle = 'white';
      signatureCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function sendSignVerifyCode() {
      const btn = document.getElementById('btnSendVerifyCode');
      btn.disabled = true;
      let countdown = 60;
      btn.textContent = countdown + 's后重发';
      
      const timer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(timer);
          btn.disabled = false;
          btn.textContent = '发送验证码';
        } else {
          btn.textContent = countdown + 's后重发';
        }
      }, 1000);
      
      showToast('验证码已发送（演示模式：123456）', 'info');
    }
    
    async function confirmSignature() {
      if (!currentSignProcess || !currentSignerId) {
        showToast('签署信息错误', 'error');
        return;
      }
      
      const verifyCode = document.getElementById('signVerifyCode').value.trim();
      if (!verifyCode) {
        showToast('请输入验证码', 'warning');
        return;
      }
      
      // 获取签名图像
      const canvas = document.getElementById('signatureCanvas');
      const signatureData = canvas.toDataURL('image/png');
      
      // 检查是否有签名（简单检测：判断画布是否全白）
      const imageData = signatureCtx.getImageData(0, 0, canvas.width, canvas.height).data;
      let hasSignature = false;
      for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] < 250 || imageData[i+1] < 250 || imageData[i+2] < 250) {
          hasSignature = true;
          break;
        }
      }
      
      if (!hasSignature) {
        showToast('请在画布上签名', 'warning');
        return;
      }
      
      const btn = document.getElementById('btnConfirmSignature');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>提交中...';
      
      try {
        const res = await fetch('/api/sign/' + currentSignProcess.signId + '/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signerId: currentSignerId,
            signatureData,
            verificationCode: verifyCode
          })
        });
        
        const result = await res.json();
        
        if (result.success) {
          showToast('签署成功', 'success');
          hideSignaturePadModal();
          
          // 更新本地状态
          currentSignProcess.signers = result.signers;
          currentSignProcess.status = result.status;
          
          if (result.allCompleted) {
            // 所有人签署完成
            currentProject.signStatus = 'completed';
            currentProject.status = 'signed';
            saveProjects();
            
            hideSignModal();
            
            // 显示签署完成弹窗
            document.getElementById('signCompleteContractId').textContent = currentSignProcess.signId;
            document.getElementById('signCompleteTime').textContent = new Date().toLocaleString('zh-CN');
            document.getElementById('signCompleteSignerCount').textContent = result.signers.length + '人';
            showSignCompleteModal();
          } else {
            // 刷新签署状态
            showSignStatus(currentSignProcess);
          }
        } else {
          showToast(result.message || '签署失败', 'error');
        }
      } catch (e) {
        showToast('网络错误', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>确认签署';
      }
    }
    
    function downloadSignedContract() {
      if (!currentProject) return;
      
      // 生成已签署合同的JSON数据
      const signedContract = {
        projectId: currentProject.id,
        projectName: currentProject.name,
        signId: currentSignProcess?.signId,
        status: 'signed',
        params: currentProject.params,
        signers: currentSignProcess?.signers || [],
        signedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(signedContract, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentProject.name + '_已签署合同.json';
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('合同已下载', 'success');
    }
    function showExportModal() { showModal('exportModal'); }
    function hideExportModal() { hideModal('exportModal'); }
    function showTemplateManagerModal() { 
      showModal('templateManagerModal'); 
      loadCustomTemplates();
      renderSystemTemplateList();
    }
    function hideTemplateManagerModal() { hideModal('templateManagerModal'); }
    function showCreateTemplateModal() { 
      showModal('createTemplateModal');
      resetCreateTemplateForm();
      renderSourceTemplateOptions();
    }
    function hideCreateTemplateModal() { hideModal('createTemplateModal'); }
    function showTemplateDetailModal() { showModal('templateDetailModal'); }
    function hideTemplateDetailModal() { hideModal('templateDetailModal'); }
    
    // ==================== 模板定制功能 ====================
    let customTemplates = JSON.parse(localStorage.getItem('rbf_custom_templates') || '[]');
    let templateCreateMethod = 'clone';
    let selectedSourceTemplate = null;
    let selectedTemplateColor = 'teal';
    let editingTemplateId = null;
    
    async function loadCustomTemplates() {
      // 从localStorage加载
      customTemplates = JSON.parse(localStorage.getItem('rbf_custom_templates') || '[]');
      document.getElementById('customTemplateCount').textContent = customTemplates.length;
    }
    
    function saveCustomTemplates() {
      localStorage.setItem('rbf_custom_templates', JSON.stringify(customTemplates));
      document.getElementById('customTemplateCount').textContent = customTemplates.length;
    }
    
    function switchTemplateTab(tab) {
      const systemTab = document.getElementById('tabSystemTemplate');
      const customTab = document.getElementById('tabCustomTemplate');
      const systemList = document.getElementById('systemTemplateList');
      const customList = document.getElementById('customTemplateList');
      
      if (tab === 'system') {
        systemTab.className = 'px-4 py-2 bg-white text-teal-700 rounded-lg text-sm font-medium shadow-sm';
        customTab.className = 'px-4 py-2 text-gray-600 rounded-lg text-sm font-medium hover:bg-white/50';
        systemList.classList.remove('hidden');
        customList.classList.add('hidden');
      } else {
        systemTab.className = 'px-4 py-2 text-gray-600 rounded-lg text-sm font-medium hover:bg-white/50';
        customTab.className = 'px-4 py-2 bg-white text-teal-700 rounded-lg text-sm font-medium shadow-sm';
        systemList.classList.add('hidden');
        customList.classList.remove('hidden');
        renderCustomTemplateList();
      }
    }
    
    function renderSystemTemplateList() {
      const container = document.getElementById('systemTemplateList');
      container.innerHTML = templates.map(t => \`
        <div class="p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-\${t.color}-100 flex items-center justify-center">
              <i class="fas \${t.icon} text-\${t.color}-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">\${t.name}</h4>
              <p class="text-xs text-gray-500">系统模板</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 mb-3 line-clamp-2">\${t.description}</p>
          <div class="flex items-center justify-between">
            <button onclick="viewTemplateDetail('\${t.id}', false)" class="text-xs text-teal-600 hover:text-teal-700">
              <i class="fas fa-eye mr-1"></i>查看详情
            </button>
            <button onclick="cloneSystemTemplate('\${t.id}')" class="text-xs text-emerald-600 hover:text-emerald-700">
              <i class="fas fa-copy mr-1"></i>复制为我的模板
            </button>
          </div>
        </div>
      \`).join('');
    }
    
    function renderCustomTemplateList() {
      const container = document.getElementById('customTemplateGrid');
      const emptyState = document.getElementById('emptyCustomTemplate');
      
      if (customTemplates.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
      }
      
      container.classList.remove('hidden');
      emptyState.classList.add('hidden');
      
      container.innerHTML = customTemplates.map(t => \`
        <div class="p-4 border-2 border-\${t.color || 'gray'}-200 rounded-xl bg-\${t.color || 'gray'}-50/30 hover:shadow-md transition-all">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-\${t.color || 'gray'}-100 flex items-center justify-center">
              <i class="fas \${t.icon || 'fa-file-contract'} text-\${t.color || 'gray'}-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">\${t.name}</h4>
              <p class="text-xs text-\${t.color || 'gray'}-600">自定义模板</p>
            </div>
            <div class="flex space-x-1">
              <button onclick="editCustomTemplate('\${t.id}')" class="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="编辑">
                <i class="fas fa-edit text-xs"></i>
              </button>
              <button onclick="deleteCustomTemplate('\${t.id}')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除">
                <i class="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
          <p class="text-sm text-gray-500 mb-3 line-clamp-2">\${t.description || '暂无描述'}</p>
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-400">\${t.industry || '自定义'} · \${formatDate(t.createdAt)}</span>
            <button onclick="useCustomTemplate('\${t.id}')" class="px-3 py-1 bg-\${t.color || 'gray'}-500 text-white rounded-lg hover:bg-\${t.color || 'gray'}-600">
              使用此模板
            </button>
          </div>
        </div>
      \`).join('');
    }
    
    function resetCreateTemplateForm() {
      document.getElementById('newTemplateName').value = '';
      document.getElementById('newTemplateDesc').value = '';
      document.getElementById('newTemplateIndustry').value = '餐饮';
      selectedTemplateColor = 'teal';
      templateCreateMethod = 'clone';
      selectedSourceTemplate = null;
      editingTemplateId = null;
      
      document.getElementById('createTemplateTitle').innerHTML = '<i class="fas fa-plus-circle mr-2 text-teal-600"></i>创建自定义模板';
      document.getElementById('defaultParamsEditor').classList.add('hidden');
      
      // 重置颜色选择
      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('border-teal-600', 'border-amber-600', 'border-emerald-600', 'border-rose-600', 'border-cyan-600', 'border-cyan-600');
        btn.classList.add('border-transparent');
      });
      document.querySelector('.color-btn').classList.remove('border-transparent');
      document.querySelector('.color-btn').classList.add('border-teal-600');
      
      selectCreateMethod('clone');
    }
    
    function selectCreateMethod(method) {
      templateCreateMethod = method;
      
      document.querySelectorAll('.create-method-btn').forEach(btn => {
        btn.classList.remove('border-teal-500', 'bg-teal-50');
        btn.classList.add('border-gray-200');
      });
      
      if (method === 'clone') {
        document.getElementById('methodClone').classList.remove('border-gray-200');
        document.getElementById('methodClone').classList.add('border-teal-500', 'bg-teal-50');
        document.getElementById('sourceTemplateSelect').classList.remove('hidden');
      } else {
        document.getElementById('methodBlank').classList.remove('border-gray-200');
        document.getElementById('methodBlank').classList.add('border-teal-500', 'bg-teal-50');
        document.getElementById('sourceTemplateSelect').classList.add('hidden');
        document.getElementById('defaultParamsEditor').classList.add('hidden');
      }
    }
    
    function renderSourceTemplateOptions() {
      const container = document.getElementById('sourceTemplateOptions');
      container.innerHTML = templates.map(t => \`
        <button onclick="selectSourceTemplate('\${t.id}')" id="srcTpl_\${t.id}" 
          class="source-tpl-btn p-3 border-2 border-gray-200 rounded-xl text-center hover:border-teal-300 transition-all">
          <div class="w-10 h-10 rounded-lg bg-\${t.color}-100 flex items-center justify-center mx-auto mb-2">
            <i class="fas \${t.icon} text-\${t.color}-600"></i>
          </div>
          <p class="text-xs font-medium text-gray-700">\${t.name}</p>
        </button>
      \`).join('');
    }
    
    async function selectSourceTemplate(templateId) {
      selectedSourceTemplate = templateId;
      
      document.querySelectorAll('.source-tpl-btn').forEach(btn => {
        btn.classList.remove('border-teal-500', 'bg-teal-50');
        btn.classList.add('border-gray-200');
      });
      
      const btn = document.getElementById('srcTpl_' + templateId);
      if (btn) {
        btn.classList.remove('border-gray-200');
        btn.classList.add('border-teal-500', 'bg-teal-50');
      }
      
      // 加载源模板的默认参数
      try {
        const res = await fetch('/api/templates/' + templateId);
        const template = await res.json();
        
        if (template.defaultParams) {
          renderDefaultParamsEditor(template.defaultParams);
          document.getElementById('defaultParamsEditor').classList.remove('hidden');
        }
        
        // 自动填充名称
        if (!document.getElementById('newTemplateName').value) {
          document.getElementById('newTemplateName').value = template.name + ' (自定义)';
        }
      } catch (e) {
        console.error('加载模板失败:', e);
      }
    }
    
    function renderDefaultParamsEditor(params) {
      const container = document.getElementById('defaultParamsFields');
      const paramLabels = {
        investmentAmount: '投资金额',
        revenueShareRatio: '分成比例',
        terminationReturn: '终止回报率',
        breachPenalty: '违约金比例',
        sharingPeriod: '分成期限',
        giftTicketLimit: '赠票上限',
        minTicketPrice: '最低票价',
        discountLimit: '折扣上限'
      };
      
      container.innerHTML = Object.entries(params).map(([key, value]) => \`
        <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100">
          <label class="text-sm text-gray-600">\${paramLabels[key] || key}</label>
          <input type="text" id="param_\${key}" value="\${value}" 
            class="w-32 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-teal-500">
        </div>
      \`).join('');
    }
    
    function selectTemplateColor(color) {
      selectedTemplateColor = color;
      
      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('border-teal-600', 'border-amber-600', 'border-emerald-600', 'border-rose-600', 'border-cyan-600', 'border-cyan-600');
        btn.classList.add('border-transparent');
      });
      
      event.target.classList.remove('border-transparent');
      event.target.classList.add('border-' + color + '-600');
    }
    
    async function saveCustomTemplate() {
      const name = document.getElementById('newTemplateName').value.trim();
      const description = document.getElementById('newTemplateDesc').value.trim();
      const industry = document.getElementById('newTemplateIndustry').value;
      
      if (!name) {
        showToast('请输入模板名称', 'warning');
        return;
      }
      
      const btn = document.getElementById('btnSaveTemplate');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
      
      try {
        let newTemplate;
        
        if (templateCreateMethod === 'clone' && selectedSourceTemplate) {
          // 复制系统模板
          const res = await fetch('/api/templates/' + selectedSourceTemplate);
          const sourceTemplate = await res.json();
          
          // 获取编辑后的参数
          const editedParams = {};
          Object.keys(sourceTemplate.defaultParams || {}).forEach(key => {
            const input = document.getElementById('param_' + key);
            editedParams[key] = input ? input.value : sourceTemplate.defaultParams[key];
          });
          
          newTemplate = {
            id: 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
            name,
            description,
            industry,
            icon: sourceTemplate.icon,
            color: selectedTemplateColor,
            defaultParams: editedParams,
            modules: sourceTemplate.modules,
            fullText: sourceTemplate.fullText,
            sourceTemplateId: selectedSourceTemplate,
            isCustom: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          // 空白模板
          newTemplate = {
            id: 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
            name,
            description,
            industry,
            icon: 'fa-file-contract',
            color: selectedTemplateColor,
            defaultParams: {
              investmentAmount: '500 万元',
              revenueShareRatio: '15%',
              terminationReturn: '25%',
              breachPenalty: '20%'
            },
            modules: [],
            fullText: [],
            isCustom: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        
        if (editingTemplateId) {
          // 更新现有模板
          const index = customTemplates.findIndex(t => t.id === editingTemplateId);
          if (index !== -1) {
            newTemplate.id = editingTemplateId;
            newTemplate.createdAt = customTemplates[index].createdAt;
            customTemplates[index] = newTemplate;
          }
        } else {
          // 添加新模板
          customTemplates.push(newTemplate);
        }
        
        saveCustomTemplates();
        showToast(editingTemplateId ? '模板已更新' : '模板已创建', 'success');
        hideCreateTemplateModal();
        
        // 刷新模板列表
        switchTemplateTab('custom');
        
      } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save mr-2"></i>保存模板';
      }
    }
    
    async function cloneSystemTemplate(templateId) {
      showCreateTemplateModal();
      await selectSourceTemplate(templateId);
    }
    
    function editCustomTemplate(templateId) {
      const template = customTemplates.find(t => t.id === templateId);
      if (!template) return;
      
      editingTemplateId = templateId;
      showCreateTemplateModal();
      
      document.getElementById('createTemplateTitle').innerHTML = '<i class="fas fa-edit mr-2 text-teal-600"></i>编辑模板';
      document.getElementById('newTemplateName').value = template.name;
      document.getElementById('newTemplateDesc').value = template.description || '';
      document.getElementById('newTemplateIndustry').value = template.industry || '其他';
      selectedTemplateColor = template.color || 'teal';
      
      if (template.sourceTemplateId) {
        templateCreateMethod = 'clone';
        selectCreateMethod('clone');
        selectSourceTemplate(template.sourceTemplateId);
      } else {
        templateCreateMethod = 'blank';
        selectCreateMethod('blank');
      }
      
      // 如果有自定义参数，渲染编辑器
      if (template.defaultParams) {
        renderDefaultParamsEditor(template.defaultParams);
        document.getElementById('defaultParamsEditor').classList.remove('hidden');
      }
    }
    
    function deleteCustomTemplate(templateId) {
      const template = customTemplates.find(t => t.id === templateId);
      if (!template) return;
      
      // 显示删除确认弹窗
      document.getElementById('deleteTemplateId').value = templateId;
      document.getElementById('deleteTemplateName').textContent = template.name || '自定义模板';
      document.getElementById('deleteTemplateIndustry').textContent = (template.industry || '自定义') + ' · 创建于 ' + formatDate(template.createdAt);
      
      const color = template.color || 'teal';
      const icon = template.icon || 'fa-file-contract';
      document.getElementById('deleteTemplateIcon').className = 'w-12 h-12 bg-' + color + '-100 rounded-xl flex items-center justify-center';
      document.getElementById('deleteTemplateIcon').innerHTML = '<i class="fas ' + icon + ' text-' + color + '-600"></i>';
      
      document.getElementById('deleteTemplateModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideDeleteTemplateModal() {
      hideModal('deleteTemplateModal', true);
    }
    
    function confirmDeleteTemplate() {
      const templateId = document.getElementById('deleteTemplateId').value;
      if (!templateId) return;
      
      customTemplates = customTemplates.filter(t => t.id !== templateId);
      saveCustomTemplates();
      renderCustomTemplateList();
      hideDeleteTemplateModal();
      showToast('模板已删除', 'success');
    }
    
    function useCustomTemplate(templateId) {
      const template = customTemplates.find(t => t.id === templateId);
      if (!template) return;
      
      // 隐藏模板管理弹窗，显示新建项目弹窗
      hideTemplateManagerModal();
      showNewProjectModal();
      
      // 添加自定义模板到选择列表并选中
      selectedTemplateId = templateId;
      renderTemplateGridWithCustom();
    }
    
    function renderTemplateGridWithCustom() {
      const grid = document.getElementById('templateGrid');
      if (!grid) return;
      
      // 合并系统模板和自定义模板
      const allTemplates = [...templates, ...customTemplates];
      
      grid.innerHTML = allTemplates.map(t => \`
        <div class="template-card p-4 border-2 rounded-xl \${selectedTemplateId === t.id ? 'selected border-teal-500 bg-teal-50' : 'border-gray-200'}" 
             onclick="selectTemplate('\${t.id}')">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-lg bg-\${t.color}-100 flex items-center justify-center">
              <i class="fas \${t.icon} text-\${t.color}-600"></i>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">\${t.name}</h4>
              <p class="text-xs text-gray-500 truncate">\${t.isCustom ? '自定义' : '系统'} · \${t.description?.substring(0, 20) || ''}</p>
            </div>
          </div>
        </div>
      \`).join('');
    }
    
    function viewTemplateDetail(templateId, isCustom) {
      const template = isCustom 
        ? customTemplates.find(t => t.id === templateId)
        : templates.find(t => t.id === templateId);
      
      if (!template) return;
      
      const content = document.getElementById('templateDetailContent');
      content.innerHTML = \`
        <div class="text-center pb-4 border-b border-gray-100">
          <div class="w-16 h-16 bg-\${template.color || 'gray'}-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i class="fas \${template.icon || 'fa-file-contract'} text-\${template.color || 'gray'}-600 text-2xl"></i>
          </div>
          <h3 class="font-bold text-gray-900">\${template.name}</h3>
          <p class="text-sm text-gray-500">\${template.isCustom ? '自定义模板' : '系统模板'} · \${template.industry || ''}</p>
        </div>
        
        <div class="mt-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">模板描述</h4>
          <p class="text-sm text-gray-500">\${template.description || '暂无描述'}</p>
        </div>
        
        <div class="mt-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">默认参数</h4>
          <div class="space-y-2 bg-gray-50 rounded-lg p-3">
            \${Object.entries(template.defaultParams || {}).map(([k, v]) => \`
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">\${k}</span>
                <span class="text-gray-900 font-medium">\${v}</span>
              </div>
            \`).join('')}
          </div>
        </div>
        
        <div class="mt-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">包含模块</h4>
          <div class="flex flex-wrap gap-2">
            \${(template.modules || []).map(m => \`
              <span class="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs">\${m.title}</span>
            \`).join('') || '<span class="text-sm text-gray-400">无模块信息</span>'}
          </div>
        </div>
        
        <div class="mt-6 flex space-x-3">
          \${isCustom ? \`
            <button onclick="editCustomTemplate('\${template.id}'); hideTemplateDetailModal();" class="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <i class="fas fa-edit mr-2"></i>编辑
            </button>
          \` : \`
            <button onclick="cloneSystemTemplate('\${template.id}'); hideTemplateDetailModal();" class="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <i class="fas fa-copy mr-2"></i>复制为我的模板
            </button>
          \`}
          <button onclick="hideTemplateDetailModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            关闭
          </button>
        </div>
      \`;
      
      showTemplateDetailModal();
    }
    
    // 更新 renderTemplateGrid 以支持自定义模板
    function renderTemplateGrid() {
      const grid = document.getElementById('templateGrid');
      if (!grid) return;
      
      const templateColorMap = {
        purple: { bg: '#f3e8ff', icon: '#0D9488' },
        orange: { bg: '#fff7ed', icon: '#ea580c' },
        blue: { bg: '#eff6ff', icon: '#2563eb' },
        pink: { bg: '#fdf2f8', icon: '#db2777' },
        green: { bg: '#ecfdf5', icon: '#059669' },
        gray: { bg: '#f9fafb', icon: '#6b7280' },
        red: { bg: '#fef2f2', icon: '#dc2626' },
        indigo: { bg: '#F0FDFA', icon: '#49A89A' },
        teal: { bg: '#F0FDFA', icon: '#49A89A' },
      };
      
      // 合并系统模板和自定义模板
      const allTemplates = [...templates, ...customTemplates];
      
      grid.innerHTML = allTemplates.map(t => {
        const tc = templateColorMap[t.color] || templateColorMap.gray;
        const isSelected = selectedTemplateId === t.id;
        return \`
        <div class="template-card p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 \${isSelected ? 'selected border-teal-500 bg-teal-50/50 shadow-md' : 'border-gray-200 hover:border-teal-300 hover:shadow-sm'}" 
             onclick="selectTemplate('\${t.id}')">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 \${isSelected ? 'ring-2 ring-teal-300 ring-offset-1' : ''}" style="background: \${tc.bg};">
              <i class="fas \${t.icon}" style="color: \${tc.icon};"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-gray-900 text-sm truncate">\${t.name}</h4>
              <p class="text-xs text-gray-500 truncate">\${t.isCustom ? '<i class="fas fa-user mr-1"></i>自定义' : t.description}</p>
            </div>
            \${isSelected ? '<i class="fas fa-check-circle text-teal-500 text-base flex-shrink-0"></i>' : ''}
          </div>
        </div>
      \`;
      }).join('');
    }
    
    // 更新 selectTemplate 以支持自定义模板
    function selectTemplate(id) {
      selectedTemplateId = id;
      renderTemplateGrid();
      // 更新选择提示
      const hint = document.getElementById('selectedTemplateHint');
      if (hint) {
        const template = templates.find(t => t.id === id) || customTemplates.find(t => t.id === id);
        hint.innerHTML = template ? '<i class="fas fa-check-circle text-emerald-500 mr-1"></i><span class="text-emerald-600 font-medium">' + template.name + '</span>' : '请选择一个模板';
      }
    }
    
    // 从当前项目另存为模板
    function saveProjectAsTemplate() {
      if (!currentProject) {
        showToast('请先打开一个项目', 'warning');
        return;
      }
      
      showCreateTemplateModal();
      templateCreateMethod = 'clone';
      selectCreateMethod('clone');
      
      // 填充项目信息
      document.getElementById('newTemplateName').value = currentProject.name + ' 模板';
      
      if (currentProject.templateId) {
        selectSourceTemplate(currentProject.templateId);
        
        // 用项目当前参数覆盖默认参数
        setTimeout(() => {
          Object.entries(currentProject.params || {}).forEach(([key, value]) => {
            const input = document.getElementById('param_' + key);
            if (input) input.value = value;
          });
        }, 100);
      }
    }
    
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
          investor: { icon: 'fa-landmark', color: 'teal', label: '投资方' },
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
      
      const collaborator = (currentProject.collaborators || []).find(c => c.id === collaboratorId);
      if (!collaborator) return;
      
      // 显示删除确认弹窗
      document.getElementById('deleteCollaboratorId').value = collaboratorId;
      document.getElementById('deleteCollaboratorName').textContent = collaborator.name || '协作者';
      
      const roleLabels = { investor: '投资方', borrower: '融资方', viewer: '观察者' };
      const roleColors = { investor: 'teal', borrower: 'amber', viewer: 'gray' };
      const roleIcons = { investor: 'fa-landmark', borrower: 'fa-store', viewer: 'fa-eye' };
      
      const role = collaborator.role || 'viewer';
      document.getElementById('deleteCollaboratorRole').textContent = roleLabels[role] || '观察者';
      document.getElementById('deleteCollaboratorAvatar').className = 'w-12 h-12 bg-' + (roleColors[role] || 'gray') + '-100 rounded-full flex items-center justify-center';
      document.getElementById('deleteCollaboratorAvatar').innerHTML = '<i class="fas ' + (roleIcons[role] || 'fa-eye') + ' text-' + (roleColors[role] || 'gray') + '-600"></i>';
      
      document.getElementById('deleteCollaboratorModal').classList.remove('hidden');
      lockBodyScroll();
    }
    
    function hideDeleteCollaboratorModal() {
      hideModal('deleteCollaboratorModal', true);
    }
    
    function confirmDeleteCollaborator() {
      const collaboratorId = document.getElementById('deleteCollaboratorId').value;
      if (!currentProject || !collaboratorId) return;
      
      currentProject.collaborators = (currentProject.collaborators || []).filter(c => c.id !== collaboratorId);
      saveProjects();
      renderCollaboratorList();
      hideDeleteCollaboratorModal();
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
                <div class="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <span class="text-cyan-600 font-bold text-sm">V\${index}</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">\${v.name}</p>
                  <p class="text-xs text-gray-500">\${v.negotiationCount || 0}轮协商 · \${v.paramCount || Object.keys(v.params || {}).length}项参数 · \${formatDateTime(v.createdAt)}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                \${isLatest ? '<span class="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">最新</span>' : ''}
                <button onclick="viewVersionDetail('\${v.id}')" class="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="查看详情">
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
            <div class="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-code-branch text-cyan-600 text-2xl"></i>
            </div>
            <h3 class="font-bold text-gray-900">\${version.name}</h3>
            <p class="text-sm text-gray-500">创建于 \${formatDateTime(version.createdAt)}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-teal-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-teal-600">\${version.negotiationCount || (version.negotiations || []).length}</p>
              <p class="text-xs text-teal-500">协商轮次</p>
            </div>
            <div class="bg-cyan-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-cyan-600">\${version.paramCount || Object.keys(version.params || {}).length}</p>
              <p class="text-xs text-cyan-500">参数数量</p>
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
      
      showConfirmDialog({
        icon: 'warning',
        title: '回退到此版本',
        message: '确定要回退到版本「' + version.name + '」吗？当前工作内容将被替换，建议先创建快照保存当前状态。',
        confirmText: '确认回退',
        cancelText: '取消',
        confirmClass: 'btn-primary',
        onConfirm: function() {
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
          
          showToast('success', '版本已回退', '已回退到版本: ' + version.name);
        }
      });
    }
    
    function deleteVersion(versionId) {
      if (!currentProject) return;
      const version = (currentProject.versions || []).find(v => v.id === versionId);
      if (!version) return;
      
      showDeleteVersionModal(versionId, version.name);
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
            <span class="font-medium text-cyan-600">\${versionA.name}</span>
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
                      <span class="text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded">\${d.valA}</span>
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
    let currentAITab = 'advice';
    let aiAdviceCache = null;
    let aiRiskCache = null;
    let aiMarketCache = null;
    
    function switchAITab(tab) {
      currentAITab = tab;
      
      // 更新标签样式
      document.querySelectorAll('.ai-tab').forEach(btn => {
        btn.classList.remove('text-teal-600', 'border-b-2', 'border-teal-600', 'bg-white');
        btn.classList.add('text-gray-500');
      });
      
      const activeTab = document.getElementById('tabAI' + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (activeTab) {
        activeTab.classList.add('text-teal-600', 'border-b-2', 'border-teal-600', 'bg-white');
        activeTab.classList.remove('text-gray-500');
      }
      
      // 切换面板
      document.getElementById('aiAdvicePanel')?.classList.toggle('hidden', tab !== 'advice');
      document.getElementById('aiRiskPanel')?.classList.toggle('hidden', tab !== 'risk');
      document.getElementById('aiMarketPanel')?.classList.toggle('hidden', tab !== 'market');
    }
    
    async function getAIAdvice() {
      if (!currentProject) {
        showToast('请先选择一个项目', 'error');
        return;
      }
      
      showAIAdvisorModal();
      switchAITab('advice');
      
      const resultDiv = document.getElementById('aiAdviceResult');
      const initialDiv = document.getElementById('aiAdvicePanel').querySelector('.text-center');
      
      initialDiv.innerHTML = '<div class="py-8"><i class="fas fa-spinner fa-spin text-4xl text-teal-600 mb-4"></i><p class="text-gray-500">AI正在深度分析谈判态势...</p><p class="text-xs text-gray-400 mt-2">基于历史数据和市场行情生成建议</p></div>';
      resultDiv.classList.add('hidden');
      
      try {
        const template = templates.find(t => t.id === currentProject.templateId);
        const res = await fetch('/api/ai/negotiate-advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProject.id,
            currentParams: currentProject.params,
            negotiationHistory: currentProject.negotiations || [],
            perspective: currentPerspective,
            templateName: template?.name || '未知行业'
          })
        });
        
        const advice = await res.json();
        aiAdviceCache = advice;
        
        if (!advice.success) {
          initialDiv.innerHTML = \`<div class="py-8"><i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i><p class="text-red-500">获取建议失败</p><p class="text-xs text-gray-400 mt-2">\${advice.error || '请稍后重试'}</p><button onclick="getAIAdvice()" class="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm">重新获取</button></div>\`;
          return;
        }
        
        initialDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
        
        const positionScore = advice.positionScore || 50;
        const positionColor = positionScore >= 70 ? 'emerald' : positionScore >= 40 ? 'amber' : 'red';
        
        resultDiv.innerHTML = \`
          <div class="space-y-4">
            <!-- 谈判态势评分 -->
            <div class="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h4 class="font-bold text-teal-900"><i class="fas fa-gauge-high mr-2"></i>谈判态势评分</h4>
                  <p class="text-xs text-teal-600">基于当前条款和协商历史综合评估</p>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold text-\${positionColor}-600">\${positionScore}</div>
                  <div class="text-xs text-gray-500">/ 100分</div>
                </div>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-gradient-to-r from-\${positionColor}-400 to-\${positionColor}-600 h-3 rounded-full transition-all" style="width: \${positionScore}%"></div>
              </div>
              <p class="text-sm text-gray-600 mt-3">\${advice.analysis || '暂无分析'}</p>
            </div>
            
            <!-- 参数优化建议 -->
            \${advice.suggestions?.length > 0 ? \`
              <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <h4 class="font-bold text-emerald-900 mb-3"><i class="fas fa-sliders-h mr-2"></i>最优报价建议</h4>
                <div class="space-y-3">
                  \${advice.suggestions.map((s, i) => \`
                    <div class="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-0.5 bg-\${s.priority === 'high' ? 'red' : s.priority === 'medium' ? 'amber' : 'gray'}-100 text-\${s.priority === 'high' ? 'red' : s.priority === 'medium' ? 'amber' : 'gray'}-700 rounded text-xs">\${s.priority === 'high' ? '高优先' : s.priority === 'medium' ? '中优先' : '低优先'}</span>
                            <span class="font-bold text-gray-800">\${s.param}</span>
                          </div>
                          <div class="flex items-center space-x-3 mb-2">
                            <div class="text-center">
                              <div class="text-xs text-gray-400">当前值</div>
                              <div class="text-lg font-medium text-gray-600">\${s.currentValue}</div>
                            </div>
                            <i class="fas fa-long-arrow-alt-right text-2xl text-emerald-500"></i>
                            <div class="text-center">
                              <div class="text-xs text-emerald-600">建议值</div>
                              <div class="text-lg font-bold text-emerald-600">\${s.suggestedValue}</div>
                            </div>
                            \${s.minAcceptable ? \`
                              <div class="text-center border-l border-gray-200 pl-3">
                                <div class="text-xs text-gray-400">底线</div>
                                <div class="text-sm text-gray-500">\${s.minAcceptable}</div>
                              </div>
                            \` : ''}
                          </div>
                          <p class="text-sm text-gray-600"><i class="fas fa-comment-dots mr-1 text-emerald-400"></i>\${s.reason}</p>
                        </div>
                        <button onclick="applyAISuggestion('\${s.param}', '\${s.suggestedValue}')" class="ml-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700">
                          <i class="fas fa-check mr-1"></i>采纳
                        </button>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}
            
            <!-- 让步策略 -->
            \${advice.concessionStrategy ? \`
              <div class="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                <h4 class="font-bold text-cyan-900 mb-3"><i class="fas fa-chess mr-2"></i>让步策略</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-white p-3 rounded-lg border border-cyan-200">
                    <div class="text-xs text-cyan-600 mb-2 font-medium"><i class="fas fa-hand-holding-usd mr-1"></i>可让步点</div>
                    <ul class="space-y-1">\${(advice.concessionStrategy.canGive || []).map(c => \`<li class="text-sm text-gray-600">• \${c}</li>\`).join('')}</ul>
                  </div>
                  <div class="bg-white p-3 rounded-lg border border-cyan-200">
                    <div class="text-xs text-red-600 mb-2 font-medium"><i class="fas fa-shield-alt mr-1"></i>必须坚持</div>
                    <ul class="space-y-1">\${(advice.concessionStrategy.mustKeep || []).map(c => \`<li class="text-sm text-gray-600">• \${c}</li>\`).join('')}</ul>
                  </div>
                </div>
                \${advice.concessionStrategy.tradeOff ? \`
                  <div class="mt-3 p-3 bg-cyan-100 rounded-lg">
                    <div class="text-xs text-cyan-700 font-medium mb-1"><i class="fas fa-exchange-alt mr-1"></i>交换策略</div>
                    <p class="text-sm text-cyan-800">\${advice.concessionStrategy.tradeOff}</p>
                  </div>
                \` : ''}
              </div>
            \` : ''}
            
            <!-- 表达建议 -->
            \${advice.talkingPoints?.length > 0 ? \`
              <div class="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 class="font-bold text-amber-900 mb-3"><i class="fas fa-comment-alt mr-2"></i>表达话术</h4>
                <div class="space-y-2">
                  \${advice.talkingPoints.map((t, i) => \`
                    <div class="bg-white p-3 rounded-lg border border-amber-200 flex items-start">
                      <div class="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span class="text-white text-xs font-bold">\${i + 1}</span>
                      </div>
                      <p class="text-sm text-gray-700 flex-1">\${t}</p>
                      <button onclick="copyToClipboard('\${t.replace(/'/g, "\\\\'")}')" class="ml-2 text-amber-600 hover:text-amber-700">
                        <i class="fas fa-copy"></i>
                      </button>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}
            
            <!-- 风险提醒 -->
            \${advice.risks?.length > 0 ? \`
              <div class="p-4 bg-red-50 rounded-xl border border-red-100">
                <h4 class="font-bold text-red-900 mb-3"><i class="fas fa-exclamation-triangle mr-2"></i>风险提醒</h4>
                <div class="space-y-2">
                  \${advice.risks.map(r => {
                    const risk = typeof r === 'string' ? { description: r, level: 'medium' } : r;
                    const levelColor = risk.level === 'high' ? 'red' : risk.level === 'medium' ? 'amber' : 'gray';
                    return \`
                      <div class="bg-white p-3 rounded-lg border border-red-200">
                        <div class="flex items-start">
                          <span class="px-2 py-0.5 bg-\${levelColor}-100 text-\${levelColor}-700 rounded text-xs mr-2">\${risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低'}</span>
                          <div class="flex-1">
                            <p class="text-sm text-gray-700">\${risk.description}</p>
                            \${risk.mitigation ? \`<p class="text-xs text-gray-500 mt-1"><i class="fas fa-lightbulb mr-1 text-amber-500"></i>\${risk.mitigation}</p>\` : ''}
                          </div>
                        </div>
                      </div>
                    \`;
                  }).join('')}
                </div>
              </div>
            \` : ''}
            
            <!-- 对方预测 -->
            \${advice.opponentPrediction ? \`
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 class="font-bold text-slate-900 mb-2"><i class="fas fa-eye mr-2"></i>预测对方下一步</h4>
                <p class="text-sm text-slate-700">\${advice.opponentPrediction}</p>
              </div>
            \` : ''}
            
            <!-- 置信度 -->
            <div class="flex items-center justify-between text-xs text-gray-400 pt-2">
              <span><i class="fas fa-robot mr-1"></i>AI置信度: \${advice.confidence || 75}%</span>
              <span>生成时间: \${new Date(advice.generatedAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        \`;
        
        document.getElementById('aiLastUpdate').textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN');
        
      } catch (e) {
        initialDiv.innerHTML = \`<div class="py-8"><i class="fas fa-wifi text-4xl text-red-500 mb-4"></i><p class="text-red-500">网络错误</p><button onclick="getAIAdvice()" class="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm">重试</button></div>\`;
      }
    }
    
    // 采纳AI建议
    function applyAISuggestion(paramName, value) {
      if (!currentProject) return;
      
      // 参数名到key的映射
      const paramKeyMap = {
        '投资金额': 'investmentAmount',
        '分成比例': 'revenueShareRatio',
        '收入分成期限': 'sharingDuration',
        '最低收入门槛': 'minimumRevenueThreshold',
        '提前终止返还比例': 'terminationReturn',
        '违约金': 'breachPenalty'
      };
      
      const key = paramKeyMap[paramName];
      if (key && currentProject.params[key] !== undefined) {
        const oldValue = currentProject.params[key];
        currentProject.params[key] = value;
        
        // 添加到协商历史
        currentProject.negotiations = currentProject.negotiations || [];
        currentProject.negotiations.push({
          id: 'neg_' + Date.now(),
          timestamp: new Date().toISOString(),
          perspective: currentPerspective,
          input: \`采纳AI建议：\${paramName}从\${oldValue}调整为\${value}\`,
          changes: [{
            moduleId: 'ai_suggestion',
            moduleName: 'AI建议',
            paramKey: key,
            paramName: paramName,
            oldValue: oldValue,
            newValue: value,
            clauseText: ''
          }]
        });
        
        currentProject.updatedAt = new Date().toISOString();
        saveProjects();
        renderContractText();
        showToast('已采纳AI建议: ' + paramName, 'success');
      } else {
        showToast('无法应用此建议', 'error');
      }
    }
    
    // 复制到剪贴板
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
      }).catch(() => {
        showToast('复制失败', 'error');
      });
    }
    
    // 风险评估
    async function getRiskAssessment() {
      if (!currentProject) {
        showToast('请先选择一个项目', 'error');
        return;
      }
      
      const resultDiv = document.getElementById('aiRiskResult');
      const initialDiv = document.getElementById('aiRiskPanel').querySelector('.text-center');
      
      initialDiv.innerHTML = '<div class="py-8"><i class="fas fa-spinner fa-spin text-4xl text-rose-600 mb-4"></i><p class="text-gray-500">AI正在进行风险评估...</p><p class="text-xs text-gray-400 mt-2">从多个维度分析合同条款</p></div>';
      resultDiv.classList.add('hidden');
      
      try {
        const template = templates.find(t => t.id === currentProject.templateId);
        const res = await fetch('/api/ai/risk-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentParams: currentProject.params,
            templateName: template?.name || '未知行业',
            negotiationHistory: currentProject.negotiations || []
          })
        });
        
        const risk = await res.json();
        aiRiskCache = risk;
        
        if (!risk.success) {
          initialDiv.innerHTML = \`<div class="py-8"><i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i><p class="text-red-500">评估失败</p><button onclick="getRiskAssessment()" class="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm">重新评估</button></div>\`;
          return;
        }
        
        initialDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
        
        const overallScore = risk.overallRiskScore || 50;
        const overallLevel = risk.overallRiskLevel || 'medium';
        const levelConfig = {
          low: { color: 'emerald', text: '低风险', icon: 'fa-shield-check' },
          medium: { color: 'amber', text: '中风险', icon: 'fa-shield-alt' },
          high: { color: 'red', text: '高风险', icon: 'fa-shield-exclamation' }
        };
        const config = levelConfig[overallLevel] || levelConfig.medium;
        
        resultDiv.innerHTML = \`
          <div class="space-y-4">
            <!-- 总体风险评分 -->
            <div class="p-5 bg-gradient-to-r from-\${config.color}-50 to-\${config.color}-100 rounded-xl border border-\${config.color}-200">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="w-14 h-14 bg-\${config.color}-500 rounded-xl flex items-center justify-center mr-4">
                    <i class="fas \${config.icon} text-white text-2xl"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-\${config.color}-900 text-lg">综合风险评估</h4>
                    <p class="text-\${config.color}-700">\${config.text}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-4xl font-bold text-\${config.color}-600">\${overallScore}</div>
                  <div class="text-xs text-gray-500">风险指数</div>
                </div>
              </div>
              <div class="w-full bg-white rounded-full h-4">
                <div class="bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 h-4 rounded-full" style="width: 100%"></div>
              </div>
              <div class="flex justify-between text-xs mt-1">
                <span class="text-emerald-600">低</span>
                <span class="text-\${config.color}-600 font-bold">当前: \${overallScore}</span>
                <span class="text-red-600">高</span>
              </div>
            </div>
            
            <!-- 风险细分 -->
            \${risk.riskBreakdown?.length > 0 ? \`
              <div class="grid grid-cols-1 gap-3">
                \${risk.riskBreakdown.map(item => {
                  const itemConfig = levelConfig[item.level] || levelConfig.medium;
                  return \`
                    <div class="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                          <span class="px-3 py-1 bg-\${itemConfig.color}-100 text-\${itemConfig.color}-700 rounded-lg text-sm font-medium mr-3">
                            \${item.category}
                          </span>
                          <span class="text-\${itemConfig.color}-600 font-bold">\${item.score}分</span>
                        </div>
                        <span class="px-2 py-0.5 bg-\${itemConfig.color}-100 text-\${itemConfig.color}-700 rounded text-xs">\${itemConfig.text}</span>
                      </div>
                      <p class="text-sm text-gray-600 mb-2">\${item.description}</p>
                      \${item.factors?.length > 0 ? \`
                        <div class="mb-2">
                          <div class="text-xs text-gray-500 mb-1">风险因素:</div>
                          <div class="flex flex-wrap gap-1">
                            \${item.factors.map(f => \`<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">\${f}</span>\`).join('')}
                          </div>
                        </div>
                      \` : ''}
                      \${item.recommendations?.length > 0 ? \`
                        <div class="mt-2 p-2 bg-blue-50 rounded-lg">
                          <div class="text-xs text-blue-700 font-medium mb-1"><i class="fas fa-lightbulb mr-1"></i>建议措施</div>
                          <ul class="space-y-0.5">
                            \${item.recommendations.map(r => \`<li class="text-xs text-blue-600">• \${r}</li>\`).join('')}
                          </ul>
                        </div>
                      \` : ''}
                    </div>
                  \`;
                }).join('')}
              </div>
            \` : ''}
            
            <!-- 关键问题 -->
            \${risk.criticalIssues?.length > 0 ? \`
              <div class="p-4 bg-red-50 rounded-xl border border-red-200">
                <h4 class="font-bold text-red-900 mb-3"><i class="fas fa-exclamation-circle mr-2"></i>需重点关注</h4>
                <ul class="space-y-2">
                  \${risk.criticalIssues.map(issue => \`
                    <li class="flex items-start">
                      <i class="fas fa-arrow-right text-red-500 mr-2 mt-1"></i>
                      <span class="text-sm text-red-700">\${issue}</span>
                    </li>
                  \`).join('')}
                </ul>
              </div>
            \` : ''}
            
            <!-- 安全边际 -->
            \${risk.safetyMargin ? \`
              <div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 class="font-bold text-blue-900 mb-2"><i class="fas fa-balance-scale mr-2"></i>安全边际评估</h4>
                <p class="text-sm text-blue-700">\${risk.safetyMargin}</p>
              </div>
            \` : ''}
          </div>
        \`;
        
        document.getElementById('aiLastUpdate').textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN');
        
      } catch (e) {
        initialDiv.innerHTML = \`<div class="py-8"><i class="fas fa-wifi text-4xl text-red-500 mb-4"></i><p class="text-red-500">网络错误</p><button onclick="getRiskAssessment()" class="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm">重试</button></div>\`;
      }
    }
    
    // 市场对标分析
    async function getMarketBenchmark() {
      if (!currentProject) {
        showToast('请先选择一个项目', 'error');
        return;
      }
      
      const resultDiv = document.getElementById('aiMarketResult');
      const initialDiv = document.getElementById('aiMarketPanel').querySelector('.text-center');
      
      initialDiv.innerHTML = '<div class="py-8"><i class="fas fa-spinner fa-spin text-4xl text-emerald-600 mb-4"></i><p class="text-gray-500">AI正在分析市场数据...</p><p class="text-xs text-gray-400 mt-2">对比行业标准评估竞争力</p></div>';
      resultDiv.classList.add('hidden');
      
      try {
        const template = templates.find(t => t.id === currentProject.templateId);
        const res = await fetch('/api/ai/market-benchmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentParams: currentProject.params,
            templateName: template?.name || '未知行业',
            industry: template?.industry || '未知'
          })
        });
        
        const market = await res.json();
        aiMarketCache = market;
        
        if (!market.success) {
          initialDiv.innerHTML = \`<div class="py-8"><i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i><p class="text-red-500">分析失败</p><button onclick="getMarketBenchmark()" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">重新分析</button></div>\`;
          return;
        }
        
        initialDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
        
        const competitiveness = market.competitiveness || 50;
        const compColor = competitiveness >= 70 ? 'emerald' : competitiveness >= 40 ? 'amber' : 'red';
        
        resultDiv.innerHTML = \`
          <div class="space-y-4">
            <!-- 市场竞争力评分 -->
            <div class="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h4 class="font-bold text-emerald-900 text-lg"><i class="fas fa-chart-bar mr-2"></i>市场竞争力</h4>
                  <p class="text-emerald-700 text-sm">\${market.marketAnalysis || '基于行业数据综合评估'}</p>
                </div>
                <div class="text-center">
                  <div class="relative w-20 h-20">
                    <svg class="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="35" stroke="#e5e7eb" stroke-width="8" fill="none" />
                      <circle cx="40" cy="40" r="35" stroke="url(#gradient)" stroke-width="8" fill="none" 
                        stroke-dasharray="\${competitiveness * 2.2} 220" stroke-linecap="round" />
                      <defs>
                        <linearGradient id="gradient">
                          <stop offset="0%" stop-color="#10b981" />
                          <stop offset="100%" stop-color="#0d9488" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-xl font-bold text-\${compColor}-600">\${competitiveness}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 参数对标详情 -->
            \${market.benchmarks?.length > 0 ? \`
              <div class="space-y-3">
                <h4 class="font-bold text-gray-800"><i class="fas fa-list-check mr-2 text-gray-400"></i>参数市场对标</h4>
                \${market.benchmarks.map(b => {
                  const posColor = b.position === 'above' ? 'emerald' : b.position === 'below' ? 'red' : 'amber';
                  const posText = b.position === 'above' ? '高于市场' : b.position === 'below' ? '低于市场' : '市场平均';
                  return \`
                    <div class="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div class="flex items-center justify-between mb-3">
                        <span class="font-bold text-gray-800">\${b.param}</span>
                        <span class="px-2 py-1 bg-\${posColor}-100 text-\${posColor}-700 rounded text-xs font-medium">\${posText}</span>
                      </div>
                      <div class="relative mb-3">
                        <div class="flex justify-between text-xs text-gray-500 mb-1">
                          <span>市场最低: \${b.marketLow}</span>
                          <span>市场平均: \${b.marketAvg}</span>
                          <span>市场最高: \${b.marketHigh}</span>
                        </div>
                        <div class="h-3 bg-gradient-to-r from-red-200 via-amber-200 to-emerald-200 rounded-full relative">
                          <div class="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-teal-600 rounded-full border-2 border-white shadow" style="left: calc(\${
                            b.position === 'below' ? 10 : b.position === 'above' ? 90 : 50
                          }% - 8px)">
                            <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-teal-600 whitespace-nowrap">
                              \${b.currentValue}
                            </div>
                          </div>
                        </div>
                      </div>
                      \${b.recommendation ? \`
                        <div class="mt-4 p-2 bg-blue-50 rounded-lg">
                          <p class="text-xs text-blue-700"><i class="fas fa-lightbulb mr-1 text-blue-500"></i>\${b.recommendation}</p>
                        </div>
                      \` : ''}
                    </div>
                  \`;
                }).join('')}
              </div>
            \` : ''}
            
            <!-- 综合评价 -->
            \${market.summary ? \`
              <div class="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <h4 class="font-bold text-teal-900 mb-2"><i class="fas fa-clipboard-check mr-2"></i>综合评价</h4>
                <p class="text-sm text-teal-700">\${market.summary}</p>
              </div>
            \` : ''}
          </div>
        \`;
        
        document.getElementById('aiLastUpdate').textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN');
        
      } catch (e) {
        initialDiv.innerHTML = \`<div class="py-8"><i class="fas fa-wifi text-4xl text-red-500 mb-4"></i><p class="text-red-500">网络错误</p><button onclick="getMarketBenchmark()" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">重试</button></div>\`;
      }
    }
    
    // ==================== 工具函数 ====================
    function saveProjects() { localStorage.setItem('rbf_projects', JSON.stringify(projects)); }
    function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }); }
    function formatTime(dateStr) { return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
    
    // ==================== AI智能助手 ====================
    let aiChatOpen = false;
    let aiChatMessages = [];
    let aiChatLoading = false;
    
    function toggleAIChat() {
      aiChatOpen = !aiChatOpen;
      const chatWindow = document.getElementById('aiChatWindow');
      const fab = document.getElementById('aiAssistantFab');
      
      if (aiChatOpen) {
        chatWindow.classList.remove('hidden');
        fab.innerHTML = '<i class="fas fa-times"></i>';
        fab.classList.remove('has-unread');
        document.getElementById('aiChatInput').focus();
        
        // 如果是首次打开，显示欢迎消息
        if (aiChatMessages.length === 0) {
          addAIMessage('assistant', '你好！我是小通 🤖，你的AI助手~\\n\\n我可以帮你了解如何使用这个平台，或者随便聊聊都行。有什么想问的吗？');
        }
      } else {
        chatWindow.classList.add('hidden');
        fab.innerHTML = '<i class="fas fa-robot"></i>';
      }
    }
    
    function addAIMessage(role, content) {
      aiChatMessages.push({ role, content });
      renderAIChatMessages();
    }
    
    function renderAIChatMessages() {
      const container = document.getElementById('aiChatMessagesContainer');
      container.innerHTML = aiChatMessages.map(msg => {
        const isUser = msg.role === 'user';
        const avatarIcon = isUser ? 'fa-user' : 'fa-robot';
        return \`
          <div class="ai-message \${msg.role}">
            <div class="ai-message-avatar">
              <i class="fas \${avatarIcon} text-sm"></i>
            </div>
            <div class="ai-message-content">\${msg.content.replace(/\\n/g, '<br>')}</div>
          </div>
        \`;
      }).join('');
      
      // 如果正在加载，显示打字指示器
      if (aiChatLoading) {
        container.innerHTML += \`
          <div class="ai-message assistant">
            <div class="ai-message-avatar">
              <i class="fas fa-robot text-sm"></i>
            </div>
            <div class="ai-typing-indicator">
              <div class="ai-typing-dot"></div>
              <div class="ai-typing-dot"></div>
              <div class="ai-typing-dot"></div>
            </div>
          </div>
        \`;
      }
      
      container.scrollTop = container.scrollHeight;
    }
    
    async function sendAIMessage() {
      const input = document.getElementById('aiChatInput');
      const message = input.value.trim();
      
      if (!message || aiChatLoading) return;
      
      // 添加用户消息
      addAIMessage('user', message);
      input.value = '';
      
      // 显示加载状态
      aiChatLoading = true;
      renderAIChatMessages();
      
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: aiChatMessages.map(m => ({ role: m.role, content: m.content }))
          })
        });
        
        const data = await res.json();
        aiChatLoading = false;
        
        if (data.success) {
          addAIMessage('assistant', data.message);
        } else {
          addAIMessage('assistant', data.message || '抱歉，我遇到了一些问题，请稍后再试~');
        }
      } catch (e) {
        aiChatLoading = false;
        addAIMessage('assistant', '网络好像出了点问题，请检查网络后再试~');
      }
    }
    
    function handleAIChatKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAIMessage();
      }
    }
    
    function askQuickQuestion(question) {
      document.getElementById('aiChatInput').value = question;
      sendAIMessage();
    }
    
    function clearAIChat() {
      aiChatMessages = [];
      renderAIChatMessages();
      addAIMessage('assistant', '对话已清空~有什么新问题随时问我！😊');
    }
    
    init();
  </script>
  
  <!-- ==================== AI智能助手浮窗 ==================== -->
  <div id="aiAssistantFab" class="ai-assistant-fab" onclick="toggleAIChat()">
    <i class="fas fa-robot"></i>
  </div>
  
  <div id="aiChatWindow" class="ai-chat-window hidden">
    <!-- 头部 -->
    <div class="ai-chat-header">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
          <i class="fas fa-robot text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-white font-bold">小通 AI助手</h3>
          <p class="text-white/70 text-xs">随时为您解答</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="clearAIChat()" class="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors" title="清空对话">
          <i class="fas fa-trash-alt text-white/80 text-sm"></i>
        </button>
        <button onclick="toggleAIChat()" class="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
          <i class="fas fa-minus text-white/80"></i>
        </button>
      </div>
    </div>
    
    <!-- 消息区域 -->
    <div id="aiChatMessagesContainer" class="ai-chat-messages">
      <!-- 消息将通过JS渲染 -->
    </div>
    
    <!-- 快捷问题 -->
    <div class="ai-quick-questions">
      <button class="ai-quick-btn" onclick="askQuickQuestion('如何创建新项目？')">如何创建项目</button>
      <button class="ai-quick-btn" onclick="askQuickQuestion('怎么邀请对方协商？')">邀请协作</button>
      <button class="ai-quick-btn" onclick="askQuickQuestion('如何修改合同条款？')">修改条款</button>
      <button class="ai-quick-btn" onclick="askQuickQuestion('这个平台有什么功能？')">平台功能</button>
    </div>
    
    <!-- 输入区域 -->
    <div class="ai-chat-input-area">
      <div class="ai-chat-input-wrapper">
        <input 
          type="text" 
          id="aiChatInput" 
          class="ai-chat-input" 
          placeholder="问我任何问题..."
          onkeydown="handleAIChatKeydown(event)"
        >
        <button class="ai-chat-send-btn" onclick="sendAIMessage()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</body>
</html>`)
})

export default app
