import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamText } from 'hono/streaming'
import { contractKnowledge, fullContractText } from './knowledge'

type Bindings = {
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// 获取合同知识库数据
app.get('/api/contract', (c) => {
  return c.json(contractKnowledge)
})

// 获取完整合同文本
app.get('/api/contract/full', (c) => {
  return c.json(fullContractText)
})

// AI理解项目变动并生成合同修改
app.post('/api/parse-change', async (c) => {
  const { message, changeHistory } = await c.req.json()
  
  const apiKey = c.env?.OPENAI_API_KEY || process.env.GENSPARK_TOKEN || ''
  const baseUrl = c.env?.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
  
  const systemPrompt = `你是一个专业的演唱会投资合同智能助手。用户会用自然语言告诉你项目的变动信息，你需要：

1. 理解用户描述的变动内容
2. 识别这个变动对应合同的哪个模块
3. 将自然语言转换为专业的合同条款语言
4. 输出结构化的修改指令

## 合同模块ID对照表：
- investment: 投资架构（出资金额、出资条件、审批阈值、预算超支等）
- revenue: 收入分成（分成比例、分成期限、对账机制、补偿金等）
- artist: 艺人风险（艺人违约、政治言论、健康问题、延期处理等）
- force_majeure: 不可抗力（自然灾害、战争、瘟疫、资金分配等）
- ticketing: 票务管控（赠票上限、最低售价、折价票比例等）
- breach: 违约责任（违约金比例、严重违约情形、连带责任等）
- guarantee: 陈述保证（主体资格、实控人、信息真实性、廉洁条款等）
- escrow: 共管账户（开户行、权限配置、审批流程、收入归集等）
- disclosure: 信息披露（人员变更、紧急事项、审计报告等）

## 当前合同关键参数：
- 联营资金：1,800万元
- 分成比例：70%
- 终止回报率：33%年化
- 违约金：20%
- 赠票上限：1,000张
- 最低售价：票面50%
- 审批阈值：>10万
- 延期期限：6个月

## 输出格式要求：
你必须严格按以下JSON格式输出，不要有任何其他内容：

{
  "understood": "简要复述你理解的变动内容（1-2句话）",
  "moduleId": "对应的模块ID",
  "moduleName": "模块中文名称",
  "changes": [
    {
      "field": "变更的字段名（如：联营资金金额）",
      "oldValue": "原值",
      "newValue": "新值",
      "clauseText": "转换后的合同条款语言（正式、专业的表述）"
    }
  ],
  "riskNote": "从投资人角度，这个变动需要注意的风险点（可选）"
}

## 示例：

用户输入："这次投资金额改成2500万，分成比例降到60%"

输出：
{
  "understood": "投资金额从1800万调整为2500万，分成比例从70%降至60%",
  "moduleId": "investment",
  "moduleName": "投资架构",
  "changes": [
    {
      "field": "联营资金金额",
      "oldValue": "1,800万元",
      "newValue": "2,500万元",
      "clauseText": "滴灌通拟在满足本协议约定的相关前置条件后，提供联营资金，金额为人民币【2,500万元】（大写：贰仟伍佰万元整）。"
    }
  ],
  "riskNote": "投资金额增加700万，需确认劣后资金是否同比例增加，以及共管账户额度是否需要调整"
}

然后还有分成模块的变更：
{
  "understood": "分成比例从70%调整为60%",
  "moduleId": "revenue",
  "moduleName": "收入分成",
  "changes": [
    {
      "field": "分成比例",
      "oldValue": "70%",
      "newValue": "60%",
      "clauseText": "联营方和/或其他方应按照联营方收入的【60%】向滴灌通进行分成。"
    }
  ],
  "riskNote": "分成比例降低10%，投资回收期将延长，需重新测算IRR"
}

如果涉及多个模块，请输出多个JSON对象，用换行分隔。`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ]

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return c.json({ error: `API Error: ${error}` }, 500)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 解析多个JSON对象
    const jsonMatches = content.match(/\{[\s\S]*?\}(?=\s*\{|\s*$)/g) || []
    const changes = []
    
    for (const jsonStr of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed.moduleId && parsed.changes) {
          changes.push(parsed)
        }
      } catch (e) {
        // 尝试修复JSON
        try {
          const fixedJson = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
          const parsed = JSON.parse(fixedJson)
          if (parsed.moduleId && parsed.changes) {
            changes.push(parsed)
          }
        } catch (e2) {}
      }
    }
    
    // 如果没有解析到，尝试直接解析整个内容
    if (changes.length === 0) {
      try {
        const parsed = JSON.parse(content)
        if (parsed.moduleId && parsed.changes) {
          changes.push(parsed)
        }
      } catch (e) {}
    }
    
    return c.json({ changes, raw: content })
  } catch (error) {
    console.error('Parse error:', error)
    return c.json({ error: 'Failed to process request' }, 500)
  }
})

// 主页面
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>演唱会法律合同Agent</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    .input-container { height: calc(100vh - 80px); }
    .contract-container { height: calc(100vh - 80px); }
    
    /* 变更历史卡片 */
    .change-card { transition: all 0.3s ease; }
    .change-card:hover { transform: translateX(4px); }
    .change-badge { font-size: 10px; padding: 2px 6px; }
    
    /* 合同模块卡片 */
    .module-card { transition: all 0.3s ease; }
    .module-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .module-card.has-changes { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); }
    
    /* 变更标记 */
    .change-marker {
      position: relative;
    }
    .change-marker::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #10b981 0%, #059669 100%);
      border-radius: 2px;
    }
    .change-source {
      font-size: 10px;
      background: #10b981;
      color: white;
      padding: 1px 6px;
      border-radius: 10px;
      margin-left: 8px;
    }
    
    /* 值变更显示 */
    .value-old {
      text-decoration: line-through;
      color: #9ca3af;
      font-size: 0.85em;
    }
    .value-new {
      background: linear-gradient(120deg, #10b981 0%, #059669 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    .value-arrow {
      color: #10b981;
      margin: 0 4px;
    }
    
    /* 合同条款样式 */
    .contract-section { scroll-margin-top: 80px; transition: all 0.3s ease; }
    .contract-section.has-changes { 
      background: linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 50%, transparent 100%); 
      border-left: 4px solid #10b981;
    }
    .contract-clause { transition: all 0.3s ease; }
    .contract-clause:hover { background: #f9fafb; border-radius: 8px; }
    .contract-clause.modified {
      background: linear-gradient(90deg, #d1fae5 0%, #ecfdf5 50%, transparent 100%);
      border-left: 3px solid #10b981;
      position: relative;
    }
    .contract-clause.modified::after {
      content: '已修改';
      position: absolute;
      right: 8px;
      top: 8px;
      font-size: 11px;
      background: #10b981;
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
    }
    
    .clause-value { 
      background: linear-gradient(120deg, #a78bfa 0%, #818cf8 100%); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      font-weight: 700; 
    }
    .clause-value-changed {
      background: linear-gradient(120deg, #10b981 0%, #059669 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
      padding: 0 4px;
      position: relative;
    }
    .clause-value-changed::after {
      content: '✓';
      font-size: 10px;
      margin-left: 2px;
    }
    
    /* 目录样式 */
    .toc-item { transition: all 0.2s; border-radius: 6px; }
    .toc-item:hover { background: #eef2ff; }
    .toc-item.active { background: #c7d2fe; border-left: 3px solid #4f46e5; }
    .toc-item.has-changes { background: #d1fae5; border-left: 3px solid #10b981; }
    
    /* 加载动画 */
    .processing {
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body class="bg-gray-100">
  <div class="flex h-screen">
    <!-- 左侧：项目变动输入 -->
    <div class="w-2/5 bg-white border-r border-gray-200 flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600">
        <h1 class="text-xl font-bold text-white flex items-center">
          <i class="fas fa-edit mr-2"></i>
          演唱会合同编辑器
        </h1>
        <p class="text-emerald-100 text-sm mt-1">用自然语言描述项目变动，AI自动更新合同</p>
      </div>
      
      <!-- 输入区域 -->
      <div class="p-4 border-b border-gray-100 bg-gray-50">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-pencil-alt mr-1 text-emerald-600"></i>
          描述项目变动
        </label>
        <textarea id="changeInput" rows="4" placeholder="例如：&#10;• 这次投资金额改成2500万&#10;• 分成比例降到60%&#10;• 赠票上限增加到1500张&#10;• 艺人延期最长改为9个月"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-gray-800"></textarea>
        <div class="flex items-center justify-between mt-3">
          <div class="flex gap-2">
            <button onclick="quickChange('投资金额改成2000万')" class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">金额变更</button>
            <button onclick="quickChange('分成比例调整为65%')" class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">分成调整</button>
            <button onclick="quickChange('赠票上限改为1500张')" class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">票务变更</button>
          </div>
          <button onclick="submitChange()" id="submitBtn" class="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center">
            <i class="fas fa-magic mr-2"></i>应用变更
          </button>
        </div>
      </div>
      
      <!-- 变更历史 -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-700 flex items-center">
            <i class="fas fa-history mr-2 text-emerald-600"></i>
            变更记录
            <span id="changeCount" class="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">0</span>
          </h3>
          <button onclick="clearAllChanges()" class="text-xs text-gray-500 hover:text-red-500">
            <i class="fas fa-trash mr-1"></i>清空
          </button>
        </div>
        <div id="changeHistory" class="space-y-3">
          <div class="text-center text-gray-400 py-8">
            <i class="fas fa-inbox text-4xl mb-3"></i>
            <p class="text-sm">暂无变更记录</p>
            <p class="text-xs mt-1">在上方输入项目变动，AI将自动解析并更新合同</p>
          </div>
        </div>
      </div>
      
      <!-- 底部统计 -->
      <div class="p-3 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span><i class="fas fa-file-contract mr-1"></i>基于滴灌通联营协议模板</span>
          <span id="lastUpdate">-</span>
        </div>
      </div>
    </div>
    
    <!-- 右侧：合同视图 -->
    <div class="w-3/5 flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-800 flex items-center">
            <i class="fas fa-file-contract mr-2 text-indigo-600"></i>
            <span id="viewTitle">合同实时预览</span>
          </h2>
          <p class="text-xs text-gray-500 mt-1">变更内容会实时同步显示，绿色标记表示已修改</p>
        </div>
        <div class="flex items-center space-x-3">
          <span id="changedModulesBadge" class="hidden px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
            <i class="fas fa-check-circle mr-1"></i><span id="changedModulesCount">0</span> 个模块已修改
          </span>
          <!-- 视图切换 -->
          <div class="flex bg-gray-100 rounded-lg p-1">
            <button id="btnCardView" onclick="switchView('card')" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white shadow text-indigo-600">
              <i class="fas fa-th-large mr-1"></i>卡片
            </button>
            <button id="btnFullView" onclick="switchView('full')" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-800">
              <i class="fas fa-file-alt mr-1"></i>完整合同
            </button>
          </div>
        </div>
      </div>
      
      <!-- 卡片视图 -->
      <div id="cardView" class="contract-container overflow-y-auto p-4 bg-gray-50">
        <div id="contractModules" class="grid grid-cols-1 gap-4"></div>
      </div>
      
      <!-- 完整合同视图 -->
      <div id="fullView" class="hidden contract-container overflow-y-auto bg-white">
        <div class="flex">
          <!-- 目录 -->
          <div class="w-52 border-r border-gray-200 bg-gray-50 p-4 sticky top-0 h-screen overflow-y-auto">
            <h3 class="font-semibold text-gray-700 mb-3 text-sm">目录导航</h3>
            <div id="contractToc" class="space-y-1"></div>
          </div>
          <!-- 合同正文 -->
          <div class="flex-1 p-6">
            <div id="contractFullText" class="max-w-4xl mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // 状态管理
    let contractData = null;
    let fullContractData = null;
    let currentView = 'card';
    let changeHistory = []; // 变更历史
    let appliedChanges = {}; // 已应用的变更 { moduleId: { field: { oldValue, newValue, clauseText, changeIndex } } }
    let changeIndex = 0; // 变更序号
    
    // 加载合同数据
    async function loadContract() {
      try {
        const [res1, res2] = await Promise.all([
          fetch('/api/contract'),
          fetch('/api/contract/full')
        ]);
        contractData = await res1.json();
        fullContractData = await res2.json();
        renderContractModules();
        renderFullContract();
      } catch (e) {
        console.error('Failed to load contract:', e);
      }
    }
    
    // 提交变更
    async function submitChange() {
      const input = document.getElementById('changeInput');
      const message = input.value.trim();
      if (!message) return;
      
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AI解析中...';
      btn.classList.add('processing');
      
      try {
        const response = await fetch('/api/parse-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, changeHistory })
        });
        
        const result = await response.json();
        
        if (result.changes && result.changes.length > 0) {
          changeIndex++;
          
          // 记录变更历史
          const historyItem = {
            index: changeIndex,
            input: message,
            timestamp: new Date().toLocaleTimeString(),
            changes: result.changes
          };
          changeHistory.push(historyItem);
          
          // 应用变更
          for (const change of result.changes) {
            if (!appliedChanges[change.moduleId]) {
              appliedChanges[change.moduleId] = {};
            }
            for (const c of change.changes) {
              appliedChanges[change.moduleId][c.field] = {
                ...c,
                changeIndex,
                understood: change.understood,
                riskNote: change.riskNote
              };
            }
          }
          
          // 更新UI
          renderChangeHistory();
          renderContractModules();
          renderFullContract();
          updateStats();
          
          input.value = '';
        } else {
          alert('AI未能理解您的变更描述，请尝试更具体的描述');
        }
      } catch (e) {
        console.error('Submit error:', e);
        alert('处理失败，请重试');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic mr-2"></i>应用变更';
        btn.classList.remove('processing');
      }
    }
    
    // 渲染变更历史
    function renderChangeHistory() {
      const container = document.getElementById('changeHistory');
      
      if (changeHistory.length === 0) {
        container.innerHTML = \`
          <div class="text-center text-gray-400 py-8">
            <i class="fas fa-inbox text-4xl mb-3"></i>
            <p class="text-sm">暂无变更记录</p>
          </div>
        \`;
        return;
      }
      
      container.innerHTML = changeHistory.slice().reverse().map(item => \`
        <div class="change-card bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div class="flex items-start justify-between mb-2">
            <span class="change-badge bg-emerald-100 text-emerald-700 rounded-full font-medium">#\${item.index}</span>
            <span class="text-xs text-gray-400">\${item.timestamp}</span>
          </div>
          <p class="text-sm text-gray-800 mb-3 font-medium">"\${item.input}"</p>
          <div class="space-y-2">
            \${item.changes.map(change => \`
              <div class="bg-gray-50 rounded p-2">
                <div class="flex items-center text-xs text-gray-500 mb-1">
                  <i class="fas fa-folder mr-1"></i>\${change.moduleName}
                </div>
                \${change.changes.map(c => \`
                  <div class="flex items-center text-sm">
                    <span class="text-gray-600">\${c.field}:</span>
                    <span class="value-old ml-2">\${c.oldValue}</span>
                    <span class="value-arrow">→</span>
                    <span class="value-new">\${c.newValue}</span>
                  </div>
                \`).join('')}
                \${change.riskNote ? \`
                  <div class="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    <i class="fas fa-exclamation-triangle mr-1"></i>\${change.riskNote}
                  </div>
                \` : ''}
              </div>
            \`).join('')}
          </div>
        </div>
      \`).join('');
      
      document.getElementById('changeCount').textContent = changeHistory.length;
    }
    
    // 渲染卡片视图
    function renderContractModules() {
      const container = document.getElementById('contractModules');
      if (!contractData) return;
      
      const moduleIcons = {
        investment: 'fa-coins', revenue: 'fa-chart-pie', artist: 'fa-user-music',
        force_majeure: 'fa-shield-alt', ticketing: 'fa-ticket', breach: 'fa-gavel',
        guarantee: 'fa-handshake', escrow: 'fa-university', disclosure: 'fa-eye'
      };
      const moduleColors = {
        investment: 'indigo', revenue: 'emerald', artist: 'rose', force_majeure: 'amber',
        ticketing: 'cyan', breach: 'red', guarantee: 'purple', escrow: 'blue', disclosure: 'teal'
      };
      
      container.innerHTML = contractData.modules.map(module => {
        const icon = moduleIcons[module.id] || 'fa-file';
        const color = moduleColors[module.id] || 'gray';
        const moduleChanges = appliedChanges[module.id] || {};
        const hasChanges = Object.keys(moduleChanges).length > 0;
        
        return \`
          <div id="module-\${module.id}" class="module-card bg-white rounded-xl p-5 border-2 \${hasChanges ? 'has-changes border-emerald-300' : 'border-gray-100'} shadow-sm">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-xl bg-\${color}-100 flex items-center justify-center mr-3">
                  <i class="fas \${icon} text-\${color}-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="font-bold text-gray-800 text-lg">\${module.title}</h3>
                  <p class="text-sm text-gray-500">\${module.description}</p>
                </div>
              </div>
              \${hasChanges ? \`
                <span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  <i class="fas fa-check mr-1"></i>\${Object.keys(moduleChanges).length}项变更
                </span>
              \` : ''}
            </div>
            
            <div class="space-y-3">
              \${module.clauses.map(clause => {
                const change = moduleChanges[clause.name];
                if (change) {
                  return \`
                    <div class="change-marker pl-4 py-2 bg-emerald-50 rounded-lg">
                      <div class="flex items-center justify-between">
                        <span class="text-gray-700 font-medium">\${clause.name}</span>
                        <div class="flex items-center">
                          <span class="value-old mr-1">\${change.oldValue}</span>
                          <span class="value-arrow">→</span>
                          <span class="value-new ml-1">\${change.newValue}</span>
                          <span class="change-source">#\${change.changeIndex}</span>
                        </div>
                      </div>
                      \${clause.note ? \`<p class="text-xs text-gray-500 mt-1">\${clause.note}</p>\` : ''}
                    </div>
                  \`;
                } else {
                  return \`
                    <div class="flex items-center justify-between py-2 border-b border-gray-50">
                      <span class="text-gray-600">\${clause.name}</span>
                      <span class="font-semibold text-\${color}-600">\${clause.value}</span>
                    </div>
                  \`;
                }
              }).join('')}
            </div>
            
            \${module.risks ? \`
              <div class="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p class="text-xs text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i>\${module.risks}</p>
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }
    
    // 渲染完整合同
    function renderFullContract() {
      if (!fullContractData) return;
      
      const tocContainer = document.getElementById('contractToc');
      const textContainer = document.getElementById('contractFullText');
      
      // 渲染目录
      tocContainer.innerHTML = fullContractData.sections.map(section => {
        const moduleChanges = appliedChanges[section.id] || {};
        const hasChanges = Object.keys(moduleChanges).length > 0;
        return \`
          <div class="toc-item px-3 py-2 cursor-pointer text-sm \${hasChanges ? 'has-changes' : ''}" onclick="scrollToSection('\${section.id}')">
            <div class="flex items-center justify-between">
              <span class="text-gray-700">\${section.number}. \${section.title}</span>
              \${hasChanges ? '<i class="fas fa-check-circle text-emerald-500 text-xs"></i>' : ''}
            </div>
          </div>
        \`;
      }).join('');
      
      // 渲染正文
      textContainer.innerHTML = \`
        <div class="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h1 class="text-2xl font-bold text-gray-900">联合经营协议</h1>
          <p class="text-gray-500 mt-2">合同编号：MCILC260128</p>
          <p class="text-gray-400 text-sm mt-1">Cardi B 2026深圳/杭州演唱会投资项目</p>
        </div>
        
        \${fullContractData.sections.map(section => {
          const moduleChanges = appliedChanges[section.id] || {};
          const hasChanges = Object.keys(moduleChanges).length > 0;
          const module = contractData?.modules.find(m => m.id === section.id);
          
          return \`
            <div id="section-\${section.id}" class="contract-section mb-8 p-5 rounded-xl border \${hasChanges ? 'has-changes border-emerald-200' : 'border-gray-100'}">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                  <span class="w-10 h-10 rounded-xl \${hasChanges ? 'bg-emerald-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} text-white flex items-center justify-center text-sm font-bold mr-3">\${section.number}</span>
                  \${section.title}
                </h2>
                \${hasChanges ? \`
                  <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    <i class="fas fa-edit mr-1"></i>\${Object.keys(moduleChanges).length}处修改
                  </span>
                \` : ''}
              </div>
              
              <!-- 变更摘要 -->
              \${hasChanges ? \`
                <div class="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p class="text-sm text-emerald-700 font-medium mb-2"><i class="fas fa-info-circle mr-1"></i>本章变更摘要：</p>
                  <div class="flex flex-wrap gap-2">
                    \${Object.entries(moduleChanges).map(([field, change]) => \`
                      <span class="px-2 py-1 bg-white border border-emerald-200 rounded text-xs">
                        \${field}: <span class="value-old">\${change.oldValue}</span> → <span class="value-new">\${change.newValue}</span>
                        <span class="change-source">#\${change.changeIndex}</span>
                      </span>
                    \`).join('')}
                  </div>
                </div>
              \` : ''}
              
              <div class="space-y-3">
                \${section.clauses.map((clause, idx) => {
                  // 检查这个条款是否有变更
                  let isModified = false;
                  let modifiedClauseText = clause.text;
                  let changeSource = null;
                  
                  for (const [field, change] of Object.entries(moduleChanges)) {
                    if (change.clauseText && clause.text.includes(change.oldValue.replace(/,/g, ''))) {
                      isModified = true;
                      modifiedClauseText = change.clauseText;
                      changeSource = change.changeIndex;
                      break;
                    }
                  }
                  
                  return \`
                    <div class="contract-clause p-4 border border-gray-100 rounded-lg \${isModified ? 'modified' : ''}">
                      <div class="flex items-start">
                        <span class="\${isModified ? 'text-emerald-500 bg-emerald-50' : 'text-indigo-400 bg-indigo-50'} font-mono text-sm mr-3 px-2 py-0.5 rounded">\${section.number}.\${idx + 1}</span>
                        <div class="flex-1">
                          <p class="text-gray-800 leading-relaxed">\${highlightValues(modifiedClauseText, isModified)}</p>
                          \${clause.note ? \`
                            <div class="mt-3 pl-3 border-l-2 \${isModified ? 'border-emerald-300 bg-emerald-50/50' : 'border-indigo-200 bg-indigo-50/50'} py-1.5 rounded-r">
                              <p class="text-sm \${isModified ? 'text-emerald-700' : 'text-indigo-700'}"><i class="fas fa-bookmark mr-1"></i> \${clause.note}</p>
                            </div>
                          \` : ''}
                          \${isModified && changeSource ? \`
                            <div class="mt-2 text-xs text-emerald-600">
                              <i class="fas fa-history mr-1"></i>来自变更 #\${changeSource}
                            </div>
                          \` : ''}
                        </div>
                      </div>
                    </div>
                  \`;
                }).join('')}
              </div>
            </div>
          \`;
        }).join('')}
        
        <!-- 合同尾部 -->
        <div class="mt-12 pt-8 border-t-2 border-gray-200">
          <div class="text-center text-gray-500 text-sm">
            <p>—— 合同正文结束 ——</p>
            <p class="mt-4 text-xs text-gray-400">签署日期：2026年2月13日 | 适用法律：中华人民共和国法律</p>
          </div>
        </div>
      \`;
    }
    
    // 高亮数值
    function highlightValues(text, isModified) {
      const valueClass = isModified ? 'clause-value-changed' : 'clause-value';
      return text
        .replace(/【([^】]+)】/g, \`<span class="\${valueClass}">【$1】</span>\`)
        .replace(/(\\d+(?:,\\d{3})*(?:\\.\\d+)?(?:万元|元|%|日|个月|张))/g, \`<span class="\${valueClass}">$1</span>\`);
    }
    
    // 更新统计
    function updateStats() {
      const changedModules = Object.keys(appliedChanges).filter(k => Object.keys(appliedChanges[k]).length > 0);
      const badge = document.getElementById('changedModulesBadge');
      const count = document.getElementById('changedModulesCount');
      
      if (changedModules.length > 0) {
        badge.classList.remove('hidden');
        count.textContent = changedModules.length;
      } else {
        badge.classList.add('hidden');
      }
      
      document.getElementById('lastUpdate').textContent = '最后更新: ' + new Date().toLocaleTimeString();
    }
    
    // 切换视图
    function switchView(view) {
      currentView = view;
      document.getElementById('cardView').classList.toggle('hidden', view !== 'card');
      document.getElementById('fullView').classList.toggle('hidden', view !== 'full');
      
      document.getElementById('btnCardView').classList.toggle('bg-white', view === 'card');
      document.getElementById('btnCardView').classList.toggle('shadow', view === 'card');
      document.getElementById('btnCardView').classList.toggle('text-indigo-600', view === 'card');
      document.getElementById('btnCardView').classList.toggle('text-gray-600', view !== 'card');
      
      document.getElementById('btnFullView').classList.toggle('bg-white', view === 'full');
      document.getElementById('btnFullView').classList.toggle('shadow', view === 'full');
      document.getElementById('btnFullView').classList.toggle('text-indigo-600', view === 'full');
      document.getElementById('btnFullView').classList.toggle('text-gray-600', view !== 'full');
      
      document.getElementById('viewTitle').textContent = view === 'card' ? '合同实时预览' : '完整合同文本';
    }
    
    // 滚动到章节
    function scrollToSection(sectionId) {
      switchView('full');
      setTimeout(() => {
        const el = document.getElementById('section-' + sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    
    // 快速填入
    function quickChange(text) {
      document.getElementById('changeInput').value = text;
    }
    
    // 清空变更
    function clearAllChanges() {
      if (confirm('确定要清空所有变更记录吗？合同将恢复到初始状态。')) {
        changeHistory = [];
        appliedChanges = {};
        changeIndex = 0;
        renderChangeHistory();
        renderContractModules();
        renderFullContract();
        updateStats();
      }
    }
    
    // 初始化
    loadContract();
  </script>
</body>
</html>`)
})

export default app
