// Simple background script for timer alarms and notifications

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'focusTimer') {
    chrome.notifications.create('timerComplete', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Timer',
      message: 'Session completed! Time for a break 🎉'
    });

    // Open smile popup if enabled
    chrome.storage.local.get(['smilePopupSettings'], (result) => {
      const settings = result.smilePopupSettings;
      if (settings?.enabled && settings?.showAsExternalWindow) {
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
    chrome.action.openPopup();
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
