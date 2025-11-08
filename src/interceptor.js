// interceptor.js - content script. Injects a page-world probe to intercept fetch/XHR,
// listens for messages, shows overlay, and relays status to background.
(function(){
  const STATE = { expected: '', showOverlay: true, lastKey: '' };
  const WIDGET_ID = '__model_watcher_widget__';

  function deepFindModels(obj) {
    let found = {};
    function walk(v) {
      if (!v) return;
      if (typeof v === 'object') {
        if ('display_model' in v && typeof v.display_model === 'string') found.display_model = v.display_model;
        if ('user_selected_model' in v && typeof v.user_selected_model === 'string') found.user_selected_model = v.user_selected_model;
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

  function extractModelsFromText(text){
    if (!text || (!text.includes('display_model') && !text.includes('user_selected_model'))) return null;
    try {
      const json = JSON.parse(text);
      const f = deepFindModels(json);
      if (f.display_model || f.user_selected_model) return f;
    } catch (e) {}
    const dm = /"display_model"\s*:\s*"([^"]+)"/.exec(text);
    const us = /"user_selected_model"\s*:\s*"([^"]+)"/.exec(text);
    if (dm || us) return { display_model: dm && dm[1], user_selected_model: us && us[1] };
    return null;
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
      .mw-chip-eq{background:#06223f;color:#60a5fa;border-color:#1d4ed8}
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

    // Controls
    const header = el.querySelector('#mw-h');
    const minBtn = el.querySelector('#mw-min');
    makeDraggable(el, header);
    minBtn.addEventListener('click', ()=>{ el.classList.toggle('mw-min'); saveOverlayState(el); });
    applySavedState(el);
    return el;
  }

  function setWidget(display, selected, matches, matchesExpected){
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
    if (dispEl) dispEl.textContent = '—';
    if (selEl) selEl.textContent = '—';
  }

  function report(display_model, user_selected_model){
    const matchesEachOther = !!display_model && !!user_selected_model && display_model === user_selected_model;
    const matchesExpected = false;
    setWidget(display_model, user_selected_model, matchesEachOther, matchesExpected);
    chrome.runtime.sendMessage({
      type: 'MODEL_UPDATE',
      payload: {
        display_model, user_selected_model, matchesEachOther, matchesExpected,
        ts: Date.now(), url: location.href
      }
    }, ()=>{});
  }

  function handleText(text){
    const models = extractModelsFromText(text);
    if (!models) return;
    const key = location.href + '|' + (models.display_model||'')+'|'+(models.user_selected_model||'');
    if (key === STATE.lastKey) return; // avoid spamming identical updates per URL
    STATE.lastKey = key;
    report(models.display_model, models.user_selected_model);
  }

  function listenFromPage(){
    window.addEventListener('message', (ev)=>{
      if (ev.source !== window) return;
      const d = ev.data;
      if (!d || d.__mw !== true) return;
      if (d.type === 'MODEL_TEXT') {
        handleText(d.text);
      } else if (d.type === 'URL_CHANGE') {
        STATE.lastKey = '';
        setWaiting();
      }
    });
  }

  function injectProbe(){
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('page-probe.js');
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
    s.remove();
  }

  function initConfig(){
    chrome.storage.sync.get({ showOverlay: true }, (cfg)=>{
      STATE.showOverlay = !!cfg.showOverlay;
      if (STATE.showOverlay) ensureWidget();
    });
    chrome.storage.onChanged.addListener((changes, area)=>{
      if (area !== 'sync') return;
      if (changes.showOverlay) STATE.showOverlay = !!changes.showOverlay.newValue;
    });
  }

  try {
    initConfig();
    listenFromPage();
    injectProbe();
  } catch (e) {}
})();
