// DataSyncProvider.tsx
// Wraps the app with automated data synchronization

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../hooks/useAuth';

interface DataSyncContextType {
  syncPlaylistQuoteRelationships: () => Promise<void>;
  validateDataIntegrity: () => { valid: boolean; issues: string[] };
  isSyncing: () => boolean;
  forceRepair: () => Promise<void>;
}

const DataSyncContext = createContext<DataSyncContextType | null>(null);

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within DataSyncProvider');
  }
  return context;
};

interface DataSyncProviderProps {
  children: React.ReactNode;
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({ children }) => {
  const { user, isSignedIn } = useAuth();
  const syncInProgress = useRef(false);
  
  // Convex mutations
  const updatePlaylist = useMutation(api.playlists.updatePlaylist);
  const addQuoteToPlaylist = useMutation(api.playlists.addQuoteToPlaylist);
  
  // Get Convex playlists for comparison
  const convexPlaylists = useQuery(api.playlists.getPlaylists, user ? { userId: user.id } : 'skip');
  
  /**
   * Validates and repairs playlist-quote relationships
   * This is the CRITICAL FIX for the broken playlist issue
   */
  const syncPlaylistQuoteRelationships = useCallback(async () => {
    if (!user || !isSignedIn || syncInProgress.current) return;
    
    syncInProgress.current = true;
    console.log('[DataSyncManager] Starting playlist-quote sync...');
    
    try {
      // 1. Get local state
      const storageKey = `quotes-state_${user.id}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      if (!localData.playlists) {
        console.log('[DataSyncManager] No local playlists to sync');
        return;
      }
      
      // 2. Get Convex playlists
      const convexPlaylistMap = new Map();
      if (convexPlaylists) {
        convexPlaylists.forEach((p: any) => {
          convexPlaylistMap.set(p._id, {
            id: p._id,
            name: p.name,
            quote_ids: p.quote_ids || []
          });
        });
      }
      
      // 3. For each local playlist, ensure quote_ids match Convex
      let hasChanges = false;
      for (const localPlaylist of localData.playlists) {
        if (!localPlaylist.id) continue;
        
        const convexPlaylist = convexPlaylistMap.get(localPlaylist.id);
        if (!convexPlaylist) {
          console.log('[DataSyncManager] Playlist not found in Convex:', localPlaylist.name);
          continue;
        }
        
        // Check if local quoteIds match Convex quote_ids
        const localQuoteIds = localPlaylist.quoteIds || [];
        const convexQuoteIds = convexPlaylist.quote_ids || [];
        
        // If Convex has quotes but local doesn't, update local
        if (convexQuoteIds.length > 0 && localQuoteIds.length === 0) {
          console.log('[DataSyncManager] Repairing playlist:', localPlaylist.name, 
                      'Adding', convexQuoteIds.length, 'quotes from Convex');
          
          localPlaylist.quoteIds = convexQuoteIds;
          hasChanges = true;
        }
        // If local has quotes but Convex doesn't, update Convex
        else if (localQuoteIds.length > 0 && convexQuoteIds.length === 0) {
          console.log('[DataSyncManager] Repairing Convex playlist:', localPlaylist.name, 
                      'Adding', localQuoteIds.length, 'quotes to Convex');
          
          try {
            // Update Convex playlist with quote IDs
            await updatePlaylist({
              id: localPlaylist.id,
              quote_ids: localQuoteIds
            });
            console.log('[DataSyncManager] Successfully updated Convex playlist');
          } catch (error) {
            console.error('[DataSyncManager] Failed to update Convex playlist:', error);
          }
        }
      }
      
      // 4. Save updated local state if changes were made
      if (hasChanges) {
        localStorage.setItem(storageKey, JSON.stringify(localData));
        console.log('[DataSyncManager] Updated localStorage with repaired playlists');
        
        // Trigger storage event so other tabs/components know
        window.dispatchEvent(new StorageEvent('storage', { 
          key: storageKey,
          newValue: JSON.stringify(localData)
        }));
      }
      
      console.log('[DataSyncManager] Sync complete');
      
    } catch (error) {
      console.error('[DataSyncManager] Sync failed:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, [user, isSignedIn, convexPlaylists, updatePlaylist]);
  
  /**
   * Force repair - manually trigger a full repair
   */
  const forceRepair = useCallback(async () => {
    console.log('[DataSyncManager] Force repair triggered');
    await syncPlaylistQuoteRelationships();
  }, [syncPlaylistQuoteRelationships]);
  
  /**
   * Validates data integrity
   * Checks for orphaned quotes, missing relationships, etc.
   */
  const validateDataIntegrity = useCallback(() => {
    if (!user) return { valid: true, issues: [] };
    
    const issues: string[] = [];
    const storageKey = `quotes-state_${user.id}`;
    const localData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Check 1: Playlists without quoteIds
    if (localData.playlists) {
      for (const playlist of localData.playlists) {
        if (!playlist.quoteIds || playlist.quoteIds.length === 0) {
          if (localData.cachedPlaylistQuotes?.length > 0) {
            issues.push(`Playlist "${playlist.name}" has no quotes but ${localData.cachedPlaylistQuotes.length} cached quotes exist`);
          }
        }
      }
    }
    
    // Check 2: Quotes in playlist that don't exist
    if (localData.playlists && localData.cachedPlaylistQuotes) {
      const allQuoteIds = new Set(localData.cachedPlaylistQuotes.map((q: any) => q.id));
      
      for (const playlist of localData.playlists) {
        for (const quoteId of (playlist.quoteIds || [])) {
          if (!allQuoteIds.has(quoteId)) {
            issues.push(`Playlist "${playlist.name}" references missing quote: ${quoteId}`);
          }
        }
      }
    }
    
    const valid = issues.length === 0;
    if (!valid) {
      console.warn('[DataSyncManager] Data integrity issues found:', issues);
    }
    
    return { valid, issues };
  }, [user]);
  
  // Auto-sync on login and when playlists change
  useEffect(() => {
    if (isSignedIn && user && convexPlaylists) {
      // Delay to let initial data load
      const timer = setTimeout(() => {
        syncPlaylistQuoteRelationships();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, user, convexPlaylists, syncPlaylistQuoteRelationships]);
  
  // Periodic validation
  useEffect(() => {
    if (!isSignedIn) return;
    
    const interval = setInterval(() => {
      validateDataIntegrity();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isSignedIn, validateDataIntegrity]);

  const value: DataSyncContextType = {
    syncPlaylistQuoteRelationships,
    validateDataIntegrity,
    isSyncing: () => syncInProgress.current,
    forceRepair
  };
  
  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};
