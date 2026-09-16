/**
 * Verifies a request's Origin header matches its own Host — the CSRF
 * protection custom Route Handlers need but don't get for free (unlike
 * Next.js Server Actions, which apply this same kind of check
 * automatically). See the security audit's finding on /api/coach for
 * why this exists: without it, a malicious site could ride a victim's
 * cookie-based session to trigger a cross-origin POST.
 *
 * A small, dependency-free module on purpose — kept separate from
 * route.ts specifically so it can be unit tested
 * (scripts/test-csrf-origin-check.ts) without pulling in that file's
 * whole import graph (Supabase, the AI provider, etc.), several of
 * which only resolve inside the Next.js server runtime and would break
 * a plain Node/tsx test run.
 */
export interface RequestLike {
  headers: { get(name: string): string | null };
}

export function isSameOriginRequest(request: RequestLike): boolean {
  const origin = request.headers.get("origin");
  // No Origin header at all (e.g. some same-site navigations, or
  // certain non-browser clients) is treated as acceptable — the Origin
  // header is reliably sent by browsers for the cross-origin requests
  // this check exists to catch, and for a same-origin fetch() too.
  if (!origin) return true;

  const host = request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
