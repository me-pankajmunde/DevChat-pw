import { ImageAttachment as ImageAttachmentType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface ImageAttachmentProps {
  image: ImageAttachmentType
  onRemove?: () => void
  className?: string
  showRemove?: boolean
}

export function ImageAttachment({ image, onRemove, className, showRemove = false }: ImageAttachmentProps) {
  return (
    <div className={cn('relative group inline-block', className)}>
      <img
        src={image.url}
        alt={image.name}
        className="rounded-md object-cover border border-border max-h-48"
      />
      {showRemove && onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
