/**
 * marketing.js — behaviour for the public marketing pages (index, about,
 * features). Self-contained: does not depend on api.js / components.js /
 * navigation.js, which belong to the authenticated workspace shell.
 *
 * Provides:
 *   Marketing.icon(name, cls) -> inline <svg> string, same visual family as
 *     the workspace icon set (24 viewBox, 1.75 stroke, currentColor, no fill).
 *   Marketing.mountIcons()    -> replaces every [data-icon] element's content.
 *   Mobile nav drawer wiring (menu button <-> panel), Escape + outside click.
 */
(function (global) {
  "use strict";

  var ICONS = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z"/>',
    fileText: '<path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14 3.5V8h4"/><path d="M9 13h6M9 16.5h6"/>',
    upload: '<path d="M12 15V4M12 4l-4 4M12 4l4 4"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/>',
    chat: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="m5 13 4 4L19 7"/>',
    shield: '<path d="M12 3.5 5 6v6c0 4.4 3 7.5 7 8.5 4-1 7-4.1 7-8.5V6l-7-2.5z"/><path d="m9.3 12.2 2 2 3.4-4"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    bolt: '<path d="M13 3 5 13.5h5.5L11 21l8-11h-5.5L13 3z"/>',
    layers: '<path d="m12 3 8 4.5-8 4.5-8-4.5L12 3z"/><path d="m4 12 8 4.5 8-4.5"/><path d="m4 16.5 8 4.5 8-4.5"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M7.5 3v2M16.5 3v2M7.5 19v2M16.5 19v2M3 7.5h2M3 16.5h2M19 7.5h2M19 16.5h2"/>',
    sparkles: '<path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M17.5 6.5l-2.8 2.8M9.3 14.7l-2.8 2.8"/>',
    link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.4 5a3.5 3.5 0 1 1 5 5L16 11.5"/><path d="M13 17.5 11.6 19a3.5 3.5 0 1 1-5-5L8 12.5"/>',
    workspace: '<rect x="3.5" y="4" width="17" height="13" rx="1.5"/><path d="M3.5 15.5h17"/><path d="M9 20h6"/>',
    quote: '<path d="M8.5 7.5c-2.2 0-4 1.9-4 4.5v4.5h4.5V12h-2.3c0-1.5 1-2.5 1.8-2.5v-2z"/><path d="M17 7.5c-2.2 0-4 1.9-4 4.5v4.5h4.5V12h-2.3c0-1.5 1-2.5 1.8-2.5v-2z"/>'
  };

  function icon(name, cls) {
    var body = ICONS[name] || "";
    return (
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"' +
      (cls ? ' class="' + cls + '"' : "") +
      ' aria-hidden="true">' +
      body +
      "</svg>"
    );
  }

  function mountIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      var name = el.getAttribute("data-icon");
      var cls = el.getAttribute("data-icon-class") || "";
      el.innerHTML = icon(name, cls);
    });
  }

  function initMobileNav() {
    var btn = document.querySelector("[data-marketing-menu-btn]");
    var panel = document.querySelector("[data-marketing-menu-panel]");
    if (!btn || !panel) return;

    function isOpen() {
      return !panel.hasAttribute("hidden");
    }

    function open() {
      panel.removeAttribute("hidden");
      btn.setAttribute("aria-expanded", "true");
      btn.innerHTML = icon("close");
      var firstLink = panel.querySelector("a, button");
      if (firstLink) firstLink.focus();
      document.addEventListener("keydown", onKeydown);
      document.addEventListener("click", onOutsideClick, true);
    }

    function close(returnFocus) {
      panel.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = icon("menu");
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onOutsideClick, true);
      if (returnFocus) btn.focus();
    }

    function onKeydown(e) {
      if (e.key === "Escape") close(true);
    }

    function onOutsideClick(e) {
      if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        close(false);
      }
    }

    btn.addEventListener("click", function () {
      if (isOpen()) close(true);
      else open();
    });

    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        close(false);
      });
    });
  }

  function applyActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll("[data-nav-key]").forEach(function (el) {
      if (el.getAttribute("data-nav-key") === page) {
        el.classList.add("is-active");
        el.setAttribute("aria-current", "page");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    mountIcons(document);
    initMobileNav();
    applyActiveNav();
  });

  global.Marketing = { icon: icon, mountIcons: mountIcons };
})(window);
