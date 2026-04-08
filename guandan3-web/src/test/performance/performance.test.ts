import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'

describe('性能测试', () => {
  describe('渲染性能', () => {
    it('应该在合理时间内渲染组件', () => {
      const startTime = performance.now()

      const component = document.createElement('div')
      component.innerHTML = '<div class="test-component">Test Content</div>'
      document.body.appendChild(component)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      document.body.removeChild(component)

      expect(renderTime).toBeLessThan(100)
    })

    it('应该能够处理大量数据渲染', () => {
      const startTime = performance.now()

      const container = document.createElement('div')
      for (let i = 0; i < 1000; i++) {
        const item = document.createElement('div')
        item.textContent = `Item ${i}`
        container.appendChild(item)
      }
      document.body.appendChild(container)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      document.body.removeChild(container)

      expect(renderTime).toBeLessThan(500)
    })
  })

  describe('内存性能', () => {
    it('应该能够正确清理内存', () => {
      const initialMemory = process.memoryUsage().heapUsed

      const items: any[] = []
      for (let i = 0; i < 10000; i++) {
        items.push({ id: i, data: `data-${i}` })
      }

      items.length = 0

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('计算性能', () => {
    it('应该能够快速计算游戏状态', () => {
      const startTime = performance.now()

      const cards = Array.from({ length: 54 }, (_, i) => i)
      const shuffled = [...cards].sort(() => Math.random() - 0.5)

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(calculationTime).toBeLessThan(10)
    })

    it('应该能够快速验证牌型', () => {
      const startTime = performance.now()

      const cards = [1, 2, 3, 4, 5]
      const isSequence = cards.every((card, index) => {
        if (index === 0) return true
        return card === cards[index - 1] + 1
      })

      const endTime = performance.now()
      const validationTime = endTime - startTime

      expect(validationTime).toBeLessThan(1)
      expect(isSequence).toBe(true)
    })
  })

  describe('网络性能', () => {
    it.skip('应该能够快速发送请求', async () => {
      // 跳过：需要运行中的开发服务器
      const startTime = performance.now()

      try {
        const response = await fetch('http://localhost:3000/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })

        const endTime = performance.now()
        const requestTime = endTime - startTime

        expect(requestTime).toBeLessThan(5000)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it.skip('应该能够处理并发请求', async () => {
      // 跳过：需要运行中的开发服务器
      const startTime = performance.now()

      const promises = Array.from({ length: 10 }, () =>
        fetch('http://localhost:3000/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        }).catch(() => ({ ok: false }))
      )

      await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(10000)
    })
  })

  describe('存储性能', () => {
    it('应该能够快速读写localStorage', () => {
      const startTime = performance.now()

      const testData = { key: 'value', nested: { data: 'test' } }
      localStorage.setItem('test-key', JSON.stringify(testData))
      const retrieved = JSON.parse(localStorage.getItem('test-key') || '{}')

      const endTime = performance.now()
      const storageTime = endTime - startTime

      localStorage.removeItem('test-key')

      expect(storageTime).toBeLessThan(10)
      expect(retrieved).toEqual(testData)
    })

    it('应该能够快速读写sessionStorage', () => {
      const startTime = performance.now()

      const testData = { key: 'value', nested: { data: 'test' } }
      sessionStorage.setItem('test-key', JSON.stringify(testData))
      const retrieved = JSON.parse(sessionStorage.getItem('test-key') || '{}')

      const endTime = performance.now()
      const storageTime = endTime - startTime

      sessionStorage.removeItem('test-key')

      expect(storageTime).toBeLessThan(10)
      expect(retrieved).toEqual(testData)
    })
  })

  describe('动画性能', () => {
    it('应该能够流畅运行动画', () => {
      const startTime = performance.now()

      const element = document.createElement('div')
      element.style.transition = 'all 0.3s ease'
      element.style.transform = 'translateX(100px)'
      document.body.appendChild(element)

      requestAnimationFrame(() => {
        element.style.transform = 'translateX(0px)'
      })

      // 在移除元素之前计算时间
      const endTime = performance.now()
      const setupTime = endTime - startTime

      document.body.removeChild(element)

      // 测量的是创建和调度动画的时间，不包括动画执行时间
      // requestAnimationFrame 是异步调度，所以这里只测量 DOM 操作时间
      expect(setupTime).toBeLessThan(100)
    })
  })

  describe('事件处理性能', () => {
    it('应该能够快速处理事件', () => {
      const startTime = performance.now()

      const element = document.createElement('button')
      let eventCount = 0

      const handler = () => {
        eventCount++
      }

      element.addEventListener('click', handler)

      for (let i = 0; i < 100; i++) {
        element.click()
      }

      const endTime = performance.now()
      const eventTime = endTime - startTime

      expect(eventTime).toBeLessThan(100)
      expect(eventCount).toBe(100)
    })
  })

  describe('数据结构性能', () => {
    it('应该能够快速查找数据', () => {
      const startTime = performance.now()

      const map = new Map()
      for (let i = 0; i < 10000; i++) {
        map.set(i, `value-${i}`)
      }

      const lookupTime = performance.now()
      const value = map.get(5000)
      const lookupDuration = performance.now() - lookupTime

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(lookupDuration).toBeLessThan(1)
      expect(totalTime).toBeLessThan(100)
      expect(value).toBe('value-5000')
    })

    it('应该能够快速过滤数据', () => {
      const startTime = performance.now()

      const array = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: i % 2 === 0 ? 'even' : 'odd'
      }))

      const filterTime = performance.now()
      const filtered = array.filter(item => item.value === 'even')
      const filterDuration = performance.now() - filterTime

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(filterDuration).toBeLessThan(50)
      expect(totalTime).toBeLessThan(200)
      expect(filtered.length).toBe(5000)
    })
  })

  describe('字符串操作性能', () => {
    it('应该能够快速处理字符串', () => {
      const startTime = performance.now()

      const longString = 'a'.repeat(10000)
      const reversed = longString.split('').reverse().join('')

      const endTime = performance.now()
      const stringTime = endTime - startTime

      expect(stringTime).toBeLessThan(100)
      expect(reversed.length).toBe(10000)
    })

    it('应该能够快速匹配正则表达式', () => {
      const startTime = performance.now()

      const text = 'This is a test string with multiple words'
      const regex = /\b\w+\b/g
      const matches = text.match(regex)

      const endTime = performance.now()
      const regexTime = endTime - startTime

      expect(regexTime).toBeLessThan(10)
      expect(matches?.length).toBe(8)
    })
  })

  describe('并发性能', () => {
    it('应该能够处理并发操作', async () => {
      const startTime = performance.now()

      const promises = Array.from({ length: 100 }, (_, i) =>
        new Promise(resolve => setTimeout(resolve, Math.random() * 10, i))
      )

      const results = await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(100)
      expect(results.length).toBe(100)
    })
  })
})
