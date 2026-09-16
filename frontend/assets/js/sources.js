/**
 * sources.js — Sources page: list/search/filter, add URL, upload document,
 * delete, and "open chat" actions. All network calls go through Api (api.js);
 * all rendering goes through UI (components.js).
 */
(function () {
  "use strict";

  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // Matches backend default MAX_UPLOAD_SIZE_MB.
  const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];

  Nav.render({
    active: "sources",
    title: "Sources",
    description: "Add websites and documents, then manage what Sourcebound can answer questions about.",
    breadcrumb: [{ label: "Dashboard", href: "dashboard.html" }, { label: "Sources" }],
  });

  document.getElementById("url-tab-icon").appendChild(UI.icon("globe"));
  document.getElementById("upload-tab-icon").appendChild(UI.icon("upload"));

  let allSources = [];
  let filters = { search: "", type: "", status: "" };

  const listWrap = document.getElementById("sources-list");
  const filterSlot = document.getElementById("filter-slot");

  /* ------------------------------- Add URL form ------------------------------ */

  function validateUrlValue(value) {
    if (!value) return "Enter a website URL.";
    if (value.length > 2048) return "That URL is too long (2048 characters max).";
    let parsed;
    try {
      parsed = new URL(value);
    } catch (err) {
      return "Enter a valid URL, including https://";
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Only http:// and https:// URLs are supported.";
    }
    return null;
  }

  const urlFormApi = UI.urlForm({
    onSubmit: async (value, { errorSlot, submitBtn, input }) => {
      errorSlot.innerHTML = "";
      const validationError = validateUrlValue(value);
      if (validationError) {
        errorSlot.appendChild(UI.el("p", { class: "field-error" }, [UI.icon("warning"), validationError]));
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "";
      submitBtn.appendChild(UI.el("span", { class: "w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" }));
      submitBtn.appendChild(document.createTextNode(" Adding source…"));
      try {
        await Api.addSourceUrl(value);
        UI.toast("Website added. Processing has started.", "success");
        input.value = "";
        loadSources();
      } catch (err) {
        const message =
          err.kind === "network"
            ? "The website could not be reached — check the backend is running."
            : err.message || "Could not add this URL.";
        errorSlot.appendChild(UI.el("p", { class: "field-error" }, [UI.icon("warning"), message]));
        UI.toast(message, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "";
        submitBtn.appendChild(UI.icon("plus"));
        submitBtn.appendChild(document.createTextNode(" Add source"));
      }
    },
  });
  document.getElementById("url-form-slot").appendChild(urlFormApi.node);

  /* ------------------------------- Upload form -------------------------------- */

  function validateFile(file) {
    const name = (file.name || "").toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    if (!hasAllowedExt) return "Unsupported file type. Please choose a PDF, TXT, or Markdown file.";
    if (file.size === 0) return "This file is empty.";
    if (file.size > MAX_UPLOAD_BYTES) return "This file is larger than the server will accept (10 MB max).";
    return null;
  }

  const uploadFormApi = UI.uploadForm({
    onSubmit: async (file, { errorSlot, progressWrap, submitBtn }) => {
      errorSlot.innerHTML = "";
      const validationError = validateFile(file);
      if (validationError) {
        errorSlot.appendChild(UI.el("p", { class: "field-error" }, [UI.icon("warning"), validationError]));
        return;
      }
      submitBtn.disabled = true;
      submitBtn.innerHTML = "";
      submitBtn.appendChild(UI.el("span", { class: "w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" }));
      submitBtn.appendChild(document.createTextNode(" Uploading…"));
      UI.setUploadProgress(progressWrap, 0);
      try {
        await Api.uploadSource(file, (pct) => UI.setUploadProgress(progressWrap, pct));
        UI.toast(`"${file.name}" uploaded. Processing has started.`, "success");
        uploadFormApi.reset();
        loadSources();
      } catch (err) {
        const message = err.kind === "network"
          ? "Could not reach the backend to upload this file."
          : err.message || "Could not process this document.";
        errorSlot.appendChild(UI.el("p", { class: "field-error" }, [UI.icon("warning"), message]));
        UI.toast(message, "error");
        submitBtn.disabled = false;
      } finally {
        submitBtn.innerHTML = "";
        submitBtn.appendChild(UI.icon("upload"));
        submitBtn.appendChild(document.createTextNode(" Upload document"));
      }
    },
  });
  document.getElementById("upload-form-slot").appendChild(uploadFormApi.node);

  /* --------------------------------- List/filter ------------------------------- */

  const controls = UI.searchFilterControls({
    types: ["url", "pdf", "txt", "md"],
    statuses: ["pending", "processing", "ready", "failed"],
    onSearch: (value) => {
      filters.search = value.trim().toLowerCase();
      renderList();
    },
    onTypeChange: (value) => {
      filters.type = value;
      renderList();
    },
    onStatusChange: (value) => {
      filters.status = value;
      renderList();
    },
  });
  filterSlot.appendChild(controls.node);

  function matchesFilters(source) {
    if (filters.type && source.source_type !== filters.type) return false;
    if (filters.status && source.status !== filters.status) return false;
    if (filters.search) {
      const haystack = `${source.title || ""} ${source.origin || ""}`.toLowerCase();
      if (!haystack.includes(filters.search)) return false;
    }
    return true;
  }

  function handleDelete(source) {
    UI.confirmModal({
      title: "Delete this source?",
      message: `"${source.title}" and all of its chunks will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await Api.deleteSource(source.id);
          UI.toast("Source deleted.", "success");
          loadSources();
        } catch (err) {
          UI.toast(err.message || "Could not delete this source.", "error");
        }
      },
    });
  }

  function renderList() {
    listWrap.innerHTML = "";

    if (!allSources.length) {
      listWrap.appendChild(
        UI.emptyState({
          icon: "inbox",
          title: "No sources yet",
          message: "Add a website URL or upload a document above to start building your knowledge base.",
        })
      );
      return;
    }

    const filtered = allSources.filter(matchesFilters);
    if (!filtered.length) {
      listWrap.appendChild(
        UI.emptyState({
          icon: "search",
          title: "No sources match your filters",
          message: "Try a different search term, or clear the type and status filters.",
        })
      );
      return;
    }

    const grid = UI.el("div", { class: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" });
    filtered
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach((source) => {
        grid.appendChild(
          UI.sourceCard(source, {
            onOpenChat: (s) => (window.location.href = `chat.html?source=${encodeURIComponent(s.id)}`),
            onViewDetails: (s) => (window.location.href = `source-details.html?id=${encodeURIComponent(s.id)}`),
            onDelete: handleDelete,
          })
        );
      });
    listWrap.appendChild(grid);
  }

  async function loadSources() {
    listWrap.innerHTML = "";
    const skeletonGrid = UI.el("div", { class: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" });
    for (let i = 0; i < 3; i++) skeletonGrid.appendChild(UI.skeletonCard());
    listWrap.appendChild(skeletonGrid);
    try {
      const data = await Api.listSources();
      allSources = (data && data.sources) || [];
      renderList();
    } catch (err) {
      listWrap.innerHTML = "";
      const message =
        err.kind === "network"
          ? "The backend could not be reached. Start the API server and try again."
          : err.message || "Something went wrong while loading your sources.";
      listWrap.appendChild(UI.errorAlert({ title: "Could not load sources", message, onRetry: loadSources }));
    }
  }

  loadSources();
})();
