import { OpenAIMessage } from './types'

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '')
}

function buildChatUrl(endpoint: string): string {
  const normalized = normalizeEndpoint(endpoint)
  if (normalized.endsWith('/v1')) {
    return `${normalized}/chat/completions`
  }
  return `${normalized}/v1/chat/completions`
}

function buildModelsUrl(endpoint: string): string {
  const normalized = normalizeEndpoint(endpoint)
  if (normalized.endsWith('/v1')) {
    return `${normalized}/models`
  }
  return `${normalized}/v1/models`
}

export async function streamChatCompletion(
  endpoint: string,
  apiKey: string,
  messages: OpenAIMessage[],
  model: string,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  abortSignal?: AbortSignal
) {
  try {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array is empty')
    }

    const url = buildChatUrl(endpoint)
    const requestBody = {
      model,
      messages,
      stream: true,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              onToken(content)
            }
          } catch (e) {
            console.error('Failed to parse chunk:', e)
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    onError(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}

export async function testConnection(endpoint: string, apiKey: string): Promise<boolean> {
  try {
    const url = buildModelsUrl(endpoint)
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

export async function fetchModels(endpoint: string, apiKey: string): Promise<string[]> {
  try {
    const url = buildModelsUrl(endpoint)
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model: any) => model.id)
    }
    
    return []
  } catch (error) {
    console.error('Error fetching models:', error)
    return []
  }
}
