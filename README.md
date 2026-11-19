# Floating Search Bar

A lightweight Chromium (Manifest V3) extension for **Helium Browser** that opens a centered floating search bar inside the active tab when pressing `Ctrl+T` and opens searches or URLs in a new tab.

## Setup
1. Open Helium **Settings → System → Keyboard shortcuts** and remove the default `Ctrl+T` binding from **New tab**.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select this project folder.

## Features
- **In-Page Centered Search Bar:** Opens cleanly over the active page using an isolated Shadow DOM container.
- **Default Search Engine Integration:** Uses the browser's configured search engine (`chrome.search`) for queries and opens valid URLs directly in a new tab.
- **Shortcut Isolation:** Prevents host webpages from intercepting keystrokes while typing in the search bar.

## License
[MIT](LICENSE)