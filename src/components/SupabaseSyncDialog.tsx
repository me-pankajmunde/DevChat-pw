import { useState, useEffect } from 'react'
import { ChatSession, SessionFolder, ChatSettings } from '@/lib/types'
import {
  checkSupabaseAuth,
  uploadToSupabase,
  downloadFromSupabase,
  getSyncStatus,
  detectConflict,
  mergeData,
  enableAutoSync,
  disableAutoSync,
  isAutoSyncEnabled,
  getAutoSyncInterval,
  SyncData,
  SyncStatus,
  getCurrentUser,
  signInWithGitHub,
  signOut,
  getSupabaseClient,
} from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  CloudArrowUp, 
  CloudArrowDown, 
  Database, 
  CheckCircle, 
  WarningCircle, 
  Clock,
  ArrowsClockwise,
  Info,
  SignIn,
  SignOut as SignOutIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface SupabaseSyncDialogProps {
  sessions: ChatSession[]
  folders: SessionFolder[]
  settings: ChatSettings | null
  onDataUpdate: (
    newSessions: ChatSession[],
    newFolders: SessionFolder[],
    newSettings: ChatSettings | null
  ) => void
  trigger?: React.ReactNode
}

export function SupabaseSyncDialog({
  sessions,
  folders,
  settings,
  onDataUpdate,
  trigger
}: SupabaseSyncDialogProps) {
  const [open, setOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)
  const [autoSyncInterval, setAutoSyncInterval] = useState(30)
  const [conflictResolution, setConflictResolution] = useState<'local' | 'remote' | 'merge'>('merge')
  const [userInfo, setUserInfo] = useState<{ email?: string; avatar?: string } | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (open) {
      loadSyncInfo()
    }
  }, [open])

  const loadSyncInfo = async () => {
    try {
      const authenticated = await checkSupabaseAuth()
      setIsAuthenticated(authenticated)

      if (authenticated) {
        const user = await getCurrentUser()
        if (user) {
          setUserInfo({
            email: user.email,
            avatar: user.user_metadata?.avatar_url,
          })
        }
      }

      const status = await getSyncStatus()
      setSyncStatus(status)

      const autoEnabled = await isAutoSyncEnabled()
      setAutoSyncEnabled(autoEnabled)

      const interval = await getAutoSyncInterval()
      setAutoSyncInterval(interval)
    } catch (error) {
      console.error('Failed to load sync info:', error)
    }
  }

  const handleSignIn = async () => {
    const client = getSupabaseClient()
    if (!client) {
      toast.error('Supabase not configured', {
        description: 'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
      })
      return
    }

    try {
      setIsSigningIn(true)
      const { error } = await signInWithGitHub()
      
      if (error) {
        toast.error('Sign in failed', {
          description: error.message
        })
      } else {
        toast.success('Signing in...', {
          description: 'You will be redirected to GitHub'
        })
      }
    } catch (error) {
      toast.error('Sign in failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsAuthenticated(false)
      setUserInfo(null)
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Sign out failed')
    }
  }

  const handleUpload = async () => {
    try {
      setIsUploading(true)
      
      const hasConflict = await detectConflict(Date.now())
      
      if (hasConflict) {
        toast.warning('Conflict detected', {
          description: 'Remote data has been modified. Continue to overwrite.'
        })
      }

      await uploadToSupabase(sessions, folders, settings)
      
      toast.success('Sync successful', {
        description: 'Your data has been backed up to Supabase'
      })

      await loadSyncInfo()
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Failed to upload data'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      const remoteData = await downloadFromSupabase()

      if (!remoteData) {
        toast.info('No remote data found', {
          description: 'Backup your data first by syncing to Supabase'
        })
        return
      }

      const localData: SyncData = {
        version: '1.0.0',
        timestamp: Date.now(),
        sessions,
        folders,
        settings,
        userId: remoteData.userId
      }

      const hasConflict = remoteData.timestamp > localData.timestamp

      if (hasConflict && conflictResolution === 'merge') {
        toast.info('Merging data', {
          description: 'Combining local and remote changes'
        })

        const merged = mergeData(localData, remoteData, 'merge')
        onDataUpdate(merged.sessions, merged.folders, merged.settings)
      } else if (conflictResolution === 'remote') {
        onDataUpdate(remoteData.sessions, remoteData.folders, remoteData.settings)
      } else {
        toast.info('Using local data', {
          description: 'Keeping your current data'
        })
        return
      }

      toast.success('Data restored', {
        description: 'Your data has been updated from Supabase'
      })

      await loadSyncInfo()
    } catch (error) {
      toast.error('Restore failed', {
        description: error instanceof Error ? error.message : 'Failed to download data'
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleAutoSyncToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await enableAutoSync(autoSyncInterval)
        toast.success('Auto-sync enabled', {
          description: `Data will sync every ${autoSyncInterval} minutes`
        })
      } else {
        await disableAutoSync()
        toast.success('Auto-sync disabled')
      }
      setAutoSyncEnabled(enabled)
    } catch (error) {
      toast.error('Failed to update auto-sync setting')
    }
  }

  const handleIntervalChange = async (value: string) => {
    const interval = parseInt(value)
    setAutoSyncInterval(interval)
    
    if (autoSyncEnabled) {
      await enableAutoSync(interval)
      toast.success('Interval updated', {
        description: `Auto-sync will run every ${interval} minutes`
      })
    }
  }

  const supabaseConfigured = getSupabaseClient() !== null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Database className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Supabase Cloud Sync
          </DialogTitle>
          <DialogDescription>
            Backup and restore your chat data using Supabase
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-4">
            {!supabaseConfigured ? (
              <Alert>
                <Info className="h-5 w-5" />
                <AlertDescription className="ml-2">
                  <p className="font-medium mb-2">Supabase Configuration Required</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure your Supabase URL and API key in Settings to enable cloud sync.
                  </p>
                </AlertDescription>
              </Alert>
            ) : !isAuthenticated ? (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    <p className="font-medium mb-2">Authentication Required</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in with GitHub to sync your data to Supabase. Your data will be stored securely in your Supabase database.
                    </p>
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleSignIn} 
                  disabled={isSigningIn}
                  className="w-full gap-2"
                >
                  {isSigningIn ? (
                    <>
                      <ArrowsClockwise className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <SignIn className="h-5 w-5" />
                      Sign in with GitHub
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {userInfo?.avatar && (
                    <img 
                      src={userInfo.avatar} 
                      alt="User Avatar"
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Connected to Supabase</p>
                    <p className="text-sm text-muted-foreground">{userInfo?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" weight="fill" />
                      Authenticated
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="h-8"
                    >
                      <SignOutIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {syncStatus && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        Last Sync
                      </div>
                      <p className="font-medium">
                        {syncStatus.lastSyncTime
                          ? formatDistanceToNow(syncStatus.lastSyncTime, { addSuffix: true })
                          : 'Never'}
                      </p>
                    </div>

                    <div className="p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        {syncStatus.lastSyncSuccess ? (
                          <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                        ) : (
                          <WarningCircle className="h-4 w-4 text-destructive" weight="fill" />
                        )}
                        Status
                      </div>
                      <p className="font-medium">
                        {syncStatus.lastSyncSuccess ? 'Success' : 'Failed'}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Backup to Supabase
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload your current chat data to your Supabase database. This will overwrite any existing backup.
                    </p>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || syncStatus?.syncInProgress}
                      className="w-full gap-2"
                    >
                      {isUploading ? (
                        <>
                          <ArrowsClockwise className="h-5 w-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CloudArrowUp className="h-5 w-5" weight="fill" />
                          Sync to Supabase
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Restore from Supabase
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download and restore your chat data from Supabase. Choose how to handle conflicts below.
                    </p>
                    
                    <div className="mb-3">
                      <Label className="text-sm mb-2 block">Conflict Resolution</Label>
                      <Select value={conflictResolution} onValueChange={(v) => setConflictResolution(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merge">Merge - Combine local and remote data</SelectItem>
                          <SelectItem value="remote">Remote - Use Supabase data only</SelectItem>
                          <SelectItem value="local">Local - Keep current data</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conflictResolution === 'merge' && 'Newer messages and all folders will be kept'}
                        {conflictResolution === 'remote' && 'All local data will be replaced'}
                        {conflictResolution === 'local' && 'Remote data will be ignored'}
                      </p>
                    </div>

                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading || syncStatus?.syncInProgress}
                      variant="secondary"
                      className="w-full gap-2"
                    >
                      {isDownloading ? (
                        <>
                          <ArrowsClockwise className="h-5 w-5 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <CloudArrowDown className="h-5 w-5" weight="fill" />
                          Restore from Supabase
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {!supabaseConfigured ? (
              <Alert>
                <Info className="h-5 w-5" />
                <AlertDescription className="ml-2">
                  <p className="text-sm text-muted-foreground">
                    Configure Supabase in Settings to access sync settings.
                  </p>
                </AlertDescription>
              </Alert>
            ) : !isAuthenticated ? (
              <Alert>
                <Info className="h-5 w-5" />
                <AlertDescription className="ml-2">
                  <p className="text-sm text-muted-foreground">
                    Sign in to access sync settings.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-semibold">Auto-Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically backup data to Supabase at regular intervals
                      </p>
                    </div>
                    <Switch
                      checked={autoSyncEnabled}
                      onCheckedChange={handleAutoSyncToggle}
                    />
                  </div>

                  {autoSyncEnabled && (
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <Label className="text-sm mb-2 block">Sync Interval</Label>
                      <Select 
                        value={autoSyncInterval.toString()} 
                        onValueChange={handleIntervalChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                          <SelectItem value="120">Every 2 hours</SelectItem>
                          <SelectItem value="360">Every 6 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Data will be automatically synced when changes are detected after this interval
                      </p>
                    </div>
                  )}

                  <Alert>
                    <Info className="h-5 w-5" />
                    <AlertDescription className="ml-2">
                      <p className="text-sm font-medium mb-1">About Supabase Sync</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Data is stored in a secure Supabase database</li>
                        <li>Your API keys and settings are included in backups</li>
                        <li>Table is created automatically on first sync</li>
                        <li>Only you can access your backup data</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
