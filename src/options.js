// options.js - save expected model and overlay setting

function $(id) { return document.getElementById(id); }

async function load() {
  const items = await browser.storage.sync.get({ showOverlay: true });
  $('showOverlay').checked = !!items.showOverlay;
}

async function save() {
  const showOverlay = $('showOverlay').checked;
  await browser.storage.sync.set({ showOverlay });
  $('status').textContent = 'Saved';
  setTimeout(() => { $('status').textContent = ''; }, 1200);
}

document.addEventListener('DOMContentLoaded', async () => {
  await load();
  $('save').addEventListener('click', save);
});
