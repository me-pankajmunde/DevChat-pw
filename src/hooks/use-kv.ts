import { useState, useEffect, useCallback } from 'react'

const KV_PREFIX = '__devchat_kv__'

/**
 * localStorage-based key-value storage hook
 * Mimics the @github/spark useKV API but uses browser localStorage
 */
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from localStorage or use default
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(KV_PREFIX + key)
      if (item === null) {
        // Set default value in localStorage
        localStorage.setItem(KV_PREFIX + key, JSON.stringify(defaultValue))
        return defaultValue
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Failed to read key ${key} from localStorage:`, error)
      return defaultValue
    }
  })

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(KV_PREFIX + key, JSON.stringify(state))
    } catch (error) {
      console.error(`Failed to persist key ${key} to localStorage:`, error)
    }
  }, [key, state])

  // Enhanced setter that handles functional updates
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value
      return newValue
    })
  }, [])

  return [state, setValue]
}

/**
 * Direct KV storage API (for non-React contexts)
 */
export const kv = {
  async keys(): Promise<string[]> {
    const allKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(KV_PREFIX)) {
        allKeys.push(key.substring(KV_PREFIX.length))
      }
    }
    return allKeys
  },

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const item = localStorage.getItem(KV_PREFIX + key)
      if (item === null) return undefined
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Failed to get key ${key}:`, error)
      return undefined
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(KV_PREFIX + key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to set key ${key}:`, error)
      throw new Error(`Failed to set key: ${key}`)
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(KV_PREFIX + key)
    } catch (error) {
      console.error(`Failed to delete key ${key}:`, error)
    }
  }
}
