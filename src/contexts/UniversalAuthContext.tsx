import { createContext, useContext } from 'react';

export interface AuthContextType {
    isLoaded: boolean;
    isSignedIn: boolean | undefined;
    userId: string | null | undefined;
    signOut: () => Promise<void>;
    openSignIn: () => void;
    openSignUp: () => void;
    user: any | null; // Clerk user object
    // Exposed for custom auth flows (ModernAuth)
    signIn: any;
    signUp: any;
    setActive: (params: { session: string | null, organization?: string | null }) => Promise<void>;
    getToken: (options?: any) => Promise<string | null>;
}

export const UniversalAuthContext = createContext<AuthContextType | null>(null);

export const useUniversalAuthContext = () => {
    const context = useContext(UniversalAuthContext);
    if (!context) {
        throw new Error("useUniversalAuthContext must be used within a UniversalAuthProvider");
    }
    return context;
};
