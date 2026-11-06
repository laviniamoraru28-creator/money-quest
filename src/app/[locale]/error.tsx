"use client";

import { useEffect, useState } from "react";
import {errorBoundaryCopy,errorLocale} from "@/content/error-boundary-copy";
import type {Locale} from "@/i18n/config";
import { reportClientErrorAction } from "@/lib/monitoring/report-client-error-action";

/** Recovery copy must not require a working locale provider. */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [locale,setLocale]=useState<Locale>("en");
  useEffect(()=>{setLocale(errorLocale(window.location.pathname));},[]);
  const copy=errorBoundaryCopy[locale];
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[error-boundary]", error);
    // A Server Action call, not a fetch() to a separate API route —
    // see reportClientErrorAction's own comment for why this was
    // consolidated during the V1 simplification pass.
    reportClientErrorAction({
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    }).catch(() => {});
  }, [error]);

  return (
    <main id="main-content" tabIndex={-1} className="grid min-h-screen place-items-center bg-fog px-sm text-center">
      <div className="max-w-sm">
        <span className="text-5xl" aria-hidden="true">
          🛠️
        </span>
        <h1 className="mt-sm font-display text-2xl font-bold">{copy.title}</h1>
        <p className="mt-2xs text-base text-ink/70">
          {copy.body}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-md min-h-touch-min rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting hover:bg-teal/90"
        >
          {copy.retry}
        </button>
        <p className="mt-sm">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Full navigation can recover a broken router or locale provider. */}
          <a href={`/${locale}`} className="text-sm text-teal-text hover:underline">
            {copy.home}
          </a>
        </p>
      </div>
    </main>
  );
}
