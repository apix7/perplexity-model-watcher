// interceptor.js - content script. Injects a page-world probe to intercept fetch/XHR,
// listens for messages, shows overlay, and relays status to background.
(function(){
  const TAG = '[MW]';
  const STATE = { expected: '', showOverlay: true, debugMode: false, lastKey: '' };
  const WIDGET_ID = '__model_watcher_widget__';

  function debugLog(...args) {
    if (STATE.debugMode) console.log(TAG, ...args);
  }

  function deepFindModels(obj) {
    let found = {};
    function walk(v) {
      if (!v) return;
      if (typeof v === 'object') {
        if ('default_model' in v && typeof v.default_model === 'string' && !found.display_model) found.display_model = v.default_model;
        if ('display_model' in v && typeof v.display_model === 'string' && !found.display_model) found.display_model = v.display_model;
        if ('model' in v && typeof v.model === 'string' && !found.display_model && v.model.indexOf(' ') === -1 && v.model.length > 4) found.display_model = v.model;
        if ('model_preference' in v && typeof v.model_preference === 'string' && !found.user_selected_model) found.user_selected_model = v.model_preference;
        if ('user_selected_model' in v && typeof v.user_selected_model === 'string' && !found.user_selected_model) found.user_selected_model = v.user_selected_model;
        if (found.display_model && found.user_selected_model) return;
        for (const key in v) {
          if (Object.prototype.hasOwnProperty.call(v, key)) walk(v[key]);
          if (found.display_model && found.user_selected_model) return;
        }
      }
    }
    walk(obj);
    return found;
  }

  function extractModelsFromText(text, source){
    if (!text) return null;

    try {
      const json = JSON.parse(text);
      const f = deepFindModels(json);
      const result = {};
      if (source === 'response') {
        if (f.display_model) result.display_model = f.display_model;
      } else if (source === 'request') {
        if (f.user_selected_model) result.user_selected_model = f.user_selected_model;
      }
      if (result.display_model || result.user_selected_model) return result;
    } catch (e) {}

    let responseModel = null;
    if (source === 'response') {
      for (const name of ['display_model', 'model', 'model_id', 'model_name']) {
        const re = new RegExp('"' + name + '"\\s*:\\s*"([^"]+)"', 'g');
        let m;
        while ((m = re.exec(text)) !== null) {
          const val = m[1];
          if (val.length > 3 && !['search', 'writing', 'reasoning', 'copilot', 'concise', 'default'].includes(val)) {
            responseModel = val;
            if (val.length < 40 && !val.includes(' ')) break;
          }
        }
        if (responseModel) break;
      }
    }

    let userModel = null;
    const um = /"model_preference"\s*:\s*"([^"]+)"/.exec(text);
    if (um) userModel = um[1];

    let defaultModel = null;
    if (source === 'response') {
      let dm = /"display_model"\s*:\s*"([^"]+)"/.exec(text);
      if (!dm) dm = /"default_model"\s*:\s*"([^"]+)"/.exec(text);
      if (dm) defaultModel = dm[1];
    }

    const result = {};
    if (responseModel) result.display_model = responseModel;
    else if (defaultModel) result.display_model = defaultModel;
    if (userModel) result.user_selected_model = userModel;

    return (result.display_model || result.user_selected_model) ? result : null;
  }

  const STORE_KEY = 'mw_overlay:'+location.origin;

  function injectStyles(){
    if (document.getElementById('mw-card-style')) return;
    const st = document.createElement('style');
    st.id = 'mw-card-style';
    st.textContent = `
      .mw-card{position:fixed;top:8px;right:8px;z-index:2147483647;background:#0b1220cc;color:#e5e7eb;font:12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;border:1px solid #334155;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.35);backdrop-filter:blur(4px)}
      .mw-card *{box-sizing:border-box}
      .mw-header{display:flex;align-items:center;gap:8px;padding:6px 8px;cursor:move;user-select:none}
      .mw-title{font-weight:600;letter-spacing:.2px}
      .mw-chip{font-weight:700;font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid transparent}
      .mw-chip-ok{background:#052e1a;color:#34d399;border-color:#065f46}
      .mw-chip-bad{background:#3f0610;color:#f87171;border-color:#b91c1c}
      .mw-chip-wait{background:#1f2937;color:#cbd5e1;border-color:#334155}
      .mw-body{padding:6px 10px 10px 10px}
      .mw-row{display:flex;align-items:center;gap:8px;margin:4px 0}
      .mw-key{min-width:72px;color:#93a6bf}
      .mw-val{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;color:#e5e7eb}
      .mw-btn{all:unset;cursor:pointer;color:#9ca3af;padding:2px 6px;border-radius:6px}
      .mw-btn:hover{background:#111827}
      .mw-min .mw-body{display:none}
    `;
    (document.head || document.documentElement).appendChild(st);
  }

  function saveOverlayState(el){
    const rect = el.getBoundingClientRect();
    const minimized = el.classList.contains('mw-min');
    const pos = { top: rect.top + window.scrollY, left: rect.left + window.scrollX, minimized };
    try { chrome.storage.local.set({ [STORE_KEY]: pos }); } catch (_) {}
  }

  function applySavedState(el){
    try {
      chrome.storage.local.get({ [STORE_KEY]: null }, (obj)=>{
        const st = obj && obj[STORE_KEY];
        if (!st) return;
        if (typeof st.top === 'number') el.style.top = Math.max(0, st.top) + 'px';
        if (typeof st.left === 'number') {
          el.style.left = Math.max(0, st.left) + 'px';
          el.style.right = 'auto';
        }
        if (st.minimized) el.classList.add('mw-min');
      });
    } catch (_) {}
  }

  function makeDraggable(el, handle){
    let dragging = false, startX=0, startY=0, origTop=0, origLeft=0;
    handle.addEventListener('mousedown', (e)=>{
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const r = el.getBoundingClientRect();
      origTop = r.top + window.scrollY; origLeft = r.left + window.scrollX;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e)=>{
      if (!dragging) return;
      const dx = e.clientX - startX; const dy = e.clientY - startY;
      el.style.top = Math.max(0, origTop + dy) + 'px';
      el.style.left = Math.max(0, origLeft + dx) + 'px';
      el.style.right = 'auto';
    });
    window.addEventListener('mouseup', ()=>{ if (dragging){ dragging=false; saveOverlayState(el);} });
  }

  function ensureWidget(){
    if (!STATE.showOverlay) return null;
    let el = document.getElementById(WIDGET_ID);
    if (el) return el;
    injectStyles();
    el = document.createElement('div');
    el.id = WIDGET_ID;
    el.className = 'mw-card';
    el.innerHTML = `
      <div class="mw-header" id="mw-h">
        <span class="mw-title">Model Watcher</span>
        <span class="mw-chip mw-chip-wait" id="mw-status">WAIT</span>
        <span style="flex:1"></span>
        <button class="mw-btn" id="mw-min" title="Minimize">—</button>
      </div>
      <div class="mw-body" id="mw-b">
        <div class="mw-row"><span class="mw-key">Display</span><span class="mw-val" id="mw-display">—</span></div>
        <div class="mw-row"><span class="mw-key">Selected</span><span class="mw-val" id="mw-selected">—</span></div>
      </div>`;
    document.documentElement.appendChild(el);
    debugLog('overlay widget created');

    const header = el.querySelector('#mw-h');
    const minBtn = el.querySelector('#mw-min');
    makeDraggable(el, header);
    minBtn.addEventListener('click', ()=>{ el.classList.toggle('mw-min'); saveOverlayState(el); });
    applySavedState(el);
    return el;
  }

  function setWidget(display, selected, matches){
    const el = ensureWidget();
    if (!el) return;
    const status = el.querySelector('#mw-status');
    const dispEl = el.querySelector('#mw-display');
    const selEl = el.querySelector('#mw-selected');

    let cls = 'mw-chip-bad', label = 'MISMATCH';
    if (matches) { cls = 'mw-chip-ok'; label = 'OK'; }

    status.className = 'mw-chip ' + cls;
    status.textContent = label;
    dispEl.textContent = display || '—';
    selEl.textContent = selected || '—';

    saveOverlayState(el);
  }

  function setWaiting(){
    const el = ensureWidget();
    if (!el) return;
    const status = el.querySelector('#mw-status');
    status.className = 'mw-chip mw-chip-wait';
    status.textContent = 'WAIT';
    const dispEl = el.querySelector('#mw-display');
    const selEl = el.querySelector('#mw-selected');
    if (dispEl) dispEl.textContent = lastModels.display_model || '—';
    if (selEl) selEl.textContent = lastModels.user_selected_model || '—';
  }

  const lastModels = { display_model: null, user_selected_model: null };

  function report(display_model, user_selected_model){
    if (display_model !== undefined && display_model !== null) lastModels.display_model = display_model;
    if (user_selected_model !== undefined && user_selected_model !== null) lastModels.user_selected_model = user_selected_model;

    const dm = lastModels.display_model;
    const us = lastModels.user_selected_model;
    const matchesEachOther = !!dm && !!us && dm === us;
    setWidget(dm, us, matchesEachOther);
    debugLog('models:', { display_model: dm, user_selected_model: us, matchesEachOther });
    chrome.runtime.sendMessage({
      type: 'MODEL_UPDATE',
      payload: {
        display_model: dm, user_selected_model: us, matchesEachOther,
        ts: Date.now(), url: location.href
      }
    }, () => { if (chrome.runtime.lastError) { /* ignore */ } });
  }

  function handleText(text, source){
    source = source || 'response';
    const models = extractModelsFromText(text, source);
    if (!models) return;

    const display_model = models.display_model;
    const user_selected_model = models.user_selected_model;

    if (!display_model && !user_selected_model) return;

    const key = location.href + '|' + (display_model||'')+'|'+(user_selected_model||'');
    if (key === STATE.lastKey) return;
    STATE.lastKey = key;
    report(display_model, user_selected_model);
  }

  function listenFromPage(){
    window.addEventListener('message', (ev)=>{
      if (ev.source !== window) return;
      const d = ev.data;
      if (!d || d.__mw !== true) return;
      if (d.type === 'MODEL_TEXT') {
        if (d.text && d.text.startsWith('__MW_REQUEST__')) {
          const reqText = d.text.substring(15);
          debugLog('request model:', reqText.match(/"model_preference"\s*:\s*"([^"]+)"/)?.[1] || '?');
          handleText(reqText, 'request');
          return;
        }
        handleText(d.text, 'response');
      } else if (d.type === 'URL_CHANGE') {
        debugLog('URL_CHANGE:', d.href);
        STATE.lastKey = '';
        setWaiting();
      }
    });
    debugLog('listening for page messages');
  }

  function injectProbe(){
    try {
      const url = chrome.runtime.getURL('page-probe.js');
      debugLog('injecting probe:', url);
      const s = document.createElement('script');
      s.src = url;
      s.async = false;
      const target = document.head || document.documentElement;
      if (!target) return;
      target.appendChild(s);
      s.onload = function() { debugLog('probe loaded'); s.remove(); };
      s.onerror = function() { console.error(TAG, 'probe failed to load'); s.remove(); };
    } catch (e) {
      console.error(TAG, 'injectProbe error:', e);
    }
  }

  function initConfig(){
    chrome.storage.sync.get({ showOverlay: true, debugMode: false }, (cfg)=>{
      STATE.showOverlay = !!cfg.showOverlay;
      STATE.debugMode = !!cfg.debugMode;
      try { localStorage.setItem('mw_debug', STATE.debugMode ? '1' : '0'); } catch(_) {}
      debugLog('init', { showOverlay: STATE.showOverlay, debugMode: STATE.debugMode });
      if (STATE.showOverlay) ensureWidget();
    });
    chrome.storage.onChanged.addListener((changes, area)=>{
      if (area !== 'sync') return;
      if (changes.showOverlay) STATE.showOverlay = !!changes.showOverlay.newValue;
      if (changes.debugMode) {
        STATE.debugMode = !!changes.debugMode.newValue;
        try { localStorage.setItem('mw_debug', STATE.debugMode ? '1' : '0'); } catch(_) {}
      }
    });
  }

  try {
    initConfig();
    listenFromPage();
    injectProbe();
  } catch (e) {
    console.error(TAG, 'init error:', e);
  }
})();
