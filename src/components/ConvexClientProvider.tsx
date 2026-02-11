import { ClerkProvider as WebClerkProvider, useAuth as useWebAuth } from "@clerk/clerk-react";
import { ClerkProvider as ExtensionClerkProvider, useAuth as useExtensionAuth } from "@clerk/chrome-extension";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useState } from "react";
import { Clerk } from "@clerk/clerk-js";
import { WebAuthAdapter, ExtensionAuthAdapter } from "@/components/AuthAdapters";

import { useCustomExtensionAuth } from "@/hooks/useCustomExtensionAuth";

export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Initialize Clerk manually to force bundling (Avoids CSP errors in Extension)
// But for extension SDK, we might not need this manual init if it handles it.
// We keep it for web or if extension SDK needs it.
const clerk = new Clerk(PUBLISHABLE_KEY);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [isExtension, setIsExtension] = useState(false);

  useEffect(() => {
    // Check if running in a Chrome Extension context
    const checkExtension = typeof chrome !== "undefined" && !!chrome.runtime && !!chrome.runtime.id;
    setIsExtension(checkExtension);
  }, []);

  // Simple router handlers for Clerk
  const routerPush = (to: string) => {
    if (to.startsWith('#')) {
      window.location.hash = to;
    } else {
      window.location.href = to;
    }
  };

  const routerReplace = (to: string) => {
    if (to.startsWith('#')) {
      window.location.replace(window.location.pathname + to);
    } else {
      window.location.replace(to);
    }
  };

  // ...

  if (isExtension) {
    return (
      <ExtensionClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        routerPush={routerPush}
        routerReplace={routerReplace}
      >
        <ExtensionAuthAdapter>
          <ConvexProviderWithClerk client={convex} useAuth={useCustomExtensionAuth}>
            {children}
          </ConvexProviderWithClerk>
        </ExtensionAuthAdapter>
      </ExtensionClerkProvider>
    );
  }

  return (
    <WebClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      Clerk={clerk} // Pass the bundled instance
      routerPush={routerPush}
      routerReplace={routerReplace}
    >
      <WebAuthAdapter>
        <ConvexProviderWithClerk client={convex} useAuth={useWebAuth}>
          {children}
        </ConvexProviderWithClerk>
      </WebAuthAdapter>
    </WebClerkProvider>
  );
}
