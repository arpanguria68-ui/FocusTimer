import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ExtensionAuthCallback() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { user } = useUser();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        const syncToken = async () => {
            if (!isLoaded) return;

            if (!isSignedIn) {
                // If not signed in, redirect to login with a redirect back here
                // We use the current location as the redirect_url
                const returnUrl = '/extension-auth' + window.location.search;
                // Redirecting to root which usually handles auth redirect or Clerk's sign-in
                // Assuming root "/" has the sign-in logic or we can use clerk's redirectToSignIn
                // For now, let's redirect to home which has the auth check
                window.location.href = `/?redirect_url=${encodeURIComponent(returnUrl)}`;
                return;
            }

            try {
                // Get the Clerk session token. 
                // CRITICAL: We prioritize the persistent Token from localStorage ('clerk-db-jwt')
                // because getToken() returns a short-lived access token that might not bootstrap
                // the extension's Clerk client state correctly.
                let token = localStorage.getItem('clerk-db-jwt'); // Standard Clerk key
                let source = 'localStorage';

                if (!token) {
                    console.log("[ExtensionAuth] No clerk-db-jwt found, falling back to getToken()");
                    token = await getToken();
                    source = 'api';
                }

                console.log(`[ExtensionAuth] Got token from ${source}, sending to extension...`);

                if (!token) {
                    throw new Error("No token returned");
                }

                console.log("[ExtensionAuth] Got token, sending to extension...");

                // Send token to the content script via window.postMessage
                // The content script (injected by extension) will listen for this
                window.postMessage({
                    type: 'FOCUS_TIMER_AUTH_SUCCESS',
                    token,
                    user: {
                        id: user?.id,
                        email: user?.primaryEmailAddress?.emailAddress,
                        fullName: user?.fullName,
                        imageUrl: user?.imageUrl
                    }
                }, '*');

                setStatus('success');

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);

            } catch (err: any) {
                console.error("Failed to get token", err);
                setStatus('error');
                setErrorMsg(err.message || "Unknown error");
            }
        };

        syncToken();
    }, [isLoaded, isSignedIn, getToken, user]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 font-sans">
            <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm text-center space-y-6">

                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <h2 className="text-xl font-semibold">Syncing with Focus Timer...</h2>
                        <p className="text-slate-400">Please wait while we securely transfer your session.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Authentication Successful!</h2>
                        <p className="text-slate-300">
                            Redirecting to your dashboard...
                        </p>
                        <div className="w-full bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-full animate-progress-origin-left" style={{ animation: 'progress 2s linear' }} />
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Sync Failed</h2>
                        <p className="text-red-300/80 text-sm">{errorMsg}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            Try Again
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
