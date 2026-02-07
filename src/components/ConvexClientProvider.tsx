import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { Clerk } from "@clerk/clerk-js";

export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Initialize Clerk manually to force bundling (Avoids CSP errors in Extension)
const clerk = new Clerk(PUBLISHABLE_KEY);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
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

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      Clerk={clerk} // Pass the bundled instance
      routerPush={routerPush}
      routerReplace={routerReplace}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
