// focus-grab.js
// Uses a URL hash flag to break the create+remove loop.
// First load: no hash → do create+remove with #focused appended.
// Second load: #focused present → strip it and stop.

(function () {
  const IS_FIREFOX = typeof browser !== 'undefined' && !!browser.runtime;
  if (!IS_FIREFOX) return;

  if (window.location.hash === '#focused') {
    // We're the replacement tab — strip the hash and do nothing else
    history.replaceState(null, '', window.location.pathname);
    return;
  }

  // First load — do the create+remove trick
  browser.tabs.getCurrent(function (tab) {
    if (!tab) return;
    const oldId = tab.id;
    const url = browser.runtime.getURL('index.html') + '#focused';
    browser.tabs.create({ url: url }, function () {
      browser.tabs.remove(oldId);
    });
  });
})();