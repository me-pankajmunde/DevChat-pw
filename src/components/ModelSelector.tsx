import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChatSettings } from '@/lib/types'
import { fetchModels } from '@/lib/api'
import { fetchOllamaModels } from '@/lib/ollama'
import { Spinner } from '@phosphor-icons/react'

interface ModelSelectorProps {
  settings: ChatSettings
  onModelChange: (model: string) => void
  disabled?: boolean
}

export function ModelSelector({ settings, onModelChange, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadModels()
  }, [settings.apiEndpoint, settings.apiKey, settings.provider])

  const loadModels = async () => {
    setLoading(true)
    try {
      let availableModels: string[]
      if (settings.provider === 'ollama') {
        availableModels = await fetchOllamaModels(settings.apiEndpoint)
      } else {
        availableModels = await fetchModels(settings.apiEndpoint, settings.apiKey)
      }
      setModels(availableModels)
    } catch (error) {
      console.error('Error loading models:', error)
      setModels([])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
        <Spinner className="h-3 w-3 animate-spin" />
        <span className="text-xs">Loading models...</span>
      </Badge>
    )
  }

  if (models.length === 0) {
    return (
      <Badge variant="secondary" className="px-3 py-1.5">
        <span className="text-xs">{settings.model}</span>
      </Badge>
    )
  }

  return (
    <Select value={settings.model} onValueChange={onModelChange} disabled={disabled}>
      <SelectTrigger className="w-[180px] h-9 bg-secondary/50 border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {models.map((modelId) => (
          <SelectItem key={modelId} value={modelId}>
            {modelId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
