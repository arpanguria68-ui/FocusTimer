// content-script-auth.js
// This script runs on the web app (focustimer.app / vercel.app)
// It listens for the auth token from the web app and sends it to the extension background

console.log("[FocusTimer Extension] Content Script Loaded on", window.location.href);

// Listen for messages from the web app
window.addEventListener("message", (event) => {
    // We only accept messages from the same window
    if (event.source !== window) return;

    if (event.data.type === "FOCUS_TIMER_AUTH_SUCCESS") {
        console.log("[FocusTimer Extension] Received auth token from web app", event.data);

        // Relay to extension background
        chrome.runtime.sendMessage({
            type: "CLERK_AUTH_TOKEN_RECEIVED",
            token: event.data.token,
            user: event.data.user
        }, (response) => {
            console.log("[FocusTimer Extension] Token sent to background, response:", response);
        });
    }
});
