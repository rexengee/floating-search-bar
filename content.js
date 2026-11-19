(() => {
  const HOST_ID = "floating-search-bar-host";
  let isOpen = false;
  let hostEl = null;
  let inputEl = null;
  let previousFocus = null;

  function createOverlay() {
    if (hostEl) return;

    hostEl = document.createElement("div");
    hostEl.id = HOST_ID;
    Object.assign(hostEl.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      display: "none"
    });

    const shadow = hostEl.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.36);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.12s ease-out;
        }

        .bar {
          width: min(640px, 90vw);
          height: 50px;
          background: #232327;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          transform: translateY(-6vh);
          animation: popIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bar:focus-within {
          border-color: rgba(255, 255, 255, 0.24);
        }

        .icon {
          width: 17px;
          height: 17px;
          color: #9ca3af;
          flex-shrink: 0;
        }

        input {
          flex: 1;
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popIn {
          from { opacity: 0; transform: translateY(-6vh) scale(0.98); }
          to { opacity: 1; transform: translateY(-6vh) scale(1); }
        }
      </style>
      <div class="backdrop" id="backdrop">
        <div class="bar" id="bar">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="searchInput" placeholder="Arama yapın veya adres yazın" autocomplete="off" spellcheck="false" />
          <span class="hint">ESC</span>
        </div>
      </div>
    `;

    const backdrop = shadow.getElementById("backdrop");
    const bar = shadow.getElementById("bar");
    inputEl = shadow.getElementById("searchInput");

    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) {
        closeSearch();
      }
    });

    bar.addEventListener("mousedown", (e) => {
      e.stopPropagation();
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
            const query = inputEl.value.trim();
            closeSearch();
            if (query) {
              chrome.runtime.sendMessage({
                type: "FLOATING_SEARCH_BAR_SUBMIT",
                query
              });
            }
            return;
          }
          if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.code === "KeyT") {
            e.preventDefault();
            e.stopPropagation();
            closeSearch();
            return;
          }
        }
        e.stopPropagation();
      });
    });

    (document.body || document.documentElement).appendChild(hostEl);
  }

  function openSearch() {
    createOverlay();
    if (!hostEl.isConnected) {
      (document.body || document.documentElement).appendChild(hostEl);
    }
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    hostEl.style.display = "block";
    inputEl.value = "";
    isOpen = true;

    requestAnimationFrame(() => {
      inputEl.focus();
    });
  }

  function closeSearch() {
    if (!isOpen || !hostEl) return;
    hostEl.style.display = "none";
    inputEl.value = "";
    isOpen = false;
    if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.code === "KeyT") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      } else if (isOpen && e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeSearch();
      }
    },
    true
  );
})();