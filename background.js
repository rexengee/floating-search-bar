const NEW_TAB_PATTERN =
  /^(?:(?:chrome|helium|edge|brave|vivaldi):\/\/new-?tab(?:-page)?\/?|chrome-search:\/\/local-ntp\/?|about:(?:blank|newtab))$/i;

function isNewTab(tab) {
  const url = (tab?.url || tab?.pendingUrl || "").trim();
  if (!url) return false;
  return NEW_TAB_PATTERN.test(url);
}

function isInjectableUrl(url) {
  return /^(?:https?|file):\/\//i.test(url || "");
}

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

async function focusOrCreateNewTab(currentTab) {
  if (isNewTab(currentTab)) return;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const existingNewTab = tabs.find((t) => typeof t.id === "number" && isNewTab(t));

  if (existingNewTab) {
    await chrome.tabs.update(existingNewTab.id, { active: true });
    return;
  }

  await chrome.tabs.create({ active: true });
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

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || typeof tab.id !== "number") {
    await chrome.tabs.create({ active: true });
    return;
  }

  if (isNewTab(tab)) return;

  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "FLOATING_SEARCH_BAR_TOGGLE" });
    if (res?.ok) return;
  } catch {
    // Sekmede content.js henüz yüklü değilse aşağıda enjeksiyon denenir
  }

  if (isInjectableUrl(tab.url)) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      const res = await chrome.tabs.sendMessage(tab.id, { type: "FLOATING_SEARCH_BAR_TOGGLE" });
      if (res?.ok) return;
    } catch {
      // Mağaza sayfası gibi enjeksiyona kapalı https sayfalarında yeni sekme yedeğine geç
    }
  }

  await focusOrCreateNewTab(tab);
});