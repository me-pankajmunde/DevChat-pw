import { useState } from 'react'
import { ChatSession } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tag, X, Plus } from '@phosphor-icons/react'

interface TagDialogProps {
  session: ChatSession
  allTags: string[]
  onUpdateTags: (sessionId: string, tags: string[]) => void
  trigger?: React.ReactNode
}

export function TagDialog({ session, allTags, onUpdateTags, trigger }: TagDialogProps) {
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(session.tags || [])

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const handleSave = () => {
    onUpdateTags(session.id, selectedTags)
    setOpen(false)
  }

  const suggestedTags = allTags
    .filter(tag => !selectedTags.includes(tag))
    .slice(0, 8)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Tag className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-tag">Add Tag</Label>
            <div className="flex gap-2">
              <Input
                id="new-tag"
                placeholder="Enter tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button 
                onClick={handleAddTag} 
                size="icon"
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>Current Tags</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pl-2 pr-1 py-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-accent/50 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {suggestedTags.length > 0 && (
            <div className="space-y-2">
              <Label>Suggested Tags</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedTags([...selectedTags, tag])}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Tags
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
