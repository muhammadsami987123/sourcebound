/**
 * components.js — reusable render functions shared by every page.
 * Everything builds DOM nodes via document.createElement / textContent
 * (never innerHTML with API/user content) so untrusted text can never be
 * interpreted as markup.
 */
(function (global) {
  "use strict";

  /* ----------------------------- DOM helpers ----------------------------- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach((key) => {
      const value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "html") node.innerHTML = value; // only ever used with static, hardcoded strings below
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
      else if (key === "dataset") Object.assign(node.dataset, value);
      else node.setAttribute(key, value);
    });
    (children || []).forEach((child) => {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function icon(name, cls) {
    // Small inline SVG icon set (stroke-based, 1.75px, consistent family).
    const paths = {
      globe:
        '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.9 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.9-4-9s1.5-6.4 4-9Z"/>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
      markdown: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15V9l3 3 3-3v6M17 9v6M14.5 12.5 17 15l2.5-2.5"/>',
      chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
      trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/>',
      eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>',
      upload: '<path d="M12 16V4m0 0 4 4m-4-4-4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
      copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
      warning: '<path d="M10.3 3.9 1.8 18a1.5 1.5 0 0 0 1.3 2.3h17.8a1.5 1.5 0 0 0 1.3-2.3L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z"/><path d="M12 9v4M12 17h.01"/>',
      check: '<path d="m20 6-11 11L4 12"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
      layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
      dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z"/>',
      chevronRight: '<path d="m9 18 6-6-6-6"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
      link: '<path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8"/>',
      inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Z"/>',
    };
    const wrap = document.createElement("span");
    wrap.className = cls || "";
    wrap.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</svg>`;
    return wrap.firstChild;
  }

  /* ------------------------------ Formatting ------------------------------ */

  function formatDate(iso) {
    if (!iso) return "Unknown date";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatTime(iso) {
    const date = iso ? new Date(iso) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function formatBytes(bytes) {
    if (bytes === 0 || bytes === undefined || bytes === null) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function formatNumber(n) {
    return new Intl.NumberFormat().format(n || 0);
  }

  const SOURCE_TYPE_META = {
    url: { label: "Website", icon: "globe" },
    pdf: { label: "PDF", icon: "file" },
    txt: { label: "Text", icon: "file" },
    md: { label: "Markdown", icon: "markdown" },
  };

  function sourceTypeMeta(type) {
    return SOURCE_TYPE_META[type] || { label: type || "Unknown", icon: "file" };
  }

  const STATUS_META = {
    ready: { label: "Ready", cls: "badge-ready" },
    processing: { label: "Processing", cls: "badge-processing" },
    pending: { label: "Pending", cls: "badge-pending" },
    failed: { label: "Failed", cls: "badge-failed" },
  };

  /* ------------------------------ Components ------------------------------ */

  function statusBadge(status) {
    const meta = STATUS_META[status] || { label: status || "Unknown", cls: "badge-pending" };
    return el("span", { class: `badge ${meta.cls}` }, [
      el("span", { class: "badge-dot" }),
      meta.label,
    ]);
  }

  function statCard({ label, value, icon: iconName, tone }) {
    const toneCls = tone === "success" ? "text-[var(--success-600)]" :
      tone === "warning" ? "text-[var(--warning-600)]" :
      tone === "error" ? "text-[var(--error-600)]" : "text-[var(--brand-600)]";
    return el("div", { class: "card p-5 flex items-start justify-between" }, [
      el("div", {}, [
        el("p", { class: "text-xs font-semibold uppercase tracking-wide text-muted" }, [label]),
        el("p", { class: "font-display text-2xl font-semibold mt-1.5" }, [formatNumber(value)]),
      ]),
      el("div", { class: `w-10 h-10 rounded-xl bg-sunken flex items-center justify-center ${toneCls}` }, [
        icon(iconName || "layers"),
      ]),
    ]);
  }

  function sourceCard(source, { onOpenChat, onDelete, onViewDetails } = {}) {
    const typeMeta = sourceTypeMeta(source.source_type);
    const isReady = source.status === "ready";
    const card = el("div", { class: "card card-hover p-5 flex flex-col gap-3" }, [
      el("div", { class: "flex items-start justify-between gap-3" }, [
        el("div", { class: "flex items-start gap-3 min-w-0" }, [
          el("div", { class: "w-9 h-9 rounded-lg bg-sunken flex items-center justify-center text-[var(--brand-600)] flex-none" }, [
            icon(typeMeta.icon),
          ]),
          el("div", { class: "min-w-0" }, [
            el("p", { class: "font-medium text-sm truncate", title: source.title || "" }, [source.title || "Untitled source"]),
            el("p", { class: "text-xs text-muted truncate", title: source.origin || "" }, [source.origin || ""]),
          ]),
        ]),
        statusBadge(source.status),
      ]),
      el("div", { class: "flex items-center gap-4 text-xs text-muted" }, [
        el("span", {}, [`${typeMeta.label}`]),
        el("span", { class: "w-1 h-1 rounded-full bg-[var(--border-strong)]" }),
        el("span", {}, [`${formatNumber(source.chunk_count)} chunks`]),
        el("span", { class: "w-1 h-1 rounded-full bg-[var(--border-strong)]" }),
        el("span", {}, [formatDate(source.created_at)]),
      ]),
      source.status === "failed" && source.error
        ? el("p", { class: "text-xs text-[var(--error-600)] bg-[var(--error-50)] rounded-lg px-3 py-2" }, [source.error])
        : null,
      el("div", { class: "flex items-center gap-2 mt-1" }, [
        el("button", {
          class: "btn btn-primary btn-sm flex-1",
          disabled: !isReady,
          title: isReady ? "Chat with this source" : "Source is not ready yet",
          onclick: () => onOpenChat && onOpenChat(source),
        }, [icon("chat"), "Chat"]),
        el("button", {
          class: "icon-btn",
          title: "View details",
          "aria-label": "View source details",
          onclick: () => onViewDetails && onViewDetails(source),
        }, [icon("eye")]),
        el("button", {
          class: "icon-btn hover:text-[var(--error-600)]",
          title: "Delete source",
          "aria-label": "Delete source",
          onclick: () => onDelete && onDelete(source),
        }, [icon("trash")]),
      ]),
    ]);
    return card;
  }

  function emptyState({ icon: iconName = "inbox", title, message, actionLabel, onAction }) {
    return el("div", { class: "flex flex-col items-center justify-center text-center py-14 px-6" }, [
      el("div", { class: "w-14 h-14 rounded-2xl bg-sunken flex items-center justify-center text-faint mb-4" }, [icon(iconName)]),
      el("p", { class: "font-display font-semibold text-base" }, [title || "Nothing here yet"]),
      message ? el("p", { class: "text-sm text-muted mt-1.5 max-w-sm" }, [message]) : null,
      actionLabel
        ? el("button", { class: "btn btn-primary mt-5", onclick: () => onAction && onAction() }, [icon("plus"), actionLabel])
        : null,
    ]);
  }

  function loadingIndicator(label) {
    return el("div", { class: "flex flex-col items-center justify-center py-14 gap-3 text-muted text-sm" }, [
      el("div", { class: "w-8 h-8 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--brand-600)] animate-spin" }),
      label ? el("p", {}, [label]) : null,
    ]);
  }

  function skeletonCard() {
    return el("div", { class: "card p-5 space-y-3" }, [
      el("div", { class: "skeleton h-4 w-2/3" }),
      el("div", { class: "skeleton h-3 w-1/3" }),
      el("div", { class: "skeleton h-3 w-full" }),
    ]);
  }

  function errorAlert({ title = "Something went wrong", message, onRetry }) {
    return el("div", { class: "rounded-xl border border-[var(--error-600)]/20 bg-[var(--error-50)] p-4 flex items-start gap-3", role: "alert" }, [
      el("span", { class: "text-[var(--error-600)] flex-none mt-0.5" }, [icon("warning")]),
      el("div", { class: "flex-1 min-w-0" }, [
        el("p", { class: "text-sm font-semibold text-[var(--error-600)]" }, [title]),
        message ? el("p", { class: "text-sm text-[var(--ink-700)] mt-0.5" }, [message]) : null,
      ]),
      onRetry
        ? el("button", { class: "btn btn-secondary btn-sm flex-none", onclick: onRetry }, ["Retry"])
        : null,
    ]);
  }

  function inlineNotice({ tone = "info", message }) {
    const map = {
      info: { cls: "bg-[var(--info-50)] text-[var(--info-600)]", icon: "info" },
      success: { cls: "bg-[var(--success-50)] text-[var(--success-600)]", icon: "check" },
      warning: { cls: "bg-[var(--warning-50)] text-[var(--warning-600)]", icon: "warning" },
      error: { cls: "bg-[var(--error-50)] text-[var(--error-600)]", icon: "warning" },
    };
    const meta = map[tone] || map.info;
    return el("div", { class: `rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 ${meta.cls}` }, [
      icon(meta.icon),
      el("span", {}, [message]),
    ]);
  }

  /* --------------------------------- Toasts -------------------------------- */

  function ensureToastRegion() {
    let region = document.getElementById("toast-region");
    if (!region) {
      region = el("div", { id: "toast-region", "aria-live": "polite", "aria-atomic": "true" });
      document.body.appendChild(region);
    }
    return region;
  }

  function toast(message, type = "info", opts = {}) {
    const region = ensureToastRegion();
    const map = {
      success: { icon: "check", cls: "text-[var(--success-600)]" },
      error: { icon: "warning", cls: "text-[var(--error-600)]" },
      warning: { icon: "warning", cls: "text-[var(--warning-600)]" },
      info: { icon: "info", cls: "text-[var(--brand-600)]" },
    };
    const meta = map[type] || map.info;
    const node = el("div", { class: "toast", role: "status" }, [
      el("span", { class: `toast-icon ${meta.cls}` }, [icon(meta.icon)]),
      el("p", { class: "text-sm text-[var(--ink-900)] flex-1" }, [message]),
      el("button", { class: "icon-btn flex-none -mr-1 -mt-1", "aria-label": "Dismiss notification", onclick: () => node.remove() }, [icon("close")]),
    ]);
    region.appendChild(node);
    const timeout = opts.duration === 0 ? null : opts.duration || 4200;
    if (timeout) setTimeout(() => node.remove(), timeout);
    return node;
  }

  /* --------------------------------- Modal --------------------------------- */

  function ensureModalRoot() {
    let root = document.getElementById("modal-root");
    if (!root) {
      root = el("div", { id: "modal-root" });
      document.body.appendChild(root);
    }
    return root;
  }

  function confirmModal({ title = "Are you sure?", message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm }) {
    const root = ensureModalRoot();
    const close = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };

    const backdrop = el("div", { class: "modal-backdrop", onclick: (e) => { if (e.target === backdrop) close(); } }, [
      el("div", { class: "modal-panel", role: "dialog", "aria-modal": "true", "aria-label": title }, [
        el("h3", { class: "font-display font-semibold text-base" }, [title]),
        message ? el("p", { class: "text-sm text-muted mt-2" }, [message]) : null,
        el("div", { class: "flex items-center justify-end gap-2 mt-6" }, [
          el("button", { class: "btn btn-secondary", onclick: close }, [cancelLabel]),
          el("button", {
            class: danger ? "btn btn-danger" : "btn btn-primary",
            onclick: () => {
              close();
              onConfirm && onConfirm();
            },
          }, [confirmLabel]),
        ]),
      ]),
    ]);
    document.addEventListener("keydown", onKey);
    root.appendChild(backdrop);
    const focusTarget = backdrop.querySelector(".btn-secondary");
    if (focusTarget) focusTarget.focus();
    return close;
  }

  function referencesModal({ title = "Sources for this answer", references = [] }) {
    const root = ensureModalRoot();
    const close = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };

    const list = el("div", { class: "space-y-2.5 mt-4 max-h-[60vh] overflow-y-auto pr-1" },
      references.length
        ? references.map((ref) => referenceCard(ref))
        : [el("p", { class: "text-sm text-muted" }, ["No specific source passages were referenced for this answer."])]
    );

    const backdrop = el("div", { class: "modal-backdrop", onclick: (e) => { if (e.target === backdrop) close(); } }, [
      el("div", { class: "modal-panel modal-panel-wide", role: "dialog", "aria-modal": "true", "aria-label": title }, [
        el("div", { class: "flex items-start justify-between gap-3" }, [
          el("div", {}, [
            el("h3", { class: "font-display font-semibold text-base" }, [title]),
            el("p", { class: "text-xs text-muted mt-1" }, [`${references.length} passage${references.length === 1 ? "" : "s"} used to ground this answer`]),
          ]),
          el("button", { class: "icon-btn flex-none -mr-1 -mt-1", "aria-label": "Close", onclick: close }, [icon("close")]),
        ]),
        list,
      ]),
    ]);
    document.addEventListener("keydown", onKey);
    root.appendChild(backdrop);
    return close;
  }

  /* ------------------------------- Chat pieces ------------------------------ */

  function chatMessage({ role, text, timestamp, pending = false }) {
    const isUser = role === "user";
    const bubble = el("div", { class: `chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}` }, [
      pending
        ? el("span", { class: "inline-flex items-center gap-1.5 text-muted" }, [
            el("span", { class: "w-1.5 h-1.5 rounded-full bg-current animate-bounce" }),
            el("span", { class: "w-1.5 h-1.5 rounded-full bg-current animate-bounce", style: "animation-delay:120ms" }),
            el("span", { class: "w-1.5 h-1.5 rounded-full bg-current animate-bounce", style: "animation-delay:240ms" }),
          ])
        : el("span", {}, [text]),
    ]);

    const avatar = el("div", {
      class: `chat-avatar ${isUser ? "chat-avatar-user" : "chat-avatar-assistant"}`,
      "aria-hidden": "true",
    }, [isUser ? "You" : icon("chat", "w-4 h-4")]);

    const column = el("div", { class: `flex flex-col gap-1.5 min-w-0 ${isUser ? "items-end" : "items-start"}` }, [
      bubble,
      el("div", { class: "flex items-center gap-2 px-1" }, [
        el("span", { class: "text-[11px] text-faint" }, [formatTime(timestamp)]),
        !isUser && !pending
          ? el("button", {
              class: "text-[11px] text-muted hover:text-[var(--brand-600)] inline-flex items-center gap-1",
              title: "Copy response",
              onclick: async (e) => {
                try {
                  await navigator.clipboard.writeText(text || "");
                  toast("Response copied to clipboard.", "success");
                } catch (err) {
                  toast("Could not copy to clipboard.", "error");
                }
              },
            }, [icon("copy"), "Copy"])
          : null,
      ]),
    ]);

    const row = el("div", { class: `chat-row ${isUser ? "flex-row-reverse" : ""}` }, [avatar, column]);
    return row;
  }

  function sourcesButton(count, onClick) {
    return el("button", {
      type: "button",
      class: "sources-btn",
      onclick: onClick,
    }, [
      icon("link"),
      count ? `Sources (${count})` : "Sources",
    ]);
  }

  function suggestionChip(label, onClick) {
    return el("button", { type: "button", class: "suggestion-chip", onclick: () => onClick && onClick(label) }, [label]);
  }

  function referenceCard(ref) {
    const scorePct = typeof ref.score === "number" ? Math.round(ref.score * 100) : null;
    return el("div", { class: "reference-card" }, [
      el("div", { class: "flex items-center justify-between gap-2" }, [
        el("p", { class: "text-xs font-semibold truncate" }, [ref.source_title || "Source"]),
        scorePct !== null ? el("span", { class: "text-[11px] text-faint flex-none" }, [`${scorePct}% match`]) : null,
      ]),
      el("div", { class: "flex items-center gap-2 mt-1 text-[11px] text-muted" }, [
        ref.source_type ? el("span", { class: "capitalize" }, [sourceTypeMeta(ref.source_type).label]) : null,
        ref.chunk_index !== undefined && ref.chunk_index !== null
          ? el("span", {}, [`Chunk #${ref.chunk_index}`])
          : ref.chunk_id
          ? el("span", {}, [`Chunk ${ref.chunk_id}`])
          : null,
      ]),
      ref.excerpt ? el("p", { class: "text-xs text-[var(--ink-700)] mt-2 line-clamp-3" }, [ref.excerpt]) : null,
    ]);
  }

  /* ------------------------------- Search/filter ---------------------------- */

  function searchFilterControls({ onSearch, onTypeChange, onStatusChange, types = [], statuses = [] }) {
    const search = el("input", {
      type: "search",
      class: "input pl-9",
      placeholder: "Search sources by name or origin…",
      "aria-label": "Search sources",
      oninput: (e) => onSearch && onSearch(e.target.value),
    });

    const searchWrap = el("div", { class: "relative" }, [
      el("span", { class: "absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" }, [icon("search")]),
      search,
    ]);

    const typeSelect = el("select", { class: "select", "aria-label": "Filter by source type", onchange: (e) => onTypeChange && onTypeChange(e.target.value) }, [
      el("option", { value: "" }, ["All types"]),
      ...types.map((t) => el("option", { value: t }, [sourceTypeMeta(t).label])),
    ]);

    const statusSelect = el("select", { class: "select", "aria-label": "Filter by status", onchange: (e) => onStatusChange && onStatusChange(e.target.value) }, [
      el("option", { value: "" }, ["All statuses"]),
      ...statuses.map((s) => el("option", { value: s }, [STATUS_META[s] ? STATUS_META[s].label : s])),
    ]);

    const wrap = el("div", { class: "grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3" }, [
      searchWrap,
      typeSelect,
      statusSelect,
    ]);

    return { node: wrap, searchInput: search, typeSelect, statusSelect };
  }

  /* --------------------------------- Forms ---------------------------------- */

  function urlForm({ onSubmit, submitting = false }) {
    const input = el("input", {
      type: "url",
      class: "input",
      placeholder: "https://example.com/article",
      "aria-label": "Website URL",
      required: true,
    });
    const errorSlot = el("div", {});
    const submitBtn = el("button", { class: "btn btn-primary", type: "submit" }, [icon("plus"), "Add source"]);

    const form = el("form", {
      class: "space-y-3",
      onsubmit: (e) => {
        e.preventDefault();
        onSubmit && onSubmit(input.value.trim(), { input, errorSlot, submitBtn });
      },
    }, [
      el("div", {}, [
        el("label", { class: "field-label", for: "url-input" }, ["Website URL"]),
        input,
        errorSlot,
        el("p", { class: "field-hint" }, ["Public http:// or https:// pages only. The page will be crawled and chunked automatically."]),
      ]),
      submitBtn,
    ]);
    input.id = "url-input";
    return { node: form, input, errorSlot, submitBtn };
  }

  function uploadForm({ onSubmit }) {
    const fileInput = el("input", { type: "file", class: "hidden", accept: ".pdf,.txt,.md", "aria-label": "Choose file to upload" });
    const fileInfo = el("div", { class: "hidden text-xs text-muted mt-3 flex items-center justify-between gap-2 bg-sunken rounded-lg px-3 py-2" });
    const errorSlot = el("div", {});
    const progressWrap = el("div", { class: "hidden mt-3" }, [
      el("div", { class: "w-full h-1.5 rounded-full bg-sunken overflow-hidden" }, [
        el("div", { class: "h-full bg-[var(--brand-600)] transition-all", style: "width:0%" }),
      ]),
    ]);
    const submitBtn = el("button", { class: "btn btn-primary", type: "submit", disabled: true }, [icon("upload"), "Upload document"]);

    const dropzone = el("div", {
      class: "dropzone px-5 py-8 text-center cursor-pointer",
      role: "button",
      tabindex: "0",
      "aria-label": "Choose a file to upload",
      onclick: () => fileInput.click(),
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } },
      ondragover: (e) => { e.preventDefault(); dropzone.classList.add("is-dragover"); },
      ondragleave: () => dropzone.classList.remove("is-dragover"),
      ondrop: (e) => {
        e.preventDefault();
        dropzone.classList.remove("is-dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event("change"));
        }
      },
    }, [
      el("div", { class: "flex flex-col items-center gap-2 text-muted pointer-events-none" }, [
        icon("upload", "text-[var(--brand-600)]"),
        el("p", { class: "text-sm font-medium text-[var(--ink-900)]" }, ["Click to browse or drag a file here"]),
        el("p", { class: "text-xs" }, ["PDF, TXT, or Markdown — up to the configured size limit"]),
      ]),
    ]);

    let selectedFile = null;

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      errorSlot.innerHTML = "";
      if (!file) {
        selectedFile = null;
        fileInfo.classList.add("hidden");
        submitBtn.disabled = true;
        return;
      }
      selectedFile = file;
      fileInfo.classList.remove("hidden");
      fileInfo.textContent = "";
      fileInfo.appendChild(el("span", { class: "truncate font-medium text-[var(--ink-900)]" }, [file.name]));
      fileInfo.appendChild(el("span", { class: "flex-none" }, [`${formatBytes(file.size)}`]));
      submitBtn.disabled = false;
    });

    const form = el("form", {
      class: "space-y-1",
      onsubmit: (e) => {
        e.preventDefault();
        if (!selectedFile) return;
        onSubmit && onSubmit(selectedFile, { form, fileInput, fileInfo, errorSlot, progressWrap, submitBtn });
      },
    }, [dropzone, fileInput, fileInfo, errorSlot, progressWrap, el("div", { class: "mt-3" }, [submitBtn])]);

    return { node: form, fileInput, fileInfo, errorSlot, progressWrap, submitBtn, getFile: () => selectedFile, reset: () => {
      selectedFile = null;
      fileInput.value = "";
      fileInfo.classList.add("hidden");
      submitBtn.disabled = true;
      progressWrap.classList.add("hidden");
      progressWrap.querySelector("div > div").style.width = "0%";
    } };
  }

  function setUploadProgress(progressWrap, pct) {
    progressWrap.classList.remove("hidden");
    const bar = progressWrap.querySelector("div > div");
    if (bar) bar.style.width = `${pct}%`;
  }

  /* --------------------------------- Export --------------------------------- */

  global.UI = {
    el,
    escapeHtml,
    icon,
    formatDate,
    formatTime,
    formatBytes,
    formatNumber,
    sourceTypeMeta,
    STATUS_META,
    statusBadge,
    statCard,
    sourceCard,
    emptyState,
    loadingIndicator,
    skeletonCard,
    errorAlert,
    inlineNotice,
    toast,
    confirmModal,
    referencesModal,
    chatMessage,
    sourcesButton,
    suggestionChip,
    referenceCard,
    searchFilterControls,
    urlForm,
    uploadForm,
    setUploadProgress,
  };
})(window);
