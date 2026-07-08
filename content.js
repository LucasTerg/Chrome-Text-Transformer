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
      case 'capitalize': transformedText = selectedText.toLowerCase().replace(/(^|[\s\-\(\)\/,])([a-z\u00a1-\u1fff\u2c00-\ud7ff])/g, c => c.toUpperCase()); break;
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
      
      chrome.storage.sync.get(['showTooltips', 'lastResetDate'], (items) => {
        const now = new Date();
        const todayStr = now.toDateString();
        let showTooltips = items.showTooltips !== false; // domyślnie true

        // Logika resetu o 8:00 rano
        if (now.getHours() >= 8 && items.lastResetDate !== todayStr) {
          showTooltips = true;
          chrome.storage.sync.set({ showTooltips: true, lastResetDate: todayStr });
        }

        if (!showTooltips) return;

        if (val.includes('FM070103')) {
          showToast('NIE ZAPOMNIJ!\nEtykieta i karta charakterystyki w języku polskim.\nDodajemy atrybuty Informacje i Termin ważności pozwolenia: Nie dotyczy.', 'warning');
        } 
        else if (val.includes('AD030800')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=1676216201#gid=1676216201';
          showToast(`ℹ️ INFO DLA DEPILATORÓW:\nTyp: Depilator; Marka: PHILIPS; Seria: Lumea 9900 IPL; Model: BRI977/00;\nTechnologia: SenseIQ + Czujnik SmartSkin\n\n✅ Prawidłowa nazwa:\nDepilator PHILIPS Lumea 9900 IPL BRI973/00 SenseIQ Czujnik SmartSkin\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('AD030300')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=1303321896#gid=1303321896';
          showToast(`ℹ️ DEPILATORY TRADYCYJNE:\nTyp: Depilator; Marka: PHILIPS; Seria: 6w1; Model: BRI977/00;\nCzęści ciała: Bikini Nogi Twarz\n\n✅ Prawidłowa nazwa:\nDepilator PHILIPS 6w1 BRI973/00 Bikini\n\n⚠️ UWAGA: Sposób depilacji - zaznaczamy jedynie pęsety, dyski lub folię. Wartość „Głowica” jest nieprawidłowa!\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('FM070112')) {
          showToast('FM070112: Odplamiacze "na końcu do białego 950 ml, do koloru, Uniwersalny"\n\nRodzaj produktu (Odplamiacz do prania) + MARKA + model (np. ProCare/Spring Freshness) + pojemność (w wersji np. 4500 ml) + do białych/kolorowych tkanin + hipoalergiczny/z keratyna/dla niemowląt.', 'success');
        }
        else if (val.includes('AD030201')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=1863629294#gid=1863629294';
          showToast(`ℹ️ AD030201: GOLARKI:\n⚠️ UWAGA: Jeśli golarka jest do głowy musimy zaznaczyć to w nazwie.\nNa końcu nazwy zawsze musi być dopisane: Na mokro i sucho\n\n✅ Przykład:\nGolarka PHILIPS Seria 600 SkinQ S6830/95 Na mokro i sucho\nGolarka do głowy .... analogicznie\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('AD030500')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=1325076563#gid=1325076563';
          showToast(`ℹ️ AD030500: SUSZARKI:\n⚠️ DYSON: Nie wpisujemy kolorów ze zdjęcia! Zapisujemy kolory producenta (np. Patyna-Topaz, Fioletowy Jaspis).\n\n⚡ Na końcu nazwy dodajemy moc [W], np. 1600W.\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('AD031701')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=1735756226#gid=1735756226';
          showToast(`ℹ️ AD031701: MASZYNKI I OSTRZA DO GOLENIA:\nNazwy w tej kategorii: Ostrza do golarki LUB Golarka\n\n✅ Schemat:\n{Typ} + {MARKA} + {SERIA} + {Pozostała zawartość zestawu}\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('DO059905')) {
          const url = 'https://discord.com/channels/1349337217356664914/1359823445080408157/1521766753317683330';
          showToast(`ℹ️ DO059905: Poszewki na poduszki\nnie posiada wyraźnego wzoru, a powierzchnia jest jednokolorowa, należy zastosować wartość „Jednolity”; nie posiada żadnego wykończenia, należy uzupełnić wartość „Bez wykończenia”.\n\nŹródło: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('AD023604')) {
          const url = 'https://discord.com/channels/1349337217356664914/1359823445080408157/1524012577720369224';
          const msg = 'ℹ️ AD023604: Wiaderka do lodu<br>' +
                      '<b>Nazwa:</b> Wiaderko do lodu + MARKA + Model + pojemność<br>' +
                      '<table style="font-size:0.95em;margin-top:4px;border-collapse:collapse;">' +
                      '<tr><td style="padding-right:8px;"><b>Szczypce w zestawie:</b></td><td>Tak/ Nie</td></tr>' +
                      '<tr><td><b>Pojemność [l]:</b></td><td>0.9, 1.7</td></tr>' +
                      '<tr><td><b>Materiał wykonania:</b></td><td>Szkło, Stal nierdzewna</td></tr>' +
                      '<tr><td><b>Kolor dominujący:</b></td><td>Biały, Srebrny</td></tr>' +
                      '<tr><td><b>Pokrywka:</b></td><td>Tak / Nie</td></tr>' +
                      '<tr><td colspan="2"><b>Informacje dodatkowe:</b> Sitko do oddzielania lodu od wody</td></tr>' +
                      '</table>' +
                      '<a href="' + url + '" target="_blank" style="color:#2196F3;text-decoration:underline;pointer-events:auto;display:block;margin-top:4px;">Link do informacji</a>';
          showToast(msg, 'success');
        }
        else if (val.includes('AD023603')) {
          const url = 'https://discord.com/channels/1349337217356664914/1359823445080408157/1524012577720369224';
          const msg = 'ℹ️ AD023603: Organizery kuchenne<br>' +
                      '<b>Nazwa:</b> Organizer + typ organizera + MARKA + model<br>' +
                      '<table style="font-size:0.95em;margin-top:4px;border-collapse:collapse;">' +
                      '<tr><td style="padding-right:8px;"><b>Typ organizera:</b></td><td>Na zlew, na przybory kuchenne, na akcesoria do zmywania</td></tr>' +
                      '<tr><td><b>Kolor dominujący:</b></td><td>Srebrny, czarny, biały</td></tr>' +
                      '<tr><td><b>Materiał wykonania:</b></td><td>Stal nierdzewna, Tworzywo sztuczne</td></tr>' +
                      '<tr><td><b>Rodzaj:</b></td><td>Stojący/wiszący</td></tr>' +
                      '<tr><td><b>Funkcje dodatkowe:</b></td><td>Dozownik na płyn, tacka ociekowa</td></tr>' +
                      '<tr><td><b>Liczba przegródek:</b></td><td>1, 4, 7</td></tr>' +
                      '</table>' +
                      '<a href="' + url + '" target="_blank" style="color:#2196F3;text-decoration:underline;pointer-events:auto;display:block;margin-top:4px;">Link do informacji</a>';
          showToast(msg, 'success');
        }
      });
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
