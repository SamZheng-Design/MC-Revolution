import type { FC } from 'hono/jsx'
import { products, statusLabels } from '../data'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProductLogo } from '../components/Logos'

const roleLabels: Record<string, { text: string; icon: string; class: string }> = {
  shared: { text: '统一入口', icon: 'fa-sign-in-alt', class: 'bg-blue-50 text-blue-600 border-blue-200' },
  borrower: { text: '融资者专属', icon: 'fa-upload', class: 'bg-amber-50 text-amber-600 border-amber-200' },
  investor: { text: '投资者专属', icon: 'fa-filter', class: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  collaborative: { text: '投融资协同', icon: 'fa-handshake', class: 'bg-[#5DC4B3]/10 text-[#5DC4B3] border-[#5DC4B3]/20' },
}

export const PlaceholderPage: FC<{ productId: string }> = ({ productId }) => {
  const product = products.find(p => p.id === productId)
  if (!product) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold text-gray-300 mb-4">404</h1>
          <p class="text-gray-500 mb-6">产品模块未找到</p>
          <a href="/portal" class="text-[#5DC4B3] hover:underline font-semibold">返回产品入口</a>
        </div>
      </div>
    )
  }

  const role = roleLabels[product.role]

  return (
    <div class="min-h-screen">
      <Navbar active="" />

      {/* Hero */}
      <section class="relative overflow-hidden pt-16 pb-12 bg-gradient-to-br from-white via-gray-50 to-[#5DC4B3]/5">
        <div class="absolute inset-0 dot-pattern opacity-20"></div>
        <div class="max-w-4xl mx-auto px-4 relative text-center">
          <div class="mb-6 flex justify-center">
            <ProductLogo name={product.name} englishShort={product.englishShort} size={96} />
          </div>

          <span class={`inline-flex items-center text-xs px-3 py-1 rounded-full border font-medium mb-4 ${statusLabels[product.status].class}`}>
            {statusLabels[product.status].text}
          </span>

          <h1 class="text-3xl font-extrabold text-[#1d1d1f] mb-1">{product.name}</h1>
          <p class="text-sm text-gray-400 mb-4">{product.englishName}</p>
          <p class="text-base text-gray-500 max-w-lg mx-auto leading-relaxed">{product.description}</p>

          <div class="mt-4 flex justify-center gap-2">
            <span class="inline-flex items-center text-xs px-3 py-1 rounded-lg font-semibold bg-[#5DC4B3]/10 text-[#5DC4B3] border border-[#5DC4B3]/20">
              <i class="fas fa-layer-group mr-1.5"></i>{product.category}
            </span>
            {role && (
              <span class={`inline-flex items-center text-xs px-3 py-1 rounded-lg font-semibold border ${role.class}`}>
                <i class={`fas ${role.icon} mr-1.5`}></i>{role.text}
              </span>
            )}
            {product.isFilter && (
              <span class="inline-flex items-center text-xs px-3 py-1 rounded-lg font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200">
                <i class="fas fa-robot mr-1.5"></i>AI筛子工作流
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section class="py-12 bg-white">
        <div class="max-w-4xl mx-auto px-4">
          <h2 class="text-xl font-extrabold text-[#1d1d1f] mb-6 text-center">核心功能</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.features.map((feature, idx) => (
              <div class="card-hover flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span class="text-sm font-bold text-[#5DC4B3]">{String(idx + 1).padStart(2, '0')}</span>
                </div>
                <span class="text-sm font-medium text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section class="py-16 bg-gray-50">
        <div class="max-w-md mx-auto px-4 text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <i class="fas fa-tools text-3xl text-[#5DC4B3]"></i>
          </div>
          <h3 class="text-lg font-extrabold text-[#1d1d1f] mb-2">功能开发中</h3>
          <p class="text-sm text-gray-500 mb-8 leading-relaxed">
            {product.name}（{product.englishName}）正在紧锣密鼓地开发中，敬请期待完整功能上线。
          </p>
          <a
            href="/portal"
            class="inline-flex items-center px-6 py-3 bg-[#5DC4B3] hover:bg-[#3DBDB5] text-white font-bold rounded-xl shadow-lg shadow-[#5DC4B3]/25 transition-all no-underline"
          >
            <i class="fas fa-arrow-left mr-2"></i>返回产品入口
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
