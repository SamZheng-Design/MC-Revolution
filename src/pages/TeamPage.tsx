import type { FC } from 'hono/jsx'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

/*
 * 团队页面 — 优雅占位版
 * Sam后续提供实际团队成员照片和简介
 */

interface TeamMember {
  name: string
  title: string
  titleEn: string
  desc: string
  icon: string
  color: string
}

const teamMembers: TeamMember[] = [
  { name: '创始人 / CEO', title: '首席执行官', titleEn: 'CEO', desc: '深耕金融科技领域十余年，曾主导多个大型金融基础设施项目的架构设计与交付。', icon: 'fa-chess-king', color: '#5DC4B3' },
  { name: '联合创始人 / CTO', title: '首席技术官', titleEn: 'CTO', desc: '全栈技术专家，专注于AI/ML与分布式系统架构，推动Agent矩阵核心技术研发。', icon: 'fa-microchip', color: '#5DC4B3' },
  { name: '首席投资官', title: '首席投资官', titleEn: 'CIO', desc: '资深投资管理人，横跨PE/VC与另类投资，具备丰富的RBF与结构化融资经验。', icon: 'fa-chart-pie', color: '#F59E0B' },
  { name: '首席产品官', title: '首席产品官', titleEn: 'CPO', desc: '前头部金融科技公司产品负责人，擅长复杂金融产品的用户体验设计与流程优化。', icon: 'fa-compass', color: '#49A89A' },
]

const advisors: TeamMember[] = [
  { name: '战略顾问', title: '战略顾问', titleEn: 'Strategic Advisor', desc: '前国际投行高管，在资本市场与金融监管领域拥有深厚资源。', icon: 'fa-landmark', color: '#10B981' },
  { name: '技术顾问', title: '技术顾问', titleEn: 'Technical Advisor', desc: '知名AI科学家，曾任大型科技公司AI实验室负责人。', icon: 'fa-brain', color: '#EF4444' },
]

export const TeamPage: FC = () => {
  return (
    <div class="min-h-screen">
      <Navbar active="team" />

      {/* Hero */}
      <section class="relative overflow-hidden bg-gradient-to-br from-[#0a1f1c] via-[#0d2b26] to-[#0f3530] pt-20 pb-16">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(93,196,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(93,196,179,0.3) 1px, transparent 1px); background-size: 60px 60px;"></div>
        <div class="max-w-4xl mx-auto px-4 relative text-center fade-in">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] text-white/50 text-xs font-semibold rounded-full mb-5 border border-white/[0.06]">
            Our Team
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">核心团队</h1>
          <p class="text-base text-white/40 max-w-xl mx-auto">
            汇聚金融、科技、产品三大领域的资深专业人才
          </p>
        </div>
      </section>

      {/* Core Team */}
      <section class="py-16 bg-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-lg font-extrabold text-[#1d1d1f] mb-8 text-center">管理团队</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((m) => (
              <div class="card-hover text-center p-6 rounded-2xl border border-gray-100">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={`background:${m.color}10;`}>
                  <i class={`fas ${m.icon} text-2xl`} style={`color:${m.color};`}></i>
                </div>
                <h3 class="text-base font-bold text-[#1d1d1f]">{m.name}</h3>
                <p class="text-xs font-semibold text-[#5DC4B3] mb-2">{m.titleEn}</p>
                <p class="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisors */}
      <section class="py-14 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-lg font-extrabold text-[#1d1d1f] mb-8 text-center">顾问团队</h2>
          <div class="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {advisors.map((a) => (
              <div class="card-hover flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-white">
                <div class="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={`background:${a.color}10;`}>
                  <i class={`fas ${a.icon} text-lg`} style={`color:${a.color};`}></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#1d1d1f]">{a.name}</h3>
                  <p class="text-xs text-[#5DC4B3] font-semibold mb-1">{a.titleEn}</p>
                  <p class="text-xs text-gray-500">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section class="py-16 bg-white">
        <div class="max-w-md mx-auto px-4 text-center">
          <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#5DC4B3]/10 flex items-center justify-center">
            <i class="fas fa-user-plus text-[#5DC4B3] text-xl"></i>
          </div>
          <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-2">加入我们</h3>
          <p class="text-sm text-gray-500 mb-6">
            我们正在寻找对金融科技充满热情的人才。如果你想用技术改变投资行业，欢迎联系。
          </p>
          <a href="/contact" class="inline-flex items-center px-6 py-3 bg-[#5DC4B3] hover:bg-[#4AB5A5] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#5DC4B3]/25 transition-all no-underline">
            <i class="fas fa-envelope mr-2"></i>联系我们
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
