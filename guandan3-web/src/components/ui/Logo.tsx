'use client'

import { useState, useEffect } from 'react'

export interface LogoProps {
  /** Logo 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 额外的样式 */
  style?: React.CSSProperties
  /** 是否显示文字 */
  showText?: boolean
  /** 是否启用动画 */
  animated?: boolean
}

const sizeMap = {
  sm: { width: 32, height: 32, textSize: '1.125rem' },
  md: { width: 48, height: 48, textSize: '1.5rem' },
  lg: { width: 64, height: 64, textSize: '1.875rem' },
  xl: { width: 96, height: 96, textSize: '3rem' },
}

/**
 * Logo 组件
 *
 * 游戏品牌标识
 */
export function Logo({ size = 'md', style = {}, showText = false, animated = false }: LogoProps) {
  const [rotation, setRotation] = useState(0)

  const { width, height, textSize } = sizeMap[size]

  // 动画效果
  useEffect(() => {
    if (!animated) return

    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360)
    }, 55) // 20秒完整旋转 = 360 * 55ms

    return () => clearInterval(interval)
  }, [animated])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...style }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ color: '#d4af37', transform: animated ? `rotate(${rotation}deg)` : undefined }}
      >
        {/* 外圈 - 扑克牌边框 */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="8"
          style={{ stroke: 'currentColor', strokeWidth: 3, fill: 'currentColor', fillOpacity: 0.1 }}
        />
        {/* 内圈装饰 */}
        <rect
          x="12"
          y="12"
          width="76"
          height="76"
          rx="4"
          style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}
        />
        {/* 中心文字 "掼" */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          style={{ fill: 'currentColor', stroke: 'currentColor', fontSize: 28, fontWeight: 'bold', fontFamily: 'var(--font-noto-serif-sc), serif' }}
        >
          掼
        </text>
        {/* 角落装饰 - 左上 */}
        <text
          x="18"
          y="24"
          style={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }}
        >
          3
        </text>
        {/* 角落装饰 - 右下（倒置） */}
        <g transform="rotate(180, 82, 76)">
          <text
            x="82"
            y="80"
            style={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold', textAnchor: 'middle' }}
          >
            3
          </text>
        </g>
      </svg>

      {showText && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.2,
            fontFamily: 'var(--font-noto-serif-sc), serif',
          }}
        >
          掼蛋<span style={{ color: '#d4af37' }}>叁</span>
        </span>
      )}
    </div>
  )
}

export default Logo
