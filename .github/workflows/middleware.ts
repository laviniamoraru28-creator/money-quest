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
const intlMiddleware = createIntlMiddleware(routing);

export default intlMiddleware;

export const config = {
  matcher: [
    // Excludes /api/* in addition to the existing static-asset
    // exclusions — API routes must never go through next-intl's locale
    // detection/redirect logic, which would try to rewrite them under
    // a locale prefix and break them entirely.
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
