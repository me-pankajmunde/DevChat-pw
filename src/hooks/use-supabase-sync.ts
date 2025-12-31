import { useEffect, useRef } from 'react'
import { ChatSession, SessionFolder, ChatSettings } from '@/lib/types'
import { 
  uploadToSupabase, 
  isAutoSyncEnabled, 
  getAutoSyncInterval,
  checkSupabaseAuth,
  getSyncStatus,
  updateSyncStatus,
} from '@/lib/supabase'
import { toast } from 'sonner'

export function useSupabaseAutoSync(
  sessions: ChatSession[],
  folders: SessionFolder[],
  settings: ChatSettings | null,
  enabled: boolean = true
) {
  const lastSyncRef = useRef<number>(0)
  const changeCountRef = useRef<number>(0)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataHashRef = useRef<string>('')

  const getDataHash = (
    sessions: ChatSession[],
    folders: SessionFolder[],
    settings: ChatSettings | null
  ): string => {
    return JSON.stringify({ sessions, folders, settings })
  }

  const performAutoSync = async () => {
    try {
      const autoSyncEnabled = await isAutoSyncEnabled()
      if (!autoSyncEnabled || !enabled) return

      const isAuthenticated = await checkSupabaseAuth()
      if (!isAuthenticated) return

      const syncStatus = await getSyncStatus()
      if (syncStatus.syncInProgress) return

      const currentHash = getDataHash(sessions, folders, settings)
      
      if (currentHash === lastDataHashRef.current) {
        return
      }

      const interval = await getAutoSyncInterval()
      const now = Date.now()
      const timeSinceLastSync = now - lastSyncRef.current

      if (timeSinceLastSync < interval * 60 * 1000) {
        changeCountRef.current++
        lastDataHashRef.current = currentHash
        return
      }

      if (changeCountRef.current < 1 && lastSyncRef.current > 0) {
        return
      }

      await updateSyncStatus({ syncInProgress: true })

      await uploadToSupabase(sessions, folders, settings)
      
      lastSyncRef.current = now
      changeCountRef.current = 0
      lastDataHashRef.current = currentHash

      await updateSyncStatus({
        syncInProgress: false,
        lastSyncTime: now,
        lastSyncSuccess: true,
      })

      toast.success('Auto-sync completed', {
        description: 'Your data has been backed up to Supabase',
        duration: 3000,
      })
    } catch (error) {
      console.error('Auto-sync failed:', error)
      await updateSyncStatus({
        syncInProgress: false,
        lastSyncSuccess: false,
      })
    }
  }

  useEffect(() => {
    if (!enabled) return

    const checkAndSync = async () => {
      const autoSyncEnabled = await isAutoSyncEnabled()
      if (!autoSyncEnabled) return

      const interval = await getAutoSyncInterval()
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
      }

      intervalIdRef.current = setInterval(() => {
        performAutoSync()
      }, Math.max(interval * 60 * 1000, 60000))

      performAutoSync()
    }

    checkAndSync()

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [enabled, sessions.length, folders.length])

  useEffect(() => {
    const currentHash = getDataHash(sessions, folders, settings)
    if (currentHash !== lastDataHashRef.current && lastDataHashRef.current !== '') {
      changeCountRef.current++
    }
    lastDataHashRef.current = currentHash
  }, [sessions, folders, settings])
}
