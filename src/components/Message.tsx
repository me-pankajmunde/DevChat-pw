import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
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
        'flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className={cn('h-10 w-10 shrink-0 ring-2 ring-border', getModelColor(message.model))}>
          <AvatarFallback className={cn('bg-card', getModelColor(message.model))}>
            {getModelIcon(message.model)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <Card
        className={cn(
          'max-w-[80%] p-4 relative',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground',
          isStreaming && 'streaming-gradient'
        )}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '')
                const codeString = String(children).replace(/\n$/, '')
                const inline = !className?.includes('language-')
                
                if (!inline && match) {
                  return (
                    <div className="code-block my-4">
                      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                        <span className="text-xs text-muted-foreground font-mono uppercase">
                          {match[1]}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(codeString)}
                        >
                          {copiedCode === codeString ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="m-0">
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
                      'px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm',
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="mb-4 ml-4 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="mb-4 ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs opacity-50">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {!isUser && message.model && (
            <>
              <span>•</span>
              <span className="font-mono">{message.model}</span>
            </>
          )}
        </div>
      </Card>

      {isUser && (
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/50">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User weight="duotone" className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
