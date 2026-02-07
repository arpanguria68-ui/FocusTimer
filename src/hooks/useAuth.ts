import { useUser, useClerk } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

/**
 * Simple Auth Hook
 * 
 * No complex token syncing. Just standard Clerk auth that works
 * independently in web and extension contexts.
 * 
 * Both contexts authenticate separately but sync data through Convex.
 */
export const useAuth = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut, openSignIn, openSignUp } = useClerk();

  // Sync user to Convex DB (runs in both web and extension)
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      ensureUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        full_name: clerkUser.fullName || clerkUser.firstName || "",
        avatar_url: clerkUser.imageUrl,
      }).catch((err) => {
        console.error('[useAuth] Failed to sync user to Convex:', err);
      });
    }
  }, [isSignedIn, clerkUser, ensureUser]);

  // Simple user object
  const user = isSignedIn && clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    user_metadata: {
      full_name: clerkUser.fullName,
      avatar_url: clerkUser.imageUrl,
    }
  } : null;

  // Simple sign out - no complex clearing
  const signOut = async () => {
    await clerkSignOut(() => {
      window.location.reload();
    });
  };

  return {
    user,
    session: isSignedIn ? { user } : null,
    loading: !isLoaded,
    isSignedIn,
    signIn: async () => openSignIn(),
    signUp: async () => openSignUp(),
    signOut,
  };
};

export const useAuthState = useAuth;
export const AuthContext = null;
