import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ChatSession, SessionFolder, ChatSettings } from './types'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export interface SyncData {
  version: string
  timestamp: number
  sessions: ChatSession[]
  folders: SessionFolder[]
  settings: ChatSettings | null
  userId: string
}

let supabaseClient: SupabaseClient | null = null

export function initializeSupabase(url: string, anonKey: string): SupabaseClient {
  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  return supabaseClient
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

export async function getSupabaseConfig(): Promise<SupabaseConfig | null> {
  try {
    const config = await window.spark.kv.get<SupabaseConfig>('supabase-config')
    return config || null
  } catch {
    return null
  }
}

export async function saveSupabaseConfig(config: SupabaseConfig): Promise<void> {
  await window.spark.kv.set('supabase-config', config)
  initializeSupabase(config.url, config.anonKey)
}

export async function checkSupabaseAuth(): Promise<boolean> {
  const client = getSupabaseClient()
  if (!client) return false

  try {
    const { data: { session } } = await client.auth.getSession()
    return session !== null
  } catch {
    return false
  }
}

export async function signInWithGitHub(): Promise<{ error?: Error }> {
  const client = getSupabaseClient()
  if (!client) {
    return { error: new Error('Supabase not initialized') }
  }

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) return { error }
    return {}
  } catch (error) {
    return { error: error as Error }
  }
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return

  await client.auth.signOut()
}

export async function getCurrentUser() {
  const client = getSupabaseClient()
  if (!client) return null

  try {
    const { data: { user } } = await client.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function uploadToSupabase(
  sessions: ChatSession[],
  folders: SessionFolder[],
  settings: ChatSettings | null
): Promise<void> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase not initialized. Please configure Supabase in settings.')
  }

  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated. Please sign in first.')
  }

  const syncData: SyncData = {
    version: '1.0.0',
    timestamp: Date.now(),
    sessions,
    folders,
    settings,
    userId: user.id,
  }

  const { error } = await client
    .from('chat_backups')
    .upsert({
      user_id: user.id,
      data: syncData,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    throw new Error(`Failed to upload data: ${error.message}`)
  }
}

export async function downloadFromSupabase(): Promise<SyncData | null> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase not initialized. Please configure Supabase in settings.')
  }

  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated. Please sign in first.')
  }

  const { data, error } = await client
    .from('chat_backups')
    .select('data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to download data: ${error.message}`)
  }

  return data?.data || null
}

export interface SyncStatus {
  lastSyncTime: number | null
  lastSyncSuccess: boolean
  syncInProgress: boolean
}

export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const status = await window.spark.kv.get<SyncStatus>('supabase-sync-status')
    return (
      status || {
        lastSyncTime: null,
        lastSyncSuccess: false,
        syncInProgress: false,
      }
    )
  } catch {
    return {
      lastSyncTime: null,
      lastSyncSuccess: false,
      syncInProgress: false,
    }
  }
}

export async function updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
  const currentStatus = await getSyncStatus()
  const newStatus = { ...currentStatus, ...status }
  await window.spark.kv.set('supabase-sync-status', newStatus)
}

export async function detectConflict(localTimestamp: number): Promise<boolean> {
  try {
    const remoteData = await downloadFromSupabase()
    if (!remoteData) return false
    return remoteData.timestamp > localTimestamp
  } catch {
    return false
  }
}

export function mergeData(
  local: SyncData,
  remote: SyncData,
  strategy: 'local' | 'remote' | 'merge'
): SyncData {
  if (strategy === 'local') return local
  if (strategy === 'remote') return remote

  const mergedSessions = [...local.sessions]
  const sessionIds = new Set(local.sessions.map((s) => s.id))

  for (const remoteSession of remote.sessions) {
    if (!sessionIds.has(remoteSession.id)) {
      mergedSessions.push(remoteSession)
    } else {
      const localSession = local.sessions.find((s) => s.id === remoteSession.id)
      if (localSession && remoteSession.updatedAt > localSession.updatedAt) {
        const index = mergedSessions.findIndex((s) => s.id === remoteSession.id)
        if (index !== -1) {
          mergedSessions[index] = remoteSession
        }
      }
    }
  }

  const mergedFolders = [...local.folders]
  const folderIds = new Set(local.folders.map((f) => f.id))

  for (const remoteFolder of remote.folders) {
    if (!folderIds.has(remoteFolder.id)) {
      mergedFolders.push(remoteFolder)
    }
  }

  return {
    version: '1.0.0',
    timestamp: Math.max(local.timestamp, remote.timestamp),
    sessions: mergedSessions.sort((a, b) => b.updatedAt - a.updatedAt),
    folders: mergedFolders,
    settings: remote.settings || local.settings,
    userId: local.userId,
  }
}

export async function enableAutoSync(intervalMinutes: number): Promise<void> {
  await window.spark.kv.set('supabase-auto-sync-enabled', true)
  await window.spark.kv.set('supabase-auto-sync-interval', intervalMinutes)
}

export async function disableAutoSync(): Promise<void> {
  await window.spark.kv.set('supabase-auto-sync-enabled', false)
}

export async function isAutoSyncEnabled(): Promise<boolean> {
  const enabled = await window.spark.kv.get<boolean>('supabase-auto-sync-enabled')
  return enabled || false
}

export async function getAutoSyncInterval(): Promise<number> {
  const interval = await window.spark.kv.get<number>('supabase-auto-sync-interval')
  return interval || 30
}
