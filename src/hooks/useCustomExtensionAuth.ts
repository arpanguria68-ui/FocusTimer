import { useAuth } from "@clerk/chrome-extension";
import { useCallback } from "react";

/**
 * Custom Auth Adapter for Convex in Chrome Extension environment.
 * 
 * ConvexProviderWithClerk expects a hook that returns { getToken, isSignedIn }.
 * This hook wraps the standard Clerk extension auth to ensuring:
 * 1. getToken uses the 'convex' template by default if not specified.
 * 2. Logging is added to debug auth issues.
 */
export function useCustomExtensionAuth() {
    const { getToken: clerkGetToken, isSignedIn, isLoaded, userId, sessionId, signOut, orgId, orgRole, orgSlug } = useAuth();

    const getToken = useCallback(async (options?: { template?: string; skipCache?: boolean }) => {
        // Default to 'convex' template if not specified, which is required for Convex
        const template = options?.template || 'convex';
        const skipCache = options?.skipCache || false;

        console.log(`[ExtensionAuth] getToken called. Template: ${template}, SkipCache: ${skipCache}`);

        try {
            // Method 1: Try standard clerk getToken
            let token = await clerkGetToken({ template, skipCache });

            if (token) {
                console.log(`[ExtensionAuth] Method 1 success. Token acquired.`);
                return token;
            }

            console.warn(`[ExtensionAuth] Method 1 (clerkGetToken) returned null. Attempting fallback...`);

            // Method 2: Manual fetch if we have a session ID
            // This is a robust fallback for extensions where cookies/storage might be flaky
            if (sessionId) {
                console.warn(`[ExtensionAuth] Attempting manual token fetch for session: ${sessionId}`);

                // We need the Clerk Client ID (not publishable key, but the actual client object from the provider)
                // Since we don't have easy access to the internal client object here, we'll try a standard fetch 
                // to the clerk domain if possible, or just fail with more info.

                // ACTUALLY: The best way is to use the `window.Clerk` object if available, or the one from context.
                // let's try to access the global Clerk object if it exists (it often does in these SDKs)
                const globalClerk = (window as any).Clerk;
                if (globalClerk && globalClerk.session) {
                    console.log("[ExtensionAuth] Found global Clerk session, trying that...");
                    token = await globalClerk.session.getToken({ template, skipCache });
                    if (token) {
                        console.log(`[ExtensionAuth] Method 2 (Global Clerk) success.`);
                        return token;
                    }
                }
            }

            console.error(`[ExtensionAuth] All token fetch methods failed.`);
            return null;
        } catch (err) {
            console.error(`[ExtensionAuth] Error fetching token:`, err);
            return null;
        }
    }, [clerkGetToken, isSignedIn, sessionId]);

    return {
        getToken,
        isSignedIn,
        isLoaded,
        userId,
        sessionId,
        signOut,
        orgId,
        orgRole,
        orgSlug,
    };
}
