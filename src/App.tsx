import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Message as MessageComponent } from '@/components/Message'
import { ImageAttachment } from '@/components/ImageAttachment'
import { SettingsDialog } from '@/components/SettingsDialog'
import { ModelSelector } from '@/components/ModelSelector'
import { SessionSidebar } from '@/components/SessionSidebar'
import { ExportImportDialog } from '@/components/ExportImportDialog'
import { CompareView } from '@/components/CompareView'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PaperPlaneRight, Trash, WarningCircle, Image as ImageIcon, Sidebar as SidebarIcon, FileArrowDown, ArrowsLeftRight, StopCircle, ArrowClockwise } from '@phosphor-icons/react'
import { Message, ChatSettings, ImageAttachment as ImageAttachmentType, ChatSession, SessionFolder } from '@/lib/types'
import { streamChatCompletion } from '@/lib/api'
import { registerServiceWorker } from '@/lib/pwa'
import { applyTheme } from '@/lib/themes'
import { getWallpaperStyle } from '@/lib/wallpapers'
import { fileToBase64, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function App() {
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
  const [lastUserMessage, setLastUserMessage] = useState<Message | null>(null)

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const messages = currentSession?.messages || []

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
      : 'Uncategorized'
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

  const handleRetry = async (messageId?: string) => {
    if (!settings || !currentSessionId || !currentSession) return

    let userMessageToRetry: Message | null = null
    let messagesToKeep: Message[] = []

    if (messageId) {
      const messageIndex = currentSession.messages.findIndex(m => m.id === messageId)
      if (messageIndex === -1) return

      messagesToKeep = currentSession.messages.slice(0, messageIndex)
      userMessageToRetry = currentSession.messages
        .slice(0, messageIndex + 1)
        .reverse()
        .find(m => m.role === 'user') || null
    } else if (lastUserMessage) {
      userMessageToRetry = lastUserMessage
      const messagesWithoutLast = currentSession.messages.filter(m => m.id !== lastUserMessage.id)
      const lastAssistantIndex = messagesWithoutLast.length - 1
      const shouldRemoveLastAssistant = lastAssistantIndex >= 0 && messagesWithoutLast[lastAssistantIndex].role === 'assistant'
      
      messagesToKeep = shouldRemoveLastAssistant ? messagesWithoutLast.slice(0, -1) : messagesWithoutLast
    }

    if (!userMessageToRetry) return

    const newUserMessage: Message = {
      id: `retry-${Date.now()}`,
      role: 'user',
      content: userMessageToRetry.content,
      timestamp: Date.now(),
      images: userMessageToRetry.images,
    }

    setLastUserMessage(newUserMessage)

    const shouldUpdateTitle = messagesToKeep.length === 0
    const titleToSet = shouldUpdateTitle ? generateSessionTitle(newUserMessage.content) : undefined

    const updatedMessages = [...messagesToKeep, newUserMessage]

    updateCurrentSession(session => ({
      ...session,
      messages: updatedMessages,
      updatedAt: Date.now(),
      ...(titleToSet && { title: titleToSet })
    }))

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

  const handleSend = async () => {
    if ((!input.trim() && attachedImages.length === 0) || !settings || isStreaming || !currentSessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '(Image attached)',
      timestamp: Date.now(),
      images: attachedImages.length > 0 ? attachedImages : undefined,
    }

    setLastUserMessage(userMessage)

    const shouldUpdateTitle = messages.length === 0
    const titleToSet = shouldUpdateTitle ? generateSessionTitle(userMessage.content) : undefined

    let updatedMessages: Message[] = []
    
    updateCurrentSession(session => {
      updatedMessages = [...session.messages, userMessage]
    let updatedMessages: Message[] = []
    
    updateCurrentSession(session => {
      updatedMessages = [...session.messages, userMessage]
      return {
        ...session,
        messages: updatedMessages,
        updatedAt: Date.now(),
        ...(titleToSet && { title: titleToSet })
      }
    })

    setStreamingContent('')
    setAutoScroll(true)

    abortControllerRef.current = new AbortController()

    const conversationMessages = updatedMessages.map((m) => {
      if (m.images && m.images.length > 0) {
        const contentParts: Array<{type: 'text' | 'image_url', text?: string, image_url?: {url: string, detail?: 'auto'}}> = []
        
    const conversationMessages = updatedMessages.map((m) => {
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
      
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className={cn(
            "w-80 shrink-0 border-r border-border z-50",
            "md:relative fixed inset-y-0 left-0 bg-background"
          )}>
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
          </div>
        </>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
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
                    <SidebarIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle sidebar (⌘B)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                {currentSession?.title || 'DevChat Local'}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Developer-focused OpenAI API client</p>
            </div>
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
                <div key={message.id} className="flex flex-col gap-2">
                  <MessageComponent message={message} density={settings.messageDensity || 'normal'} />
                  {message.role === 'assistant' && !isStreaming && (
                    <div className="flex justify-start ml-9">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(message.id)}
                        className="gap-2 h-7 text-xs"
                      >
                        <ArrowClockwise className="h-3.5 w-3.5" />
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && streamingContent && (
                <MessageComponent
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
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
      </div>
    </div>
  )
}

export default App
