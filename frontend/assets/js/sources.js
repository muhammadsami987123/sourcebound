/**
 * sources.js — Sources page: professional knowledge-base management.
 * Table/list of sources with search, type filter, status filter, sort,
 * add-source modal (URL + upload), status polling, and delete with
 * confirmation. All network calls go through Api (api.js); all rendering
 * goes through UI (components.js).
 */
(function () {
  "use strict";

  document.body.insertBefore(UI.skipLink("main-content"), document.body.firstChild);

  Nav.render({
    active: "sources",
    title: "Sources",
    description: "Add websites and documents, then manage what Sourcebound can answer questions about.",
  });

  const addBtn = document.getElementById("add-source-btn");
  addBtn.appendChild(UI.icon("plus"));
  addBtn.appendChild(document.createTextNode(" Add Source"));
  addBtn.addEventListener("click", openAddSourceModal);

  let allSources = [];
  let filters = { search: "", type: "", status: "" };
  let sortBy = "newest";
  let pollTimer = null;
  let loadToken = 0;

  const listWrap = document.getElementById("sources-list");
  const filterSlot = document.getElementById("filter-slot");

  /* -------------------------------- Add source -------------------------------- */

  function openAddSourceModal() {
    UI.addSourceModal({
      onAdded: () => {
        loadSources();
      },
    });
  }

  // The sidebar's "Add source" quick action links here as sources.html#add-source
  // so it behaves like an in-place trigger rather than a plain navigation. Strip
  // the hash after reading it so a refresh or back-navigation doesn't reopen it.
  if (window.location.hash === "#add-source") {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    openAddSourceModal();
  }

  /* --------------------------------- Filters ----------------------------------- */

  const controls = UI.searchFilterControls({
    types: ["url", "pdf", "txt", "md"],
    statuses: ["pending", "processing", "ready", "failed"],
    onSearch: (value) => {
      filters.search = (value || "").trim().toLowerCase();
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

  // Sort control — not part of the shared filter widget, built with the shared
  // `.select` class + `.field-label` so it matches the design system visually.
  const sortWrap = UI.el("label", { class: "flex items-center gap-2 text-sm mt-3 md:mt-0" }, [
    UI.el("span", { class: "field-label mb-0 whitespace-nowrap" }, ["Sort"]),
  ]);
  const sortSelect = UI.el(
    "select",
    {
      class: "select",
      "aria-label": "Sort sources",
      onchange: (e) => {
        sortBy = e.target.value;
        renderList();
      },
    },
    [
      UI.el("option", { value: "newest" }, ["Newest first"]),
      UI.el("option", { value: "oldest" }, ["Oldest first"]),
      UI.el("option", { value: "title" }, ["Title (A–Z)"]),
      UI.el("option", { value: "status" }, ["Status"]),
    ]
  );
  sortWrap.appendChild(sortSelect);
  filterSlot.appendChild(sortWrap);

  function matchesFilters(source) {
    if (filters.type && source.source_type !== filters.type) return false;
    if (filters.status && source.status !== filters.status) return false;
    if (filters.search) {
      const haystack = `${source.title || ""} ${source.origin || ""}`.toLowerCase();
      if (!haystack.includes(filters.search)) return false;
    }
    return true;
  }

  function sortSources(list) {
    const copy = list.slice();
    switch (sortBy) {
      case "oldest":
        return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case "title":
        return copy.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      case "status":
        return copy.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
      case "newest":
      default:
        return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  /* ---------------------------------- Delete ------------------------------------ */

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

  /* ---------------------------------- Render ------------------------------------ */

  function renderList() {
    listWrap.innerHTML = "";

    if (!allSources.length) {
      listWrap.appendChild(
        UI.emptyState({
          icon: "inbox",
          title: "No sources yet",
          message: "Add a website URL or upload a document to start building your knowledge base.",
          actionLabel: "Add Source",
          onAction: openAddSourceModal,
        })
      );
      return;
    }

    const filtered = sortSources(allSources.filter(matchesFilters));
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

    const sourceSort = sortBy === "newest" || sortBy === "oldest" ? "created" : sortBy === "title" ? "title" : null;

    function sortHeaderBtn(label, key, directionAsc, directionDesc) {
      const isActive = sourceSort === key;
      const ariaSort = !isActive ? "none" : sortBy === directionAsc ? "ascending" : "descending";
      return UI.el(
        "th",
        { scope: "col", "aria-sort": ariaSort },
        [
          UI.el(
            "button",
            {
              type: "button",
              class: "flex items-center gap-1",
              onclick: () => {
                sortBy = isActive && sortBy === directionAsc ? directionDesc : directionAsc;
                sortSelect.value = sortBy;
                renderList();
              },
            },
            [label, UI.icon("sort", "w-3.5 h-3.5")]
          ),
        ]
      );
    }

    const thead = UI.el("thead", {}, [
      UI.el("tr", { class: "data-table-row" }, [
        sortHeaderBtn("Source", "title", "title", "title"),
        UI.el("th", { scope: "col" }, ["Status"]),
        UI.el("th", { scope: "col" }, ["Metadata"]),
        sortHeaderBtn("Last indexed", "created", "newest", "oldest"),
        UI.el("th", { scope: "col" }, [UI.el("span", { class: "sr-only" }, ["Actions"])]),
      ]),
    ]);

    const tbody = UI.el("tbody", {});
    filtered.forEach((source) => {
      tbody.appendChild(
        UI.sourceRow(source, {
          onOpenChat: (s) => (window.location.href = `chat.html?source=${encodeURIComponent(s.id)}`),
          onViewDetails: (s) => (window.location.href = `source-details.html?id=${encodeURIComponent(s.id)}`),
          onDelete: handleDelete,
        })
      );
    });

    const table = UI.el("table", { class: "data-table", "aria-label": "Sources" }, [thead, tbody]);
    listWrap.appendChild(table);
  }

  /* ---------------------------------- Loading ------------------------------------ */

  async function loadSources() {
    const token = ++loadToken;
    listWrap.innerHTML = "";
    const skeletonWrap = UI.el("div", { class: "space-y-3" });
    for (let i = 0; i < 4; i++) skeletonWrap.appendChild(UI.skeletonCard());
    listWrap.appendChild(skeletonWrap);
    try {
      const data = await Api.listSources();
      if (token !== loadToken) return;
      allSources = (data && data.sources) || [];
      renderList();
      schedulePolling();
    } catch (err) {
      if (token !== loadToken) return;
      listWrap.innerHTML = "";
      const message =
        err.kind === "network"
          ? "The backend could not be reached. Start the API server and try again."
          : err.message || "Something went wrong while loading your sources.";
      listWrap.appendChild(UI.errorAlert({ title: "Could not load sources", message, onRetry: loadSources }));
    }
  }

  /* --------------------------------- Polling ------------------------------------- */

  function hasPending(list) {
    return list.some((s) => s.status === "pending" || s.status === "processing");
  }

  function schedulePolling() {
    const pending = hasPending(allSources);
    if (!pending) {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      return;
    }
    if (pollTimer) return; // already polling
    pollTimer = setInterval(async () => {
      try {
        const data = await Api.listSources();
        allSources = (data && data.sources) || [];
        renderList();
        if (!hasPending(allSources)) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      } catch (err) {
        // Silently skip this poll tick; next tick or a manual retry will recover.
      }
    }, 4000);
  }

  window.addEventListener("beforeunload", () => {
    if (pollTimer) clearInterval(pollTimer);
  });

  loadSources();
})();
