# Sourcebound — Frontend

Plain HTML5 + Tailwind CSS (CDN) + vanilla JavaScript. No build step, no
frontend framework.

## Running it

Serve this folder as static files — any static server works, for example:

```bash
cd frontend
python -m http.server 5500
```

Then open `http://127.0.0.1:5500` in a browser. Opening the HTML files
directly via `file://` also works for most features, but a local server is
recommended (some browsers restrict `fetch`/localStorage on `file://`).

## Talking to the backend

The frontend never calls anything except the FastAPI backend, via
`assets/js/api.js`. The backend base URL is configured per page through:

```html
<script>
  window.APP_CONFIG = { BACKEND_URL: "http://127.0.0.1:8000" };
</script>
```

This is set at the top of every HTML page, before `api.js` loads. Change it
if the backend runs on a different host/port. Start the backend separately
(see `../backend`) — the dashboard and every page's top bar shows a live
"Backend connected / unreachable" indicator, and Settings shows full health
details.

## Structure

- `index.html` — redirects to `dashboard.html`
- `dashboard.html`, `sources.html`, `source-details.html`, `chat.html`, `settings.html`
- `assets/css/styles.css` — design tokens + component classes (Tailwind CDN handles utilities)
- `assets/js/api.js` — the only file that calls `fetch`/`XMLHttpRequest`
- `assets/js/components.js` — reusable render functions (cards, badges, forms, toasts, modal, chat bubbles, etc.)
- `assets/js/navigation.js` — the one shared sidebar/topbar shell
- `assets/js/app.js` — settings/localStorage helpers, theme bootstrap
- `assets/js/sources.js`, `assets/js/chat.js`, `assets/js/settings.js` — page logic

## Notes

- All API responses/user text are inserted via `textContent`/DOM APIs, never `innerHTML` with untrusted content.
- Chat history is kept client-side in `localStorage`, keyed per source, alongside the `conversation_id` returned by the backend.
