const OPERA_STARTPAGE_URLS = new Set([
  'opera://startpage/',
  'browser://startpage/',
  'chrome://startpage/',
  'chrome://newtab/'
]);

function openStartPageInTab(tabId) {
  if (!tabId) return;
  chrome.tabs.update(tabId, { url: chrome.runtime.getURL('index.html') });
}

chrome.tabs.onCreated.addListener((tab) => {
  if (!tab?.id) return;
  if (!OPERA_STARTPAGE_URLS.has(tab.url || '')) return;
  openStartPageInTab(tab.id);
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  openStartPageInTab(tab.id);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-start-page') return;
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
