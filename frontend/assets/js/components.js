/**
 * components.js — reusable render functions shared by every page.
 * Everything builds DOM nodes via document.createElement / textContent
 * (never innerHTML with API/user content) so untrusted text can never be
 * interpreted as markup.
 *
 * Exports a single global: window.UI (vanilla JS IIFE, no build step).
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

  /* -------------------------------- Icons --------------------------------- */

  function icon(name, cls) {
    // Inline stroke SVG icon set — 1.75px stroke, 24 viewBox, consistent family.
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
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
      sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m7 7 2 2M15 15l2 2M17 7l-2 2M9 15l-2 2"/>',
      shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/>',
      bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
      book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z"/><path d="M20 19H6.5A2.5 2.5 0 0 0 4 21.5"/>',
      folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
      database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
      history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 3"/>',
      chart: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7"/><path d="M12 17h.01"/>',
      sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
      plug: '<path d="M9 2v6M15 2v6M7 8h10l-1 6a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4Z"/><path d="M12 18v4"/>',
      filter: '<path d="M4 5h16l-6.5 8v5l-3 2v-7Z"/>',
      sort: '<path d="M6 4v16M6 4 3 7M6 4l3 3M18 20V4M18 20l3-3M18 20l-3-3"/>',
      more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
      send: '<path d="m3 11 18-8-8 18-2-8-8-2Z"/>',
      arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
      external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
      command: '<path d="M9 3a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2H3v2a2 2 0 0 1 2-2h2a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2v2a2 2 0 0 0-2-2h-2a2 2 0 0 1-2 2v2a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>',
      refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
      download: '<path d="M12 4v12m0 0 4-4m-4 4-4-4"/><path d="M4 20h16"/>',
      tag: '<path d="M20.6 12.6 12 21.2 2.8 12 2.8 2.8 12 2.8Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
      grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
      list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
      message: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
      cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
      quote: '<path d="M7 8a3 3 0 0 0-3 3v2h4v-5Z"/><path d="M17 8a3 3 0 0 0-3 3v2h4v-5Z"/>',
      star: '<path d="m12 3 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 21l1.2-6.5-4.8-4.6L9.1 9Z"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6.5 8 6 8-6"/>',
      github: '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/>',
      x: '<path d="M18 6 6 18M6 6l12 12"/>',
      chevronDown: '<path d="m6 9 6 6 6-6"/>',
      chevronLeft: '<path d="m15 18-6-6 6-6"/>',
      panelLeft: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
      bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/>',
      filePdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 15h1.5a1.5 1.5 0 0 0 0-3H8v5M12.5 12v5h1a2 2 0 0 0 0-4h-1M17.5 12v5M17.5 14.3h1.6"/>',
      bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>',
      key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.9 12.1 8.6-8.6M16 8l2 2M19 5l2 2"/>',
      lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
      activity: '<path d="M22 12h-4l-3 9-6-18-3 9H2"/>',
      trendUp: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
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

  function relativeTime(iso) {
    if (!iso) return "Unknown";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    if (diffSec < 5) return "Just now";
    const units = [
      ["year", 31536000],
      ["month", 2592000],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];
    if (diffSec < 30 * 86400) {
      for (const [name, secs] of units) {
        const value = Math.floor(diffSec / secs);
        if (value >= 1) return `${value} ${name}${value === 1 ? "" : "s"} ago`;
      }
      return `${diffSec} second${diffSec === 1 ? "" : "s"} ago`;
    }
    return formatDate(iso);
  }

  const SOURCE_TYPE_META = {
    url: { label: "Website", icon: "globe" },
    website: { label: "Website", icon: "globe" },
    pdf: { label: "PDF", icon: "filePdf" },
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
    const typeMeta = sourceTypeMeta(source.source_type || source.type);
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

  function sourceRow(source, { onOpenChat, onViewDetails, onDelete } = {}) {
    const typeMeta = sourceTypeMeta(source.source_type || source.type);
    const isReady = source.status === "ready";
    const menuTrigger = el("button", {
      class: "icon-btn",
      "aria-label": `Actions for ${source.title || "source"}`,
      title: "Actions",
    }, [icon("more")]);

    dropdownMenu({
      trigger: menuTrigger,
      items: [
        { label: "Open chat", icon: "chat", onSelect: () => isReady && onOpenChat && onOpenChat(source) },
        { label: "View details", icon: "eye", onSelect: () => onViewDetails && onViewDetails(source) },
        { label: "Delete", icon: "trash", danger: true, onSelect: () => onDelete && onDelete(source) },
      ],
    });

    const row = el("tr", { class: "data-table-row" }, [
      el("td", {}, [
        el("div", { class: "flex items-center gap-3 min-w-0" }, [
          el("span", { class: "w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-[var(--brand-600)] flex-none" }, [icon(typeMeta.icon)]),
          el("div", { class: "min-w-0" }, [
            el("p", { class: "font-medium truncate", title: source.title || "" }, [source.title || "Untitled source"]),
            el("p", { class: "text-xs text-faint truncate", title: source.origin || "" }, [source.origin || ""]),
          ]),
        ]),
      ]),
      el("td", {}, [statusBadge(source.status)]),
      el("td", { class: "text-muted" }, [`${formatNumber(source.chunk_count)} chunks`]),
      el("td", { class: "text-muted" }, [relativeTime(source.created_at)]),
      el("td", { class: "text-right" }, [menuTrigger]),
    ]);
    return row;
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
    return el("div", { class: "flex flex-col items-center justify-center py-14 gap-3 text-muted text-sm", role: "status", "aria-live": "polite" }, [
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
    const node = el("div", { class: "toast", role: type === "error" ? "alert" : "status" }, [
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

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let openModalCount = 0;

  function lockScroll() {
    openModalCount += 1;
    if (openModalCount === 1) document.body.style.overflow = "hidden";
  }
  function unlockScroll() {
    openModalCount = Math.max(0, openModalCount - 1);
    if (openModalCount === 0) document.body.style.overflow = "";
  }

  /**
   * UI.modal — generic accessible dialog primitive; the base every other
   * modal in this file builds on.
   * Returns { node, close() }. Never opens itself — caller mounts it.
   */
  function modal({ title, body, footer, size = "md", labelledBy, onClose }) {
    const root = ensureModalRoot();
    const previouslyFocused = document.activeElement;
    const titleId = labelledBy || `modal-title-${Math.random().toString(36).slice(2, 9)}`;

    const sizeCls = size === "sm" ? "" : size === "lg" ? "modal-panel-wide" : "modal-panel-wide";
    // sm keeps the default (26rem) modal-panel width; md/lg use the wide variant.
    const panelCls = `modal-panel ${size === "sm" ? "" : "modal-panel-wide"}`.trim();

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKeydown, true);
      backdrop.remove();
      unlockScroll();
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
      onClose && onClose();
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key === "Tab") {
        const focusables = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
          (elm) => elm.offsetParent !== null || elm === document.activeElement
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    const headerRow = title
      ? el("div", { class: "flex items-start justify-between gap-3" }, [
          el("h2", { id: titleId, class: "font-display font-semibold text-base" }, [title]),
          el("button", { class: "icon-btn flex-none -mr-1 -mt-1", "aria-label": "Close dialog", onclick: close }, [icon("close")]),
        ])
      : null;

    const panel = el(
      "div",
      {
        class: panelCls,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": titleId,
        tabindex: "-1",
      },
      [headerRow, body ? el("div", { class: title ? "mt-4" : "" }, [body]) : null, footer ? el("div", { class: "mt-6" }, [footer]) : null]
    );

    const backdrop = el(
      "div",
      {
        class: "modal-backdrop",
        onclick: (e) => {
          if (e.target === backdrop) close();
        },
      },
      [panel]
    );

    document.addEventListener("keydown", onKeydown, true);
    lockScroll();
    root.appendChild(backdrop);
    panel.focus();

    return { node: backdrop, close };
  }

  function confirmModal({ title = "Are you sure?", message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm }) {
    let dialog;
    const body = message ? el("p", { class: "text-sm text-muted" }, [message]) : null;
    const footer = el("div", { class: "flex items-center justify-end gap-2" }, [
      el("button", { class: "btn btn-secondary", onclick: () => dialog.close() }, [cancelLabel]),
      el("button", {
        class: danger ? "btn btn-danger" : "btn btn-primary",
        onclick: () => {
          dialog.close();
          onConfirm && onConfirm();
        },
      }, [confirmLabel]),
    ]);
    dialog = modal({ title, body, footer, size: "sm" });
    return dialog.close;
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

  /**
   * UI.sourcesModal — titled "Sources (N)"; scrollable list of reference
   * cards for one answer. Opens only from an explicit click on
   * UI.sourcesButton. Default closed; caller decides when to construct it.
   */
  function sourcesModal({ references = [], title } = {}) {
    const heading = title || `Sources (${references.length})`;
    const body = el("div", { class: "space-y-2.5 max-h-[60vh] overflow-y-auto pr-1" },
      references.length
        ? references.map((ref) => referenceCard(ref))
        : [el("p", { class: "text-sm text-muted" }, ["No specific source passages were referenced for this answer."])]
    );
    return modal({ title: heading, body, size: "md" });
  }

  // Kept alias per frozen API — same shape, different default title.
  function referencesModal({ title = "Sources for this answer", references = [] } = {}) {
    return sourcesModal({ references, title });
  }

  /**
   * UI.thinkingIndicator — subtle "Thinking…" / "Searching your sources…"
   * status row. Caller MUST call destroy() in a finally block so it can
   * never outlive the request (including on error/abort).
   */
  function thinkingIndicator() {
    const label = el("span", {}, ["Thinking..."]);
    const dots = el("span", { class: "inline-flex items-center gap-1", "aria-hidden": "true" }, [
      el("span", { class: "w-1.5 h-1.5 rounded-full bg-current thinking-dot" }),
      el("span", { class: "w-1.5 h-1.5 rounded-full bg-current thinking-dot", style: "animation-delay:150ms" }),
      el("span", { class: "w-1.5 h-1.5 rounded-full bg-current thinking-dot", style: "animation-delay:300ms" }),
    ]);
    const node = el("div", { class: "chat-row", role: "status", "aria-live": "polite" }, [
      el("div", { class: "chat-avatar chat-avatar-assistant", "aria-hidden": "true" }, [icon("chat", "w-4 h-4")]),
      el("div", { class: "chat-bubble chat-bubble-assistant inline-flex items-center gap-2 text-muted" }, [label, dots]),
    ]);

    let destroyed = false;
    function setPhase(phase) {
      if (destroyed) return;
      label.textContent = phase === "searching" ? "Searching your sources..." : "Thinking...";
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      node.remove();
    }
    return { node, setPhase, destroy };
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
              onclick: async () => {
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
    const submitBtn = el("button", { class: "btn btn-primary", type: "submit", disabled: submitting || undefined }, [icon("plus"), "Add website"]);

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
      progressBar(0, "Upload progress"),
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

    function clearFile() {
      selectedFile = null;
      fileInput.value = "";
      fileInfo.classList.add("hidden");
      fileInfo.textContent = "";
      submitBtn.disabled = true;
    }

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      errorSlot.innerHTML = "";
      if (!file) {
        clearFile();
        return;
      }
      selectedFile = file;
      fileInfo.classList.remove("hidden");
      fileInfo.textContent = "";
      fileInfo.appendChild(el("span", { class: "truncate font-medium text-[var(--ink-900)]" }, [file.name]));
      fileInfo.appendChild(el("span", { class: "flex-none flex items-center gap-2" }, [
        `${formatBytes(file.size)}`,
        el("button", {
          type: "button",
          class: "icon-btn",
          "aria-label": "Remove selected file",
          onclick: (e) => { e.stopPropagation(); clearFile(); },
        }, [icon("close")]),
      ]));
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

    return {
      node: form,
      fileInput,
      fileInfo,
      errorSlot,
      progressWrap,
      submitBtn,
      getFile: () => selectedFile,
      reset: () => {
        clearFile();
        progressWrap.classList.add("hidden");
        setUploadProgress(progressWrap, 0);
      },
    };
  }

  function setUploadProgress(progressWrap, pct) {
    progressWrap.classList.remove("hidden");
    const track = progressWrap.querySelector(".progress-track");
    const fill = progressWrap.querySelector(".progress-fill");
    if (fill) fill.style.width = `${pct}%`;
    if (track) {
      track.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
  }

  /**
   * UI.progressBar — determinate bar with role="progressbar".
   */
  function progressBar(pct = 0, label) {
    const clamped = Math.max(0, Math.min(100, pct));
    return el("div", {}, [
      label ? el("p", { class: "text-xs text-muted mb-1.5" }, [label]) : null,
      el("div", {
        class: "progress-track",
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": String(Math.round(clamped)),
        "aria-label": label || "Progress",
      }, [
        el("div", { class: "progress-fill", style: `width:${clamped}%` }),
      ]),
    ]);
  }

  /**
   * UI.segmented — roving-tabindex tablist used by the add-source modal and
   * anywhere a two/three-way switch is needed.
   */
  function segmented({ options = [], value, onChange }) {
    let current = value !== undefined ? value : options[0] && options[0].value;
    const buttons = [];

    function render() {
      buttons.forEach((btn, i) => {
        const opt = options[i];
        const selected = opt.value === current;
        btn.setAttribute("aria-selected", selected ? "true" : "false");
        btn.tabIndex = selected ? 0 : -1;
      });
    }

    function focusIndex(i) {
      const len = buttons.length;
      const idx = (i + len) % len;
      buttons[idx].focus();
    }

    const wrap = el("div", { class: "segmented", role: "tablist" }, options.map((opt, i) => {
      const btn = el("button", {
        type: "button",
        class: "segmented-option",
        role: "tab",
        "aria-selected": opt.value === current ? "true" : "false",
        tabindex: opt.value === current ? "0" : "-1",
        onclick: () => {
          current = opt.value;
          render();
          onChange && onChange(current);
        },
        onkeydown: (e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); focusIndex(i + 1); }
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); focusIndex(i - 1); }
          else if (e.key === "Home") { e.preventDefault(); focusIndex(0); }
          else if (e.key === "End") { e.preventDefault(); focusIndex(buttons.length - 1); }
        },
      }, [opt.icon ? icon(opt.icon) : null, opt.label]);
      buttons.push(btn);
      return btn;
    }));

    return wrap;
  }

  /**
   * UI.dropdownMenu — keyboard-navigable menu anchored to trigger.
   * items: [{ label, icon, danger, onSelect }]
   */
  function dropdownMenu({ trigger, items = [] }) {
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");

    let menuEl = null;
    let itemEls = [];

    function close() {
      if (!menuEl) return;
      menuEl.remove();
      menuEl = null;
      itemEls = [];
      trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onDocKeydown, true);
    }

    function onDocClick(e) {
      if (menuEl && !menuEl.contains(e.target) && e.target !== trigger) close();
    }

    function focusIndex(i) {
      if (!itemEls.length) return;
      const idx = (i + itemEls.length) % itemEls.length;
      itemEls[idx].focus();
    }

    function onDocKeydown(e) {
      if (!menuEl) return;
      if (e.key === "Escape") { e.preventDefault(); close(); trigger.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); focusIndex((itemEls.indexOf(document.activeElement) + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); focusIndex((itemEls.indexOf(document.activeElement) - 1)); }
      else if (e.key === "Home") { e.preventDefault(); focusIndex(0); }
      else if (e.key === "End") { e.preventDefault(); focusIndex(itemEls.length - 1); }
    }

    function open() {
      if (menuEl) return;
      menuEl = el("div", { class: "dropdown-menu", role: "menu" }, items.map((item) => {
        const btn = el("button", {
          type: "button",
          class: `dropdown-item${item.danger ? " is-danger" : ""}`,
          role: "menuitem",
          onclick: () => {
            close();
            item.onSelect && item.onSelect();
          },
        }, [item.icon ? icon(item.icon) : null, item.label]);
        return btn;
      }));
      itemEls = Array.from(menuEl.querySelectorAll(".dropdown-item"));

      document.body.appendChild(menuEl);
      const rect = trigger.getBoundingClientRect();
      menuEl.style.position = "fixed";
      menuEl.style.top = `${rect.bottom + 6}px`;
      const menuWidth = menuEl.offsetWidth || 176;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      menuEl.style.left = `${left}px`;

      trigger.setAttribute("aria-expanded", "true");
      document.addEventListener("click", onDocClick, true);
      document.addEventListener("keydown", onDocKeydown, true);
      if (itemEls[0]) itemEls[0].focus();
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menuEl) close();
      else open();
    });

    return { open, close };
  }

  /**
   * UI.skipLink — visually-hidden-until-focused skip link. Caller inserts
   * it as the first child of <body>.
   */
  function skipLink(targetId) {
    return el("a", { href: `#${targetId}`, class: "skip-link" }, ["Skip to main content"]);
  }

  /* ------------------------------ Add-source modal --------------------------- */

  /**
   * UI.addSourceModal — centered modal, hidden until called. Segmented
   * control switches between a Website URL panel and a Document upload
   * panel. Reuses UI.urlForm / UI.uploadForm for validation. Calls
   * onAdded(source) after a successful add, then closes.
   */
  function addSourceModal({ onAdded } = {}) {
    let dialog;
    let mode = "url";

    const panelHost = el("div", {});

    function renderUrlPanel() {
      panelHost.innerHTML = "";
      const { node, input, errorSlot, submitBtn } = urlForm({
        onSubmit: async (value, ctx) => {
          ctx.errorSlot.innerHTML = "";
          let url;
          try {
            url = new URL(value);
          } catch (err) {
            ctx.errorSlot.appendChild(fieldError("Enter a valid URL, including https://"));
            return;
          }
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            ctx.errorSlot.appendChild(fieldError("Only http:// and https:// URLs are supported."));
            return;
          }
          ctx.submitBtn.disabled = true;
          ctx.submitBtn.textContent = "";
          ctx.submitBtn.appendChild(el("span", { class: "inline-flex items-center gap-2" }, [
            el("span", { class: "w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" }),
            "Adding website...",
          ]));
          try {
            const source = await global.Api.addSourceUrl(value);
            toast("Website added. Indexing has started.", "success");
            dialog.close();
            onAdded && onAdded(source);
          } catch (err) {
            ctx.errorSlot.innerHTML = "";
            ctx.errorSlot.appendChild(fieldError(apiErrorMessage(err)));
            ctx.submitBtn.disabled = false;
            ctx.submitBtn.textContent = "";
            ctx.submitBtn.appendChild(icon("plus"));
            ctx.submitBtn.appendChild(document.createTextNode("Add website"));
          }
        },
      });
      panelHost.appendChild(node);
      input.focus();
    }

    function renderUploadPanel() {
      panelHost.innerHTML = "";
      const { node, errorSlot, progressWrap, submitBtn, reset } = uploadForm({
        onSubmit: async (file, ctx) => {
          ctx.errorSlot.innerHTML = "";
          ctx.submitBtn.disabled = true;
          try {
            const source = await global.Api.uploadSource(file, (pct) => setUploadProgress(ctx.progressWrap, pct));
            toast("Document uploaded. Indexing has started.", "success");
            dialog.close();
            onAdded && onAdded(source);
          } catch (err) {
            ctx.errorSlot.innerHTML = "";
            ctx.errorSlot.appendChild(fieldError(apiErrorMessage(err)));
            ctx.submitBtn.disabled = false;
          }
        },
      });
      panelHost.appendChild(node);
    }

    function fieldError(message) {
      return el("p", { class: "field-error" }, [icon("warning"), message]);
    }

    function apiErrorMessage(err) {
      if (err && err.details && err.details.message) return err.details.message;
      if (err && err.kind === "network") return "Could not reach the server. Check your connection and try again.";
      if (err && err.message) return err.message;
      return "Something went wrong. Please try again.";
    }

    const switcher = segmented({
      options: [
        { value: "url", label: "Website URL", icon: "globe" },
        { value: "upload", label: "Document", icon: "upload" },
      ],
      value: mode,
      onChange: (val) => {
        mode = val;
        if (mode === "url") renderUrlPanel();
        else renderUploadPanel();
      },
    });

    const body = el("div", { class: "space-y-4" }, [switcher, panelHost]);
    dialog = modal({ title: "Add a source", body, size: "md" });
    renderUrlPanel();
    return dialog;
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
    relativeTime,
    sourceTypeMeta,
    STATUS_META,
    statusBadge,
    statCard,
    sourceCard,
    sourceRow,
    emptyState,
    loadingIndicator,
    skeletonCard,
    errorAlert,
    inlineNotice,
    toast,
    modal,
    confirmModal,
    addSourceModal,
    sourcesModal,
    referencesModal,
    thinkingIndicator,
    chatMessage,
    sourcesButton,
    suggestionChip,
    referenceCard,
    searchFilterControls,
    urlForm,
    uploadForm,
    setUploadProgress,
    dropdownMenu,
    skipLink,
    segmented,
    progressBar,
  };
})(window);
