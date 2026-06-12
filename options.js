// options.js - save expected model and overlay setting

function $(id){ return document.getElementById(id); }

function load() {
  chrome.storage.sync.get({ showOverlay: true, debugMode: false }, (items) => {
    $('showOverlay').checked = !!items.showOverlay;
    $('debugMode').checked = !!items.debugMode;
  });
}

function save() {
  const showOverlay = $('showOverlay').checked;
  const debugMode = $('debugMode').checked;
  chrome.storage.sync.set({ showOverlay, debugMode }, () => {
    $('status').textContent = 'Saved';
    setTimeout(() => ($('status').textContent = ''), 1200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  $('save').addEventListener('click', save);
});
