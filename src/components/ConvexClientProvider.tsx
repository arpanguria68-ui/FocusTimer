import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
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
        >
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
