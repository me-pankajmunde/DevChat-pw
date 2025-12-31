import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Message as MessageComponent } from '@/components/Message'
import { ImageAttachment } from '@/components/ImageAttachment'
import { SettingsDialog } from '@/components/SettingsDialog'
import { ModelSelector } from '@/components/ModelSelector'
import { SessionSidebar } from '@/components/SessionSidebar'
import { ExportImportDialog } from '@/components/ExportImportDialog'
import { CompareView } from '@/components/CompareView'
import { DataManagementDialog } from '@/components/DataManagementDialog'
import { SupabaseSyncDialog } from '@/components/SupabaseSyncDialog'
import { LoginScreen } from '@/components/LoginScreen'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PaperPlaneRight, Trash, WarningCircle, Image as ImageIcon, Sidebar as SidebarIcon, FileArrowDown, ArrowsLeftRight, StopCircle, Database, HardDrives, SignOut } from '@phosphor-icons/react'
import { Message, ChatSettings, ImageAttachment as ImageAttachmentType, ChatSession, SessionFolder } from '@/lib/types'
import { streamChatCompletion } from '@/lib/api'
import { registerServiceWorker } from '@/lib/pwa'
import { applyTheme } from '@/lib/themes'
import { getWallpaperStyle } from '@/lib/wallpapers'
import { fileToBase64, formatFileSize } from '@/lib/utils'
import { initializeSupabase, getSupabaseConfig } from '@/lib/supabase'
import { useAutoBackup } from '@/hooks/use-auto-backup'
import { useSupabaseAutoSync } from '@/hooks/use-supabase-sync'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface UserInfo {
  login: string
  avatarUrl: string
  email?: string
  id: number
  isOwner: boolean
}

function App() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  
  const [sessions = [], setSessions] = useKV<ChatSession[]>('chat-sessions', [])
  const [currentSessionId = null, setCurrentSessionId] = useKV<string | null>('current-session-id', null)
  const [folders = [], setFolders] = useKV<SessionFolder[]>('session-folders', [])
  const [settings = null, setSettings] = useKV<ChatSettings | null>('chat-settings', null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [attachedImages, setAttachedImages] = useState<ImageAttachmentType[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const messages = currentSession?.messages || []

  useAutoBackup(sessions, folders, settings, true)
  useSupabaseAutoSync(sessions, folders, settings, true)

  useEffect(() => {
    const initUser = async () => {
      try {
        const userInfo = await window.spark.user()
        setUser(userInfo)
      } catch (error) {
        console.error('Failed to get user info:', error)
      } finally {
        setIsLoadingUser(false)
      }
    }
    initUser()
  }, [])

  useEffect(() => {
    const initSupabase = async () => {
      const config = await getSupabaseConfig()
      if (config) {
        initializeSupabase(config.url, config.anonKey)
      }
    }
    initSupabase()
  }, [])

  const handleLogin = async () => {
    try {
      const userInfo = await window.spark.user()
      if (userInfo) {
        setUser(userInfo)
        toast.success(`Welcome, ${userInfo.login}!`)
      }
    } catch (error) {
      toast.error('Failed to authenticate with GitHub')
    }
  }

  const handleLogout = () => {
    setUser(null)
    toast.info('Signed out')
  }

  const generateSessionTitle = (firstMessage: string): string => {
    const cleaned = firstMessage.trim().replace(/\s+/g, ' ')
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setSessions(current => [...(current || []), newSession])
    setCurrentSessionId(newSession.id)
    toast.success('New chat created')
  }

  const updateCurrentSession = (updater: (session: ChatSession) => ChatSession) => {
    if (!currentSessionId) return
    
    setSessions(current => 
      (current || []).map(session => 
        session.id === currentSessionId ? updater(session) : session
      )
    )
  }

  const deleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      toast.error('Cannot delete the last session')
      return
    }
    
    setSessions(current => (current || []).filter(s => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId)
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null)
    }
    toast.success('Chat deleted')
  }

  const renameSession = (sessionId: string, newTitle: string) => {
    setSessions(current =>
      (current || []).map(session =>
        session.id === sessionId
          ? { ...session, title: newTitle, updatedAt: Date.now() }
          : session
      )
    )
    toast.success('Chat renamed')
  }

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setAttachedImages([])
    setInput('')
  }

  const createFolder = (name: string, color: string) => {
    const newFolder: SessionFolder = {
      id: `folder-${Date.now()}`,
      name,
      color,
      createdAt: Date.now()
    }
    setFolders(current => [...(current || []), newFolder])
    toast.success(`Folder "${name}" created`)
  }

  const deleteFolder = (folderId: string) => {
    setFolders(current => (current || []).filter(f => f.id !== folderId))
    setSessions(current =>
      (current || []).map(session =>
        session.folderId === folderId
          ? { ...session, folderId: undefined }
          : session
      )
    )
    toast.success('Folder deleted')
  }

  const renameFolder = (folderId: string, newName: string, newColor: string) => {
    setFolders(current =>
      (current || []).map(folder =>
        folder.id === folderId
          ? { ...folder, name: newName, color: newColor }
          : folder
      )
    )
    toast.success('Folder updated')
  }

  const moveToFolder = (sessionId: string, folderId: string | undefined) => {
    setSessions(current =>
      (current || []).map(session =>
        session.id === sessionId
          ? { ...session, folderId, updatedAt: Date.now() }
          : session
      )
    )
    const folderName = folderId 
      ? folders.find(f => f.id === folderId)?.name 
      : 'General'
    toast.success(`Moved to ${folderName}`)
  }

  const updateTags = (sessionId: string, tags: string[]) => {
    setSessions(current =>
      (current || []).map(session =>
        session.id === sessionId
          ? { ...session, tags, updatedAt: Date.now() }
          : session
      )
    )
    toast.success('Tags updated')
  }

  const handleImport = (importedSessions: ChatSession[], importedFolders: SessionFolder[]) => {
    setSessions(current => [...(current || []), ...importedSessions])
    setFolders(current => [...(current || []), ...importedFolders])
  }

  const handleDataUpdate = (
    newSessions: ChatSession[],
    newFolders: SessionFolder[],
    newSettings: ChatSettings | null
  ) => {
    setSessions(newSessions)
    setFolders(newFolders)
    if (newSettings) {
      setSettings(newSettings)
    }
    
    if (newSessions.length > 0 && !newSessions.find(s => s.id === currentSessionId)) {
      setCurrentSessionId(newSessions[0].id)
    } else if (newSessions.length === 0) {
      setCurrentSessionId(null)
    }
  }

  useEffect(() => {
    if (sessions.length === 0 && !currentSessionId) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      setSessions([newSession])
      setCurrentSessionId(newSession.id)
    } else if (currentSessionId && !sessions.find(s => s.id === currentSessionId) && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [sessions.length, currentSessionId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme)
    }
  }, [settings?.theme])

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, streamingContent, autoScroll])

  const handleScroll = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
      setAutoScroll(isAtBottom)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const maxSize = 20 * 1024 * 1024
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    for (const file of Array.from(files)) {
      if (!validImageTypes.includes(file.type)) {
        toast.error('Invalid file type', {
          description: 'Only JPEG, PNG, GIF, and WebP images are supported'
        })
        continue
      }

      if (file.size > maxSize) {
        toast.error('File too large', {
          description: `${file.name} exceeds 20MB limit`
        })
        continue
      }

      try {
        const base64 = await fileToBase64(file)
        const newImage: ImageAttachmentType = {
          id: `${Date.now()}-${Math.random()}`,
          url: base64,
          name: file.name,
          size: file.size,
        }
        setAttachedImages((prev) => [...prev, newImage])
      } catch (error) {
        toast.error('Failed to process image', {
          description: file.name
        })
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (imageId: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      
      if (streamingContent) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now(),
          model: settings?.model,
        }
        updateCurrentSession(session => ({
          ...session,
          messages: [...session.messages, assistantMessage],
          updatedAt: Date.now()
        }))
      }
      
      setStreamingContent('')
      toast.info('Response stopped')
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && attachedImages.length === 0) || !settings || isStreaming || !currentSessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '(Image attached)',
      timestamp: Date.now(),
      images: attachedImages.length > 0 ? attachedImages : undefined,
    }

    const shouldUpdateTitle = messages.length === 0
    const titleToSet = shouldUpdateTitle ? generateSessionTitle(userMessage.content) : undefined

    const updatedMessages: Message[] = [...messages, userMessage]
    
    updateCurrentSession(session => {
      return {
        ...session,
        messages: updatedMessages,
        updatedAt: Date.now(),
        ...(titleToSet && { title: titleToSet })
      }
    })

    setInput('')
    setAttachedImages([])
    setIsStreaming(true)
    setStreamingContent('')
    setAutoScroll(true)

    abortControllerRef.current = new AbortController()

    const conversationMessages = updatedMessages.map((m) => {
      if (m.images && m.images.length > 0) {
        const contentParts: Array<{type: 'text' | 'image_url', text?: string, image_url?: {url: string, detail?: 'auto'}}> = []
        
        if (m.content) {
          contentParts.push({
            type: 'text',
            text: m.content
          })
        }

        m.images.forEach((img) => {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: img.url,
              detail: 'auto'
            }
          })
        })

        return {
          role: m.role,
          content: contentParts
        }
      }

      return {
        role: m.role,
        content: m.content,
      }
    })

    let fullContent = ''

    try {
      await streamChatCompletion(
        settings.apiEndpoint,
        settings.apiKey,
        conversationMessages,
        settings.model,
        (token) => {
          fullContent += token
          setStreamingContent(fullContent)
        },
        (error) => {
          toast.error('Failed to get response', {
            description: error,
          })
          setIsStreaming(false)
          setStreamingContent('')
          abortControllerRef.current = null
        },
        abortControllerRef.current.signal
      )

      if (fullContent) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
          model: settings.model,
        }
        updateCurrentSession(session => ({
          ...session,
          messages: [...session.messages, assistantMessage],
          updatedAt: Date.now()
        }))
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      abortControllerRef.current = null
      textareaRef.current?.focus()
    }
  }

  const handleClear = () => {
    if (!currentSessionId) return
    if (confirm('Are you sure you want to clear all messages in this chat?')) {
      updateCurrentSession(session => ({
        ...session,
        messages: [],
        updatedAt: Date.now()
      }))
      toast.success('Chat cleared')
    }
  }

  const handleModelChange = (model: string) => {
    setSettings((current) => {
      if (!current) return null
      return { ...current, model }
    })
    toast.success(`Model changed to ${model}`)
  }

  const handleSettingsSave = (newSettings: ChatSettings) => {
    setSettings(newSettings)
    if (newSettings.theme) {
      applyTheme(newSettings.theme)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const displayMessages = messages

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Toaster />
        <LoginScreen onLogin={handleLogin} />
      </>
    )
  }

  if (compareMode) {
    return (
      <>
        <Toaster />
        <CompareView settings={settings} onClose={() => setCompareMode(false)} />
      </>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Toaster />
      
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div 
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              className={cn(
                "w-80 shrink-0 border-r border-border z-50",
                "md:relative fixed inset-y-0 left-0 bg-background"
              )}
            >
              <SessionSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                folders={folders}
                onSelectSession={(sessionId) => {
                  selectSession(sessionId)
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false)
                  }
                }}
                onCreateSession={() => {
                  createNewSession()
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false)
                  }
                }}
                onDeleteSession={deleteSession}
                onRenameSession={renameSession}
                onCreateFolder={createFolder}
                onDeleteFolder={deleteFolder}
                onRenameFolder={renameFolder}
                onMoveToFolder={moveToFolder}
                onUpdateTags={updateTags}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div 
        className="flex flex-col flex-1 overflow-hidden"
        initial={false}
        animate={{ 
          marginLeft: sidebarOpen && window.innerWidth >= 768 ? 0 : 0,
          scale: sidebarOpen && window.innerWidth >= 768 ? 1 : 1
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
      >
        <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <motion.div
                      animate={{ rotate: sidebarOpen ? 0 : 180 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <SidebarIcon className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle sidebar (⌘B)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <motion.div 
              className="flex items-center gap-3 min-w-0"
              animate={{ 
                scale: sidebarOpen ? 1 : 1.05,
                x: sidebarOpen ? 0 : 10
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <svg width="68" height="68" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <circle cx="256" cy="256" r="256" fill="#0F172A"/>
                
                <g transform="translate(0, -20)">
                  <path d="M136 144H376C398.091 144 416 161.909 416 184V304C416 326.091 398.091 344 376 344H200L136 400V344C113.909 344 96 326.091 96 304V184C96 161.909 113.909 144 136 144Z" 
                        stroke="white" 
                        strokeWidth="24" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"/>
                  
                  <path d="M224 200L184 244L224 288" 
                        stroke="#38BDF8" 
                        strokeWidth="24" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"/>
                        
                  <path d="M288 200L328 244L288 288" 
                        stroke="#38BDF8" 
                        strokeWidth="24" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"/>
                        
                  <line x1="268" y1="190" x2="244" y2="298" 
                        stroke="white" 
                        strokeWidth="16" 
                        strokeLinecap="round" 
                        opacity="0.5"/>
                </g>

                <text x="256" y="445" 
                      fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                      fontWeight="bold" 
                      fontSize="64" 
                      fill="white" 
                      textAnchor="middle" 
                      letterSpacing="2">
                        DevChat
                </text>
              </svg>
            
            </motion.div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {settings && (
              <ModelSelector 
                settings={settings} 
                onModelChange={handleModelChange}
                disabled={isStreaming}
              />
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DataManagementDialog
                      sessions={sessions}
                      folders={folders}
                      settings={settings}
                      onDataUpdate={handleDataUpdate}
                      trigger={
                        <Button variant="outline" size="icon">
                          <HardDrives className="h-5 w-5" />
                        </Button>
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Data Management</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCompareMode(true)}
                    disabled={!settings}
                  >
                    <ArrowsLeftRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compare models</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ExportImportDialog 
                      sessions={sessions}
                      folders={folders}
                      onImport={handleImport}
                      trigger={
                        <Button variant="outline" size="icon">
                          <FileArrowDown className="h-5 w-5" />
                        </Button>
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export/Import chats</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
              disabled={messages.length === 0}
            >
              <Trash className="h-5 w-5" />
            </Button>
            <SettingsDialog settings={settings} onSave={handleSettingsSave} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl} alt={user.login} />
                    <AvatarFallback>{user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.login}</p>
                    {user.email && (
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <SignOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative" style={settings?.wallpaper && settings.wallpaper !== 'none' ? getWallpaperStyle(settings.wallpaper, settings.customWallpaperUrl, settings.wallpaperOpacity, settings.wallpaperBlur) : {}}>
        {!settings ? (
          <div className="flex items-center justify-center h-full p-6">
            <Alert className="max-w-md">
              <WarningCircle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <p className="font-medium mb-2">API Configuration Required</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your local OpenAI API endpoint and key to start chatting.
                </p>
                <SettingsDialog settings={settings} onSave={handleSettingsSave} />
              </AlertDescription>
            </Alert>
          </div>
        ) : displayMessages.length === 0 && !isStreaming ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-6">
              <h2 className="text-xl font-semibold mb-2 text-primary">Ready to Chat</h2>
              <p className="text-muted-foreground">
                Send a message to start your conversation with the AI assistant.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full" ref={scrollAreaRef} onScroll={handleScroll}>
            <div className={cn(
              'flex flex-col p-4',
              (settings.messageDensity || 'normal') === 'compact' ? 'gap-2' : (settings.messageDensity || 'normal') === 'comfortable' ? 'gap-4' : 'gap-3'
            )}>
              {displayMessages.map((message) => (
                <MessageComponent key={message.id} message={message} density={settings.messageDensity || 'normal'} />
              ))}
              {isStreaming && (
                <MessageComponent
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent || '',
                    timestamp: Date.now(),
                    model: settings.model,
                  }}
                  isStreaming
                  density={settings.messageDensity || 'normal'}
                />
              )}
            </div>
          </ScrollArea>
        )}
        </div>

        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3 md:p-4">
          <div className="max-w-4xl mx-auto">
            {attachedImages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border border-border">
                {attachedImages.map((image) => (
                  <div key={image.id} className="relative">
                    <ImageAttachment 
                      image={image} 
                      onRemove={() => handleRemoveImage(image.id)}
                      showRemove
                    />
                    <div className="text-xs text-muted-foreground mt-1 px-1 truncate max-w-[120px]">
                      {formatFileSize(image.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-[50px] w-[50px] md:h-[60px] md:w-[60px] shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={!settings || isStreaming}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Textarea
                ref={textareaRef}
                id="message-input"
                placeholder={settings ? "Type your message... (Shift+Enter for new line)" : "Configure API settings first"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!settings || isStreaming}
                className="min-h-[50px] md:min-h-[60px] max-h-[200px] resize-none"
              />
              {isStreaming ? (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  size="icon"
                  className="h-[50px] w-[50px] md:h-[60px] md:w-[60px] shrink-0"
                >
                  <StopCircle className="h-5 w-5" weight="fill" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!settings || (!input.trim() && attachedImages.length === 0)}
                  size="icon"
                  className="h-[50px] w-[50px] md:h-[60px] md:w-[60px] shrink-0"
                >
                  <PaperPlaneRight className="h-5 w-5" weight="fill" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default App
