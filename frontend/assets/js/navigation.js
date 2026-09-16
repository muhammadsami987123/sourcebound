/**
 * navigation.js — the single, shared application shell: sidebar, top
 * header, page title, breadcrumb, backend status and global search.
 * Every page calls Nav.render(options) once on load; there is no other nav
 * implementation.
 *
 * This file also owns the reusable, client-side search core (window.Search)
 * consumed both by the header command palette below and by search.html /
 * search.js (the full-page counterpart). There is no backend search
 * endpoint — everything here is computed over Api.listSources().
 */
(function (global) {
  "use strict";

  const UI = global.UI;
  const SIDEBAR_KEY = "sourcebound:sidebar";
  const RECENT_SEARCH_KEY = "sourcebound:recent-searches";
  const MAX_RECENT = 6;

  // Only destinations that actually exist ship as real links. Every other
  // idea from the IA brief (Documents/Websites/Collections, Activity,
  // History, Analytics, AI & Retrieval settings, Integrations, Profile,
  // Help) has no backend endpoint or page behind it, so it is rendered as a
  // disabled, clearly-labelled "Coming soon" row instead of a dead link.
  const NAV_GROUPS = [
    {
      label: "Workspace",
      items: [
        { key: "dashboard", label: "Overview", href: "app.html", icon: "home" },
        { key: "chat", label: "Chat", href: "chat.html", icon: "chat" },
        { key: "sources", label: "Sources", href: "sources.html", icon: "layers" },
        { key: "search", label: "Search", href: "search.html", icon: "search" },
      ],
    },
    {
      label: "Management",
      items: [
        { key: "activity", label: "Activity & indexing", icon: "activity", disabled: true },
        { key: "analytics", label: "Analytics", icon: "chart", disabled: true },
      ],
    },
    {
      label: "Configuration",
      items: [
        { key: "settings", label: "Settings", href: "settings.html", icon: "settings" },
        { key: "retrieval", label: "AI & retrieval settings", icon: "sliders", disabled: true },
        { key: "integrations", label: "Integrations", icon: "plug", disabled: true },
      ],
    },
    {
      label: "Account",
      items: [
        { key: "profile", label: "Profile", icon: "user", disabled: true },
        { key: "help", label: "Help & documentation", icon: "help", disabled: true },
      ],
    },
  ];

  const NAV_ITEMS = NAV_GROUPS.reduce((acc, g) => acc.concat(g.items), []);

  function getSidebarPref() {
    try {
      return localStorage.getItem(SIDEBAR_KEY) || "expanded";
    } catch (err) {
      return "expanded";
    }
  }

  function setSidebarPref(value) {
    try {
      localStorage.setItem(SIDEBAR_KEY, value);
    } catch (err) {
      /* storage unavailable */
    }
  }

  /* ================= Sidebar ================= */

  function buildNavLink(item, active) {
    const isActive = active === item.key;

    if (item.disabled) {
      return UI.el("div", {
        class: "nav-link nav-link-disabled",
        "aria-disabled": "true",
        role: "link",
        tabindex: "-1",
        title: `${item.label} — coming soon`,
      }, [
        UI.el("span", { class: "nav-link-icon" }, [UI.icon(item.icon)]),
        UI.el("span", { class: "sidebar-label nav-link-label flex-1 min-w-0 truncate" }, [item.label]),
        UI.el("span", { class: "sidebar-label badge shrink-0 text-[10px] px-1.5 py-0.5" }, ["Soon"]),
        UI.el("span", { class: "nav-tooltip" }, [`${item.label} — coming soon`]),
      ]);
    }

    return UI.el("a", {
      href: item.href,
      class: `nav-link ${isActive ? "is-active" : ""}`,
      "aria-current": isActive ? "page" : undefined,
    }, [
      UI.el("span", { class: "nav-link-icon" }, [UI.icon(item.icon)]),
      UI.el("span", { class: "sidebar-label nav-link-label min-w-0 truncate" }, [item.label]),
      UI.el("span", { class: "nav-tooltip" }, [item.label]),
    ]);
  }

  function buildSidebar(active) {
    const groups = NAV_GROUPS.map((group) =>
      UI.el("div", { class: "sidebar-group" }, [
        UI.el("p", { class: "sidebar-group-label sidebar-label" }, [group.label]),
        UI.el("div", { class: "flex flex-col gap-0.5" }, group.items.map((item) => buildNavLink(item, active))),
      ])
    );

    const closeBtn = UI.el("button", {
      class: "icon-btn sidebar-close-btn flex-none",
      type: "button",
      "aria-label": "Close sidebar",
      title: "Close sidebar",
    }, [UI.icon("close")]);

    const collapseBtn = UI.el("button", {
      class: "icon-btn sidebar-collapse-btn flex-none hidden lg:inline-flex",
      type: "button",
      "aria-label": "Collapse sidebar",
      title: "Collapse sidebar",
    }, [UI.icon("chevronRight", "sidebar-collapse-icon")]);

    const brand = UI.el("a", { href: "app.html", class: "flex items-center gap-2.5 min-w-0" }, [
      UI.el("span", { class: "brand-mark w-9 h-9 text-base flex-none" }, ["S"]),
      UI.el("span", { class: "sidebar-label min-w-0" }, [
        UI.el("span", { class: "font-display font-semibold text-[15px] leading-tight block truncate" }, ["Sourcebound"]),
        UI.el("span", { class: "text-[11px] text-faint leading-tight block truncate" }, ["Grounded answers"]),
      ]),
    ]);

    const header = UI.el("div", { class: "sidebar-header flex items-center justify-between gap-2 mb-5" }, [
      brand,
      UI.el("div", { class: "flex items-center gap-1 flex-none" }, [collapseBtn, closeBtn]),
    ]);

    const addSourceBtn = UI.el("a", {
      href: "sources.html#add-source",
      class: "btn btn-primary btn-sm w-full justify-center gap-2 mb-5",
      title: "Add source",
    }, [UI.icon("plus"), UI.el("span", { class: "sidebar-label" }, ["Add source"])]);

    const profileLink = UI.el("a", {
      href: "settings.html",
      class: `profile-chip ${active === "settings" ? "is-active" : ""}`,
      title: "Settings & workspace",
    }, [
      UI.el("span", { class: "profile-avatar" }, [UI.icon("user")]),
      UI.el("span", { class: "sidebar-label min-w-0 flex-1" }, [
        UI.el("span", { class: "block text-sm font-semibold truncate" }, ["Local workspace"]),
        UI.el("span", { class: "block text-[11px] text-faint truncate" }, ["Preferences & status"]),
      ]),
      UI.el("span", { class: "nav-tooltip" }, ["Settings & workspace"]),
    ]);

    const sidebar = UI.el("div", { class: "flex flex-col h-full" }, [
      header,
      addSourceBtn,
      UI.el("nav", { class: "flex flex-col gap-4 flex-1 overflow-y-auto pr-0.5", "aria-label": "Primary" }, groups),
      UI.el("div", { class: "border-t border-subtle pt-3 mt-3" }, [profileLink]),
    ]);

    return { node: sidebar, closeBtn, collapseBtn, addSourceBtn };
  }

  function buildBreadcrumb(breadcrumb, title) {
    const items = breadcrumb && breadcrumb.length ? breadcrumb : [{ label: title }];
    const nodes = [];
    items.forEach((item, index) => {
      if (index > 0) nodes.push(UI.el("span", { class: "text-faint" }, [UI.icon("chevronRight")]));
      nodes.push(
        item.href
          ? UI.el("a", { href: item.href, class: "text-muted hover:text-[var(--brand-600)]" }, [item.label])
          : UI.el("span", { class: "text-[var(--ink-900)] font-medium" }, [item.label])
      );
    });
    return UI.el("div", { class: "flex items-center gap-1.5 text-xs" }, nodes);
  }

  function currentTheme() {
    try {
      const raw = JSON.parse(localStorage.getItem("sourcebound:settings") || "{}");
      return raw.theme || "system";
    } catch (err) {
      return "system";
    }
  }

  function buildThemeToggle() {
    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark" ||
      (currentTheme() === "system" && global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches);

    const btn = UI.el("button", {
      class: "icon-btn flex-none",
      type: "button",
      onclick: () => {
        const next = isDark() ? "light" : "dark";
        if (global.App && global.App.saveSettings) global.App.saveSettings({ theme: next });
        render_icon();
      },
    }, []);

    function render_icon() {
      const dark = isDark();
      // Name the action, not the current state — "Toggle color theme" leaves a
      // screen reader user guessing which way it will go.
      const label = dark ? "Switch to light theme" : "Switch to dark theme";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.innerHTML = "";
      btn.appendChild(UI.icon(dark ? "sun" : "moon"));
    }
    render_icon();

    // While the preference is "system" the root carries no data-theme attribute,
    // so nothing else notices the OS flipping light/dark. Keep the icon honest.
    if (global.matchMedia) {
      const mq = global.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => { if (currentTheme() === "system") render_icon(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    return btn;
  }

  function buildSearchTrigger() {
    const btn = UI.el("button", {
      class: "icon-btn md:hidden flex-none",
      type: "button",
      "aria-label": "Search (Ctrl/Cmd+K)",
      title: "Search",
      onclick: () => global.Search && global.Search.openPalette(),
    }, [UI.icon("search")]);

    const wide = UI.el("button", {
      class: "hidden md:flex items-center gap-2 px-3 h-11 rounded-[0.7rem] border border-subtle bg-sunken text-muted text-sm min-w-[220px] max-w-xs flex-1 touch-manipulation",
      type: "button",
      "aria-label": "Search (Ctrl/Cmd+K)",
      onclick: () => global.Search && global.Search.openPalette(),
    }, [
      UI.icon("search"),
      UI.el("span", { class: "flex-1 text-left truncate" }, ["Search sources…"]),
      UI.el("span", { class: "kbd" }, [navigator.platform && /Mac/.test(navigator.platform) ? "⌘K" : "Ctrl K"]),
    ]);

    return { compact: btn, wide };
  }

  function buildTopbar({ active, title, description, breadcrumb, onToggleSidebar, onOpenSidebar }) {
    const searchTriggers = buildSearchTrigger();
    return UI.el("div", { class: "flex items-center justify-between gap-3 px-4 md:px-8 py-4" }, [
      UI.el("div", { class: "flex items-center gap-3 min-w-0 flex-none" }, [
        UI.el("button", {
          class: "icon-btn lg:hidden flex-none",
          "aria-label": "Toggle navigation menu",
          onclick: onToggleSidebar,
        }, [UI.icon("menu")]),
        UI.el("button", {
          class: "icon-btn hidden lg:inline-flex flex-none sidebar-open-btn",
          "aria-label": "Show sidebar",
          title: "Show sidebar",
          onclick: onOpenSidebar,
        }, [UI.icon("menu")]),
        UI.el("div", { class: "min-w-0" }, [
          buildBreadcrumb(breadcrumb, title),
          UI.el("h1", { class: "font-display text-xl font-semibold mt-0.5 truncate" }, [title || ""]),
          description ? UI.el("p", { class: "text-sm text-muted mt-0.5 truncate hidden sm:block" }, [description]) : null,
        ]),
      ]),
      searchTriggers.wide,
      UI.el("div", { class: "flex items-center gap-2 flex-none" }, [
        searchTriggers.compact,
        UI.el("div", { id: "topbar-status", class: "hidden sm:flex items-center gap-2 text-xs text-muted flex-none status-chip" }),
        buildThemeToggle(),
      ]),
    ]);
  }

  /* ================= Mobile drawer focus trap ================= */

  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  function render(options) {
    const { active, title, description, breadcrumb } = options;
    const sidebarRoot = document.getElementById("sidebar-root");
    const topbarRoot = document.getElementById("topbar-root");
    document.title = title ? `${title} · Sourcebound` : "Sourcebound";

    let closeBtn, collapseBtn, addSourceBtn;
    let triggerBeforeOpen = null;
    let trapHandler = null;

    if (sidebarRoot) {
      sidebarRoot.className = "app-sidebar fixed inset-y-0 left-0 z-40 w-64 p-5 -translate-x-full transition-all duration-200 lg:translate-x-0 lg:static lg:z-auto";
      sidebarRoot.innerHTML = "";
      sidebarRoot.setAttribute("role", "navigation");
      sidebarRoot.setAttribute("aria-label", "Sidebar");
      const built = buildSidebar(active);
      sidebarRoot.appendChild(built.node);
      closeBtn = built.closeBtn;
      collapseBtn = built.collapseBtn;
      addSourceBtn = built.addSourceBtn;
    }

    let overlay = document.getElementById("sidebar-overlay");
    if (!overlay) {
      overlay = UI.el("div", { id: "sidebar-overlay", class: "fixed inset-0 bg-black/30 backdrop-blur-[1px] z-30 hidden lg:hidden" });
      document.body.appendChild(overlay);
    }

    function trapFocus(event) {
      if (event.key !== "Tab") return;
      const focusable = getFocusable(sidebarRoot);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function closeMobileSidebar() {
      sidebarRoot.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
      if (trapHandler) {
        sidebarRoot.removeEventListener("keydown", trapHandler);
        trapHandler = null;
      }
      if (triggerBeforeOpen && typeof triggerBeforeOpen.focus === "function") {
        triggerBeforeOpen.focus();
      }
      triggerBeforeOpen = null;
    }

    function openMobileSidebar() {
      triggerBeforeOpen = document.activeElement;
      sidebarRoot.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
      trapHandler = trapFocus;
      sidebarRoot.addEventListener("keydown", trapHandler);
      const focusable = getFocusable(sidebarRoot);
      if (focusable.length) focusable[0].focus();
    }

    function toggleMobileSidebar() {
      const isOpen = !sidebarRoot.classList.contains("-translate-x-full");
      if (isOpen) closeMobileSidebar();
      else openMobileSidebar();
    }
    overlay.onclick = closeMobileSidebar;
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (window.innerWidth < 1024) {
          closeMobileSidebar();
        } else {
          setSidebarPref("closed");
          applyDesktopState("closed");
        }
      };
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !sidebarRoot.classList.contains("-translate-x-full") && window.innerWidth < 1024) {
        closeMobileSidebar();
      }
    });

    /* ---- desktop collapse / hide ---- */
    const openBtnSelector = () => document.querySelector(".sidebar-open-btn");

    function applyDesktopState(state) {
      sidebarRoot.classList.remove("is-collapsed", "is-hidden-desktop");
      const openBtn = openBtnSelector();
      if (state === "collapsed") {
        sidebarRoot.classList.add("is-collapsed");
        if (openBtn) openBtn.classList.add("hidden");
      } else if (state === "closed") {
        sidebarRoot.classList.add("is-hidden-desktop");
        if (openBtn) openBtn.classList.remove("hidden");
      } else if (openBtn) {
        openBtn.classList.add("hidden");
      }
    }

    const initialState = getSidebarPref();
    applyDesktopState(initialState);

    if (collapseBtn) {
      collapseBtn.onclick = () => {
        const collapsed = sidebarRoot.classList.contains("is-collapsed");
        const next = collapsed ? "expanded" : "collapsed";
        setSidebarPref(next);
        applyDesktopState(next);
      };
    }

    if (topbarRoot) {
      topbarRoot.className = "app-topbar sticky top-0 z-20";
      topbarRoot.innerHTML = "";
      topbarRoot.appendChild(
        buildTopbar({
          active,
          title,
          description,
          breadcrumb,
          onToggleSidebar: toggleMobileSidebar,
          onOpenSidebar: () => {
            setSidebarPref("expanded");
            applyDesktopState("expanded");
          },
        })
      );
    }

    refreshBackendStatus();
    if (global.Search) global.Search.initGlobalShortcuts();
  }

  async function refreshBackendStatus() {
    const slot = document.getElementById("topbar-status");
    if (!slot) return;
    slot.classList.remove("status-chip-ok", "status-chip-error");
    slot.innerHTML = "";
    slot.appendChild(UI.el("span", { class: "w-2 h-2 rounded-full bg-[var(--ink-300)] animate-pulse" }));
    slot.appendChild(UI.el("span", {}, ["Checking backend…"]));
    try {
      await global.Api.health();
      slot.innerHTML = "";
      slot.classList.add("status-chip-ok");
      slot.appendChild(UI.el("span", { class: "w-2 h-2 rounded-full bg-[var(--success-600)]" }));
      slot.appendChild(UI.el("span", {}, ["Backend connected"]));
    } catch (err) {
      slot.innerHTML = "";
      slot.classList.add("status-chip-error");
      slot.appendChild(UI.el("span", { class: "w-2 h-2 rounded-full bg-[var(--error-600)]" }));
      slot.appendChild(UI.el("span", {}, ["Backend unreachable"]));
    }
  }

  global.Nav = { render, refreshBackendStatus, NAV_ITEMS, NAV_GROUPS };

  /* =========================================================================
   * Search core — shared by the header command palette and search.html.
   * No backend search endpoint exists; results come only from
   * Api.listSources() (title/type/status match) and, when the caller drills
   * into one source, Api.getChunks(id) (text match within that source).
   * ========================================================================= */

  function getRecent() {
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      return [];
    }
  }

  function addRecent(term) {
    const trimmed = (term || "").trim();
    if (!trimmed) return;
    try {
      const list = getRecent().filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
      list.unshift(trimmed);
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
    } catch (err) {
      /* storage unavailable */
    }
  }

  function clearRecent() {
    try {
      localStorage.removeItem(RECENT_SEARCH_KEY);
    } catch (err) {
      /* storage unavailable */
    }
  }

  // Matches a query against one source's real, retrieved metadata only.
  function matchSource(source, query) {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const title = (source.title || "").toLowerCase();
    const type = (source.type || "").toLowerCase();
    const status = (source.status || "").toLowerCase();
    const url = (source.url || source.source_url || "").toLowerCase();
    let field = null;
    if (title.includes(q)) field = "title";
    else if (url && url.includes(q)) field = "url";
    else if (type.includes(q)) field = "type";
    else if (status.includes(q)) field = "status";
    if (!field) return null;
    return { kind: "source", source, field };
  }

  async function searchSources(query) {
    const q = (query || "").trim();
    if (!q) return [];
    const res = await global.Api.listSources();
    const sources = (res && res.sources) || [];
    const matches = [];
    sources.forEach((source) => {
      const m = matchSource(source, q);
      if (m) matches.push(m);
    });
    return matches;
  }

  // Only called when the caller has a specific source in scope (task.md:
  // "when drilling into a source"). Returns real chunk matches only.
  async function searchChunks(sourceId, query) {
    const q = (query || "").trim().toLowerCase();
    if (!q || !sourceId) return [];
    const res = await global.Api.getChunks(sourceId);
    const chunks = (res && res.chunks) || [];
    return chunks
      .filter((c) => (c.text || "").toLowerCase().includes(q))
      .map((c) => ({ kind: "chunk", chunk: c }));
  }

  /* ---- header command palette ---- */

  let paletteState = null; // { node, close, input, listEl, results, activeIndex, triggerEl }

  function excerptAround(text, query, radius) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, radius * 2);
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + query.length + radius);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  function buildResultRow(result, query, index, isActive) {
    if (result.kind === "source") {
      const meta = UI.sourceTypeMeta ? UI.sourceTypeMeta(result.source.type) : { icon: "file" };
      return UI.el("li", {
        role: "option",
        id: `cmdk-item-${index}`,
        "aria-selected": isActive ? "true" : "false",
        class: `cmdk-item ${isActive ? "cmdk-item-active" : ""}`,
        "data-index": String(index),
      }, [
        UI.el("span", { class: "flex items-center justify-center flex-none" }, [UI.icon(meta.icon || "file")]),
        UI.el("span", { class: "min-w-0 flex-1" }, [
          UI.el("span", { class: "block text-sm font-medium truncate" }, [result.source.title || "Untitled source"]),
          UI.el("span", { class: "block text-xs text-faint truncate" }, [`Matched ${result.field} · ${result.source.status || ""}`]),
        ]),
        UI.el("span", { class: "text-faint flex-none" }, [UI.icon("arrowRight")]),
      ]);
    }
    const excerpt = excerptAround(result.chunk.text || "", query, 40);
    return UI.el("li", {
      role: "option",
      id: `cmdk-item-${index}`,
      "aria-selected": isActive ? "true" : "false",
      class: `cmdk-item ${isActive ? "cmdk-item-active" : ""}`,
      "data-index": String(index),
    }, [
      UI.el("span", { class: "flex items-center justify-center flex-none" }, [UI.icon("fileText")]),
      UI.el("span", { class: "min-w-0 flex-1" }, [
        UI.el("span", { class: "block text-xs text-faint mb-0.5" }, [`Chunk #${result.chunk.chunk_index}`]),
        UI.el("span", { class: "block text-sm truncate" }, [excerpt]),
      ]),
    ]);
  }

  function resultHref(result) {
    if (result.kind === "source") return `chat.html?source=${encodeURIComponent(result.source.id)}`;
    return `chat.html?source=${encodeURIComponent(result.chunk.source_id)}`;
  }

  function openPalette() {
    if (paletteState) return;
    const triggerEl = document.activeElement;

    const input = UI.el("input", {
      type: "text",
      class: "cmdk-input",
      placeholder: "Search sources by title, type or status…",
      "aria-label": "Search",
      "aria-autocomplete": "list",
      "aria-controls": "cmdk-listbox",
      role: "combobox",
      "aria-expanded": "true",
    });

    const listEl = UI.el("ul", { id: "cmdk-listbox", class: "cmdk-list", role: "listbox" });

    const panel = UI.el("div", {
      class: "cmdk-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Search",
    }, [
      UI.el("div", { class: "flex items-center gap-2 px-1" }, [UI.icon("search"), input]),
      listEl,
    ]);

    const backdrop = UI.el("div", { class: "cmdk-backdrop", onclick: () => close() }, [panel]);
    panel.addEventListener("click", (e) => e.stopPropagation());
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    let results = [];
    let activeIndex = -1;
    let debounceTimer = null;

    function renderRecent() {
      const recent = getRecent();
      listEl.innerHTML = "";
      results = [];
      activeIndex = -1;
      if (!recent.length) {
        listEl.appendChild(UI.el("li", { class: "cmdk-empty" }, ["Start typing to search your sources."]));
        return;
      }
      listEl.appendChild(UI.el("li", { class: "cmdk-section" }, ["Recent searches"]));
      recent.forEach((term) => {
        listEl.appendChild(
          UI.el("li", {
            class: "cmdk-item",
            role: "option",
            tabindex: "-1",
            onclick: () => {
              input.value = term;
              runSearch(term);
            },
          }, [UI.icon("clock"), UI.el("span", { class: "truncate" }, [term])])
        );
      });
    }

    function renderResults(query, matches) {
      listEl.innerHTML = "";
      results = matches;
      activeIndex = matches.length ? 0 : -1;
      if (!matches.length) {
        listEl.appendChild(
          UI.el("li", { class: "cmdk-empty" }, [`No sources match "${query}".`])
        );
        return;
      }
      matches.forEach((result, i) => listEl.appendChild(buildResultRow(result, query, i, i === activeIndex)));
    }

    function renderLoading() {
      listEl.innerHTML = "";
      listEl.appendChild(UI.el("li", { class: "cmdk-empty" }, ["Searching…"]));
    }

    async function runSearch(query) {
      const q = query.trim();
      if (!q) {
        renderRecent();
        return;
      }
      renderLoading();
      try {
        const matches = await searchSources(q);
        renderResults(q, matches);
      } catch (err) {
        listEl.innerHTML = "";
        listEl.appendChild(UI.el("li", { class: "cmdk-empty" }, ["Could not reach the backend to search sources."]));
        results = [];
        activeIndex = -1;
      }
    }

    function updateActive() {
      Array.from(listEl.querySelectorAll(".cmdk-item")).forEach((node, i) => {
        node.classList.toggle("cmdk-item-active", i === activeIndex);
        node.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      });
    }

    function commit(index) {
      const result = results[index];
      if (!result) return;
      addRecent(input.value);
      close();
      global.location.href = resultHref(result);
    }

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const value = input.value;
      debounceTimer = setTimeout(() => runSearch(value), 180);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (results.length) {
          activeIndex = (activeIndex + 1) % results.length;
          updateActive();
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (results.length) {
          activeIndex = (activeIndex - 1 + results.length) % results.length;
          updateActive();
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0) commit(activeIndex);
      }
    });

    function onKeydownGlobal(event) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeydownGlobal);

    function close() {
      document.removeEventListener("keydown", onKeydownGlobal);
      document.body.style.overflow = "";
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      paletteState = null;
      if (triggerEl && typeof triggerEl.focus === "function") triggerEl.focus();
    }

    renderRecent();
    input.focus();

    paletteState = { close };
  }

  function initGlobalShortcuts() {
    if (initGlobalShortcuts._bound) return;
    initGlobalShortcuts._bound = true;
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isTypingField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      } else if (event.key === "/" && !isTypingField) {
        event.preventDefault();
        openPalette();
      }
    });
  }

  global.Search = {
    searchSources,
    searchChunks,
    getRecent,
    addRecent,
    clearRecent,
    excerptAround,
    openPalette,
    initGlobalShortcuts,
  };
})(window);
