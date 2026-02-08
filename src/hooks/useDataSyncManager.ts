// Automated Data Synchronization & Repair System
// Following SOLID principles and clean architecture

import { useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';

/**
 * DataSyncManager
 * 
 * Handles automated synchronization between localStorage and Convex
 * Ensures data consistency and repairs broken relationships
 * 
 * Principles:
 * - Single Responsibility: Only handles sync, not business logic
 * - Automated: No manual intervention required
 * - Idempotent: Can run multiple times safely
 * - Observable: Comprehensive logging for debugging
 */

interface SyncStatus {
  lastSync: string;
  pendingChanges: boolean;
  errors: string[];
}

export const useDataSyncManager = () => {
  const { user, isSignedIn } = useAuth();
  const syncInProgress = useRef(false);
  
  // Convex mutations
  const updatePlaylist = useMutation(api.playlists.updatePlaylist);
  const addQuoteToPlaylist = useMutation(api.playlists.addQuoteToPlaylist);
  
  /**
   * Validates and repairs playlist-quote relationships
   * Runs automatically when user logs in
   */
  const syncPlaylistQuoteRelationships = useCallback(async () => {
    if (!user || !isSignedIn || syncInProgress.current) return;
    
    syncInProgress.current = true;
    console.log('[DataSyncManager] Starting playlist-quote sync...');
    
    try {
      // 1. Get local state
      const storageKey = `quotes-state_${user.id}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      if (!localData.playlists || !localData.cachedPlaylistQuotes) {
        console.log('[DataSyncManager] No local data to sync');
        return;
      }
      
      // 2. Get Convex playlists
      // Note: This would need to be passed in or fetched separately
      // For now, we'll use the cached playlist IDs
      
      // 3. For each playlist, ensure quote_ids are synced
      for (const localPlaylist of localData.playlists) {
        if (!localPlaylist.id) continue;
        
        const localQuoteIds = localPlaylist.quoteIds || [];
        const cachedQuoteIds = localData.cachedPlaylistQuotes
          ?.map((q: any) => q.id)
          ?.filter((id: string) => id) || [];
        
        // If local has quote IDs but playlist doesn't, sync to Convex
        if (localQuoteIds.length === 0 && cachedQuoteIds.length > 0) {
          console.log('[DataSyncManager] Repairing playlist:', localPlaylist.name, 
                      'Adding', cachedQuoteIds.length, 'quotes');
          
          // Update Convex playlist with quote IDs
          try {
            await updatePlaylist({
              id: localPlaylist.id,
              quote_ids: cachedQuoteIds
            });
            
            // Update local state
            localPlaylist.quoteIds = cachedQuoteIds;
            console.log('[DataSyncManager] Successfully synced playlist to Convex');
          } catch (error) {
            console.error('[DataSyncManager] Failed to sync playlist:', error);
          }
        }
      }
      
      // 4. Save updated local state
      localStorage.setItem(storageKey, JSON.stringify(localData));
      console.log('[DataSyncManager] Sync complete');
      
    } catch (error) {
      console.error('[DataSyncManager] Sync failed:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, [user, isSignedIn, updatePlaylist]);
  
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
  
  // Auto-sync on login
  useEffect(() => {
    if (isSignedIn && user) {
      // Delay to let initial data load
      const timer = setTimeout(() => {
        syncPlaylistQuoteRelationships();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, user, syncPlaylistQuoteRelationships]);
  
  // Periodic validation
  useEffect(() => {
    if (!isSignedIn) return;
    
    const interval = setInterval(() => {
      validateDataIntegrity();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isSignedIn, validateDataIntegrity]);
  
  return {
    syncPlaylistQuoteRelationships,
    validateDataIntegrity,
    isSyncing: () => syncInProgress.current
  };
};
