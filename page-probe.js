// page-probe.js - injected into the page (MAIN world). Hooks fetch and XHR
// and posts raw response text back to the content script.
(function(){
  const TAG = '[MW-probe]';

  function debugLog(...args) {
    try {
      if (localStorage.getItem('mw_debug') === '1') console.log(TAG, ...args);
    } catch(_) {}
  }
  debugLog('probe injected');

  function postText(text){
    try { window.postMessage({ __mw: true, type: 'MODEL_TEXT', text }, '*'); } catch(e) {}
  }

  // Hook ReadableStream readers to capture streaming data the page reads
  if (typeof ReadableStream !== 'undefined') {
    try {
      const origGetReader = ReadableStream.prototype.getReader;
      ReadableStream.prototype.getReader = function(...args) {
        const reader = origGetReader.apply(this, args);
        const origRead = reader.read;
        reader.read = function() {
          return origRead.call(this).then(function(result) {
            if (result && result.value) {
              try {
                const text = new TextDecoder().decode(result.value);
                if (text && text.includes('display_model')) {
                  postText(text);
                }
              } catch(_) {}
            }
            return result;
          });
        };
        return reader;
      };
      debugLog('ReadableStream hooked');
    } catch(_) {}
  }

  function hookFetch(){
    const orig = window.fetch;
    if (!orig) return;
    window.fetch = function(...args){
      try {
        const reqBody = args[1] && args[1].body;
        if (reqBody && typeof reqBody === 'string' && reqBody.includes('model_preference')) {
          postText('__MW_REQUEST__' + reqBody);
        }
      } catch(_) {}

      return orig.apply(this, args).then((res)=>{
        try {
          const clone = res.clone();
          clone.text().then(postText).catch(()=>{});
        } catch (_) {}
        return res;
      });
    };
  }

  function hookXHR(){
    const XHR = window.XMLHttpRequest;
    if (!XHR) return;
    const open = XHR.prototype.open;
    const send = XHR.prototype.send;
    XHR.prototype.open = function(method, url){
      try { this.__mw_url = String(url || ''); } catch(e) {}
      return open.apply(this, arguments);
    };
    XHR.prototype.send = function(body){
      try {
        if (body && typeof body === 'string' && body.includes('model_preference')) {
          postText('__MW_REQUEST__' + body);
        }
      } catch(_) {}
      this.addEventListener('load', function(){
        try { if (this && typeof this.responseText === 'string') postText(this.responseText); } catch(_) {}
      });
      return send.apply(this, arguments);
    };
  }

  function notifyURL(){
    try { window.postMessage({ __mw: true, type: 'URL_CHANGE', href: location.href }, '*'); } catch(e) {}
  }

  function hookHistory(){
    try {
      const H = window.history;
      const origPush = H.pushState;
      const origReplace = H.replaceState;
      H.pushState = function(){ const r = origPush.apply(this, arguments); setTimeout(notifyURL, 0); return r; };
      H.replaceState = function(){ const r = origReplace.apply(this, arguments); setTimeout(notifyURL, 0); return r; };
      window.addEventListener('popstate', notifyURL);
      window.addEventListener('load', notifyURL);
    } catch(e) {}
  }

  hookFetch();
  hookXHR();
  hookHistory();
})();
