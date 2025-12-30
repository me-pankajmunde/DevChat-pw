import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Upload, 
  FileArrowDown, 
  CheckCircle, 
  WarningCircle 
} from '@phosphor-icons/react'
import { ChatSession, SessionFolder } from '@/lib/types'
import { 
  exportAllSessions, 
  importSessions, 
  deduplicateSessionId, 
  deduplicateFolderId,
  validateImportedSession 
} from '@/lib/export-import'
import { toast } from 'sonner'

interface ExportImportDialogProps {
  sessions: ChatSession[]
  folders: SessionFolder[]
  onImport: (sessions: ChatSession[], folders: SessionFolder[]) => void
  trigger?: React.ReactNode
}

export function ExportImportDialog({ 
  sessions, 
  folders, 
  onImport,
  trigger 
}: ExportImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    sessionsCount?: number
    foldersCount?: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportAll = () => {
    try {
      exportAllSessions(sessions, folders)
      toast.success('Export successful', {
        description: `Exported ${sessions.length} chat${sessions.length !== 1 ? 's' : ''} and ${folders.length} folder${folders.length !== 1 ? 's' : ''}`
      })
    } catch (error) {
      toast.error('Export failed', {
        description: 'Failed to export chat sessions'
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const { sessions: importedSessions, folders: importedFolders } = await importSessions(file)

      const validSessions = importedSessions.filter(validateImportedSession)
      
      if (validSessions.length === 0) {
        setImportResult({
          success: false,
          message: 'No valid sessions found in the import file'
        })
        toast.error('Import failed', {
          description: 'No valid sessions found in the file'
        })
        return
      }

      const deduplicatedSessions = validSessions.map(session => 
        deduplicateSessionId(session, sessions)
      )

      const deduplicatedFolders = (importedFolders || []).map(folder =>
        deduplicateFolderId(folder, folders)
      )

      onImport(deduplicatedSessions, deduplicatedFolders)

      setImportResult({
        success: true,
        message: 'Import successful!',
        sessionsCount: deduplicatedSessions.length,
        foldersCount: deduplicatedFolders.length
      })

      toast.success('Import successful', {
        description: `Imported ${deduplicatedSessions.length} chat${deduplicatedSessions.length !== 1 ? 's' : ''}`
      })

      setTimeout(() => {
        setOpen(false)
        setImportResult(null)
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setImportResult({
        success: false,
        message: errorMessage
      })
      toast.error('Import failed', {
        description: errorMessage
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <FileArrowDown className="h-4 w-4" />
              Export/Import
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export & Import</DialogTitle>
            <DialogDescription>
              Back up your chat sessions or import from a previous backup
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Export Chats</h4>
              <p className="text-sm text-muted-foreground">
                Download all your chat sessions and folders as a JSON file
              </p>
              <Button 
                onClick={handleExportAll} 
                className="w-full"
                disabled={sessions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All ({sessions.length} chat{sessions.length !== 1 ? 's' : ''})
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Import Chats</h4>
              <p className="text-sm text-muted-foreground">
                Upload a previously exported JSON file to restore your chats
              </p>
              <Button 
                onClick={handleImportClick} 
                variant="outline" 
                className="w-full"
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : 'Import from File'}
              </Button>

              {importResult && (
                <Alert variant={importResult.success ? 'default' : 'destructive'}>
                  {importResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <WarningCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className="ml-2">
                    <p className="font-medium">{importResult.message}</p>
                    {importResult.sessionsCount !== undefined && (
                      <p className="text-sm mt-1">
                        {importResult.sessionsCount} session{importResult.sessionsCount !== 1 ? 's' : ''} imported
                        {importResult.foldersCount ? `, ${importResult.foldersCount} folder${importResult.foldersCount !== 1 ? 's' : ''}` : ''}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">File Format</h4>
              <p className="text-xs text-muted-foreground">
                • Supports both single session and bulk exports<br />
                • Duplicate sessions will be automatically renamed<br />
                • All messages and attachments are preserved
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
