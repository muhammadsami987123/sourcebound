/**
 * search.js — full-page search (search.html). Reuses the exact same
 * client-side search core the header command palette uses
 * (window.Search, defined in navigation.js): Api.listSources() for source
 * matches, and Api.getChunks(id) only once a specific source is chosen to
 * scope into. There is no backend search endpoint — nothing here is
 * fabricated or mocked.
 */
(function (global) {
  "use strict";

  const UI = global.UI;
  const Api = global.Api;
  const Search = global.Search;

  document.body.insertBefore(UI.skipLink("main-content"), document.body.firstChild);

  Nav.render({
    active: "search",
    title: "Search",
    description: "Search across your sources by title, type, status, or drill into one source's content.",
    breadcrumb: [{ label: "Overview", href: "app.html" }, { label: "Search" }],
  });

  const formSlot = document.getElementById("search-form-slot");
  const resultsSlot = document.getElementById("search-results-slot");

  let allSources = [];
  let sourcesLoaded = false;
  let sourcesError = null;
  let scopeSourceId = ""; // "" = all sources

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";

  const input = UI.el("input", {
    type: "text",
    class: "input flex-1",
    placeholder: "Search sources by title, type, status…",
    value: initialQuery,
    "aria-label": "Search query",
  });

  const scopeSelect = UI.el("select", { class: "select w-full sm:w-56 flex-none", "aria-label": "Limit search to a source" }, [
    UI.el("option", { value: "" }, ["All sources"]),
  ]);

  const form = UI.el("form", { class: "flex flex-col sm:flex-row gap-3", onsubmit: (e) => { e.preventDefault(); runSearch(); } }, [
    UI.el("div", { class: "flex items-center gap-2 flex-1" }, [UI.icon("search"), input]),
    scopeSelect,
    UI.el("button", { type: "submit", class: "btn btn-primary flex-none" }, ["Search"]),
  ]);

  formSlot.appendChild(form);

  function syncScopeOptions() {
    scopeSelect.innerHTML = "";
    scopeSelect.appendChild(UI.el("option", { value: "" }, ["All sources"]));
    allSources.forEach((source) => {
      scopeSelect.appendChild(UI.el("option", { value: source.id }, [source.title || "Untitled source"]));
    });
    scopeSelect.value = scopeSourceId;
  }

  scopeSelect.addEventListener("change", () => {
    scopeSourceId = scopeSelect.value;
    runSearch();
  });

  async function ensureSources() {
    if (sourcesLoaded) return;
    try {
      const res = await Api.listSources();
      allSources = (res && res.sources) || [];
      sourcesLoaded = true;
      sourcesError = null;
    } catch (err) {
      sourcesError = err;
    }
    syncScopeOptions();
  }

  function renderRecent() {
    resultsSlot.innerHTML = "";
    const recent = Search.getRecent();
    if (!recent.length) {
      resultsSlot.appendChild(
        UI.emptyState({
          icon: "search",
          title: "Search your knowledge base",
          message: "Type a source title, type (website/pdf/txt/md), or status. Choose a source above to also search its indexed text.",
        })
      );
      return;
    }
    const card = UI.el("div", { class: "card p-4 md:p-5" }, [
      UI.el("div", { class: "flex items-center justify-between mb-3" }, [
        UI.el("h2", { class: "font-display text-sm font-semibold" }, ["Recent searches"]),
        UI.el("button", {
          type: "button",
          class: "btn btn-ghost btn-sm",
          onclick: () => { Search.clearRecent(); renderRecent(); },
        }, ["Clear"]),
      ]),
      UI.el("div", { class: "flex flex-wrap gap-2" }, recent.map((term) =>
        UI.suggestionChip(term, () => { input.value = term; runSearch(); })
      )),
    ]);
    resultsSlot.appendChild(card);
  }

  function renderLoading() {
    resultsSlot.innerHTML = "";
    resultsSlot.appendChild(UI.loadingIndicator("Searching…"));
  }

  function renderError(err) {
    resultsSlot.innerHTML = "";
    resultsSlot.appendChild(
      UI.errorAlert({
        title: "Search failed",
        message: err && err.status ? "The backend could not be reached to search sources." : "Something went wrong while searching.",
        onRetry: runSearch,
      })
    );
  }

  function renderSourceResults(query, matches) {
    const list = UI.el("div", { class: "card divide-y divide-[var(--border-subtle)]" });
    matches.forEach((result) => {
      const row = UI.sourceRow
        ? UI.sourceRow(result.source, {
            onOpenChat: (id) => (global.location.href = `chat.html?source=${encodeURIComponent(id)}`),
            onViewDetails: (id) => (global.location.href = `source-details.html?id=${encodeURIComponent(id)}`),
          })
        : buildFallbackRow(result);
      list.appendChild(row);
    });
    resultsSlot.appendChild(
      UI.el("div", { class: "space-y-2" }, [
        UI.el("h2", { class: "text-xs font-semibold uppercase tracking-wide text-faint px-1" }, [`Sources (${matches.length})`]),
        list,
      ])
    );
  }

  function buildFallbackRow(result) {
    const meta = UI.sourceTypeMeta(result.source.source_type || result.source.type);
    return UI.el("a", {
      href: `chat.html?source=${encodeURIComponent(result.source.id)}`,
      class: "flex items-center gap-3 p-3 hover:bg-[var(--surface-sunken)] transition-colors",
    }, [
      UI.icon(meta.icon || "file"),
      UI.el("div", { class: "min-w-0 flex-1" }, [
        UI.el("p", { class: "text-sm font-medium truncate" }, [result.source.title || "Untitled source"]),
        UI.el("p", { class: "text-xs text-faint" }, [`Matched ${result.field}`]),
      ]),
      UI.statusBadge(result.source.status),
    ]);
  }

  function renderChunkResults(query, matches) {
    const list = UI.el("div", { class: "card divide-y divide-[var(--border-subtle)]" });
    matches.forEach((result) => {
      list.appendChild(
        UI.el("a", {
          href: `chat.html?source=${encodeURIComponent(result.chunk.source_id)}`,
          class: "block p-3 hover:bg-[var(--surface-sunken)] transition-colors",
        }, [
          UI.el("p", { class: "text-xs text-faint mb-1" }, [`Chunk #${result.chunk.chunk_index}`]),
          UI.el("p", { class: "text-sm" }, [Search.excerptAround(result.chunk.text || "", query, 60)]),
        ])
      );
    });
    resultsSlot.appendChild(
      UI.el("div", { class: "space-y-2 mt-4" }, [
        UI.el("h2", { class: "text-xs font-semibold uppercase tracking-wide text-faint px-1" }, [`Matching content (${matches.length})`]),
        list,
      ])
    );
  }

  async function runSearch() {
    const query = input.value.trim();
    const url = new URL(global.location.href);
    if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
    history.replaceState(null, "", url);

    if (!query) {
      renderRecent();
      return;
    }

    renderLoading();
    await ensureSources();
    if (sourcesError) {
      renderError(sourcesError);
      return;
    }

    try {
      let sourceMatches = await Search.searchSources(query);
      if (scopeSourceId) {
        sourceMatches = sourceMatches.filter((m) => m.source.id === scopeSourceId);
      }

      let chunkMatches = [];
      if (scopeSourceId) {
        chunkMatches = await Search.searchChunks(scopeSourceId, query);
      }

      resultsSlot.innerHTML = "";

      if (!sourceMatches.length && !chunkMatches.length) {
        resultsSlot.appendChild(
          UI.emptyState({
            icon: "search",
            title: "No results",
            message: scopeSourceId
              ? `Nothing in this source matches "${query}".`
              : `No sources match "${query}". Try a different title, type, or status.`,
          })
        );
      } else {
        if (sourceMatches.length) renderSourceResults(query, sourceMatches);
        if (chunkMatches.length) renderChunkResults(query, chunkMatches);
      }

      Search.addRecent(query);
    } catch (err) {
      renderError(err);
    }
  }

  (async function init() {
    await ensureSources();
    if (initialQuery) {
      runSearch();
    } else {
      renderRecent();
    }
  })();
})(window);
