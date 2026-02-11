import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useTaskContext } from './TaskContext';
import { useUniversalAuthContext } from './UniversalAuthContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface DataSyncContextType {
    isSyncing: boolean;
    lastSyncTime: number | null;
    forceSync: () => Promise<void>;
    // Added from old provider
    forceRepair: () => Promise<void>;
    validateDataIntegrity: () => { valid: boolean; issues: string[] };
}

const DataSyncContext = createContext<DataSyncContextType | null>(null);

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, isSignedIn } = useUniversalAuthContext();
    const { syncLocalTasks, isSyncing: isTaskSyncing } = useTaskContext();

    // Convex hooks for Playlist Sync
    const updatePlaylist = useMutation(api.playlists.updatePlaylist);
    const convexPlaylists = useQuery(api.playlists.getPlaylists, user ? {} : 'skip');

    const [lastSyncTime, setLastSyncTime] = React.useState<number | null>(null);
    const syncInProgress = useRef(false);

    // Ref to track if we've done the initial login sync
    const hasInitialSynced = useRef(false);

    // --- Playlist/Quote Sync Logic (Ported) ---
    const syncPlaylistQuoteRelationships = useCallback(async () => {
        if (!user || !isSignedIn || syncInProgress.current) return;

        syncInProgress.current = true;
        console.log('[DataSync] Starting playlist-quote sync...');

        try {
            // 1. Get local state
            const storageKey = `quotes-state_${user.id}`;
            const localData = JSON.parse(localStorage.getItem(storageKey) || '{}');

            if (!localData.playlists) {
                console.log('[DataSync] No local playlists to sync');
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
                    console.log('[DataSync] Playlist not found in Convex:', localPlaylist.name);
                    continue;
                }

                // Check if local quoteIds match Convex quote_ids
                const localQuoteIds = localPlaylist.quoteIds || [];
                const convexQuoteIds = convexPlaylist.quote_ids || [];

                // If Convex has quotes but local doesn't, update local
                if (convexQuoteIds.length > 0 && localQuoteIds.length === 0) {
                    console.log('[DataSync] Repairing playlist:', localPlaylist.name,
                        'Adding', convexQuoteIds.length, 'quotes from Convex');

                    localPlaylist.quoteIds = convexQuoteIds;
                    hasChanges = true;
                }
                // If local has quotes but Convex doesn't, update Convex
                else if (localQuoteIds.length > 0 && convexQuoteIds.length === 0) {
                    console.log('[DataSync] Repairing Convex playlist:', localPlaylist.name,
                        'Adding', localQuoteIds.length, 'quotes to Convex');

                    try {
                        // Update Convex playlist with quote IDs
                        await updatePlaylist({
                            id: localPlaylist.id,
                            quote_ids: localQuoteIds
                        });
                        console.log('[DataSync] Successfully updated Convex playlist');
                    } catch (error) {
                        console.error('[DataSync] Failed to update Convex playlist:', error);
                    }
                }
            }

            // 4. Save updated local state if changes were made
            if (hasChanges) {
                localStorage.setItem(storageKey, JSON.stringify(localData));
                console.log('[DataSync] Updated localStorage with repaired playlists');

                // Trigger storage event
                window.dispatchEvent(new StorageEvent('storage', {
                    key: storageKey,
                    newValue: JSON.stringify(localData)
                }));
            }
        } catch (error) {
            console.error('[DataSync] Playlist sync failed:', error);
        } finally {
            syncInProgress.current = false;
        }
    }, [user, isSignedIn, convexPlaylists, updatePlaylist]);

    // Validation Logic
    const validateDataIntegrity = useCallback(() => {
        if (!user) return { valid: true, issues: [] };

        const issues: string[] = [];
        const storageKey = `quotes-state_${user.id}`;
        const localData = JSON.parse(localStorage.getItem(storageKey) || '{}');

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
        return { valid, issues };
    }, [user]);

    // Combined Sync
    const forceSync = async () => {
        if (!user) return;
        console.log('[DataSync] Starting combined sync...');
        try {
            await Promise.all([
                syncLocalTasks(),
                syncPlaylistQuoteRelationships()
            ]);
            setLastSyncTime(Date.now());
            console.log('[DataSync] Sync completed.');
        } catch (error) {
            console.error('[DataSync] Sync failed:', error);
        }
    };

    // 1. Initial Login Sync
    useEffect(() => {
        if (isLoaded && user && !hasInitialSynced.current && convexPlaylists) {
            console.log('[DataSync] User logged in & playlists loaded, triggering initial sync.');
            forceSync();
            hasInitialSynced.current = true;
        } else if (!user) {
            hasInitialSynced.current = false;
        }
    }, [isLoaded, user, convexPlaylists]);

    // 2. Auto Sync (Interval)
    useEffect(() => {
        if (!user) return;
        const intervalId = setInterval(() => {
            console.log('[DataSync] Triggering auto-sync...');
            forceSync();
        }, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(intervalId);
    }, [user]);

    // 3. Periodic Integrity Check (from old provider)
    useEffect(() => {
        if (!isSignedIn) return;
        const interval = setInterval(() => {
            validateDataIntegrity();
        }, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [isSignedIn, validateDataIntegrity]);


    return (
        <DataSyncContext.Provider value={{
            isSyncing: isTaskSyncing || syncInProgress.current,
            lastSyncTime,
            forceSync,
            forceRepair: forceSync, // Alias for now
            validateDataIntegrity
        }}>
            {children}
        </DataSyncContext.Provider>
    );
}

export const useDataSync = () => {
    const context = useContext(DataSyncContext);
    if (!context) {
        throw new Error("useDataSync must be used within a DataSyncProvider");
    }
    return context;
};
