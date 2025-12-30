export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  model?: string
}

export interface ChatSettings {
  apiEndpoint: string
  apiKey: string
  model: string
  theme?: string
}

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
