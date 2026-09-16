/**
 * app.js — shared bootstrap logic included on every page. Owns the
 * localStorage-backed settings object (theme, chat style, retrieved-chunk
 * count) and wires up global error handling. Page-specific scripts
 * (sources.js, chat.js, settings.js) call into App.* rather than touching
 * localStorage directly, so there is one source of truth for preferences.
 */
(function (global) {
  "use strict";

  const SETTINGS_KEY = "sourcebound:settings";
  const CONVERSATIONS_KEY = "sourcebound:conversations";

  const DEFAULT_SETTINGS = {
    theme: "system", // 'light' | 'dark' | 'system'
    chatStyle: "balanced", // 'concise' | 'balanced' | 'detailed'
    topK: 5,
  };

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (err) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(partial) {
    const next = { ...getSettings(), ...partial };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    applyTheme(next.theme);
    return next;
  }

  function applyTheme(themePref) {
    const pref = themePref || getSettings().theme;
    const root = document.documentElement;
    if (pref === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", pref);
    }
  }

  function getConversations() {
    try {
      const raw = localStorage.getItem(CONVERSATIONS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  function saveConversation(sourceId, conversation) {
    const all = getConversations();
    all[sourceId] = conversation;
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(all));
    } catch (err) {
      // Storage quota exceeded or unavailable — conversation stays in memory only.
    }
  }

  function clearConversation(sourceId) {
    const all = getConversations();
    delete all[sourceId];
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(all));
  }

  function clearAllLocalData() {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CONVERSATIONS_KEY);
    applyTheme("system");
  }

  function init() {
    applyTheme();
    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason && event.reason.name === "ApiError") {
        // Already surfaced by the calling page; avoid a duplicate generic toast.
        return;
      }
      console.error("Unhandled error:", event.reason);
    });
  }

  init();

  global.App = {
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    applyTheme,
    getConversations,
    saveConversation,
    clearConversation,
    clearAllLocalData,
    APP_VERSION: "1.0.0",
  };
})(window);
