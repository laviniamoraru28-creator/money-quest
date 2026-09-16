"use server";

import { headers } from "next/headers";
import { reportError } from "@/lib/monitoring/report-error";
import { isSameOriginRequest } from "@/lib/security/same-origin";

/**
 * Replaces the previous /api/report-client-error Route Handler —
 * found during the V1 simplification pass: a Server Action can be
 * called directly from a client component (error.tsx) the same way
 * `fetch()` could, with no separate API route, no manual JSON
 * parsing, and Next.js's own built-in Origin-checking for Server
 * Actions applying automatically. One fewer API endpoint to reason
 * about, secure, and maintain, for identical functionality.
 *
 * The explicit same-origin check below is redundant with Next.js's
 * own built-in protection for Server Actions (confirmed unmodified —
 * no `experimental.serverActions.allowedOrigins` override exists in
 * next.config.mjs) but is kept anyway: it costs nothing, and makes
 * the safety property visible in this file's own code rather than
 * relying entirely on a framework default a future reader would have
 * to go verify separately.
 */
export async function reportClientErrorAction(payload: { message: string; stack?: string; digest?: string; path?: string }) {
  const headersList = await headers();
  const isSameOrigin = isSameOriginRequest({ headers: { get: (name: string) => headersList.get(name) } });
  if (!isSameOrigin) return;

  const message = payload.message.slice(0, 2000);
  const stack = payload.stack?.slice(0, 4000);
  const path = payload.path?.slice(0, 500);

  await reportError(new Error(message), { source: "client-error-boundary", stack, path, digest: payload.digest });
}
