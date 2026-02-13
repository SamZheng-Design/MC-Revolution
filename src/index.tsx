import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { industryTemplates, templateList } from './templates'

type Bindings = {
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// 获取行业模板列表
app.get('/api/templates', (c) => {
  return c.json(templateList.map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    description: t.description,
    color: t.color
  })))
})

// 获取指定模板详情
app.get('/api/templates/:id', (c) => {
  const id = c.req.param('id')
  const template = industryTemplates[id]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }
  return c.json(template)
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
      // 尝试提取JSON
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

// 主页面
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
    /* 页面切换 */
    .page { display: none; }
    .page.active { display: flex; }
    
    /* 项目卡片 */
    .project-card { transition: all 0.3s; }
    .project-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
    
    /* 模板卡片 */
    .template-card { transition: all 0.3s; cursor: pointer; }
    .template-card:hover { transform: scale(1.02); }
    .template-card.selected { ring: 2px; ring-color: #6366f1; }
    
    /* 协商记录 */
    .negotiation-item { transition: all 0.2s; }
    .negotiation-item:hover { background: #f9fafb; }
    
    /* 合同模块 */
    .module-card { transition: all 0.3s; }
    .module-card.has-changes { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); }
    
    /* 变更标记 */
    .change-badge { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .value-changed {
      background: linear-gradient(120deg, #10b981 0%, #059669 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    .value-old {
      text-decoration: line-through;
      color: #9ca3af;
      font-size: 0.9em;
    }
    
    /* 视角切换 */
    .perspective-badge {
      transition: all 0.3s;
    }
    .perspective-investor { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
    .perspective-borrower { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    
    /* 合同条款 */
    .contract-section { scroll-margin-top: 80px; }
    .contract-section.has-changes { 
      background: linear-gradient(90deg, #ecfdf5 0%, transparent 100%); 
      border-left: 4px solid #10b981;
    }
    .clause-param {
      background: linear-gradient(120deg, #a78bfa 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    .clause-param-changed {
      background: linear-gradient(120deg, #10b981 0%, #059669 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    
    /* 动画 */
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-in { animation: slideIn 0.3s ease-out; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  
  <!-- ==================== 页面1: 项目列表 ==================== -->
  <div id="pageProjects" class="page active flex-col min-h-screen">
    <!-- 顶部导航 -->
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
        <button onclick="showNewProjectModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
          <i class="fas fa-plus mr-2"></i>新建项目
        </button>
      </div>
    </nav>
    
    <!-- 项目列表 -->
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
                <p class="text-sm text-gray-500">已完成</p>
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
        
        <!-- 项目网格 -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">我的项目</h2>
          <div class="flex items-center space-x-2">
            <select class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" onchange="filterProjects(this.value)">
              <option value="all">全部状态</option>
              <option value="negotiating">协商中</option>
              <option value="completed">已完成</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>
        
        <div id="projectGrid" class="grid grid-cols-3 gap-4">
          <!-- 项目卡片将在这里渲染 -->
        </div>
        
        <!-- 空状态 -->
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
    <!-- 顶部导航 -->
    <nav class="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button onclick="goToProjects()" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-arrow-left text-gray-600"></i>
          </button>
          <div>
            <h1 class="font-semibold text-gray-900" id="projectTitle">项目名称</h1>
            <p class="text-xs text-gray-500"><span id="projectIndustry">行业</span> · <span id="projectDate">创建时间</span></p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <!-- 视角切换 -->
          <div class="flex items-center bg-gray-100 rounded-lg p-1">
            <button onclick="switchPerspective('investor')" id="btnInvestor" class="perspective-badge px-3 py-1.5 rounded-md text-sm font-medium text-white perspective-investor">
              <i class="fas fa-landmark mr-1"></i>投资方
            </button>
            <button onclick="switchPerspective('borrower')" id="btnBorrower" class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600">
              <i class="fas fa-store mr-1"></i>融资方
            </button>
          </div>
          <button onclick="saveProject()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center">
            <i class="fas fa-save mr-2"></i>保存
          </button>
          <button onclick="exportContract()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center">
            <i class="fas fa-download mr-2"></i>导出
          </button>
        </div>
      </div>
    </nav>
    
    <!-- 主体内容 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧：协商面板 -->
      <div class="w-2/5 border-r border-gray-200 flex flex-col bg-white">
        <!-- 输入区 -->
        <div class="p-4 border-b border-gray-100">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-comment-dots mr-1 text-indigo-600"></i>
            描述条款变动
          </label>
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
            <button onclick="submitNegotiation()" id="btnSubmit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
              <i class="fas fa-paper-plane mr-2"></i>发送
            </button>
          </div>
        </div>
        
        <!-- 协商历史 -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-700 flex items-center">
              <i class="fas fa-history mr-2 text-gray-400"></i>
              协商记录
              <span id="negotiationCount" class="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">0</span>
            </h3>
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
        <!-- 视图切换 -->
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
        
        <!-- 卡片视图 -->
        <div id="cardView" class="flex-1 overflow-y-auto p-4">
          <div id="moduleCards" class="grid grid-cols-1 gap-4"></div>
        </div>
        
        <!-- 完整合同视图 -->
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
  
  <!-- ==================== 新建项目弹窗 ==================== -->
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
        <!-- 项目名称 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
          <input type="text" id="newProjectName" placeholder="例如：XX品牌杭州旗舰店" 
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        
        <!-- 选择行业 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">选择行业模板</label>
          <div id="templateGrid" class="grid grid-cols-2 gap-3">
            <!-- 模板卡片将在这里渲染 -->
          </div>
        </div>
        
        <!-- 备注 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
          <textarea id="newProjectNote" rows="2" placeholder="项目背景、特殊要求等..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
        </div>
      </div>
      
      <div class="p-6 border-t border-gray-100 flex justify-end space-x-3">
        <button onclick="hideNewProjectModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          取消
        </button>
        <button onclick="createProject()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <i class="fas fa-plus mr-2"></i>创建项目
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
    let currentPerspective = 'investor'; // investor | borrower
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
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
    
    // ==================== 项目列表页 ====================
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
        const statusColors = {
          draft: 'bg-gray-100 text-gray-600',
          negotiating: 'bg-amber-100 text-amber-700',
          completed: 'bg-emerald-100 text-emerald-700'
        };
        const statusText = { draft: '草稿', negotiating: '协商中', completed: '已完成' };
        const changeCount = p.negotiations?.length || 0;
        
        return \`
          <div class="project-card bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" onclick="openProject('\${p.id}')">
            <div class="flex items-start justify-between mb-3">
              <div class="w-12 h-12 rounded-xl bg-\${template.color || 'gray'}-100 flex items-center justify-center">
                <i class="fas \${template.icon || 'fa-folder'} text-\${template.color || 'gray'}-600 text-xl"></i>
              </div>
              <span class="px-2 py-1 rounded-full text-xs \${statusColors[p.status] || statusColors.draft}">
                \${statusText[p.status] || '草稿'}
              </span>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">\${p.name}</h3>
            <p class="text-sm text-gray-500 mb-3">\${template.name || '未知行业'}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span><i class="fas fa-comments mr-1"></i>\${changeCount}次协商</span>
              <span>\${formatDate(p.updatedAt)}</span>
            </div>
          </div>
        \`;
      }).join('');
    }
    
    function updateStats() {
      document.getElementById('statTotal').textContent = projects.length;
      document.getElementById('statNegotiating').textContent = projects.filter(p => p.status === 'negotiating').length;
      document.getElementById('statCompleted').textContent = projects.filter(p => p.status === 'completed').length;
      
      const totalAmount = projects.reduce((sum, p) => {
        const amount = parseFloat((p.params?.investmentAmount || '0').replace(/[^0-9.]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      document.getElementById('statAmount').textContent = '¥' + totalAmount.toLocaleString() + '万';
    }
    
    function filterProjects(status) {
      // 简单过滤，可以扩展
      renderProjects();
    }
    
    // ==================== 新建项目 ====================
    function showNewProjectModal() {
      document.getElementById('newProjectModal').classList.remove('hidden');
      document.getElementById('newProjectName').value = '';
      document.getElementById('newProjectNote').value = '';
      selectedTemplateId = null;
      renderTemplateGrid();
    }
    
    function hideNewProjectModal() {
      document.getElementById('newProjectModal').classList.add('hidden');
    }
    
    function renderTemplateGrid() {
      const grid = document.getElementById('templateGrid');
      grid.innerHTML = templates.map(t => \`
        <div class="template-card p-4 border-2 rounded-xl \${selectedTemplateId === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}" 
             onclick="selectTemplate('\${t.id}')">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-lg bg-\${t.color}-100 flex items-center justify-center">
              <i class="fas \${t.icon} text-\${t.color}-600"></i>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">\${t.name}</h4>
              <p class="text-xs text-gray-500">\${t.description}</p>
            </div>
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
      
      if (!name) {
        alert('请输入项目名称');
        return;
      }
      if (!selectedTemplateId) {
        alert('请选择行业模板');
        return;
      }
      
      // 获取模板详情
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      projects.unshift(project);
      saveProjects();
      hideNewProjectModal();
      renderProjects();
      updateStats();
      
      // 直接打开项目
      openProject(project.id);
    }
    
    // ==================== 项目协商页 ====================
    async function openProject(id) {
      const project = projects.find(p => p.id === id);
      if (!project) return;
      
      currentProject = project;
      
      // 加载模板
      const res = await fetch('/api/templates/' + project.templateId);
      currentProject.template = await res.json();
      
      // 切换页面
      document.getElementById('pageProjects').classList.remove('active');
      document.getElementById('pageNegotiation').classList.add('active');
      
      // 更新UI
      document.getElementById('projectTitle').textContent = project.name;
      document.getElementById('projectIndustry').textContent = currentProject.template.name;
      document.getElementById('projectDate').textContent = formatDate(project.createdAt);
      
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
    
    // 视角切换
    function switchPerspective(p) {
      currentPerspective = p;
      document.getElementById('btnInvestor').className = p === 'investor' 
        ? 'perspective-badge px-3 py-1.5 rounded-md text-sm font-medium text-white perspective-investor'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
      document.getElementById('btnBorrower').className = p === 'borrower'
        ? 'perspective-badge px-3 py-1.5 rounded-md text-sm font-medium text-white perspective-borrower'
        : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600';
    }
    
    // 合同视图切换
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
    
    // 提交协商
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
          // 记录协商
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
          
          // 应用变更
          for (const change of result.changes) {
            currentProject.params[change.paramKey] = change.newValue;
          }
          
          currentProject.updatedAt = new Date().toISOString();
          saveProjects();
          
          // 更新UI
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
      const input = document.getElementById('negotiationInput');
      input.value = text;
      input.focus();
    }
    
    // 渲染协商历史
    function renderNegotiationHistory() {
      const container = document.getElementById('negotiationHistory');
      const negotiations = currentProject?.negotiations || [];
      
      document.getElementById('negotiationCount').textContent = negotiations.length;
      
      if (negotiations.length === 0) {
        container.innerHTML = \`
          <div class="text-center text-gray-400 py-8">
            <i class="fas fa-comments text-4xl mb-3 opacity-50"></i>
            <p class="text-sm">开始协商</p>
          </div>
        \`;
        return;
      }
      
      container.innerHTML = negotiations.slice().reverse().map((n, i) => {
        const perspectiveIcon = n.perspective === 'investor' ? 'fa-landmark' : 'fa-store';
        const perspectiveColor = n.perspective === 'investor' ? 'indigo' : 'amber';
        const perspectiveText = n.perspective === 'investor' ? '投资方' : '融资方';
        
        return \`
          <div class="negotiation-item bg-gray-50 rounded-xl p-4 animate-in">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-\${perspectiveColor}-100 flex items-center justify-center">
                  <i class="fas \${perspectiveIcon} text-\${perspectiveColor}-600 text-xs"></i>
                </span>
                <span class="text-xs text-\${perspectiveColor}-600 font-medium">\${perspectiveText}</span>
                <span class="change-badge">#\${negotiations.length - i}</span>
              </div>
              <span class="text-xs text-gray-400">\${formatTime(n.timestamp)}</span>
            </div>
            <p class="text-sm text-gray-800 mb-2">"\${n.input}"</p>
            <div class="space-y-2">
              \${n.changes.map(c => \`
                <div class="bg-white rounded-lg p-2 border border-gray-100">
                  <div class="flex items-center text-xs text-gray-500 mb-1">
                    <i class="fas fa-folder-open mr-1"></i>\${c.moduleName}
                  </div>
                  <div class="flex items-center text-sm">
                    <span class="text-gray-600">\${c.paramName}:</span>
                    <span class="value-old ml-2">\${c.oldValue}</span>
                    <i class="fas fa-arrow-right mx-2 text-emerald-500 text-xs"></i>
                    <span class="value-changed">\${c.newValue}</span>
                  </div>
                </div>
              \`).join('')}
              \${n.suggestion ? \`
                <div class="bg-amber-50 rounded-lg p-2 border border-amber-100">
                  <p class="text-xs text-amber-700"><i class="fas fa-lightbulb mr-1"></i>\${n.suggestion}</p>
                </div>
              \` : ''}
            </div>
          </div>
        \`;
      }).join('');
    }
    
    // 渲染模块卡片
    function renderModuleCards() {
      if (!currentProject?.template) return;
      
      const container = document.getElementById('moduleCards');
      const template = currentProject.template;
      const params = currentProject.params;
      const negotiations = currentProject.negotiations || [];
      
      // 构建变更映射
      const changeMap = {};
      negotiations.forEach((n, idx) => {
        n.changes.forEach(c => {
          changeMap[c.paramKey] = { ...c, negotiationIndex: idx + 1 };
        });
      });
      
      const colorMap = {
        purple: 'purple', orange: 'orange', blue: 'blue', 
        pink: 'pink', green: 'green', indigo: 'indigo',
        emerald: 'emerald', amber: 'amber', cyan: 'cyan', red: 'red', teal: 'teal'
      };
      
      container.innerHTML = template.modules.map(module => {
        const moduleChanges = module.clauses.filter(c => changeMap[c.key]);
        const hasChanges = moduleChanges.length > 0;
        const color = colorMap[module.icon?.includes('coins') ? 'indigo' : 
                              module.icon?.includes('chart') ? 'emerald' :
                              module.icon?.includes('user') ? 'rose' : 
                              module.icon?.includes('ticket') ? 'cyan' :
                              module.icon?.includes('gavel') ? 'red' : 'gray'] || 'gray';
        
        return \`
          <div class="module-card bg-white rounded-xl p-5 border-2 \${hasChanges ? 'has-changes border-emerald-300' : 'border-gray-100'}">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-xl bg-\${color}-100 flex items-center justify-center mr-3">
                  <i class="fas \${module.icon} text-\${color}-600 text-xl"></i>
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
                      <span class="font-semibold text-\${color}-600">\${currentValue}</span>
                    </div>
                  \`;
                }
              }).join('')}
            </div>
            \${module.risks ? \`
              <div class="mt-4 p-3 bg-red-50 rounded-lg">
                <p class="text-xs text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i>\${module.risks}</p>
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }
    
    // 渲染完整合同
    function renderContractText() {
      if (!currentProject?.template) return;
      
      const tocContainer = document.getElementById('contractToc');
      const textContainer = document.getElementById('contractText');
      const template = currentProject.template;
      const params = currentProject.params;
      const negotiations = currentProject.negotiations || [];
      
      // 变更映射
      const changeMap = {};
      negotiations.forEach((n, idx) => {
        n.changes.forEach(c => {
          changeMap[c.paramKey] = { ...c, negotiationIndex: idx + 1 };
        });
      });
      
      // 检查章节是否有变更
      const sectionHasChanges = (section) => {
        return section.clauses.some(c => c.keys?.some(k => changeMap[k]));
      };
      
      // 渲染目录
      tocContainer.innerHTML = template.fullText.map(section => \`
        <div class="px-3 py-2 rounded-lg cursor-pointer text-sm hover:bg-gray-100 \${sectionHasChanges(section) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'}"
             onclick="document.getElementById('section-\${section.id}').scrollIntoView({behavior:'smooth'})">
          \${section.number}. \${section.title}
          \${sectionHasChanges(section) ? '<i class="fas fa-check-circle ml-1 text-emerald-500"></i>' : ''}
        </div>
      \`).join('');
      
      // 渲染正文
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
                  // 替换参数
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
          <p class="mt-2">本协议一式两份，双方各执一份，具有同等法律效力</p>
        </div>
      \`;
    }
    
    function updateChangedBadge() {
      const negotiations = currentProject?.negotiations || [];
      const totalChanges = negotiations.reduce((sum, n) => sum + n.changes.length, 0);
      
      const badge = document.getElementById('changedBadge');
      const count = document.getElementById('changedCount');
      
      if (totalChanges > 0) {
        badge.classList.remove('hidden');
        count.textContent = totalChanges;
      } else {
        badge.classList.add('hidden');
      }
    }
    
    // 保存项目
    function saveProject() {
      if (!currentProject) return;
      currentProject.updatedAt = new Date().toISOString();
      saveProjects();
      
      // 显示保存成功提示
      const btn = event.target;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check mr-2"></i>已保存';
      btn.classList.remove('bg-emerald-600');
      btn.classList.add('bg-green-500');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.add('bg-emerald-600');
        btn.classList.remove('bg-green-500');
      }, 1500);
    }
    
    function exportContract() {
      alert('导出功能开发中...');
    }
    
    // ==================== 工具函数 ====================
    function saveProjects() {
      localStorage.setItem('rbf_projects', JSON.stringify(projects));
    }
    
    function formatDate(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
    
    function formatTime(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 启动
    init();
  </script>
</body>
</html>`)
})

export default app
