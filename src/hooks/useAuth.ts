import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { useUniversalAuthContext } from "@/contexts/UniversalAuthContext";

/**
 * Universal Auth Hook
 * 
 * Consumes the UniversalAuthContext which is populated by
 * either WebAuthAdapter or ExtensionAuthAdapter.
 */
export const useAuth = () => {
  const { user: clerkUser, isLoaded, isSignedIn, signOut: contextSignOut, openSignIn, openSignUp, getToken: contextGetToken } = useUniversalAuthContext();

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

  // Simple sign out
  const signOut = async () => {
    await contextSignOut();
    window.location.reload();
  };

  return {
    user,
    session: isSignedIn ? { user } : null,
    loading: !isLoaded,
    isSignedIn,
    signIn: async () => openSignIn(),
    signUp: async () => openSignUp(),
    signOut,
    getToken: contextGetToken,
  };
};

export const useAuthState = useAuth;
export const AuthContext = null; // Deprecated, kept for compatibility if needed
