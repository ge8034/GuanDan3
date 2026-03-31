import { logger } from './logger'

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        return true
      } catch (err) {
        logger.error('复制失败:', { err })
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (err) {
    logger.error('复制失败:', { err })
    return false
  }
}
