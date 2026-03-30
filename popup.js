document.addEventListener('DOMContentLoaded', () => {
  const showTooltipsCheckbox = document.getElementById('showTooltips');

  // Wczytaj stan checkboxa
  chrome.storage.sync.get({ showTooltips: true }, (items) => {
    showTooltipsCheckbox.checked = items.showTooltips;
  });

  // Zapisz stan po zmianie
  showTooltipsCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ showTooltips: showTooltipsCheckbox.checked });
  });

  // Obsługa statystyk zaznaczenia
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => window.getSelection().toString()
    }, (selection) => {
      const selectedText = selection[0].result || '';
      const charCount = selectedText.length;
      const wordCount = selectedText.trim() ? selectedText.trim().split(/\s+/).length : 0;
      const lineCount = selectedText.trim() ? selectedText.split(/\r\n|\r|\n/).length : 0;

      document.getElementById('charCount').textContent = charCount;
      document.getElementById('wordCount').textContent = wordCount;
      document.getElementById('lineCount').textContent = lineCount;
    });
  });
});
