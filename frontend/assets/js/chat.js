/**
 * chat.js — Chat page: source selection, sending messages, rendering
 * history and references, and clear-chat. All network calls go through
 * Api (api.js); all rendering goes through UI (components.js).
 *
 * State-machine notes (see task.md sections 9, 10, 17):
 *  - thinkingIndicator: created right before the Api.chat() call, its
 *    destroy() is called in a `finally` block, so it is removed on success,
 *    error and abort alike. There is exactly one indicator instance per
 *    in-flight request (guarded by `activeIndicator`).
 *  - sources modal: never constructed until the user clicks a
 *    UI.sourcesButton. No render path opens it implicitly.
 */
(function () {
  "use strict";

  if (document.body.firstChild) {
    document.body.insertBefore(UI.skipLink("main-content"), document.body.firstChild);
  }

  Nav.render({
    active: "chat",
    title: "Chat",
    description: "Ask questions about a ready source and get grounded, referenced answers.",
    breadcrumb: [{ label: "Workspace", href: "app.html" }, { label: "Chat" }],
  });

  // The chat page is a dedicated conversation surface: the full app sidebar
  // would constrain the available width, so collapse it to icons on desktop.
  // This is a page-local, non-persisted presentation choice — it does not
  // touch the user's saved sidebar preference used on other pages.
  (function collapseSidebarForChat() {
    const sidebarRoot = document.getElementById("sidebar-root");
    if (!sidebarRoot) return;
    sidebarRoot.classList.remove("is-hidden-desktop");
    sidebarRoot.classList.add("is-collapsed");
    const openBtn = document.querySelector(".sidebar-open-btn");
    if (openBtn) openBtn.classList.add("hidden");
  })();

  const sourceSelect = document.getElementById("source-select");
  const sourceTypeIcon = document.getElementById("source-type-icon");
  const processingNotice = document.getElementById("source-processing-notice");
  const scrollArea = document.getElementById("chat-scroll");
  const messagesWrap = document.getElementById("chat-messages");
  const emptyWrap = document.getElementById("chat-empty");
  const errorSlot = document.getElementById("chat-error-slot");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send-btn");
  const clearBtn = document.getElementById("clear-chat-btn");

  let sources = [];
  let selectedSource = null;
  let conversation = { id: null, messages: [] };
  let requestInFlight = false;

  function genId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getPreselectedSourceId() {
    return new URLSearchParams(window.location.search).get("source");
  }

  function updateSendState() {
    const hasMessage = input.value.trim().length > 0;
    const sourceReady = selectedSource && selectedSource.status === "ready";
    sendBtn.disabled = !hasMessage || !sourceReady || requestInFlight;
  }

  function autoResize() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
  }

  function renderProcessingNotice() {
    processingNotice.innerHTML = "";
    if (!selectedSource) {
      processingNotice.classList.add("hidden");
      return;
    }
    if (selectedSource.status === "ready") {
      processingNotice.classList.add("hidden");
      return;
    }
    processingNotice.classList.remove("hidden");
    const toneMap = { processing: "warning", pending: "warning", failed: "error" };
    const messageMap = {
      processing: "This source is still processing. You can send messages once it finishes.",
      pending: "This source is queued for processing. Chat will unlock once it's ready.",
      failed: selectedSource.error
        ? `This source failed to process: ${selectedSource.error}`
        : "This source failed to process and can't be used for chat.",
    };
    processingNotice.appendChild(
      UI.inlineNotice({ tone: toneMap[selectedSource.status] || "warning", message: messageMap[selectedSource.status] || "This source isn't ready for chat yet." })
    );
  }

  function renderEmptyState() {
    emptyWrap.innerHTML = "";
    if (conversation.messages.length) {
      emptyWrap.classList.add("hidden");
      return;
    }
    emptyWrap.classList.remove("hidden");
    if (!sources.length) {
      emptyWrap.appendChild(
        UI.emptyState({
          icon: "inbox",
          title: "No sources available yet",
          message: "Add a website or document first, then come back here to chat with it.",
          actionLabel: "Add a source",
          onAction: () => (window.location.href = "sources.html"),
        })
      );
    } else if (!selectedSource) {
      emptyWrap.appendChild(
        UI.emptyState({
          icon: "chat",
          title: "Ask your knowledge base anything",
          message: "Select a ready source above, then ask a question to get a grounded answer with references.",
        })
      );
    } else if (selectedSource.status !== "ready") {
      emptyWrap.appendChild(
        UI.emptyState({
          icon: "clock",
          title: "This source isn't ready yet",
          message: "Once processing finishes you'll be able to chat with it here.",
        })
      );
    } else {
      emptyWrap.appendChild(
        UI.emptyState({
          icon: "chat",
          title: "Ask your knowledge base anything",
          message: `Answers are grounded in "${selectedSource.title || "this source"}" only, with references you can open below each reply.`,
        })
      );
      const chips = [
        `Summarize ${selectedSource.title || "this source"} in a few sentences`,
        "What are the key points?",
        "Are there any important dates or numbers mentioned?",
      ];
      const chipWrap = UI.el("div", { class: "flex flex-wrap items-center justify-center gap-2 mt-5 mb-4" });
      chips.forEach((c) => chipWrap.appendChild(UI.suggestionChip(c, (text) => {
        input.value = text;
        autoResize();
        updateSendState();
        input.focus();
      })));
      emptyWrap.appendChild(chipWrap);
    }
  }

  function renderMessages() {
    messagesWrap.innerHTML = "";
    conversation.messages.forEach((message) => {
      const row = UI.chatMessage({
        role: message.role,
        text: message.text,
        timestamp: message.timestamp,
        pending: message.pending,
      });
      if (message.role === "assistant" && !message.pending && message.references && message.references.length) {
        // Sources modal is only ever constructed inside this onClick handler —
        // never on render, never on load. isSourcesModalOpen effectively stays
        // false until the user actually clicks this button.
        const sourcesBtn = UI.sourcesButton(message.references.length, () => {
          UI.sourcesModal({ title: `Sources (${message.references.length})`, references: message.references });
        });
        row.lastElementChild.appendChild(sourcesBtn);
      }
      messagesWrap.appendChild(row);
    });
    renderEmptyState();
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }

  function persist() {
    if (selectedSource) App.saveConversation(selectedSource.id, conversation);
  }

  function loadConversationFor(sourceId) {
    const stored = App.getConversations()[sourceId];
    conversation = stored && stored.messages ? stored : { id: genId("conversation"), messages: [] };
  }

  /* -------------------------------- Source select ------------------------------ */

  function populateSourceSelect() {
    sourceSelect.innerHTML = "";
    const readySources = sources.filter((s) => s.status === "ready");
    if (!sources.length) {
      sourceSelect.appendChild(UI.el("option", { value: "" }, ["No sources available"]));
      sourceSelect.disabled = true;
      return;
    }
    sourceSelect.disabled = false;
    sourceSelect.appendChild(UI.el("option", { value: "" }, ["Select a source…"]));
    if (readySources.length) {
      const readyGroup = UI.el("optgroup", { label: "Ready" });
      readySources.forEach((s) => readyGroup.appendChild(UI.el("option", { value: s.id }, [s.title || s.origin || s.id])));
      sourceSelect.appendChild(readyGroup);
    }
    const notReady = sources.filter((s) => s.status !== "ready");
    if (notReady.length) {
      const notReadyGroup = UI.el("optgroup", { label: "Not ready yet" });
      notReady.forEach((s) =>
        notReadyGroup.appendChild(
          UI.el("option", { value: s.id }, [`${s.title || s.origin || s.id} (${s.status})`])
        )
      );
      sourceSelect.appendChild(notReadyGroup);
    }
  }

  function selectSource(sourceId) {
    selectedSource = sources.find((s) => s.id === sourceId) || null;
    sourceSelect.value = selectedSource ? selectedSource.id : "";
    errorSlot.innerHTML = "";
    if (selectedSource) loadConversationFor(selectedSource.id);
    else conversation = { id: null, messages: [] };
    if (sourceTypeIcon) {
      sourceTypeIcon.innerHTML = "";
      if (selectedSource) {
        sourceTypeIcon.classList.remove("hidden");
        sourceTypeIcon.appendChild(UI.icon(UI.sourceTypeMeta(selectedSource.source_type).icon));
      } else {
        sourceTypeIcon.classList.add("hidden");
      }
    }
    renderProcessingNotice();
    renderMessages();
    updateSendState();
  }

  sourceSelect.addEventListener("change", () => {
    selectSource(sourceSelect.value);
  });

  /* ---------------------------------- Sending ----------------------------------- */

  async function sendMessage(text) {
    if (!selectedSource || selectedSource.status !== "ready") return;

    const userMessage = { id: genId("msg"), role: "user", text, timestamp: new Date().toISOString() };
    conversation.messages.push(userMessage);
    renderMessages();
    persist();

    requestInFlight = true;
    updateSendState();
    errorSlot.innerHTML = "";

    const settings = App.getSettings();

    // Thinking/searching indicator: created immediately, destroyed in
    // `finally` so it can never survive success, error, or abort. It is
    // appended into the message list (as a temporary node, not a persisted
    // conversation message) so it scrolls with the conversation.
    const indicator = UI.thinkingIndicator();
    indicator.setPhase("thinking");
    messagesWrap.appendChild(indicator.node);
    scrollArea.scrollTop = scrollArea.scrollHeight;

    let searchingTimer = window.setTimeout(() => {
      // Retrieval genuinely happens server-side as part of this single
      // request; we don't get a separate "retrieval started" event, so the
      // best honest signal available client-side is "the request is still
      // in flight past the first moment" — flip to "searching" once, and
      // only while the request is still outstanding.
      if (requestInFlight) indicator.setPhase("searching");
    }, 500);

    try {
      const response = await Api.chat({
        source_id: selectedSource.id,
        message: text,
        conversation_id: conversation.id,
        top_k: settings.topK,
        response_style: settings.chatStyle,
      });

      const answer = (response && response.answer) || "No answer was returned.";
      const references = (response && response.references) || [];
      if (response && response.conversation_id) conversation.id = response.conversation_id;

      conversation.messages.push({
        id: genId("msg"),
        role: "assistant",
        text: answer,
        references,
        timestamp: new Date().toISOString(),
      });
      renderMessages();
      persist();
    } catch (err) {
      renderMessages();
      persist();

      const message =
        err.kind === "network"
          ? "The backend could not be reached. Check that it's running and try again."
          : err.kind === "notfound"
          ? "This source could not be found. It may have been deleted."
          : err.message || "Something went wrong while generating an answer.";

      errorSlot.appendChild(
        UI.errorAlert({
          title: "Couldn't get a response",
          message,
          onRetry: () => {
            errorSlot.innerHTML = "";
            sendMessage(text);
          },
        })
      );
      UI.toast(message, "error");
    } finally {
      window.clearTimeout(searchingTimer);
      indicator.destroy();
      requestInFlight = false;
      updateSendState();
      input.focus();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || sendBtn.disabled) return;
    input.value = "";
    autoResize();
    updateSendState();
    sendMessage(text);
  });

  input.addEventListener("input", () => {
    autoResize();
    updateSendState();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sendBtn.disabled) form.requestSubmit();
    }
  });

  clearBtn.addEventListener("click", () => {
    if (!selectedSource) return;
    if (!conversation.messages.length) return;
    UI.confirmModal({
      title: "Clear this conversation?",
      message: "The message history for this source will be removed from this browser.",
      confirmLabel: "Clear chat",
      danger: true,
      onConfirm: () => {
        conversation = { id: genId("conversation"), messages: [] };
        persist();
        renderMessages();
        UI.toast("Conversation cleared.", "success");
      },
    });
  });

  /* ----------------------------------- Load -------------------------------------- */

  async function loadSources() {
    try {
      const data = await Api.listSources();
      sources = (data && data.sources) || [];
      populateSourceSelect();

      const preselect = getPreselectedSourceId();
      if (preselect && sources.some((s) => s.id === preselect)) {
        selectSource(preselect);
      } else {
        renderEmptyState();
        updateSendState();
      }
    } catch (err) {
      const message =
        err.kind === "network"
          ? "The backend could not be reached. Start the API server and try again."
          : err.message || "Could not load your sources.";
      emptyWrap.innerHTML = "";
      emptyWrap.appendChild(UI.errorAlert({ title: "Could not load sources", message, onRetry: loadSources }));
    }
  }

  loadSources();
})();
