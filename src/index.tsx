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

// AI对话接口 - 流式响应
app.post('/api/chat', async (c) => {
  const { message, history } = await c.req.json()
  
  const apiKey = c.env?.OPENAI_API_KEY || process.env.GENSPARK_TOKEN || ''
  const baseUrl = c.env?.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
  
  const systemPrompt = `你是一个专业的演唱会投资法律合同审查助手。你的知识库基于滴灌通联合经营协议模板。

## 你的核心能力：
1. 解答用户关于演唱会投资合同的问题
2. 根据用户的担忧点，提供相应的条款保护建议
3. 从投资人和联营方两个视角提供分析
4. 提供具体的条款修改建议

## 合同知识库摘要：
${JSON.stringify(contractKnowledge, null, 2)}

## 回答规则：
1. 回答要简洁专业，直接切入要点
2. 如果涉及具体条款，请明确指出是哪个模块的条款
3. 提供修改建议时，要给出具体的条款文本
4. 回复末尾用JSON格式标注相关的合同模块，格式：
   <<<HIGHLIGHT>>>{"modules": ["模块ID1", "模块ID2"], "suggestions": [{"moduleId": "模块ID", "title": "建议标题", "content": "建议内容"}]}<<<END>>>

## 模块ID对照表：
- investment: 投资架构
- revenue: 收入分成
- artist: 艺人风险
- force_majeure: 不可抗力
- ticketing: 票务管控
- breach: 违约责任
- guarantee: 陈述保证
- escrow: 共管账户
- disclosure: 信息披露`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role, content: h.content })),
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
        model: 'gpt-5',
        messages,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return c.json({ error: `API Error: ${error}` }, 500)
    }

    return streamText(c, async (stream) => {
      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const json = JSON.parse(data)
              const content = json.choices?.[0]?.delta?.content || ''
              if (content) {
                await stream.write(content)
              }
            } catch (e) {}
          }
        }
      }
    })
  } catch (error) {
    console.error('Chat error:', error)
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
    .chat-container { height: calc(100vh - 180px); }
    .contract-container { height: calc(100vh - 120px); }
    .message-user { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .message-assistant { background: #f3f4f6; }
    .module-card { transition: all 0.3s ease; }
    .module-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .module-card.highlighted { border-color: #f59e0b; background: #fffbeb; }
    .suggestion-badge { animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .typing-indicator span { animation: typing 1.4s infinite; display: inline-block; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
    .markdown-content h3 { font-weight: 600; margin-top: 1rem; }
    .markdown-content ul { list-style: disc; margin-left: 1.5rem; }
    .markdown-content ol { list-style: decimal; margin-left: 1.5rem; }
    .markdown-content code { background: #e5e7eb; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.875rem; }
    
    /* 完整合同样式 */
    .contract-section { scroll-margin-top: 80px; transition: all 0.3s ease; }
    .contract-section.highlighted { 
      background: linear-gradient(90deg, #fef3c7 0%, #fffbeb 50%, transparent 100%); 
      border-left: 4px solid #f59e0b; 
      animation: highlight-pulse 1s ease-out;
    }
    @keyframes highlight-pulse {
      0% { background-color: #fbbf24; }
      100% { background-color: transparent; }
    }
    .contract-clause { transition: all 0.3s ease; cursor: pointer; position: relative; }
    .contract-clause:hover { background: #f3f4f6; border-radius: 8px; }
    .contract-clause.has-suggestion { 
      background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
      border-left: 3px solid #f59e0b;
    }
    .contract-clause.has-suggestion::before {
      content: '💡 有修改建议';
      position: absolute;
      right: 8px;
      top: 8px;
      font-size: 12px;
      background: #f59e0b;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .clause-value { 
      background: linear-gradient(120deg, #a78bfa 0%, #818cf8 100%); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      font-weight: 700; 
      padding: 0 2px;
    }
    .toc-item { transition: all 0.2s; border-radius: 6px; }
    .toc-item:hover { background: #eef2ff; }
    .toc-item.active { background: #c7d2fe; border-left: 3px solid #4f46e5; font-weight: 600; }
    .toc-item.has-highlight { position: relative; }
    .toc-item.has-highlight::after {
      content: '⭐';
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    /* 条款详情弹窗 */
    .clause-detail-modal { 
      backdrop-filter: blur(4px);
    }
    .clause-suggestion-inline {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
    }
    
    /* 条款编辑模式 */
    .clause-editable {
      background: #f0fdf4;
      border: 2px dashed #22c55e;
      border-radius: 8px;
    }
    .clause-original {
      text-decoration: line-through;
      color: #9ca3af;
    }
    .clause-modified {
      background: #dcfce7;
      padding: 2px 4px;
      border-radius: 4px;
    }
  </style>
</head>
<body class="bg-gray-100">
  <div class="flex h-screen">
    <!-- 左侧：对话区域 -->
    <div class="w-2/5 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <h1 class="text-xl font-bold text-white flex items-center">
          <i class="fas fa-gavel mr-2"></i>
          演唱会法律合同Agent
        </h1>
        <p class="text-indigo-200 text-sm mt-1">基于滴灌通联营协议的智能审查助手</p>
      </div>
      
      <div id="chatHistory" class="chat-container overflow-y-auto p-4 space-y-4">
        <div class="message-assistant rounded-lg p-4 max-w-[90%]">
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
              <i class="fas fa-robot text-indigo-600"></i>
            </div>
            <div>
              <p class="text-gray-800">你好！我是演唱会法律合同审查助手。</p>
              <p class="text-gray-600 mt-2 text-sm">你可以问我：</p>
              <ul class="text-gray-600 text-sm mt-1 space-y-1">
                <li>• 出资的前置条件有哪些？</li>
                <li>• 艺人发表政治言论怎么保护？</li>
                <li>• 分成比例怎么计算？</li>
                <li>• 演出取消怎么处理？</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-200 bg-gray-50">
        <div class="flex space-x-2">
          <input type="text" id="messageInput" placeholder="输入你的问题..."
            class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onkeypress="if(event.key==='Enter') sendMessage()" />
          <button onclick="sendMessage()" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas fa-paper-plane mr-2"></i>发送
          </button>
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <button onclick="quickAsk('出资的前置条件有哪些？')" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300">出资条件</button>
          <button onclick="quickAsk('艺人风险怎么防范？')" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300">艺人风险</button>
          <button onclick="quickAsk('收入分成怎么计算？')" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300">分成计算</button>
          <button onclick="quickAsk('违约金怎么规定？')" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300">违约责任</button>
        </div>
      </div>
    </div>
    
    <!-- 右侧：合同视图 -->
    <div class="w-3/5 flex flex-col">
      <!-- 头部带切换 -->
      <div class="p-4 border-b border-gray-200 bg-white">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800 flex items-center">
            <i class="fas fa-file-contract mr-2 text-indigo-600"></i>
            <span id="viewTitle">合同条款可视化</span>
          </h2>
          <div class="flex items-center space-x-3">
            <span id="highlightBadge" class="hidden suggestion-badge px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
              <i class="fas fa-lightbulb mr-1"></i><span id="suggestionCount">0</span> 条建议
            </span>
            <!-- 视图切换按钮 -->
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
      </div>
      
      <!-- 卡片视图 -->
      <div id="cardView" class="contract-container overflow-y-auto p-4 bg-gray-50">
        <div id="contractModules"></div>
      </div>
      
      <!-- 完整合同视图 -->
      <div id="fullView" class="hidden contract-container overflow-y-auto bg-white">
        <div class="flex">
          <!-- 目录 -->
          <div class="w-56 border-r border-gray-200 bg-gray-50 p-4 sticky top-0 h-screen overflow-y-auto">
            <h3 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">目录导航</h3>
            <div id="contractToc" class="space-y-1"></div>
          </div>
          <!-- 合同正文 -->
          <div class="flex-1 p-8 max-w-4xl">
            <div id="contractFullText" class="prose prose-sm max-w-none"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 修改建议弹窗 -->
  <div id="suggestionModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 clause-detail-modal">
    <div class="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-2xl">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
        <h3 class="text-lg font-semibold text-amber-800 flex items-center">
          <i class="fas fa-edit mr-2"></i><span id="modalTitle">修改建议</span>
        </h3>
        <button onclick="closeSuggestionModal()" class="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <div id="suggestionContent" class="p-6 overflow-y-auto max-h-[70vh]"></div>
    </div>
  </div>
  
  <!-- 条款详情弹窗 -->
  <div id="clauseDetailModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 clause-detail-modal">
    <div class="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 class="text-lg font-semibold text-indigo-800 flex items-center">
          <i class="fas fa-file-contract mr-2"></i><span id="clauseModalTitle">条款详情</span>
        </h3>
        <div class="flex items-center space-x-2">
          <button onclick="askAboutClause()" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center">
            <i class="fas fa-robot mr-1"></i>AI分析
          </button>
          <button onclick="closeClauseDetailModal()" class="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>
      <div id="clauseDetailContent" class="p-6 overflow-y-auto max-h-[75vh]"></div>
    </div>
  </div>

  <script>
    let contractData = null;
    let fullContractData = null;
    let chatHistory = [];
    let currentHighlights = [];
    let currentSuggestions = [];
    let currentView = 'card';
    
    // 加载数据
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
    
    // 切换视图
    function switchView(view) {
      currentView = view;
      const cardView = document.getElementById('cardView');
      const fullView = document.getElementById('fullView');
      const btnCard = document.getElementById('btnCardView');
      const btnFull = document.getElementById('btnFullView');
      const title = document.getElementById('viewTitle');
      
      if (view === 'card') {
        cardView.classList.remove('hidden');
        fullView.classList.add('hidden');
        btnCard.classList.add('bg-white', 'shadow', 'text-indigo-600');
        btnCard.classList.remove('text-gray-600');
        btnFull.classList.remove('bg-white', 'shadow', 'text-indigo-600');
        btnFull.classList.add('text-gray-600');
        title.textContent = '合同条款可视化';
      } else {
        cardView.classList.add('hidden');
        fullView.classList.remove('hidden');
        btnFull.classList.add('bg-white', 'shadow', 'text-indigo-600');
        btnFull.classList.remove('text-gray-600');
        btnCard.classList.remove('bg-white', 'shadow', 'text-indigo-600');
        btnCard.classList.add('text-gray-600');
        title.textContent = '完整合同文本';
        renderFullContract(); // 重新渲染以应用高亮
      }
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
        const isHighlighted = currentHighlights.includes(module.id);
        const moduleSuggestions = currentSuggestions.filter(s => s.moduleId === module.id);
        
        return \`
          <div id="module-\${module.id}" class="module-card bg-white rounded-xl p-5 mb-4 border-2 \${isHighlighted ? 'border-amber-400 highlighted' : 'border-gray-100'} shadow-sm cursor-pointer" onclick="switchView('full'); scrollToSection('\${module.id}')">
            <div class="flex items-start justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-lg bg-\${color}-100 flex items-center justify-center mr-3">
                  <i class="fas \${icon} text-\${color}-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">\${module.title}</h3>
                  <p class="text-sm text-gray-500">\${module.description}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                \${moduleSuggestions.length > 0 ? \`
                  <button onclick="event.stopPropagation(); showSuggestions('\${module.id}')" class="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200 transition-colors flex items-center">
                    <i class="fas fa-lightbulb mr-1"></i>\${moduleSuggestions.length} 条建议
                  </button>
                \` : ''}
                <span class="text-gray-400 text-sm"><i class="fas fa-chevron-right"></i></span>
              </div>
            </div>
            <div class="mt-4 space-y-2">
              \${module.clauses.slice(0, 3).map(clause => \`
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">\${clause.name}</span>
                  <span class="font-semibold text-\${color}-600">\${clause.value}</span>
                </div>
              \`).join('')}
              \${module.clauses.length > 3 ? \`<p class="text-xs text-gray-400 mt-2">还有 \${module.clauses.length - 3} 项条款...</p>\` : ''}
            </div>
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
        const isHighlighted = currentHighlights.includes(section.id);
        const hasSuggestions = currentSuggestions.some(s => s.moduleId === section.id);
        return \`
          <div class="toc-item px-3 py-2 cursor-pointer text-sm \${isHighlighted ? 'active has-highlight' : ''}" onclick="scrollToSection('\${section.id}')">
            <div class="flex items-center justify-between">
              <span class="text-gray-700 \${isHighlighted ? 'font-semibold' : ''}">\${section.number}. \${section.title}</span>
              \${hasSuggestions ? '<span class="text-amber-500 text-xs">💡</span>' : ''}
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
          const isHighlighted = currentHighlights.includes(section.id);
          const sectionSuggestions = currentSuggestions.filter(s => s.moduleId === section.id);
          const module = contractData?.modules.find(m => m.id === section.id);
          
          return \`
            <div id="section-\${section.id}" class="contract-section mb-8 p-5 rounded-xl border \${isHighlighted ? 'highlighted border-amber-300' : 'border-gray-100'}">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                  <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold mr-3 shadow-md">\${section.number}</span>
                  \${section.title}
                </h2>
                <div class="flex items-center space-x-2">
                  \${sectionSuggestions.length > 0 ? \`
                    <button onclick="event.stopPropagation(); showSuggestions('\${section.id}')" class="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200 flex items-center shadow-sm">
                      <i class="fas fa-lightbulb mr-1"></i>\${sectionSuggestions.length} 条建议
                    </button>
                  \` : ''}
                  \${module?.risks ? \`
                    <span class="px-2 py-1 bg-red-50 text-red-600 rounded text-xs" title="\${module.risks}">
                      <i class="fas fa-exclamation-circle"></i> 有风险
                    </span>
                  \` : ''}
                </div>
              </div>
              
              <!-- 章节摘要 -->
              \${module ? \`
                <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p class="text-sm text-gray-600"><i class="fas fa-info-circle mr-1 text-indigo-500"></i> \${module.description}</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    \${module.clauses.slice(0, 4).map(c => \`
                      <span class="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">\${c.name}: <strong class="text-indigo-600">\${c.value}</strong></span>
                    \`).join('')}
                  </div>
                </div>
              \` : ''}
              
              <div class="space-y-3">
                \${section.clauses.map((clause, idx) => {
                  const hasSuggestion = sectionSuggestions.length > 0;
                  return \`
                    <div class="contract-clause p-4 border border-gray-100 rounded-lg hover:shadow-md \${hasSuggestion && idx === 0 ? 'has-suggestion' : ''}" 
                         onclick="showClauseDetail('\${section.id}', \${idx})">
                      <div class="flex items-start">
                        <span class="text-indigo-400 font-mono text-sm mr-3 bg-indigo-50 px-2 py-0.5 rounded">\${section.number}.\${idx + 1}</span>
                        <div class="flex-1">
                          <p class="text-gray-800 leading-relaxed">\${highlightValues(clause.text)}</p>
                          \${clause.note ? \`
                            <div class="mt-3 pl-3 border-l-2 border-indigo-200 bg-indigo-50/50 py-1.5 rounded-r">
                              <p class="text-sm text-indigo-700"><i class="fas fa-bookmark mr-1"></i> \${clause.note}</p>
                            </div>
                          \` : ''}
                        </div>
                        <span class="text-gray-300 ml-2"><i class="fas fa-chevron-right"></i></span>
                      </div>
                    </div>
                  \`;
                }).join('')}
              </div>
              
              <!-- 章节风险提示 -->
              \${module?.risks ? \`
                <div class="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p class="text-sm text-red-700"><i class="fas fa-shield-alt mr-1"></i> <strong>风险提示：</strong>\${module.risks}</p>
                </div>
              \` : ''}
            </div>
          \`;
        }).join('')}
        
        <!-- 合同尾部 -->
        <div class="mt-12 pt-8 border-t-2 border-gray-200">
          <div class="text-center text-gray-500 text-sm">
            <p>—— 合同正文结束 ——</p>
            <p class="mt-2">本协议一式贰份，各方各执壹份，具有同等法律效力</p>
            <p class="mt-4 text-xs text-gray-400">签署日期：2026年2月13日 | 适用法律：中华人民共和国法律</p>
          </div>
        </div>
      \`;
    }
    
    // 高亮数值
    function highlightValues(text) {
      return text
        .replace(/\\$\\{([^}]+)\\}/g, '<span class="clause-value">【$1】</span>')
        .replace(/(\\d+(?:,\\d{3})*(?:\\.\\d+)?(?:万元|元|%|日|个月|张))/g, '<span class="clause-value">$1</span>');
    }
    
    // 滚动到章节
    function scrollToSection(sectionId) {
      const el = document.getElementById('section-' + sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 更新目录高亮
        document.querySelectorAll('.toc-item').forEach(item => item.classList.remove('active'));
        document.querySelector(\`.toc-item[onclick*="\${sectionId}"]\`)?.classList.add('active');
      }
    }
    
    // 发送消息
    async function sendMessage() {
      const input = document.getElementById('messageInput');
      const message = input.value.trim();
      if (!message) return;
      
      input.value = '';
      addMessage('user', message);
      chatHistory.push({ role: 'user', content: message });
      
      const loadingId = addLoadingMessage();
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history: chatHistory.slice(-10) })
        });
        
        removeLoadingMessage(loadingId);
        if (!response.ok) throw new Error('API error');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        const messageId = addMessage('assistant', '');
        const contentEl = document.getElementById('msg-content-' + messageId);
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullResponse += chunk;
          const displayText = fullResponse.replace(/<<<HIGHLIGHT>>>.*<<<END>>>/s, '');
          contentEl.innerHTML = formatMarkdown(displayText);
        }
        
        parseHighlights(fullResponse);
        chatHistory.push({ role: 'assistant', content: fullResponse });
        scrollToBottom();
        
      } catch (e) {
        removeLoadingMessage(loadingId);
        addMessage('assistant', '抱歉，处理请求时出现错误，请稍后重试。');
      }
    }
    
    function parseHighlights(response) {
      const match = response.match(/<<<HIGHLIGHT>>>(.*?)<<<END>>>/s);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          currentHighlights = data.modules || [];
          currentSuggestions = data.suggestions || [];
          
          renderContractModules();
          if (currentView === 'full') renderFullContract();
          
          const badge = document.getElementById('highlightBadge');
          const count = document.getElementById('suggestionCount');
          if (currentSuggestions.length > 0) {
            badge.classList.remove('hidden');
            count.textContent = currentSuggestions.length;
          } else {
            badge.classList.add('hidden');
          }
          
          if (currentHighlights.length > 0) {
            if (currentView === 'card') {
              document.getElementById('module-' + currentHighlights[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              scrollToSection(currentHighlights[0]);
            }
          }
        } catch (e) {}
      }
    }
    
    function showSuggestions(moduleId) {
      const suggestions = currentSuggestions.filter(s => s.moduleId === moduleId);
      const module = contractData?.modules.find(m => m.id === moduleId);
      const section = fullContractData?.sections.find(s => s.id === moduleId);
      const title = module?.title || section?.title || moduleId;
      
      document.getElementById('suggestionContent').innerHTML = \`
        <h4 class="font-semibold text-gray-800 mb-4">\${title} - 修改建议</h4>
        <div class="space-y-4">
          \${suggestions.map(s => \`
            <div class="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h5 class="font-medium text-amber-800 mb-2"><i class="fas fa-pen mr-2"></i>\${s.title}</h5>
              <div class="text-gray-700 text-sm whitespace-pre-wrap bg-white p-3 rounded border border-amber-100">\${s.content}</div>
            </div>
          \`).join('')}
        </div>
      \`;
      document.getElementById('suggestionModal').classList.remove('hidden');
    }
    
    function closeSuggestionModal() {
      document.getElementById('suggestionModal').classList.add('hidden');
    }
    
    // 条款详情相关
    let currentClauseData = null;
    
    function showClauseDetail(sectionId, clauseIdx) {
      const section = fullContractData?.sections.find(s => s.id === sectionId);
      if (!section || !section.clauses[clauseIdx]) return;
      
      const clause = section.clauses[clauseIdx];
      currentClauseData = { sectionId, clauseIdx, section, clause };
      
      const clauseSuggestions = currentSuggestions.filter(s => s.moduleId === sectionId);
      
      document.getElementById('clauseModalTitle').textContent = section.title + ' - 条款 ' + section.number + '.' + (clauseIdx + 1);
      
      document.getElementById('clauseDetailContent').innerHTML = \`
        <div class="space-y-6">
          <!-- 原文 -->
          <div class="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-gray-700 flex items-center">
                <i class="fas fa-file-alt mr-2 text-indigo-500"></i>合同原文
              </h4>
              <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">第\${section.number}章 第\${clauseIdx + 1}条</span>
            </div>
            <p class="text-gray-800 leading-relaxed text-lg">\${highlightValues(clause.text)}</p>
            \${clause.note ? \`
              <div class="mt-4 pl-4 border-l-2 border-indigo-300 bg-indigo-50 py-2">
                <p class="text-sm text-indigo-700"><i class="fas fa-info-circle mr-1"></i> \${clause.note}</p>
              </div>
            \` : ''}
          </div>
          
          <!-- 关键参数提取 -->
          <div class="bg-purple-50 rounded-lg p-5 border border-purple-200">
            <h4 class="font-semibold text-purple-700 mb-3 flex items-center">
              <i class="fas fa-key mr-2"></i>关键参数
            </h4>
            <div class="flex flex-wrap gap-2" id="clauseKeyParams"></div>
          </div>
          
          <!-- 修改建议（如有） -->
          \${clauseSuggestions.length > 0 ? \`
            <div class="clause-suggestion-inline">
              <h4 class="font-semibold text-amber-700 mb-3 flex items-center">
                <i class="fas fa-lightbulb mr-2"></i>AI修改建议 (\${clauseSuggestions.length}条)
              </h4>
              <div class="space-y-3">
                \${clauseSuggestions.map(s => \`
                  <div class="bg-white rounded-lg p-4 border border-amber-200">
                    <h5 class="font-medium text-amber-800 mb-2">\${s.title}</h5>
                    <p class="text-gray-700 text-sm whitespace-pre-wrap">\${s.content}</p>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : ''}
          
          <!-- 风险提示 -->
          <div class="bg-red-50 rounded-lg p-5 border border-red-200">
            <h4 class="font-semibold text-red-700 mb-3 flex items-center">
              <i class="fas fa-exclamation-triangle mr-2"></i>投资人视角风险点
            </h4>
            <div id="clauseRisks" class="text-gray-700 text-sm"></div>
          </div>
          
          <!-- 快速操作 -->
          <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button onclick="askAboutClause()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
              <i class="fas fa-comments mr-2"></i>向AI咨询此条款
            </button>
            <button onclick="requestModification()" class="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center">
              <i class="fas fa-edit mr-2"></i>请求修改建议
            </button>
            <button onclick="copyClauseText()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center">
              <i class="fas fa-copy mr-2"></i>复制条款
            </button>
          </div>
        </div>
      \`;
      
      // 提取关键参数
      const params = extractKeyParams(clause.text);
      document.getElementById('clauseKeyParams').innerHTML = params.map(p => 
        \`<span class="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">\${p}</span>\`
      ).join('');
      
      // 获取风险提示
      const module = contractData?.modules.find(m => m.id === sectionId);
      document.getElementById('clauseRisks').innerHTML = module?.risks || '暂无特别风险提示';
      
      document.getElementById('clauseDetailModal').classList.remove('hidden');
    }
    
    function closeClauseDetailModal() {
      document.getElementById('clauseDetailModal').classList.add('hidden');
      currentClauseData = null;
    }
    
    function extractKeyParams(text) {
      const patterns = [
        /(\\d+(?:,\\d{3})*(?:\\.\\d+)?(?:万元|元))/g,
        /(\\d+(?:\\.\\d+)?%)/g,
        /(\\d+(?:个)?(?:自然)?(?:日|天|月|年))/g,
        /(\\d+(?:,\\d+)?张)/g,
        /【([^】]+)】/g
      ];
      const params = new Set();
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) matches.forEach(m => params.add(m.replace(/【|】/g, '')));
      });
      return Array.from(params);
    }
    
    function askAboutClause() {
      if (!currentClauseData) return;
      closeClauseDetailModal();
      const question = \`请分析这个条款的风险和建议："\${currentClauseData.clause.text.substring(0, 100)}..."\`;
      document.getElementById('messageInput').value = question;
      sendMessage();
    }
    
    function requestModification() {
      if (!currentClauseData) return;
      closeClauseDetailModal();
      const question = \`请针对"\${currentClauseData.section.title}"的第\${currentClauseData.clauseIdx + 1}条，从投资人角度提供修改建议\`;
      document.getElementById('messageInput').value = question;
      sendMessage();
    }
    
    function copyClauseText() {
      if (!currentClauseData) return;
      navigator.clipboard.writeText(currentClauseData.clause.text).then(() => {
        alert('条款文本已复制到剪贴板');
      });
    }
    
    let messageCounter = 0;
    function addMessage(role, content) {
      const id = ++messageCounter;
      const container = document.getElementById('chatHistory');
      const isUser = role === 'user';
      
      container.insertAdjacentHTML('beforeend', \`
        <div class="\${isUser ? 'flex justify-end' : ''}">
          <div class="\${isUser ? 'message-user text-white' : 'message-assistant'} rounded-lg p-4 max-w-[90%]">
            <div class="flex items-start">
              \${!isUser ? '<div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0"><i class="fas fa-robot text-indigo-600"></i></div>' : ''}
              <div id="msg-content-\${id}" class="\${isUser ? '' : 'markdown-content'}">\${formatMarkdown(content)}</div>
              \${isUser ? '<div class="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center ml-3 flex-shrink-0"><i class="fas fa-user"></i></div>' : ''}
            </div>
          </div>
        </div>
      \`);
      scrollToBottom();
      return id;
    }
    
    function addLoadingMessage() {
      const id = 'loading-' + Date.now();
      document.getElementById('chatHistory').insertAdjacentHTML('beforeend', \`
        <div id="\${id}"><div class="message-assistant rounded-lg p-4 max-w-[90%]">
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0"><i class="fas fa-robot text-indigo-600"></i></div>
            <div class="typing-indicator text-gray-500"><span>●</span><span>●</span><span>●</span></div>
          </div>
        </div></div>
      \`);
      scrollToBottom();
      return id;
    }
    
    function removeLoadingMessage(id) {
      document.getElementById(id)?.remove();
    }
    
    function formatMarkdown(text) {
      if (!text) return '';
      return text
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
        .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\\n/g, '<br>');
    }
    
    function scrollToBottom() {
      const container = document.getElementById('chatHistory');
      container.scrollTop = container.scrollHeight;
    }
    
    function quickAsk(question) {
      document.getElementById('messageInput').value = question;
      sendMessage();
    }
    
    loadContract();
  </script>
</body>
</html>`)
})

export default app
