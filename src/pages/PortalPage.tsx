import type { FC } from 'hono/jsx'
import { products, foundations, statusLabels } from '../data'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

const TEAL = '#5DC4B3'

// ======================================================
// 简化版产品入口 — Menu式设计
// 看完设计思路后，用户只需要一眼找到自己想用的"通"
// ======================================================

// 流程阶段分组（简洁展示，不再赘述pipeline逻辑）
const phases = [
  {
    label: '入口',
    labelEn: 'Entry',
    color: '#3B82F6',
    bg: 'from-blue-50 to-blue-100/50',
    borderColor: 'border-blue-200',
    icon: 'fa-fingerprint',
    ids: ['identity']
  },
  {
    label: '融资者',
    labelEn: 'Borrower',
    color: '#F59E0B',
    bg: 'from-amber-50 to-amber-100/50',
    borderColor: 'border-amber-200',
    icon: 'fa-upload',
    ids: ['application']
  },
  {
    label: '投资者',
    labelEn: 'Investor',
    color: '#5DC4B3',
    bg: 'from-teal-50 to-teal-100/50',
    borderColor: 'border-teal-200',
    icon: 'fa-filter',
    ids: ['assess', 'risk', 'opportunity']
  },
  {
    label: '磋商',
    labelEn: 'Deal',
    color: '#49A89A',
    bg: 'from-teal-50 to-teal-100/50',
    borderColor: 'border-teal-200',
    icon: 'fa-handshake',
    ids: ['terms', 'contract']
  },
  {
    label: '投后',
    labelEn: 'Post',
    color: '#EF4444',
    bg: 'from-red-50 to-red-100/50',
    borderColor: 'border-red-200',
    icon: 'fa-chart-line',
    ids: ['settlement', 'performance']
  }
]

// 产品id → icon映射
const productIcons: Record<string, string> = {
  identity: 'fa-fingerprint',
  application: 'fa-file-upload',
  assess: 'fa-clipboard-check',
  risk: 'fa-shield-alt',
  opportunity: 'fa-binoculars',
  terms: 'fa-file-contract',
  contract: 'fa-file-signature',
  settlement: 'fa-coins',
  performance: 'fa-chart-bar'
}

// 每个产品一句话描述（极简版）
const shortDesc: Record<string, string> = {
  identity: '认证登录 · 角色分流',
  application: '上传经营数据 · 生成Pitch Deck',
  assess: '自定义投资标准 · AI评估打分',
  risk: '自定义风控规则 · 材料验真',
  opportunity: '筛后项目看板 · 投资决策',
  terms: '收入分成方案 · 条款协商',
  contract: '电子合约签署 · 法律合规',
  settlement: '自动结算 · 资金流转',
  performance: '履约监控 · 预警追踪'
}

// 角色标签
const roleBadge: Record<string, { text: string, class: string }> = {
  shared: { text: '共用', class: 'bg-blue-100 text-blue-600' },
  borrower: { text: '融资者', class: 'bg-amber-100 text-amber-700' },
  investor: { text: '投资者', class: 'bg-teal-100 text-teal-600' },
  collaborative: { text: '协同', class: 'bg-[#5DC4B3]/15 text-[#0d9488]' }
}

// 简洁菜单项
const MenuItem: FC<{ product: typeof products[0], phaseColor: string }> = ({ product: p, phaseColor }) => {
  const icon = productIcons[p.id] || 'fa-cube'
  const desc = shortDesc[p.id] || p.description
  const badge = roleBadge[p.role]
  const status = statusLabels[p.status]

  return (
    <a href={`/${p.id}`} class="block no-underline group">
      <div class="menu-item flex items-center gap-4 px-5 py-4 bg-white rounded-xl border border-gray-150 hover:border-[#5DC4B3] transition-all cursor-pointer">
        {/* Icon */}
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={`background:${phaseColor}12; border:1.5px solid ${phaseColor}30;`}
        >
          <i class={`fas ${icon} text-lg`} style={`color:${phaseColor};`}></i>
        </div>

        {/* Name + Description */}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[15px] font-bold text-gray-900 group-hover:text-[#5DC4B3] transition-colors">{p.name}</span>
            <span class="text-[10px] text-gray-300 font-medium hidden sm:inline">{p.englishName}</span>
          </div>
          <p class="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
        </div>

        {/* Badges */}
        <div class="flex items-center gap-2 flex-shrink-0">
          {p.isFilter && (
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-500 font-bold hidden sm:inline-block">
              AI筛子
            </span>
          )}
          <span class={`text-[9px] px-1.5 py-0.5 rounded font-semibold hidden sm:inline-block ${badge.class}`}>
            {badge.text}
          </span>
          <span class={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${status.class}`}>
            {status.text}
          </span>
        </div>

        {/* Arrow */}
        <i class="fas fa-chevron-right text-[10px] text-gray-200 group-hover:text-[#5DC4B3] transition-colors flex-shrink-0"></i>
      </div>
    </a>
  )
}

export const PortalPage: FC = () => {
  return (
    <div class="min-h-screen bg-gray-50">
      <Navbar active="portal" />

      {/* Compact Hero */}
      <section class="bg-white border-b border-gray-100 pt-10 pb-8">
        <div class="max-w-2xl mx-auto px-4 text-center fade-in">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5DC4B3]/10 text-[#5DC4B3] text-[11px] font-semibold rounded-full mb-3 border border-[#5DC4B3]/20">
            <i class="fas fa-th-large text-[10px]"></i>
            选择你需要的产品
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] mb-2 tracking-tight">
            9个<span class="text-[#5DC4B3]">「通」</span>
          </h1>
          <p class="text-sm text-gray-400">
            点击进入对应产品 · 覆盖RBF投资全生命周期
          </p>
        </div>
      </section>

      {/* 流程导航条 — 让用户一眼看清5个阶段 */}
      <section class="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div class="max-w-2xl mx-auto px-4">
          <div class="flex items-center justify-between py-3 overflow-x-auto gap-1">
            {phases.map((ph, i) => (
              <a href={`#phase-${i}`} class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all hover:opacity-80" style={`background:${ph.color}10; color:${ph.color}; border:1px solid ${ph.color}25;`}>
                <i class={`fas ${ph.icon} text-[10px]`}></i>
                {ph.label}
                <span class="text-[9px] opacity-50">{ph.ids.length}</span>
              </a>
            ))}
            {/* 连接箭头 */}
          </div>
        </div>
      </section>

      {/* 核心内容：菜单式产品列表 */}
      <section class="py-8">
        <div class="max-w-2xl mx-auto px-4 space-y-6">
          {phases.map((ph, idx) => {
            const phaseProducts = ph.ids.map(id => products.find(p => p.id === id)!).filter(Boolean)
            return (
              <div id={`phase-${idx}`} class="scroll-mt-20">
                {/* 阶段标题 */}
                <div class="flex items-center gap-2 mb-2.5 px-1">
                  <div class="w-6 h-6 rounded-lg flex items-center justify-center" style={`background:${ph.color}15;`}>
                    <i class={`fas ${ph.icon} text-[10px]`} style={`color:${ph.color};`}></i>
                  </div>
                  <span class="text-xs font-bold text-gray-700">{ph.label}</span>
                  <span class="text-[10px] text-gray-300 font-medium">{ph.labelEn}</span>
                  {idx < phases.length - 1 && (
                    <div class="flex-1 flex items-center justify-end">
                      <div class="h-px flex-1 max-w-[60px] ml-2" style={`background:${ph.color}20;`}></div>
                      <i class="fas fa-arrow-right text-[8px] ml-1" style={`color:${ph.color}40;`}></i>
                    </div>
                  )}
                </div>

                {/* 产品列表 */}
                <div class="space-y-2">
                  {phaseProducts.map(p => (
                    <MenuItem product={p} phaseColor={ph.color} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 精简底座 */}
      <section class="py-8 bg-white border-t border-gray-100">
        <div class="max-w-2xl mx-auto px-4">
          <div class="text-center mb-5">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">统一底座</span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            {foundations.map((f) => (
              <div class="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div class="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center mx-auto mb-2">
                  <i class={`fas ${f.icon} text-[#5DC4B3]`}></i>
                </div>
                <div class="text-[11px] font-bold text-gray-700">{f.name.split(' ')[0]}</div>
                <div class="text-[10px] text-gray-400 mt-0.5">{f.name.split(' ').slice(1).join(' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
