// page-probe.js - injected into the page (MAIN world). Hooks fetch and XHR
// and posts raw response text back to the content script.
(function(){
  function postText(text){
    try { window.postMessage({ __mw: true, type: 'MODEL_TEXT', text }, '*'); } catch(_) {}
  }

  function hookFetch(){
    const orig = window.fetch;
    if (!orig) return;
    window.fetch = function(...args){
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
      try { this.__mw_url = String(url || ''); } catch(_) {}
      return open.apply(this, arguments);
    };
    XHR.prototype.send = function(body){
      this.addEventListener('load', function(){
        try { if (this && typeof this.responseText === 'string') postText(this.responseText); } catch(_) {}
      });
      return send.apply(this, arguments);
    };
  }

  function notifyURL(){
    try { window.postMessage({ __mw: true, type: 'URL_CHANGE', href: location.href }, '*'); } catch(_) {}
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
    } catch(_) {}
  }

  try {
    hookFetch();
    hookXHR();
    hookHistory();
  } catch (_) {}
})();
