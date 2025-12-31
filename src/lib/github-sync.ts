import { ChatSession, SessionFolder, ChatSettings } from './types'

export interface SyncData {
  version: string
  timestamp: number
  sessions: ChatSession[]
  folders: SessionFolder[]
  settings: ChatSettings | null
  deviceId: string
}

export interface SyncStatus {
  lastSyncTime: number | null
  lastSyncSuccess: boolean
  syncInProgress: boolean
  conflictDetected: boolean
  remoteTimestamp: number | null
}

const SYNC_FILE_NAME = 'devchat-sync.json'
const SYNC_REPO_OWNER = 'owner'
const SYNC_REPO_NAME = 'devchat-backup'
const SYNC_BRANCH = 'main'

const getDeviceId = (): string => {
  const stored = localStorage.getItem('device-id')
  if (stored) return stored
  
  const newId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`
  localStorage.setItem('device-id', newId)
  return newId
}

export const getSyncStatus = async (): Promise<SyncStatus> => {
  try {
    const status = await window.spark.kv.get<SyncStatus>('github-sync-status')
    return status || {
      lastSyncTime: null,
      lastSyncSuccess: false,
      syncInProgress: false,
      conflictDetected: false,
      remoteTimestamp: null
    }
  } catch {
    return {
      lastSyncTime: null,
      lastSyncSuccess: false,
      syncInProgress: false,
      conflictDetected: false,
      remoteTimestamp: null
    }
  }
}

export const setSyncStatus = async (status: Partial<SyncStatus>): Promise<void> => {
  const current = await getSyncStatus()
  await window.spark.kv.set('github-sync-status', { ...current, ...status })
}

export const checkGitHubAuth = async (): Promise<boolean> => {
  try {
    const user = await window.spark.user()
    return !!(user && user.login)
  } catch {
    return false
  }
}

export const getRemoteData = async (): Promise<SyncData | null> => {
  try {
    const user = await window.spark.user()
    if (!user || !user.login) throw new Error('Not authenticated')

    const response = await fetch(
      `https://api.github.com/repos/${user.login}/${SYNC_REPO_NAME}/contents/${SYNC_FILE_NAME}?ref=${SYNC_BRANCH}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    const content = atob(data.content.replace(/\s/g, ''))
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to get remote data:', error)
    return null
  }
}

export const uploadToGitHub = async (
  sessions: ChatSession[],
  folders: SessionFolder[],
  settings: ChatSettings | null
): Promise<boolean> => {
  try {
    const user = await window.spark.user()
    if (!user || !user.login) throw new Error('Not authenticated')

    await setSyncStatus({ syncInProgress: true })

    const syncData: SyncData = {
      version: '1.0.0',
      timestamp: Date.now(),
      sessions,
      folders,
      settings,
      deviceId: getDeviceId()
    }

    let sha: string | undefined
    let repoExists = false

    try {
      const repoResponse = await fetch(
        `https://api.github.com/repos/${user.login}/${SYNC_REPO_NAME}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      )
      repoExists = repoResponse.ok
    } catch {
      repoExists = false
    }

    if (!repoExists) {
      const createResponse = await fetch(
        'https://api.github.com/user/repos',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: SYNC_REPO_NAME,
            description: 'DevChat Local - Backup Repository',
            private: true,
            auto_init: false
          })
        }
      )

      if (!createResponse.ok) {
        throw new Error('Failed to create backup repository')
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${user.login}/${SYNC_REPO_NAME}/contents/${SYNC_FILE_NAME}?ref=${SYNC_BRANCH}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      )

      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        sha = fileData.sha
      }
    } catch {
      sha = undefined
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(syncData, null, 2))))

    const updateResponse = await fetch(
      `https://api.github.com/repos/${user.login}/${SYNC_REPO_NAME}/contents/${SYNC_FILE_NAME}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Sync from ${getDeviceId()} at ${new Date().toISOString()}`,
          content,
          branch: SYNC_BRANCH,
          ...(sha && { sha })
        })
      }
    )

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}))
      throw new Error(`Failed to upload: ${errorData.message || updateResponse.statusText}`)
    }

    await setSyncStatus({
      lastSyncTime: Date.now(),
      lastSyncSuccess: true,
      syncInProgress: false,
      remoteTimestamp: syncData.timestamp
    })

    return true
  } catch (error) {
    console.error('Upload failed:', error)
    await setSyncStatus({
      lastSyncSuccess: false,
      syncInProgress: false
    })
    throw error
  }
}

export const downloadFromGitHub = async (): Promise<SyncData | null> => {
  try {
    const user = await window.spark.user()
    if (!user || !user.login) throw new Error('Not authenticated')

    await setSyncStatus({ syncInProgress: true })

    const remoteData = await getRemoteData()
    
    if (remoteData) {
      await setSyncStatus({
        lastSyncTime: Date.now(),
        lastSyncSuccess: true,
        syncInProgress: false,
        remoteTimestamp: remoteData.timestamp
      })
    } else {
      await setSyncStatus({
        syncInProgress: false
      })
    }

    return remoteData
  } catch (error) {
    console.error('Download failed:', error)
    await setSyncStatus({
      lastSyncSuccess: false,
      syncInProgress: false
    })
    throw error
  }
}

export const detectConflict = async (
  localTimestamp: number
): Promise<boolean> => {
  try {
    const remoteData = await getRemoteData()
    if (!remoteData) return false

    const deviceId = getDeviceId()
    
    if (remoteData.deviceId === deviceId) {
      return false
    }

    return remoteData.timestamp > localTimestamp
  } catch {
    return false
  }
}

export const mergeData = (
  local: SyncData,
  remote: SyncData,
  strategy: 'local' | 'remote' | 'merge'
): SyncData => {
  if (strategy === 'local') {
    return local
  }

  if (strategy === 'remote') {
    return remote
  }

  const sessionMap = new Map<string, ChatSession>()
  
  remote.sessions.forEach(session => {
    sessionMap.set(session.id, session)
  })

  local.sessions.forEach(session => {
    const existing = sessionMap.get(session.id)
    if (!existing || session.updatedAt > existing.updatedAt) {
      sessionMap.set(session.id, session)
    }
  })

  const folderMap = new Map<string, SessionFolder>()
  
  remote.folders.forEach(folder => {
    folderMap.set(folder.id, folder)
  })

  local.folders.forEach(folder => {
    if (!folderMap.has(folder.id)) {
      folderMap.set(folder.id, folder)
    }
  })

  return {
    version: '1.0.0',
    timestamp: Date.now(),
    sessions: Array.from(sessionMap.values()).sort((a, b) => b.updatedAt - a.updatedAt),
    folders: Array.from(folderMap.values()),
    settings: local.settings || remote.settings,
    deviceId: getDeviceId()
  }
}

export const enableAutoSync = async (intervalMinutes: number = 30): Promise<void> => {
  await window.spark.kv.set('auto-sync-enabled', true)
  await window.spark.kv.set('auto-sync-interval', intervalMinutes)
}

export const disableAutoSync = async (): Promise<void> => {
  await window.spark.kv.set('auto-sync-enabled', false)
}

export const isAutoSyncEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await window.spark.kv.get<boolean>('auto-sync-enabled')
    return enabled || false
  } catch {
    return false
  }
}

export const getAutoSyncInterval = async (): Promise<number> => {
  try {
    const interval = await window.spark.kv.get<number>('auto-sync-interval')
    return interval || 30
  } catch {
    return 30
  }
}
