import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner, CheckCircle, Robot, WifiHigh } from '@phosphor-icons/react'
import { scanOllamaServers, fetchOllamaModels } from '@/lib/ollama'
import { toast } from 'sonner'

interface OllamaServer {
  url: string
  models: string[]
}

interface OllamaDialogProps {
  onSelectModel: (url: string, model: string) => void
}

export function OllamaDialog({ onSelectModel }: OllamaDialogProps) {
  const [open, setOpen] = useState(false)
  const [customUrl, setCustomUrl] = useState('http://localhost:11434')
  const [servers, setServers] = useState<OllamaServer[]>([])
  const [scanning, setScanning] = useState(false)
  const [testingUrl, setTestingUrl] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    setServers([])
    toast.info('Scanning local network for Ollama servers...')
    
    try {
      const discovered = await scanOllamaServers()
      setServers(discovered)
      
      if (discovered.length === 0) {
        toast.warning('No Ollama servers found on local network')
      } else {
        toast.success(`Found ${discovered.length} Ollama server(s)`)
      }
    } catch (error) {
      toast.error('Failed to scan network')
      console.error('Scan error:', error)
    } finally {
      setScanning(false)
    }
  }

  const handleTestUrl = async () => {
    if (!customUrl.trim()) {
      toast.error('Please enter a URL')
      return
    }

    setTestingUrl(true)
    try {
      const models = await fetchOllamaModels(customUrl)
      
      if (models.length > 0) {
        // Add or update server in the list
        setServers(prev => {
          const existing = prev.findIndex(s => s.url === customUrl)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = { url: customUrl, models }
            return updated
          }
          return [{ url: customUrl, models }, ...prev]
        })
        toast.success(`Connected! Found ${models.length} model(s)`)
      } else {
        toast.warning('Connected but no models found. Pull models using: ollama pull <model>')
      }
    } catch (error) {
      toast.error('Failed to connect to Ollama server')
      console.error('Connection error:', error)
    } finally {
      setTestingUrl(false)
    }
  }

  const handleSelectModel = (url: string, model: string) => {
    onSelectModel(url, model)
    setOpen(false)
    toast.success(`Selected ${model} from ${url}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Robot className="h-4 w-4" weight="fill" />
          Connect Ollama
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Robot className="h-5 w-5" weight="fill" />
            Ollama Local Models
          </DialogTitle>
          <DialogDescription>
            Connect to Ollama servers on your local network or enter a custom URL
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          {/* Custom URL Section */}
          <div className="flex flex-col gap-2 p-4 bg-secondary/30 rounded-lg border border-border">
            <Label htmlFor="ollama-url" className="font-semibold">Custom URL</Label>
            <div className="flex gap-2">
              <Input
                id="ollama-url"
                placeholder="http://localhost:11434"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestUrl()}
              />
              <Button 
                onClick={handleTestUrl} 
                disabled={testingUrl || !customUrl.trim()}
                className="shrink-0"
              >
                {testingUrl ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Default: http://localhost:11434 • Ensure Ollama is running
            </p>
          </div>

          {/* Network Scan Section */}
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={handleScan}
              disabled={scanning}
              className="w-full gap-2"
            >
              {scanning ? (
                <>
                  <Spinner className="h-4 w-4 animate-spin" />
                  Scanning Network...
                </>
              ) : (
                <>
                  <WifiHigh className="h-4 w-4" />
                  Scan Local Network
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Searches common ports: 11434, 11435, 11436
            </p>
          </div>

          {/* Results Section */}
          {servers.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="font-semibold">Available Servers & Models</Label>
              <ScrollArea className="h-[300px] rounded-md border border-border">
                <div className="p-4 space-y-4">
                  {servers.map((server, serverIdx) => (
                    <div 
                      key={serverIdx}
                      className="flex flex-col gap-2 p-3 bg-secondary/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" weight="fill" />
                          <span className="font-mono text-sm font-medium">{server.url}</span>
                        </div>
                        <Badge variant="secondary">
                          {server.models.length} model{server.models.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      {server.models.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {server.models.map((model, modelIdx) => (
                            <Button
                              key={modelIdx}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectModel(server.url, model)}
                              className="justify-start font-mono text-xs h-auto py-2"
                            >
                              <Robot className="h-3 w-3 mr-2 shrink-0" weight="fill" />
                              <span className="truncate">{model}</span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No models available. Run: ollama pull &lt;model-name&gt;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {servers.length === 0 && !scanning && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2 text-muted-foreground">
              <Robot className="h-12 w-12 opacity-50" weight="fill" />
              <p className="text-sm">No servers found yet</p>
              <p className="text-xs max-w-md">
                Enter a custom URL or scan your network to discover Ollama servers
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
