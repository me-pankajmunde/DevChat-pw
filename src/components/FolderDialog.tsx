import { useState, useEffect } from 'react'
import { SessionFolder } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FolderPlus } from '@phosphor-icons/react'

interface FolderDialogProps {
  onCreateFolder: (name: string, color: string) => void
  onRenameFolder?: (folderId: string, newName: string, newColor: string) => void
  folder?: SessionFolder
  trigger?: React.ReactNode
}

const FOLDER_COLORS = [
  { name: 'Blue', value: 'oklch(0.65 0.15 230)' },
  { name: 'Green', value: 'oklch(0.65 0.15 150)' },
  { name: 'Orange', value: 'oklch(0.70 0.18 50)' },
  { name: 'Purple', value: 'oklch(0.65 0.20 290)' },
  { name: 'Pink', value: 'oklch(0.70 0.20 350)' },
  { name: 'Red', value: 'oklch(0.60 0.22 25)' },
  { name: 'Teal', value: 'oklch(0.65 0.15 195)' },
  { name: 'Yellow', value: 'oklch(0.75 0.18 90)' },
]

export function FolderDialog({ onCreateFolder, onRenameFolder, folder, trigger }: FolderDialogProps) {
  const [open, setOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value)
  const isEditMode = !!folder

  useEffect(() => {
    if (folder) {
      setFolderName(folder.name)
      setSelectedColor(folder.color || FOLDER_COLORS[0].value)
    } else {
      setFolderName('')
      setSelectedColor(FOLDER_COLORS[0].value)
    }
  }, [folder, open])

  const handleSubmit = () => {
    if (folderName.trim()) {
      if (isEditMode && folder && onRenameFolder) {
        onRenameFolder(folder.id, folderName.trim(), selectedColor)
      } else {
        onCreateFolder(folderName.trim(), selectedColor)
      }
      setFolderName('')
      setSelectedColor(FOLDER_COLORS[0].value)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Work, Personal, Projects..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit()
                }
              }}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Folder Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className="relative h-10 rounded-lg border-2 transition-all hover:scale-105"
                  style={{
                    backgroundColor: color.value,
                    borderColor: selectedColor === color.value ? 'oklch(0.92 0.02 200)' : 'transparent'
                  }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!folderName.trim()}>
            {isEditMode ? 'Save Changes' : 'Create Folder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
