import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Message as MessageComponent } from '@/components/Message'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { PaperPlaneRight, Trash, WarningCircle } from '@phosphor-icons/react'
import { Message, ChatSettings } from '@/lib/types'
import { streamChatCompletion } from '@/lib/api'
import { registerServiceWorker } from '@/lib/pwa'
import { toast } from 'sonner'

function App() {
  const [messages = [], setMessages, deleteMessages] = useKV<Message[]>('chat-messages', [])
  const [settings = null, setSettings] = useKV<ChatSettings | null>('chat-settings', null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    registerServiceWorker()
  }, [])

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

  const handleSend = async () => {
    if (!input.trim() || !settings || isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((current) => [...(current || []), userMessage])
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')
    setAutoScroll(true)

    const conversationMessages = (messages || []).concat(userMessage).map((m) => ({
      role: m.role,
      content: m.content,
    }))

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={messages.length === 0}
          >
            <Trash className="h-5 w-5" />
          </Button>
          <SettingsDialog settings={settings} onSave={setSettings} />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {!settings ? (
          <div className="flex items-center justify-center h-full p-6">
            <Alert className="max-w-md">
              <WarningCircle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <p className="font-medium mb-2">API Configuration Required</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your local OpenAI API endpoint and key to start chatting.
                </p>
                <SettingsDialog settings={settings} onSave={setSettings} />
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
            <div className="flex flex-col gap-4 p-6">
              {displayMessages.map((message) => (
                <MessageComponent key={message.id} message={message} />
              ))}
              {isStreaming && streamingContent && (
                <MessageComponent
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    timestamp: Date.now(),
                  }}
                  isStreaming
                />
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
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
            disabled={!settings || !input.trim() || isStreaming}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            <PaperPlaneRight className="h-5 w-5" weight="fill" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
