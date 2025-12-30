import { ChatSession, SessionFolder } from './types'

export interface ExportData {
  version: string
  exportDate: number
  sessions: ChatSession[]
  folders?: SessionFolder[]
}

export interface SingleSessionExport {
  version: string
  exportDate: number
  session: ChatSession
}

const EXPORT_VERSION = '1.0.0'

export function exportSingleSession(session: ChatSession): void {
  const exportData: SingleSessionExport = {
    version: EXPORT_VERSION,
    exportDate: Date.now(),
    session
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `devchat-${sanitizeFilename(session.title)}-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportAllSessions(sessions: ChatSession[], folders: SessionFolder[]): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportDate: Date.now(),
    sessions,
    folders
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `devchat-backup-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function importSessions(
  file: File
): Promise<{ sessions: ChatSession[]; folders?: SessionFolder[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (isSingleSessionExport(data)) {
          resolve({
            sessions: [data.session],
            folders: []
          })
        } else if (isMultiSessionExport(data)) {
          resolve({
            sessions: data.sessions,
            folders: data.folders || []
          })
        } else {
          reject(new Error('Invalid export file format'))
        }
      } catch (error) {
        reject(new Error('Failed to parse export file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

function isSingleSessionExport(data: any): data is SingleSessionExport {
  return (
    data &&
    typeof data === 'object' &&
    data.version &&
    data.session &&
    data.session.id &&
    data.session.messages &&
    Array.isArray(data.session.messages)
  )
}

function isMultiSessionExport(data: any): data is ExportData {
  return (
    data &&
    typeof data === 'object' &&
    data.version &&
    data.sessions &&
    Array.isArray(data.sessions)
  )
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .substring(0, 50)
}

export function validateImportedSession(session: ChatSession): boolean {
  return !!(
    session.id &&
    session.title &&
    Array.isArray(session.messages) &&
    session.createdAt &&
    session.updatedAt
  )
}

export function deduplicateSessionId(
  session: ChatSession,
  existingSessions: ChatSession[]
): ChatSession {
  const existingIds = new Set(existingSessions.map(s => s.id))
  
  if (!existingIds.has(session.id)) {
    return session
  }

  return {
    ...session,
    id: `${session.id}-imported-${Date.now()}`,
    title: `${session.title} (Imported)`
  }
}

export function deduplicateFolderId(
  folder: SessionFolder,
  existingFolders: SessionFolder[]
): SessionFolder {
  const existingIds = new Set(existingFolders.map(f => f.id))
  
  if (!existingIds.has(folder.id)) {
    return folder
  }

  return {
    ...folder,
    id: `${folder.id}-imported-${Date.now()}`,
    name: `${folder.name} (Imported)`
  }
}
