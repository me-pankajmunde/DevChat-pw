import { useEffect, useRef } from 'react'
import { ChatSession, SessionFolder, ChatSettings } from '@/lib/types'
import { createBackup } from '@/lib/persistence'
import { toast } from 'sonner'

const AUTO_BACKUP_INTERVAL = 30 * 60 * 1000
const MIN_CHANGES_FOR_BACKUP = 5

export function useAutoBackup(
  sessions: ChatSession[],
  folders: SessionFolder[],
  settings: ChatSettings | null,
  enabled: boolean = true
) {
  const lastBackupRef = useRef<number>(0)
  const changeCountRef = useRef<number>(0)
  const previousSessionsRef = useRef<ChatSession[]>(sessions)

  useEffect(() => {
    if (!enabled) return

    const sessionCount = sessions.length
    const previousSessionCount = previousSessionsRef.current.length
    
    if (sessionCount !== previousSessionCount) {
      changeCountRef.current++
    } else {
      const messagesChanged = sessions.some((session, index) => {
        const previousSession = previousSessionsRef.current[index]
        return !previousSession || session.messages.length !== previousSession.messages.length
      })
      
      if (messagesChanged) {
        changeCountRef.current++
      }
    }

    previousSessionsRef.current = sessions
  }, [sessions, enabled])

  useEffect(() => {
    if (!enabled) return

    const intervalId = setInterval(async () => {
      const now = Date.now()
      const timeSinceLastBackup = now - lastBackupRef.current
      
      if (
        timeSinceLastBackup >= AUTO_BACKUP_INTERVAL &&
        changeCountRef.current >= MIN_CHANGES_FOR_BACKUP &&
        sessions.length > 0
      ) {
        try {
          await createBackup(sessions, folders, settings)
          lastBackupRef.current = now
          changeCountRef.current = 0
          console.log('Auto-backup created successfully')
        } catch (error) {
          console.error('Auto-backup failed:', error)
        }
      }
    }, 60000)

    return () => clearInterval(intervalId)
  }, [sessions, folders, settings, enabled])

  const triggerManualBackup = async () => {
    try {
      await createBackup(sessions, folders, settings)
      lastBackupRef.current = Date.now()
      changeCountRef.current = 0
      toast.success('Backup created successfully')
    } catch (error) {
      toast.error('Failed to create backup')
    }
  }

  return { triggerManualBackup }
}
