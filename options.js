function save_options() {
  const ttsEnabled = document.getElementById('ttsEnabled').checked;
  const showTooltips = document.getElementById('showTooltips').checked;
  chrome.storage.sync.set({ 
    ttsEnabled: ttsEnabled,
    showTooltips: showTooltips
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Zapisano ustawienia.';
    setTimeout(() => { status.textContent = ''; }, 1500);
  });
}

function restore_options() {
  chrome.storage.sync.get({ 
    ttsEnabled: true,
    showTooltips: true
  }, (items) => {
    document.getElementById('ttsEnabled').checked = items.ttsEnabled;
    document.getElementById('showTooltips').checked = items.showTooltips;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('ttsEnabled').addEventListener('change', save_options);
document.getElementById('showTooltips').addEventListener('change', save_options);
