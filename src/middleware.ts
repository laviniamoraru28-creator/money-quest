import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/navigation";

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
export default createIntlMiddleware(routing);

export const config = {
  matcher: [
    // Excludes /api/* in addition to the existing static-asset
    // exclusions — API routes must never go through next-intl's locale
    // detection/redirect logic, which would try to rewrite them under
    // a locale prefix and break them entirely. `.pdf` added alongside
    // the image extensions for the same reason: the printable
    // worksheets under public/worksheets/ are locale-independent
    // static files (see public/worksheets/README.txt) and must be
    // reachable at their exact path, not redirected under a locale
    // prefix where no such file exists.
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
