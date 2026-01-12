export interface ImageAttachment {
  id: string
  url: string
  name: string
  size: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  model?: string
  images?: ImageAttachment[]
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model?: string
  folderId?: string
  tags?: string[]
}

export interface SessionFolder {
  id: string
  name: string
  color?: string
  createdAt: number
}

export type MessageDensity = 'compact' | 'normal' | 'comfortable'
export type Wallpaper = 'none' | 'dots' | 'grid' | 'waves' | 'geometric' | 'bubbles' | 'diagonal' | 'hexagon' | 'custom'
export type ApiProvider = 'openai' | 'ollama'

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
  provider?: ApiProvider
}

export type OpenAIMessageContent = string | Array<{
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}>

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: OpenAIMessageContent
}
