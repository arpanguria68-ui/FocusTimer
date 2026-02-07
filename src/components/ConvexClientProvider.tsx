import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";
import { Clerk } from "@clerk/clerk-js";

export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
    console.error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

const clerk = new Clerk(PUBLISHABLE_KEY);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    // Determine if we're in extension context
    const isExtension = typeof window !== 'undefined' && (
        window.location.protocol === 'chrome-extension:' ||
        window.location.href.includes('chrome-extension://') ||
        (window as any).chrome?.runtime?.id
    );

    // Custom router for Clerk to handle Extension HashRouter
    const routerPush = (to: string) => {
        if (isExtension) {
            // In extension, we use HashRouter, so we just update the hash
            // Clerk might pass a full URL or a path. We need to handle both.
            // If it's a full URL matching our origin, strip it.
            let path = to;
            if (to.startsWith(window.location.origin)) {
                path = to.substring(window.location.origin.length);
            }
            if (!path.startsWith('#')) {
                path = '#' + path;
            }
            window.location.hash = path;
        } else {
            // For web, we can rely on default behavior or explicit history push if we had access to history
            // But since we are outside Router, standard window navigation is safe fall back or let Clerk handle it
            // Clerk's default is window.location.href = to
            window.location.href = to;
        }
    };

    // Token Cache for Extension
    const tokenCache = isExtension ? {
        getToken: (key: string) => {
            return new Promise<string | null>((resolve) => {
                console.log("[TokenCache] getToken called for key:", key);
                chrome.storage.local.get([key, 'clerk-latest-token'], (result) => {
                    const primary = result[key] as string;
                    const fallback = result['clerk-latest-token'] as string;
                    console.log("[TokenCache] Storage result:", { keyFound: !!primary, fallbackFound: !!fallback });

                    const token = primary || fallback;
                    if (token && !primary) {
                        console.log("[TokenCache] Using fallback token and migrating to key:", key);
                        chrome.storage.local.set({ [key]: token });
                    }
                    console.log("[TokenCache] Resolving with token length:", token ? token.length : 0);
                    resolve(token || null);
                });
            });
        },
        saveToken: (key: string, token: string) => {
            return new Promise<void>((resolve) => {
                console.log("[TokenCache] saveToken called for key:", key);
                chrome.storage.local.set({ [key]: token }, () => {
                    resolve();
                });
            });
        },
        clearToken: (key: string) => {
            return new Promise<void>((resolve) => {
                chrome.storage.local.remove([key, 'clerk-latest-token'], () => {
                    resolve();
                });
            });
        },
    } : undefined;

    if (isExtension) {
        console.log("[ConvexClientProvider] Extension context detected.", {
            syncHost: import.meta.env.VITE_CLERK_SYNC_HOST,
            hasChromeStorage: !!chrome?.storage?.local
        });
    }

    useEffect(() => {
        if (!isExtension || typeof chrome === 'undefined' || !chrome.storage) return;

        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes['clerk-latest-token']) {
                console.log("[ConvexClientProvider] Auth token changed. Reloading extension...");
                window.location.reload();
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, [isExtension]);


    const routerReplace = (to: string) => {
        if (isExtension) {
            let path = to;
            if (to.startsWith(window.location.origin)) {
                path = to.substring(window.location.origin.length);
            }
            if (!path.startsWith('#')) {
                path = '#' + path;
            }
            window.location.replace(window.location.pathname + path);
        } else {
            window.location.replace(to);
        }
    };

    return (
        <ClerkProvider
            publishableKey={PUBLISHABLE_KEY}
            Clerk={clerk}
            routerPush={routerPush}
            routerReplace={routerReplace}
            // @ts-ignore
            syncHost={import.meta.env.VITE_CLERK_SYNC_HOST}
            // @ts-ignore
            tokenCache={tokenCache}
        >
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
