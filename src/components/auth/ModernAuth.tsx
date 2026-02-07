import React, { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Assuming sonner is installed, based on App.tsx
import { Loader2, Mail, Lock, User, ArrowRight, Github } from "lucide-react";

export function ModernAuth({ onComplete }: { onComplete?: () => void }) {
    const [view, setView] = useState<"signin" | "signup">("signin");
    const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
    const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);

    // Check for extension environment
    const isExtension = typeof window !== 'undefined' && (
        window.location.protocol === 'chrome-extension:' ||
        window.location.href.includes('chrome-extension://')
    );

    // --- Sign In Handler ---
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSignInLoaded) return;
        setLoading(true);

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === "complete") {
                await setSignInActive({ session: result.createdSessionId });
                toast.success("Welcome back!");
                onComplete?.();
            } else {
                console.error("Sign in requires next step", result);
                toast.error("Sign in requires further verification (not implemented in this custom UI).");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.errors?.[0]?.message || "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    // --- Sign Up Handler ---
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSignUpLoaded) return;
        setLoading(true);

        try {
            const result = await signUp.create({
                emailAddress: email,
                password,
                firstName: fullName.split(" ")[0],
                lastName: fullName.split(" ").slice(1).join(" "),
            });

            // Prepare email verification
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
            toast.success("Verification code sent to your email!");
        } catch (err: any) {
            console.error(err);
            toast.error(err.errors?.[0]?.message || "Failed to sign up");
        } finally {
            setLoading(false);
        }
    };

    // --- Verify Email Handler ---
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSignUpLoaded) return;
        setLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === "complete") {
                await setSignUpActive({ session: completeSignUp.createdSessionId });
                toast.success("Account created successfully!");
                onComplete?.();
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
                toast.error("Verification invalid or incomplete.");
            }
        } catch (err: any) {
            console.error("Error:", JSON.stringify(err, null, 2));
            toast.error(err.errors?.[0]?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    // --- OAuth Handler (Mocking visual only unless provider setup) ---
    const handleGoogleSignIn = async () => {
        if (isExtension) {
            toast.error("Google Sign-In is not supported in the extension popup due to security restrictions. Please use Email/Password.", {
                duration: 5000,
            });
            return;
        }

        if (!isSignInLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: `${window.location.origin}${window.location.pathname}#/sso-callback`,
                redirectUrlComplete: `${window.location.origin}${window.location.pathname}#/dashboard`,
            });
        } catch (err: any) {
            console.error("OAuth Error:", err);
            if (err.errors?.[0]?.code === "invalid_url_scheme") {
                toast.error("Social login requires a hosted environment. Please use Email/Password.");
            } else {
                toast.error("Failed to start social login.");
            }
        }
    };

    // --- Render ---
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-100 p-4">
            {/* Abstract Background Shapes */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="glass backdrop-blur-xl bg-slate-900/60 border border-slate-800/50 shadow-2xl rounded-2xl p-8 transition-all duration-300 hover:shadow-blue-900/20 hover:border-slate-700/50">

                    {/* Header */}
                    <div className="text-center mb-8 space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30">
                                <img src="/logo.svg" alt="App Logo" className="w-8 h-8 text-white" />
                                {/* Fallback Icon if logo missing */}
                                {/* <div className="w-8 h-8 text-white font-bold text-xl">F</div> */}
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white tracking-tight">
                            {view === "signin" ? "Welcome Back" : "Create Account"}
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {view === "signin"
                                ? "Enter your credentials to access your workspace"
                                : "Start your journey to better focus today"}
                        </p>
                    </div>

                    {/* Toggle Switch */}
                    {!pendingVerification && (
                        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800/50 rounded-xl mb-8 border border-slate-700/30 relative">
                            <div
                                className={`absolute inset-y-1 w-[calc(50%-4px)] bg-slate-700/80 rounded-lg shadow-sm transition-all duration-300 ease-spring ${view === 'signup' ? 'translate-x-[calc(100%+4px)]' : 'left-1'}`}
                            />
                            <button
                                onClick={() => setView("signin")}
                                className={`relative z-10 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${view === "signin" ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setView("signup")}
                                className={`relative z-10 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${view === "signup" ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {/* Forms */}
                    <div className="space-y-6">

                        {/* Verification Code Form */}
                        {pendingVerification ? (
                            <form onSubmit={handleVerify} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Verification Code</Label>
                                    <Input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Enter code from email"
                                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 h-11"
                                    />
                                    <p className="text-xs text-slate-500">Check your email {email} for the code.</p>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 h-11" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : "Verify & Complete"}
                                </Button>
                            </form>
                        ) : (

                            /* Main Login/Signup Form */
                            <form onSubmit={view === "signin" ? handleSignIn : handleSignUp} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">

                                {view === "signup" && (
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Full Name</Label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                            <Input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="John Doe"
                                                className="pl-10 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 h-11 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            className="pl-10 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 h-11 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-slate-300">Password</Label>
                                        {view === "signin" && (
                                            <a href="#" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Forgot password?</a>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="pl-10 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 h-11 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20 h-11 font-medium tracking-wide transition-all active:scale-[0.98]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            {view === "signin" ? "Sign In" : "Create Account"}
                                            <ArrowRight className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Divider */}
                        <div className="relative flex items-center justify-center py-2">
                            <div className="h-[1px] w-full bg-slate-800"></div>
                            <span className="absolute px-2 bg-[#0f172a] text-xs text-slate-500 uppercase tracking-widest font-semibold">Or continue with</span>
                        </div>

                        {/* Social Auth */}
                        {/* Social Auth */}
                        {/* Social Auth */}
                        {isExtension ? (
                            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <p className="text-sm text-slate-300 mb-3">
                                    Social login is handled via our secure web app.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full bg-slate-900 border-slate-800 hover:bg-slate-800 text-white"
                                    onClick={() => window.open(`${import.meta.env.VITE_CLERK_SYNC_HOST}/extension-auth`, '_blank')}
                                >
                                    Sign In on Web App
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleGoogleSignIn} className="bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 h-11">
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Google
                                </Button>
                                <Button variant="outline" className="bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 h-11">
                                    <Github className="mr-2 h-4 w-4" />
                                    GitHub
                                </Button>
                            </div>
                        )}

                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500">
                            By continuing, you verify that you are a focused individual ready to crush your goals.
                            <a href="#" className="hover:text-blue-400 hover:underline ml-1">Terms</a> &
                            <a href="#" className="hover:text-blue-400 hover:underline ml-1">Privacy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
