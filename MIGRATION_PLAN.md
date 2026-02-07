# Complete Migration to Convex + Clerk - Action Plan

**Generated**: 2026-02-07  
**Current Status**: Partially Migrated  
**Target**: 100% Convex + Clerk  
**Estimated Time**: 40-50 hours

---

## Executive Summary

The application is currently in a **hybrid state**:
- ✅ **Core data operations** (sessions, tasks, quotes CRD) use **Convex**
- ✅ **Authentication** uses **Clerk** (modern approach)
- ❌ **Update operations** are broken/missing
- ❌ **Legacy Supabase code** still present
- ❌ **Playlists/favorites** are local-only (not migrated)
- ❌ **Auth pages** still reference Supabase

### Migration Completion: 60%

---

## Current Architecture Analysis

### What's Already Migrated to Convex ✅

| Feature | Convex Function | Frontend Hook | Status |
|---------|----------------|---------------|--------|
| **Sessions** | `sessions.ts` | `useSessions`, `useCreateSession`, `useCompleteSession` | ✅ Working |
| **Tasks CRD** | `tasks.ts` | `useTasks`, `useCreateTask`, `useDeleteTask`, `useToggleTask` | ✅ Working |
| **Tasks Update** | ❌ MISSING | `useUpdateTask` (placeholder) | ❌ BROKEN |
| **Quotes CRD** | `quotes.ts` | `useQuotes`, `useCreateQuote`, `useDeleteQuote` | ✅ Working |
| **Quotes Update** | ❌ MISSING | `useUpdateQuote` (placeholder) | ❌ BROKEN |
| **Users** | `users.ts`, `user_service.ts` | `useUserProfile`, `useUpdateUserProfile` | ✅ Working |
| **Playlists** | ❌ MISSING | Local storage only | ❌ NOT MIGRATED |
| **Favorites** | ❌ MISSING | Local storage only | ❌ NOT MIGRATED |

### What's on Clerk ✅

| Feature | Implementation | Status |
|---------|---------------|--------|
| **Sign In/Up** | `@clerk/clerk-react` | ✅ Working |
| **User Profile** | `useUser`, `useClerk` | ✅ Working |
| **Protected Routes** | `SignedIn`, `SignedOut` | ✅ Working |
| **Auth State** | `useAuth` hook | ✅ Working |

### What's Still on Supabase ❌

| Feature | Files | Status |
|---------|-------|--------|
| **Auth Service** | `authService.ts` (500+ lines) | ❌ DEAD CODE |
| **Legacy Pages** | `ChangeEmailPage.tsx`, `MagicLinkPage.tsx`, `ResetPasswordPage.tsx`, `EmailConfirmationPage.tsx` | ❌ USE SUPABASE |
| **Legacy Services** | `sessionService.ts`, `taskService.ts`, `quoteService.ts`, `chatService.ts` | ❌ DEAD CODE |
| **Debug Utils** | Multiple test files | ❌ USE SUPABASE |

---

## Migration Checklist

### Phase 1: Fix Broken CRUD (CRITICAL - Week 1)

#### Task 1.1: Add Update Quote to Convex
**Time**: 2 hours  
**Files**: `convex/quotes.ts`, `src/hooks/useSupabaseQueries.ts`

```typescript
// convex/quotes.ts - ADD THIS
export const updateQuote = mutation({
    args: {
        id: v.id("quotes"),
        content: v.optional(v.string()),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
        return await ctx.db.get(id);
    },
});
```

```typescript
// src/hooks/useSupabaseQueries.ts - UPDATE THIS (line 144-146)
export const useUpdateQuote = () => {
  const update = useMutation(api.quotes.updateQuote);
  return { 
    mutateAsync: update,
    isPending: false 
  };
};
```

```typescript
// src/hooks/useQuotesState.ts - UPDATE THIS (line 248)
// Change from:
await updateQuote.mutateAsync({ quoteId: id, updates })
// To:
await updateQuote.mutateAsync({ id, ...updates })
```

**Testing**:
- [ ] Edit a quote in Inspiration Library
- [ ] Change content, author, category
- [ ] Refresh page - changes should persist

---

#### Task 1.2: Add Update Task to Convex
**Time**: 2 hours  
**Files**: `convex/tasks.ts`, `src/hooks/useSupabaseQueries.ts`

```typescript
// convex/tasks.ts - ADD THIS
export const updateTask = mutation({
    args: {
        id: v.id("tasks"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
        due_date: v.optional(v.string()),
        category: v.optional(v.union(v.literal('signal'), v.literal('noise'))),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
        return await ctx.db.get(id);
    },
});
```

```typescript
// src/hooks/useSupabaseQueries.ts - UPDATE THIS (line 79-88)
export const useUpdateTask = () => {
  const update = useMutation(api.tasks.updateTask);
  return { mutateAsync: update };
};
```

**Testing**:
- [ ] Edit a task title
- [ ] Change task priority
- [ ] Set/change due date
- [ ] Refresh page - changes should persist

---

#### Task 1.3: Fix Type Issues (Convex ID Mapping)
**Time**: 3 hours  
**Files**: Multiple

**Problem**: Convex uses `_id` but frontend expects `id`

**Fix**: Create adapter functions

```typescript
// src/lib/adapters.ts - CREATE THIS FILE
import { Id } from "../../convex/_generated/dataModel";

export const adaptConvexTask = (convexTask: any) => ({
  id: convexTask._id,
  user_id: convexTask.user_id,
  title: convexTask.title,
  description: convexTask.description,
  completed: convexTask.completed,
  priority: convexTask.priority,
  due_date: convexTask.due_date,
  category: convexTask.category,
  created_at: convexTask.created_at,
  updated_at: convexTask.updated_at,
});

export const adaptConvexQuote = (convexQuote: any) => ({
  id: convexQuote._id,
  user_id: convexQuote.user_id,
  content: convexQuote.content,
  author: convexQuote.author,
  category: convexQuote.category,
  is_custom: convexQuote.is_custom,
  created_at: convexQuote.created_at,
});
```

Update hooks to use adapters:
```typescript
// src/hooks/useSupabaseQueries.ts
export const useTasks = (completed?: boolean) => {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.getTasks, user ? { userId: user.id, completed } : "skip");
  return { 
    data: tasks?.map(adaptConvexTask) || [], 
    isLoading: !tasks 
  };
};
```

---

### Phase 2: Migrate Playlists to Convex (Week 2)

#### Task 2.1: Add Playlist Schema
**Time**: 1 hour  
**File**: `convex/schema.ts`

```typescript
// convex/schema.ts - ADD TO defineSchema
playlists: defineTable({
    user_id: v.string(),
    name: v.string(),
    quoteIds: v.array(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
}).index("by_user", ["user_id"]),

playlist_progress: defineTable({
    user_id: v.string(),
    playlist_id: v.string(),
    current_index: v.number(),
    updated_at: v.string(),
}).index("by_user_playlist", ["user_id", "playlist_id"]),
```

---

#### Task 2.2: Create Playlist Convex Functions
**Time**: 3 hours  
**File**: `convex/playlists.ts` (CREATE)

```typescript
// convex/playlists.ts - CREATE THIS FILE
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPlaylists = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("playlists")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .order("desc")
            .collect();
    },
});

export const createPlaylist = mutation({
    args: {
        user_id: v.string(),
        name: v.string(),
        quoteIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("playlists", {
            ...args,
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    },
});

export const updatePlaylist = mutation({
    args: {
        id: v.id("playlists"),
        name: v.optional(v.string()),
        quoteIds: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
    },
});

export const deletePlaylist = mutation({
    args: { id: v.id("playlists") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const setActivePlaylist = mutation({
    args: {
        user_id: v.string(),
        playlist_id: v.optional(v.id("playlists")),
    },
    handler: async (ctx, args) => {
        // Deactivate all user playlists
        const userPlaylists = await ctx.db
            .query("playlists")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();
        
        for (const playlist of userPlaylists) {
            await ctx.db.patch(playlist._id, { is_active: false });
        }
        
        // Activate selected playlist
        if (args.playlist_id) {
            await ctx.db.patch(args.playlist_id, { is_active: true });
        }
    },
});

export const getPlaylistProgress = query({
    args: {
        userId: v.string(),
        playlistId: v.string(),
    },
    handler: async (ctx, args) => {
        const progress = await ctx.db
            .query("playlist_progress")
            .withIndex("by_user_playlist", (q) => 
                q.eq("user_id", args.userId).eq("playlist_id", args.playlistId)
            )
            .unique();
        
        return progress || { current_index: 0 };
    },
});

export const updatePlaylistProgress = mutation({
    args: {
        user_id: v.string(),
        playlist_id: v.string(),
        current_index: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("playlist_progress")
            .withIndex("by_user_playlist", (q) => 
                q.eq("user_id", args.user_id).eq("playlist_id", args.playlist_id)
            )
            .unique();
        
        if (existing) {
            await ctx.db.patch(existing._id, {
                current_index: args.current_index,
                updated_at: new Date().toISOString(),
            });
        } else {
            await ctx.db.insert("playlist_progress", {
                user_id: args.user_id,
                playlist_id: args.playlist_id,
                current_index: args.current_index,
                updated_at: new Date().toISOString(),
            });
        }
    },
});
```

---

#### Task 2.3: Update Frontend Hooks
**Time**: 4 hours  
**File**: `src/hooks/useSupabaseQueries.ts`, `src/hooks/useQuotesState.ts`

Add playlist hooks:
```typescript
// src/hooks/useSupabaseQueries.ts
export const usePlaylists = () => {
  const { user } = useAuth();
  const playlists = useQuery(api.playlists.getPlaylists, user ? { userId: user.id } : "skip");
  return { data: playlists || [], isLoading: !playlists };
};

export const useCreatePlaylist = () => {
  const create = useMutation(api.playlists.createPlaylist);
  return { mutateAsync: create };
};

export const useUpdatePlaylist = () => {
  const update = useMutation(api.playlists.updatePlaylist);
  return { mutateAsync: update };
};

export const useDeletePlaylist = () => {
  const remove = useMutation(api.playlists.deletePlaylist);
  return { mutateAsync: (id: string) => remove({ id }) };
};

export const useSetActivePlaylist = () => {
  const setActive = useMutation(api.playlists.setActivePlaylist);
  return { mutateAsync: setActive };
};
```

Update useQuotesState to use Convex for playlists:
```typescript
// src/hooks/useQuotesState.ts
export function useQuotesState() {
  const { user } = useAuth();
  
  // Remote data from Convex
  const { data: remoteQuotes = [] } = useQuotes(user?.id);
  const { data: remotePlaylists = [] } = usePlaylists(); // ADD THIS
  
  // ... rest of hook
}
```

---

#### Task 2.4: Migrate Existing Local Playlists
**Time**: 2 hours  
**File**: `src/hooks/useQuotesState.ts`

Add migration logic:
```typescript
// In useQuotesState useEffect
useEffect(() => {
  // Migrate local playlists to Convex
  const migratePlaylists = async () => {
    if (!user || quotesState.playlists.length === 0) return;
    
    // Check if already migrated
    if (quotesState.playlistsMigrated) return;
    
    for (const playlist of quotesState.playlists) {
      try {
        await createPlaylist.mutateAsync({
          user_id: user.id,
          name: playlist.name,
          quoteIds: playlist.quoteIds,
        });
      } catch (error) {
        console.error('Failed to migrate playlist:', error);
      }
    }
    
    // Mark as migrated
    setQuotesState(prev => ({ ...prev, playlistsMigrated: true }));
  };
  
  migratePlaylists();
}, [user, quotesState.playlists]);
```

---

### Phase 3: Migrate Favorites to Convex (Week 2 - Continued)

#### Task 3.1: Add Favorites to Schema
**Time**: 30 minutes  
**File**: `convex/schema.ts`

```typescript
// convex/schema.ts - ADD TO defineSchema
favorite_quotes: defineTable({
    user_id: v.string(),
    quote_id: v.string(),
    created_at: v.string(),
}).index("by_user", ["user_id"])
 .index("by_user_quote", ["user_id", "quote_id"]),
```

---

#### Task 3.2: Create Favorites Convex Functions
**Time**: 2 hours  
**File**: `convex/favorites.ts` (CREATE)

```typescript
// convex/favorites.ts - CREATE THIS FILE
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getFavorites = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const favorites = await ctx.db
            .query("favorite_quotes")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .collect();
        
        return favorites.map(f => f.quote_id);
    },
});

export const addFavorite = mutation({
    args: {
        user_id: v.string(),
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if already exists
        const existing = await ctx.db
            .query("favorite_quotes")
            .withIndex("by_user_quote", (q) => 
                q.eq("user_id", args.user_id).eq("quote_id", args.quote_id)
            )
            .unique();
        
        if (existing) return;
        
        await ctx.db.insert("favorite_quotes", {
            ...args,
            created_at: new Date().toISOString(),
        });
    },
});

export const removeFavorite = mutation({
    args: {
        user_id: v.string(),
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        const favorite = await ctx.db
            .query("favorite_quotes")
            .withIndex("by_user_quote", (q) => 
                q.eq("user_id", args.user_id).eq("quote_id", args.quote_id)
            )
            .unique();
        
        if (favorite) {
            await ctx.db.delete(favorite._id);
        }
    },
});
```

---

#### Task 3.3: Update Frontend to Use Convex Favorites
**Time**: 2 hours  
**File**: `src/hooks/useSupabaseQueries.ts`, `src/hooks/useQuotesState.ts`

```typescript
// src/hooks/useSupabaseQueries.ts
export const useFavorites = () => {
  const { user } = useAuth();
  const favorites = useQuery(api.favorites.getFavorites, user ? { userId: user.id } : "skip");
  return { data: favorites || [], isLoading: !favorites };
};

export const useAddFavorite = () => {
  const add = useMutation(api.favorites.addFavorite);
  return { mutateAsync: add };
};

export const useRemoveFavorite = () => {
  const remove = useMutation(api.favorites.removeFavorite);
  return { mutateAsync: remove };
};
```

Update useQuotesState:
```typescript
// src/hooks/useQuotesState.ts
export function useQuotesState() {
  // ... existing code ...
  
  const { data: remoteFavorites = [] } = useFavorites();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  
  const toggleFavorite = useCallback(async (id: string) => {
    const isFav = remoteFavorites.includes(id);
    
    if (user) {
      if (isFav) {
        await removeFavoriteMutation.mutateAsync({
          user_id: user.id,
          quote_id: id,
        });
      } else {
        await addFavoriteMutation.mutateAsync({
          user_id: user.id,
          quote_id: id,
        });
      }
    }
  }, [user, remoteFavorites, addFavoriteMutation, removeFavoriteMutation]);
  
  // ... rest of hook
}
```

---

### Phase 4: Remove Supabase Dependency (Week 3)

#### Task 4.1: Migrate Auth Pages to Clerk
**Time**: 1 day  
**Files**: 
- `src/pages/ChangeEmailPage.tsx`
- `src/pages/MagicLinkPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/pages/EmailConfirmationPage.tsx`

**ChangeEmailPage Example**:
```typescript
// BEFORE (Supabase)
import { supabase } from '@/lib/supabase';

const handleChangeEmail = async () => {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
};

// AFTER (Clerk)
import { useUser } from '@clerk/clerk-react';

const handleChangeEmail = async () => {
  await user.update({ emailAddress: newEmail });
};
```

---

#### Task 4.2: Delete Dead Code
**Time**: 2 hours  
**Files to DELETE**:

```bash
# Services (all legacy Supabase code)
rm src/services/authService.ts
rm src/services/sessionService.ts
rm src/services/taskService.ts
rm src/services/quoteService.ts
rm src/services/chatService.ts

# Debug utilities (optional - keep if needed)
# rm src/utils/authDebugTest.ts
# rm src/utils/quoteDebugTest.ts
# rm src/utils/timerSettingsDebug.ts
# rm src/utils/analyticsTest.ts
# rm src/utils/integrationTest.ts
# rm src/utils/authProductionTest.ts
# rm src/utils/authTest.ts
# rm src/utils/storageTest.ts
# rm src/utils/supabaseTest.ts
# rm src/utils/databaseSetup.ts

# Debug components
rm src/components/QuoteDebugPanel.tsx
rm src/components/EmailFunctionalityTest.tsx
rm src/components/AuthProductionStatus.tsx
rm src/components/DatabaseSetupGuide.tsx

# Supabase client
rm src/lib/supabase.ts
```

---

#### Task 4.3: Update Package.json
**Time**: 15 minutes  
**File**: `package.json`

```bash
npm uninstall @supabase/supabase-js
```

Remove from dependencies:
```json
{
  "dependencies": {
    // Remove this:
    "@supabase/supabase-js": "^2.58.0",
  }
}
```

---

#### Task 4.4: Clean Up Imports
**Time**: 2 hours  
**Files**: All files importing from deleted files

Search and remove:
```bash
# Find all Supabase imports
grep -r "from '@/lib/supabase'" src/
grep -r "from '@/services/" src/

# Remove unused imports and update code
```

---

### Phase 5: Final Cleanup & Testing (Week 4)

#### Task 5.1: Add Error Handling
**Time**: 4 hours  
**Files**: All mutation hooks

Standardize error handling:
```typescript
// src/lib/errorHandler.ts - CREATE
import { toast } from 'sonner';

export const handleMutationError = (error: any, operation: string) => {
  console.error(`${operation} failed:`, error);
  toast.error(`${operation} failed. Please try again.`);
};

export const handleMutationSuccess = (message: string) => {
  toast.success(message);
};
```

---

#### Task 5.2: Add Loading States
**Time**: 3 hours  
**Files**: All mutation hooks

```typescript
// src/hooks/useSupabaseQueries.ts
export const useCreateQuote = () => {
  const mutation = useMutation(api.quotes.createQuote);
  return {
    mutateAsync: mutation,
    isPending: mutation.isPending,
  };
};
```

Update UI components to show loading states.

---

#### Task 5.3: End-to-End Testing
**Time**: 2 days  
**Scope**: All features

**Test Matrix**:

| Feature | Create | Read | Update | Delete | Cross-Device Sync |
|---------|--------|------|--------|--------|-------------------|
| Quotes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sessions | ✅ | ✅ | ✅ | N/A | ✅ |
| Playlists | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favorites | ✅ | ✅ | ✅ | ✅ | ✅ |
| User Profile | ✅ | ✅ | ✅ | N/A | ✅ |

**Test Scenarios**:
- [ ] Create quote on Device A, see on Device B
- [ ] Edit task on Device A, changes reflect on Device B
- [ ] Create playlist on Device A, available on Device B
- [ ] Add favorite on Device A, appears on Device B
- [ ] Complete session on Device A, stats update on Device B

---

## Verification Checklist

### Pre-Migration State
- [ ] Document all Supabase dependencies
- [ ] Backup current database
- [ ] Create migration scripts

### Post-Migration Verification
- [ ] All CRUD operations work
- [ ] Data syncs across devices
- [ ] No Supabase imports remain in production code
- [ ] No console errors
- [ ] All tests pass
- [ ] Performance is acceptable

### Code Quality
- [ ] No dead code
- [ ] Consistent error handling
- [ ] Loading states implemented
- [ ] TypeScript types correct
- [ ] No `any` types

---

## Migration Complete! ✅

When all phases are complete:
- ✅ 100% Convex for data operations
- ✅ 100% Clerk for authentication
- ✅ Zero Supabase dependencies
- ✅ Cross-device sync working
- ✅ All CRUD operations functional
- ✅ Clean, maintainable codebase

**Total Estimated Time**: 40-50 hours (5-6 weeks at 25% capacity)

---

## Files to be Modified/Created

### New Files (CREATE)
1. `convex/playlists.ts`
2. `convex/favorites.ts`
3. `src/lib/adapters.ts`
4. `src/lib/errorHandler.ts`

### Modified Files (UPDATE)
1. `convex/schema.ts` - Add playlists, favorites, playlist_progress
2. `convex/quotes.ts` - Add updateQuote mutation
3. `convex/tasks.ts` - Add updateTask mutation
4. `src/hooks/useSupabaseQueries.ts` - Add playlist and favorite hooks, fix update hooks
5. `src/hooks/useQuotesState.ts` - Use Convex for playlists and favorites
6. `src/pages/ChangeEmailPage.tsx` - Migrate to Clerk
7. `src/pages/MagicLinkPage.tsx` - Migrate to Clerk
8. `src/pages/ResetPasswordPage.tsx` - Migrate to Clerk
9. `src/pages/EmailConfirmationPage.tsx` - Migrate to Clerk

### Deleted Files (REMOVE)
1. `src/services/authService.ts`
2. `src/services/sessionService.ts`
3. `src/services/taskService.ts`
4. `src/services/quoteService.ts`
5. `src/services/chatService.ts`
6. `src/components/QuoteDebugPanel.tsx`
7. `src/components/EmailFunctionalityTest.tsx`
8. `src/components/AuthProductionStatus.tsx`
9. `src/components/DatabaseSetupGuide.tsx`
10. `src/lib/supabase.ts`

---

**Next Steps**: Start with Phase 1 (Fix Broken CRUD) as these are production blockers.
