import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Gear, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { ChatSettings } from '@/lib/types'
import { testConnection, fetchModels } from '@/lib/api'

interface SettingsDialogProps {
  settings: ChatSettings | null
  onSave: (settings: ChatSettings) => void
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [apiEndpoint, setApiEndpoint] = useState(settings?.apiEndpoint || 'http://127.0.0.1:5001/v1')
  const [apiKey, setApiKey] = useState(settings?.apiKey || 'YOUR_TOKEN')
  const [model, setModel] = useState(settings?.model || 'gpt-4o')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  useEffect(() => {
    if (open && apiEndpoint && apiKey) {
      loadAvailableModels()
    }
  }, [open, apiEndpoint, apiKey])

  const loadAvailableModels = async () => {
    setLoadingModels(true)
    const availableModels = await fetchModels(apiEndpoint, apiKey)
    setModels(availableModels)
    setLoadingModels(false)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    const result = await testConnection(apiEndpoint, apiKey)
    setTestResult(result ? 'success' : 'error')
    setTesting(false)

    if (result) {
      await loadAvailableModels()
    }
  }

  const handleSave = () => {
    onSave({ apiEndpoint, apiKey, model })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Gear className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your local OpenAI API endpoint and key
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="api-endpoint">API Endpoint</Label>
            <Input
              id="api-endpoint"
              placeholder="http://127.0.0.1:5001/v1"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="YOUR_TOKEN"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model">Model</Label>
            {models.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((modelId) => (
                    <SelectItem key={modelId} value={modelId}>
                      {modelId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="model"
                placeholder="gpt-4o"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loadingModels}
              />
            )}
            {loadingModels && (
              <p className="text-xs text-muted-foreground">Loading models...</p>
            )}
            {models.length === 0 && !loadingModels && apiEndpoint && apiKey && (
              <p className="text-xs text-muted-foreground">Test connection to load models</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !apiEndpoint || !apiKey}
              className="flex-1"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            {testResult === 'success' && (
              <div className="flex items-center gap-1 text-primary">
                <CheckCircle className="h-5 w-5" weight="fill" />
              </div>
            )}
            {testResult === 'error' && (
              <div className="flex items-center gap-1 text-destructive">
                <WarningCircle className="h-5 w-5" weight="fill" />
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={!apiEndpoint || !apiKey || !model}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
