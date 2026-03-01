import { Hono } from 'hono'
import { renderer } from './renderer'
import { HomePage } from './pages/HomePage'
import { DesignPage } from './pages/DesignPage'
import { PortalPage } from './pages/PortalPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { AssessPage } from './pages/AssessPage'
import { AboutPage } from './pages/AboutPage'
import { TeamPage } from './pages/TeamPage'
import { NewsPage } from './pages/NewsPage'
import { ContactPage } from './pages/ContactPage'
import { platformDeals, industryLabels, dealStatusLabels, cashflowFrequencyLabels } from './data/deals-data'

const LLM_PROXY = 'http://127.0.0.1:3001'

const app = new Hono()

app.use(renderer)

// Homepage — 官网首页
app.get('/', (c) => {
  return c.render(<HomePage />, { title: 'Micro Connect 滴灌通 | 收入分成投资的操作系统' })
})

// Page 1: Design philosophy — 产品设计思路（L1核心页面，不动）
app.get('/design', (c) => {
  return c.render(<DesignPage />, { title: '产品设计思路 - Micro Connect 滴灌通' })
})

// Page 2: Product portal — 产品入口（L1核心页面，不动）
app.get('/portal', (c) => {
  return c.render(<PortalPage />, { title: '产品入口 - Micro Connect 滴灌通' })
})

// Company pages
app.get('/about', (c) => {
  return c.render(<AboutPage />, { title: '关于我们 - Micro Connect 滴灌通' })
})

app.get('/team', (c) => {
  return c.render(<TeamPage />, { title: '核心团队 - Micro Connect 滴灌通' })
})

app.get('/news', (c) => {
  return c.render(<NewsPage />, { title: '新闻动态 - Micro Connect 滴灌通' })
})

app.get('/contact', (c) => {
  return c.render(<ContactPage />, { title: '联系我们 - Micro Connect 滴灌通' })
})

// ==================== 本地 Deals API ====================
// 返回平台标的数据（来自 MC-Awesome-Project seed）

app.get('/api/deals', (c) => {
  const status = c.req.query('status')
  const industry = c.req.query('industry')
  let deals = platformDeals
  if (status) deals = deals.filter(d => d.status === status)
  if (industry) deals = deals.filter(d => d.industry === industry)
  // 返回简要列表（不含 project_documents，减少传输体积）
  const list = deals.map(d => ({
    id: d.id,
    company_name: d.company_name,
    industry: d.industry,
    industry_sub: d.industry_sub,
    industry_label: industryLabels[d.industry] || d.industry,
    status: d.status,
    status_label: dealStatusLabels[d.status]?.text || d.status,
    status_color: dealStatusLabels[d.status]?.color || '',
    region: d.region,
    city: d.city,
    funding_amount: d.funding_amount,
    investment_period_months: d.investment_period_months,
    revenue_share_ratio: d.revenue_share_ratio,
    cashflow_frequency: d.cashflow_frequency,
    cashflow_frequency_label: cashflowFrequencyLabels[d.cashflow_frequency] || d.cashflow_frequency,
    submitted_date: d.submitted_date
  }))
  return c.json({ success: true, data: list, total: list.length })
})

app.get('/api/deals/:id', (c) => {
  const id = c.req.param('id')
  const deal = platformDeals.find(d => d.id === id)
  if (!deal) return c.json({ success: false, error: '标的不存在' }, 404)
  return c.json({ success: true, data: deal })
})

// ==================== 评估通 API 代理 ====================
// 转发到 llm-proxy:3001，真正执行 Agent 工作流

app.post('/api/assess/start', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const resp = await fetch(`${LLM_PROXY}/agent/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return c.json(await resp.json(), resp.status as 200)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

app.get('/api/assess/progress/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId')
    const cursor = c.req.query('cursor') || '0'
    const resp = await fetch(`${LLM_PROXY}/agent/progress/${jobId}?cursor=${cursor}`)
    return c.json(await resp.json(), resp.status as 200)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ==================== Product pages ====================

// 评估通 — 独立页面（功能已集成至 dgt-intelligence-platform）
app.get('/assess', (c) => {
  return c.render(<AssessPage />, { title: '评估通 - Micro Connect 滴灌通' })
})

// dgt 平台 API 代理（供 L1 评估通入口调用）
// GET /api/dgt/deals → dgt平台 GET /api/deals
// POST /api/dgt/deals → dgt平台 POST /api/deals
// POST /api/dgt/ai/evaluate-deal → dgt平台 POST /api/ai/evaluate-deal
const DGT_PLATFORM = 'http://127.0.0.1:3000'

app.all('/api/dgt/*', async (c) => {
  const subPath = c.req.path.replace('/api/dgt', '/api')
  const qs = c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : ''
  const url = `${DGT_PLATFORM}${subPath}${qs}`
  try {
    const init: RequestInit = { method: c.req.method, headers: { 'Content-Type': 'application/json' } }
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      init.body = await c.req.raw.clone().text()
    }
    const resp = await fetch(url, init)
    const body = await resp.text()
    return new Response(body, {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' }
    })
  } catch (e) {
    return c.json({ error: String(e), note: 'dgt平台未运行，请确认dgt-intelligence-platform已在3002端口启动' }, 502)
  }
})

// 其他 8 个通仍使用 PlaceholderPage
const productIds = [
  'identity', 'application',
  'risk', 'opportunity', 'terms', 'contract',
  'settlement', 'performance'
]

productIds.forEach((id) => {
  app.get(`/${id}`, (c) => {
    return c.render(<PlaceholderPage productId={id} />, { title: `${id} - Micro Connect 滴灌通` })
  })
})

export default app
