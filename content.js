(() => {
  if (window.__FLOATING_SEARCH_BAR_LOADED__) return;
  window.__FLOATING_SEARCH_BAR_LOADED__ = true;

  const HOST_ID = "floating-search-bar-host";
  let isOpen = false;
  let hostEl = null;
  let inputEl = null;
  let previousFocus = null;

  function submitSearch() {
    if (!inputEl) return;
    const query = inputEl.value.trim();
    if (!query) {
      inputEl.focus();
      return;
    }
    closeSearch();
    chrome.runtime.sendMessage({
      type: "FLOATING_SEARCH_BAR_SUBMIT",
      query
    });
  }

  function handleOutsideMouseDown(e) {
    if (!isOpen || !hostEl) return;
    if (!hostEl.contains(e.target)) {
      closeSearch();
    }
  }

  function createBar() {
    if (hostEl) return;

    hostEl = document.createElement("div");
    hostEl.id = HOST_ID;
    Object.assign(hostEl.style, {
      position: "fixed",
      top: "40%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "2147483647",
      display: "none"
    });

    const shadow = hostEl.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        .bar {
          width: min(640px, 90vw);
          height: 50px;
          background: #232327;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.48);
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 10px;
          animation: popIn 0.1s ease-out;
        }

        .bar:focus-within {
          border-color: rgba(255, 255, 255, 0.28);
        }

        .search-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.12s ease, background 0.12s ease;
        }

        .search-btn:hover {
          color: #f3f4f6;
          background: rgba(255, 255, 255, 0.08);
        }

        .icon {
          width: 17px;
          height: 17px;
          pointer-events: none;
        }

        input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          color: #f3f4f6;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 15px;
          line-height: 1.4;
          caret-color: #60a5fa;
        }

        input::placeholder {
          color: #8e929b;
        }

        .hint {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11px;
          color: #6b7280;
          padding: 2px 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          user-select: none;
          flex-shrink: 0;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div class="bar" id="bar">
        <button type="button" class="search-btn" id="searchBtn" title="Ara">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <input type="text" id="searchInput" placeholder="Arama yapın veya adres yazın" autocomplete="off" spellcheck="false" />
        <span class="hint">ESC</span>
      </div>
    `;

    const searchBtn = shadow.getElementById("searchBtn");
    inputEl = shadow.getElementById("searchInput");

    searchBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    searchBtn.addEventListener("click", () => {
      submitSearch();
    });

    ["keydown", "keyup", "keypress"].forEach((evtName) => {
      inputEl.addEventListener(evtName, (e) => {
        if (evtName === "keydown") {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            closeSearch();
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            submitSearch();
            return;
          }
        }
        e.stopPropagation();
      });
    });

    (document.body || document.documentElement).appendChild(hostEl);
  }

  function openSearch() {
    createBar();
    if (!hostEl.isConnected) {
      (document.body || document.documentElement).appendChild(hostEl);
    }
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    hostEl.style.display = "block";
    inputEl.value = "";
    isOpen = true;

    document.addEventListener("mousedown", handleOutsideMouseDown, true);
    requestAnimationFrame(() => {
      inputEl.focus();
    });
  }

  function closeSearch() {
    if (!isOpen || !hostEl) return;
    hostEl.style.display = "none";
    inputEl.value = "";
    isOpen = false;

    document.removeEventListener("mousedown", handleOutsideMouseDown, true);
    if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function toggleSearch() {
    if (isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "FLOATING_SEARCH_BAR_TOGGLE") {
      toggleSearch();
      sendResponse({ ok: true });
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (isOpen && e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeSearch();
      }
    },
    true
  );
})();