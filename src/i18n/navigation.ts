import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "./config";

/**
 * `localePrefix: "always"` — every route, including the authenticated
 * app, carries an explicit /en/ or /ro/ segment. This was a deliberate
 * choice (see the architecture plan's URL-strategy section) over mixing
 * prefixed public routes with cookie-only authenticated routes: one
 * consistent mechanism is simpler to reason about and test than two.
 * Authenticated routes are kept out of the sitemap/search index via
 * `robots: { index: false }` in their metadata, not by avoiding
 * prefixing — see src/app/[locale]/dashboard/page.tsx.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

/**
 * Drop-in replacements for next/link, next/navigation's useRouter, and
 * redirect — each one automatically prefixes the current locale onto
 * whatever path is passed. Existing components that used
 * `<Link href="/dashboard">` change to `import { Link } from "@/i18n/navigation"`
 * and keep the exact same `href="/dashboard"` — the locale prefix is
 * added transparently. This is what keeps the [locale] restructuring a
 * mechanical, low-risk change rather than a rewrite of every href.
 */
const navigation = createNavigation(routing);

/**
 * `redirect` is re-exported via an explicit wrapper function, NOT a bare
 * destructured const — this is deliberate, not stylistic. A destructured
 * `export const { redirect } = createNavigation(routing)` loses its
 * `never` return type across the module boundary when re-imported
 * elsewhere (confirmed by isolated reproduction during development —
 * every call site relying on "code after redirect() is unreachable"
 * narrowing, e.g. `if (!childId) { redirect(...); } loadThing(childId)`,
 * would otherwise silently fail to type-check). Link and the hook
 * exports don't have this problem since nothing needs to narrow around
 * them, so they stay as plain re-exports.
 */
export const Link = navigation.Link;
export function redirect(href: string, ...args: unknown[]): never {
  return (navigation.redirect as (...a: unknown[]) => never)(href, ...args);
}
export const usePathname = navigation.usePathname;
export const useRouter = navigation.useRouter;
export const getPathname = navigation.getPathname;
