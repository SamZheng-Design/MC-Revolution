import type { FC } from 'hono/jsx'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

/*
 * 关于我们 — 优雅占位版
 * 核心内容区待Sam提供材料后填入
 */

export const AboutPage: FC = () => {
  return (
    <div class="min-h-screen">
      <Navbar active="about" />

      {/* Hero */}
      <section class="relative overflow-hidden bg-gradient-to-br from-[#0a1f1c] via-[#0d2b26] to-[#0f3530] pt-20 pb-16">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(93,196,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(93,196,179,0.3) 1px, transparent 1px); background-size: 60px 60px;"></div>
        <div class="max-w-4xl mx-auto px-4 relative text-center fade-in">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] text-white/50 text-xs font-semibold rounded-full mb-5 border border-white/[0.06]">
            About Us
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">关于我们</h1>
          <p class="text-base text-white/40 max-w-xl mx-auto leading-relaxed">
            用技术重新定义收入分成投资，让优质资本精准流向最需要的地方
          </p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section class="py-16 bg-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-2 gap-8">
            <div class="card-hover rounded-2xl p-8 border border-gray-100">
              <div class="w-12 h-12 rounded-2xl bg-[#5DC4B3]/10 flex items-center justify-center mb-5">
                <i class="fas fa-bullseye text-[#5DC4B3] text-lg"></i>
              </div>
              <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-3">使命</h3>
              <p class="text-sm text-gray-500 leading-relaxed">
                通过AI超级Agent矩阵，打破传统收入分成投资中的信息不对称和效率瓶颈，让每一笔资本都能精准找到最优质的投资标的。
              </p>
            </div>
            <div class="card-hover rounded-2xl p-8 border border-gray-100">
              <div class="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-5">
                <i class="fas fa-eye text-teal-500 text-lg"></i>
              </div>
              <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-3">愿景</h3>
              <p class="text-sm text-gray-500 leading-relaxed">
                成为全球收入分成融资领域的基础设施级平台，让RBF投资像在交易所买卖股票一样标准化、透明化、高效化。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Numbers */}
      <section class="py-14 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { num: '9', label: 'AI超级Agent', suffix: '个' },
              { num: '5', label: '业务流程阶段', suffix: '大' },
              { num: '100', label: '全流程在线化', suffix: '%' },
              { num: '∞', label: '行业覆盖', suffix: '' },
            ].map(s => (
              <div class="text-center p-6 bg-white rounded-2xl border border-gray-100">
                <div class="text-3xl font-extrabold text-[#1d1d1f] tracking-tight">{s.num}<span class="text-[#5DC4B3] text-lg">{s.suffix}</span></div>
                <div class="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section class="py-16 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-xl font-extrabold text-[#1d1d1f] mb-10 text-center">发展历程</h2>
          <div class="relative">
            <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#5DC4B3] via-[#5DC4B3]/50 to-gray-200"></div>
            <div class="space-y-10">
              {[
                { year: '2024', title: '平台创立', desc: '核心团队组建，完成产品架构设计与核心技术预研。' },
                { year: '2025', title: '产品Beta上线', desc: '身份通、风控通、合约通率先上线Beta版本，开始对接首批机构合作伙伴。' },
                { year: '2026', title: '全面商用化', desc: '9个Agent产品矩阵全面推出，覆盖RBF投资全生命周期。' },
              ].map((item) => (
                <div class="relative pl-16">
                  <div class="absolute left-[18px] top-1 w-3 h-3 rounded-full bg-[#5DC4B3] border-[3px] border-[#5DC4B3]/20"></div>
                  <span class="text-[#5DC4B3] text-xs font-bold">{item.year}</span>
                  <h4 class="text-sm font-bold text-[#1d1d1f] mt-1 mb-1">{item.title}</h4>
                  <p class="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section class="py-16 bg-gray-50">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-xl font-extrabold text-[#1d1d1f] mb-8 text-center">核心价值观</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: 'fa-microscope', title: '技术驱动', desc: 'AI + 数据，让每个环节都更智能' },
              { icon: 'fa-shield-alt', title: '合规透明', desc: '全流程可追溯，数据全透明' },
              { icon: 'fa-users', title: '双向赋能', desc: '投资者和融资者各取所需' },
              { icon: 'fa-infinity', title: '无限扩展', desc: '通用架构，行业覆盖无上限' },
            ].map((v) => (
              <div class="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all">
                <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#5DC4B3]/10 flex items-center justify-center">
                  <i class={`fas ${v.icon} text-[#5DC4B3] text-lg`}></i>
                </div>
                <h4 class="text-sm font-bold text-[#1d1d1f] mb-1">{v.title}</h4>
                <p class="text-xs text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
