if (window.hasTextTransformerLoaded) {
  console.log('[Text-Transformer] Skrypt już był załadowany, przerywam.');
} else {
  window.hasTextTransformerLoaded = true;
  console.log('%c[Text-Transformer] SKRYPT ZAŁADOWANY!', 'background: #222; color: #bada55; font-size: 16px;');

  let currentToast = null;
  let savedToastPos = 'tc'; // domyślnie góra-środek
  let pauseUntil = 0;
  let savedToastWidth = 218;
  let savedToastHeight = 740;

  chrome.storage.sync.get(['toastPos', 'pauseUntil', 'toastWidth', 'toastHeight'], (items) => {
    if (items.toastPos) savedToastPos = items.toastPos;
    if (items.pauseUntil) pauseUntil = items.pauseUntil;
    if (items.toastWidth) savedToastWidth = items.toastWidth;
    if (items.toastHeight) savedToastHeight = items.toastHeight;
  });

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
        if (pauseUntil && Date.now() < pauseUntil) return;

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
        else if (val.includes('AD031001')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=1046973816#gid=1046973816';
          showToast(`ℹ️ AD031001: SUSZARKO-LOKÓWKI:\n✅ Nazwa: Suszarko-lokówka + MARKA + Seria + Model + średnica końcówek + Moc\n\n⚠️ UWAGA: Proszę o wpisywanie technologii w atrybut "Zastosowane technologie" - nawet, jeśli będzie to tylko technologia jonowa. Jest to atrybut, który znajduje się na listingu.\n\n⚠️ UWAGA: Prośba o pamiętanie o wpisanie końcówek, które znajdują się w zestawie do wyposażenia.\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
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
        else if (val.includes('AD010900')) {
          const url = 'https://discord.com/channels/1349337217356664914/1359823445080408157/1526512917317685378';
          const msg = '<div style="font-size:0.85em;">ℹ️ <b>AD010900: ODKURZACZE AUTOMATYCZNE</b><br>' +
                      '<table style="margin-top:4px;border-collapse:collapse;">' +
                      '<tr><td style="padding-right:8px;vertical-align:top;"><b>Typ elementu czyszczącego:</b></td>' +
                      '<td>wybieramy <i>nie dotyczy</i>, gdy nie jest robotem myjącym (mopującym)</td></tr>' +
                      '<tr><td style="padding-right:8px;vertical-align:top;"><b>Samoczyszczenie stacji:</b></td>' +
                      '<td>Najczęściej obejmuje: automatyczne płukanie mopów po sprzątaniu, usuwanie zabrudzeń z tacy/podstawy, przepłukiwanie kanałów wodnych (w niektórych), przygotowanie stacji do kolejnego cyklu.</td></tr>' +
                      '</table>' +
                      '<a href="' + url + '" target="_blank" style="color:#2196F3;text-decoration:underline;pointer-events:auto;display:block;margin-top:4px;">Link do informacji</a>' +
                      '</div>';
          showToast(msg, 'success');
        }
        else if (val.includes('AD030702')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=39768158#gid=39768158';
          showToast(`ℹ️ AD030702: PROSTOWNICE:\n✅ Nazwa: Prostownica + MARKA + Seria + Model + Maksymalna temperatura\n\n⚠️ UWAGA: Proszę o zwracanie uwagi o jednolitość danych - jeśli w funkcjach zaznaczona jest jonizacja, to w atrybucie "Jonizacja" Musi być zaznaczone: tak\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('AD050107')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=1241151734#gid=1241151734';
          showToast(`ℹ️ AD050107: Elektrostymulatory\n✅ Nazwa: Elektrostymulator + Marka + Model\n\n⚠️ Uwaga!! Produkt jest oznaczany jako medyczny tylko i wyłącznie w momencie, kiedy mamy taką informację ze strony producenta.\nW tym wypadku potrzebujemy następujących danych:\n1. Plik PDF z certyfikatem medycznym - dodajemy jako dokument - rodzaj: certyfikat (nie musi być po polsku)\n2. Numer certyfikatu\n3. Ważność certyfikatu\n4. Podmiot odpowiedzialny (pełna nazwa firmy odpowiedzialnej)\n\nJeśli produkt jest uznawany za medyczny, ale nie ma certyfikatu - zgłaszamy brak danych. Jeśli przez dłuższy czas tego certyfikatu nie uzyskamy - zmieniamy atrybut: "Produkt medyczny" Na NIE i oddajemy do akceptacji.\nW przypadku zaznaczenia Produkt medyczny: Tak - CERTYFIKAT ORAZ POZOSTAŁE ATRYBUTY MUSZĄ BYĆ WYPEŁNIONE.\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'warning');
        }
        else if (val.includes('AD031801')) {
          const url = 'https://docs.google.com/spreadsheets/d/157VQzd5Whh2dDE0uY1YriSMImIG7K2G9lB__NFl1W9Q/edit?gid=649219611#gid=649219611';
          showToast(`ℹ️ AD031801: Maski LED\n✅ Nazwa: Maska LED + części ciała + Marka + Model + Kolor np. Maska LED do twarzy OXY Theraface Zielony\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'success');
        }
        else if (val.includes('FM010807')) {
          const url = 'https://docs.google.com/spreadsheets/d/1gvZwJ7vz2PjFsgPGaNfGfvsWleVkWO9C/edit?gid=1610727100#gid=1610727100';
          showToast(`ℹ️ FM010807: Pozostałe suplementy diety\nSkładniki wyłącznie z etykiety, którą dostaniemy, brak etykiety czekamy - wysyłamy produkt na braki. Wielkość porcji (Podstawowe informacje (FM010807), SUPLEMENTY I ODŻYWIANIE) Podajemy na cały dzień //Atrybut\n\nArkusze: <a href="${url}" target="_blank" style="color: #2196F3; text-decoration: underline; pointer-events: auto;">Link</a>`, 'warning');
        }
        else if (val.includes('AD040512')) {
          showToast(`ℹ️ AD040512: Deski do krojenia\nNazwa: Deska do krojenia LAMART Model (30 x 22 cm) Drewniany + Nóż (pierwsza jest podawana długość i tak ma też być w atrybucie)`, 'success');
        }
        else if (val.includes('AZ120603')) {
          showToast(`ℹ️ AZ120603: Akcesoria do zlewozmywaków baterii kuchennych\nNazwa: Deska do zlewozmywaków + MARKA + Model (wymiary) - najpierw długość, podajemy Typ: Deska do krojenia`, 'success');
        }
        else if (val.includes('FM010803')) {
          const rcText = '<br><strong>UWAGA!</strong> Nie należy przekraczać zalecanej dziennej dawki. Preparat nie jest przeznaczony dla dzieci, kobiet w ciąży i karmiących piersią. Przed spożyciem zapoznaj się z etykietą z tyłu opakowania.';
          const copyFn = `navigator.clipboard.writeText('${rcText}')`;
          const msg = `<div style="font-size:0.85em; line-height:1.3;">
            ℹ️ <b>FM010803: Odżywki białkowe</b><br>
            Dopisujemy do Opisu RC (multimedialnego):<br>
            <div style="background:rgba(0,0,0,0.05); padding:5px; margin:5px 0; border-radius:3px; border:1px solid rgba(0,0,0,0.1);">
              &lt;br&gt;&lt;strong&gt;UWAGA!&lt;/strong&gt; Nie należy przekraczać zalecanej dziennej dawki. Preparat nie jest przeznaczony dla dzieci, kobiet w ciąży i karmiących piersią. Przed spożyciem zapoznaj się z etykietą z tyłu opakowania.
            </div>
            <button onclick="${copyFn}" style="margin-bottom:8px; padding:4px 8px; cursor:pointer; background:#4CAF50; color:white; border:none; border-radius:4px; font-size:1em; pointer-events:auto;">📋 Skopiuj kod HTML</button><br>
            ⚠️ <b>Pamiętaj:</b> Takich rzeczy już <b>nie</b> dopisujemy: <i>"Wyprodukowano w zakładzie przetwarzającym mleko, jaja, ....."</i>
          </div>`;
          showToast(msg, 'success');
        }
        else if (val.includes('FM070111')) {
          const url = 'https://discord.com/channels/1349337217356664914/1359823445080408157/1409856241567797270';
          const msg = '<div style="font-size:0.9em; line-height:1.4;">ℹ️ <b>FM070111: Żele do prania</b><br>Na końcu nazwy wpisujemy jak w proszkach do prania:<br>✅ <i>Rodzaj produktu (Proszek do prania) + MARKA + model (np. ProCare/Spring Freshness) + pojemność (w wersji np. 4500 ml) + do białych/kolorowych tkanin + hipoalergiczny/z keratyna/dla niemowląt</i><br><br><a href="' + url + '" target="_blank" style="color:#2196F3;text-decoration:underline;pointer-events:auto;">Źródło (Discord)</a></div>';
          showToast(msg, 'success');
        }
      });
    }
  });

  function showToast(message, type = 'info') {
    if (currentToast) currentToast.remove();

    const toast = document.createElement('div');
    // Od razu przypinamy z zapisaną pozycją
    toast.className = `text-transformer-toast ${type} show pinned pos-${savedToastPos}`;

    // Przyciski do przypinania i zamykania
    const layoutControls = `
      <div style="position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 8px; z-index: 10; align-items: center;">
        <div class="toast-close-btn" title="Zamknij powiadomienie" style="background: #666; color: #eee; border-radius: 4px; padding: 2px 0; cursor: pointer; font-size: 11px; border: 1px solid #888; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3); text-align: center; width: 34px;">✖</div>
        <div class="toast-snooze-btn" title="Wyłącz powiadomienia na 15 minut" style="background: #666; color: #eee; border-radius: 4px; padding: 2px 0; cursor: pointer; font-size: 11px; border: 1px solid #888; font-weight: normal; box-shadow: 0 2px 4px rgba(0,0,0,0.3); text-align: center; width: 34px;">⏳</div>
        <div class="toast-layout-controls" style="display: grid; grid-template-columns: repeat(3, 10px); gap: 2px; opacity: 0.5;">
          <div class="pos-btn" data-pos="tl" title="Góra Lewa"></div>
          <div class="pos-btn" data-pos="tc" title="Góra Środek"></div>
          <div class="pos-btn" data-pos="tr" title="Góra Prawa"></div>
          <div class="pos-btn" data-pos="cl" title="Środek Lewa"></div>
          <div class="pos-btn" style="visibility:hidden"></div>
          <div class="pos-btn" data-pos="cr" title="Środek Prawa"></div>
          <div class="pos-btn" data-pos="bl" title="Dół Lewa"></div>
          <div class="pos-btn" data-pos="bc" title="Dół Środek"></div>
          <div class="pos-btn" data-pos="br" title="Dół Prawa"></div>
        </div>
      </div>
    `;

    toast.innerHTML = layoutControls + `<div class="toast-content" style="padding-right: 42px;">${message}</div>`;
    
    // Ustawienie domyślnych/zapisanych rozmiarów
    toast.style.width = `${savedToastWidth}px`;
    toast.style.height = `${savedToastHeight}px`;

    document.body.appendChild(toast);
    currentToast = toast;

    // Obserwowanie zmian rozmiaru okienka (resize) i zapisywanie do pamięci
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!currentToast) return;
        const newW = toast.offsetWidth;
        const newH = toast.offsetHeight;
        if (newW > 0 && newH > 0 && (newW !== savedToastWidth || newH !== savedToastHeight)) {
          savedToastWidth = newW;
          savedToastHeight = newH;
          chrome.storage.sync.set({ toastWidth: newW, toastHeight: newH });
        }
      }, 500);
    });
    resizeObserver.observe(toast);

    // Logika przycisków pozycji
    const btns = toast.querySelectorAll('.pos-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        savedToastPos = btn.dataset.pos;
        chrome.storage.sync.set({ toastPos: savedToastPos });
        toast.className = `text-transformer-toast ${type} show pinned pos-${savedToastPos}`;
      });
    });

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      toast.remove();
      currentToast = null;
    });
    
    toast.querySelector('.toast-snooze-btn').addEventListener('click', () => {
      pauseUntil = Date.now() + 15 * 60 * 1000;
      chrome.storage.sync.set({ pauseUntil: pauseUntil }, () => {
        toast.remove();
        currentToast = null;
      });
    });
  }
}
