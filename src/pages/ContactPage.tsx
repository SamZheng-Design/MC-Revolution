import type { FC } from 'hono/jsx'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

/*
 * 联系我们 — 优雅占位版
 * Sam后续提供实际联系方式
 */

export const ContactPage: FC = () => {
  return (
    <div class="min-h-screen">
      <Navbar active="contact" />

      {/* Hero */}
      <section class="relative overflow-hidden bg-gradient-to-br from-[#0a1f1c] via-[#0d2b26] to-[#0f3530] pt-20 pb-16">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(93,196,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(93,196,179,0.3) 1px, transparent 1px); background-size: 60px 60px;"></div>
        <div class="max-w-4xl mx-auto px-4 relative text-center fade-in">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] text-white/50 text-xs font-semibold rounded-full mb-5 border border-white/[0.06]">
            Contact Us
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">联系我们</h1>
          <p class="text-base text-white/40 max-w-xl mx-auto">
            无论您是投资者、融资企业还是潜在合作伙伴，我们期待与您对话
          </p>
        </div>
      </section>

      {/* Contact Cards — 双入口 */}
      <section class="py-16 bg-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-2 gap-8 mb-14">
            {/* Investor inquiry */}
            <div class="rounded-2xl border-2 border-gray-100 p-8 hover:border-indigo-200 hover:shadow-xl transition-all group bg-gradient-to-br from-white to-indigo-50/20">
              <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <i class="fas fa-chart-pie text-indigo-500 text-xl"></i>
              </div>
              <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-2">投资者咨询</h3>
              <p class="text-sm text-gray-500 leading-relaxed mb-5">
                了解产品功能、申请产品演示、获取投资白皮书
              </p>
              <div class="space-y-3">
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <i class="fas fa-envelope text-indigo-400 text-xs w-5 text-center"></i>
                  <span>investor@microconnect.com</span>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <i class="fas fa-phone text-indigo-400 text-xs w-5 text-center"></i>
                  <span>+852 2668 0268</span>
                </div>
              </div>
              <div class="mt-6">
                <a href="#" class="inline-flex items-center px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all no-underline shadow-sm">
                  <i class="fas fa-calendar-alt mr-2 text-xs"></i>预约演示
                </a>
              </div>
            </div>

            {/* Business inquiry */}
            <div class="rounded-2xl border-2 border-gray-100 p-8 hover:border-amber-200 hover:shadow-xl transition-all group bg-gradient-to-br from-white to-amber-50/20">
              <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <i class="fas fa-store text-amber-500 text-xl"></i>
              </div>
              <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-2">融资企业咨询</h3>
              <p class="text-sm text-gray-500 leading-relaxed mb-5">
                了解融资流程、提交融资申请、对接合作资源
              </p>
              <div class="space-y-3">
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <i class="fas fa-envelope text-amber-400 text-xs w-5 text-center"></i>
                  <span>business@microconnect.com</span>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  <i class="fas fa-phone text-amber-400 text-xs w-5 text-center"></i>
                  <span>+852 2668 0268</span>
                </div>
              </div>
              <div class="mt-6">
                <a href="#" class="inline-flex items-center px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all no-underline shadow-sm">
                  <i class="fas fa-file-alt mr-2 text-xs"></i>提交申请
                </a>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div class="grid md:grid-cols-3 gap-6">
            <div class="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all">
              <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <i class="fas fa-envelope text-[#5DC4B3] text-lg"></i>
              </div>
              <h4 class="text-sm font-bold text-[#1d1d1f] mb-1">一般查询</h4>
              <p class="text-xs text-gray-500">info@microconnect.com</p>
            </div>
            <div class="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all">
              <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <i class="fas fa-map-marker-alt text-[#5DC4B3] text-lg"></i>
              </div>
              <h4 class="text-sm font-bold text-[#1d1d1f] mb-1">办公地址</h4>
              <p class="text-xs text-gray-500">
                香港中环康乐广场8号<br />交易广场2期 2105-2108室
              </p>
            </div>
            <div class="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all">
              <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <i class="fas fa-clock text-[#5DC4B3] text-lg"></i>
              </div>
              <h4 class="text-sm font-bold text-[#1d1d1f] mb-1">工作时间</h4>
              <p class="text-xs text-gray-500">
                周一至周五 9:00 - 18:00<br />(HKT / GMT+8)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social */}
      <section class="py-14 bg-gray-50">
        <div class="max-w-md mx-auto px-4 text-center">
          <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-6">关注我们</h3>
          <div class="flex items-center justify-center gap-4">
            {[
              { icon: 'fab fa-linkedin-in', label: 'LinkedIn', color: 'hover:bg-blue-600' },
              { icon: 'fab fa-twitter', label: 'Twitter', color: 'hover:bg-sky-500' },
              { icon: 'fab fa-weixin', label: 'WeChat', color: 'hover:bg-green-500' },
            ].map((s) => (
              <a href="#" class={`w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 ${s.color} hover:text-white hover:border-transparent transition-all no-underline shadow-sm`} title={s.label}>
                <i class={`${s.icon} text-lg`}></i>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
