import { useState, useEffect } from 'react'
import { ensureAuthed } from '@/lib/utils/ensureAuthed'
import { useToast } from '@/lib/hooks/useToast'

export function useRoomAuth() {
  const [authReady, setAuthReady] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    let active = true
    ;(async () => {
      await ensureAuthed({ 
        onError: (msg: string) => showToast({ message: msg, kind: 'error' }) 
      })
    })()
      .catch(() => {})
      .finally(() => {
        if (active) setAuthReady(true)
      })
    return () => {
      active = false
    }
  }, [showToast])

  return { authReady }
}
