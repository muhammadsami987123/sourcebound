/**
 * navigation.js — the single, shared application shell: sidebar, top
 * header, page title, breadcrumb and notification area. Every page calls
 * Nav.render(options) once on load; there is no other nav implementation.
 */
(function (global) {
  "use strict";

  const UI = global.UI;
  const SIDEBAR_KEY = "sourcebound:sidebar";

  const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
    { key: "sources", label: "Sources", href: "sources.html", icon: "layers" },
    { key: "chat", label: "Chat", href: "chat.html", icon: "chat" },
    { key: "settings", label: "Settings", href: "settings.html", icon: "settings" },
  ];

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

  function buildSidebar(active) {
    const links = NAV_ITEMS.map((item) =>
      UI.el("a", {
        href: item.href,
        class: `nav-link ${active === item.key ? "is-active" : ""}`,
        "aria-current": active === item.key ? "page" : undefined,
        title: item.label,
      }, [
        UI.el("span", { class: "nav-link-icon" }, [UI.icon(item.icon)]),
        UI.el("span", { class: "nav-link-label" }, [item.label]),
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

    const brand = UI.el("a", { href: "dashboard.html", class: "flex items-center gap-2.5 min-w-0" }, [
      UI.el("span", { class: "brand-mark w-9 h-9 text-base flex-none" }, ["S"]),
      UI.el("span", { class: "sidebar-label min-w-0" }, [
        UI.el("span", { class: "font-display font-semibold text-[15px] leading-tight block truncate" }, ["Sourcebound"]),
        UI.el("span", { class: "text-[11px] text-faint leading-tight block truncate" }, ["Grounded answers"]),
      ]),
    ]);

    const header = UI.el("div", { class: "sidebar-header flex items-center justify-between gap-2 mb-6" }, [
      brand,
      UI.el("div", { class: "flex items-center gap-1 flex-none" }, [collapseBtn, closeBtn]),
    ]);

    const profileLink = UI.el("a", {
      href: "settings.html",
      class: `profile-chip ${active === "settings" ? "is-active" : ""}`,
      title: "Settings & profile",
    }, [
      UI.el("span", { class: "profile-avatar" }, [UI.icon("settings")]),
      UI.el("span", { class: "sidebar-label min-w-0 flex-1" }, [
        UI.el("span", { class: "block text-sm font-semibold truncate" }, ["Local workspace"]),
        UI.el("span", { class: "block text-[11px] text-faint truncate" }, ["Preferences & status"]),
      ]),
    ]);

    const sidebar = UI.el("div", { class: "flex flex-col h-full" }, [
      header,
      UI.el("nav", { class: "flex flex-col gap-1 flex-1" }, links),
      UI.el("div", { class: "sidebar-footer pt-4" }, [
        UI.el("p", { class: "sidebar-label text-[11px] text-faint px-2 leading-relaxed mb-3" }, ["Source-grounded RAG assistant"]),
      ]),
      UI.el("div", { class: "border-t border-subtle pt-3 mt-1" }, [profileLink]),
    ]);

    return { node: sidebar, closeBtn, collapseBtn };
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
      "aria-label": "Toggle color theme",
      title: "Toggle color theme",
      onclick: () => {
        const next = isDark() ? "light" : "dark";
        if (global.App && global.App.saveSettings) global.App.saveSettings({ theme: next });
        render_icon();
      },
    }, []);

    function render_icon() {
      btn.innerHTML = "";
      btn.appendChild(UI.icon(isDark() ? "sun" : "moon"));
    }
    render_icon();
    return btn;
  }

  function buildTopbar({ active, title, description, breadcrumb, onToggleSidebar, onOpenSidebar }) {
    return UI.el("div", { class: "flex items-center justify-between gap-4 px-4 md:px-8 py-4" }, [
      UI.el("div", { class: "flex items-center gap-3 min-w-0" }, [
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
      UI.el("div", { class: "flex items-center gap-2 flex-none" }, [
        UI.el("div", { id: "topbar-status", class: "hidden sm:flex items-center gap-2 text-xs text-muted flex-none status-chip" }),
        buildThemeToggle(),
      ]),
    ]);
  }

  function render(options) {
    const { active, title, description, breadcrumb } = options;
    const sidebarRoot = document.getElementById("sidebar-root");
    const topbarRoot = document.getElementById("topbar-root");
    document.title = title ? `${title} · Sourcebound` : "Sourcebound";

    let closeBtn, collapseBtn;
    if (sidebarRoot) {
      sidebarRoot.className = "app-sidebar fixed inset-y-0 left-0 z-40 w-64 p-5 -translate-x-full transition-all duration-200 lg:translate-x-0 lg:static lg:z-auto";
      sidebarRoot.innerHTML = "";
      const built = buildSidebar(active);
      sidebarRoot.appendChild(built.node);
      closeBtn = built.closeBtn;
      collapseBtn = built.collapseBtn;
    }

    let overlay = document.getElementById("sidebar-overlay");
    if (!overlay) {
      overlay = UI.el("div", { id: "sidebar-overlay", class: "fixed inset-0 bg-black/30 backdrop-blur-[1px] z-30 hidden lg:hidden" });
      document.body.appendChild(overlay);
    }

    function closeMobileSidebar() {
      sidebarRoot.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
    function toggleMobileSidebar() {
      const isOpen = !sidebarRoot.classList.contains("-translate-x-full");
      if (isOpen) closeMobileSidebar();
      else {
        sidebarRoot.classList.remove("-translate-x-full");
        overlay.classList.remove("hidden");
      }
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

  global.Nav = { render, refreshBackendStatus, NAV_ITEMS };
})(window);
