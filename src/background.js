// Import WebExtension polyfill for cross-browser compability
// This provides the unified 'browser' API namespace
importScripts('browser-polyfill.js');

// Background service worker for Model Watcher
// Keeps last seen model info per tab and sets the badge color/text

const stateByTab = {};

browser.runtime.onInstalled.addListener(async () => {
  const items = await browser.storage.sync.get({ expectedModel: '', showOverlay: true });
  if (typeof items.expectedModel !== 'string') {
    await browser.storage.sync.set({ expectedModel: '' });
  }
  if (typeof items.showOverlay !== 'boolean') {
    await browser.storage.sync.set({ showOverlay: true });
  }
});

async function setBadge(tabId, payload) {
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
  await Promise.all([
    browser.action.setBadgeText({ tabId, text }),
    browser.action.setBadgeBackgroundColor({ tabId, color })
  ]);
}

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (!message || !sender || !sender.tab) return;
  const tabId = sender.tab.id;

  if (message.type === 'MODEL_UPDATE') {
    stateByTab[tabId] = message.payload;
    await setBadge(tabId, message.payload);
    return { ok: true };
  }

  if (message.type === 'GET_LAST_FOR_TAB') {
    const { tabId: reqTabId } = message;
    const tabState = stateByTab[reqTabId] || null;
    const cfg = await browser.storage.sync.get({ expectedModel: '', showOverlay: true });
    return { state: tabState, config: cfg };
  }
});
