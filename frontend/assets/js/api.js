/**
 * api.js — single Fetch API wrapper for every backend call the frontend
 * makes. No other file should call fetch()/XMLHttpRequest directly.
 *
 * Base URL comes from window.APP_CONFIG.BACKEND_URL (set per page before
 * this script loads), falling back to http://127.0.0.1:8000.
 */
(function (global) {
  "use strict";

  const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

  function getBaseUrl() {
    const configured = global.APP_CONFIG && global.APP_CONFIG.BACKEND_URL;
    return (configured || DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  /**
   * Structured error thrown by every Api method.
   * kind: "network" | "validation" | "notfound" | "backend"
   */
  class ApiError extends Error {
    constructor(message, { status = 0, kind = "backend", details = null } = {}) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.kind = kind;
      this.details = details;
    }
  }

  function extractMessage(data, fallback) {
    if (!data) return fallback;
    if (typeof data.message === "string") return data.message;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail.length) {
      const first = data.detail[0];
      if (first && typeof first.msg === "string") return first.msg;
    }
    if (typeof data.error === "string") return data.error;
    return fallback;
  }

  function kindForStatus(status) {
    if (status === 404) return "notfound";
    if (status === 400 || status === 413 || status === 422) return "validation";
    if (status >= 500) return "backend";
    return "backend";
  }

  async function request(path, { method = "GET", body, headers, signal } = {}) {
    const url = `${getBaseUrl()}${path}`;
    let response;
    try {
      response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...(headers || {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (err) {
      if (err && err.name === "AbortError") throw err;
      throw new ApiError(
        "Could not reach the backend. Make sure it is running and reachable.",
        { kind: "network" }
      );
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null;
      }
    }

    if (!response.ok) {
      const message = extractMessage(data, `Request failed (${response.status}).`);
      throw new ApiError(message, {
        status: response.status,
        kind: kindForStatus(response.status),
        details: data,
      });
    }

    return data;
  }

  function uploadWithProgress(path, formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${getBaseUrl()}${path}`);

      xhr.upload.onprogress = (event) => {
        if (onProgress && event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        let data = null;
        try {
          data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch (e) {
          data = null;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(
            new ApiError(extractMessage(data, `Upload failed (${xhr.status}).`), {
              status: xhr.status,
              kind: kindForStatus(xhr.status),
              details: data,
            })
          );
        }
      };

      xhr.onerror = () => {
        reject(
          new ApiError(
            "Could not reach the backend. Make sure it is running and reachable.",
            { kind: "network" }
          )
        );
      };

      xhr.send(formData);
    });
  }

  const Api = {
    ApiError,
    getBaseUrl,

    health() {
      return request("/api/health");
    },

    listSources() {
      return request("/api/sources");
    },

    getSource(id) {
      return request(`/api/sources/${encodeURIComponent(id)}`);
    },

    getSourceStatus(id) {
      return request(`/api/sources/${encodeURIComponent(id)}/status`);
    },

    getChunks(id) {
      return request(`/api/sources/${encodeURIComponent(id)}/chunks`);
    },

    addSourceUrl(url) {
      return request("/api/sources/url", { method: "POST", body: { url } });
    },

    uploadSource(file, onProgress) {
      const formData = new FormData();
      formData.append("file", file);
      return uploadWithProgress("/api/sources/upload", formData, onProgress);
    },

    deleteSource(id) {
      return request(`/api/sources/${encodeURIComponent(id)}`, { method: "DELETE" });
    },

    chat(payload) {
      return request("/api/chat", { method: "POST", body: payload });
    },
  };

  global.Api = Api;
})(window);
