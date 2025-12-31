import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Gear, CheckCircle, WarningCircle, Image as ImageIcon, X } from '@phosphor-icons/react'
import { ChatSettings, MessageDensity, Wallpaper } from '@/lib/types'
import { testConnection, fetchModels } from '@/lib/api'
import { themes, applyTheme } from '@/lib/themes'
import { wallpapers, getWallpaperStyle } from '@/lib/wallpapers'
import { toast } from 'sonner'

interface SettingsDialogProps {
  settings: ChatSettings | null
  onSave: (settings: ChatSettings) => void
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [apiEndpoint, setApiEndpoint] = useState(settings?.apiEndpoint || 'http://127.0.0.1:5001/v1')
  const [apiKey, setApiKey] = useState(settings?.apiKey || 'YOUR_TOKEN')
  const [model, setModel] = useState(settings?.model || 'gpt-4o')
  const [theme, setTheme] = useState(settings?.theme || 'cyber-teal')
  const [messageDensity, setMessageDensity] = useState<MessageDensity>(settings?.messageDensity || 'normal')
  const [wallpaper, setWallpaper] = useState<Wallpaper>(settings?.wallpaper || 'none')
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string>(settings?.customWallpaperUrl || '')
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(settings?.wallpaperOpacity ?? 1)
  const [wallpaperBlur, setWallpaperBlur] = useState<number>(settings?.wallpaperBlur ?? 0)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    onSave({ apiEndpoint, apiKey, model, theme, messageDensity, wallpaper, customWallpaperUrl, wallpaperOpacity, wallpaperBlur })
    setOpen(false)
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      if (imageUrl) {
        setCustomWallpaperUrl(imageUrl)
        setWallpaper('custom')
        toast.success('Custom wallpaper uploaded')
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCustomWallpaper = () => {
    setCustomWallpaperUrl('')
    setWallpaper('none')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Custom wallpaper removed')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Gear className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API and customize the app appearance
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

          <Separator className="my-2" />

          <div className="flex flex-col gap-2">
            <Label htmlFor="theme">Color Theme</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, themeData]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-border" 
                        style={{ backgroundColor: themeData.colors.primary }}
                      />
                      {themeData.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {Object.entries(themes).map(([key, themeData]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleThemeChange(key)}
                  className={`relative h-12 rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                    theme === key ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                  title={themeData.name}
                >
                  <div className="absolute inset-0 flex">
                    <div className="flex-1" style={{ backgroundColor: themeData.colors.background }} />
                    <div className="flex-1" style={{ backgroundColor: themeData.colors.primary }} />
                    <div className="flex-1" style={{ backgroundColor: themeData.colors.accent }} />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a color scheme that suits your preference
            </p>
          </div>

          <Separator className="my-2" />

          <div className="flex flex-col gap-2">
            <Label htmlFor="message-density">Message Density</Label>
            <Select value={messageDensity} onValueChange={(value) => setMessageDensity(value as MessageDensity)}>
              <SelectTrigger id="message-density">
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Compact</span>
                    <span className="text-xs text-muted-foreground">Minimal spacing, smaller text</span>
                  </div>
                </SelectItem>
                <SelectItem value="normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Normal</span>
                    <span className="text-xs text-muted-foreground">Balanced spacing and readability</span>
                  </div>
                </SelectItem>
                <SelectItem value="comfortable">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Comfortable</span>
                    <span className="text-xs text-muted-foreground">Generous spacing, larger text</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adjust how much space messages take up on screen
            </p>
          </div>

          <Separator className="my-2" />

          <div className="flex flex-col gap-2">
            <Label htmlFor="wallpaper">Chat Wallpaper</Label>
            <Select value={wallpaper} onValueChange={(value) => setWallpaper(value as Wallpaper)}>
              <SelectTrigger id="wallpaper">
                <SelectValue placeholder="Select wallpaper" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(wallpapers).map(([key, data]) => (
                  <SelectItem key={key} value={key}>
                    {data.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {Object.entries(wallpapers).map(([key, data]) => {
                const wallpaperKey = key as Wallpaper
                const isCustomWithImage = wallpaperKey === 'custom' && customWallpaperUrl
                
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (wallpaperKey === 'custom' && !customWallpaperUrl) {
                        fileInputRef.current?.click()
                      } else {
                        setWallpaper(wallpaperKey)
                      }
                    }}
                    className={`relative h-16 rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                      wallpaper === wallpaperKey ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    }`}
                    title={data.name}
                    style={{
                      backgroundColor: 'oklch(0.15 0.01 240)',
                      ...(isCustomWithImage ? getWallpaperStyle('custom', customWallpaperUrl) : getWallpaperStyle(wallpaperKey)),
                    }}
                  >
                    {wallpaperKey === 'none' && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                        None
                      </div>
                    )}
                    {wallpaperKey === 'custom' && !customWallpaperUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {(wallpaper === 'custom' || customWallpaperUrl) && (
              <div className="flex flex-col gap-2 mt-2 p-3 bg-secondary/50 rounded-md border border-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-wallpaper" className="text-sm font-medium">
                    Custom Image
                  </Label>
                  {customWallpaperUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCustomWallpaper}
                      className="h-7 px-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="custom-wallpaper"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {customWallpaperUrl ? 'Change Image' : 'Upload Image'}
                </Button>
                {customWallpaperUrl && (
                  <div className="relative w-full h-20 rounded-md overflow-hidden border border-border">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${customWallpaperUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload an image (max 5MB). Supports JPG, PNG, GIF, WebP.
                </p>
              </div>
            )}

            {wallpaper !== 'none' && (
              <div className="flex flex-col gap-4 mt-3 p-3 bg-secondary/30 rounded-md border border-border">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="wallpaper-opacity" className="text-sm font-medium">
                      Opacity
                    </Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(wallpaperOpacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="wallpaper-opacity"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={[wallpaperOpacity]}
                    onValueChange={(value) => setWallpaperOpacity(value[0])}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust wallpaper transparency
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="wallpaper-blur" className="text-sm font-medium">
                      Blur
                    </Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {wallpaperBlur}px
                    </span>
                  </div>
                  <Slider
                    id="wallpaper-blur"
                    min={0}
                    max={20}
                    step={1}
                    value={[wallpaperBlur]}
                    onValueChange={(value) => setWallpaperBlur(value[0])}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add blur effect to wallpaper
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Add a subtle background pattern or custom image to the chat area
            </p>
          </div>

          <Separator className="my-2" />

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
