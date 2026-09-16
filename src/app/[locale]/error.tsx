"use client";

import { useEffect } from "react";
import { reportClientErrorAction } from "@/lib/monitoring/report-client-error-action";

/**
 * Found during the final launch audit alongside not-found.tsx: no
 * error boundary existed anywhere, so any unhandled exception in a
 * Server Component's render fell through to Next.js's generic default
 * error page. This is the one Next.js App Router convention that MUST
 * be a Client Component and MUST NOT depend on locale/translation
 * context (an error here could itself be the reason that context
 * failed to load) — kept deliberately simple, plain English, a plain
 * <a> tag rather than the i18n-aware Link, and no data fetching of its
 * own, so this page has the best possible chance of rendering even
 * when something else in the app just broke.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
    <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
      <div className="max-w-sm">
        <span className="text-5xl" aria-hidden="true">
          🛠️
        </span>
        <h1 className="mt-sm font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2xs text-base text-ink/70">
          Nothing's wrong with your account or your progress - this was just a hiccup. Let's try
          again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-md min-h-touch-min rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting hover:bg-teal/90"
        >
          Try again
        </button>
        <p className="mt-sm">
          <a href="/" className="text-sm text-teal hover:underline">
            Or go to the home page
          </a>
        </p>
      </div>
    </div>
  );
}
