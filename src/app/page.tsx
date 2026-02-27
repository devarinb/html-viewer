"use client";

import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { Code, Eye, EyeOff, Play, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildPreviewDocument,
  createPreviewToken,
  getPreviewStorageKey,
  isPreviewRequestMessage,
  normalizeBaseUrl,
  PREVIEW_PAYLOAD_TYPE,
  type PreviewPayload,
} from "@/lib/preview-payload";


/* ── Demo snippet ───────────────────────────────── */
const DEMO_SNIPPET = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Premium HTML Demo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      background: #000;
      color: #fff;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      position: relative;
    }

    .bg-blob {
      position: absolute;
      width: 60vh; height: 60vh;
      background: radial-gradient(circle at center, rgba(99, 102, 241, 0.35), transparent 60%);
      border-radius: 50%;
      filter: blur(80px);
      animation: float 12s ease-in-out infinite alternate;
      z-index: 0;
      top: -10%; left: -10%;
    }

    .bg-blob:nth-child(2) {
      background: radial-gradient(circle at center, rgba(236, 72, 153, 0.35), transparent 60%);
      width: 50vh; height: 50vh;
      animation-delay: -6s;
      right: -10%; top: auto; bottom: -10%; left: auto;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(15%, 15%) scale(1.1); }
    }

    .glass-panel {
      position: relative; z-index: 1;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 3.5rem 3rem;
      width: 90%; max-width: 560px;
      box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
      display: flex; flex-direction: column; gap: 2.5rem;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .glass-panel:hover { transform: translateY(-4px); }

    .header { text-align: center; }

    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 99px;
      padding: 6px 16px;
      font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.15em; text-transform: uppercase;
      color: #cbd5e1; margin-bottom: 1.5rem;
    }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #38bdf8; box-shadow: 0 0 12px #38bdf8;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.4; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.3); }
      100% { opacity: 0.4; transform: scale(0.8); }
    }

    h1 {
      font-size: clamp(2.5rem, 5vw, 3.2rem);
      font-weight: 700; line-height: 1.1;
      margin-bottom: 1rem; letter-spacing: -0.02em;
      background: linear-gradient(to right bottom, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sub { font-size: 1.05rem; line-height: 1.6; color: #94a3b8; max-width: 90%; margin: 0 auto; }

    .controls { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }

    .stat-card {
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px; padding: 1.5rem; text-align: center;
      transition: all 0.25s ease;
    }
    .stat-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }

    .stat-val {
      font-size: 2.75rem; font-weight: 600; margin-bottom: 0.25rem;
      font-variant-numeric: tabular-nums;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      transition: transform 0.15s ease-out; display: inline-block;
    }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 600; margin-top: 0.5rem; }

    .actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 0.5rem; }

    button {
      cursor: pointer; border: none; border-radius: 14px;
      font-family: inherit; font-size: 0.95rem; font-weight: 600;
      padding: 16px 24px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative; overflow: hidden; outline: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff;
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.6); filter: brightness(1.1); }
    .btn-primary:active { transform: translateY(0); }
    .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.12); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.25); transform: translateY(-2px); }
    .btn-secondary:active { transform: translateY(0); }

    @media (max-width: 640px) {
      .glass-panel { padding: 2.5rem 1.5rem; border: none; border-radius: 0; width: 100%; min-height: 100vh; justify-content: center; background: transparent; box-shadow: none; backdrop-filter: none; }
      .actions { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="bg-blob"></div>
  <div class="bg-blob"></div>
  <main class="glass-panel">
    <header class="header">
      <div class="badge"><span class="badge-dot"></span>Interactive Preview</div>
      <h1>Build anything.<br>See it instantly.</h1>
      <p class="sub">Experience seamless sandboxed rendering with real-time feedback.</p>
    </header>
    <div class="controls">
      <div class="stat-card"><div class="stat-val" id="clicks">0</div><div class="stat-label">Interactions</div></div>
      <div class="stat-card"><div class="stat-val" id="timer">0s</div><div class="stat-label">Session Time</div></div>
    </div>
    <div class="actions">
      <button class="btn-primary" id="btn-interact">Initialize</button>
      <button class="btn-secondary" id="btn-reset">Reset</button>
    </div>
  </main>
  <script>
    let clickCount = 0;
    const clickEl = document.getElementById('clicks');
    const interactBtn = document.getElementById('btn-interact');
    const resetBtn = document.getElementById('btn-reset');
    function updateCounter(val) { clickCount = val; clickEl.style.transform = 'scale(1.2)'; clickEl.textContent = clickCount; setTimeout(() => clickEl.style.transform = 'scale(1)', 150); }
    interactBtn.addEventListener('click', function() { updateCounter(clickCount + 1); this.textContent = 'Engage Again'; });
    resetBtn.addEventListener('click', function() { updateCounter(0); interactBtn.textContent = 'Initialize'; });
    const start = Date.now();
    const timerEl = document.getElementById('timer');
    setInterval(() => { const s = Math.floor((Date.now() - start) / 1000); timerEl.textContent = s < 60 ? s + 's' : Math.floor(s/60) + 'm ' + (s%60) + 's'; }, 1000);
  </script>
</body>
</html>`;




/* ── Types ──────────────────────────────────────── */
type Status = {
  tone: "idle" | "success" | "error";
  message: string;
};

/* ── Component ──────────────────────────────────── */
export default function Home() {
  const [htmlInput, setHtmlInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [status, setStatus] = useState<Status>({
    tone: "idle",
    message: "",
  });

  const normalizedBaseUrl = useMemo(
    () => normalizeBaseUrl(baseUrlInput),
    [baseUrlInput],
  );

  const hasBaseUrlError = baseUrlInput.trim().length > 0 && !normalizedBaseUrl;

  const inlineDocument = useMemo(
    () => buildPreviewDocument(htmlInput, normalizedBaseUrl),
    [htmlInput, normalizedBaseUrl],
  );
  const editorExtensions = useMemo(() => [html()], []);
  const lineCount = useMemo(() => {
    if (!htmlInput) return 0;
    return htmlInput.split(/\r\n|\r|\n/).length;
  }, [htmlInput]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      if (!isPreviewRequestMessage(event.data)) return;

      const rawPayload = sessionStorage.getItem(
        getPreviewStorageKey(event.data.token),
      );
      if (!rawPayload || !event.source || !("postMessage" in event.source)) return;

      (event.source as Window).postMessage(
        { type: PREVIEW_PAYLOAD_TYPE, token: event.data.token, payload: rawPayload },
        event.origin,
      );
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const openPreviewTab = () => {
    if (!htmlInput.trim()) {
      setStatus({ tone: "error", message: "Paste HTML first." });
      return;
    }
    if (hasBaseUrlError) {
      setStatus({ tone: "error", message: "Invalid base URL." });
      return;
    }

    const token = createPreviewToken();
    const payload: PreviewPayload = {
      html: htmlInput,
      baseUrl: normalizedBaseUrl,
      createdAt: Date.now(),
    };

    sessionStorage.setItem(getPreviewStorageKey(token), JSON.stringify(payload));

    const previewWindow = window.open(
      `/preview?token=${encodeURIComponent(token)}`,
      "_blank",
    );

    if (!previewWindow) {
      setStatus({ tone: "error", message: "Popup blocked — allow popups and retry." });
      return;
    }

    setStatus({ tone: "success", message: `Opened at ${new Date().toLocaleTimeString()}` });
  };

  const clearAll = () => {
    setHtmlInput("");
    setBaseUrlInput("");
    setShowInlinePreview(false);
    setStatus({ tone: "idle", message: "" });
  };

  return (
    <div className="animate-enter mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-5 md:px-8 md:py-6">
      {/* ━━ Header ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="mb-5 flex flex-col gap-4 md:mb-6">
        {/* Top row: Logo + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
              style={{ background: "var(--accent)" }}
            >
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                HTML Viewer
              </h1>
              <p className="text-[12px] font-medium" style={{ color: "var(--ink-3)" }}>
                Paste HTML and see it rendered instantly — scripts, styles, and all.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Status */}
            {status.message && (
              <span
                className="mr-2 hidden text-xs font-medium md:block"
                style={{
                  color: status.tone === "error" ? "var(--warn)" : status.tone === "success" ? "var(--success)" : "var(--ink-3)",
                }}
              >
                {status.message}
              </span>
            )}

            {htmlInput.length > 0 && (
              <span
                className="mr-1 hidden rounded-lg px-2.5 py-1.5 text-[11px] font-medium tabular-nums md:block"
                style={{ background: "var(--surface-2)", color: "var(--ink-3)" }}
              >
                {htmlInput.length.toLocaleString()} chars · {lineCount} lines
              </span>
            )}

            <button className="btn btn-primary" type="button" onClick={openPreviewTab}>
              <Play className="h-3.5 w-3.5" />
              Preview
            </button>

            <button className="btn btn-ghost" type="button" onClick={() => setShowInlinePreview((v) => !v)}>
              {showInlinePreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{showInlinePreview ? "Hide" : "Inline"}</span>
            </button>

            <button className="btn btn-ghost" type="button" onClick={() => setHtmlInput(DEMO_SNIPPET)}>
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Demo</span>
            </button>

            <button className="btn btn-icon btn-danger" type="button" onClick={clearAll} title="Clear">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Base URL — always visible */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-2.5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <label
            htmlFor="base-url"
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-3)" }}
          >
            Base URL
          </label>
          <input
            id="base-url"
            className="w-full bg-transparent text-sm outline-none"
            style={{
              color: "var(--ink)",
              fontFamily: "var(--font-code), monospace",
            }}
            onChange={(e) => setBaseUrlInput(e.target.value)}
            placeholder="https://example.com/assets/"
            type="text"
            value={baseUrlInput}
          />
          {hasBaseUrlError && (
            <span className="shrink-0 text-[11px] font-semibold" style={{ color: "var(--warn)" }}>
              Invalid URL
            </span>
          )}
        </div>
      </header>

      {/* ━━ Editor + Preview ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        className={`flex min-h-0 flex-1 gap-4 ${showInlinePreview ? "flex-col lg:flex-row" : ""}`}
      >
        {/* Editor */}
        <div
          className={`animate-enter delay-1 flex min-h-0 flex-col overflow-hidden rounded-2xl ${showInlinePreview ? "lg:flex-[3]" : "flex-1"
            }`}
          style={{
            background: "#1a1a1e",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px -8px rgba(0,0,0,0.12)",
          }}
        >
          {/* Tab bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  background: "rgba(243,103,64,0.15)",
                  color: "#f36740",
                }}
              >
                HTML
              </span>
              <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                index.html
              </span>
            </div>
            {lineCount > 0 && (
              <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>
                {lineCount} lines
              </span>
            )}
          </div>

          {/* Editor body */}
          <div className="min-h-0 flex-1 p-1">
            <CodeMirror
              basicSetup={{
                bracketMatching: true,
                closeBrackets: true,
                foldGutter: true,
                highlightActiveLine: true,
                lineNumbers: true,
              }}
              extensions={editorExtensions}
              height="calc(100vh - 240px)"
              onChange={(value) => setHtmlInput(value)}
              placeholder="Paste your HTML here…"
              theme={oneDark}
              value={htmlInput}
            />
          </div>
        </div>

        {/* Inline Preview */}
        {showInlinePreview && (
          <div
            className="animate-enter delay-2 flex min-h-[400px] flex-col overflow-hidden rounded-2xl lg:flex-[2]"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px -8px rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: "var(--success)",
                  boxShadow: "0 0 6px rgba(22,163,74,0.4)",
                  animation: "live-pulse 2s ease-in-out infinite",
                }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--ink-3)" }}
              >
                Live Preview
              </span>
            </div>
            <iframe
              className="min-h-0 w-full flex-1 border-0 bg-white"
              sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
              srcDoc={inlineDocument}
              title="Inline HTML preview"
            />
          </div>
        )}
      </div>

      {/* ━━ Footer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <p className="mt-4 text-[11px]" style={{ color: "var(--ink-3)" }}>
        Preview stays in your browser session. External origins may block embeds
        via CSP, CORS, or X-Frame-Options.
      </p>
    </div>
  );
}
