export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  model?: string
}

export type MessageDensity = 'compact' | 'normal' | 'comfortable'

export interface ChatSettings {
  apiEndpoint: string
  apiKey: string
  model: string
  theme?: string
  messageDensity?: MessageDensity
}

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
