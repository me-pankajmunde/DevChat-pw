import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Database, CloudArrowDown, CloudArrowUp, Trash, Clock, HardDrive, WarningCircle, CheckCircle, Wrench } from '@phosphor-icons/react'
import { ChatSession, SessionFolder, ChatSettings } from '@/lib/types'
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getStorageStats,
  cleanupOldSessions,
  exportAllData,
  importAllData,
  clearAllData,
  repairData,
  BackupData,
  StorageStats
} from '@/lib/persistence'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface DataManagementDialogProps {
  sessions: ChatSession[]
  folders: SessionFolder[]
  settings: ChatSettings | null
  onDataUpdate: (sessions: ChatSession[], folders: SessionFolder[], settings: ChatSettings | null) => void
  trigger?: React.ReactNode
}

export function DataManagementDialog({
  sessions,
  folders,
  settings,
  onDataUpdate,
  trigger
}: DataManagementDialogProps) {
  const [open, setOpen] = useState(false)
  const [backups, setBackups] = useState<Array<{ key: string; timestamp: number; version: string }>>([])
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [daysToKeep, setDaysToKeep] = useState(30)

  useEffect(() => {
    if (open) {
      loadBackups()
      loadStats()
    }
  }, [open, sessions, folders])

  const loadBackups = async () => {
    try {
      const backupList = await listBackups()
      setBackups(backupList)
    } catch (error) {
      toast.error('Failed to load backups')
    }
  }

  const loadStats = async () => {
    try {
      const storageStats = await getStorageStats(sessions, folders)
      setStats(storageStats)
    } catch (error) {
      toast.error('Failed to load storage stats')
    }
  }

  const handleCreateBackup = async () => {
    setIsLoading(true)
    try {
      await createBackup(sessions, folders, settings)
      await loadBackups()
      toast.success('Backup created successfully')
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreBackup = async (backupKey: string) => {
    if (!confirm('Restoring this backup will replace all current data. Continue?')) {
      return
    }

    setIsLoading(true)
    try {
      const backup = await restoreBackup(backupKey)
      if (backup) {
        onDataUpdate(backup.sessions, backup.folders, backup.settings)
        toast.success('Backup restored successfully')
        setOpen(false)
      } else {
        toast.error('Backup not found')
      }
    } catch (error) {
      toast.error('Failed to restore backup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBackup = async (backupKey: string) => {
    if (!confirm('Delete this backup?')) {
      return
    }

    setIsLoading(true)
    try {
      await deleteBackup(backupKey)
      await loadBackups()
      toast.success('Backup deleted')
    } catch (error) {
      toast.error('Failed to delete backup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportAll = async () => {
    setIsLoading(true)
    try {
      const jsonData = await exportAllData()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devchat-backup-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('Importing will replace all current data. Continue?')) {
      e.target.value = ''
      return
    }

    setIsLoading(true)
    try {
      const text = await file.text()
      const imported = await importAllData(text)
      onDataUpdate(imported.sessions, imported.folders, imported.settings)
      toast.success('Data imported successfully')
      setOpen(false)
    } catch (error) {
      toast.error('Failed to import data - invalid file format')
    } finally {
      setIsLoading(false)
      e.target.value = ''
    }
  }

  const handleCleanupOldSessions = async () => {
    if (!confirm(`Delete all sessions older than ${daysToKeep} days?`)) {
      return
    }

    setIsLoading(true)
    try {
      const cleanedSessions = await cleanupOldSessions(sessions, daysToKeep)
      const removed = sessions.length - cleanedSessions.length
      onDataUpdate(cleanedSessions, folders, settings)
      await loadStats()
      toast.success(`Removed ${removed} old session(s)`)
    } catch (error) {
      toast.error('Failed to cleanup sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('⚠️ This will DELETE ALL your data permanently. Are you absolutely sure?')) {
      return
    }

    if (!confirm('This action CANNOT be undone. Type "DELETE" in the next prompt to confirm.')) {
      return
    }

    const userInput = prompt('Type DELETE to confirm:')
    if (userInput !== 'DELETE') {
      toast.error('Deletion cancelled')
      return
    }

    setIsLoading(true)
    try {
      await clearAllData()
      onDataUpdate([], [], null)
      toast.success('All data cleared')
      setOpen(false)
    } catch (error) {
      toast.error('Failed to clear data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepairData = async () => {
    setIsLoading(true)
    try {
      const result = await repairData()
      const totalFixed = result.sessionsRepaired + result.foldersRepaired
      const totalRemoved = result.sessionsRemoved + result.foldersRemoved
      
      if (totalFixed === 0 && totalRemoved === 0) {
        toast.success('No issues found - data is healthy')
      } else {
        toast.success(`Repaired: ${totalFixed} | Removed: ${totalRemoved}`)
      }
      
      await loadStats()
    } catch (error) {
      toast.error('Failed to repair data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Data Management
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </DialogTitle>
          <DialogDescription>
            Backup, restore, and manage your chat data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="export">Export/Import</TabsTrigger>
            <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Total Sessions</Label>
                        <p className="text-2xl font-bold">{stats.totalSessions}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Total Messages</Label>
                        <p className="text-2xl font-bold">{stats.totalMessages}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Total Folders</Label>
                        <p className="text-2xl font-bold">{stats.totalFolders}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Estimated Size</Label>
                        <p className="text-2xl font-bold">{stats.estimatedSize}</p>
                      </div>
                    </div>
                    {stats.oldestSession && (
                      <div className="pt-3 border-t">
                        <Label className="text-muted-foreground">Oldest Session</Label>
                        <p className="text-sm">{formatDistanceToNow(stats.oldestSession, { addSuffix: true })}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Loading statistics...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Data Health
                </CardTitle>
                <CardDescription>
                  Check and repair data integrity issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRepairData} disabled={isLoading} variant="outline" className="w-full">
                  <Wrench className="h-4 w-4 mr-2" />
                  Scan & Repair Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backups" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Automatic backups (keeps last 5)
              </p>
              <Button onClick={handleCreateBackup} disabled={isLoading} size="sm">
                <CloudArrowUp className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No backups yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first backup above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <Card key={backup.key}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {formatDistanceToNow(backup.timestamp, { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(backup.timestamp).toLocaleString()} • v{backup.version}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRestoreBackup(backup.key)}
                            disabled={isLoading}
                            size="sm"
                            variant="outline"
                          >
                            <CloudArrowDown className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            onClick={() => handleDeleteBackup(backup.key)}
                            disabled={isLoading}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Export all your data to a JSON file for safekeeping or transfer
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download all sessions, folders, and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportAll} disabled={isLoading} className="w-full">
                  <CloudArrowDown className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>Restore data from a backup file</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <WarningCircle className="h-4 w-4" />
                  <AlertDescription>
                    Importing will replace all current data
                  </AlertDescription>
                </Alert>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportAll}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cleanup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Delete Old Sessions</CardTitle>
                <CardDescription>Remove sessions older than a specified number of days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="days-to-keep">Keep sessions from last (days)</Label>
                  <Input
                    id="days-to-keep"
                    type="number"
                    min="1"
                    value={daysToKeep}
                    onChange={(e) => setDaysToKeep(parseInt(e.target.value) || 30)}
                  />
                </div>
                <Button onClick={handleCleanupOldSessions} disabled={isLoading} variant="outline" className="w-full">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Old Sessions
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Permanent actions that cannot be undone</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <WarningCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently delete ALL data including backups
                  </AlertDescription>
                </Alert>
                <Button onClick={handleClearAll} disabled={isLoading} variant="destructive" className="w-full">
                  <Trash className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
