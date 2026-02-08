// Simple background script for timer alarms and notifications

let timerState = {
  isRunning: false,
  endTime: null,
  sessionType: 'focus'
};

// Listen for messages from the React app (Popup/Dashboard)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TIMER') {
    const { duration, metadata } = message;
    const now = Date.now();
    const endTime = now + (duration * 1000);

    timerState = {
      isRunning: true,
      endTime: endTime,
      sessionType: metadata?.sessionType || 'focus'
    };

    // Create an alarm to fire when the timer should end
    chrome.alarms.create('focusTimer', {
      when: endTime
    });

    console.log('[Background] Timer started. Ends at:', new Date(endTime).toLocaleTimeString());
  }
  else if (message.type === 'STOP_TIMER') {
    timerState.isRunning = false;
    timerState.endTime = null;
    chrome.alarms.clear('focusTimer');
    console.log('[Background] Timer stopped/paused.');
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'focusTimer') {
    timerState.isRunning = false;

    chrome.notifications.create('timerComplete', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Timer',
      message: 'Session completed! Time for a break \uD83C\uDF89',
      priority: 2
    });

    // Open smile popup if enabled
    chrome.storage.local.get(['smilePopupSettings'], (result) => {
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
    });
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
  chrome.storage.sync.set({
    timerSettings: {
      focusTime: 25 * 60,
      breakTime: 5 * 60,
      longBreakTime: 15 * 60
    }
  });
});
