// background-opera.js
// Opera doesn't support chrome_url_overrides for newtab.
// Instead we watch for new tabs and redirect them to index.html.

const OPERA_NEWTAB_URLS = new Set([
  'opera://startpage/',
  'browser://startpage/',
  'chrome://startpage/',
  'chrome://newtab/',
  ''  // Opera sometimes creates tabs with empty URL
]);

function openStartPage(tabId) {
  if (!tabId) return;
  chrome.tabs.update(tabId, { url: chrome.runtime.getURL('index.html') });
}

// New tab created
chrome.tabs.onCreated.addListener((tab) => {
  if (!tab?.id) return;
  if (!OPERA_NEWTAB_URLS.has(tab.url || '')) return;
  openStartPage(tab.id);
});

// Tab navigated to Opera's startpage
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && OPERA_NEWTAB_URLS.has(changeInfo.url)) {
    openStartPage(tabId);
  }
});

// Toolbar button click
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) openStartPage(tab.id);
});

// Keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-start-page') return;
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});