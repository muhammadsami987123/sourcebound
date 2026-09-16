/**
 * settings.js — Settings page: theme, chat style, retrieved-chunk count
 * (all persisted via App/localStorage), clearing local data, and a live
 * backend health check + version display via Api (api.js).
 */
(function () {
  "use strict";

  Nav.render({
    active: "settings",
    title: "Settings",
    description: "Lightweight preferences for how Sourcebound looks and answers.",
    breadcrumb: [{ label: "Dashboard", href: "dashboard.html" }, { label: "Settings" }],
  });

  const themeSelect = document.getElementById("theme-select");
  const chatStyleSelect = document.getElementById("chat-style-select");
  const topKInput = document.getElementById("top-k-input");
  const backendStatus = document.getElementById("backend-status");
  const clearDataBtn = document.getElementById("clear-data-btn");
  const appVersionBadge = document.getElementById("app-version");

  function loadFormFromSettings() {
    const settings = App.getSettings();
    themeSelect.value = settings.theme;
    chatStyleSelect.value = settings.chatStyle;
    topKInput.value = settings.topK;
  }

  themeSelect.addEventListener("change", () => {
    App.saveSettings({ theme: themeSelect.value });
    UI.toast("Theme updated.", "success", { duration: 2000 });
  });

  chatStyleSelect.addEventListener("change", () => {
    App.saveSettings({ chatStyle: chatStyleSelect.value });
    UI.toast("Response style saved. Applies to new questions.", "success", { duration: 2500 });
  });

  topKInput.addEventListener("change", () => {
    let value = parseInt(topKInput.value, 10);
    if (Number.isNaN(value)) value = App.DEFAULT_SETTINGS.topK;
    value = Math.min(20, Math.max(1, value));
    topKInput.value = value;
    App.saveSettings({ topK: value });
    UI.toast("Retrieval setting saved. Applies to new questions.", "success", { duration: 2500 });
  });

  clearDataBtn.addEventListener("click", () => {
    UI.confirmModal({
      title: "Clear local application data?",
      message: "This removes your saved preferences and chat history from this browser. Sources on the backend are not affected.",
      confirmLabel: "Clear data",
      danger: true,
      onConfirm: () => {
        App.clearAllLocalData();
        loadFormFromSettings();
        UI.toast("Local data cleared.", "success");
      },
    });
  });

  async function checkBackend() {
    backendStatus.innerHTML = "";
    backendStatus.appendChild(UI.loadingIndicator("Checking backend connection…"));
    try {
      const health = await Api.health();
      backendStatus.innerHTML = "";
      backendStatus.appendChild(
        UI.el("div", { class: "flex items-center justify-between gap-4 flex-wrap" }, [
          UI.el("div", { class: "flex items-center gap-2" }, [
            UI.el("span", { class: "w-2.5 h-2.5 rounded-full bg-[var(--success-600)]" }),
            UI.el("span", { class: "text-sm font-medium" }, ["Connected"]),
          ]),
          UI.el("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: checkBackend }, ["Check again"]),
        ])
      );
      const detailGrid = UI.el("div", { class: "grid grid-cols-2 gap-3 mt-4 text-sm" }, [
        UI.el("div", {}, [UI.el("p", { class: "text-xs text-faint" }, ["App"]), UI.el("p", { class: "font-medium" }, [health.app_name || "Sourcebound"])]),
        UI.el("div", {}, [UI.el("p", { class: "text-xs text-faint" }, ["Backend version"]), UI.el("p", { class: "font-medium" }, [health.version || "—"])]),
        UI.el("div", {}, [UI.el("p", { class: "text-xs text-faint" }, ["Chat model"]), UI.el("p", { class: "font-medium" }, [health.chat_model || "—"])]),
        UI.el("div", {}, [UI.el("p", { class: "text-xs text-faint" }, ["Embedding model"]), UI.el("p", { class: "font-medium" }, [health.embedding_model || "—"])]),
      ]);
      backendStatus.appendChild(detailGrid);
    } catch (err) {
      backendStatus.innerHTML = "";
      const message =
        err.kind === "network"
          ? "The backend could not be reached. Make sure the API server is running."
          : err.message || "The backend reported an error.";
      backendStatus.appendChild(
        UI.el("div", { class: "flex items-center justify-between gap-4 flex-wrap" }, [
          UI.el("div", { class: "flex items-center gap-2" }, [
            UI.el("span", { class: "w-2.5 h-2.5 rounded-full bg-[var(--error-600)]" }),
            UI.el("span", { class: "text-sm font-medium" }, ["Disconnected"]),
          ]),
          UI.el("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: checkBackend }, ["Check again"]),
        ])
      );
      backendStatus.appendChild(UI.el("p", { class: "text-sm text-muted mt-3" }, [message]));
    }
  }

  appVersionBadge.textContent = `v${App.APP_VERSION}`;
  loadFormFromSettings();
  checkBackend();
})();
