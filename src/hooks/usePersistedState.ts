import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

/**
 * Hook for persisting state that survives tab switches and page reloads
 * Follows SaaS principles: data persistence, real-time sync, offline support
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: {
    syncToDatabase?: boolean
    syncInterval?: number
    storageType?: 'localStorage' | 'sessionStorage' | 'chrome'
  } = {}
) {
  const { user } = useAuth()
  const {
    syncToDatabase = false,
    syncInterval = 30000, // 30 seconds
    storageType = 'localStorage'
  } = options

  // Create user-specific key to prevent data leakage between users
  const userKey = user ? `${key}_${user.id}` : `${key}_anonymous`

  const [state, setState] = useState<T>(() => {
    try {
      // Try to load from storage first
      let stored: string | null = null

      if (storageType === 'chrome' && typeof chrome !== 'undefined' && chrome.storage) {
        // For Chrome extension, we'll handle this async
        return defaultValue
      } else if (storageType === 'localStorage' && typeof window !== 'undefined') {
        stored = localStorage.getItem(userKey)
      } else if (storageType === 'sessionStorage' && typeof window !== 'undefined') {
        stored = sessionStorage.getItem(userKey)
      }

      return stored ? JSON.parse(stored) : defaultValue
    } catch (error) {
      console.warn(`Failed to load persisted state for ${key}:`, error)
      return defaultValue
    }
  })

  // Save to storage whenever state changes
  const persistState = useCallback((newState: T) => {
    try {
      const serialized = JSON.stringify(newState)

      if (storageType === 'chrome' && typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [userKey]: serialized })
      } else if (storageType === 'localStorage' && typeof window !== 'undefined') {
        localStorage.setItem(userKey, serialized)
      } else if (storageType === 'sessionStorage' && typeof window !== 'undefined') {
        sessionStorage.setItem(userKey, serialized)
      }
    } catch (error) {
      console.warn(`Failed to persist state for ${key}:`, error)
    }
  }, [userKey, storageType, key])

  // Enhanced setState that persists automatically
  const setPersistedState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prevState)
        : newState

      // Persist immediately
      persistState(nextState)

      return nextState
    })
  }, [persistState])

  // Load from Chrome storage on mount (async)
  useEffect(() => {
    if (storageType === 'chrome' && typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([userKey], (result) => {
        if (result[userKey]) {
          try {
            const parsed = JSON.parse(result[userKey])
            setState(parsed)
          } catch (error) {
            console.warn(`Failed to parse Chrome storage data for ${key}:`, error)
          }
        }
      })
    }
  }, [userKey, storageType, key])

  // Reload state when userKey changes (e.g. login/logout)
  useEffect(() => {
    try {
      let stored: string | null = null;
      if (storageType === 'localStorage' && typeof window !== 'undefined') {
        stored = localStorage.getItem(userKey);
      } else if (storageType === 'sessionStorage' && typeof window !== 'undefined') {
        stored = sessionStorage.getItem(userKey);
      } else if (storageType === 'chrome' && typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome storage handled by separate effect
        return;
      }

      if (stored) {
        console.log(`[usePersistedState] Reloading state for key changed: ${userKey}`);
        setState(JSON.parse(stored));
      } else {
        // If no stored data for this user, potentially reset to default or keep current?
        // Usually better to iterate, but if switching users, we should probably reset or load defaults.
        // However, defaultValue might be static.
        // Let's assume if nothing stored, we keep default.
        // But we must NOT keep the *previous user's* data.
        console.log(`[usePersistedState] No stored state for ${userKey}, resetting to default`);
        setState(defaultValue);
      }
    } catch (error) {
      console.warn(`Failed to reload persisted state for ${userKey}:`, error);
    }
  }, [userKey, storageType, defaultValue]);

  // Load from Chrome storage on mount (async) - AND when userKey changes
  useEffect(() => {

    // Listen for storage changes from other tabs
    useEffect(() => {
      if (typeof window === 'undefined') return

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === userKey && e.newValue) {
          try {
            const newState = JSON.parse(e.newValue)
            setState(newState)
          } catch (error) {
            console.warn(`Failed to sync state from storage change:`, error)
          }
        }
      }

      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }, [userKey])

    return [state, setPersistedState] as const
  }