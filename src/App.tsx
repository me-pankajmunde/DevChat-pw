import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Message as MessageComponent } from '@/components/Message'
import { ImageAttachment } from '@/components/ImageAttachment'
import { SettingsDialog } from '@/components/SettingsDialog'
import { ModelSelector } from '@/components/ModelSelector'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { PaperPlaneRight, Trash, WarningCircle, Image as ImageIcon, X } from '@phosphor-icons/react'
import { Message, ChatSettings, ImageAttachment as ImageAttachmentType } from '@/lib/types'
import { streamChatCompletion } from '@/lib/api'
import { registerServiceWorker } from '@/lib/pwa'
import { applyTheme } from '@/lib/themes'
import { getWallpaperStyle } from '@/lib/wallpapers'
import { fileToBase64, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function App() {
  const [messages = [], setMessages, deleteMessages] = useKV<Message[]>('chat-messages', [])
  const [settings = null, setSettings] = useKV<ChatSettings | null>('chat-settings', null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [attachedImages, setAttachedImages] = useState<ImageAttachmentType[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

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

  const handleSend = async () => {
    if ((!input.trim() && attachedImages.length === 0) || !settings || isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '(Image attached)',
      timestamp: Date.now(),
      images: attachedImages.length > 0 ? attachedImages : undefined,
    }

    setMessages((current) => [...(current || []), userMessage])
    setInput('')
    const currentImages = [...attachedImages]
    setAttachedImages([])
    setIsStreaming(true)
    setStreamingContent('')
    setAutoScroll(true)

    const conversationMessages = (messages || []).concat(userMessage).map((m) => {
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
      }
    )

    if (fullContent) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        model: settings.model,
      }
      setMessages((current) => [...(current || []), assistantMessage])
    }

    setIsStreaming(false)
    setStreamingContent('')
    textareaRef.current?.focus()
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all messages?')) {
      deleteMessages()
      toast.success('Conversation cleared')
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Toaster />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Local AI Chat</h1>
          <p className="text-sm text-muted-foreground">Developer-focused OpenAI API client</p>
        </div>
        <div className="flex items-center gap-2">
          {settings && (
            <ModelSelector 
              settings={settings} 
              onModelChange={handleModelChange}
              disabled={isStreaming}
            />
          )}
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
                <MessageComponent key={message.id} message={message} density={settings.messageDensity || 'normal'} />
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

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
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
              className="h-[60px] w-[60px] shrink-0"
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
              className="min-h-[60px] max-h-[200px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!settings || (!input.trim() && attachedImages.length === 0) || isStreaming}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              <PaperPlaneRight className="h-5 w-5" weight="fill" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
