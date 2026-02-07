import { useUser, useClerk } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

// Maintain Supabase-like interface for backward compatibility
export const useAuth = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut, openSignIn, openSignUp } = useClerk();

  // Sync user to Convex DB
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      ensureUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        full_name: clerkUser.fullName || clerkUser.firstName || "",
        avatar_url: clerkUser.imageUrl,
      });
    }
  }, [isSignedIn, clerkUser, ensureUser]);

  // Adapter to match old User interface partially
  const user = isSignedIn && clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    user_metadata: {
      full_name: clerkUser.fullName,
      avatar_url: clerkUser.imageUrl,
    }
  } : null;

  return {
    user,
    session: isSignedIn ? { user } : null, // Mock session object
    loading: !isLoaded,
    isSignedIn,

    // Auth Methods
    // Auth Methods
    signIn: async () => openSignIn(),
    signUp: async () => openSignUp(),
    signOut: async () => signOut(() => {
      // Reload to clear state/cache, safer than redirecting to a specific path in extension
      window.location.reload();
    }),

    // Legacy methods no longer needed but kept for TS compatibility if strictly typed
    resetPassword: async () => { console.warn("Use Clerk UI for password reset"); return { success: true, message: "Redirecting..." }; },
    updateProfile: async () => { console.warn("Update profile via Clerk UI"); }
  };
};

// Deprecated: Just alias to useAuth
export const useAuthState = useAuth;
export const AuthContext = null; // No longer using context directly, relying on Clerk
