"use client";

import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
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

    /* Ambient background blobs */
    .bg-blob {
      position: absolute;
      width: 60vh;
      height: 60vh;
      background: radial-gradient(circle at center, rgba(99, 102, 241, 0.35), transparent 60%);
      border-radius: 50%;
      filter: blur(80px);
      animation: float 12s ease-in-out infinite alternate;
      z-index: 0;
      top: -10%; left: -10%;
    }

    .bg-blob:nth-child(2) {
      background: radial-gradient(circle at center, rgba(236, 72, 153, 0.35), transparent 60%);
      width: 50vh;
      height: 50vh;
      animation-delay: -6s;
      right: -10%; top: auto; bottom: -10%; left: auto;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(15%, 15%) scale(1.1); }
    }

    /* Glass container */
    .glass-panel {
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 3.5rem 3rem;
      width: 90%;
      max-width: 560px;
      box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .glass-panel:hover {
      transform: translateY(-4px);
    }

    .header { text-align: center; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 99px;
      padding: 6px 16px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #cbd5e1;
      margin-bottom: 1.5rem;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
    }
    
    .badge-dot { 
      width: 6px; 
      height: 6px; 
      border-radius: 50%; 
      background: #38bdf8; 
      box-shadow: 0 0 12px #38bdf8;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.4; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.3); }
      100% { opacity: 0.4; transform: scale(0.8); }
    }

    h1 {
      font-size: clamp(2.5rem, 5vw, 3.2rem);
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
      background: linear-gradient(to right bottom, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sub {
      font-size: 1.05rem;
      line-height: 1.6;
      color: #94a3b8;
      max-width: 90%;
      margin: 0 auto;
    }

    /* Interactive Elements */
    .controls {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .stat-card {
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.25s ease;
    }

    .stat-card:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.15);
    }

    .stat-val {
      font-size: 2.75rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      font-variant-numeric: tabular-nums;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      transition: transform 0.15s ease-out;
      display: inline-block;
    }

    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      font-weight: 600;
      margin-top: 0.5rem;
    }

    .actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 0.5rem;
    }

    button {
      cursor: pointer;
      border: none;
      border-radius: 14px;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      padding: 16px 24px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      outline: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.2);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.6), inset 0 1px 0 rgba(255,255,255,0.2);
      filter: brightness(1.1);
    }

    .btn-primary:active { transform: translateY(0); }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }
    
    .btn-secondary:active { transform: translateY(0); }

    /* Ripple effect */
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      transform: scale(0);
      animation: ripple .6s linear;
      pointer-events: none;
    }

    @keyframes ripple {
      to { transform: scale(4); opacity: 0; }
    }
    
    @media (max-width: 640px) {
      .glass-panel { 
        padding: 2.5rem 1.5rem; 
        border: none; 
        border-radius: 0; 
        width: 100%; 
        min-height: 100vh; 
        justify-content: center;
        background: transparent;
        box-shadow: none;
        backdrop-filter: none;
      }
      .actions { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <!-- Ambient Background -->
  <div class="bg-blob"></div>
  <div class="bg-blob"></div>

  <main class="glass-panel">
    <header class="header">
      <div class="badge">
        <span class="badge-dot"></span>
        Interactive Preview
      </div>
      <h1>Build anything.<br>See it instantly.</h1>
      <p class="sub">
        Experience seamless sandboxed rendering with real-time feedback, remote asset loading, and absolute zero setup.
      </p>
    </header>

    <div class="controls">
      <div class="stat-card">
        <div class="stat-val" id="clicks">0</div>
        <div class="stat-label">Interactions</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="timer">0s</div>
        <div class="stat-label">Session Time</div>
      </div>
    </div>

    <div class="actions">
      <button class="btn-primary" id="btn-interact">
        Initialize
      </button>
      <button class="btn-secondary" id="btn-reset">
        Reset Form
      </button>
    </div>
  </main>

  <script>
    // Interaction Counter
    let clickCount = 0;
    const clickEl = document.getElementById('clicks');
    const interactBtn = document.getElementById('btn-interact');
    const resetBtn = document.getElementById('btn-reset');

    function updateCounter(val) {
      clickCount = val;
      clickEl.style.transform = 'scale(1.2)';
      clickEl.textContent = clickCount;
      setTimeout(() => clickEl.style.transform = 'scale(1)', 150);
    }

    interactBtn.addEventListener('click', function(e) {
      updateCounter(clickCount + 1);
      this.textContent = 'Engage Again';
      createRipple(e, this);
    });

    resetBtn.addEventListener('click', function(e) {
      updateCounter(0);
      interactBtn.textContent = 'Initialize';
      createRipple(e, this);
    });

    // Button Ripple Effect
    function createRipple(event, element) {
      const circle = document.createElement('span');
      const diameter = Math.max(element.clientWidth, element.clientHeight);
      const radius = diameter / 2;
      
      const rect = element.getBoundingClientRect();
      circle.style.width = circle.style.height = diameter + 'px';
      circle.style.left = event.clientX - rect.left - radius + 'px';
      circle.style.top = event.clientY - rect.top - radius + 'px';
      circle.classList.add('ripple');
      
      const existingRipple = element.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove(); // Keep only one ripple at a time
      }
      element.appendChild(circle);
    }

    // Session Timer
    const start = Date.now();
    const timerEl = document.getElementById('timer');
    setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      timerEl.textContent = s < 60 ? s + 's' : Math.floor(s/60) + 'm ' + (s%60) + 's';
    }, 1000);
  </script>
</body>
</html>
`;

type Status = {
  tone: "idle" | "success" | "error";
  message: string;
};

export default function Home() {
  const [htmlInput, setHtmlInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [status, setStatus] = useState<Status>({
    tone: "idle",
    message: "Paste HTML and open preview in a new tab.",
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
    if (!htmlInput) {
      return 0;
    }

    return htmlInput.split(/\r\n|\r|\n/).length;
  }, [htmlInput]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (!isPreviewRequestMessage(event.data)) {
        return;
      }

      const rawPayload = sessionStorage.getItem(
        getPreviewStorageKey(event.data.token),
      );
      if (!rawPayload || !event.source || !("postMessage" in event.source)) {
        return;
      }

      (event.source as Window).postMessage(
        {
          type: PREVIEW_PAYLOAD_TYPE,
          token: event.data.token,
          payload: rawPayload,
        },
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
      setStatus({
        tone: "error",
        message: "Base URL must be a valid http or https URL.",
      });
      return;
    }

    const token = createPreviewToken();
    const payload: PreviewPayload = {
      html: htmlInput,
      baseUrl: normalizedBaseUrl,
      createdAt: Date.now(),
    };

    sessionStorage.setItem(
      getPreviewStorageKey(token),
      JSON.stringify(payload),
    );

    const previewWindow = window.open(
      `/preview?token=${encodeURIComponent(token)}`,
      "_blank",
    );

    if (!previewWindow) {
      setStatus({
        tone: "error",
        message:
          "Preview tab was blocked. Allow popups for this site and try again.",
      });
      return;
    }

    setStatus({
      tone: "success",
      message: `Preview opened in a new tab at ${new Date().toLocaleTimeString()}.`,
    });
  };

  const clearAll = () => {
    setHtmlInput("");
    setBaseUrlInput("");
    setShowInlinePreview(false);
    setStatus({
      tone: "idle",
      message: "Cleared. Paste a new snippet to continue.",
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-3 py-5 md:px-6 md:py-7">
      <section className="relative flex flex-col gap-5">
        <div className="px-1 py-2 md:px-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8d5a31]">
                HTML VIEWER
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-[var(--ink)] md:text-5xl">
                Instant HTML Preview
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#564936] md:text-base">
                Trusted mode is enabled. Scripts in your snippet can run in the
                preview iframe so remote icons, CSS, JavaScript, and images can
                load as expected.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)] transition hover:brightness-105"
                type="button"
                onClick={openPreviewTab}
              >
                Open Preview Tab
              </button>
              <button
                className="rounded-full border border-[#cabda6] bg-[#efe7d7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a3f2e] transition hover:bg-[#e7dcc9]"
                type="button"
                onClick={() => setShowInlinePreview((current) => !current)}
              >
                {showInlinePreview ? "Hide Inline" : "Show Inline"}
              </button>
              <button
                className="rounded-full border border-[#cabda6] bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a3f2e] transition hover:bg-[#f1e9d8]/80"
                type="button"
                onClick={() => setHtmlInput(DEMO_SNIPPET)}
              >
                Load Demo
              </button>
              <button
                className="rounded-full border border-[#cabda6] bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a3f2e] transition hover:bg-[#f1e9d8]/80"
                type="button"
                onClick={clearAll}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-xs md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
            <label className="space-y-1" htmlFor="base-url">
              <span className="block font-semibold uppercase tracking-[0.14em] text-[#5d4f3b]">
                Base URL for relative paths
              </span>
              <input
                id="base-url"
                className="w-full rounded-xl border border-[#c8baa3] bg-white/90 px-3 py-2 text-sm text-[#2d2418] outline-none transition focus:border-[var(--accent)]"
                onChange={(event) => setBaseUrlInput(event.target.value)}
                placeholder="https://example.com/subdir/"
                type="text"
                value={baseUrlInput}
              />
            </label>
            <p
              className={`font-medium md:justify-self-end ${status.tone === "error"
                ? "text-[var(--warn)]"
                : status.tone === "success"
                  ? "text-[var(--accent)]"
                  : "text-[#625441]"
                }`}
            >
              {status.message}
            </p>
            <p className="font-medium text-[#625441] md:justify-self-end">
              {htmlInput.length > 0 ? `${htmlInput.length.toLocaleString()} chars` : ""}
            </p>
          </div>

          {hasBaseUrlError ? (
            <p className="mt-2 text-xs font-medium text-[var(--warn)]">
              Enter a valid `http://` or `https://` URL.
            </p>
          ) : null}
        </div>

        {/* Editor and Inline Preview Grid */}
        <div className={`grid gap-4 ${showInlinePreview ? "md:grid-cols-3" : "grid-cols-1"}`}>
          {/* HTML Paste Area (Left Side) */}
          <div className={`overflow-hidden rounded-3xl bg-[#0d0b0a] shadow-[0_32px_64px_-16px_rgba(141,90,49,0.30),inset_0_1px_0_rgba(255,255,255,0.06)] ${showInlinePreview ? "md:col-span-2" : "md:col-span-full"}`}>
            {/* macOS-style title bar */}
            <div className="flex items-center gap-0 border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[0_0_0_0.5px_rgba(0,0,0,0.3)]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[0_0_0_0.5px_rgba(0,0,0,0.3)]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840] shadow-[0_0_0_0.5px_rgba(0,0,0,0.3)]" />
              </div>
              <div className="flex flex-1 items-center justify-center gap-2">
                <span className="rounded-md bg-white/[0.07] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/40">
                  HTML
                </span>
                <span className="text-[0.7rem] text-white/25">index.html</span>
              </div>
              <span className="text-[0.65rem] tabular-nums text-white/25">
                {lineCount > 0 ? `${lineCount} lines` : ""}
              </span>
            </div>
            <div className="p-2">
              <CodeMirror
                basicSetup={{
                  bracketMatching: true,
                  closeBrackets: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  lineNumbers: true,
                }}
                className="[&_.cm-activeLineGutter]:bg-white/3 [&_.cm-content]:font-[var(--font-code)] [&_.cm-content]:text-sm [&_.cm-editor]:min-h-[62vh] [&_.cm-gutters]:border-r [&_.cm-gutters]:border-white/5 [&_.cm-gutters]:bg-transparent [&_.cm-scroller]:font-[var(--font-code)]"
                extensions={editorExtensions}
                height="62vh"
                onChange={(value) => setHtmlInput(value)}
                placeholder="Paste HTML..."
                theme={oneDark}
                value={htmlInput}
              />
            </div>
          </div>

          {/* Inline Preview (Right Side) */}
          {showInlinePreview ? (
            <div className="md:col-span-1 h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-4xl border border-[#baa98d] bg-[var(--paper)] shadow-[0_15px_26px_rgba(73,51,19,0.12)]">
                <div className="border-b border-[#d4c9b4] bg-[#efe5d1] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#65543d]">
                  Preview
                </div>
                <iframe
                  className="w-full grow border-0 bg-white"
                  sandbox="allow-downloads allow-forms allow-modals allow-popups allow-scripts"
                  srcDoc={inlineDocument}
                  title="Inline HTML preview"
                />
              </div>
            </div>
          ) : null}
        </div>

        <p className="px-1 pb-2 text-xs leading-5 text-[#625441] md:px-2">
          Preview content stays in your current browser session only. Some
          external origins may still block embeds due to CSP, CORS, or
          frame-policy headers.
        </p>
      </section>
    </main>
  );
}
