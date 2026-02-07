import { useState, useEffect, useCallback } from 'react';

// Type for Chrome storage areas
type StorageArea = 'sync' | 'local';

// Generic hook for Chrome extension storage
export function useChromeStorage<T>(
  key: string,
  defaultValue: T,
  storageArea: StorageArea = 'sync'
) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in a Chrome extension environment
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage;

  // Load value from storage
  const loadValue = useCallback(async () => {
    if (!isChromeExtension) {
      // Fallback to localStorage for development
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          setValue(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Failed to load from localStorage:', err);
      }
      setIsLoading(false);
      return;
    }

    try {
      const storage = chrome.storage[storageArea];
      const result = await storage.get(key);

      if (result[key] !== undefined) {
        setValue(result[key]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Storage error');
      console.error('Chrome storage error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [key, storageArea, isChromeExtension]);

  // Save value to storage
  const saveValue = useCallback(async (newValue: T) => {
    if (!isChromeExtension) {
      // Fallback to localStorage for development
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
        setValue(newValue);
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
      return;
    }

    try {
      const storage = chrome.storage[storageArea];
      const serialized = JSON.stringify(newValue);

      // Check size limits
      const sizeKB = new Blob([serialized]).size / 1024;
      const maxSize = storageArea === 'sync' ? 8 : 1024; // 8KB for sync, 1MB for local

      if (sizeKB > maxSize) {
        throw new Error(`Data too large: ${Math.round(sizeKB)}KB exceeds ${maxSize}KB limit for ${storageArea} storage`);
      }

      await storage.set({ [key]: newValue });
      setValue(newValue);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Storage error';
      setError(errorMessage);
      console.error('Chrome storage error:', err);
      throw new Error(errorMessage);
    }
  }, [key, storageArea, isChromeExtension]);

  // Load initial value
  useEffect(() => {
    loadValue();
  }, [loadValue]);

  // Listen for storage changes (only in Chrome extension)
  useEffect(() => {
    if (!isChromeExtension) return;

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[key]) {
        setValue(changes[key].newValue ?? defaultValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key, defaultValue, isChromeExtension]);

  return {
    value,
    setValue: saveValue,
    isLoading,
    error,
    reload: loadValue,
  };
}

// Specialized hook for smile popup settings
export function useSmilePopupSettings() {
  return useChromeStorage('smilePopupSettings', {
    enabled: true,
    showQuotes: true,
    showCelebration: true,
    customImage: '',
    animationIntensity: 'medium' as 'low' | 'medium' | 'high',
    quotesSource: 'motivational' as 'motivational' | 'productivity' | 'custom',
    autoClose: false,
    closeDelay: 5,
    showAsExternalWindow: false,
    windowWidth: 400,
    windowHeight: 300,
    enableSound: false,
    customSound: '',
  }, 'local'); // Use local storage for larger data like images
}

// Hook for app settings
export function useAppSettings() {
  return useChromeStorage('appSettings', {
    theme: 'system' as 'light' | 'dark' | 'system',
    notifications: true,
    soundEnabled: true,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    privacy: {
      dataCollection: true,
      analytics: true,
    },
  });
}