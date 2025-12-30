import { useState } from 'react'
import Markdown from 'react-markdown'
import { Message as MessageType, MessageDensity } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getModelIcon, getModelColor } from '@/lib/model-icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Check, User } from '@phosphor-icons/react'

interface MessageProps {
  message: MessageType
  isStreaming?: boolean
  density?: MessageDensity
}

export function Message({ message, isStreaming, density = 'normal' }: MessageProps) {
  const isUser = message.role === 'user'
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const densityClasses = {
    compact: {
      avatar: 'h-6 w-6',
      card: 'p-2',
      text: 'text-xs prose-xs',
      timestamp: 'text-[10px]',
      gap: 'gap-1.5',
    },
    normal: {
      avatar: 'h-7 w-7',
      card: 'p-3',
      text: 'text-sm prose-sm',
      timestamp: 'text-xs',
      gap: 'gap-2',
    },
    comfortable: {
      avatar: 'h-8 w-8',
      card: 'p-4',
      text: 'text-base prose-base',
      timestamp: 'text-sm',
      gap: 'gap-3',
    },
  }

  const classes = densityClasses[density]

  return (
    <div
      className={cn(
        'flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300',
        classes.gap,
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className={cn(classes.avatar, 'shrink-0 ring-1 ring-border', getModelColor(message.model))}>
          <AvatarFallback className={cn('bg-card text-xs', getModelColor(message.model))}>
            {getModelIcon(message.model)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <Card
        className={cn(
          'max-w-[80%] relative',
          classes.card,
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground',
          isStreaming && 'streaming-gradient'
        )}
      >
        <div className={cn('prose prose-invert max-w-none', classes.text)}>
          <Markdown
            components={{
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '')
                const codeString = String(children).replace(/\n$/, '')
                const inline = !className?.includes('language-')
                
                if (!inline && match) {
                  return (
                    <div className={cn('code-block', density === 'compact' ? 'my-1' : 'my-2')}>
                      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
                        <span className={cn('font-mono uppercase', density === 'compact' ? 'text-[10px]' : 'text-xs', 'text-muted-foreground')}>
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
                      <pre className={cn('m-0', density === 'compact' ? 'text-[11px]' : 'text-xs')}>
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
                      'px-1 py-0.5 rounded bg-muted text-foreground font-mono',
                      density === 'compact' ? 'text-[11px]' : 'text-xs',
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              p: ({ children }) => <p className={cn(density === 'compact' ? 'mb-1' : 'mb-2', 'last:mb-0 leading-normal')}>{children}</p>,
              ul: ({ children }) => <ul className={cn(density === 'compact' ? 'mb-1 ml-3' : 'mb-2 ml-4', 'list-disc')}>{children}</ul>,
              ol: ({ children }) => <ol className={cn(density === 'compact' ? 'mb-1 ml-3' : 'mb-2 ml-4', 'list-decimal')}>{children}</ol>,
              li: ({ children }) => <li className={density === 'compact' ? 'mb-0' : 'mb-0.5'}>{children}</li>,
            }}
          >
            {message.content}
          </Markdown>
        </div>
        <div className={cn('flex items-center gap-1.5 opacity-40', classes.timestamp, density === 'compact' ? 'mt-1' : 'mt-1.5')}>
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {!isUser && message.model && (
            <>
              <span>•</span>
              <span className={cn('font-mono', classes.timestamp)}>{message.model}</span>
            </>
          )}
        </div>
      </Card>

      {isUser && (
        <Avatar className={cn(classes.avatar, 'shrink-0 ring-1 ring-primary/50')}>
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User weight="duotone" className={density === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
