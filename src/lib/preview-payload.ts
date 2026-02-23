export type PreviewPayload = {
  html: string;
  baseUrl: string | null;
  createdAt: number;
};

export const PREVIEW_STORAGE_PREFIX = "html_viewer_preview_";
export const PREVIEW_REQUEST_TYPE = "HTML_VIEWER_REQUEST";
export const PREVIEW_PAYLOAD_TYPE = "HTML_VIEWER_PAYLOAD";

export type PreviewRequestMessage = {
  type: typeof PREVIEW_REQUEST_TYPE;
  token: string;
};

export type PreviewPayloadMessage = {
  type: typeof PREVIEW_PAYLOAD_TYPE;
  token: string;
  payload: string;
};

export function createPreviewToken() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getPreviewStorageKey(token: string) {
  return `${PREVIEW_STORAGE_PREFIX}${token}`;
}

export function normalizeBaseUrl(input: string) {
  const value = input.trim();
  if (!value) {
    return null;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)
    ? value
    : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (!url.pathname) {
      url.pathname = "/";
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function parsePreviewPayload(raw: string | null): PreviewPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PreviewPayload>;
    if (typeof parsed.html !== "string") {
      return null;
    }

    if (parsed.baseUrl !== null && typeof parsed.baseUrl !== "string") {
      return null;
    }

    if (typeof parsed.createdAt !== "number") {
      return null;
    }

    return {
      html: parsed.html,
      baseUrl: parsed.baseUrl ?? null,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

function escapeHtmlAttr(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function injectBaseTag(html: string, baseUrl: string) {
  const baseTag = `<base href="${escapeHtmlAttr(baseUrl)}">`;

  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }

  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${baseTag}</head>`);
  }

  return `<!doctype html><html><head>${baseTag}</head><body>${html}</body></html>`;
}

export function buildPreviewDocument(html: string, baseUrl: string | null) {
  return baseUrl ? injectBaseTag(html, baseUrl) : html;
}

export function isPreviewRequestMessage(
  value: unknown,
): value is PreviewRequestMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "type" in value &&
    "token" in value &&
    value.type === PREVIEW_REQUEST_TYPE &&
    typeof value.token === "string"
  );
}

export function isPreviewPayloadMessage(
  value: unknown,
): value is PreviewPayloadMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "type" in value &&
    "token" in value &&
    "payload" in value &&
    value.type === PREVIEW_PAYLOAD_TYPE &&
    typeof value.token === "string" &&
    typeof value.payload === "string"
  );
}
