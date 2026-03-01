import { Hono } from 'hono'
import { renderer } from './renderer'
import { AssessPage } from './pages/AssessPage'
import { LoginPage } from './pages/LoginPage'
import { platformDeals, industryLabels, dealStatusLabels, cashflowFrequencyLabels } from './data/deals-data'

const LLM_PROXY = 'http://127.0.0.1:3001'

const app = new Hono()

app.use(renderer)

// ==================== 评估通独立入口 ====================
// 进入即为登录页，登录成功后跳转至 /assess

app.get('/', (c) => {
  return c.render(<LoginPage />, { title: 'Assess Connect · 评估通 | 登录' })
})

// ==================== 评估通主页面 ====================
app.get('/assess', (c) => {
  return c.render(<AssessPage />, { title: 'Assess Connect · 评估通' })
})

// ==================== 本地 Deals API ====================
app.get('/api/deals', (c) => {
  const status = c.req.query('status')
  const industry = c.req.query('industry')
  let deals = platformDeals
  if (status) deals = deals.filter(d => d.status === status)
  if (industry) deals = deals.filter(d => d.industry === industry)
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

// ==================== DGT 平台代理 ====================
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

export default app
