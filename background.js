// Background service worker for Model Watcher
// Keeps last seen model info per tab and sets the badge color/text

let debugMode = false;
function debugLog(...args) {
  if (debugMode) console.log('[MW-bg]', ...args);
}

const stateByTab = {};

function loadDebugSetting() {
  chrome.storage.sync.get({ debugMode: false }, (items) => {
    debugMode = !!items.debugMode;
    debugLog('debug mode:', debugMode);
  });
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.debugMode) {
    debugMode = !!changes.debugMode.newValue;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  loadDebugSetting();
  chrome.storage.sync.get({ expectedModel: '', showOverlay: true, debugMode: false }, (items) => {
    if (typeof items.expectedModel !== 'string') {
      chrome.storage.sync.set({ expectedModel: '' });
    }
    if (typeof items.showOverlay !== 'boolean') {
      chrome.storage.sync.set({ showOverlay: true });
    }
    if (typeof items.debugMode !== 'boolean') {
      chrome.storage.sync.set({ debugMode: false });
    }
  });
});

loadDebugSetting();

function setBadge(tabId, payload) {
  if (!tabId) return;
  const { matchesEachOther } = payload || {};
  let text = '';
  let color = '#6b7280';
  if (payload && (payload.display_model || payload.user_selected_model)) {
    if (matchesEachOther) {
      text = 'OK';
      color = '#10b981';
    } else {
      text = '!';
      color = '#ef4444';
    }
  }
  chrome.action.setBadgeText({ tabId, text }).catch(()=>{});
  chrome.action.setBadgeBackgroundColor({ tabId, color }).catch(()=>{});
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !sender) return;

  if (message.type === 'MODEL_UPDATE') {
    if (!sender.tab) return;
    const tabId = sender.tab.id;
    const prev = stateByTab[tabId] || {};
    const merged = { ...prev, ...message.payload };
    for (const k of Object.keys(merged)) {
      if (merged[k] === undefined) delete merged[k];
    }
    merged.matchesEachOther = !!(merged.display_model && merged.user_selected_model && merged.display_model === merged.user_selected_model);
    stateByTab[tabId] = merged;
    debugLog('stored update for tab', tabId, merged);
    setBadge(tabId, merged);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'GET_LAST_FOR_TAB') {
    const { tabId: reqTabId } = message;
    const tabState = stateByTab[reqTabId] || null;
    debugLog('GET_LAST_FOR_TAB for tab', reqTabId, 'found:', !!tabState);
    chrome.storage.sync.get({ expectedModel: '', showOverlay: true }, (cfg) => {
      sendResponse({ state: tabState, config: cfg });
    });
    return true;
  }
});
