/**
 * Ollama API utilities for local model management
 * Supports network scanning and model discovery
 */

interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
}

interface OllamaModelsResponse {
  models: OllamaModel[]
}

interface OllamaServer {
  url: string
  models: string[]
}

/**
 * Normalize Ollama URL to base format
 */
function normalizeOllamaUrl(url: string): string {
  // Remove trailing slashes
  let normalized = url.replace(/\/+$/, '')
  
  // Remove /api if present
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4)
  }
  
  // Ensure http:// or https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'http://' + normalized
  }
  
  return normalized
}

/**
 * Fetch models from a specific Ollama server
 */
export async function fetchOllamaModels(url: string): Promise<string[]> {
  try {
    const baseUrl = normalizeOllamaUrl(url)
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data: OllamaModelsResponse = await response.json()
    
    if (data.models && Array.isArray(data.models)) {
      return data.models.map(model => model.name)
    }
    
    return []
  } catch (error) {
    console.error(`Error fetching models from ${url}:`, error)
    throw error
  }
}

/**
 * Test if an Ollama server is available at a given URL
 */
async function testOllamaServer(url: string): Promise<boolean> {
  try {
    const baseUrl = normalizeOllamaUrl(url)
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get local IP addresses to scan
 */
function getLocalIpRanges(): string[] {
  // Common local network ranges
  // In a real implementation, you'd detect the actual network
  return [
    '127.0.0.1',
    'localhost',
    // Add more IPs if you can detect them via WebRTC or other means
  ]
}

/**
 * Scan local network for Ollama servers
 * Note: Browser limitations prevent true network scanning
 * This implementation checks common localhost configurations
 */
export async function scanOllamaServers(): Promise<OllamaServer[]> {
  const servers: OllamaServer[] = []
  const commonPorts = [11434, 11435, 11436] // Ollama default and alternatives
  const hosts = ['localhost', '127.0.0.1']
  
  // Due to browser security restrictions, we can only scan localhost
  // For LAN scanning, you'd need a backend service
  const urlsToTest: string[] = []
  
  for (const host of hosts) {
    for (const port of commonPorts) {
      urlsToTest.push(`http://${host}:${port}`)
    }
  }

  // Test all URLs in parallel
  const testPromises = urlsToTest.map(async (url) => {
    try {
      const isAvailable = await testOllamaServer(url)
      if (isAvailable) {
        const models = await fetchOllamaModels(url)
        return { url, models }
      }
    } catch (error) {
      // Silently fail for each URL
      return null
    }
    return null
  })

  const results = await Promise.all(testPromises)
  
  // Filter out null results and duplicates
  const uniqueServers = new Map<string, OllamaServer>()
  
  for (const result of results) {
    if (result && !uniqueServers.has(result.url)) {
      uniqueServers.set(result.url, result)
    }
  }

  return Array.from(uniqueServers.values())
}

/**
 * Test Ollama connection
 */
export async function testOllamaConnection(url: string): Promise<boolean> {
  return testOllamaServer(url)
}

/**
 * Generate chat completion with Ollama
 */
export async function ollamaChatCompletion(
  url: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  abortSignal?: AbortSignal
) {
  try {
    const baseUrl = normalizeOllamaUrl(url)
    
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal: abortSignal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
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
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          
          if (data.message?.content) {
            onToken(data.message.content)
          }
          
          // Ollama sends done: true when complete
          if (data.done) {
            return
          }
        } catch (e) {
          console.error('Failed to parse Ollama chunk:', e)
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
