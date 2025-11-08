// Background service worker for Model Watcher
// Keeps last seen model info per tab and sets the badge color/text

const stateByTab = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ expectedModel: '', showOverlay: true }, (items) => {
    if (typeof items.expectedModel !== 'string') {
      chrome.storage.sync.set({ expectedModel: '' });
    }
    if (typeof items.showOverlay !== 'boolean') {
      chrome.storage.sync.set({ showOverlay: true });
    }
  });
});

function setBadge(tabId, payload) {
  if (!tabId) return;
  const { matchesEachOther } = payload || {};
  let text = '';
  let color = '#6b7280';
  if (payload && (payload.display_model || payload.user_selected_model)) {
    if (matchesEachOther) {
      text = 'OK';
      color = '#10b981'; // green when equal
    } else {
      text = '!';
      color = '#ef4444'; // red on mismatch
    }
  }
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !sender || !sender.tab) return; // ignore
  const tabId = sender.tab.id;

  if (message.type === 'MODEL_UPDATE') {
    stateByTab[tabId] = message.payload;
    setBadge(tabId, message.payload);
    sendResponse({ ok: true });
    return true; // async response allowed
  }

  if (message.type === 'GET_LAST_FOR_TAB') {
    const { tabId: reqTabId } = message;
    const tabState = stateByTab[reqTabId] || null;
    chrome.storage.sync.get({ expectedModel: '', showOverlay: true }, (cfg) => {
      sendResponse({ state: tabState, config: cfg });
    });
    return true;
  }
});
