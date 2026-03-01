import type { FC } from 'hono/jsx'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

/*
 * 新闻动态 — 优雅占位版
 * Sam后续提供实际新闻内容
 */

interface NewsItem {
  date: string
  category: string
  categoryClass: string
  categoryIcon: string
  title: string
  summary: string
}

const newsItems: NewsItem[] = [
  {
    date: '2026-02-25',
    category: '产品动态',
    categoryClass: 'bg-[#5DC4B3]/10 text-[#5DC4B3]',
    categoryIcon: 'fa-rocket',
    title: '全线9个Agent产品矩阵正式开放商用',
    summary: '经过一年的Beta测试与迭代优化，滴灌通超级Agent平台全线产品正式面向机构投资者和融资企业开放，覆盖RBF投资全生命周期。'
  },
  {
    date: '2026-02-18',
    category: '战略合作',
    categoryClass: 'bg-blue-50 text-blue-600',
    categoryIcon: 'fa-handshake',
    title: '与多家国际资管机构达成战略合作',
    summary: '平台已与多家亚太区知名资管机构建立深度合作关系，共同拓展收入分成融资在连锁零售、餐饮等消费赛道的应用。'
  },
  {
    date: '2026-02-10',
    category: '技术创新',
    categoryClass: 'bg-teal-50 text-teal-600',
    categoryIcon: 'fa-brain',
    title: 'AI筛选引擎升级：支持投资者个性化评估模型',
    summary: '评估通和风控通完成重大技术升级，投资者可自定义AI评估模型和风控规则，实现真正的个性化项目筛选。'
  },
  {
    date: '2026-01-28',
    category: '行业洞察',
    categoryClass: 'bg-amber-50 text-amber-600',
    categoryIcon: 'fa-lightbulb',
    title: '收入分成融资(RBF)：2026行业趋势展望',
    summary: '深入分析RBF在全球及中国市场的发展趋势、监管动向与技术创新方向，展望AI驱动的下一代投融资基础设施。'
  },
]

export const NewsPage: FC = () => {
  return (
    <div class="min-h-screen">
      <Navbar active="news" />

      {/* Hero */}
      <section class="relative overflow-hidden bg-gradient-to-br from-[#0a1f1c] via-[#0d2b26] to-[#0f3530] pt-20 pb-16">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(93,196,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(93,196,179,0.3) 1px, transparent 1px); background-size: 60px 60px;"></div>
        <div class="max-w-4xl mx-auto px-4 relative text-center fade-in">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] text-white/50 text-xs font-semibold rounded-full mb-5 border border-white/[0.06]">
            News & Insights
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">新闻动态</h1>
          <p class="text-base text-white/40 max-w-xl mx-auto">
            最新产品进展、战略合作与行业洞察
          </p>
        </div>
      </section>

      {/* News List */}
      <section class="py-16 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="space-y-5">
            {newsItems.map((item) => (
              <a href="#" class="block no-underline group">
                <div class="card-hover rounded-2xl p-6 border border-gray-100">
                  <div class="flex items-center gap-3 mb-3">
                    <span class={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${item.categoryClass}`}>
                      <i class={`fas ${item.categoryIcon} text-[8px]`}></i>
                      {item.category}
                    </span>
                    <span class="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#5DC4B3] transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p class="text-sm text-gray-500 leading-relaxed">{item.summary}</p>
                  <div class="mt-3 flex items-center text-xs font-semibold text-[#5DC4B3] group-hover:gap-3 gap-1.5 transition-all">
                    阅读全文 <i class="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section class="py-14 bg-gray-50">
        <div class="max-w-md mx-auto px-4 text-center">
          <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#5DC4B3]/10 flex items-center justify-center">
            <i class="fas fa-bell text-[#5DC4B3] text-lg"></i>
          </div>
          <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-2">订阅动态</h3>
          <p class="text-sm text-gray-500 mb-5">
            获取最新的产品更新、行业洞察和合作机会
          </p>
          <a href="/contact" class="inline-flex items-center px-6 py-3 bg-[#5DC4B3] hover:bg-[#4AB5A5] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#5DC4B3]/25 transition-all no-underline">
            <i class="fas fa-envelope mr-2"></i>联系我们获取订阅
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
