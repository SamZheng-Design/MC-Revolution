import type { FC } from 'hono/jsx'
import { products, foundations, architectureGroups, statusLabels } from '../data'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProductLogoSmall } from '../components/Logos'

const TEAL = '#5DC4B3'

/*
 * 官网首页 — Premium FinTech Landing
 * 
 * 设计哲学：
 * - 对标 Stripe / Bloomberg / 滴灌通官网 的专业质感
 * - 深色Hero + 数据驱动的信任感 + 产品矩阵核心入口
 * - 让人一进来就觉得「这是值钱的基础设施级产品」
 * 
 * 布局逻辑：
 * 1. Hero — 品牌宣言 + 核心数据 + 双CTA
 * 2. 信任条 — 合作伙伴/认证logo（暂占位）
 * 3. 产品矩阵 — 9个通的5阶段展示（核心）
 * 4. 双通道价值主张 — 投资者 vs 融资企业
 * 5. 平台能力 — 6大核心能力卡片
 * 6. 统一底座 — 技术基础设施
 * 7. 数据亮点 — 关键运营指标
 * 8. CTA — 行动号召
 */

// 5阶段流程配色
const phaseConfig = [
  { label: '统一入口', color: '#5DC4B3', icon: 'fa-fingerprint', ids: ['identity'] },
  { label: '融资路径', color: '#F59E0B', icon: 'fa-store', ids: ['application'] },
  { label: '投资路径', color: '#6366F1', icon: 'fa-chart-pie', ids: ['assess', 'risk', 'opportunity'] },
  { label: '交易撮合', color: '#8B5CF6', icon: 'fa-handshake', ids: ['terms', 'contract'] },
  { label: '投后管理', color: '#10B981', icon: 'fa-chart-line', ids: ['settlement', 'performance'] },
]

export const HomePage: FC = () => {
  return (
    <div class="min-h-screen">
      <Navbar active="home" />

      {/* ═══════════════════════════════════════════
          HERO — Dark, Premium, Data-driven
          对标Bloomberg/Stripe的深色科技感
      ═══════════════════════════════════════════ */}
      <section class="relative overflow-hidden bg-[#0B1A18] pt-20 pb-28 lg:pt-28 lg:pb-36">
        {/* Layered background effects */}
        <div class="absolute inset-0">
          {/* Grid pattern */}
          <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(93,196,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(93,196,179,0.3) 1px, transparent 1px); background-size: 60px 60px;"></div>
          {/* Radial glow */}
          <div class="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] rounded-full" style="background: radial-gradient(circle, rgba(93,196,179,0.08) 0%, transparent 60%);"></div>
          <div class="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full" style="background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%);"></div>
        </div>

        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="text-center fade-in">
            {/* Eyebrow badge */}
            <div class="inline-flex items-center gap-2.5 px-5 py-2 bg-white/[0.04] border border-white/[0.06] text-white/50 text-xs font-medium rounded-full mb-10 backdrop-blur-sm">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5DC4B3] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#5DC4B3]"></span>
              </span>
              Revenue-Based Financing Infrastructure
            </div>

            {/* Main headline */}
            <h1 class="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              收入分成投资的<br />
              <span class="relative">
                <span class="bg-gradient-to-r from-[#5DC4B3] via-[#7DD4C7] to-[#5DC4B3] bg-clip-text text-transparent">基础设施级平台</span>
              </span>
            </h1>

            <p class="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              9个AI超级Agent覆盖完整投融资生命周期<br class="hidden sm:block" />
              从身份认证到投后管理，全链路智能化
            </p>

            {/* Dual CTA */}
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <a href="/portal" class="group inline-flex items-center px-8 py-4 bg-[#5DC4B3] hover:bg-[#4AB5A5] text-white font-bold text-[15px] rounded-xl shadow-[0_0_40px_rgba(93,196,179,0.3)] hover:shadow-[0_0_60px_rgba(93,196,179,0.4)] transition-all no-underline">
                <i class="fas fa-rocket mr-2.5 text-sm group-hover:translate-x-0.5 transition-transform"></i>
                进入产品平台
              </a>
              <a href="/design" class="inline-flex items-center px-8 py-4 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white font-semibold text-[15px] rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all no-underline backdrop-blur-sm">
                <i class="fas fa-compass mr-2.5 text-sm"></i>
                了解设计思路
              </a>
            </div>

            {/* Hero metrics bar — 关键数据建立信任 */}
            <div class="max-w-4xl mx-auto">
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]">
                <div class="bg-[#0B1A18]/80 backdrop-blur-sm px-6 py-7 text-center group hover:bg-white/[0.02] transition-colors">
                  <div class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">9</div>
                  <div class="text-[11px] text-white/30 font-medium tracking-wider uppercase">Super Agents</div>
                </div>
                <div class="bg-[#0B1A18]/80 backdrop-blur-sm px-6 py-7 text-center group hover:bg-white/[0.02] transition-colors">
                  <div class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">5</div>
                  <div class="text-[11px] text-white/30 font-medium tracking-wider uppercase">Workflow Phases</div>
                </div>
                <div class="bg-[#0B1A18]/80 backdrop-blur-sm px-6 py-7 text-center group hover:bg-white/[0.02] transition-colors">
                  <div class="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#5DC4B3] to-[#7DD4C7] bg-clip-text text-transparent tracking-tight mb-1">AI</div>
                  <div class="text-[11px] text-white/30 font-medium tracking-wider uppercase">Filtering Engine</div>
                </div>
                <div class="bg-[#0B1A18]/80 backdrop-blur-sm px-6 py-7 text-center group hover:bg-white/[0.02] transition-colors">
                  <div class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">&infin;</div>
                  <div class="text-[11px] text-white/30 font-medium tracking-wider uppercase">Industry Coverage</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>


      {/* ═══════════════════════════════════════════
          TRUST BAR — 合作伙伴/认证（暂占位）
      ═══════════════════════════════════════════ */}
      <section class="py-8 bg-white border-b border-gray-100">
        <div class="max-w-5xl mx-auto px-4">
          <div class="flex items-center justify-center gap-8 sm:gap-12 opacity-30 grayscale">
            <span class="text-xs font-bold text-gray-400 tracking-widest uppercase hidden sm:block">Trusted by</span>
            <div class="flex items-center gap-8 sm:gap-14">
              {['Hong Kong SFC', 'MCEX Macau', 'ISO 27001', 'SOC 2'].map((name) => (
                <span class="text-[11px] font-bold text-gray-400 tracking-wide whitespace-nowrap">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          ONE-LINE VALUE PROPOSITION
      ═══════════════════════════════════════════ */}
      <section class="py-12 bg-white">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <p class="text-xl sm:text-2xl text-[#1d1d1f] font-semibold leading-relaxed">
            传统RBF平台按赛道分别造轮子，<span class="text-gray-400">数据孤岛、重复开发、无法规模化。</span><br class="hidden md:block" />
            我们的回答：<span class="font-extrabold bg-gradient-to-r from-[#3D8F83] to-[#5DC4B3] bg-clip-text text-transparent">一套通用Agent矩阵，覆盖一切行业。</span>
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          PRODUCT MATRIX — 5阶段展示（核心卖点）
          这是整个页面最重要的区域
      ═══════════════════════════════════════════ */}
      <section class="py-16 lg:py-24 bg-[#FAFAFA]" id="products">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div class="text-center mb-14">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5DC4B3]/8 text-[#5DC4B3] text-xs font-bold rounded-full mb-4 border border-[#5DC4B3]/15 tracking-wider uppercase">
              <i class="fas fa-th-large text-[10px]"></i>
              Product Suite
            </div>
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1d1d1f] mb-4 tracking-tight">
              Y型架构 · 9大超级Agent
            </h2>
            <p class="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              统一入口分流双角色，AI筛子连接投融资，协同完成交易闭环
            </p>
          </div>

          {/* Phase flow — 5 columns with products */}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {phaseConfig.map((phase, pi) => (
              <div class="space-y-3">
                {/* Phase header */}
                <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={`background: ${phase.color};`}>
                    <i class={`fas ${phase.icon}`}></i>
                  </div>
                  <div>
                    <div class="text-[10px] font-bold text-gray-300 tracking-wider">PHASE {pi + 1}</div>
                    <div class="text-xs font-bold text-[#1d1d1f]">{phase.label}</div>
                  </div>
                </div>
                {/* Product cards */}
                {phase.ids.map((id) => {
                  const p = products.find(pr => pr.id === id)!
                  return (
                    <a href={`/${p.id}`} class="block no-underline group">
                      <div class="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all hover:shadow-md cursor-pointer">
                        <div class="flex items-start gap-2.5">
                          <ProductLogoSmall name={p.name} englishShort={p.englishShort} size={38} />
                          <div class="flex-1 min-w-0">
                            <h3 class="text-[13px] font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{p.name}</h3>
                            <p class="text-[10px] text-gray-400 mt-0.5">{p.englishShort}</p>
                          </div>
                        </div>
                        <p class="text-[11px] text-gray-500 mt-2.5 leading-relaxed line-clamp-2">{p.description}</p>
                        <div class="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span class={`text-[9px] px-1.5 py-0.5 rounded-full border ${statusLabels[p.status].class}`}>
                            {statusLabels[p.status].text}
                          </span>
                          {p.isFilter && (
                            <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-semibold">
                              <i class="fas fa-filter mr-0.5 text-[7px]"></i>AI筛子
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Quick links to deep pages */}
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/design" class="inline-flex items-center px-7 py-3 bg-[#1d1d1f] hover:bg-[#333] text-white font-bold text-sm rounded-xl transition-all no-underline">
              <i class="fas fa-compass mr-2"></i>完整设计思路
            </a>
            <a href="/portal" class="inline-flex items-center px-7 py-3 bg-white text-[#1d1d1f] font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#5DC4B3] hover:text-[#5DC4B3] transition-all no-underline">
              <i class="fas fa-th-large mr-2"></i>产品入口
            </a>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          DUAL VALUE — 投资者 vs 融资企业
          两个通道，各取所需
      ═══════════════════════════════════════════ */}
      <section class="py-16 lg:py-24 bg-white">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] mb-3 tracking-tight">
              双通道，精准服务
            </h2>
            <p class="text-sm text-gray-400 max-w-lg mx-auto">
              投资者和融资企业各有专属工具链，在条款协商环节精准汇合
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            {/* Investor */}
            <div class="relative rounded-2xl border-2 border-indigo-100 p-8 lg:p-10 hover:border-indigo-300 hover:shadow-xl transition-all group overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style="background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%); transform: translate(30%, -30%);"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <i class="fas fa-chart-pie text-indigo-500 text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-extrabold text-[#1d1d1f]">投资者</h3>
                    <p class="text-xs text-indigo-400 font-medium">Investor Platform</p>
                  </div>
                </div>
                <ul class="space-y-4 mb-8">
                  <li class="flex items-start gap-3 text-sm text-gray-600">
                    <span class="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="fas fa-check text-indigo-500 text-[9px]"></i>
                    </span>
                    <span><strong class="text-[#1d1d1f]">个性化AI评估</strong> — 自定义评估模型和风控规则，精准匹配投资偏好</span>
                  </li>
                  <li class="flex items-start gap-3 text-sm text-gray-600">
                    <span class="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="fas fa-check text-indigo-500 text-[9px]"></i>
                    </span>
                    <span><strong class="text-[#1d1d1f]">智能机会看板</strong> — 经AI筛选的优质项目一览，支持多维度排序与对比</span>
                  </li>
                  <li class="flex items-start gap-3 text-sm text-gray-600">
                    <span class="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="fas fa-check text-indigo-500 text-[9px]"></i>
                    </span>
                    <span><strong class="text-[#1d1d1f]">投后全透明</strong> — 自动结算 + 实时履约监控，每笔收入分成清清楚楚</span>
                  </li>
                </ul>
                <a href="/portal" class="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 no-underline group/link">
                  探索投资者工具 <i class="fas fa-arrow-right text-xs ml-2 group-hover/link:translate-x-1 transition-transform"></i>
                </a>
              </div>
            </div>

            {/* Business */}
            <div class="relative rounded-2xl border-2 border-amber-100 p-8 lg:p-10 hover:border-amber-300 hover:shadow-xl transition-all group overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style="background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%); transform: translate(30%, -30%);"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <i class="fas fa-store text-amber-500 text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-extrabold text-[#1d1d1f]">融资企业</h3>
                    <p class="text-xs text-amber-400 font-medium">Business Platform</p>
                  </div>
                </div>
                <ul class="space-y-4 mb-8">
                  <li class="flex items-start gap-3 text-sm text-gray-600">
                    <span class="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="fas fa-check text-amber-500 text-[9px]"></i>
                    </span>
                    <span><strong class="text-[#1d1d1f]">智能申请助手</strong> — 自动整理经营数据、生成标准化Pitch Deck</span>
                  </li>
                  <li class="flex items-start gap-3 text-sm text-gray-600">
                    <span class="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="fas fa-check text-amber-500 text-[9px]"></i>
                    </span>
                    <span><strong class="text-[#1d1d1f]">精准曝光</strong> — 标准化数据直接进入投资者AI筛选池，高效匹配</span>
                  </li>
                  <li class="flex items-start gap-3 text-sm text-gray-600">
                    <span class="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="fas fa-check text-amber-500 text-[9px]"></i>
                    </span>
                    <span><strong class="text-[#1d1d1f]">灵活分成模式</strong> — 有收入才分配，不是传统借贷，与经营绑定</span>
                  </li>
                </ul>
                <a href="/portal" class="inline-flex items-center text-sm font-bold text-amber-600 hover:text-amber-700 no-underline group/link">
                  探索融资工具 <i class="fas fa-arrow-right text-xs ml-2 group-hover/link:translate-x-1 transition-transform"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          PLATFORM CAPABILITIES — 6大能力
      ═══════════════════════════════════════════ */}
      <section class="py-16 lg:py-24 bg-[#FAFAFA]">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1d1d1f]/5 text-[#1d1d1f] text-xs font-bold rounded-full mb-4 tracking-wider uppercase">
              Platform Capabilities
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] mb-3 tracking-tight">
              不只是工具，是投资基础设施
            </h2>
            <p class="text-sm text-gray-400 max-w-lg mx-auto">
              每一个能力都经过金融级标准打磨
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'fa-code-branch', color: '#5DC4B3', title: 'Y型分流架构', desc: '身份通统一入口，智能识别角色后自动分流。投资者和融资企业各走专属路径，在条款协商时精准汇合。', tag: 'Architecture' },
              { icon: 'fa-robot', color: '#6366F1', title: '个性化AI筛子', desc: '投资者自定义评估标准和风控规则。评估通和风控通作为AI代理，在海量项目中执行个性化筛选。', tag: 'AI Engine' },
              { icon: 'fa-layer-group', color: '#F59E0B', title: '跨行业通用', desc: '不按赛道造轮子。餐饮、零售、医美、教育——同一套Agent矩阵适配一切收入分成场景。', tag: 'Scalability' },
              { icon: 'fa-handshake', color: '#8B5CF6', title: '投融资协同', desc: '条款通+合约通实现双方在线协商、电子签约。从出价到签约全流程线上完成，摩擦成本降到最低。', tag: 'Collaboration' },
              { icon: 'fa-chart-line', color: '#EF4444', title: '全生命周期管理', desc: '结算通自动执行收入分成，履约通实时监控经营数据。投后不再是黑箱，每笔流向清清楚楚。', tag: 'Lifecycle' },
              { icon: 'fa-database', color: '#10B981', title: '统一数据底座', desc: 'Account身份体系、Data数据底座、AI智能引擎。三层基础设施确保9个Agent共享数据、统一治理。', tag: 'Foundation' },
            ].map((item) => (
              <div class="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all">
                <div class="flex items-center gap-3 mb-5">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center" style={`background: ${item.color}10;`}>
                    <i class={`fas ${item.icon}`} style={`color: ${item.color}; font-size: 16px;`}></i>
                  </div>
                  <span class="text-[9px] font-bold text-gray-300 tracking-widest uppercase">{item.tag}</span>
                </div>
                <h3 class="text-[15px] font-bold text-[#1d1d1f] mb-2.5 group-hover:text-[#5DC4B3] transition-colors">{item.title}</h3>
                <p class="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          UNIFIED FOUNDATION — 统一底座
      ═══════════════════════════════════════════ */}
      <section class="py-16 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="relative border-t-4 border-[#5DC4B3] rounded-2xl bg-gradient-to-b from-[#FAFAFA] to-white shadow-lg overflow-hidden">
            <div class="absolute inset-0 dot-pattern opacity-10"></div>
            <div class="relative p-8 lg:p-10">
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h3 class="text-xl font-extrabold text-[#1d1d1f]">统一底座</h3>
                  <p class="text-xs text-gray-400 mt-1">Unified Foundation Layer — 所有Agent共享的基础设施</p>
                </div>
                <span class="hidden sm:inline-flex px-3 py-1.5 bg-[#5DC4B3]/10 text-[#5DC4B3] text-xs font-bold rounded-full border border-[#5DC4B3]/20">
                  <i class="fas fa-layer-group mr-1.5"></i>Shared Infrastructure
                </span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {foundations.map((f) => (
                  <div class="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div class="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#5DC4B3]/5 to-[#5DC4B3]/15 border border-[#5DC4B3]/10 flex items-center justify-center">
                      <i class={`fas ${f.icon} text-xl text-[#5DC4B3]`}></i>
                    </div>
                    <h4 class="text-sm font-bold text-[#1d1d1f] mb-1.5">{f.name}</h4>
                    <p class="text-xs text-gray-500 leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          DATA HIGHLIGHT — 运营亮点数据
          用数据说话，建立可信度
      ═══════════════════════════════════════════ */}
      <section class="py-16 bg-[#FAFAFA] border-t border-gray-100">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] mb-3 tracking-tight">
              数据驱动的信任
            </h2>
            <p class="text-xs text-gray-400">
              {/* TODO: Sam可替换为真实运营数据 */}
              以下为平台设计目标指标
            </p>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '100%', label: '全流程线上化', sub: 'End-to-End Digital' },
              { value: '<3min', label: '身份认证时效', sub: 'KYC Processing' },
              { value: '7×24', label: '数据监控', sub: 'Real-time Monitoring' },
              { value: '0', label: '数据孤岛', sub: 'Unified Data Layer' },
            ].map((d) => (
              <div class="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div class="text-3xl sm:text-4xl font-extrabold text-[#1d1d1f] tracking-tight mb-2">{d.value}</div>
                <div class="text-sm font-semibold text-[#1d1d1f] mb-0.5">{d.label}</div>
                <div class="text-[10px] text-gray-400 tracking-wider uppercase">{d.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          FINAL CTA — 深色收尾
      ═══════════════════════════════════════════ */}
      <section class="relative py-24 overflow-hidden bg-[#0B1A18]">
        <div class="absolute inset-0">
          <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(93,196,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(93,196,179,0.3) 1px, transparent 1px); background-size: 60px 60px;"></div>
          <div class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[600px] h-[600px] rounded-full" style="background: radial-gradient(circle, rgba(93,196,179,0.06) 0%, transparent 60%);"></div>
        </div>
        <div class="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight leading-tight">
            收入分成投资的未来，<br />
            <span class="text-[#5DC4B3]">从这里开始</span>
          </h2>
          <p class="text-white/35 text-sm sm:text-base mb-10 leading-relaxed max-w-lg mx-auto">
            无论您是机构投资者、个人投资者还是融资企业，<br class="hidden sm:block" />
            9个超级Agent为您打造全流程闭环体验
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/portal" class="inline-flex items-center px-8 py-4 bg-[#5DC4B3] hover:bg-[#4AB5A5] text-white font-bold text-[15px] rounded-xl shadow-[0_0_40px_rgba(93,196,179,0.3)] transition-all no-underline">
              <i class="fas fa-rocket mr-2.5"></i>立即体验
            </a>
            <a href="/contact" class="inline-flex items-center px-8 py-4 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white font-semibold text-[15px] rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all no-underline">
              <i class="fas fa-envelope mr-2.5"></i>联系我们
            </a>
          </div>
          <p class="text-white/20 text-xs mt-8">
            获取完整产品白皮书 · 预约产品演示 · 了解合作方案
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
