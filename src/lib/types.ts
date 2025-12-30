export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  model?: string
}

export type MessageDensity = 'compact' | 'normal' | 'comfortable'
export type Wallpaper = 'none' | 'dots' | 'grid' | 'waves' | 'geometric' | 'bubbles' | 'diagonal' | 'hexagon' | 'custom'

export interface ChatSettings {
  apiEndpoint: string
  apiKey: string
  model: string
  theme?: string
  messageDensity?: MessageDensity
  wallpaper?: Wallpaper
  customWallpaperUrl?: string
  wallpaperOpacity?: number
  wallpaperBlur?: number
}

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
