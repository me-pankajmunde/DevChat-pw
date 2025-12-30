export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatSettings {
  apiEndpoint: string
  apiKey: string
  model: string
}

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
