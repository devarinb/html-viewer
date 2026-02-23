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
      if (!parsed) {
        return false;
      }

      resolved = true;
      setState({ mode: "ready", payload: parsed });
      return true;
    };

    if (readLocalPayload()) {
      return;
    }

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (!isPreviewPayloadMessage(event.data) || event.data.token !== token) {
        return;
      }

      const parsed = parsePreviewPayload(event.data.payload);
      if (!parsed) {
        return;
      }

      resolved = true;
      sessionStorage.setItem(
        getPreviewStorageKey(token),
        JSON.stringify(parsed),
      );
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
      if (resolved) {
        return;
      }

      setState({
        mode: "error",
        message:
          "Preview payload not found in this session. Return to the editor and click Open Preview Tab again.",
      });
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [token]);

  const srcDoc = useMemo(() => {
    if (state.mode !== "ready") {
      return "";
    }

    return buildPreviewDocument(state.payload.html, state.payload.baseUrl);
  }, [state]);

  if (state.mode === "loading") {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="rounded-2xl border border-[var(--edge)] bg-[var(--paper)] px-6 py-5 text-sm text-[#4f4434] shadow-[var(--shadow)]">
          Preparing preview...
        </div>
      </main>
    );
  }

  if (state.mode === "error") {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="max-w-xl rounded-3xl border border-[var(--edge)] bg-[var(--paper)] p-6 text-sm leading-6 text-[#4f4434] shadow-[var(--shadow)]">
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--ink)]">
            Cannot render preview
          </h1>
          <p className="mt-3">{state.message}</p>
          <Link
            className="mt-5 inline-block rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]"
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
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--edge)] bg-[var(--paper)] px-4 py-3 text-xs md:text-sm">
        <span className="font-semibold uppercase tracking-[0.1em] text-[#63553f]">
          Trusted Preview
        </span>
        <span className="text-[#4f4434]">
          Rendered {new Date(state.payload.createdAt).toLocaleString()}
        </span>
        {state.payload.baseUrl ? (
          <span className="rounded-md bg-[var(--paper-strong)] px-2 py-1 text-[#5f533f]">
            Base URL: {state.payload.baseUrl}
          </span>
        ) : null}
      </header>
      <iframe
        className="h-[calc(100vh-54px)] w-full border-0 bg-white"
        sandbox="allow-downloads allow-forms allow-modals allow-popups allow-scripts"
        srcDoc={srcDoc}
        title="HTML preview"
      />
    </main>
  );
}

function PreviewLoadingState() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="rounded-2xl border border-[var(--edge)] bg-[var(--paper)] px-6 py-5 text-sm text-[#4f4434] shadow-[var(--shadow)]">
        Preparing preview...
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
