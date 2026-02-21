function save_options() {
  const ttsEnabled = document.getElementById('ttsEnabled').checked;
  chrome.storage.sync.set({ ttsEnabled: ttsEnabled }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Zapisano ustawienia.';
    setTimeout(() => { status.textContent = ''; }, 1500);
  });
}

function restore_options() {
  chrome.storage.sync.get({ ttsEnabled: true }, (items) => {
    document.getElementById('ttsEnabled').checked = items.ttsEnabled;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('ttsEnabled').addEventListener('change', save_options);
