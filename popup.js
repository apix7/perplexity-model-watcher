// popup.js - show latest model values for the active tab

let debugMode = false;
function debugLog(...args) {
  if (debugMode) console.log('[MW-popup]', ...args);
}

chrome.storage.sync.get({ debugMode: false }, (items) => {
  debugMode = !!items.debugMode;
});

function setText(id, text, cls) {
  const el = document.getElementById(id);
  el.textContent = text || '—';
  el.className = 'val' + (cls ? ' ' + cls : '');
}

function statusLabel(state) {
  if (!state) return { label: 'WAIT', cls: '' };
  if (state.matchesEachOther) return { label: 'OK', cls: 'ok' };
  return { label: 'MISMATCH', cls: 'bad' };
}

function setChip(label, cls){
  const chip = document.getElementById('statusChip');
  chip.textContent = label;
  chip.className = 'chip ' + (cls || '');
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  debugLog('active tab:', tab?.id, tab?.url);

  if (!tab) {
    document.getElementById('meta').textContent = 'No active tab found';
    return;
  }

  chrome.runtime.sendMessage({ type: 'GET_LAST_FOR_TAB', tabId: tab.id }, (resp) => {
    if (chrome.runtime.lastError) {
      document.getElementById('meta').textContent = 'Error: ' + chrome.runtime.lastError.message;
      return;
    }
    debugLog('response:', resp);
    const st = resp?.state || null;
    setText('display', st?.display_model);
    setText('selected', st?.user_selected_model);
    const { label, cls } = statusLabel(st);
    setChip(label, cls);
    const meta = document.getElementById('meta');
    if (st?.ts) {
      const d = new Date(st.ts);
      meta.textContent = 'Last seen ' + d.toLocaleTimeString() + ' on ' + new URL(st.url||location.href).hostname;
    } else {
      meta.textContent = 'Waiting for a response on this tab…';
    }

    document.getElementById('toggleOverlay').addEventListener('click', ()=>{
      chrome.storage.sync.get({ showOverlay: true }, (cfg) => {
        chrome.storage.sync.set({ showOverlay: !cfg.showOverlay });
      });
    });
  });

  document.getElementById('openOptions').addEventListener('click', async (e) => {
    e.preventDefault();
    await chrome.runtime.openOptionsPage();
  });
}

document.addEventListener('DOMContentLoaded', init);
