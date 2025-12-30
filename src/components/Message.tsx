import { useState } from 'react'
import Markdown from 'react-markdown'
import { Message as MessageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getModelIcon, getModelColor } from '@/lib/model-icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Check, User } from '@phosphor-icons/react'

interface MessageProps {
  message: MessageType
  isStreaming?: boolean
}

export function Message({ message, isStreaming }: MessageProps) {
  const isUser = message.role === 'user'
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div
      className={cn(
        'flex w-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className={cn('h-7 w-7 shrink-0 ring-1 ring-border', getModelColor(message.model))}>
          <AvatarFallback className={cn('bg-card text-xs', getModelColor(message.model))}>
            {getModelIcon(message.model)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <Card
        className={cn(
          'max-w-[80%] p-3 relative',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground',
          isStreaming && 'streaming-gradient'
        )}
      >
        <div className="prose prose-invert prose-sm max-w-none text-sm">
          <Markdown
            components={{
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '')
                const codeString = String(children).replace(/\n$/, '')
                const inline = !className?.includes('language-')
                
                if (!inline && match) {
                  return (
                    <div className="code-block my-2">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
                        <span className="text-xs text-muted-foreground font-mono uppercase">
                          {match[1]}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleCopyCode(codeString)}
                        >
                          {copiedCode === codeString ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="m-0 text-xs">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  )
                }
                
                return (
                  <code
                    className={cn(
                      'px-1 py-0.5 rounded bg-muted text-foreground font-mono text-xs',
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-normal">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
            }}
          >
            {message.content}
          </Markdown>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs opacity-40">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {!isUser && message.model && (
            <>
              <span>•</span>
              <span className="font-mono text-xs">{message.model}</span>
            </>
          )}
        </div>
      </Card>

      {isUser && (
        <Avatar className="h-7 w-7 shrink-0 ring-1 ring-primary/50">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User weight="duotone" className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
