// Stateless background script for timer alarms and notifications

// Helper to get timer state
async function getTimerState() {
  const result = await chrome.storage.local.get(['timerState']);
  return result.timerState || { isRunning: false, endTime: null, sessionType: 'focus' };
}

// Helper to set timer state
async function setTimerState(state) {
  await chrome.storage.local.set({ timerState: state });
}

// Listen for messages from the React app (Popup/Dashboard)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TIMER') {
    const { duration, metadata } = message;
    const now = Date.now();
    const endTime = now + (duration * 1000);

    const newState = {
      isRunning: true,
      endTime: endTime,
      sessionType: metadata?.sessionType || 'focus'
    };

    setTimerState(newState).then(() => {
      // Create an alarm to fire when the timer should end
      chrome.alarms.create('focusTimer', {
        when: endTime
      });
      console.log('[Background] Timer started. Ends at:', new Date(endTime).toLocaleTimeString());
    });
  }
  else if (message.type === 'STOP_TIMER') {
    setTimerState({ isRunning: false, endTime: null, sessionType: 'focus' }).then(() => {
      chrome.alarms.clear('focusTimer');
      console.log('[Background] Timer stopped/paused.');
    });
  }
  else if (message.type === 'GET_TIMER_STATUS') {
    // Allow frontend to poll for status (if they don't use their own local storage)
    getTimerState().then(state => sendResponse(state));
    return true; // Keep channel open for async response
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focusTimer') {
    // Update state
    await setTimerState({ isRunning: false, endTime: null, sessionType: 'focus' });

    // Show notification
    // Note: Chrome requires a raster image (PNG) for notifications. 
    // SVGs might not work on all platforms. Ensure 'icons/icon48.png' exists in public folder.
    chrome.notifications.create('timerComplete', {
      type: 'basic',
      iconUrl: 'icons/icon48.svg', // Fallback to SVG if PNG missing, but PNG recommended
      title: 'Focus Timer',
      message: 'Session completed! Time for a break \uD83C\uDF89',
      priority: 2
    });

    // Open smile popup if enabled
    const result = await chrome.storage.local.get(['smilePopupSettings']);
    const settings = result.smilePopupSettings;
    
    // Default to true if settings not found, or respect the setting logic
    if (settings?.enabled !== false && settings?.showAsExternalWindow) {
      chrome.windows.create({
        url: chrome.runtime.getURL('smile-popup.html'),
        type: 'popup',
        width: settings.windowWidth || 500,
        height: settings.windowHeight || 600
      });
    }
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'timerComplete') {
    // Focus the extension window or open dashboard
    chrome.tabs.create({ url: 'dashboard.html' });
  }
});

// Default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['timerSettings'], (result) => {
    if (!result.timerSettings) {
      chrome.storage.sync.set({
        timerSettings: {
          focusTime: 25 * 60,
          breakTime: 5 * 60,
          longBreakTime: 15 * 60
        }
      });
    }
  });
});
