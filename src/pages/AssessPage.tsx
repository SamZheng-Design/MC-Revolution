import type { FC } from 'hono/jsx'
import { Navbar } from '../components/Navbar'

// =====================================================
// 评估通 — AssessPage（重构版）
//
// 功能：
//   1. 平台数据库入口 → 调用 /api/dgt/deals（代理至 dgt:3000）
//      - 未登录显示提示，不直接拿数据
//      - （后续可接入 identity 模块做真实鉴权）
//   2. 文件上传入口 → 解析文件 → POST /api/dgt/deals 创建临时标的 → 送入评估流程
//   3. 评估引擎 → 调用 /api/dgt/ai/evaluate（代理至 dgt:3000 多智能体工作流）
//
// UI 风格：
//   - 与 dgt-intelligence-platform 保持一致的美拉德绿色主题
//   - 外层包裹 L1 Navbar 保持导航一致性
// =====================================================

export const AssessPage: FC = () => {
  return (
    <div class="min-h-screen" style="background: #F2EFE8;">
      <Navbar active="" />

      {/* ── 页面样式 ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');

        .assess-root { font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif; }

        :root {
          --primary-50:  #F0F5F1;
          --primary-100: #D6E8DB;
          --primary-200: #B0D0BC;
          --primary-300: #80B492;
          --primary-400: #6A9B7B;
          --primary-500: #5A7A64;
          --primary-600: #4A6854;
          --primary-700: #3A5444;
          --primary-800: #2A4034;
          --primary-900: #1E3027;
          --warm-50:  #FAF8F2;
          --warm-100: #F5F2EA;
          --warm-200: #EDE8DC;
          --warm-300: #DDD5C4;
          --warm-bg:  #F2EFE8;
          --card-bg:  #FFFFFF;
          --border:   #D8D0C4;
        }
        .gs-bg    { background: var(--warm-bg); }
        .gs-card  { background: var(--card-bg); border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04); }
        .card-shadow { box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04); }
        .gradient-bg { background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%); }

        .btn-primary {
          background: linear-gradient(to right, var(--primary-500), var(--primary-600));
          color: #fff;
          border-radius: 0.5rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: opacity 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .track-filter-btn.active {
          background: var(--primary-500);
          color: #fff;
          border-color: var(--primary-500);
        }
        .deal-card.selected {
          border-color: var(--primary-500) !important;
          background: var(--primary-50) !important;
        }
        .deal-card.selected .deal-check { display: flex !important; }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .reasoning-text p { margin-bottom: 0.75rem; }
        .reasoning-text strong { font-weight: 600; }

        /* 进度动画 */
        @keyframes pulse-ring { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        .animate-pulse { animation: pulse-ring 2s infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fa-spin { animation: spin 1s linear infinite; }

        /* Toast */
        #assess-toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
        .toast-item { padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; box-shadow: 0 4px 6px rgba(0,0,0,.1); min-width: 200px; max-width: 360px; display: flex; align-items: center; gap: 0.5rem; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .rotate-180 { transform: rotate(180deg); }
      `}</style>

      {/* ── Toast 容器 ── */}
      <div id="assess-toast-container"></div>

      {/* ── 主内容 ── */}
      <div class="assess-root gs-bg min-h-screen pt-6 pb-12">
        <div class="max-w-7xl mx-auto px-4">

          {/* ── 页面标题 ── */}
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4 shadow-lg">
                <i class="fas fa-clipboard-check text-white text-xl"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-slate-800">Assess Connect · 评估通</h1>
                <p class="text-gray-500 text-sm">多智能体协作评估流程 · 实时推理过程可视化 · AI辅助投资决策</p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button onclick="toggleAllDetails()" class="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm border border-gray-200 card-shadow">
                <i class="fas fa-eye mr-2"></i><span id="toggle-all-text">展开全部</span>
              </button>
              <button onclick="resetEvaluation()" class="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm border border-gray-200 card-shadow">
                <i class="fas fa-redo mr-2"></i>重置
              </button>
              <button onclick="startEvaluation()" id="btn-start" class="btn-primary shadow-md">
                <i class="fas fa-play"></i>开始评估
              </button>
            </div>
          </div>

          {/* ── 统计概览 ── */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="gs-card p-4 flex items-center space-x-4">
              <div class="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <i class="fas fa-robot text-violet-500"></i>
              </div>
              <div>
                <p class="text-xs text-slate-500">智能体数量</p>
                <p class="text-xl font-bold text-slate-800" id="stat-agent-count">-</p>
              </div>
            </div>
            <div class="gs-card p-4 flex items-center space-x-4">
              <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <i class="fas fa-layer-group text-blue-500"></i>
              </div>
              <div>
                <p class="text-xs text-slate-500">待评估标的</p>
                <p class="text-xl font-bold text-slate-800" id="stat-pending-deals">-</p>
              </div>
            </div>
            <div class="gs-card p-4 flex items-center space-x-4">
              <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <i class="fas fa-check-circle text-emerald-500"></i>
              </div>
              <div>
                <p class="text-xs text-slate-500">今日通过</p>
                <p class="text-xl font-bold text-emerald-600" id="stat-today-passed">-</p>
              </div>
            </div>
            <div class="gs-card p-4 flex items-center space-x-4">
              <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <i class="fas fa-clock text-amber-500"></i>
              </div>
              <div>
                <p class="text-xs text-slate-500">平均耗时</p>
                <p class="text-xl font-bold text-slate-800" id="stat-avg-time">~2.5分</p>
              </div>
            </div>
          </div>

          {/* ── 数据来源选择器 ── */}
          <div class="gs-card p-6 mb-6 card-shadow">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-semibold text-lg flex items-center text-slate-800">
                <i class="fas fa-database mr-2" style="color: var(--primary-500)"></i>
                选择评估数据来源
              </h3>
              <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button id="tab-db" onclick="switchInputTab('db')"
                  class="px-4 py-2 font-medium transition"
                  style="background: var(--primary-500); color: white;">
                  <i class="fas fa-layer-group mr-1.5"></i>平台标的库
                </button>
                <button id="tab-upload" onclick="switchInputTab('upload')"
                  class="px-4 py-2 font-medium transition bg-white text-gray-500 hover:bg-gray-50">
                  <i class="fas fa-file-upload mr-1.5"></i>上传文件
                </button>
              </div>
            </div>

            {/* ── 平台标的库 Panel ── */}
            <div id="panel-db">
              {/* 未登录提示（默认显示；登录后通过 JS 隐藏） */}
              <div id="login-notice" class="hidden mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <i class="fas fa-lock text-amber-500 mt-0.5 flex-shrink-0"></i>
                <div>
                  <p class="text-sm font-semibold text-amber-800">请先登录查看您的项目</p>
                  <p class="text-xs text-amber-600 mt-1">平台标的库展示您名下的融资申请项目，需通过身份通验证后方可访问。</p>
                  <a href="/identity" class="inline-flex items-center mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style="background: var(--primary-500)">
                    <i class="fas fa-sign-in-alt mr-1.5"></i>前往登录
                  </a>
                </div>
              </div>

              <div class="flex items-center justify-between mb-3">
                <p class="text-xs text-gray-400">从平台数据库选择已申请的融资标的（用户登录后显示对应项目）</p>
                <span id="deals-count" class="text-xs text-gray-400">加载中...</span>
              </div>

              {/* 赛道过滤器 */}
              <div class="flex flex-wrap gap-2 mb-4">
                <button onclick="filterDeals('all')" class="track-filter-btn active px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="all">
                  <i class="fas fa-globe mr-1"></i>全部
                </button>
                <button onclick="filterDeals('light-asset')" class="track-filter-btn px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="light-asset">
                  <i class="fas fa-star mr-1"></i>文娱轻资产
                </button>
                <button onclick="filterDeals('douyin-ecommerce')" class="track-filter-btn px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="douyin-ecommerce">
                  <i class="fas fa-video mr-1"></i>抖音投流
                </button>
                <button onclick="filterDeals('catering')" class="track-filter-btn px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="catering">
                  <i class="fas fa-utensils mr-1"></i>餐饮
                </button>
                <button onclick="filterDeals('retail')" class="track-filter-btn px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="retail">
                  <i class="fas fa-shopping-cart mr-1"></i>零售
                </button>
                <button onclick="filterDeals('ecommerce')" class="track-filter-btn px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="ecommerce">
                  <i class="fas fa-shopping-bag mr-1"></i>电商
                </button>
                <button onclick="filterDeals('service')" class="track-filter-btn px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="service">
                  <i class="fas fa-concierge-bell mr-1"></i>生活服务
                </button>
                <button onclick="filterDeals('education')" class="track-filter-btn px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-gray-400 transition" data-track="education">
                  <i class="fas fa-graduation-cap mr-1"></i>教育培训
                </button>
              </div>

              {/* 标的列表 */}
              <div id="deals-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                <div class="text-center py-8 text-gray-400">
                  <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>加载标的列表中...</p>
                </div>
              </div>
            </div>{/* end panel-db */}

            {/* ── 上传文件 Panel ── */}
            <div id="panel-upload" class="hidden">
              <p class="text-xs text-gray-400 mb-4">上传项目材料（PDF / Excel / TXT / Word），系统自动解析内容并创建临时标的送入评估流程</p>

              <div id="upload-zone"
                class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all"
                ondragover="event.preventDefault(); this.style.borderColor='#5A7A64'; this.style.background='rgba(90,122,100,0.04)'"
                ondragleave="this.style.borderColor=''; this.style.background=''"
                ondrop="handleFileDrop(event)"
                onclick="document.getElementById('file-input').click()">
                <input type="file" id="file-input" class="hidden" accept=".pdf,.xlsx,.xls,.txt,.doc,.docx,.csv"
                  onchange="handleFileSelect(event)" multiple />
                <i class="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-3"></i>
                <p class="text-sm font-medium text-gray-600">拖拽文件到此处，或点击选择文件</p>
                <p class="text-xs text-gray-400 mt-1">支持 PDF · Excel · TXT · Word · CSV，单文件最大 10MB</p>
              </div>

              <div id="file-list" class="mt-4 space-y-2 hidden"></div>

              <div id="upload-meta-form" class="hidden mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-medium text-gray-500 block mb-1">企业名称 <span class="text-red-400">*</span></label>
                  <input id="upload-company-name" type="text" placeholder="从文件中识别或手动输入"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-amber-50" style="--tw-ring-color: var(--primary-500);" />
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 block mb-1">行业分类</label>
                  <select id="upload-industry"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-amber-50">
                    <option value="catering">餐饮</option>
                    <option value="retail">零售</option>
                    <option value="service">生活服务</option>
                    <option value="entertainment">文娱</option>
                    <option value="light-asset">轻资产</option>
                    <option value="ecommerce">电商</option>
                    <option value="education">教育培训</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 block mb-1">融资金额（万元）</label>
                  <input id="upload-funding" type="number" placeholder="例: 50"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-amber-50" />
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 block mb-1">联系人</label>
                  <input id="upload-contact" type="text" placeholder="项目负责人姓名"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-amber-50" />
                </div>
                <div class="col-span-2">
                  <label class="text-xs font-medium text-gray-500 block mb-1">业务简介（可从文件自动提取）</label>
                  <textarea id="upload-business" rows={3} placeholder="主要业务描述、商业模式、盈利方式..."
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-amber-50 resize-none"></textarea>
                </div>
              </div>

              <div id="upload-parse-status" class="hidden mt-3 p-3 rounded-lg text-sm flex items-center gap-2"></div>

              <button id="btn-create-from-upload" onclick="createDealFromUpload()"
                class="hidden mt-4 w-full py-2.5 btn-primary justify-center shadow-md">
                <i class="fas fa-plus-circle"></i>创建标的并开始评估
              </button>
            </div>{/* end panel-upload */}
          </div>

          {/* ── 步骤指示器 ── */}
          <div class="gs-card p-5 mb-6 card-shadow">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center space-x-3 flex-wrap gap-y-2">
                <div id="step-1" class="flex items-center space-x-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style="background: var(--primary-500)">1</div>
                  <span class="font-medium" style="color: var(--primary-500)">项目材料</span>
                </div>
                <div class="w-12 h-0.5 bg-gray-200" id="line-1"></div>
                <div id="step-2" class="flex items-center space-x-2 opacity-50">
                  <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">2</div>
                  <span class="font-medium text-gray-600">外环漏斗</span>
                </div>
                <div class="w-12 h-0.5 bg-gray-200" id="line-2"></div>
                <div id="step-3" class="flex items-center space-x-2 opacity-50">
                  <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">3</div>
                  <span class="font-medium text-gray-600">中环筛子</span>
                </div>
                <div class="w-12 h-0.5 bg-gray-200" id="line-3"></div>
                <div id="step-4" class="flex items-center space-x-2 opacity-50">
                  <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">4</div>
                  <span class="font-medium text-gray-600">综合评分</span>
                </div>
              </div>
              <div id="overall-status" class="text-sm text-gray-500 font-medium">准备就绪</div>
            </div>
          </div>

          {/* ── 主内容区 ── */}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 左侧：项目信息 */}
            <div class="lg:col-span-1">
              <div class="gs-card overflow-hidden card-shadow sticky top-6">
                <div id="deal-header" class="gradient-bg p-4 text-white">
                  <div class="flex items-center space-x-3">
                    <div id="deal-avatar" class="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center" style="background: rgba(255,255,255,0.2)">
                      <i class="fas fa-building text-white opacity-80"></i>
                    </div>
                    <div>
                      <h3 id="deal-name" class="font-bold">请选择标的</h3>
                      <p id="deal-sub" class="text-sm opacity-80">从上方列表选择要评估的项目</p>
                    </div>
                  </div>
                </div>
                <div class="p-4">
                  <div id="deal-info" class="space-y-3 text-sm">
                    <div class="text-center py-8 text-gray-400">
                      <i class="fas fa-hand-pointer text-4xl mb-2"></i>
                      <p class="text-sm">请先从上方选择标的</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：评估流程 */}
            <div class="lg:col-span-2 space-y-6">

              {/* 外环漏斗体系 */}
              <div id="outer-section" class="gs-card p-5 card-shadow opacity-40 border-2 border-dashed border-gray-200 transition-all duration-500">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold text-gray-800 flex items-center">
                    <i class="fas fa-funnel-dollar mr-2 text-red-500"></i>
                    外环漏斗体系
                    <span id="outer-step-badge" class="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">第1步</span>
                  </h3>
                  <div id="outer-status" class="text-sm text-gray-500 flex items-center">
                    <i class="fas fa-clock mr-1"></i>等待开始
                  </div>
                </div>
                <p class="text-xs text-gray-400 mb-4">串行执行 · 一票否决机制 · 确保基础合规</p>
                <div id="outer-agents" class="space-y-3">
                  <div class="text-center py-6 text-gray-400">
                    <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                    <p class="text-sm">加载智能体中...</p>
                  </div>
                </div>
              </div>

              {/* 中环筛子体系 */}
              <div id="inner-section" class="gs-card p-5 card-shadow opacity-40 border-2 border-dashed border-gray-200 transition-all duration-500">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold text-gray-800 flex items-center">
                    <i class="fas fa-filter mr-2 text-violet-500"></i>
                    中环筛子体系
                    <span id="inner-step-badge" class="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">第2步</span>
                  </h3>
                  <div id="inner-status" class="text-sm text-gray-400 flex items-center">
                    <i class="fas fa-lock mr-1"></i>等待外环漏斗体系完成
                  </div>
                </div>
                <p class="text-xs text-gray-400 mb-1">并行执行 · 赛道专属智能体 · 深度量化评分</p>
                <p class="text-xs mb-4" id="inner-agent-count" style="color: var(--primary-500)">
                  <i class="fas fa-robot mr-1"></i>等待加载...
                </p>
                <div id="inner-track-badge" class="inline-block text-xs px-2 py-0.5 rounded-full mb-3" style="background: #e5e7eb; color: #6b7280;">通用</div>
                <div id="inner-agents" class="space-y-2">
                  <div class="text-center py-4 text-gray-400 text-sm">选择标的后加载</div>
                </div>
              </div>

              {/* 综合评分 */}
              <div id="final-section" class="gs-card p-5 card-shadow opacity-40 border-2 border-dashed border-gray-200 transition-all duration-500">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold text-gray-800 flex items-center">
                    <i class="fas fa-chart-pie mr-2" style="color: var(--primary-500)"></i>
                    综合评分
                    <span id="final-step-badge" class="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">第3步</span>
                  </h3>
                  <div id="final-status" class="text-sm text-gray-400 flex items-center">
                    <i class="fas fa-lock mr-1"></i>等待评估完成
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div id="final-details" class="text-center py-8 text-gray-400">
                    <i class="fas fa-chart-pie text-4xl mb-2"></i>
                    <p>评估完成后显示结果</p>
                  </div>
                  <div class="flex items-center justify-center">
                    <canvas id="radar-chart" width="280" height="280"></canvas>
                  </div>
                </div>
              </div>

              {/* 投资建议 */}
              <div id="recommendation-section" class="hidden gs-card p-5 card-shadow border-2 border-green-200">
                <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
                  <i class="fas fa-thumbs-up mr-2 text-green-500"></i>
                  投资建议
                </h3>
                <div class="flex items-center justify-between p-4 rounded-xl bg-green-50">
                  <div>
                    <p id="rec-title" class="font-bold text-lg text-green-700"></p>
                    <p id="rec-detail" class="text-sm text-gray-600 mt-1"></p>
                  </div>
                  <div class="text-right">
                    <div class="text-4xl font-bold text-green-600" id="rec-score"></div>
                    <div class="text-sm text-gray-500" id="rec-grade"></div>
                  </div>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-green-50 rounded-lg p-3">
                    <p class="text-xs font-semibold text-green-700 mb-2"><i class="fas fa-plus-circle mr-1"></i>项目优势</p>
                    <ul id="rec-strengths" class="space-y-1 text-xs text-gray-600"></ul>
                  </div>
                  <div class="bg-red-50 rounded-lg p-3">
                    <p class="text-xs font-semibold text-red-700 mb-2"><i class="fas fa-exclamation-triangle mr-1"></i>主要风险</p>
                    <ul id="rec-risks" class="space-y-1 text-xs text-gray-600"></ul>
                  </div>
                </div>
              </div>

              {/* 改进建议 */}
              <div id="improvement-section" class="hidden gs-card p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
                  <i class="fas fa-lightbulb mr-2 text-amber-500"></i>
                  改进建议与待补充材料
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-amber-50 rounded-xl p-3 cursor-pointer hover:bg-amber-100 transition" onclick="showImprovementPopup('missing')">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-semibold text-amber-700"><i class="fas fa-file-circle-plus mr-1"></i>待补充材料</span>
                      <span id="missing-count" class="text-xs bg-amber-200 text-amber-700 px-1.5 rounded-full">0</span>
                    </div>
                    <ul id="missing-materials" class="space-y-1"></ul>
                  </div>
                  <div class="bg-blue-50 rounded-xl p-3 cursor-pointer hover:bg-blue-100 transition" onclick="showImprovementPopup('improvement')">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-semibold text-blue-700"><i class="fas fa-arrow-up mr-1"></i>改进建议</span>
                      <span id="improvement-count" class="text-xs bg-blue-200 text-blue-700 px-1.5 rounded-full">0</span>
                    </div>
                    <ul id="improvement-suggestions" class="space-y-1"></ul>
                  </div>
                  <div class="bg-green-50 rounded-xl p-3 cursor-pointer hover:bg-green-100 transition" onclick="showImprovementPopup('actions')">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-semibold text-green-700"><i class="fas fa-tasks mr-1"></i>下一步行动</span>
                      <span id="actions-count" class="text-xs bg-green-200 text-green-700 px-1.5 rounded-full">0</span>
                    </div>
                    <div id="next-actions" class="space-y-1"></div>
                  </div>
                </div>
                <div id="risk-recommendation-section" class="hidden mt-4 p-3 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition" onclick="showImprovementPopup('risk-rec')">
                  <p class="text-xs font-semibold text-red-700 mb-1"><i class="fas fa-shield-halved mr-1"></i>风险管理建议（点击查看完整内容）</p>
                  <p id="risk-recommendation-preview" class="text-xs text-gray-600 line-clamp-2"></p>
                </div>
              </div>

            </div>{/* end right col */}
          </div>{/* end main grid */}

        </div>{/* end container */}
      </div>{/* end assess-root */}

      {/* ── 弹窗：推理过程详情 ── */}
      <div id="reasoning-popup" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
          <div class="p-4 border-b flex items-center justify-between">
            <h3 id="popup-title" class="font-semibold text-gray-800"></h3>
            <button onclick="closeReasoningPopup()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
          </div>
          <div id="popup-content" class="p-6 overflow-y-auto flex-1"></div>
        </div>
      </div>

      {/* ── 弹窗：完整报告 ── */}
      <div id="detail-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
          <div class="p-4 border-b flex items-center justify-between">
            <h3 id="modal-title" class="font-semibold text-gray-800"></h3>
            <button onclick="closeDetailModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
          </div>
          <div id="modal-content" class="p-6 overflow-y-auto flex-1"></div>
        </div>
      </div>

      {/* ── 弹窗：改进建议详情 ── */}
      <div id="improvement-popup" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[70vh] flex flex-col">
          <div id="improvement-popup-header" class="p-4 border-b flex items-center justify-between">
            <h3 id="improvement-popup-title" class="font-semibold"></h3>
            <button onclick="closeImprovementPopup()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
          </div>
          <div id="improvement-popup-content" class="p-6 overflow-y-auto flex-1"></div>
        </div>
      </div>

      {/* ── 脚本 ── */}
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
      <script src="/static/assess.js"></script>
    </div>
  )
}
