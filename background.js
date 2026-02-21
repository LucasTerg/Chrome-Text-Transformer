const TRANSFORM_TYPES = {
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
  SENTENCE: 'sentence',
  CLEAN: 'clean',
  COPY_SLUG: 'copy_slug',
  COUNT: 'count',
  READ: 'read'
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'text-transformer',
      title: 'Transformacja tekstu',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.UPPERCASE,
      parentId: 'text-transformer',
      title: 'DUŻE LITERY ⬆ (⌥⇧D)',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.LOWERCASE,
      parentId: 'text-transformer',
      title: 'małe litery ⬇ (⌥⇧M)',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.CAPITALIZE,
      parentId: 'text-transformer',
      title: 'Jak Nazwy Własne 🔠',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.SENTENCE,
      parentId: 'text-transformer',
      title: 'Zdanie pierwsza duża 📝',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.CLEAN,
      parentId: 'text-transformer',
      title: 'Usuwanie znaków (-"!@$,) ✂️',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.COPY_SLUG,
      parentId: 'text-transformer',
      title: 'Kopiuj: Nazwa-MARKA-model 📋',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'separator1',
      parentId: 'text-transformer',
      type: 'separator',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.COUNT,
      parentId: 'text-transformer',
      title: 'Licz znaki 📊',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: TRANSFORM_TYPES.READ,
      parentId: 'text-transformer',
      title: 'Przeczytaj na głos 🔊',
      contexts: ['selection']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleAction(info.menuItemId, tab);
});

chrome.commands.onCommand.addListener((command) => {
  console.log('[Text-Transformer] Wykryto komendę skrótu:', command);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (command === 'transform_uppercase') handleAction(TRANSFORM_TYPES.UPPERCASE, tab);
    if (command === 'transform_lowercase') handleAction(TRANSFORM_TYPES.LOWERCASE, tab);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('pim.mediaexpert.pl')) {
    injectContentScript(tabId);
  }
});

function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: true },
    files: ['content.js']
  }).catch(err => console.log('[Text-Transformer] Skrypt już wstrzyknięty lub brak uprawnień.'));
}

async function handleAction(actionType, tab) {
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { action: actionType }, (response) => {
    if (chrome.runtime.lastError) {
      injectContentScript(tab.id);
      setTimeout(() => chrome.tabs.sendMessage(tab.id, { action: actionType }), 100);
    }
  });
}
