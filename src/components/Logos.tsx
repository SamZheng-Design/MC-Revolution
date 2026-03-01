import type { FC } from 'hono/jsx'

/*
 * 滴灌通 Micro Connect — 品牌设计规范
 * 
 * 核心品牌元素（严格从主Logo提取）：
 * 1. Teal 圆点 #4ECDC4 — 纯色填充，无渐变，无阴影，无描边
 * 2. 圆点替代字母 "O" — 这是品牌的标志性设计
 * 3. 纯黑色文字 #000000 — 粗体几何无衬线体 (Extra Bold / 800)
 * 4. 中文: 黑体，与英文同等视觉重量
 * 5. 左对齐堆叠排版
 * 
 * 所有子品牌Logo必须继承此设计语言：
 * - 英文名中的 "O" 统一用 teal 圆点替代
 * - "Connect" 中的 "O" 用 teal 圆点替代
 * - 纯黑 + Teal 双色配色方案
 */

const TEAL = '#5DC4B3'
const BLACK = '#1d1d1f'

// ============================================
// 主品牌 Logo: MICRO CONNECT 滴灌通
// ============================================
export const BrandLogo: FC<{ height?: number }> = ({ height = 44 }) => {
  return (
    <svg viewBox="0 0 220 78" height={height} xmlns="http://www.w3.org/2000/svg" aria-label="Micro Connect 滴灌通">
      {/* MICR + teal circle replacing O */}
      <text x="0" y="27" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="28" font-weight="800" fill={BLACK} letter-spacing="-0.5">MICR</text>
      <circle cx="103" cy="18" r="10" fill={TEAL} />
      {/* C + teal circle replacing O + NNECT */}
      <text x="0" y="55" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="28" font-weight="800" fill={BLACK} letter-spacing="-0.5">C</text>
      <circle cx="33" cy="46" r="10" fill={TEAL} />
      <text x="46" y="55" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="28" font-weight="800" fill={BLACK} letter-spacing="-0.5">NNECT</text>
      {/* 滴灌通 */}
      <text x="0" y="74" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="14" font-weight="700" fill={BLACK}>滴灌通</text>
    </svg>
  )
}

// ============================================
// 9个"通"产品Logo — 严格遵循品牌设计语言
// 
// 设计逻辑：
// - 第一行：英文名（粗体），O用teal圆点替代
// - 第二行：C●NNECT（统一后缀，O用teal圆点）
// - 第三行：中文名（粗体黑体）
// - 纯黑 + Teal 双色，无其他颜色
// ============================================

// 英文名中O的位置映射（精确计算每个单词中O的替换位置）
interface OPosition {
  // 在完整英文名中，O之前的文字
  beforeO: string
  // O之后的文字
  afterO: string
  // O之前文字的像素宽度（近似值，用于圆点定位）
  xBeforeO: number
  // 是否有O字母需要替换（有些词如Risk没有O）
  hasO: boolean
}

function getOPosition(word: string): OPosition {
  const idx = word.toUpperCase().indexOf('O')
  if (idx === -1) {
    return { beforeO: word.toUpperCase(), afterO: '', xBeforeO: 0, hasO: false }
  }
  return {
    beforeO: word.toUpperCase().substring(0, idx),
    afterO: word.toUpperCase().substring(idx + 1),
    xBeforeO: idx * 13.5, // 近似每字符宽度
    hasO: true
  }
}

// 产品Logo - 大尺寸 (用于Portal页面卡片和Placeholder页面)
export const ProductLogo: FC<{
  name: string       // 中文名：身份通
  englishShort: string  // 英文短名：Identity
  size?: number
  className?: string
}> = ({ name, englishShort, size = 80, className = '' }) => {
  const o = getOPosition(englishShort)
  const enUpper = englishShort.toUpperCase()
  // 计算viewBox宽度适配
  const vw = Math.max(200, enUpper.length * 18 + 20)
  
  return (
    <div
      class={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={`width:${size}px;height:${size}px;`}
    >
      <svg viewBox={`0 0 ${vw} 200`} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* 白色背景 + 细边框 */}
        <rect width={vw} height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5" />
        
        {/* 英文名 - 第一行 */}
        {o.hasO ? (
          <>
            {/* O之前的文字 */}
            {o.beforeO && (
              <text x={vw/2 - (enUpper.length * 6.5)/2} y="68" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="22" font-weight="800" fill={BLACK} letter-spacing="0.5">{o.beforeO}</text>
            )}
            {/* Teal圆点替代O */}
            <circle 
              cx={vw/2 - (enUpper.length * 6.5)/2 + o.xBeforeO + 7} 
              cy="60" 
              r="8" 
              fill={TEAL} 
            />
            {/* O之后的文字 */}
            {o.afterO && (
              <text x={vw/2 - (enUpper.length * 6.5)/2 + o.xBeforeO + 19} y="68" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="22" font-weight="800" fill={BLACK} letter-spacing="0.5">{o.afterO}</text>
            )}
          </>
        ) : (
          <>
            {/* 没有O的词：直接显示 + 在末尾加一个teal圆点装饰 */}
            <text x={vw/2} y="68" text-anchor="middle" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="22" font-weight="800" fill={BLACK} letter-spacing="0.5">{enUpper}</text>
            <circle cx={vw/2 + enUpper.length * 6.5 + 4} cy="58" r="6" fill={TEAL} />
          </>
        )}
        
        {/* C●NNECT - 第二行：统一后缀 */}
        <text x={vw/2 - 48} y="102" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="15" font-weight="800" fill={BLACK} letter-spacing="0.3">C</text>
        <circle cx={vw/2 - 30} cy="96" r="5" fill={TEAL} />
        <text x={vw/2 - 22} y="102" font-family="'Inter','Futura','Helvetica Neue',Arial,sans-serif" font-size="15" font-weight="800" fill={BLACK} letter-spacing="0.3">NNECT</text>
        
        {/* 中文名 - 第三行 */}
        <text x={vw/2} y="150" text-anchor="middle" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="36" font-weight="700" fill={BLACK}>{name}</text>
        
        {/* 底部teal细线 */}
        <rect x={vw/2 - 30} y="165" width="60" height="2.5" rx="1.25" fill={TEAL} />
      </svg>
    </div>
  )
}

// 产品Logo - 小尺寸 (用于架构总览卡片)
export const ProductLogoSmall: FC<{
  name: string
  englishShort: string
  size?: number
}> = ({ name, englishShort, size = 48 }) => {
  const firstChar = name.charAt(0)
  
  return (
    <div
      class="inline-flex items-center justify-center flex-shrink-0"
      style={`width:${size}px;height:${size}px;`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="14" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5" />
        {/* 标志性 teal 圆点 */}
        <circle cx="76" cy="22" r="10" fill={TEAL} />
        {/* 中文首字 */}
        <text x="42" y="62" text-anchor="middle" dominant-baseline="middle" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="34" font-weight="700" fill={BLACK}>{firstChar}</text>
        {/* 底部小圆点 */}
        <circle cx="24" cy="82" r="4" fill={TEAL} opacity="0.4" />
      </svg>
    </div>
  )
}

// 产品Logo - 流程图尺寸 (用于Y型流程图)
export const ProductLogoFlow: FC<{
  name: string
  englishShort: string
  size?: number
}> = ({ name, englishShort, size = 40 }) => {
  const firstChar = name.charAt(0)
  
  return (
    <div
      class="inline-flex items-center justify-center flex-shrink-0"
      style={`width:${size}px;height:${size}px;`}
    >
      <svg viewBox="0 0 80 80" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" rx="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5" />
        {/* teal 圆点 */}
        <circle cx="62" cy="18" r="8" fill={TEAL} />
        {/* 中文首字 */}
        <text x="36" y="50" text-anchor="middle" dominant-baseline="middle" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="28" font-weight="700" fill={BLACK}>{firstChar}</text>
      </svg>
    </div>
  )
}
