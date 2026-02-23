if (window.hasTextTransformerLoaded) {
  console.log('[Text-Transformer] Skrypt już był załadowany, przerywam.');
} else {
  window.hasTextTransformerLoaded = true;
  console.log('%c[Text-Transformer] SKRYPT ZAŁADOWANY!', 'background: #222; color: #bada55; font-size: 16px;');

  let currentToast = null;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (!selectedText) return;

    const latinize = (str) => {
      const map = {
        'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
        'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z',
        'ä':'a','ö':'o','ü':'u','ß':'ss','Ä':'A','Ö':'O','Ü':'U'
      };
      return str.replace(/[ąęćłńóśźżĄĘĆŁŃÓŚŹŻäöüßÄÖÜ]/g, m => map[m] || m);
    };

    if (request.action === 'count') {
      showToast(`📊 STATYSTYKI:\nZnaki: ${selectedText.length}\nSłowa: ${selectedText.trim().split(/\s+/).length}`, 'info');
      return;
    }

    if (request.action === 'copy_slug') {
      let slug = latinize(selectedText);
      slug = slug.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
      navigator.clipboard.writeText(slug).then(() => {
        showToast(`📋 SKOPIOWANO SLUG:\n${slug}`, 'success');
      });
      return;
    }

    let transformedText = '';
    switch (request.action) {
      case 'uppercase': transformedText = selectedText.toUpperCase(); break;
      case 'lowercase': transformedText = selectedText.toLowerCase(); break;
      case 'capitalize': transformedText = selectedText.replace(/\b\w/g, c => c.toUpperCase()); break;
      case 'sentence': transformedText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase(); break;
      case 'clean': transformedText = selectedText.replace(/[-"!@\$,]/g, '').replace(/\s+/g, ' '); break;
    }

    if (transformedText) {
      replaceSelectedText(activeElement, transformedText);
    }
  });

  function replaceSelectedText(el, newText) {
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      el.value = el.value.substring(0, start) + newText + el.value.substring(end);
      el.selectionStart = el.selectionEnd = start + newText.length;
      el.focus();
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      document.execCommand('insertText', false, newText);
    }
  }

  // --- LOGIKA POWIADOMIEŃ (TOAST) ---

  function showToast(message, type = 'info') {
    // Jeśli już jest jakiś toast, usuwamy go natychmiast
    if (currentToast) {
      currentToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `text-transformer-toast ${type}`;
    
    // Dodajemy ikonkę w zależności od typu
    let icon = 'ℹ️';
    if (type === 'warning') icon = '⚠️';
    if (type === 'success') icon = '✅';
    
    toast.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${icon} Text Transformer</div>${message}`;
    document.body.appendChild(toast);
    currentToast = toast;

    // Animacja wejścia
    setTimeout(() => toast.classList.add('show'), 10);

    // Czas wyświetlania: ostrzeżenia trzymają się dłużej (10s), info krócej (4s)
    const duration = type === 'warning' ? 10000 : 4000;
    
    setTimeout(() => {
      if (currentToast === toast) {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
      }
    }, duration);
  }

  // Monitorowanie najechania na kody towarów
  document.addEventListener('mouseover', (e) => {
    const el = e.target;
    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.id && el.id.endsWith('-inputEl')) {
      const val = el.value || '';
      if (val.includes('FM070103')) {
        showToast('NIE ZAPOMNIJ!\nEtykieta i karta charakterystyki w języku polskim.\nDodajemy atrybuty Informacje i Termin ważności pozwolenia: Nie dotyczy.', 'warning');
      }
    }
  });

  function showToast(message, type = 'info') {
    if (currentToast) currentToast.remove();
    const toast = document.createElement('div');
    toast.className = `text-transformer-toast ${type}`;
    let icon = type === 'warning' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️');
    toast.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${icon} Text Transformer</div>${message}`;
    document.body.appendChild(toast);
    currentToast = toast;
    setTimeout(() => toast.classList.add('show'), 10);
    const duration = type === 'warning' ? 15000 : 5000; // Ostrzeżenie widoczne 15 sekund
    setTimeout(() => {
      if (currentToast === toast) {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
      }
    }, duration);
  }
}
