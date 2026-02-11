import React from "react";
import { useUser as useWebUser, useClerk as useWebClerk, useSignIn as useWebSignIn, useSignUp as useWebSignUp, useAuth as useWebAuth } from "@clerk/clerk-react";
import { useUser as useExtensionUser, useClerk as useExtensionClerk, useSignIn as useExtensionSignIn, useSignUp as useExtensionSignUp } from "@clerk/chrome-extension";
import { UniversalAuthContext } from "@/contexts/UniversalAuthContext";

export const WebAuthAdapter = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoaded, isSignedIn } = useWebUser();
    const { getToken } = useWebAuth();
    const { signOut, openSignIn, openSignUp, setActive } = useWebClerk();
    const { signIn } = useWebSignIn();
    const { signUp } = useWebSignUp();

    const value = {
        isLoaded,
        isSignedIn,
        userId: user?.id,
        user,
        signOut: async () => { await signOut(); },
        openSignIn: () => openSignIn(),
        openSignUp: () => openSignUp(),
        signIn,
        signUp,
        setActive: setActive as any,
        getToken,
    };

    return (
        <UniversalAuthContext.Provider value={value}>
            {children}
        </UniversalAuthContext.Provider>
    );
};

export const ExtensionAuthAdapter = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoaded, isSignedIn } = useExtensionUser();
    const clerk = useExtensionClerk();
    const { signIn } = useExtensionSignIn();
    const { signUp } = useExtensionSignUp();

    const value = {
        isLoaded,
        isSignedIn,
        userId: user?.id,
        user,
        signOut: async () => { await clerk.signOut(); },
        openSignIn: () => clerk.openSignIn(),
        openSignUp: () => clerk.openSignUp(),
        signIn,
        signUp,
        setActive: clerk.setActive as any,
        getToken: async (options?: any) => {
            if (!clerk.session) return null;
            return clerk.session.getToken(options);
        },
    };

    return (
        <UniversalAuthContext.Provider value={value}>
            {children}
        </UniversalAuthContext.Provider>
    );
};
