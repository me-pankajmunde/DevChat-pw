/**
 * Authentication utilities using Supabase Auth
 * Supports GitHub and Google OAuth
 */

import { getSupabaseClient, initializeSupabase, getDefaultSupabaseConfig } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  login: string
  avatarUrl: string
  email?: string
  id: string
  isOwner: boolean
  provider?: 'github' | 'google'
}

const USER_KEY = 'devchat_user'

/**
 * Initialize Supabase if not already initialized
 */
function ensureSupabaseInitialized() {
  let client = getSupabaseClient()
  if (!client) {
    const config = getDefaultSupabaseConfig()
    if (!config) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
    }
    client = initializeSupabase(config.url, config.anonKey)
  }
  return client
}

/**
 * Convert Supabase user to our User type
 */
function supabaseUserToUser(supabaseUser: SupabaseUser): User {
  const metadata = supabaseUser.user_metadata || {}
  const provider = supabaseUser.app_metadata?.provider || 'github'
  
  return {
    login: metadata.user_name || metadata.full_name || metadata.name || supabaseUser.email?.split('@')[0] || 'user',
    avatarUrl: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
    email: supabaseUser.email,
    id: supabaseUser.id,
    isOwner: true,
    provider: provider as 'github' | 'google'
  }
}

/**
 * Get the current user from Supabase session
 */
export async function getUser(): Promise<User | null> {
  try {
    const client = ensureSupabaseInitialized()
    const { data: { user } } = await client.auth.getUser()
    
    if (!user) {
      // Try to get from localStorage as fallback
      const userJson = localStorage.getItem(USER_KEY)
      if (userJson) {
        return JSON.parse(userJson) as User
      }
      return null
    }
    
    const convertedUser = supabaseUserToUser(user)
    // Cache in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(convertedUser))
    return convertedUser
  } catch (error) {
    console.error('Failed to get user:', error)
    // Try localStorage fallback
    try {
      const userJson = localStorage.getItem(USER_KEY)
      if (userJson) {
        return JSON.parse(userJson) as User
      }
    } catch (e) {
      console.error('Failed to get user from localStorage:', e)
    }
    return null
  }
}

/**
 * Set the current user in localStorage
 */
export async function setUser(user: User | null): Promise<void> {
  try {
    if (user === null) {
      localStorage.removeItem(USER_KEY)
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  } catch (error) {
    console.error('Failed to set user:', error)
    throw error
  }
}

/**
 * Sign in with GitHub using Supabase Auth
 */
export async function signInWithGitHub(): Promise<User> {
  try {
    const client = ensureSupabaseInitialized()
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
        scopes: 'user:email'
      }
    })
    
    if (error) throw error
    
    // The actual user will be available after redirect
    // For now, return a placeholder - the app will reload after OAuth callback
    throw new Error('OAUTH_REDIRECT')
  } catch (error) {
    if (error instanceof Error && error.message === 'OAUTH_REDIRECT') {
      throw error
    }
    console.error('GitHub sign in failed:', error)
    throw error
  }
}

/**
 * Sign in with Google using Supabase Auth
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const client = ensureSupabaseInitialized()
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) throw error
    
    // The actual user will be available after redirect
    throw new Error('OAUTH_REDIRECT')
  } catch (error) {
    if (error instanceof Error && error.message === 'OAUTH_REDIRECT') {
      throw error
    }
    console.error('Google sign in failed:', error)
    throw error
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const client = getSupabaseClient()
    if (client) {
      await client.auth.signOut()
    }
  } catch (error) {
    console.error('Sign out failed:', error)
  } finally {
    await setUser(null)
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return user !== null
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  try {
    const client = ensureSupabaseInitialized()
    
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = supabaseUserToUser(session.user)
        await setUser(user)
        callback(user)
      } else {
        await setUser(null)
        callback(null)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  } catch (error) {
    console.error('Failed to set up auth state listener:', error)
    return () => {}
  }
}
