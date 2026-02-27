"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  buildPreviewDocument,
  getPreviewStorageKey,
  isPreviewPayloadMessage,
  PREVIEW_REQUEST_TYPE,
  type PreviewPayload,
  type PreviewRequestMessage,
  parsePreviewPayload,
} from "@/lib/preview-payload";

type PreviewState =
  | { mode: "loading" }
  | { mode: "error"; message: string }
  | { mode: "ready"; payload: PreviewPayload };

function PreviewView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<PreviewState>({ mode: "loading" });

  useEffect(() => {
    if (!token) {
      setState({
        mode: "error",
        message: "Missing preview token. Open this page from the main editor.",
      });
      return;
    }

    let resolved = false;

    const readLocalPayload = () => {
      const parsed = parsePreviewPayload(
        sessionStorage.getItem(getPreviewStorageKey(token)),
      );
      if (!parsed) return false;
      resolved = true;
      setState({ mode: "ready", payload: parsed });
      return true;
    };

    if (readLocalPayload()) return;

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      if (!isPreviewPayloadMessage(event.data) || event.data.token !== token) return;

      const parsed = parsePreviewPayload(event.data.payload);
      if (!parsed) return;

      resolved = true;
      sessionStorage.setItem(getPreviewStorageKey(token), JSON.stringify(parsed));
      setState({ mode: "ready", payload: parsed });
    };

    window.addEventListener("message", onMessage);

    if (window.opener) {
      const request: PreviewRequestMessage = {
        type: PREVIEW_REQUEST_TYPE,
        token,
      };
      window.opener.postMessage(request, window.location.origin);
    }

    const timer = window.setTimeout(() => {
      if (resolved) return;
      setState({
        mode: "error",
        message: "Preview payload not found. Return to the editor and click Preview again.",
      });
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [token]);

  const srcDoc = useMemo(() => {
    if (state.mode !== "ready") return "";
    return buildPreviewDocument(state.payload.html, state.payload.baseUrl);
  }, [state]);

  if (state.mode === "loading") {
    return (
      <main className="grid min-h-screen place-items-center px-4" style={{ background: "var(--bg)" }}>
        <div
          className="rounded-2xl px-6 py-5 text-sm font-medium"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--ink-2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          Preparing preview…
        </div>
      </main>
    );
  }

  if (state.mode === "error") {
    return (
      <main className="grid min-h-screen place-items-center px-4" style={{ background: "var(--bg)" }}>
        <section
          className="max-w-md rounded-2xl p-6 text-sm leading-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--ink-2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
            Cannot render preview
          </h1>
          <p className="mt-2">{state.message}</p>
          <Link
            className="btn btn-primary mt-5 inline-flex"
            href="/"
          >
            Back to Editor
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-xs md:text-sm"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--accent)" }}
        >
          Preview
        </span>
        <span style={{ color: "var(--ink-3)" }}>
          Rendered {new Date(state.payload.createdAt).toLocaleString()}
        </span>
        {state.payload.baseUrl && (
          <span
            className="rounded-md px-2 py-1 text-[11px] font-medium"
            style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
          >
            Base: {state.payload.baseUrl}
          </span>
        )}
      </header>
      <iframe
        className="h-[calc(100vh-48px)] w-full border-0 bg-white"
        sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        srcDoc={srcDoc}
        title="HTML preview"
      />
    </main>
  );
}

function PreviewLoadingState() {
  return (
    <main className="grid min-h-screen place-items-center px-4" style={{ background: "var(--bg)" }}>
      <div
        className="rounded-2xl px-6 py-5 text-sm font-medium"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--ink-2)",
        }}
      >
        Preparing preview…
      </div>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewLoadingState />}>
      <PreviewView />
    </Suspense>
  );
}
