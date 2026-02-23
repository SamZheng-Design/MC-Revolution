// 多Agent并行工作流系统 V3
// 基于滴灌通联营协议V3标准模板的模块化AI Agent
// V3升级：引入法律顾问Agent，实现自然语言→法律语言的专业转化

/**
 * Agent工作流架构设计 V3 - 法律顾问增强版:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     用户自然语言输入                          │
 * │           "把投资金额改成800万，按月2.75%算收益"               │
 * └─────────────────────────┬───────────────────────────────────┘
 *                           ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │              快速路由器 (Fast Router)                        │
 * │  - 关键词快速匹配 + LLM辅助验证                              │
 * │  - 识别涉及的合同模块                                        │
 * └─────────────────────────┬───────────────────────────────────┘
 *                           ▼
 *     ┌─────────────────────┼─────────────────────┐
 *     ▼                     ▼                     ▼
 * ┌────────┐          ┌────────┐           ┌────────┐
 * │投资分成│          │违约责任│           │担保条款│  ... (并行执行)
 * │ Agent  │          │ Agent  │           │ Agent  │
 * │意图识别│          │意图识别│           │意图识别│
 * └────┬───┘          └────┬───┘           └────┬───┘
 *      │                   │                    │
 *      └───────────────────┼────────────────────┘
 *                          ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │              ★★★ 法律顾问 Agent ★★★                      │
 * │  - 接收各模块的修改意图和参数变更                            │
 * │  - 转化为专业法律合同语言                                    │
 * │  - 确保条款的法律严谨性和完整性                              │
 * │  - 添加必要的法律限定和附加条件                              │
 * └─────────────────────────┬───────────────────────────────────┘
 *                           ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  结果聚合器 (Aggregator)                      │
 * │  - 输出法律专业化的修改建议                                   │
 * │  - 标记：原文(用户表达) → 转化后(法律语言)                    │
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
  // V3新增：法律顾问转化结果
  originalExpression?: string      // 用户原始表达
  legalClauseText?: string         // 法律顾问转化后的专业条款
  legalNotes?: string[]            // 法律注意事项/附加说明
  legalReview?: {                  // 法律审核信息
    reviewed: boolean              // 是否经过法律顾问审核
    reviewedAt?: string            // 审核时间
    legalScore?: number            // 法律规范性评分 (0-100)
    improvements?: string[]        // 法律建议的改进点
  }
}

/**
 * 法律顾问转化请求
 */
export interface LegalTransformRequest {
  originalInput: string            // 用户原始输入
  moduleChanges: {                 // 各模块识别的修改
    agentId: string
    agentName: string
    changes: ParamChange[]
    understood: string
  }[]
  context: {
    templateName: string           // 行业模板
    perspective: string            // 视角（投资方/融资方）
    currentParams: Record<string, any>
  }
}

/**
 * 法律顾问转化结果
 */
export interface LegalTransformResult {
  success: boolean
  transformedChanges: SmartChange[] // 法律语言转化后的修改
  legalSummary: string             // 法律层面的修改摘要
  riskWarnings: string[]           // 法律风险警告
  clauseRecommendations: string[]  // 条款完善建议
  processingTime: number
}

/**
 * 智能变更分析结果 V3 - 包含法律顾问转化
 */
export interface SmartChangeResult {
  success: boolean
  understood: string               // AI理解的用户意图
  primaryChanges: SmartChange[]    // 直接修改（用户明确要求的）
  inferredChanges: SmartChange[]   // 推断修改（AI分析出的关联延伸变更）
  analysisExplanation: string      // AI对整体分析的解释
  warnings: string[]               // 风险警告
  agentResponses?: AgentResponse[] // 各Agent响应详情
  processingTime: number
  // V3新增：法律顾问转化信息
  legalTransform?: {
    enabled: boolean               // 是否启用法律顾问转化
    legalSummary?: string          // 法律层面的修改摘要
    riskWarnings?: string[]        // 法律风险警告
    clauseRecommendations?: string[] // 条款完善建议
    transformTime?: number         // 法律转化耗时
  }
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
  AGENT_TIMEOUT_MS: 15000,      // 单Agent超时：15秒
  ROUTER_TIMEOUT_MS: 8000,      // 路由器超时：8秒
  MAX_PARALLEL_AGENTS: 3,       // 最大并行Agent数
  MODEL_FAST: 'claude-haiku-4-5', // 快速模型（Phase1识别 + 路由）
  MODEL_QUALITY: 'claude-haiku-4-5', // Phase2也用快速模型，演示优先速度
  MAX_TOKENS: 600,              // Agent最大token数（精简输出）
  ROUTER_MAX_TOKENS: 300,       // 路由器最大token数
  LEGAL_MAX_TOKENS: 2000,       // 法律顾问最大token数（精简但保持质量）
  INFER_MAX_TOKENS: 1500,       // 联动分析最大token数
}

// ==================== JSON提取与修复工具 ====================

/**
 * 从LLM响应中鲁棒提取JSON
 * 处理：代码块包裹、截断(finish_reason=length)、尾部逗号、控制字符等
 */
function extractJsonFromContent(content: string): any | null {
  if (!content || content.trim().length === 0) return null
  
  // Step 1: 从代码块中提取
  const codeBlockStart = content.indexOf('```')
  if (codeBlockStart >= 0) {
    const afterStart = content.substring(codeBlockStart + 3)
    const lineBreak = afterStart.indexOf('\n')
    const jsonStart = lineBreak >= 0 ? lineBreak + 1 : 0
    const codeBlockEnd = afterStart.indexOf('```', jsonStart)
    
    if (codeBlockEnd > 0) {
      // 有完整的代码块
      const jsonContent = afterStart.substring(jsonStart, codeBlockEnd).trim()
      const parsed = tryParseJson(jsonContent)
      if (parsed) return parsed
    }
    
    // 代码块未关闭（被截断） — 取代码块开始到内容末尾
    const truncatedContent = afterStart.substring(jsonStart).trim()
    const parsed = tryParseJson(truncatedContent)
    if (parsed) return parsed
    
    // 尝试修复截断的JSON
    const repaired = repairTruncatedJson(truncatedContent)
    if (repaired) return repaired
  }
  
  // Step 2: 字符串感知的花括号配对（跳过引号内的花括号）
  const firstBrace = content.indexOf('{')
  if (firstBrace >= 0) {
    let depth = 0, endIdx = -1, inString = false, escapeNext = false
    for (let i = firstBrace; i < content.length; i++) {
      const ch = content[i]
      if (escapeNext) { escapeNext = false; continue }
      if (ch === '\\') { escapeNext = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break } }
    }
    if (endIdx > firstBrace) {
      const jsonStr = content.substring(firstBrace, endIdx + 1)
      const parsed = tryParseJson(jsonStr)
      if (parsed) return parsed
    }
    
    // 未找到配对的 } — JSON被截断
    const truncated = content.substring(firstBrace)
    const repaired = repairTruncatedJson(truncated)
    if (repaired) return repaired
  }
  
  // Step 3: 直接解析
  return tryParseJson(content.trim())
}

/**
 * 尝试解析JSON（含清理）
 */
function tryParseJson(str: string): any | null {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch (e) {
    // 清理后重试
    try {
      const cleaned = str
        .replace(/,(\s*[}\]])/g, '$1')       // 移除尾部逗号
        .replace(/[\u0000-\u001F]+/g, ' ')   // 移除控制字符
        .replace(/\n/g, '\\n')               // 转义换行
      return JSON.parse(cleaned)
    } catch (e2) {
      // 再次尝试：修复常见LLM输出问题
      try {
        const aggressive = str
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]+/g, ' ')
          .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')  // 修复无效转义
        return JSON.parse(aggressive)
      } catch (e3) {
        return null
      }
    }
  }
}

/**
 * 修复被截断的JSON（当 finish_reason=length 时）
 * 策略：闭合所有未关闭的括号和字符串
 */
function repairTruncatedJson(str: string): any | null {
  if (!str || !str.includes('{')) return null
  
  let repaired = str
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/[\u0000-\u001F]+/g, ' ')
  
  // 去掉最后一个不完整的键值对
  // 例: ..."key": "unfinished value  →  移除最后的不完整部分
  repaired = repaired
    .replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '')   // 移除最后不完整的 key:value
    .replace(/,\s*"[^"]*$/, '')                       // 移除最后不完整的string
    .replace(/,\s*\[?\s*$/, '')                        // 移除最后不完整的array开头
    .replace(/,\s*$/, '')                               // 移除尾部逗号
  
  // 关闭所有未关闭的字符串
  let inString = false
  let escaped = false
  for (let i = 0; i < repaired.length; i++) {
    if (escaped) { escaped = false; continue }
    if (repaired[i] === '\\') { escaped = true; continue }
    if (repaired[i] === '"') { inString = !inString }
  }
  if (inString) repaired += '"'
  
  // 计算并关闭未配对的括号
  let braceDepth = 0, bracketDepth = 0
  inString = false
  escaped = false
  for (let i = 0; i < repaired.length; i++) {
    if (escaped) { escaped = false; continue }
    if (repaired[i] === '\\') { escaped = true; continue }
    if (repaired[i] === '"') { inString = !inString; continue }
    if (inString) continue
    if (repaired[i] === '{') braceDepth++
    else if (repaired[i] === '}') braceDepth--
    else if (repaired[i] === '[') bracketDepth++
    else if (repaired[i] === ']') bracketDepth--
  }
  
  // 先关闭数组，再关闭对象
  while (bracketDepth > 0) { repaired += ']'; bracketDepth-- }
  while (braceDepth > 0) { repaired += '}'; braceDepth-- }
  
  // 再次清理尾部逗号（关闭括号前）
  repaired = repaired
    .replace(/,(\s*[}\]])/g, '$1')
  
  try {
    return JSON.parse(repaired)
  } catch (e) {
    console.log('[JSON Repair] Failed to repair truncated JSON, length:', str.length, 'error:', (e as Error).message)
    return null
  }
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
      // 核心关键词
      '投资', '资金', '分成', '比例', '收益', '回报', '期限', '金额',
      '联营资金', '分成比例', '年化', '收益率', '分成期', '万元', '百分比',
      // 描述变动的自然语言（重要！）
      '描述', '变动', '条款', '修改', '变更', '更改', '调整', '改动',
      '想修改', '需要修改', '要修改', '请修改', '帮我修改', '麻烦修改',
      '描述条款', '条款变动', '描述变动', '合同变动', '协议变动',
      // 动作词
      '改', '修改', '调整', '提高', '降低', '增加', '减少', '设置', '设定',
      '变', '换', '升', '降', '加', '减', '涨', '跌',
      // 数值表达 - 更广泛的范围
      '800万', '500万', '1000万', '600万', '300万', '200万', '100万',
      '50万', '80万', '150万', '250万', '350万', '450万', '550万', '650万', '750万', '850万', '900万',
      '10%', '15%', '20%', '25%', '30%', '12%', '18%', '8%', '5%',
      '1%', '2%', '3%', '4%', '6%', '7%', '9%', '11%', '13%', '14%', '16%', '17%', '19%',
      '21%', '22%', '23%', '24%', '26%', '27%', '28%', '29%',
      // 时间相关
      '月', '年', '天', '日', '每月', '每年', '按月', '按年', '按日',
      '2.75%', '2.5%', '3%', '月息', '月利', '年化率', '年利率',
      // 自然语言表达 - 扩充
      '把', '将', '想要', '希望', '改成', '改为', '变成', '变为', '调到', '调成',
      '变一下', '调一下', '改一下', '换成', '提升到', '降到', '升到', '减到',
      '能不能', '可不可以', '是否可以', '帮我', '请帮', '麻烦',
      '我想', '我要', '我希望', '我需要'
    ],
    paramKeys: [
      'investmentAmount', 'revenueShareRatio', 'annualYieldRate',
      'sharingStartDate', 'sharingEndDate', 'fundUsage'
    ],
    systemPrompt: `你是【投资分成专家】，负责处理联营资金和分成比例相关的条款修改。

当前参数值：
##PARAMS##

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图，例如"投资方希望将联营资金从500万元提高至800万元"
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，要求主谓宾齐全
- impact：用完整的陈述句说明变更的影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子，主语谓语宾语齐全
- 所有输出文本必须语句通顺、表达清晰、没有语病，严禁输出断句或碎片化文本

输出纯JSON（不要markdown代码块）：
{"understood":"投资方希望将联营资金从500万元提高至800万元","changes":[{"key":"investmentAmount","paramName":"联营资金金额","oldValue":"500万元","newValue":"800万元","clauseText":"甲方同意将本次联营资金金额由人民币500万元调整为人民币800万元","impact":"投资方投入资金增加300万元，相应的年度分成收益也将按比例上升"}],"suggestions":["建议确认800万元的资金需求是否与项目实际规模匹配"],"warnings":["资金金额调整可能需要同步修订违约金条款和资金使用计划"]}`
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
      // 核心关键词
      '数据', '传输', '上报', '对账', '付款', '频率', '系统', 'POS',
      '日报', '周报', '月报', '自动', '手动', '结算', '每日', '每周', '每月',
      // 扩展
      '汇报', '报告', '同步', '推送', '接口', '数据源', '数据传输',
      '实时', '定时', '延迟', '时效', '账期', '结算周期'
    ],
    paramKeys: [
      'dataTransmissionMethod', 'dataReportFrequency', 'dataSource',
      'paymentMethod', 'paymentFrequency', 'reconciliationDays'
    ],
    systemPrompt: `你是【数据对账专家】，负责处理数据传输和付款频率相关条款。

当前参数值：
##PARAMS##

重要：数据延迟超30天=严重违约！

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，主谓宾齐全
- impact：用完整的陈述句说明变更影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子
- 所有输出文本必须语句通顺、表达清晰、没有语病

输出纯JSON（不要markdown代码块）：
{"understood":"融资方希望将数据传输频率从每日调整为每周一次","changes":[{"key":"dataReportFrequency","paramName":"数据传输频率","oldValue":"每自然日","newValue":"每周","clauseText":"乙方应于每周一将上周经营数据通过指定系统完整传输至甲方","impact":"数据上报频率降低后，可减轻融资方的日常运营负担，但投资方获取经营信息的时效性将有所下降"}],"suggestions":["建议评估每周传输是否满足投资方的风控监测需求"],"warnings":["数据传输周期拉长可能导致异常经营情况的发现延迟"]}`
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
      // 核心关键词
      '终止', '退出', '闭店', '亏损', '补偿', '提前', '结束', '解约',
      '补偿金', '通知期', '90天', '解除', '闭店', '停业',
      // 扩展
      '撤资', '撤出', '不做了', '关店', '不干了', '解除合同', '取消',
      '提前结束', '提前退出', '提前终止', '返还', '退还', '赔偿'
    ],
    paramKeys: [
      'lossClosurePeriod', 'lossClosureThreshold', 'lossClosureNoticeDays', 'annualYieldRate'
    ],
    systemPrompt: `你是【终止条款专家】，负责处理提前终止和亏损闭店相关条款。

当前参数值：
##PARAMS##

规则：提前终止需7天通知；补偿金=联营资金×(1+年化÷360×(已分成天数+7))；不满90天按90天

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，主谓宾齐全
- impact：用完整的陈述句说明变更影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子
- 所有输出文本必须语句通顺、表达清晰、没有语病

输出纯JSON（不要markdown代码块）：
{"understood":"融资方希望将亏损闭店的观察期限从3个月延长至6个月","changes":[{"key":"lossClosurePeriod","paramName":"亏损闭店期限","oldValue":"3个月","newValue":"6个月","clauseText":"如门店连续亏损达6个月，融资方有权向投资方提出闭店申请","impact":"延长亏损观察期后，融资方有更充裕的时间调整经营策略，但投资方承受损失的时间也相应延长"}],"suggestions":["建议明确亏损的具体计算标准和判定依据"],"warnings":["观察期延长意味着投资方可能面临更长时间的亏损风险敞口"]}`
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
      // 核心关键词
      '违约', '违约金', '罚款', '处罚', '严重违约', '赔偿', '责任',
      '延迟', '逾期', '造假', '挪用', '15%', '20%', '25%', '30天',
      // 扩展
      '罚金', '惩罚', '违规', '违反', '不履行', '不配合', '失信',
      '欺诈', '欺骗', '隐瞒', '虚假', '作假'
    ],
    paramKeys: ['dataDelay', 'paymentDelay', 'breachPenalty'],
    systemPrompt: `你是【违约责任专家】，负责处理违约金和违约认定相关条款。

当前参数值：
##PARAMS##

严重违约情形包括：挪用资金、隐藏收入、失联、擅自停业、欺诈、数据延迟超30天、付款延迟超30天、品牌授权过期等。市场参考：违约金通常15-25%。

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，主谓宾齐全
- impact：用完整的陈述句说明变更影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子
- 所有输出文本必须语句通顺、表达清晰、没有语病

输出纯JSON（不要markdown代码块）：
{"understood":"融资方希望将违约金比例从20%降低至15%","changes":[{"key":"breachPenalty","paramName":"违约金比例","oldValue":"20%","newValue":"15%","clauseText":"如乙方发生违约情形，应向甲方支付联营资金总额15%的违约金","impact":"违约金比例下降5个百分点，将降低融资方的违约成本，但同时也削弱了对投资方的保护力度"}],"suggestions":["建议评估15%的违约金是否足以覆盖投资方可能遭受的实际损失"],"warnings":["违约金比例低于市场常见水平，可能不足以起到有效的违约威慑作用"]}`
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

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，主谓宾齐全
- impact：用完整的陈述句说明变更影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子
- 所有输出文本必须语句通顺、表达清晰、没有语病

输出纯JSON（不要markdown代码块）：
{"understood":"融资方希望将控制权变更的审批机制从事先同意改为提前通知","changes":[{"key":"controlChange","paramName":"控制权变更限制","oldValue":"需事先同意","newValue":"需提前30天通知","clauseText":"乙方如发生实际控制人变更，应提前30日以书面形式通知甲方","impact":"将控制权变更从审批制改为通知制后，融资方的股权操作灵活性提高，但投资方将失去事前否决权"}],"suggestions":["建议增加通知期内投资方的审核权或异议权条款"],"warnings":["取消事先同意要求可能导致投资方在控制权变更后面临未知经营风险"]}`
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

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，主谓宾齐全
- impact：用完整的陈述句说明变更影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子
- 所有输出文本必须语句通顺、表达清晰、没有语病

输出纯JSON（不要markdown代码块）：
{"understood":"融资方希望将实际控制人的连带责任从无限改为有限","changes":[{"key":"controllerLiability","paramName":"实际控制人责任","oldValue":"无限连带","newValue":"有限连带","clauseText":"各方实际控制人对本协议项下义务承担有限连带担保责任，担保范围以联营资金总额为上限","impact":"实际控制人的个人风险敞口将被限定在联营资金总额范围内，不再承担超出部分的赔偿义务"}],"suggestions":["建议明确有限连带责任的具体金额上限和责任范围"],"warnings":["将无限连带改为有限连带会削弱投资方的债权保障力度"]}`
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

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，主谓宾齐全
- impact：用完整的陈述句说明变更影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子
- 所有输出文本必须语句通顺、表达清晰、没有语病

输出纯JSON（不要markdown代码块）：
{"understood":"融资方希望将门店经营地址确定为深圳市南山区的指定位置","changes":[{"key":"storeAddress","paramName":"门店地址","oldValue":"待确定","newValue":"深圳市南山区xxx","clauseText":"本协议项下联营门店地址为深圳市南山区xxx，未经甲方书面同意不得变更","impact":"门店经营地址正式确定后，将作为合同履行地和日常经营监管的依据"}],"suggestions":["建议同时确认该地址的租赁合同期限是否覆盖联营期限"],"warnings":["门店地址一经确定，后续变更将需要甲方书面同意并可能涉及补充协议"]}`
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

请分析用户的修改意图并给出建议。

## 语言要求（非常重要）
- understood：用一句完整、通顺的中文概括用户的修改意图
- clauseText：用正式、完整的合同条款语言描述变更内容，至少15字，主谓宾齐全
- impact：用完整的陈述句说明变更影响，不能只有短语
- suggestions和warnings：每一条必须是完整通顺的中文句子
- 所有输出文本必须语句通顺、表达清晰、没有语病

输出纯JSON（不要markdown代码块）：
{"understood":"一方希望将仲裁地从深圳变更为北京","changes":[{"key":"arbitrationPlace","paramName":"仲裁地","oldValue":"深圳","newValue":"北京","clauseText":"因本协议引起的或与本协议有关的争议，由北京仲裁委员会按其仲裁规则进行仲裁","impact":"仲裁地变更为北京后，将便于在北京一方当事人参与仲裁程序，但可能增加另一方的差旅和时间成本"}],"suggestions":["建议双方就仲裁机构的选择进行充分协商，确保程序公平性"],"warnings":["仲裁地变更将影响法律适用和执行管辖，建议同步确认适用的仲裁规则"]}`
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
 * 通用变更意图检测 - 识别用户想要"修改"的意图
 * 返回是否包含变更意图，以及可能的目标值
 * 
 * V2增强版：增加对"描述条款变动"等自然语言表达的识别
 */
function detectChangeIntent(message: string): { hasIntent: boolean; targetValue?: string; changeType?: string } {
  // 变更动词模式 - 大幅扩充
  const changePatterns = [
    // 原有模式
    /(?:把|将|想要|希望|请|麻烦).{0,10}(?:改|调|变|设|换|降|提|增|减)/,
    /(?:改|调|变|设|换|降|提|增|减).{0,5}(?:成|为|到|至)/,
    /(?:从|由).{0,20}(?:改|调|变|换).{0,5}(?:成|为|到)/,
    
    // 描述性表达（重要！用户常用）
    /描述.*(?:变动|变更|修改|调整|改动)/,
    /(?:变动|变更|修改|调整|改动).*描述/,
    /条款.*(?:变动|变更|修改|调整|改动)/,
    /(?:变动|变更|修改|调整|改动).*条款/,
    
    // 请求类表达
    /(?:想|要|需要|希望|请|帮|麻烦).{0,5}(?:改|调|修|变|换|设|定)/,
    /(?:能不能|可不可以|是否可以|可否|能否).{0,5}(?:改|调|修|变|换|设|定)/,
    /(?:帮我|请帮|麻烦|劳驾).{0,10}(?:改|调|修|变|设)/,
    
    // 动作类表达
    /(?:修改|调整|变更|更改|更换|调换|变动|改动|改变)/,
    /(?:提高|降低|增加|减少|提升|下降|增大|减小)/,
    /(?:设置|设定|设为|定为|改为|调为|变为)/,
    
    // 数值变动表达
    /\d+(?:\.\d+)?\s*(?:万|%|元|个月|天|年).{0,5}(?:改|调|变|升|降)/,
    /(?:改|调|变|升|降).{0,5}\d+(?:\.\d+)?\s*(?:万|%|元|个月|天|年)/,
    
    // 比较类表达
    /(?:从|由)\s*.{1,20}\s*(?:改|变|调|换).{0,5}(?:成|为|到)/,
    /(?:原来|之前|现在|目前).{0,10}(?:是|为).{0,10}(?:改|变|调)/,
  ]
  
  // 数值提取模式
  const valuePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:万|百万|亿|%|个月|天|年)/g,
    /(?:改|调|变|设|换).{0,3}(?:成|为|到|至)\s*(\d+(?:\.\d+)?)\s*(?:万|百万|亿|%|个月|天|年)?/,
    /(\d+(?:\.\d+)?)\s*(?:万|百万|亿|%|个月|天|年)\s*(?:的|来)?\s*(?:收益|利率|比例|金额|资金)/,
  ]
  
  // 直接判断是否包含关键变更词汇
  const directChangeWords = [
    '修改', '调整', '变更', '更改', '改动', '变动', '改变',
    '描述', '条款', '合同', '协议', '参数',
    '提高', '降低', '增加', '减少', '设置', '设定'
  ]
  const hasDirectWord = directChangeWords.some(word => message.includes(word))
  
  const hasIntent = changePatterns.some(p => p.test(message)) || hasDirectWord
  
  // 提取目标值
  let targetValue: string | undefined
  for (const pattern of valuePatterns) {
    const match = message.match(pattern)
    if (match) {
      targetValue = match[1] || match[0]
      break
    }
  }
  
  return { hasIntent: hasIntent || !!targetValue, targetValue }
}

/**
 * 智能关键词权重计算
 * 根据上下文动态调整权重
 */
function calculateKeywordWeight(keyword: string, message: string, context: {
  hasChangeIntent: boolean
  hasNumericValue: boolean
}): number {
  let weight = 1
  
  // 精确匹配加权
  if (message.includes(keyword)) {
    weight += 2
  }
  
  // 词组匹配（关键词在有意义的位置）
  const meaningfulPatterns = [
    new RegExp(`(?:把|将|改|调|设).*${keyword}`, 'i'),
    new RegExp(`${keyword}.*(?:改|调|变|设|换|降|提|增|减)`, 'i'),
    new RegExp(`${keyword}.*(?:成|为|到|至)`, 'i'),
  ]
  
  if (meaningfulPatterns.some(p => p.test(message))) {
    weight += 3
  }
  
  // 变更意图加权
  if (context.hasChangeIntent) {
    weight += 1
  }
  
  // 数值类关键词在有数值时加权
  if (context.hasNumericValue && /\d|万|%|元|年|月|天/.test(keyword)) {
    weight += 2
  }
  
  return weight
}

/**
 * 快速关键词匹配路由 - 增强版
 */
function quickMatchAgents(message: string): { agents: string[]; confidence: number } {
  const matched: { id: string; score: number }[] = []
  const lowerMessage = message.toLowerCase()
  
  // 检测变更意图
  const intentInfo = detectChangeIntent(message)
  const hasNumericValue = /\d+(?:\.\d+)?/.test(message)
  
  // 如果消息太短且没有明确意图，降低置信度
  const isShortMessage = message.length < 10
  
  for (const [agentId, agent] of Object.entries(contractAgents)) {
    let score = 0
    
    for (const keyword of agent.expertise) {
      // 检查是否匹配
      const exactMatch = message.includes(keyword)
      const fuzzyMatch = !exactMatch && lowerMessage.includes(keyword.toLowerCase())
      
      if (exactMatch || fuzzyMatch) {
        const weight = calculateKeywordWeight(keyword, message, {
          hasChangeIntent: intentInfo.hasIntent,
          hasNumericValue
        })
        score += exactMatch ? weight * 2 : weight
      }
    }
    
    // 特殊规则：根据消息内容直接判断
    // 涉及金额数字的默认加入投资分成Agent
    if (agentId === 'investment-revenue' && /\d+(?:\.\d+)?\s*(?:万|百万|亿|元|%|个月|年)/.test(message)) {
      score += 5
    }
    
    // 涉及利率计算的
    if (agentId === 'investment-revenue' && /(?:按|每|月|年|日).{0,5}(?:利|率|息|收益)/.test(message)) {
      score += 6
    }
    
    // 涉及时间周期的收益计算
    if (agentId === 'investment-revenue' && /(?:\d+(?:\.\d+)?%?\s*(?:\/|×|乘|按|的)\s*(?:月|年|天|日))/.test(message)) {
      score += 8
    }
    
    if (score > 0) {
      matched.push({ id: agentId, score })
    }
  }
  
  matched.sort((a, b) => b.score - a.score)
  
  // 计算置信度 - 更平滑的曲线
  const topScore = matched[0]?.score || 0
  let confidence = Math.min(100, topScore * 10)
  
  // 如果检测到明确的变更意图，提高置信度
  if (intentInfo.hasIntent && matched.length > 0) {
    confidence = Math.min(100, confidence + 20)
  }
  
  // 短消息降低置信度
  if (isShortMessage) {
    confidence = Math.max(30, confidence - 20)
  }
  
  // 返回得分最高的Agent（最多3个）
  // 如果第一名得分远高于其他，只返回第一名
  let agents: string[]
  if (matched.length >= 2 && matched[0].score > matched[1].score * 2) {
    agents = [matched[0].id]
  } else {
    agents = matched.slice(0, CONFIG.MAX_PARALLEL_AGENTS).map(m => m.id)
  }
  
  // 如果没有匹配到任何Agent但有变更意图，默认使用投资分成Agent
  if (agents.length === 0 && intentInfo.hasIntent) {
    agents = ['investment-revenue']
    confidence = 40
  }
  
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

  const routerPrompt = `你是收入分成融资合同协商系统的智能路由器。分析用户输入，判断应该分配给哪些专家处理。

## 可用专家及其职责：
1. **investment-revenue(投资分成专家)** - 处理：投资金额、分成比例、收益率、利率计算、资金用途、期限、金额调整
   - 典型表达：改投资金额、调整分成比例、按月X%计算、年化收益、资金改成XX万、利率设为X%
   - 关键词：投资、资金、分成、比例、收益、金额、万元、百分比、利率、月息、年化
2. **data-payment(数据对账专家)** - 处理：数据上报、传输方式、对账周期、付款频率
   - 关键词：数据、传输、对账、付款、结算、上报
3. **early-termination(终止条款专家)** - 处理：提前终止、亏损闭店、补偿金、解约
   - 关键词：终止、退出、闭店、亏损、补偿、解约
4. **breach-liability(违约责任专家)** - 处理：违约金、罚款、违约认定、赔偿
   - 关键词：违约、罚款、赔偿、责任
5. **prohibited-actions(合规管控专家)** - 处理：禁止行为、控制权变更、品牌转让
   - 关键词：禁止、控制权、转让、品牌
6. **guarantee(担保责任专家)** - 处理：担保、连带责任、保证
   - 关键词：担保、连带、保证
7. **store-info(资产信息专家)** - 处理：门店信息、地址、品牌、证照
   - 关键词：门店、地址、证照、资产
8. **dispute-resolution(法律事务专家)** - 处理：仲裁、保密、法律事务
   - 关键词：仲裁、保密、法律、争议

## 重要判断规则：
1. 如果用户输入包含数字（如XX万、XX%、X年/月）且没有明确指向其他专家的关键词，优先分配给 **investment-revenue**
2. 用户说"描述条款变动"、"修改条款"、"调整合同"等模糊表达时：
   - 如果包含金额、比例等数字 → investment-revenue
   - 如果提到具体条款名称 → 对应专家
   - 如果没有具体指向 → investment-revenue（默认处理商业核心条款）
3. 涉及"按月/按日/按年"计算收益 → investment-revenue
4. 涉及数字+时间单位（如2.75%/月、每月XX%）→ investment-revenue
5. 表达"改成"、"调整为"、"设为"等变更意图时，根据变更对象判断

## 用户输入：
"${message}"

## 快速匹配建议：
${quickMatch.agents.length > 0 ? quickMatch.agents.join(', ') + ' (置信度' + quickMatch.confidence + '%)' : '无匹配'}

## 任务：
仔细分析用户意图，即使表达模糊也要尽力识别。输出JSON（不要代码块）：
{"understood":"用20字简述用户想要做什么","targetAgents":["最相关的agent-id"],"confidence":0-100}`

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
    
    // 使用鲁棒JSON提取工具
    const result = extractJsonFromContent(content)
    
    if (result) {
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
          suggestions: Array.isArray(result.suggestions) ? result.suggestions.map((s: any) => typeof s === 'string' ? s : JSON.stringify(s)) : [],
          warnings: Array.isArray(result.warnings) ? result.warnings.map((w: any) => typeof w === 'string' ? w : (typeof w === 'object' && w !== null ? (w.message || w.text || w.warning || JSON.stringify(w)) : String(w))) : [],
          processingTime: Date.now() - startTime,
          status: 'completed'
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
      allWarnings.push(...response.warnings.map(w => {
          const wStr = typeof w === 'string' ? w : (typeof w === 'object' && w !== null ? (w.message || w.text || w.warning || JSON.stringify(w)) : String(w))
          return `[${response.agentName}] ${wStr}`
        }))
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
  // 直接修改的key也排除
  const primaryKeys = new Set(primaryChanges.map(c => c.key))
  
  // 规则1：检测月度利率设置 → 资金成本计算方式联动
  const monthlyRatePattern = /按.{0,2}月.{0,5}(\d+\.?\d*)%|月.{0,2}(\d+\.?\d*)%|每月.{0,5}(\d+\.?\d*)%/
  const monthlyMatch = message.match(monthlyRatePattern)
  
  if (monthlyMatch || lowerMessage.includes('按月') || lowerMessage.includes('每月')) {
    const hasRateChange = primaryChanges.some(c => 
      ['annualYieldRate', 'monthlyReturnRate', 'revenueShareRatio', 'annualReturnRate'].includes(c.key) ||
      c.paramName?.includes('收益') || c.paramName?.includes('利率') || c.paramName?.includes('分成')
    )
    
    const currentCalcMethod = currentParams.fundCostCalculation || '按日计算'
    
    if (hasRateChange && !existingKeys.has('fundCostCalculation') && !primaryKeys.has('fundCostCalculation') && !currentCalcMethod.includes('按月')) {
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
  
  // 规则1.5：检测季度利率设置 → 资金成本计算方式联动 + 年化换算
  const quarterlyRatePattern = /按.{0,2}季.{0,5}(\d+\.?\d*)%|季.{0,2}(\d+\.?\d*)%|每.{0,2}季.{0,5}(\d+\.?\d*)%|一季.{0,5}(\d+\.?\d*)%/
  const quarterlyMatch = message.match(quarterlyRatePattern)
  
  if (quarterlyMatch || message.includes('按季') || message.includes('每季') || message.includes('一季')) {
    const hasRateChange = primaryChanges.some(c => 
      ['annualYieldRate', 'annualReturnRate', 'quarterlyReturnRate', 'revenueShareRatio'].includes(c.key) ||
      c.paramName?.includes('收益') || c.paramName?.includes('利率') || c.paramName?.includes('分成')
    )
    
    const currentCalcMethod = currentParams.fundCostCalculation || ''
    
    if (hasRateChange && !existingKeys.has('fundCostCalculation') && !primaryKeys.has('fundCostCalculation') && !currentCalcMethod.includes('按季')) {
      result.push({
        key: 'fundCostCalculation',
        paramName: '资金成本计算方式',
        oldValue: currentCalcMethod || '未设置',
        newValue: '按季计算',
        clauseText: '资金成本按季度计算，每季度末结算一次，不足一季按实际天数折算',
        changeType: 'inferred',
        confidence: 'high',
        reason: '用户指定按季度计算收益，资金成本计算方式应同步调整为按季计算',
        relatedTo: primaryChanges.find(c => c.paramName?.includes('收益'))?.key || 'annualYieldRate',
        category: 'calculation_method',
        selected: false
      })
    }
    
    // 季度利率 → 年化换算
    const qRate = parseFloat(quarterlyMatch?.[1] || quarterlyMatch?.[2] || quarterlyMatch?.[3] || quarterlyMatch?.[4] || '0')
    if (qRate > 0) {
      const annualRate = (qRate * 4).toFixed(2)
      if (!existingKeys.has('annualYieldRateDisplay') && !primaryKeys.has('annualYieldRateDisplay')) {
        result.push({
          key: 'annualYieldRateDisplay',
          paramName: '年化收益率换算',
          oldValue: currentParams.annualYieldRate || currentParams.annualReturnRate || '未设置',
          newValue: `${annualRate}%（季${qRate}%×4）`,
          clauseText: `按季度收益率${qRate}%换算，年化收益率约为${annualRate}%`,
          changeType: 'inferred',
          confidence: 'high',
          reason: `季度收益率${qRate}%乘以4个季度，年化收益率为${annualRate}%`,
          relatedTo: 'quarterlyReturnRate',
          category: 'unit_conversion',
          selected: false
        })
      }
    }
    
    // 季度利率 → 对账结算周期联动
    if (!existingKeys.has('reconciliationDeadline') && !primaryKeys.has('reconciliationDeadline')) {
      const currentRecon = currentParams.reconciliationDeadline || ''
      if (!currentRecon.includes('季')) {
        result.push({
          key: 'reconciliationDeadline',
          paramName: '对账结算周期',
          oldValue: currentRecon || '每月15日前',
          newValue: '每季度结束后15日内',
          clauseText: '双方应于每个自然季度结束后十五（15）日内完成当季收入分成的对账确认',
          changeType: 'inferred',
          confidence: 'medium',
          reason: '收益按季度计算，对账结算周期应同步调整为按季度对账',
          relatedTo: 'fundCostCalculation',
          category: 'related_term',
          selected: false
        })
      }
    }
  }
  
  // 规则2：检测日度利率设置 → 资金成本计算方式联动
  const dailyRatePattern = /按.{0,2}日.{0,5}(\d+\.?\d*)%|日.{0,2}(\d+\.?\d*)%|每日.{0,5}(\d+\.?\d*)%/
  
  if (message.match(dailyRatePattern) || lowerMessage.includes('按日') || lowerMessage.includes('每天')) {
    const hasRateChange = primaryChanges.some(c => 
      ['annualYieldRate', 'dailyReturnRate', 'annualReturnRate'].includes(c.key) ||
      c.paramName?.includes('收益') || c.paramName?.includes('利率')
    )
    
    const currentCalcMethod = currentParams.fundCostCalculation || ''
    
    if (hasRateChange && !existingKeys.has('fundCostCalculation') && !primaryKeys.has('fundCostCalculation') && !currentCalcMethod.includes('按日')) {
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
  "understood": "用一句完整通顺的中文概括用户的修改意图",
  "analysisExplanation": "用2-3句完整通顺的中文解释联动分析的逻辑和结论",
  "primaryChanges": [
    {
      "key": "参数key",
      "paramName": "参数中文名",
      "oldValue": "原值",
      "newValue": "新值",
      "clauseText": "用完整的合同条款语言描述变更，至少15字",
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
      "clauseText": "用完整的合同条款语言描述联动变更，至少15字",
      "changeType": "inferred",
      "confidence": "high/medium/low",
      "reason": "用1-2句完整通顺的中文说明联动修改的原因",
      "relatedTo": "关联的直接修改key",
      "category": "unit_conversion/calculation_method/formula_update/related_term",
      "selected": false
    }
  ],
  "warnings": ["每条警告必须是完整通顺的中文句子"]
}

## 语言要求（非常重要）
- 所有中文文本必须语句通顺、表达清晰、没有语病
- understood、analysisExplanation、clauseText、reason、warnings都必须是完整的中文句子，主谓宾齐全
- 严禁输出断句、碎片化文本或只有关键词的短语

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
        max_tokens: CONFIG.INFER_MAX_TOKENS
      })
    })

    if (!response.ok) {
      throw new Error('API request failed')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 使用鲁棒JSON提取工具
    const result = extractJsonFromContent(content)

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
        max_tokens: CONFIG.INFER_MAX_TOKENS
      })
    })

    let inferredChanges: SmartChange[] = []
    let analysisExplanation = '基于直接修改分析可能的联动影响'

    if (response.ok) {
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      // 使用鲁棒JSON提取工具
      const result = extractJsonFromContent(content)
      if (result) {
          inferredChanges = (result.inferredChanges || []).map((c: any) => ({
            ...c,
            changeType: 'inferred' as ChangeType,
            selected: false
          }))
          analysisExplanation = result.analysisExplanation || analysisExplanation
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

// ==================== 法律顾问Agent系统 V3 ====================

/**
 * 法律顾问Agent系统提示词
 * 核心职责：将用户自然语言表达转化为专业法律合同语言
 */
const LEGAL_COUNSEL_SYSTEM_PROMPT = `你是一位资深的收入分成融资（Revenue-Based Financing）领域法律顾问，拥有15年以上的投融资合同起草和审核经验。

## 你的核心职责
将用户的自然语言表达转化为符合中国法律规范的专业合同条款语言。

## 转化原则

### 1. 法律语言规范
- 使用精确的法律术语，避免口语化表达
- 条款结构完整：主体明确、权利义务清晰、条件限定具体
- 数字表述规范：大写小写并存，如"人民币捌佰万元整（¥8,000,000.00）"
- 日期表述规范：年月日完整，如"自2024年3月1日起"
- 比例表述规范：百分比+说明，如"按月息2.75%（年化33%）计算"

### 2. 条款完整性
每个条款必须包含：
- 条款主体：明确适用对象
- 核心内容：具体的权利或义务
- 计算方式：涉及金额的需说明计算基准
- 生效条件：条款适用的前提条件
- 例外情形：特殊情况的处理方式（如适用）

### 3. 风险防范语言
- 添加必要的限定条件："除本协议另有约定外"、"经双方书面同意"
- 添加违约责任关联："如违反本条款，按照第X条处理"
- 添加解释条款："本条所称'收入'指..."

### 4. 行业特定规范
收入分成融资合同常见条款格式：

【投资金额条款】
"甲方同意向乙方提供联营资金人民币XXX元整（¥XXX），该款项应于本协议签署后X个工作日内划入乙方指定账户。"

【分成比例条款】
"乙方应按照其月度营业收入的X%（大写：百分之X）向甲方支付收入分成款。营业收入以乙方POS系统/财务账簿记录为准。"

【收益计算条款】
"本协议项下资金成本按月/日计算，月度费率为X%（年化X%）。计算公式：月度应付金额 = 期初本金余额 × 月度费率。"

【违约金条款】
"如乙方发生本协议第X条所列违约情形，应向甲方支付违约金，金额为联营资金总额的X%，即人民币XXX元整。"

## 输出格式要求

对于每个参数变更，输出：
{
  "key": "参数key",
  "paramName": "参数名称",
  "oldValue": "原值",
  "newValue": "新值（用户想要的）",
  "originalExpression": "用户原始表达方式",
  "clauseText": "简短的条款描述",
  "legalClauseText": "完整的法律条款语言，符合合同格式规范",
  "legalNotes": ["法律注意事项1", "法律注意事项2"],
  "legalReview": {
    "reviewed": true,
    "legalScore": 85,
    "improvements": ["可进一步完善的点"]
  }
}

## 重要提醒
1. 保持条款的法律效力和可执行性
2. 确保条款表述不存在歧义
3. 涉及金额、比例、期限的必须数字精确
4. 合同用语应庄重、正式，避免口语和情感化表达`

/**
 * 法律顾问Agent - 转化自然语言为法律条款
 */
export async function executeLegalCounselTransform(
  request: LegalTransformRequest,
  apiKey: string,
  baseUrl: string
): Promise<LegalTransformResult> {
  const startTime = Date.now()

  // 构建法律转化请求
  const userPrompt = `## 用户原始输入
"${request.originalInput}"

## 各模块Agent识别的修改意图
${request.moduleChanges.map(m => `
### ${m.agentName}
意图理解：${m.understood}
参数变更：
${m.changes.map(c => `- ${c.paramName}：${c.oldValue} → ${c.newValue}`).join('\n')}`).join('\n')}

## 当前合同背景
- 行业：${request.context.templateName}
- 视角：${request.context.perspective === 'investor' ? '投资方' : '融资方'}
- 相关当前参数：
${JSON.stringify(request.context.currentParams, null, 2)}

## 任务
请将以上修改意图转化为专业的法律合同条款语言。

**重要**：直接输出JSON对象，不要包裹在代码块中。

## 语言要求（非常重要）
- legalSummary：用一句完整通顺的中文概括此次修改的法律要点
- legalClauseText：用完整、规范的法律合同语言，控制在120字以内，必须是可以直接写入合同的正式条款
- legalNotes、riskWarnings、clauseRecommendations：每一条都必须是完整通顺的中文句子，主谓宾齐全，严禁输出断句或碎片化文本
- improvements：每条建议要具体、可操作，用完整句子表述

输出JSON格式：
{
  "legalSummary": "投资方申请将联营资金总额由1800万元调减至800万元，需同步调整相关违约责任条款。",
  "transformedChanges": [
    {
      "key": "参数key",
      "paramName": "参数中文名",
      "oldValue": "原值",
      "newValue": "新值",
      "originalExpression": "用户原始表达",
      "clauseText": "联营资金金额由1800万元调整为800万元",
      "legalClauseText": "甲方同意向乙方提供联营资金人民币捌佰万元整（¥8,000,000.00），该款项应于本协议签署后五个工作日内一次性划入乙方指定账户。",
      "legalNotes": ["联营资金减少55.56%，需评估对项目可行性的影响"],
      "legalReview": {"reviewed": true, "legalScore": 85, "improvements": ["建议增加资金分期到账条款以降低投资方风险"]}
    }
  ],
  "riskWarnings": ["投资金额大幅降低可能导致项目执行困难，建议重新评估演出规模和收益预期"],
  "clauseRecommendations": ["建议增加资金使用监管条款，确保资金专款专用"]
}`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL_QUALITY, // 法律转化使用高质量模型
        messages: [
          { role: 'system', content: LEGAL_COUNSEL_SYSTEM_PROMPT + '\n\n重要：直接输出JSON对象，不要包裹在```代码块中。确保输出精炼，控制在2000字以内。所有中文文本必须语句通顺、表达完整，严禁出现断句或语病。' },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: CONFIG.LEGAL_MAX_TOKENS
      })
    })

    if (!response.ok) {
      throw new Error('Legal counsel API request failed')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const finishReason = data.choices?.[0]?.finish_reason || 'unknown'
    
    // Debug: 记录原始响应
    console.log('[LegalCounsel] Raw content length:', content.length, 
      'finish_reason:', finishReason,
      'Has code block:', content.includes('```'), 
      'Has transformedChanges:', content.includes('transformedChanges'))

    // 使用鲁棒JSON提取工具
    const result = extractJsonFromContent(content)
    
    console.log('[LegalCounsel] Parse result:', result ? 'SUCCESS' : 'FAILED', 
      result ? `transformedChanges: ${result.transformedChanges?.length || 0}` : 
      `content preview: ${content.substring(0, 200)}`)

    if (result && result.transformedChanges && Array.isArray(result.transformedChanges) && result.transformedChanges.length > 0) {
      return {
        success: true,
        transformedChanges: result.transformedChanges.map((c: any) => ({
          key: c.key || '',
          paramName: c.paramName || '',
          oldValue: c.oldValue || '',
          newValue: c.newValue || '',
          clauseText: c.clauseText || '',
          originalExpression: c.originalExpression || request.originalInput,
          legalClauseText: c.legalClauseText || '',
          legalNotes: Array.isArray(c.legalNotes) ? c.legalNotes.map((n: any) => typeof n === 'string' ? n : String(n)) : [],
          changeType: 'primary' as ChangeType,
          selected: true,
          legalReview: {
            reviewed: true,
            reviewedAt: new Date().toISOString(),
            legalScore: c.legalReview?.legalScore || 80,
            improvements: Array.isArray(c.legalReview?.improvements) ? c.legalReview.improvements : []
          }
        })),
        legalSummary: result.legalSummary || '已完成法律语言转化',
        riskWarnings: Array.isArray(result.riskWarnings) ? result.riskWarnings.map((w: any) => typeof w === 'string' ? w : String(w)) : [],
        clauseRecommendations: Array.isArray(result.clauseRecommendations) ? result.clauseRecommendations : [],
        processingTime: Date.now() - startTime
      }
    }
    
    // 如果解析到了result但没有transformedChanges，尝试从原始agent changes中构建
    if (result && !result.transformedChanges) {
      // LLM可能返回了不同结构的结果，尝试适配
      const changes = result.changes || result.modifications || result.items || []
      if (Array.isArray(changes) && changes.length > 0) {
        return {
          success: true,
          transformedChanges: changes.map((c: any) => ({
            key: c.key || c.param || '',
            paramName: c.paramName || c.name || '',
            oldValue: c.oldValue || c.from || '',
            newValue: c.newValue || c.to || '',
            clauseText: c.clauseText || c.clause || c.description || '',
            originalExpression: request.originalInput,
            legalClauseText: c.legalClauseText || c.legalText || c.legal || '',
            legalNotes: [],
            changeType: 'primary' as ChangeType,
            selected: true,
            legalReview: { reviewed: true, reviewedAt: new Date().toISOString(), legalScore: 75, improvements: [] }
          })),
          legalSummary: result.legalSummary || result.summary || '已完成法律语言转化',
          riskWarnings: Array.isArray(result.riskWarnings) ? result.riskWarnings.map((w: any) => typeof w === 'string' ? w : String(w)) : [],
          clauseRecommendations: [],
          processingTime: Date.now() - startTime
        }
      }
    }

    return {
      success: false,
      transformedChanges: [],
      legalSummary: '法律转化失败',
      riskWarnings: ['无法解析法律顾问响应'],
      clauseRecommendations: [],
      processingTime: Date.now() - startTime
    }

  } catch (error) {
    return {
      success: false,
      transformedChanges: [],
      legalSummary: '法律转化服务暂时不可用',
      riskWarnings: [`错误: ${(error as Error).message}`],
      clauseRecommendations: [],
      processingTime: Date.now() - startTime
    }
  }
}

/**
 * V3增强版：智能联动修改工作流（带法律顾问转化）
 * 完整流程：用户输入 → 模块Agent识别 → 法律顾问转化 → 联动分析 → 输出
 */
export async function executeSmartChangeWorkflowV3(
  message: string,
  context: {
    currentParams: Record<string, any>
    templateId: string
    templateName: string
    negotiationHistory?: any[]
    perspective?: string
  },
  apiKey: string,
  baseUrl: string,
  options: {
    enableLegalTransform?: boolean  // 是否启用法律顾问转化，默认true
  } = {}
): Promise<SmartChangeResult> {
  const startTime = Date.now()
  const enableLegal = options.enableLegalTransform !== false

  // Step 1: 执行多Agent并行工作流识别修改意图
  const multiAgentResult = await executeMultiAgentWorkflow(message, context, apiKey, baseUrl)

  if (!multiAgentResult.success || multiAgentResult.allChanges.length === 0) {
    // 如果多Agent没有识别到修改，尝试直接用智能分析
    const fallbackResult = await executeSmartChangeAnalysis(message, context, apiKey, baseUrl)
    return {
      ...fallbackResult,
      legalTransform: { enabled: false }
    }
  }

  // Step 2: 法律顾问转化（如果启用）
  let legalTransformResult: LegalTransformResult | null = null
  let primaryChanges: SmartChange[] = []

  if (enableLegal) {
    const legalRequest: LegalTransformRequest = {
      originalInput: message,
      moduleChanges: multiAgentResult.agentResponses
        .filter(r => r.success && r.changes.length > 0)
        .map(r => ({
          agentId: r.agentId,
          agentName: r.agentName,
          changes: r.changes,
          understood: r.understood || ''
        })),
      context: {
        templateName: context.templateName,
        perspective: context.perspective || 'borrower',
        currentParams: context.currentParams
      }
    }

    legalTransformResult = await executeLegalCounselTransform(legalRequest, apiKey, baseUrl)

    if (legalTransformResult.success && legalTransformResult.transformedChanges.length > 0) {
      // 使用法律顾问转化后的结果
      primaryChanges = legalTransformResult.transformedChanges
    } else {
      // 法律转化失败，使用原始Agent结果
      primaryChanges = multiAgentResult.allChanges.map(c => ({
        ...c,
        changeType: 'primary' as ChangeType,
        selected: true,
        originalExpression: message,
        legalReview: {
          reviewed: false
        }
      }))
    }
  } else {
    // 未启用法律转化，直接使用Agent结果
    primaryChanges = multiAgentResult.allChanges.map(c => ({
      ...c,
      changeType: 'primary' as ChangeType,
      selected: true
    }))
  }

  // Step 3: 联动分析
  const inferPrompt = `你是合同条款联动分析专家。基于已识别的直接修改，分析可能需要联动调整的相关参数。

## 已识别的直接修改
${primaryChanges.map(c => `- ${c.paramName}（${c.key}）：${c.oldValue} → ${c.newValue}`).join('\n')}

## 当前所有合同参数
${JSON.stringify(context.currentParams, null, 2)}

## 原始用户请求
"${message}"

## 重要的联动规则（必须检查）
1. 月利率/季度利率/日利率设置 → 年化利率必须同步换算，资金成本计算方式必须匹配
2. 投资金额变化 → 违约金金额必须按比例重新计算（如违约金=投资额×20%）
3. 分成期限变化 → 截止日期需要重新计算
4. 收益计算方式变化 → 对账周期、结算周期应同步调整
5. 分成比例变化 → 预计回收期、年化回报率需要重新评估

请输出严格的JSON格式（不要包含代码块标记）。

## 语言要求（非常重要）
- analysisExplanation：用2-3句完整通顺的中文说明联动分析的逻辑和结论
- clauseText：每个联动修改的条款描述必须是完整的中文句子，至少15字
- reason：每个联动修改的理由必须是1-2句完整通顺的中文句子，清晰说明为什么需要联动
- warnings：每条警告必须是完整的中文句子，主谓宾齐全，不能只有短语或片段
- 所有输出文本严禁出现断句、语病或碎片化表述

输出格式：
{"analysisExplanation":"投资金额从1800万元降至800万元，降幅达55.56%。根据合同条款间的逻辑关系，违约金金额应按投资额的固定比例同步调整。","inferredChanges":[{"key":"参数key","paramName":"参数中文名","oldValue":"原值","newValue":"建议新值","clauseText":"违约金金额由360万元调整为160万元，保持投资额20%的比例不变","changeType":"inferred","confidence":"high或medium或low","reason":"原违约金360万元占投资金额1800万元的20%，投资金额调整为800万元后，为保持合同条款的内在一致性，违约金应同比例调整为160万元","relatedTo":"关联的直接修改参数key","category":"calculation_method或unit_conversion或formula_update或related_term","selected":false}],"warnings":["投资金额大幅下降可能影响项目的可行性，建议重新评估收益预期"]}`

  let inferredChanges: SmartChange[] = []
  let analysisExplanation = '基于直接修改分析可能的联动影响'
  let inferWarnings: string[] = []

  try {
    const inferResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL_QUALITY, // 使用高质量模型确保联动分析准确
        messages: [
          { role: 'system', content: '你是合同条款联动分析专家。直接输出JSON对象，不要包裹在代码块中。所有字段必须是字符串类型。所有中文文本必须语句通顺、表达完整、没有语病，每一条reason、clauseText、warning都必须是完整的中文句子。' },
          { role: 'user', content: inferPrompt }
        ],
        temperature: 0.2,
        max_tokens: CONFIG.INFER_MAX_TOKENS
      })
    })

    if (inferResponse.ok) {
      const data = await inferResponse.json()
      const content = data.choices?.[0]?.message?.content || ''
      const finishReason = data.choices?.[0]?.finish_reason || 'unknown'
      
      console.log('[InferAnalysis] content length:', content.length, 'finish_reason:', finishReason)
      
      // 使用鲁棒JSON提取工具
      const parsed = extractJsonFromContent(content)
      
      if (parsed) {
        inferredChanges = (parsed.inferredChanges || []).map((c: any) => ({
          key: c.key || '',
          paramName: c.paramName || '',
          oldValue: c.oldValue || '',
          newValue: c.newValue || '',
          clauseText: c.clauseText || '',
          changeType: 'inferred' as ChangeType,
          confidence: c.confidence || 'medium',
          reason: c.reason || '',
          relatedTo: c.relatedTo || '',
          category: c.category || 'related_term',
          selected: false
        }))
        analysisExplanation = parsed.analysisExplanation || analysisExplanation
        inferWarnings = Array.isArray(parsed.warnings) ? parsed.warnings.map((w: any) => typeof w === 'string' ? w : String(w)) : []
      }
    }
  } catch (e) {}

  // 规则引擎补充
  const ruleBasedInferred = detectRuleBasedInferredChanges(
    message,
    primaryChanges,
    context.currentParams,
    inferredChanges
  )
  if (ruleBasedInferred.length > 0) {
    inferredChanges = [...inferredChanges, ...ruleBasedInferred]
  }

  // 构建最终结果
  return {
    success: true,
    understood: multiAgentResult.understood,
    primaryChanges,
    inferredChanges,
    analysisExplanation,
    warnings: [
      ...multiAgentResult.allWarnings,
      ...(legalTransformResult?.riskWarnings || []),
      ...inferWarnings
    ],
    agentResponses: multiAgentResult.agentResponses,
    processingTime: Date.now() - startTime,
    legalTransform: enableLegal ? {
      enabled: true,
      legalSummary: legalTransformResult?.legalSummary,
      riskWarnings: legalTransformResult?.riskWarnings,
      clauseRecommendations: legalTransformResult?.clauseRecommendations,
      transformTime: legalTransformResult?.processingTime
    } : {
      enabled: false
    }
  }
}

// ==================== 渐进式工作流 V4 ====================

/**
 * 渐进式智能修改工作流
 * 设计原则：用户修改合同的第一要务是"看到改了什么"
 * 
 * Phase 1 (快速, ~5s): Agent识别 → 直接修改 + 规则引擎联动
 *   → 用户立即能看到要改什么，可以开始确认
 * Phase 2 (并行, ~15s): 法律顾问 + LLM联动分析 并行执行
 *   → 追加法律条款润色 + 更深层关联修改建议
 * 
 * 通过回调函数 onPhaseComplete 实时推送每个阶段的结果
 */
export async function executeProgressiveWorkflow(
  message: string,
  context: {
    currentParams: Record<string, any>
    templateId: string
    templateName: string
    negotiationHistory?: any[]
    perspective?: string
  },
  apiKey: string,
  baseUrl: string,
  onPhaseComplete: (phase: string, data: any) => void
): Promise<void> {
  const startTime = Date.now()

  // ═══════════════ Phase 1: 快速识别 ═══════════════
  // 目标：5秒内让用户看到"要改什么"
  
  onPhaseComplete('status', { phase: 1, message: '正在识别修改意图...' })
  
  const multiAgentResult = await executeMultiAgentWorkflow(message, context, apiKey, baseUrl)

  if (!multiAgentResult.success || multiAgentResult.allChanges.length === 0) {
    // 多Agent失败，回退到单次智能分析
    onPhaseComplete('status', { phase: 1, message: '正在深度分析...' })
    const fallbackResult = await executeSmartChangeAnalysis(message, context, apiKey, baseUrl)
    onPhaseComplete('complete', {
      ...fallbackResult,
      legalTransform: { enabled: false }
    })
    return
  }

  // 构建初始直接修改
  const phase1PrimaryChanges: SmartChange[] = multiAgentResult.allChanges.map(c => ({
    ...c,
    changeType: 'primary' as ChangeType,
    selected: true,
    originalExpression: message,
    legalReview: { reviewed: false }
  }))

  // 规则引擎 — 即时生成确定性联动（不需要LLM，毫秒级）
  const ruleBasedInferred = detectRuleBasedInferredChanges(
    message,
    phase1PrimaryChanges,
    context.currentParams,
    []
  )

  // Phase 1 完成 → 推送给前端
  onPhaseComplete('phase1', {
    success: true,
    understood: multiAgentResult.understood,
    primaryChanges: phase1PrimaryChanges,
    inferredChanges: ruleBasedInferred,
    analysisExplanation: ruleBasedInferred.length > 0 
      ? `识别到 ${phase1PrimaryChanges.length} 项直接修改，规则引擎推断 ${ruleBasedInferred.length} 项关联修改`
      : `识别到 ${phase1PrimaryChanges.length} 项直接修改`,
    warnings: multiAgentResult.allWarnings,
    agentResponses: multiAgentResult.agentResponses,
    processingTime: Date.now() - startTime,
    legalTransform: { enabled: true, status: 'pending' }
  })

  // ═══════════════ Phase 2: 并行深度分析 ═══════════════
  // 法律顾问 + LLM联动分析 同时执行，谁先完成谁先推送
  
  onPhaseComplete('status', { phase: 2, message: '法律顾问审核 + 深度联动分析中...' })

  // 2A: 法律顾问请求
  const legalRequest: LegalTransformRequest = {
    originalInput: message,
    moduleChanges: multiAgentResult.agentResponses
      .filter(r => r.success && r.changes.length > 0)
      .map(r => ({
        agentId: r.agentId,
        agentName: r.agentName,
        changes: r.changes,
        understood: r.understood || ''
      })),
    context: {
      templateName: context.templateName,
      perspective: context.perspective || 'borrower',
      currentParams: context.currentParams
    }
  }

  // 2B: LLM联动分析 prompt
  const inferPrompt = buildInferPrompt(phase1PrimaryChanges, context, message)

  // 并行执行 — Promise.allSettled 确保一个失败不影响另一个
  const [legalSettled, inferSettled] = await Promise.allSettled([
    executeLegalCounselTransform(legalRequest, apiKey, baseUrl),
    executeLLMInferAnalysis(inferPrompt, apiKey, baseUrl)
  ])

  // 处理法律顾问结果
  let finalPrimaryChanges = phase1PrimaryChanges
  let legalTransformInfo: any = { enabled: true }

  if (legalSettled.status === 'fulfilled' && legalSettled.value.success && legalSettled.value.transformedChanges.length > 0) {
    finalPrimaryChanges = legalSettled.value.transformedChanges
    legalTransformInfo = {
      enabled: true,
      legalSummary: legalSettled.value.legalSummary,
      riskWarnings: legalSettled.value.riskWarnings,
      clauseRecommendations: legalSettled.value.clauseRecommendations,
      transformTime: legalSettled.value.processingTime
    }
  } else {
    legalTransformInfo = {
      enabled: true,
      legalSummary: legalSettled.status === 'fulfilled' ? '法律顾问未能生成条款，使用原始修改' : '法律顾问服务暂时不可用',
      riskWarnings: legalSettled.status === 'fulfilled' ? legalSettled.value.riskWarnings : [],
      clauseRecommendations: []
    }
  }

  // 处理LLM联动分析结果
  let llmInferredChanges: SmartChange[] = []
  let llmInferWarnings: string[] = []
  let analysisExplanation = ''

  if (inferSettled.status === 'fulfilled' && inferSettled.value) {
    llmInferredChanges = inferSettled.value.inferredChanges || []
    llmInferWarnings = inferSettled.value.warnings || []
    analysisExplanation = inferSettled.value.analysisExplanation || ''
  }

  // 合并联动修改：LLM结果 + 规则引擎结果（去重）
  const existingKeys = new Set(llmInferredChanges.map(c => c.key))
  const mergedInferred = [
    ...llmInferredChanges,
    ...ruleBasedInferred.filter(c => !existingKeys.has(c.key))
  ]

  // Phase 2 完成 → 推送最终结果
  onPhaseComplete('phase2', {
    success: true,
    understood: multiAgentResult.understood,
    primaryChanges: finalPrimaryChanges,
    inferredChanges: mergedInferred,
    analysisExplanation: analysisExplanation || `共识别 ${finalPrimaryChanges.length} 项直接修改和 ${mergedInferred.length} 项关联修改`,
    warnings: [
      ...multiAgentResult.allWarnings,
      ...(legalTransformInfo.riskWarnings || []),
      ...llmInferWarnings
    ],
    agentResponses: multiAgentResult.agentResponses,
    processingTime: Date.now() - startTime,
    legalTransform: legalTransformInfo
  })
}

/**
 * 构建联动分析prompt（提取为独立函数复用）
 */
function buildInferPrompt(
  primaryChanges: SmartChange[],
  context: { currentParams: Record<string, any>; templateName?: string; perspective?: string },
  message: string
): string {
  return `你是合同条款联动分析专家。基于已识别的直接修改，分析可能需要联动调整的相关参数。

## 已识别的直接修改
${primaryChanges.map(c => `- ${c.paramName}（${c.key}）：${c.oldValue} → ${c.newValue}`).join('\n')}

## 当前所有合同参数
${JSON.stringify(context.currentParams, null, 2)}

## 原始用户请求
"${message}"

## 重要的联动规则（必须检查）
1. 月利率/季度利率/日利率设置 → 年化利率必须同步换算，资金成本计算方式必须匹配
2. 投资金额变化 → 违约金金额必须按比例重新计算（如违约金=投资额×20%）
3. 分成期限变化 → 截止日期需要重新计算
4. 收益计算方式变化 → 对账周期、结算周期应同步调整
5. 分成比例变化 → 预计回收期、年化回报率需要重新评估

直接输出JSON对象，不要包裹在代码块中。

## 语言要求（非常重要）
- analysisExplanation：用2-3句完整通顺的中文说明联动分析的逻辑和结论
- clauseText：每个联动修改的条款描述必须是完整的中文句子，至少15字
- reason：每个联动修改的理由必须是1-2句完整通顺的中文句子，清晰说明联动原因
- warnings：每条警告必须是完整的中文句子，主谓宾齐全
- 所有输出文本严禁出现断句、语病或碎片化表述

输出格式：
{"analysisExplanation":"联动分析说明","inferredChanges":[{"key":"参数key","paramName":"参数中文名","oldValue":"原值","newValue":"建议新值","clauseText":"条款变更描述","changeType":"inferred","confidence":"high或medium或low","reason":"联动修改的理由","relatedTo":"关联的直接修改参数key","category":"calculation_method或unit_conversion或formula_update或related_term","selected":false}],"warnings":["风险提示"]}`
}

/**
 * 独立的LLM联动分析（从V3工作流提取复用）
 */
async function executeLLMInferAnalysis(
  inferPrompt: string,
  apiKey: string,
  baseUrl: string
): Promise<{ inferredChanges: SmartChange[], warnings: string[], analysisExplanation: string } | null> {
  try {
    const inferResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL_QUALITY,
        messages: [
          { role: 'system', content: '你是合同条款联动分析专家。直接输出JSON对象，不要包裹在代码块中。所有字段必须是字符串类型。所有中文文本必须语句通顺、表达完整、没有语病，每一条reason、clauseText、warning都必须是完整的中文句子。' },
          { role: 'user', content: inferPrompt }
        ],
        temperature: 0.2,
        max_tokens: CONFIG.INFER_MAX_TOKENS
      })
    })

    if (!inferResponse.ok) return null

    const data = await inferResponse.json()
    const content = data.choices?.[0]?.message?.content || ''
    console.log('[InferAnalysis] content length:', content.length, 'finish_reason:', data.choices?.[0]?.finish_reason)

    const parsed = extractJsonFromContent(content)
    if (!parsed) return null

    return {
      inferredChanges: (parsed.inferredChanges || []).map((c: any) => ({
        key: c.key || '',
        paramName: c.paramName || '',
        oldValue: c.oldValue || '',
        newValue: c.newValue || '',
        clauseText: c.clauseText || '',
        changeType: 'inferred' as ChangeType,
        confidence: c.confidence || 'medium',
        reason: c.reason || '',
        relatedTo: c.relatedTo || '',
        category: c.category || 'related_term',
        selected: false
      })),
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map((w: any) => typeof w === 'string' ? w : String(w)) : [],
      analysisExplanation: parsed.analysisExplanation || ''
    }
  } catch (e) {
    console.error('[InferAnalysis] Error:', e)
    return null
  }
}
