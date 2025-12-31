import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PaperPlaneRight, WarningCircle, X, StopCircle } from '@phosphor-icons/react'
import { ChatSettings, OpenAIMessage } from '@/lib/types'
import { streamChatCompletion, fetchModels } from '@/lib/api'
import { getModelIcon } from '@/lib/model-icons'
import { toast } from 'sonner'
import type { Components } from 'react-markdown'
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CompareResult {
  model: string
  content: string
  isStreaming: boolean
  error?: string
  completed: boolean
}

interface CompareViewProps {
  settings: ChatSettings | null
  onClose: () => void
}

export function CompareView({ settings, onClose }: CompareViewProps) {
  const [input, setInput] = useState('')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [results, setResults] = useState<CompareResult[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllersRef = useRef<AbortController[]>([])

  useEffect(() => {
    if (settings) {
      loadModels()
    }
  }, [settings])

  const loadModels = async () => {
    if (!settings) return
    const models = await fetchModels(settings.apiEndpoint, settings.apiKey)
    setAvailableModels(models)
    if (models.length > 0 && selectedModels.length === 0) {
      setSelectedModels(models.slice(0, Math.min(3, models.length)))
    }
  }

  const toggleModel = (model: string) => {
    setSelectedModels(current => {
      if (current.includes(model)) {
        return current.filter(m => m !== model)
      } else {
        return [...current, model]
      }
    })
  }

  const handleStop = () => {
    abortControllersRef.current.forEach(controller => controller.abort())
    abortControllersRef.current = []
    setIsComparing(false)
    
    setResults(current =>
      current.map(result => ({
        ...result,
        isStreaming: false,
        completed: true
      }))
    )
    
    toast.info('Comparison stopped')
  }

  const handleCompare = async () => {
    if (!input.trim() || !settings || selectedModels.length === 0 || isComparing) return

    setIsComparing(true)
    abortControllersRef.current = selectedModels.map(() => new AbortController())
    
    const initialResults: CompareResult[] = selectedModels.map(model => ({
      model,
      content: '',
      isStreaming: true,
      completed: false
    }))
    setResults(initialResults)

    const messages: OpenAIMessage[] = [
      {
        role: 'user',
        content: input.trim()
      }
    ]

    const promises = selectedModels.map(async (model, index) => {
      let fullContent = ''
      
      try {
        await streamChatCompletion(
          settings.apiEndpoint,
          settings.apiKey,
          messages,
          model,
          (token) => {
            fullContent += token
            setResults(current => {
              const updated = [...current]
              updated[index] = {
                ...updated[index],
                content: fullContent,
                isStreaming: true
              }
              return updated
            })
          },
          (error) => {
            setResults(current => {
              const updated = [...current]
              updated[index] = {
                ...updated[index],
                error,
                isStreaming: false,
                completed: true
              }
              return updated
            })
          },
          abortControllersRef.current[index].signal
        )

        setResults(current => {
          const updated = [...current]
          updated[index] = {
            ...updated[index],
            isStreaming: false,
            completed: true
          }
          return updated
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
      }
    })

    await Promise.all(promises)
    abortControllersRef.current = []
    setIsComparing(false)
    toast.success('Comparison complete')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCompare()
    }
  }

  const allCompleted = results.length > 0 && results.every(r => r.completed)

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Model Compare</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Compare responses from multiple models</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      {!settings ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Alert className="max-w-md">
            <WarningCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              <p className="font-medium mb-2">API Configuration Required</p>
              <p className="text-sm text-muted-foreground">
                Configure your API settings first to use model comparison.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-3">
                <label className="text-sm font-medium mb-2 block">
                  Select Models to Compare ({selectedModels.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableModels.map(model => (
                    <div key={model} className="flex items-center space-x-2">
                      <Checkbox
                        id={`model-${model}`}
                        checked={selectedModels.includes(model)}
                        onCheckedChange={() => toggleModel(model)}
                        disabled={isComparing}
                      />
                      <label
                        htmlFor={`model-${model}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                      >
                        {getModelIcon(model)}
                        {model}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  id="compare-input"
                  placeholder="Enter your query to compare across models..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isComparing}
                  className="min-h-[80px] max-h-[200px] resize-none"
                />
                {isComparing ? (
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    size="icon"
                    className="h-[80px] w-[80px] shrink-0"
                  >
                    <StopCircle className="h-5 w-5" weight="fill" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCompare}
                    disabled={!input.trim() || selectedModels.length === 0}
                    size="icon"
                    className="h-[80px] w-[80px] shrink-0"
                  >
                    <PaperPlaneRight className="h-5 w-5" weight="fill" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {results.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold mb-2 text-primary">Ready to Compare</h2>
                  <p className="text-muted-foreground">
                    Select your models and enter a query to see how different models respond.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto p-4 space-y-6">
                {results.map((result, index) => (
                  <div key={result.model} className="border border-border rounded-lg overflow-hidden bg-card">
                    <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getModelIcon(result.model)}
                        <h3 className="text-lg font-semibold">{result.model}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.isStreaming && (
                          <Badge variant="secondary">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                              Streaming
                            </div>
                          </Badge>
                        )}
                        {result.completed && !result.error && (
                          <Badge variant="default">Complete</Badge>
                        )}
                        {result.error && (
                          <Badge variant="destructive">Error</Badge>
                        )}
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      {result.error ? (
                        <Alert variant="destructive">
                          <WarningCircle className="h-4 w-4" />
                          <AlertDescription className="ml-2">
                            {result.error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <Markdown
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                  <div className="code-block">
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                )
                              },
                            }}
                          >
                            {result.content || 'Waiting for response...'}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </div>
  )
}
