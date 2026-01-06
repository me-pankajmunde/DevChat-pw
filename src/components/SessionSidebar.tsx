import { useState } from 'react'
import { ChatSession, SessionFolder } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash, 
  PencilSimple, 
  Check, 
  X,
  ChatCircle,
  MagnifyingGlass,
  Folder,
  FolderOpen,
  CaretRight,
  CaretDown,
  Tag as TagIcon,
  DotsThree,
  DotsSixVertical,
  Download
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { FolderDialog } from './FolderDialog'
import { TagDialog } from './TagDialog'
import { exportSingleSession } from '@/lib/export-import'
import { toast } from 'sonner'

interface SessionSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  folders: SessionFolder[]
  onSelectSession: (sessionId: string) => void
  onCreateSession: () => void
  onDeleteSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, newTitle: string) => void
  onCreateFolder: (name: string, color: string) => void
  onDeleteFolder: (folderId: string) => void
  onRenameFolder: (folderId: string, newName: string, newColor: string) => void
  onMoveToFolder: (sessionId: string, folderId: string | undefined) => void
  onUpdateTags: (sessionId: string, tags: string[]) => void
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  folders,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onMoveToFolder,
  onUpdateTags
}: SessionSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['uncategorized']))
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null)
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null)

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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    setDraggedSessionId(sessionId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', sessionId)
  }

  const handleDragEnd = () => {
    setDraggedSessionId(null)
    setDropTargetFolderId(null)
  }

  const handleDragOver = (e: React.DragEvent, folderId: string | undefined) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetFolderId(folderId || 'uncategorized')
  }

  const handleDragLeave = () => {
    setDropTargetFolderId(null)
  }

  const handleDrop = (e: React.DragEvent, folderId: string | undefined) => {
    e.preventDefault()
    const sessionId = e.dataTransfer.getData('text/plain')
    
    if (sessionId && draggedSessionId === sessionId) {
      onMoveToFolder(sessionId, folderId)
    }
    
    setDraggedSessionId(null)
    setDropTargetFolderId(null)
  }

  const allTags = Array.from(
    new Set(sessions.flatMap(s => s.tags || []))
  ).sort()

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => session.tags?.includes(tag))
    return matchesSearch && matchesTags
  })

  const sessionsByFolder = filteredSessions.reduce((acc, session) => {
    const folderId = session.folderId || 'uncategorized'
    if (!acc[folderId]) {
      acc[folderId] = []
    }
    acc[folderId].push(session)
    return acc
  }, {} as Record<string, ChatSession[]>)

  Object.keys(sessionsByFolder).forEach(folderId => {
    sessionsByFolder[folderId].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const renderSessionItem = (session: ChatSession) => {
    const isEditing = editingSessionId === session.id
    const isActive = currentSessionId === session.id
    const messageCount = session.messages.length
    const lastMessageTime = session.updatedAt
    const isDragging = draggedSessionId === session.id

    return (
      <div
        key={session.id}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, session.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          'group rounded-lg transition-all relative',
          isActive ? 'bg-accent' : 'hover:bg-accent/50',
          isDragging && 'opacity-50 cursor-grabbing'
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
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <DotsSixVertical 
                className={cn(
                  "h-4 w-4 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity",
                  isActive ? "text-accent-foreground/70" : "text-muted-foreground",
                  isDragging && "cursor-grabbing opacity-100"
                )}
                weight="bold"
              />
              <ChatCircle 
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-accent-foreground" : "text-muted-foreground"
                )}
                weight={isActive ? 'fill' : 'regular'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium truncate',
                isActive ? 'text-accent-foreground' : 'text-foreground'
              )}>
                {session.title}
              </p>
              <div className={cn(
                "flex items-center gap-2 mt-1 flex-wrap text-xs",
                isActive ? "text-accent-foreground/90" : "text-muted-foreground"
              )}>
                <p>
                  {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                </p>
                <span>•</span>
                <p>
                  {formatDistanceToNow(lastMessageTime, { addSuffix: true })}
                </p>
              </div>
              {session.tags && session.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {session.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className={cn(
              'flex items-center gap-1 shrink-0 ml-2',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-7 w-7",
                      isActive && "text-accent-foreground hover:bg-accent-foreground/10 hover:text-accent-foreground"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DotsThree className="h-4 w-4" weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStartEdit(session)}>
                    <PencilSimple className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <TagDialog 
                    session={session}
                    allTags={allTags}
                    onUpdateTags={onUpdateTags}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <TagIcon className="h-4 w-4 mr-2" />
                        Manage Tags
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem onClick={() => {
                    exportSingleSession(session)
                    toast.success('Chat exported', {
                      description: `${session.title} exported successfully`
                    })
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Chat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {folders.length > 0 && (
                    <>
                      <DropdownMenuItem onClick={() => onMoveToFolder(session.id, undefined)}>
                        <Folder className="h-4 w-4 mr-2" />
                        No Folder
                      </DropdownMenuItem>
                      {folders.map(folder => (
                        <DropdownMenuItem 
                          key={folder.id}
                          onClick={() => onMoveToFolder(session.id, folder.id)}
                        >
                          <Folder className="h-4 w-4 mr-2" style={{ color: folder.color }} />
                          {folder.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${session.title}"?`)) {
                        onDeleteSession(session.id)
                      }
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    )
  }

  const currentSession = sessions.find(s => s.id === currentSessionId)

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {currentSession && (
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <ChatCircle className="h-5 w-5 text-primary" weight="fill" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Chat</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground truncate">
            {currentSession.title}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{currentSession.messages.length} {currentSession.messages.length === 1 ? 'message' : 'messages'}</span>
            <span>•</span>
            <span>{formatDistanceToNow(currentSession.updatedAt, { addSuffix: true })}</span>
          </div>
        </div>
      )}
      <div className="p-4 border-b border-border space-y-3">
        <Button 
          onClick={onCreateSession}
          className="w-full justify-start gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" weight="bold" />
          New Chat
        </Button>
        
        <FolderDialog onCreateFolder={onCreateFolder} />
        
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TagIcon className="h-3 w-3" />
              <span>Filter by tags:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <ChatCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No chat sessions yet
              </p>
            </div>
          ) : (
            <>
              {folders.map(folder => {
                const folderSessions = sessionsByFolder[folder.id] || []
                const isExpanded = expandedFolders.has(folder.id)
                const isDropTarget = dropTargetFolderId === folder.id
                
                return (
                  <div 
                    key={folder.id} 
                    className="mb-2"
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                  >
                    <div className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group",
                      isDropTarget && "bg-accent/50 ring-2 ring-primary"
                    )}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleFolder(folder.id)}
                      >
                        {isExpanded ? (
                          <CaretDown className="h-4 w-4" />
                        ) : (
                          <CaretRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Folder className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
                        <span className="text-sm font-medium truncate">{folder.name}</span>
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {folderSessions.length}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DotsThree className="h-4 w-4" weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <FolderDialog 
                            folder={folder}
                            onCreateFolder={onCreateFolder}
                            onRenameFolder={onRenameFolder}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <PencilSimple className="h-4 w-4 mr-2" />
                                Edit Folder
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete folder "${folder.name}"? Sessions will be moved to uncategorized.`)) {
                                onDeleteFolder(folder.id)
                              }
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {isExpanded && (
                      <div className="ml-8 space-y-1">
                        {folderSessions.length > 0 ? (
                          folderSessions.map(session => renderSessionItem(session))
                        ) : (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            No chats in this folder
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {sessionsByFolder['uncategorized'] && sessionsByFolder['uncategorized'].length > 0 && (
                <div 
                  className="mb-2"
                  onDragOver={(e) => handleDragOver(e, undefined)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, undefined)}
                >
                  <div className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
                    dropTargetFolderId === 'uncategorized' && "bg-accent/50 ring-2 ring-primary"
                  )}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleFolder('uncategorized')}
                    >
                      {expandedFolders.has('uncategorized') ? (
                        <CaretDown className="h-4 w-4" />
                      ) : (
                        <CaretRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex items-center gap-2 flex-1">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Uncategorized</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {sessionsByFolder['uncategorized'].length}
                      </Badge>
                    </div>
                  </div>
                  {expandedFolders.has('uncategorized') && (
                    <div className="ml-8 space-y-1">
                      {sessionsByFolder['uncategorized'].map(session => renderSessionItem(session))}
                    </div>
                  )}
                </div>
              )}
              
              {Object.keys(sessionsByFolder).length === 0 && folders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <ChatCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || selectedTags.length > 0 ? 'No matching chats' : 'No chat sessions yet'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          {folders.length > 0 && ` • ${folders.length} ${folders.length === 1 ? 'folder' : 'folders'}`}
        </div>
      </div>
    </div>
  )
}
