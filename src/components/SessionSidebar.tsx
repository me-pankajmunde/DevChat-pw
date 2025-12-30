import { useState } from 'react'
import { ChatSession } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Trash, 
  PencilSimple, 
  Check, 
  X,
  ChatCircle,
  MagnifyingGlass
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface SessionSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onCreateSession: () => void
  onDeleteSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, newTitle: string) => void
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession
}: SessionSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditTitle(session.title)
  }

  const handleSaveEdit = (sessionId: string) => {
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim())
    }
    setEditingSessionId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingSessionId(null)
    setEditTitle('')
  }

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedSessions = [...filteredSessions].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border space-y-3">
        <Button 
          onClick={onCreateSession}
          className="w-full justify-start gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" weight="bold" />
          New Chat
        </Button>
        
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <ChatCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No matching chats' : 'No chat sessions yet'}
              </p>
            </div>
          ) : (
            sortedSessions.map((session) => {
              const isEditing = editingSessionId === session.id
              const isActive = currentSessionId === session.id
              const messageCount = session.messages.length
              const lastMessageTime = session.updatedAt

              return (
                <div
                  key={session.id}
                  className={cn(
                    'group rounded-lg transition-colors relative',
                    isActive ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                >
                  {isEditing ? (
                    <div className="p-3 flex items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(session.id)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleSaveEdit(session.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="p-3 cursor-pointer flex items-start gap-2"
                      onClick={() => onSelectSession(session.id)}
                    >
                      <ChatCircle 
                        className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" 
                        weight={isActive ? 'fill' : 'regular'}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          isActive ? 'text-accent-foreground' : 'text-foreground'
                        )}>
                          {session.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(lastMessageTime, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 shrink-0 ml-2',
                        'opacity-0 group-hover:opacity-100 transition-opacity'
                      )}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartEdit(session)
                          }}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete "${session.title}"?`)) {
                              onDeleteSession(session.id)
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </div>
      </div>
    </div>
  )
}
