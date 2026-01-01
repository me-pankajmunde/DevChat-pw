import { ChatSession, SessionFolder, ChatSettings } from './types'
import { kv } from '@/hooks/use-kv'

export interface BackupData {
  version: string
  timestamp: number
  sessions: ChatSession[]
  folders: SessionFolder[]
  settings: ChatSettings | null
}

export interface StorageStats {
  totalSessions: number
  totalMessages: number
  totalFolders: number
  oldestSession: number | null
  newestSession: number | null
  estimatedSize: string
}

const BACKUP_KEY_PREFIX = 'backup-'
const MAX_BACKUPS = 5
const CURRENT_VERSION = '1.0.0'

export async function createBackup(
  sessions: ChatSession[],
  folders: SessionFolder[],
  settings: ChatSettings | null
): Promise<string> {
  const backup: BackupData = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    sessions,
    folders,
    settings
  }

  const backupKey = `${BACKUP_KEY_PREFIX}${backup.timestamp}`
  await kv.set(backupKey, backup)

  await cleanupOldBackups()

  return backupKey
}

export async function listBackups(): Promise<Array<{ key: string; timestamp: number; version: string }>> {
  const keys = await kv.keys()
  const backupKeys = keys.filter(key => key.startsWith(BACKUP_KEY_PREFIX))
  
  const backups = await Promise.all(
    backupKeys.map(async (key) => {
      const data = await kv.get<BackupData>(key)
      return {
        key,
        timestamp: data?.timestamp || 0,
        version: data?.version || 'unknown'
      }
    })
  )

  return backups.sort((a, b) => b.timestamp - a.timestamp)
}

export async function restoreBackup(backupKey: string): Promise<BackupData | null> {
  const backup = await kv.get<BackupData>(backupKey)
  return backup || null
}

export async function deleteBackup(backupKey: string): Promise<void> {
  await kv.delete(backupKey)
}

async function cleanupOldBackups(): Promise<void> {
  const backups = await listBackups()
  
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS)
    await Promise.all(toDelete.map(backup => kv.delete(backup.key)))
  }
}

export async function getStorageStats(
  sessions: ChatSession[],
  folders: SessionFolder[]
): Promise<StorageStats> {
  const totalSessions = sessions.length
  const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0)
  const totalFolders = folders.length

  const timestamps = sessions.map(s => s.createdAt).filter(Boolean)
  const oldestSession = timestamps.length > 0 ? Math.min(...timestamps) : null
  const newestSession = timestamps.length > 0 ? Math.max(...timestamps) : null

  const dataSize = JSON.stringify({ sessions, folders }).length
  const estimatedSize = formatBytes(dataSize)

  return {
    totalSessions,
    totalMessages,
    totalFolders,
    oldestSession,
    newestSession,
    estimatedSize
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export async function cleanupOldSessions(
  sessions: ChatSession[],
  daysToKeep: number
): Promise<ChatSession[]> {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
  return sessions.filter(session => session.updatedAt > cutoffTime)
}

export async function exportAllData(): Promise<string> {
  const sessions = await kv.get<ChatSession[]>('chat-sessions') || []
  const folders = await kv.get<SessionFolder[]>('session-folders') || []
  const settings = await kv.get<ChatSettings | null>('chat-settings') || null

  const exportData: BackupData = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    sessions,
    folders,
    settings
  }

  return JSON.stringify(exportData, null, 2)
}

export async function importAllData(jsonData: string): Promise<{
  sessions: ChatSession[]
  folders: SessionFolder[]
  settings: ChatSettings | null
}> {
  const importData: BackupData = JSON.parse(jsonData)

  if (!importData.version) {
    throw new Error('Invalid backup format')
  }

  return {
    sessions: importData.sessions || [],
    folders: importData.folders || [],
    settings: importData.settings || null
  }
}

export async function clearAllData(): Promise<void> {
  await kv.delete('chat-sessions')
  await kv.delete('session-folders')
  await kv.delete('chat-settings')
  await kv.delete('current-session-id')
  
  const backups = await listBackups()
  await Promise.all(backups.map(backup => kv.delete(backup.key)))
}

export function validateSession(session: ChatSession): boolean {
  return !!(
    session.id &&
    session.title &&
    Array.isArray(session.messages) &&
    typeof session.createdAt === 'number' &&
    typeof session.updatedAt === 'number'
  )
}

export function validateFolder(folder: SessionFolder): boolean {
  return !!(
    folder.id &&
    folder.name &&
    typeof folder.createdAt === 'number'
  )
}

export async function repairData(): Promise<{
  sessionsRepaired: number
  foldersRepaired: number
  sessionsRemoved: number
  foldersRemoved: number
}> {
  const sessions = await kv.get<ChatSession[]>('chat-sessions') || []
  const folders = await kv.get<SessionFolder[]>('session-folders') || []

  let sessionsRepaired = 0
  let foldersRepaired = 0
  let sessionsRemoved = 0
  let foldersRemoved = 0

  const validSessions = sessions.filter(session => {
    if (!validateSession(session)) {
      sessionsRemoved++
      return false
    }
    return true
  }).map(session => {
    let repaired = false
    const fixedSession = { ...session }

    if (!Array.isArray(session.messages)) {
      fixedSession.messages = []
      repaired = true
    }

    if (!session.createdAt) {
      fixedSession.createdAt = Date.now()
      repaired = true
    }

    if (!session.updatedAt) {
      fixedSession.updatedAt = Date.now()
      repaired = true
    }

    if (repaired) sessionsRepaired++
    return fixedSession
  })

  const validFolders = folders.filter(folder => {
    if (!validateFolder(folder)) {
      foldersRemoved++
      return false
    }
    return true
  }).map(folder => {
    let repaired = false
    const fixedFolder = { ...folder }

    if (!folder.createdAt) {
      fixedFolder.createdAt = Date.now()
      repaired = true
    }

    if (repaired) foldersRepaired++
    return fixedFolder
  })

  await kv.set('chat-sessions', validSessions)
  await kv.set('session-folders', validFolders)

  return {
    sessionsRepaired,
    foldersRepaired,
    sessionsRemoved,
    foldersRemoved
  }
}
