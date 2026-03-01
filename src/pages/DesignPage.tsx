import type { FC } from 'hono/jsx'
import { products, foundations, architectureGroups, designSections, statusLabels, mainFlowProducts, investorFilterProducts, investorViewProduct, entryProduct, borrowerProducts, dealProducts, postInvestmentProducts } from '../data'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProductLogoSmall, ProductLogoFlow, ProductLogo } from '../components/Logos'

const TEAL = '#5DC4B3'
const AMBER = '#F59E0B'
const INDIGO = '#6366F1'
const EMERALD = '#10B981'
const PURPLE = '#8B5CF6'

export const DesignPage: FC = () => {
  return (
    <div class="min-h-screen">
      <Navbar active="design" />

      {/* Hero Section */}
      <section class="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-[#5DC4B3]/5 pt-16 pb-20">
        <div class="absolute inset-0 dot-pattern opacity-30"></div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div class="text-center fade-in">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5DC4B3]/10 text-[#5DC4B3] text-xs font-semibold rounded-full mb-6 border border-[#5DC4B3]/20">
              <svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="5" fill="#5DC4B3"/></svg>
              Super Agent Architecture
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d1d1f] mb-4 leading-tight tracking-tight">
              9个通如何串联成<span class="text-[#5DC4B3]">Super Agent</span>
            </h1>
            <p class="text-lg text-gray-500 max-w-2xl mx-auto">
              身份通统一入口 · Y型双角色分流 · <strong class="text-[#1d1d1f]">数据穿越AI筛子</strong> · 协同汇合
            </p>
          </div>
        </div>
      </section>

      {/* ========== Y-Shape Flow Diagram (CORE) — 排布对齐 PortalPage ========== */}
      <section class="py-12 bg-white" id="y-flow">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-10">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full mb-3">
              Y型业务流程
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] mb-3">完整Y型业务流程</h2>
            <p class="text-sm text-gray-500 max-w-2xl mx-auto">身份通统一入口分流两个角色：融资者通过申请通上传数据，数据直接进入投资者搭建的评估通→风控通筛选管道，通过标准的项目进入机会通展现</p>
            {/* Legend */}
            <div class="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded bg-amber-100 border-2 border-amber-400"></div>
                <span class="text-xs text-gray-500">融资者路径</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded bg-indigo-100 border-2 border-indigo-400"></div>
                <span class="text-xs text-gray-500">投资者路径</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-0.5 rounded bg-amber-400" style="border-top: 2px dashed #F59E0B"></div>
                <span class="text-xs text-gray-500">数据穿越管道</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded bg-[#5DC4B3]/20 border-2 border-[#5DC4B3]"></div>
                <span class="text-xs text-gray-500">投融资双方协同</span>
              </div>
            </div>
          </div>

          {/* ===== PHASE 1: 统一入口 ===== */}
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">1</div>
              <div>
                <span class="text-sm font-bold text-[#1d1d1f]">统一入口</span>
                <span class="text-[10px] text-gray-400 ml-2">Unified Entry</span>
              </div>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <a href={`/${entryProduct.id}`} class="block no-underline group">
              <div class="portal-card bg-white rounded-2xl p-5 transition-all border border-gray-200 hover:border-[#5DC4B3]/30 hover:shadow-md">
                <div class="flex items-start gap-4">
                  <ProductLogo name={entryProduct.name} englishShort={entryProduct.englishShort} size={60} />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{entryProduct.name}</h3>
                      <span class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusLabels[entryProduct.status].class}`}>
                        {statusLabels[entryProduct.status].text}
                      </span>
                    </div>
                    <p class="text-xs text-gray-400 mb-1.5">{entryProduct.englishName}</p>
                    <p class="text-sm text-gray-500 leading-relaxed">{entryProduct.description}</p>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div class="flex flex-wrap gap-1.5">
                    {entryProduct.features.slice(0, 3).map((f) => (
                      <span class="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">{f}</span>
                    ))}
                  </div>
                  <i class="fas fa-arrow-right text-xs text-gray-300 group-hover:text-[#5DC4B3] transition-colors"></i>
                </div>
              </div>
            </a>
          </div>

          {/* ===== Y-FORK VISUAL ===== */}
          <div class="flex justify-center mb-6">
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-[#5DC4B3] flex items-center justify-center shadow-lg shadow-[#5DC4B3]/30">
                <i class="fas fa-code-branch text-white text-sm"></i>
              </div>
              <span class="text-[10px] text-[#5DC4B3] font-bold mt-1">Y型分流</span>
            </div>
          </div>

          {/* ===== PHASE 2: 双角色分流（并排） ===== */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* LEFT: 融资者路径 */}
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">2a</div>
                <div>
                  <span class="text-sm font-bold text-amber-600">融资者路径</span>
                  <span class="text-[10px] text-gray-400 ml-2">Borrower</span>
                </div>
              </div>
              <div class="border-l-4 border-amber-300 pl-4">
                {borrowerProducts.map((p) => (
                  <a href={`/${p.id}`} class="block no-underline group">
                    <div class="portal-card bg-white rounded-2xl p-5 transition-all border border-gray-200 hover:border-[#5DC4B3]/30 hover:shadow-md">
                      <div class="flex items-start gap-4">
                        <ProductLogo name={p.name} englishShort={p.englishShort} size={60} />
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap mb-1">
                            <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{p.name}</h3>
                            <span class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusLabels[p.status].class}`}>
                              {statusLabels[p.status].text}
                            </span>
                          </div>
                          <p class="text-xs text-gray-400 mb-1.5">{p.englishName}</p>
                          <p class="text-sm text-gray-500 leading-relaxed">{p.description}</p>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div class="flex flex-wrap gap-1.5">
                          {p.features.slice(0, 3).map((f) => (
                            <span class="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">{f}</span>
                          ))}
                        </div>
                        <i class="fas fa-arrow-right text-xs text-gray-300 group-hover:text-[#5DC4B3] transition-colors"></i>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* RIGHT: 投资者搭建筛子 */}
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">2b</div>
                <div>
                  <span class="text-sm font-bold text-indigo-600">投资者搭建筛子</span>
                  <span class="text-[10px] text-gray-400 ml-2">Investor</span>
                </div>
              </div>
              <div class="border-l-4 border-indigo-300 pl-4">
                <div class="p-4 bg-indigo-50/40 rounded-xl border border-dashed border-indigo-300">
                  <div class="text-center mb-3">
                    <span class="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-200">
                      <i class="fas fa-robot mr-1"></i>投资者配置个性化AI筛选标准
                    </span>
                  </div>
                  <p class="text-[11px] text-indigo-600/70 text-center leading-relaxed mb-3">
                    每个投资者可通过评估通和风控通搭建自己的筛选工作流。<br/>
                    <strong>不设置任何筛子 = 在机会通看到所有融资项目。</strong>
                  </p>
                  <div class="flex items-center justify-center gap-2 text-[9px] text-indigo-400">
                    <span class="px-2 py-0.5 bg-white rounded border border-indigo-200">自定义投资标准</span>
                    <span class="px-2 py-0.5 bg-white rounded border border-indigo-200">自定义风控规则</span>
                    <span class="px-2 py-0.5 bg-white rounded border border-indigo-200">核验方式</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== PHASE 3: 数据筛选管道（核心过程） ===== */}
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">3</div>
              <div>
                <span class="text-sm font-bold text-gray-800">数据筛选管道</span>
                <span class="text-[10px] text-gray-400 ml-2">申请通数据 → 评估通 → 风控通 → 机会通</span>
              </div>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Pipeline info banner */}
            <div class="bg-gradient-to-r from-amber-50 via-indigo-50 to-emerald-50 rounded-xl p-4 border border-gray-200 mb-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i class="fas fa-long-arrow-alt-right text-amber-500"></i>
                </div>
                <div class="text-xs text-gray-600 leading-relaxed">
                  融资者在申请通上传的数据<strong class="text-amber-600">直接进入</strong>投资者搭建的评估通→风控通筛选管道。
                  数据依次经过<strong class="text-indigo-600">评估通</strong>（投资标准筛选）和<strong class="text-indigo-600">风控通</strong>（风控标准筛选），
                  <strong class="text-emerald-600">只有通过全部标准的项目</strong>才会出现在该投资者的机会通看板上。
                  不通过的项目会被淘汰或通知融资者补充材料。
                </div>
              </div>
            </div>

            {/* 评估通 */}
            <div class="relative mb-3">
              <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 to-indigo-300 hidden sm:block"></div>
              <div class="sm:ml-10">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-bold border border-amber-200">
                    <i class="fas fa-database mr-0.5"></i>申请通数据流入
                  </span>
                  <span class="text-gray-300">→</span>
                  <span class="text-[9px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold border border-indigo-200">
                    <i class="fas fa-filter mr-0.5"></i>筛子①
                  </span>
                </div>
                <a href={`/${investorFilterProducts[0].id}`} class="block no-underline group">
                  <div class="portal-card bg-white rounded-2xl p-5 transition-all border border-indigo-200 hover:border-indigo-400 hover:shadow-md">
                    <div class="flex items-start gap-4">
                      <ProductLogo name={investorFilterProducts[0].name} englishShort={investorFilterProducts[0].englishShort} size={60} />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{investorFilterProducts[0].name}</h3>
                          <span class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusLabels[investorFilterProducts[0].status].class}`}>
                            {statusLabels[investorFilterProducts[0].status].text}
                          </span>
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-200">
                            <i class="fas fa-filter mr-0.5"></i>AI筛子
                          </span>
                        </div>
                        <p class="text-xs text-gray-400 mb-1.5">{investorFilterProducts[0].englishName}</p>
                        <p class="text-sm text-gray-500 leading-relaxed">{investorFilterProducts[0].description}</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div class="flex flex-wrap gap-1.5">
                        {investorFilterProducts[0].features.slice(0, 3).map((f) => (
                          <span class="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">{f}</span>
                        ))}
                      </div>
                      <i class="fas fa-arrow-right text-xs text-gray-300 group-hover:text-[#5DC4B3] transition-colors"></i>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Arrow between assess and risk */}
            <div class="sm:ml-10 flex items-center gap-2 mb-3 pl-2">
              <svg width="16" height="20" viewBox="0 0 16 20">
                <line x1="8" y1="0" x2="8" y2="14" stroke="#6366F1" stroke-width="1.5" opacity="0.4" />
                <polygon points="4,14 8,20 12,14" fill="#6366F1" opacity="0.4" />
              </svg>
              <span class="text-[9px] text-indigo-400">评估通过的项目继续流入 →</span>
            </div>

            {/* 风控通 */}
            <div class="relative mb-3">
              <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-emerald-300 hidden sm:block"></div>
              <div class="sm:ml-10">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[9px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold border border-indigo-200">
                    <i class="fas fa-shield-alt mr-0.5"></i>筛子②
                  </span>
                  <span class="text-[9px] text-red-400 ml-2">
                    <i class="fas fa-times-circle mr-0.5"></i>不通过 → 淘汰/补材料
                  </span>
                </div>
                <a href={`/${investorFilterProducts[1].id}`} class="block no-underline group">
                  <div class="portal-card bg-white rounded-2xl p-5 transition-all border border-indigo-200 hover:border-indigo-400 hover:shadow-md">
                    <div class="flex items-start gap-4">
                      <ProductLogo name={investorFilterProducts[1].name} englishShort={investorFilterProducts[1].englishShort} size={60} />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{investorFilterProducts[1].name}</h3>
                          <span class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusLabels[investorFilterProducts[1].status].class}`}>
                            {statusLabels[investorFilterProducts[1].status].text}
                          </span>
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-200">
                            <i class="fas fa-filter mr-0.5"></i>AI筛子
                          </span>
                        </div>
                        <p class="text-xs text-gray-400 mb-1.5">{investorFilterProducts[1].englishName}</p>
                        <p class="text-sm text-gray-500 leading-relaxed">{investorFilterProducts[1].description}</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div class="flex flex-wrap gap-1.5">
                        {investorFilterProducts[1].features.slice(0, 3).map((f) => (
                          <span class="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">{f}</span>
                        ))}
                      </div>
                      <i class="fas fa-arrow-right text-xs text-gray-300 group-hover:text-[#5DC4B3] transition-colors"></i>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Arrow to Opportunity */}
            <div class="sm:ml-10 flex items-center gap-2 mb-3 pl-2">
              <svg width="16" height="20" viewBox="0 0 16 20">
                <line x1="8" y1="0" x2="8" y2="14" stroke="#10B981" stroke-width="2" />
                <polygon points="4,14 8,20 12,14" fill="#10B981" />
              </svg>
              <span class="text-[9px] text-emerald-500 font-bold">
                <i class="fas fa-check-circle mr-0.5"></i>通过全部标准 → 进入机会通展现
              </span>
            </div>

            {/* 机会通 */}
            <div class="relative">
              <div class="sm:ml-10">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold border border-emerald-200">
                    <i class="fas fa-th-large mr-0.5"></i>投资者统一看板
                  </span>
                  <span class="text-[9px] text-emerald-500 font-semibold">
                    无筛子 = 展示全部融资项目
                  </span>
                </div>
                <a href={`/${investorViewProduct.id}`} class="block no-underline group">
                  <div class="portal-card bg-white rounded-2xl p-5 transition-all border border-gray-200 hover:border-[#5DC4B3]/30 hover:shadow-md">
                    <div class="flex items-start gap-4">
                      <ProductLogo name={investorViewProduct.name} englishShort={investorViewProduct.englishShort} size={60} />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{investorViewProduct.name}</h3>
                          <span class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusLabels[investorViewProduct.status].class}`}>
                            {statusLabels[investorViewProduct.status].text}
                          </span>
                        </div>
                        <p class="text-xs text-gray-400 mb-1.5">{investorViewProduct.englishName}</p>
                        <p class="text-sm text-gray-500 leading-relaxed">{investorViewProduct.description}</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div class="flex flex-wrap gap-1.5">
                        {investorViewProduct.features.slice(0, 3).map((f) => (
                          <span class="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">{f}</span>
                        ))}
                      </div>
                      <i class="fas fa-arrow-right text-xs text-gray-300 group-hover:text-[#5DC4B3] transition-colors"></i>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* ===== MERGE VISUAL ===== */}
          <div class="flex justify-center mb-6">
            <div class="flex flex-col items-center">
              <div class="flex items-center gap-3">
                <div class="h-px w-16 bg-amber-300"></div>
                <div class="w-10 h-10 rounded-full bg-[#5DC4B3] flex items-center justify-center shadow-lg shadow-[#5DC4B3]/30">
                  <i class="fas fa-handshake text-white text-sm"></i>
                </div>
                <div class="h-px w-16 bg-indigo-300"></div>
              </div>
              <span class="text-[10px] text-[#5DC4B3] font-bold mt-1">Y型汇合 · 投融资双方协同</span>
            </div>
          </div>

          {/* ===== PHASE 4: 交易达成（协同） ===== */}
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">4</div>
              <div>
                <span class="text-sm font-bold text-purple-600">交易达成</span>
                <span class="text-[10px] text-gray-400 ml-2">Deal Making</span>
              </div>
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#5DC4B3] text-white font-bold">
                <i class="fas fa-handshake mr-0.5"></i>投融资双方协同
              </span>
            </div>
            <div class="space-y-3">
              {dealProducts.map((p) => (
                <a href={`/${p.id}`} class="block no-underline group">
                  <div class={`portal-card bg-white rounded-2xl p-5 transition-all border ${
                    p.isCollaborative 
                      ? 'border-[#5DC4B3]/50 shadow-md shadow-[#5DC4B3]/10 hover:shadow-lg' 
                      : 'border-gray-200 hover:border-[#5DC4B3]/30 hover:shadow-md'
                  }`}>
                    <div class="flex items-start gap-4">
                      <ProductLogo name={p.name} englishShort={p.englishShort} size={60} />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{p.name}</h3>
                          <span class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusLabels[p.status].class}`}>
                            {statusLabels[p.status].text}
                          </span>
                          {p.isCollaborative && (
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#5DC4B3] text-white font-bold">
                              <i class="fas fa-handshake mr-0.5"></i>协同
                            </span>
                          )}
                        </div>
                        <p class="text-xs text-gray-400 mb-1.5">{p.englishName}</p>
                        <p class="text-sm text-gray-500 leading-relaxed">{p.description}</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div class="flex flex-wrap gap-1.5">
                        {p.features.slice(0, 3).map((f) => (
                          <span class="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">{f}</span>
                        ))}
                      </div>
                      <i class="fas fa-arrow-right text-xs text-gray-300 group-hover:text-[#5DC4B3] transition-colors"></i>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div class="flex justify-center mb-6">
            <svg width="16" height="24" viewBox="0 0 16 24">
              <line x1="8" y1="0" x2="8" y2="18" stroke="#5DC4B3" stroke-width="1.5" opacity="0.3" />
              <polygon points="4,18 8,24 12,18" fill="#5DC4B3" opacity="0.3" />
            </svg>
          </div>

          {/* ===== PHASE 5: 投后管理 ===== */}
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">5</div>
              <div>
                <span class="text-sm font-bold text-red-500">投后管理</span>
                <span class="text-[10px] text-gray-400 ml-2">Post-Investment</span>
              </div>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <div class="space-y-3">
              {postInvestmentProducts.map((p) => (
                <a href={`/${p.id}`} class="block no-underline group">
                  <div class="portal-card bg-white rounded-2xl p-5 transition-all border border-gray-200 hover:border-[#5DC4B3]/30 hover:shadow-md">
                    <div class="flex items-start gap-4">
                      <ProductLogo name={p.name} englishShort={p.englishShort} size={60} />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors">{p.name}</h3>
                          <span class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusLabels[p.status].class}`}>
                            {statusLabels[p.status].text}
                          </span>
                        </div>
                        <p class="text-xs text-gray-400 mb-1.5">{p.englishName}</p>
                        <p class="text-sm text-gray-500 leading-relaxed">{p.description}</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div class="flex flex-wrap gap-1.5">
                        {p.features.slice(0, 3).map((f) => (
                          <span class="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">{f}</span>
                        ))}
                      </div>
                      <i class="fas fa-arrow-right text-xs text-gray-300 group-hover:text-[#5DC4B3] transition-colors"></i>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Architecture Overview - 5-group layout */}
      <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-2xl font-extrabold text-[#1d1d1f] mb-2">架构总览</h2>
            <p class="text-sm text-gray-500">按Y型分流阶段分组的9个核心Agent</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {architectureGroups.map((group) => (
              <div class="space-y-3">
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                  <i class={`fas ${group.icon} text-xs`} style={`color: ${group.color}`}></i>
                  <div class="flex-1 min-w-0">
                    <span class="text-xs font-bold text-[#1d1d1f] block truncate">{group.title}</span>
                    <span class="text-[9px] text-gray-400">{group.titleEn}</span>
                  </div>
                </div>

                {group.ids.map((id) => {
                  const p = products.find(pr => pr.id === id)!
                  return (
                    <div class="card-hover bg-white border border-gray-200 rounded-xl p-3 cursor-pointer" onclick={`window.location.href='/${p.id}'`}>
                      <div class="flex items-start gap-2">
                        <ProductLogoSmall name={p.name} englishShort={p.englishShort} size={40} />
                        <div class="flex-1 min-w-0">
                          <h3 class="text-xs font-bold text-[#1d1d1f] mb-0.5">{p.name}</h3>
                          <p class="text-[10px] text-gray-400">{p.englishShort}</p>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                        <span class={`text-[9px] px-1.5 py-0.5 rounded-full border ${statusLabels[p.status].class}`}>
                          {statusLabels[p.status].text}
                        </span>
                        {p.isFilter && (
                          <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-200 font-semibold">
                            <i class="fas fa-filter mr-0.5"></i>筛子
                          </span>
                        )}
                        {p.isCollaborative && (
                          <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-[#5DC4B3]/10 text-[#5DC4B3] border border-[#5DC4B3]/20 font-semibold">
                            协同
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connection Layer */}
      <section class="py-8 bg-white">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <div class="flex items-center justify-center gap-4">
            <div class="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div class="flex items-center gap-3">
              <svg viewBox="0 0 20 20" width="12" height="12"><circle cx="10" cy="10" r="6" fill={TEAL} opacity="0.5"/></svg>
              <span class="text-sm font-semibold text-[#1d1d1f] tracking-wider">事件驱动 · AI筛子编排 · 双向赋能</span>
              <svg viewBox="0 0 20 20" width="12" height="12"><circle cx="10" cy="10" r="6" fill={TEAL} opacity="0.5"/></svg>
            </div>
            <div class="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Foundation Layer */}
      <section class="py-16 bg-gray-50">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="relative border-t-4 border-[#5DC4B3] rounded-xl bg-white shadow-lg overflow-hidden">
            <div class="absolute inset-0 dot-pattern opacity-10"></div>
            <div class="relative p-8">
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h2 class="text-xl font-extrabold text-[#1d1d1f]">统一底座（基础设施层）</h2>
                  <p class="text-xs text-gray-400 mt-1">Unified Foundation Layer</p>
                </div>
                <span class="px-3 py-1 bg-[#5DC4B3]/10 text-[#5DC4B3] text-xs font-semibold rounded-full border border-[#5DC4B3]/20">
                  <i class="fas fa-check-circle mr-1"></i>所有Agent共用
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {foundations.map((f) => (
                  <div class="card-hover bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                    <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <i class={`fas ${f.icon} text-2xl text-[#5DC4B3]`}></i>
                    </div>
                    <h3 class="text-base font-bold text-[#1d1d1f] mb-2">{f.name}</h3>
                    <p class="text-sm text-gray-500">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Design Thinking Accordion */}
      <section class="py-16 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-2xl font-extrabold text-[#1d1d1f] mb-2">核心设计思路</h2>
            <p class="text-sm text-gray-500">从理念到架构的完整思考过程</p>
          </div>

          <div class="space-y-4" id="accordion">
            {designSections.map((section, idx) => (
              <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <button
                  class="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  onclick={`
                    const content = this.nextElementSibling;
                    const icon = this.querySelector('.accordion-icon');
                    content.classList.toggle('open');
                    icon.classList.toggle('rotate-180');
                  `}
                >
                  <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i class={`fas ${section.icon} text-[#5DC4B3]`}></i>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-base font-bold text-[#1d1d1f]">{section.title}</h3>
                  </div>
                  <i class="fas fa-chevron-down text-gray-400 text-sm transition-transform duration-300 accordion-icon"></i>
                </button>
                <div class={`accordion-content ${idx === 1 ? 'open' : ''}`}>
                  <div class="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                    {section.content.map((item) => (
                      <div class="pl-4 border-l-2 border-[#5DC4B3]/40">
                        <h4 class="text-sm font-bold text-[#1d1d1f] mb-1">{item.subtitle}</h4>
                        <p class="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section class="py-16 bg-gradient-to-br from-[#5DC4B3]/5 via-white to-[#5DC4B3]/8">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <h2 class="text-2xl font-extrabold text-[#1d1d1f] mb-4">准备好探索超级Agent产品矩阵了吗？</h2>
          <p class="text-gray-500 mb-8">点击进入产品统一入口，体验9个"通"的完整功能</p>
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/portal" class="inline-flex items-center justify-center px-8 py-3.5 bg-[#5DC4B3] hover:bg-[#3DBDB5] text-white font-bold rounded-xl shadow-lg shadow-[#5DC4B3]/25 transition-all no-underline">
              <i class="fas fa-rocket mr-2"></i>进入产品入口
            </a>
            <a href="#" class="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[#1d1d1f] font-bold rounded-xl border-2 border-gray-200 hover:border-[#5DC4B3] transition-all no-underline">
              <i class="fas fa-download mr-2"></i>下载产品白皮书
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
