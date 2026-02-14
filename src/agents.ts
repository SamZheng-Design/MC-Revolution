// 多Agent并行工作流系统 V2
// 基于滴灌通联营协议V3标准模板的模块化AI Agent
// 优化版本：添加超时控制、流式响应、智能降级

/**
 * Agent工作流架构设计:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     用户自然语言输入                          │
 * └─────────────────────────┬───────────────────────────────────┘
 *                           ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │              快速路由器 (Fast Router)                        │
 * │  - 关键词快速匹配 + LLM辅助验证                              │
 * │  - 15秒超时自动降级                                          │
 * └─────────────────────────┬───────────────────────────────────┘
 *                           ▼
 *     ┌─────────────────────┼─────────────────────┐
 *     ▼                     ▼                     ▼
 * ┌────────┐          ┌────────┐           ┌────────┐
 * │投资分成│          │违约责任│           │担保条款│  ... (并行执行)
 * │ Agent  │          │ Agent  │           │ Agent  │
 * │ 15s超时│          │ 15s超时│           │ 15s超时│
 * └────┬───┘          └────┬───┘           └────┬───┘
 *      │                   │                    │
 *      └───────────────────┼────────────────────┘
 *                          ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  结果聚合器 (Aggregator)                      │
 * │  - 合并成功Agent的修改建议                                    │
 * │  - 检查参数冲突                                               │
 * │  - 生成统一结果                                               │
 * └─────────────────────────────────────────────────────────────┘
 */

// ==================== 类型定义 ====================

export interface ContractAgent {
  id: string
  name: string
  icon: string
  color: string
  description: string
  moduleIds: string[]
  expertise: string[]
  paramKeys: string[]
  systemPrompt: string
}

export interface AgentTask {
  agentId: string
  input: string
  context: {
    currentParams: Record<string, any>
    templateId: string
    templateName: string
    negotiationHistory?: any[]
    perspective?: string
  }
}

export interface AgentResponse {
  agentId: string
  agentName: string
  success: boolean
  understood?: string
  changes: ParamChange[]
  suggestions?: string[]
  warnings?: string[]
  processingTime: number
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'
}

export interface ParamChange {
  key: string
  paramName: string
  oldValue: string
  newValue: string
  clauseText: string
  impact?: string
}

// ==================== 智能联动修改系统类型 ====================

/**
 * 变更类型枚举
 */
export type ChangeType = 'primary' | 'inferred'

/**
 * 推断修改的置信度
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * 智能变更项 - 包含直接修改和推断修改
 */
export interface SmartChange extends ParamChange {
  changeType: ChangeType           // 'primary' 直接修改, 'inferred' 推断修改
  confidence?: ConfidenceLevel     // 推断修改的置信度
  reason?: string                  // 推断修改的理由
  relatedTo?: string               // 关联的直接修改key
  selected?: boolean               // 用户是否确认选中（默认：直接修改true，推断修改false）
  category?: string                // 分类：unit_conversion | calculation_method | formula_update | related_term
}

/**
 * 智能变更分析结果
 */
export interface SmartChangeResult {
  success: boolean
  understood: string               // AI理解的用户意图
  primaryChanges: SmartChange[]    // 直接修改（用户明确要求的）
  inferredChanges: SmartChange[]   // 推断修改（AI分析出的关联延申）
  analysisExplanation: string      // AI对整体分析的解释
  warnings: string[]               // 风险警告
  agentResponses?: AgentResponse[] // 各Agent响应详情
  processingTime: number
}

/**
 * 用户确认的变更结果
 */
export interface ConfirmedChanges {
  primaryChanges: SmartChange[]    // 确认的直接修改
  inferredChanges: SmartChange[]   // 确认的推断修改
  rejectedChanges: SmartChange[]   // 用户拒绝的修改
}

/**
 * 参数关联规则 - 定义参数之间的逻辑关系
 */
export interface ParamRelation {
  sourceParam: string              // 源参数
  targetParam: string              // 目标参数
  relationType: 'conversion' | 'calculation' | 'dependency' | 'constraint'
  rule: string                     // 关系规则描述
  autoInfer: boolean               // 是否自动推断
}

export interface RouterResult {
  understood: string
  targetAgents: string[]
  taskDescriptions: Record<string, string>
  crossDependencies?: string[]
  confidence: number
}

export interface WorkflowResult {
  success: boolean
  understood: string
  allChanges: ParamChange[]
  allSuggestions: string[]
  allWarnings: string[]
  agentResponses: AgentResponse[]
  totalAgents: number
  respondedAgents: number
  totalProcessingTime: number
  routerResult?: RouterResult
}

// ==================== 配置常量 ====================

const CONFIG = {
  AGENT_TIMEOUT_MS: 20000,      // 单Agent超时：20秒
  ROUTER_TIMEOUT_MS: 10000,     // 路由器超时：10秒
  MAX_PARALLEL_AGENTS: 3,       // 最大并行Agent数
  MODEL_FAST: 'claude-haiku-4-5', // 快速非reasoning模型（速度快，无reasoning延迟）
  MODEL_QUALITY: 'claude-sonnet-4-5', // 高质量模型（需要更复杂分析时使用）
  MAX_TOKENS: 800,              // Agent最大token数
  ROUTER_MAX_TOKENS: 400,       // 路由器最大token数
}

// ==================== Agent定义 ====================

export const contractAgents: Record<string, ContractAgent> = {
  // 1. 投资分成Agent - 核心商业条款
  'investment-revenue': {
    id: 'investment-revenue',
    name: '投资分成专家',
    icon: 'fa-coins',
    color: 'yellow',
    description: '负责联营资金、分成比例、年化收益率等核心商业条款',
    moduleIds: ['investment-revenue', 'business-arrangement'],
    expertise: [
      '投资', '资金', '分成', '比例', '收益', '回报', '期限', '金额',
      '联营资金', '分成比例', '年化', '收益率', '分成期', '万元', '百分比',
      '800万', '500万', '1000万', '10%', '15%', '20%', '25%', '30%'
    ],
    paramKeys: [
      'investmentAmount', 'revenueShareRatio', 'annualYieldRate',
      'sharingStartDate', 'sharingEndDate', 'fundUsage'
    ],
    systemPrompt: `你是【投资分成专家】，负责处理联营资金和分成比例相关的条款修改。

当前参数值：
##PARAMS##

请分析用户的修改意图并给出建议。输出纯JSON（不要markdown代码块）：
{"understood":"简述意图","changes":[{"key":"investmentAmount","paramName":"联营资金金额","oldValue":"500万","newValue":"800万","clauseText":"本次联营资金金额为人民币800万元","impact":"融资方获得更多资金"}],"suggestions":[],"warnings":[]}`
  },

  // 2. 数据对账Agent
  'data-payment': {
    id: 'data-payment',
    name: '数据对账专家',
    icon: 'fa-chart-line',
    color: 'blue',
    description: '负责数据传输方式、频率、对账机制、付款安排',
    moduleIds: ['data-payment', 'data-transmission'],
    expertise: [
      '数据', '传输', '上报', '对账', '付款', '频率', '系统', 'POS',
      '日报', '周报', '月报', '自动', '手动', '结算', '每日', '每周', '每月'
    ],
    paramKeys: [
      'dataTransmissionMethod', 'dataReportFrequency', 'dataSource',
      'paymentMethod', 'paymentFrequency', 'reconciliationDays'
    ],
    systemPrompt: `你是【数据对账专家】，负责处理数据传输和付款频率相关条款。

当前参数值：
##PARAMS##

重要：数据延迟超30天=严重违约！

请分析用户的修改意图并给出建议。输出纯JSON：
{"understood":"简述意图","changes":[{"key":"dataReportFrequency","paramName":"数据传输频率","oldValue":"每自然日","newValue":"每周","clauseText":"数据传输频率为每周一次","impact":"降低数据上报工作量"}],"suggestions":[],"warnings":[]}`
  },

  // 3. 提前终止Agent
  'early-termination': {
    id: 'early-termination',
    name: '终止条款专家',
    icon: 'fa-door-open',
    color: 'orange',
    description: '负责提前终止、亏损闭店、补偿金计算',
    moduleIds: ['early-termination'],
    expertise: [
      '终止', '退出', '闭店', '亏损', '补偿', '提前', '结束', '解约',
      '补偿金', '通知期', '90天', '解除', '闭店', '停业'
    ],
    paramKeys: [
      'lossClosurePeriod', 'lossClosureThreshold', 'lossClosureNoticeDays', 'annualYieldRate'
    ],
    systemPrompt: `你是【终止条款专家】，负责处理提前终止和亏损闭店相关条款。

当前参数值：
##PARAMS##

规则：提前终止需7天通知；补偿金=联营资金×(1+年化÷360×(已分成天数+7))；不满90天按90天

请分析用户的修改意图并给出建议。输出纯JSON：
{"understood":"简述意图","changes":[{"key":"lossClosurePeriod","paramName":"亏损闭店期限","oldValue":"3个月","newValue":"6个月","clauseText":"连续亏损6个月可申请闭店","impact":"延长观察期"}],"suggestions":[],"warnings":[]}`
  },

  // 4. 违约责任Agent - 最重要
  'breach-liability': {
    id: 'breach-liability',
    name: '违约责任专家',
    icon: 'fa-gavel',
    color: 'red',
    description: '负责违约情形认定、违约金、严重违约处理',
    moduleIds: ['breach-liability', 'breach'],
    expertise: [
      '违约', '违约金', '罚款', '处罚', '严重违约', '赔偿', '责任',
      '延迟', '逾期', '造假', '挪用', '15%', '20%', '25%', '30天'
    ],
    paramKeys: ['dataDelay', 'paymentDelay', 'breachPenalty'],
    systemPrompt: `你是【违约责任专家】，负责处理违约金和违约认定相关条款。

当前参数值：
##PARAMS##

严重违约情形包括：挪用资金、隐藏收入、失联、擅自停业、欺诈、数据延迟超30天、付款延迟超30天、品牌授权过期等。市场参考：违约金通常15-25%。

请分析用户的修改意图并给出建议。输出纯JSON：
{"understood":"简述意图","changes":[{"key":"breachPenalty","paramName":"违约金比例","oldValue":"20%","newValue":"15%","clauseText":"违约金为联营资金的15%","impact":"降低融资方违约成本"}],"suggestions":[],"warnings":[]}`
  },

  // 5. 禁止行为Agent
  'prohibited-actions': {
    id: 'prohibited-actions',
    name: '合规管控专家',
    icon: 'fa-ban',
    color: 'purple',
    description: '负责控制权变更、品牌转让、收入处置等禁止事项',
    moduleIds: ['prohibited-actions', 'rights-obligations'],
    expertise: [
      '禁止', '不得', '控制权', '股东', '转让', '处置', '变更',
      '搬迁', '停业', '收入', '贴现', '保理', '经营', '品牌'
    ],
    paramKeys: ['controlChange', 'brandTransfer', 'revenueDisposal', 'operationChange'],
    systemPrompt: `你是【合规管控专家】，负责处理禁止行为和控制权变更相关条款。

当前参数值：
##PARAMS##

四大禁止行为：1.变更实际控制人(需同意) 2.转让品牌经营权 3.收入出售/贴现/保理 4.擅自停业/搬迁/变更业务

请分析用户的修改意图并给出建议。输出纯JSON：
{"understood":"简述意图","changes":[{"key":"controlChange","paramName":"控制权变更限制","oldValue":"需事先同意","newValue":"需提前30天通知","clauseText":"控制权变更需提前30天书面通知","impact":"增加融资方灵活性"}],"suggestions":[],"warnings":[]}`
  },

  // 6. 担保责任Agent
  'guarantee': {
    id: 'guarantee',
    name: '担保责任专家',
    icon: 'fa-shield-halved',
    color: 'green',
    description: '负责连带责任、实际控制人责任、品牌方担保',
    moduleIds: ['guarantee', 'representations'],
    expertise: [
      '担保', '连带', '保证', '责任', '实际控制人', '品牌方',
      '代理商', '总公司', '共同', '无限责任'
    ],
    paramKeys: ['mguLiability', 'brandLiability', 'controllerLiability', 'agentLiability'],
    systemPrompt: `你是【担保责任专家】，负责处理连带责任和担保相关条款。

当前参数值：
##PARAMS##

责任体系：联营方(MGU)第一责任 → 品牌方连带 → 品牌代理商连带 → 各方实际控制人无限连带

请分析用户的修改意图并给出建议。输出纯JSON：
{"understood":"简述意图","changes":[{"key":"controllerLiability","paramName":"实际控制人责任","oldValue":"无限连带","newValue":"有限连带","clauseText":"实际控制人承担有限连带责任","impact":"降低个人风险"}],"suggestions":[],"warnings":[]}`
  },

  // 7. 门店资产Agent
  'store-info': {
    id: 'store-info',
    name: '资产信息专家',
    icon: 'fa-store',
    color: 'teal',
    description: '负责门店信息、品牌、证照、设备等资产相关',
    moduleIds: ['store-info', 'appendix-assets'],
    expertise: [
      '门店', '地址', '品牌', '证照', '许可证', '设备', '资产',
      '位置', '名称', '营业执照', '食品', '医疗', '经营'
    ],
    paramKeys: [
      'storeName', 'storeAddress', 'brandName', 'requiredLicenses',
      'assetType', 'equipmentType', 'equipmentCount'
    ],
    systemPrompt: `你是【资产信息专家】，负责处理门店信息和证照相关条款。

当前参数值：
##PARAMS##

行业证照：餐饮(营业执照+食品许可)、医美(医疗执业+卫生)、教育(营业执照+办学许可)

请分析用户的修改意图并给出建议。输出纯JSON：
{"understood":"简述意图","changes":[{"key":"storeAddress","paramName":"门店地址","oldValue":"待确定","newValue":"深圳市南山区xxx","clauseText":"门店地址位于深圳市南山区xxx","impact":"明确经营地点"}],"suggestions":[],"warnings":[]}`
  },

  // 8. 争议解决Agent
  'dispute-resolution': {
    id: 'dispute-resolution',
    name: '法律事务专家',
    icon: 'fa-balance-scale',
    color: 'indigo',
    description: '负责仲裁、保密、通知、合规等法律事务',
    moduleIds: ['dispute-resolution', 'law-dispute', 'confidentiality'],
    expertise: [
      '仲裁', '法律', '争议', '保密', '通知', '诉讼', '法院',
      '深圳', '合规', '廉洁', '仲裁院', '保密期'
    ],
    paramKeys: [
      'arbitrationInstitution', 'arbitrationPlace', 'confidentialityPeriod',
      'complianceEmail', 'contactChangeNotice', 'responseTime'
    ],
    systemPrompt: `你是【法律事务专家】，负责处理仲裁、保密和法律合规相关条款。

当前参数值：
##PARAMS##

默认配置：仲裁机构=深圳国际仲裁院；仲裁地=深圳；保密期=协议终止后2-5年

请分析用户的修改意图并给出建议。输出纯JSON：
{"understood":"简述意图","changes":[{"key":"arbitrationPlace","paramName":"仲裁地","oldValue":"深圳","newValue":"北京","clauseText":"仲裁地点为北京","impact":"便于北京的当事方"}],"suggestions":[],"warnings":[]}`
  }
}

// Agent列表（用于API返回）
export const agentList = Object.values(contractAgents).map(agent => ({
  id: agent.id,
  name: agent.name,
  icon: agent.icon,
  color: agent.color,
  description: agent.description,
  moduleIds: agent.moduleIds,
  expertise: agent.expertise
}))

// ==================== 路由器实现 ====================

/**
 * 快速关键词匹配路由
 */
function quickMatchAgents(message: string): { agents: string[]; confidence: number } {
  const matched: { id: string; score: number }[] = []
  const lowerMessage = message.toLowerCase()
  
  for (const [agentId, agent] of Object.entries(contractAgents)) {
    let score = 0
    for (const keyword of agent.expertise) {
      // 精确匹配和模糊匹配
      if (message.includes(keyword)) {
        score += 2  // 精确匹配
      } else if (lowerMessage.includes(keyword.toLowerCase())) {
        score += 1  // 模糊匹配
      }
    }
    if (score > 0) {
      matched.push({ id: agentId, score })
    }
  }
  
  matched.sort((a, b) => b.score - a.score)
  
  // 计算置信度
  const topScore = matched[0]?.score || 0
  const confidence = Math.min(100, topScore * 15)
  
  // 返回得分最高的Agent（最多3个）
  const agents = matched.slice(0, CONFIG.MAX_PARALLEL_AGENTS).map(m => m.id)
  
  return { agents, confidence }
}

/**
 * LLM增强路由（带超时）
 */
async function llmEnhancedRoute(
  message: string,
  quickMatch: { agents: string[]; confidence: number },
  apiKey: string,
  baseUrl: string
): Promise<RouterResult> {
  // 如果快速匹配置信度很高，直接使用
  if (quickMatch.confidence >= 80) {
    return {
      understood: message.slice(0, 50),
      targetAgents: quickMatch.agents,
      taskDescriptions: Object.fromEntries(quickMatch.agents.map(id => [id, message])),
      confidence: quickMatch.confidence
    }
  }

  const routerPrompt = `分析用户输入，判断应该分配给哪些专家处理。

可用专家：
1. investment-revenue(投资分成) - 关键词：投资/资金/分成/比例/收益/金额/万元
2. data-payment(数据对账) - 关键词：数据/传输/上报/对账/付款/频率
3. early-termination(终止条款) - 关键词：终止/退出/闭店/亏损/补偿
4. breach-liability(违约责任) - 关键词：违约/违约金/罚款/延迟/处罚
5. prohibited-actions(合规管控) - 关键词：禁止/控制权/转让/搬迁
6. guarantee(担保责任) - 关键词：担保/连带/保证/责任
7. store-info(资产信息) - 关键词：门店/地址/品牌/证照
8. dispute-resolution(法律事务) - 关键词：仲裁/保密/通知

用户输入：${message}

快速匹配建议：${quickMatch.agents.join(', ')} (置信度${quickMatch.confidence}%)

输出JSON：{"understood":"用户意图","targetAgents":["agent-id"],"confidence":85}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.ROUTER_TIMEOUT_MS)

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL_FAST,
        messages: [{ role: 'user', content: routerPrompt }],
        temperature: 0.1,
        max_tokens: CONFIG.ROUTER_MAX_TOKENS
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('API error')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        understood: result.understood || message.slice(0, 50),
        targetAgents: result.targetAgents?.length > 0 ? result.targetAgents.slice(0, CONFIG.MAX_PARALLEL_AGENTS) : quickMatch.agents,
        taskDescriptions: Object.fromEntries((result.targetAgents || quickMatch.agents).map((id: string) => [id, message])),
        confidence: result.confidence || quickMatch.confidence
      }
    }
  } catch (e) {
    console.log('LLM routing fallback to quick match:', e)
  }

  // 回退到快速匹配
  return {
    understood: message.slice(0, 50),
    targetAgents: quickMatch.agents.length > 0 ? quickMatch.agents : ['investment-revenue'],
    taskDescriptions: Object.fromEntries((quickMatch.agents.length > 0 ? quickMatch.agents : ['investment-revenue']).map(id => [id, message])),
    confidence: quickMatch.confidence
  }
}

/**
 * 路由到Agent（主入口）
 */
export async function routeToAgents(
  message: string,
  apiKey: string,
  baseUrl: string
): Promise<RouterResult> {
  // Step 1: 快速关键词匹配
  const quickMatch = quickMatchAgents(message)
  
  // Step 2: LLM增强（带超时）
  return llmEnhancedRoute(message, quickMatch, apiKey, baseUrl)
}

// ==================== Agent执行 ====================

/**
 * 带超时的fetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (e) {
    clearTimeout(timeoutId)
    throw e
  }
}

/**
 * 执行单个Agent任务
 */
export async function executeAgentTask(
  task: AgentTask,
  apiKey: string,
  baseUrl: string
): Promise<AgentResponse> {
  const startTime = Date.now()
  const agent = contractAgents[task.agentId]
  
  if (!agent) {
    return {
      agentId: task.agentId,
      agentName: 'Unknown',
      success: false,
      changes: [],
      warnings: ['Agent未找到'],
      processingTime: Date.now() - startTime,
      status: 'failed'
    }
  }

  // 构建参数字符串
  const relevantParams = agent.paramKeys
    .map(key => `- ${key}: ${task.context.currentParams[key] || '未设置'}`)
    .join('\n')

  // 获取视角信息
  const perspective = task.context.perspective === 'investor' ? '投资方' : '融资方'

  // 构建完整提示词
  const prompt = `${agent.systemPrompt.replace('##PARAMS##', relevantParams)}

---
【用户请求】${task.input}
【当前视角】${perspective}
【行业】${task.context.templateName}
---
现在请直接输出JSON结果（不要用代码块包裹）：`

  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: CONFIG.MODEL_FAST,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: CONFIG.MAX_TOKENS
        })
      },
      CONFIG.AGENT_TIMEOUT_MS
    )

    if (!response.ok) {
      return {
        agentId: task.agentId,
        agentName: agent.name,
        success: false,
        changes: [],
        warnings: ['API请求失败'],
        processingTime: Date.now() - startTime,
        status: 'failed'
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 尝试多种方式提取JSON
    let jsonStr = ''
    
    // 方法1: 提取 ```json ... ``` 代码块
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }
    
    // 方法2: 直接匹配 { ... } 
    if (!jsonStr) {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }
    }
    
    // 方法3: 整个内容就是JSON
    if (!jsonStr && content.trim().startsWith('{')) {
      jsonStr = content.trim()
    }
    
    if (jsonStr) {
      try {
        // 清理可能的问题字符
        jsonStr = jsonStr
          .replace(/[\u0000-\u001F]+/g, ' ')  // 移除控制字符
          .replace(/,(\s*[}\]])/g, '$1')       // 移除尾部逗号
        
        const result = JSON.parse(jsonStr)
        
        // 验证和标准化changes数组
        const changes = Array.isArray(result.changes) 
          ? result.changes.filter((c: any) => c && typeof c === 'object' && c.key)
          : []
        
        return {
          agentId: task.agentId,
          agentName: agent.name,
          success: true,
          understood: result.understood || '处理完成',
          changes,
          suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
          warnings: Array.isArray(result.warnings) ? result.warnings : [],
          processingTime: Date.now() - startTime,
          status: 'completed'
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Content:', jsonStr.slice(0, 200))
      }
    }

    // 如果解析失败但有内容，尝试提取有用信息
    if (content.length > 10) {
      return {
        agentId: task.agentId,
        agentName: agent.name,
        success: false,
        understood: content.slice(0, 100),
        changes: [],
        warnings: ['响应格式不正确，无法自动解析'],
        processingTime: Date.now() - startTime,
        status: 'failed'
      }
    }

    return {
      agentId: task.agentId,
      agentName: agent.name,
      success: false,
      changes: [],
      warnings: ['响应为空'],
      processingTime: Date.now() - startTime,
      status: 'failed'
    }
  } catch (error) {
    const isTimeout = (error as Error).name === 'AbortError'
    return {
      agentId: task.agentId,
      agentName: agent.name,
      success: false,
      changes: [],
      warnings: [isTimeout ? '处理超时' : `执行错误: ${(error as Error).message}`],
      processingTime: Date.now() - startTime,
      status: isTimeout ? 'timeout' : 'failed'
    }
  }
}

// ==================== 并行工作流执行 ====================

/**
 * 执行多Agent并行工作流
 */
export async function executeMultiAgentWorkflow(
  message: string,
  context: {
    currentParams: Record<string, any>
    templateId: string
    templateName: string
    negotiationHistory?: any[]
    perspective?: string
  },
  apiKey: string,
  baseUrl: string
): Promise<WorkflowResult> {
  const startTime = Date.now()

  // Step 1: 路由分析
  const routerResult = await routeToAgents(message, apiKey, baseUrl)

  // Step 2: 构建任务
  const tasks: AgentTask[] = routerResult.targetAgents.map(agentId => ({
    agentId,
    input: routerResult.taskDescriptions[agentId] || message,
    context
  }))

  // Step 3: 并行执行（使用Promise.allSettled确保所有任务都能返回结果）
  const results = await Promise.allSettled(
    tasks.map(task => executeAgentTask(task, apiKey, baseUrl))
  )

  // Step 4: 收集结果
  const agentResponses: AgentResponse[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      const agent = contractAgents[tasks[index].agentId]
      return {
        agentId: tasks[index].agentId,
        agentName: agent?.name || 'Unknown',
        success: false,
        changes: [],
        warnings: [`执行失败: ${result.reason}`],
        processingTime: 0,
        status: 'failed' as const
      }
    }
  })

  // Step 5: 聚合结果
  const allChanges: ParamChange[] = []
  const allSuggestions: string[] = []
  const allWarnings: string[] = []

  for (const response of agentResponses) {
    if (response.success && response.changes) {
      allChanges.push(...response.changes)
      if (response.suggestions) {
        allSuggestions.push(...response.suggestions.map(s => `[${response.agentName}] ${s}`))
      }
    }
    if (response.warnings) {
      allWarnings.push(...response.warnings.map(w => `[${response.agentName}] ${w}`))
    }
  }

  // Step 6: 检测参数冲突
  const paramChangeCount: Record<string, string[]> = {}
  for (const change of allChanges) {
    if (!paramChangeCount[change.key]) {
      paramChangeCount[change.key] = []
    }
    paramChangeCount[change.key].push(change.newValue)
  }
  
  for (const [key, values] of Object.entries(paramChangeCount)) {
    if (values.length > 1) {
      const uniqueValues = [...new Set(values)]
      if (uniqueValues.length > 1) {
        allWarnings.push(`⚠️ 参数冲突：${key} 有多个不同的建议值 (${uniqueValues.join(' vs ')})，请人工确认`)
      }
    }
  }

  // Step 7: 添加跨模块依赖警告
  if (routerResult.crossDependencies) {
    allWarnings.push(...routerResult.crossDependencies.map(d => `[跨模块] ${d}`))
  }

  const totalProcessingTime = Date.now() - startTime

  return {
    success: agentResponses.some(r => r.success),
    understood: routerResult.understood,
    allChanges,
    allSuggestions: [...new Set(allSuggestions)], // 去重
    allWarnings: [...new Set(allWarnings)],        // 去重
    agentResponses,
    totalAgents: routerResult.targetAgents.length,
    respondedAgents: agentResponses.filter(r => r.success).length,
    totalProcessingTime,
    routerResult
  }
}

// ==================== 导出辅助函数 ====================

/**
 * 获取Agent信息
 */
export function getAgentInfo(agentId: string): ContractAgent | null {
  return contractAgents[agentId] || null
}

/**
 * 根据参数key获取负责的Agent
 */
export function getAgentByParamKey(paramKey: string): ContractAgent | null {
  for (const agent of Object.values(contractAgents)) {
    if (agent.paramKeys.includes(paramKey)) {
      return agent
    }
  }
  return null
}

// ==================== 智能联动修改系统 ====================

/**
 * 规则引擎：基于明确规则检测联动修改
 * 这是LLM分析的补充，确保关键联动不会遗漏
 */
function detectRuleBasedInferredChanges(
  message: string,
  primaryChanges: SmartChange[],
  currentParams: Record<string, any>,
  existingInferred: SmartChange[]
): SmartChange[] {
  const result: SmartChange[] = []
  const lowerMessage = message.toLowerCase()
  
  // 已存在的推断修改key，避免重复
  const existingKeys = new Set(existingInferred.map(c => c.key))
  
  // 规则1：检测月度利率设置 → 资金成本计算方式联动
  const monthlyRatePattern = /按.{0,2}月.{0,5}(\d+\.?\d*)%|月.{0,2}(\d+\.?\d*)%|每月.{0,5}(\d+\.?\d*)%/
  const monthlyMatch = message.match(monthlyRatePattern)
  
  if (monthlyMatch || lowerMessage.includes('按月') || lowerMessage.includes('每月')) {
    // 检查是否涉及收益/利率相关的直接修改
    const hasRateChange = primaryChanges.some(c => 
      ['annualYieldRate', 'monthlyReturnRate', 'revenueShareRatio'].includes(c.key) ||
      c.paramName?.includes('收益') || c.paramName?.includes('利率') || c.paramName?.includes('分成')
    )
    
    // 检查当前资金成本计算方式
    const currentCalcMethod = currentParams.fundCostCalculation || '按日计算'
    
    if (hasRateChange && !existingKeys.has('fundCostCalculation') && !currentCalcMethod.includes('按月')) {
      result.push({
        key: 'fundCostCalculation',
        paramName: '资金成本计算方式',
        oldValue: currentCalcMethod,
        newValue: '按月计算',
        clauseText: '资金成本按月度计算，每月固定日期结算，不足一月按比例折算',
        changeType: 'inferred',
        confidence: 'high',
        reason: '用户指定按月计算收益，资金成本计算方式应与收益计算口径保持一致，改为按月计算',
        relatedTo: primaryChanges.find(c => c.paramName?.includes('收益'))?.key || 'annualYieldRate',
        category: 'calculation_method',
        selected: false
      })
    }
  }
  
  // 规则2：检测日度利率设置 → 资金成本计算方式联动
  const dailyRatePattern = /按.{0,2}日.{0,5}(\d+\.?\d*)%|日.{0,2}(\d+\.?\d*)%|每日.{0,5}(\d+\.?\d*)%/
  
  if (message.match(dailyRatePattern) || lowerMessage.includes('按日') || lowerMessage.includes('每天')) {
    const hasRateChange = primaryChanges.some(c => 
      ['annualYieldRate', 'dailyReturnRate'].includes(c.key) ||
      c.paramName?.includes('收益') || c.paramName?.includes('利率')
    )
    
    const currentCalcMethod = currentParams.fundCostCalculation || ''
    
    if (hasRateChange && !existingKeys.has('fundCostCalculation') && !currentCalcMethod.includes('按日')) {
      result.push({
        key: 'fundCostCalculation',
        paramName: '资金成本计算方式',
        oldValue: currentCalcMethod || '未设置',
        newValue: '按日计算',
        clauseText: '资金成本按日计算，以实际占用天数为准',
        changeType: 'inferred',
        confidence: 'high',
        reason: '用户指定按日计算收益，资金成本计算方式应同步调整为按日计算',
        relatedTo: 'annualYieldRate',
        category: 'calculation_method',
        selected: false
      })
    }
  }
  
  // 规则3：月利率 → 年化利率换算提示
  if (monthlyMatch) {
    const monthlyRate = parseFloat(monthlyMatch[1] || monthlyMatch[2] || monthlyMatch[3])
    if (monthlyRate > 0) {
      const annualRate = (monthlyRate * 12).toFixed(2)
      const hasAnnualRateChange = primaryChanges.some(c => 
        c.key === 'annualYieldRate' && c.newValue.includes(annualRate)
      )
      
      if (!hasAnnualRateChange && !existingKeys.has('annualYieldRate')) {
        // 检查是否直接修改中已经有年化利率的设置
        const existingAnnualChange = primaryChanges.find(c => c.key === 'annualYieldRate')
        if (!existingAnnualChange || !existingAnnualChange.newValue.includes(annualRate)) {
          result.push({
            key: 'annualYieldRateDisplay',
            paramName: '年化收益率换算',
            oldValue: currentParams.annualYieldRate || '未设置',
            newValue: `${annualRate}%（月${monthlyRate}%×12）`,
            clauseText: `按月度收益率${monthlyRate}%换算，年化收益率约为${annualRate}%`,
            changeType: 'inferred',
            confidence: 'high',
            reason: `月度收益率${monthlyRate}%乘以12个月，年化收益率为${annualRate}%`,
            relatedTo: 'monthlyReturnRate',
            category: 'unit_conversion',
            selected: false
          })
        }
      }
    }
  }
  
  // 规则4：投资金额变化 → 违约金联动提示
  const amountChange = primaryChanges.find(c => c.key === 'investmentAmount')
  if (amountChange && !existingKeys.has('breachPenaltyAmount')) {
    const currentPenalty = currentParams.breachPenalty || currentParams.breachPenaltyRate || '20%'
    if (currentPenalty.includes('%')) {
      result.push({
        key: 'breachPenaltyCalculation',
        paramName: '违约金金额',
        oldValue: '基于原投资金额计算',
        newValue: `基于新投资金额（${amountChange.newValue}）重新计算`,
        clauseText: `违约金为投资金额的${currentPenalty}，约为${amountChange.newValue}的${currentPenalty}`,
        changeType: 'inferred',
        confidence: 'medium',
        reason: '投资金额变更后，违约金金额应按新投资金额的固定比例重新计算',
        relatedTo: 'investmentAmount',
        category: 'formula_update',
        selected: false
      })
    }
  }
  
  return result
}

/**
 * 参数关联规则表 - 定义参数之间的逻辑依赖关系
 * 当一个参数变化时，相关参数可能需要联动调整
 */
export const PARAM_RELATIONS: ParamRelation[] = [
  // 收益率相关换算
  {
    sourceParam: 'monthlyReturnRate',
    targetParam: 'annualYieldRate', 
    relationType: 'conversion',
    rule: '月利率 × 12 = 年化利率',
    autoInfer: true
  },
  {
    sourceParam: 'annualYieldRate',
    targetParam: 'monthlyReturnRate',
    relationType: 'conversion', 
    rule: '年化利率 ÷ 12 = 月利率',
    autoInfer: true
  },
  // 分成比例与年化回报
  {
    sourceParam: 'revenueShareRatio',
    targetParam: 'annualYieldRate',
    relationType: 'dependency',
    rule: '分成比例变化可能影响预期年化回报率',
    autoInfer: false
  },
  // 资金成本计算方式
  {
    sourceParam: 'monthlyReturnRate',
    targetParam: 'fundCostCalculation',
    relationType: 'calculation',
    rule: '月利率确定时，资金成本计算应按月而非按日',
    autoInfer: true
  },
  {
    sourceParam: 'dailyReturnRate',
    targetParam: 'fundCostCalculation',
    relationType: 'calculation',
    rule: '日利率确定时，资金成本计算应按日',
    autoInfer: true
  },
  // 投资金额与违约金
  {
    sourceParam: 'investmentAmount',
    targetParam: 'breachPenaltyAmount',
    relationType: 'calculation',
    rule: '违约金通常按投资金额的固定比例计算',
    autoInfer: false
  },
  // 分成期限相关
  {
    sourceParam: 'sharingPeriodMonths',
    targetParam: 'sharingEndDate',
    relationType: 'calculation',
    rule: '分成期限变化需要更新截止日期',
    autoInfer: true
  },
  // 亏损闭店阈值
  {
    sourceParam: 'lossThresholdRatio',
    targetParam: 'lossThresholdAmount',
    relationType: 'calculation',
    rule: '亏损比例变化时，对应金额阈值需重新计算',
    autoInfer: true
  },
  // 数据传输频率与对账周期
  {
    sourceParam: 'dataReportFrequency',
    targetParam: 'reconciliationCycle',
    relationType: 'dependency',
    rule: '数据上报频率变化可能需要调整对账周期',
    autoInfer: false
  }
]

/**
 * 智能联动分析Agent的系统提示词
 */
const SMART_CHANGE_ANALYST_PROMPT = `你是一个专业的合同条款联动分析专家，负责分析用户的修改请求并推断可能的关联修改。

## 你的任务
1. 理解用户的直接修改意图（Primary Changes）
2. 基于合同条款的逻辑关系，推断可能需要联动修改的相关条款（Inferred Changes）
3. 为每个推断修改提供理由和置信度

## 重要的联动关系规则

### 利率/收益率换算
- 月利率 2.75% → 年化利率 33%（2.75% × 12）
- 日利率 0.1% → 年化利率 36.5%（0.1% × 365）
- 当用户提到"按月X%计算"时，需要：
  1. 直接修改：设置月利率
  2. 联动修改：年化利率换算
  3. 联动修改：资金成本计算方式改为"按月"

### 资金成本计算方式联动
- 如果设置月利率 → 资金成本计算应改为"按月计算"
- 如果设置日利率 → 资金成本计算应改为"按日计算"
- 如果设置年利率 → 资金成本计算可保持"按年计算"或"按日计算"

### 金额相关联动
- 投资金额变化 → 可能影响违约金金额（按比例）
- 投资金额变化 → 可能影响分成金额上限

### 期限相关联动
- 分成期限月数变化 → 截止日期需要重新计算
- 分成期限变化 → 可能影响预期总回报计算

## 输出格式（严格JSON）
{
  "understood": "对用户意图的简要理解",
  "analysisExplanation": "对整体分析的解释，为什么推断这些联动修改",
  "primaryChanges": [
    {
      "key": "参数key",
      "paramName": "参数中文名",
      "oldValue": "原值",
      "newValue": "新值",
      "clauseText": "合同条款语言",
      "changeType": "primary",
      "selected": true
    }
  ],
  "inferredChanges": [
    {
      "key": "参数key",
      "paramName": "参数中文名",
      "oldValue": "原值",
      "newValue": "推断的新值",
      "clauseText": "合同条款语言",
      "changeType": "inferred",
      "confidence": "high/medium/low",
      "reason": "为什么需要这个联动修改",
      "relatedTo": "关联的直接修改key",
      "category": "unit_conversion/calculation_method/formula_update/related_term",
      "selected": false
    }
  ],
  "warnings": ["风险警告（如有）"]
}

## 置信度说明
- high: 逻辑必然，如利率换算
- medium: 强烈建议，如计算方式匹配
- low: 可选建议，供参考`

/**
 * 执行智能联动分析
 */
export async function executeSmartChangeAnalysis(
  message: string,
  context: {
    currentParams: Record<string, any>
    templateId: string
    templateName: string
    perspective?: string
  },
  apiKey: string,
  baseUrl: string
): Promise<SmartChangeResult> {
  const startTime = Date.now()

  // 构建完整提示词
  const userPrompt = `## 用户请求
"${message}"

## 当前合同参数
${JSON.stringify(context.currentParams, null, 2)}

## 行业
${context.templateName}

## 视角
${context.perspective === 'investor' ? '投资方' : '融资方'}

请分析这个修改请求，识别直接修改和可能的联动修改。直接输出JSON（不要代码块）：`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL_QUALITY, // 使用高质量模型进行复杂分析
        messages: [
          { role: 'system', content: SMART_CHANGE_ANALYST_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error('API request failed')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 解析JSON
    let result: any = null
    
    // 尝试多种方式提取JSON
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        result = JSON.parse(codeBlockMatch[1].trim())
      } catch (e) {}
    }
    
    if (!result) {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0])
        } catch (e) {}
      }
    }

    if (result) {
      // 标准化结果
      const primaryChanges: SmartChange[] = (result.primaryChanges || []).map((c: any) => ({
        ...c,
        changeType: 'primary' as ChangeType,
        selected: true
      }))

      const inferredChanges: SmartChange[] = (result.inferredChanges || []).map((c: any) => ({
        ...c,
        changeType: 'inferred' as ChangeType,
        selected: false, // 推断修改默认不选中，需要用户确认
        confidence: c.confidence || 'medium'
      }))

      return {
        success: true,
        understood: result.understood || message,
        primaryChanges,
        inferredChanges,
        analysisExplanation: result.analysisExplanation || '',
        warnings: result.warnings || [],
        processingTime: Date.now() - startTime
      }
    }

    return {
      success: false,
      understood: message,
      primaryChanges: [],
      inferredChanges: [],
      analysisExplanation: '无法解析AI响应',
      warnings: ['分析失败，请重试'],
      processingTime: Date.now() - startTime
    }

  } catch (error) {
    return {
      success: false,
      understood: message,
      primaryChanges: [],
      inferredChanges: [],
      analysisExplanation: '',
      warnings: [`分析错误: ${(error as Error).message}`],
      processingTime: Date.now() - startTime
    }
  }
}

/**
 * 组合多Agent处理结果与智能联动分析
 * 先执行多Agent并行处理获取直接修改，然后分析联动修改
 */
export async function executeSmartChangeWorkflow(
  message: string,
  context: {
    currentParams: Record<string, any>
    templateId: string
    templateName: string
    negotiationHistory?: any[]
    perspective?: string
  },
  apiKey: string,
  baseUrl: string
): Promise<SmartChangeResult> {
  const startTime = Date.now()

  // Step 1: 执行多Agent并行工作流获取直接修改
  const multiAgentResult = await executeMultiAgentWorkflow(message, context, apiKey, baseUrl)

  if (!multiAgentResult.success || multiAgentResult.allChanges.length === 0) {
    // 如果多Agent没有识别到修改，尝试直接用智能分析
    return executeSmartChangeAnalysis(message, context, apiKey, baseUrl)
  }

  // Step 2: 基于多Agent结果，分析联动修改
  const primaryChanges: SmartChange[] = multiAgentResult.allChanges.map(c => ({
    ...c,
    changeType: 'primary' as ChangeType,
    selected: true
  }))

  // 构建联动分析的提示词 - 增强版
  const inferPrompt = `你是合同条款联动分析专家。基于已识别的直接修改，分析可能需要联动调整的相关参数。

## 已识别的直接修改
${JSON.stringify(primaryChanges.map(c => ({ key: c.key, paramName: c.paramName, oldValue: c.oldValue, newValue: c.newValue })), null, 2)}

## 当前所有合同参数
${JSON.stringify(context.currentParams, null, 2)}

## 原始用户请求
"${message}"

## 重要的联动规则（必须检查）

### 1. 利率/收益计算时间单位联动
当设置了月度收益率时：
- 如果fundCostCalculation当前是"按日计算"，应该联动改为"按月计算"
- 如果月利率X%，年化利率应该是X%×12

当设置了日度收益率时：
- fundCostCalculation应该是"按日计算"
- 年化利率应该是日利率×365

### 2. 投资金额联动
当investmentAmount变化时：
- 违约金（breachPenaltyAmount）如果是固定金额可能需要按比例调整
- 资金成本上限可能需要联动

### 3. 分成期限联动
当sharingPeriodMonths变化时：
- sharingEndDate需要重新计算

## 特别注意
用户提到"按月X%"时，几乎一定需要将fundCostCalculation改为"按月计算"！

## 输出要求
只输出推断的联动修改，不要重复直接修改。JSON格式（不要代码块）：
{
  "analysisExplanation": "简述为什么需要这些联动修改",
  "inferredChanges": [
    {
      "key": "fundCostCalculation",
      "paramName": "资金成本计算方式",
      "oldValue": "按日计算",
      "newValue": "按月计算",
      "clauseText": "资金成本按月度计算，每月固定日期结算",
      "changeType": "inferred",
      "confidence": "high",
      "reason": "用户要求按月2.75%计算收益，因此资金成本计算方式应从按日改为按月，以保持计算口径一致",
      "relatedTo": "annualYieldRate",
      "category": "calculation_method",
      "selected": false
    }
  ],
  "warnings": []
}`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL_FAST, // 联动分析使用快速模型
        messages: [
          { role: 'system', content: SMART_CHANGE_ANALYST_PROMPT },
          { role: 'user', content: inferPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    })

    let inferredChanges: SmartChange[] = []
    let analysisExplanation = '基于直接修改分析可能的联动影响'

    if (response.ok) {
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      // 解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0])
          inferredChanges = (result.inferredChanges || []).map((c: any) => ({
            ...c,
            changeType: 'inferred' as ChangeType,
            selected: false
          }))
          analysisExplanation = result.analysisExplanation || analysisExplanation
        } catch (e) {
          console.error('Failed to parse inferred changes:', e)
        }
      }
    }

    // ========== 规则引擎补充：基于明确规则的联动检测 ==========
    // 如果LLM没有检测到某些关键联动，用规则引擎补充
    const ruleBasedInferred = detectRuleBasedInferredChanges(
      message, 
      primaryChanges, 
      context.currentParams,
      inferredChanges
    )
    
    if (ruleBasedInferred.length > 0) {
      inferredChanges = [...inferredChanges, ...ruleBasedInferred]
      if (ruleBasedInferred.length > 0) {
        analysisExplanation = `${analysisExplanation}。基于合同条款联动规则，还检测到${ruleBasedInferred.length}项建议修改。`
      }
    }

    return {
      success: true,
      understood: multiAgentResult.understood,
      primaryChanges,
      inferredChanges,
      analysisExplanation,
      warnings: [...multiAgentResult.allWarnings],
      agentResponses: multiAgentResult.agentResponses,
      processingTime: Date.now() - startTime
    }

  } catch (error) {
    // 如果联动分析失败，仍然返回直接修改结果
    return {
      success: true,
      understood: multiAgentResult.understood,
      primaryChanges,
      inferredChanges: [],
      analysisExplanation: '联动分析暂时不可用',
      warnings: [...multiAgentResult.allWarnings, '联动分析失败，仅显示直接修改'],
      agentResponses: multiAgentResult.agentResponses,
      processingTime: Date.now() - startTime
    }
  }
}
