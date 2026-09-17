import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/navigation";
import type { NextRequest } from "next/server";

/**
 * Radically simplified for the privacy-first redesign — there is no
 * longer any account, session, or Grown-up Mode gate to check. This
 * file now does exactly one thing: locale detection and routing (see
 * docs/data-flow-inventory-pre-redesign.md and the final architecture
 * report for the full reasoning behind removing everything else that
 * used to live here). No Supabase client, no cookie inspection beyond
 * what next-intl itself needs for locale preference, no auth-route
 * redirects — there is nothing left to redirect away from.
 */
const intlMiddleware = createIntlMiddleware(routing);

/**
 * TEMPORARY DIAGNOSTIC WRAPPER — the default export is normally just
 * `intlMiddleware` directly. Wrapped here, unconditionally logging
 * before and after, specifically to answer one question empirically:
 * does this file execute at all under the Namecheap/Passenger + custom
 * server.js deployment, and if so, what does next-intl's own
 * middleware actually decide? No cookies, auth, or personal data
 * logged — only the request path and the response's own status/
 * headers, which next-intl sets to communicate its locale decision
 * downstream. Remove this wrapper (revert to `export default
 * intlMiddleware;`) once the cause is confirmed.
 */
export default function middleware(request: NextRequest) {
  console.log(
    "[LOCALE-DIAG] middleware.ts ENTERED",
    JSON.stringify({ pathname: request.nextUrl.pathname, url: request.url })
  );

  const response = intlMiddleware(request);

  console.log(
    "[LOCALE-DIAG] middleware.ts RETURNED",
    JSON.stringify({
      status: response.status,
      // A redirect (e.g. bare "/" -> "/en") shows up here.
      location: response.headers.get("location"),
      // next-intl communicates its resolved locale to the app via
      // response headers in some versions — logging everything rather
      // than guessing one exact header name.
      headers: Object.fromEntries(response.headers.entries()),
    })
  );

  return response;
}

export const config = {
  matcher: [
    // Excludes /api/* in addition to the existing static-asset
    // exclusions — API routes must never go through next-intl's locale
    // detection/redirect logic, which would try to rewrite them under
    // a locale prefix and break them entirely.
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
