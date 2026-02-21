chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0] || !tabs[0].id || tabs[0].url.startsWith('chrome://')) {
    console.warn('Nie można pobrać tekstu ze strony systemowej.');
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => window.getSelection().toString()
  }, (results) => {
    if (chrome.runtime.lastError || !results || !results[0]) {
      console.warn('Błąd pobierania zaznaczenia:', chrome.runtime.lastError?.message);
      return;
    }

    // Używamy trim(), aby usunąć puste znaki i Entery z początku i końca zaznaczenia
    const text = (results[0].result || '').trim();
    
    if (text) {
      document.getElementById('charCount').textContent = text.length;
      document.getElementById('wordCount').textContent = text.split(/\s+/).filter(w => w.length > 0).length;
      
      // Liczymy linie tylko jeśli tekst nie jest pusty, ignorując puste linie na końcu
      const lines = text.split(/\r\n|\r|\n/);
      document.getElementById('lineCount').textContent = lines.length;
    } else {
      document.getElementById('charCount').textContent = '0';
      document.getElementById('wordCount').textContent = '0';
      document.getElementById('lineCount').textContent = '0';
    }
  });
});
