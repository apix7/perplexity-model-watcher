// options.js - save expected model and overlay setting

function $(id){ return document.getElementById(id); }

function load() {
  chrome.storage.sync.get({ showOverlay: true }, (items) => {
    $('showOverlay').checked = !!items.showOverlay;
  });
}

function save() {
  const showOverlay = $('showOverlay').checked;
  chrome.storage.sync.set({ showOverlay }, () => {
    $('status').textContent = 'Saved';
    setTimeout(() => ($('status').textContent = ''), 1200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  $('save').addEventListener('click', save);
});
