function normalizeTargetUrl(raw) {
  const input = raw.trim();
  if (!input) return null;

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  if (/^localhost(:\d+)?(\/.*)?$/i.test(input)) {
    return `http://${input}`;
  }

  if (!/\s/.test(input) && /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#:].*)?$/i.test(input)) {
    return `https://${input}`;
  }

  return null;
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== "FLOATING_SEARCH_BAR_SUBMIT") return;

  const query = typeof message.query === "string" ? message.query.trim() : "";
  if (!query) return;

  const directUrl = normalizeTargetUrl(query);
  if (directUrl) {
    chrome.tabs.create({ url: directUrl, active: true });
    return;
  }

  if (chrome.search?.query) {
    chrome.search.query({ text: query, disposition: "NEW_TAB" });
  } else {
    chrome.tabs.create({
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      active: true
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-search-bar") return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || typeof tab.id !== "number") {
      await chrome.tabs.create({ active: true });
      return;
    }

    await chrome.tabs.sendMessage(tab.id, { type: "FLOATING_SEARCH_BAR_TOGGLE" });
  } catch {
    // chrome://extensions gibi korumalı sayfalarda content script çalışmadığı için yeni sekme açar
    await chrome.tabs.create({ active: true });
  }
});