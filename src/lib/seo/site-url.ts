/**
 * The single source of truth for the site's canonical base URL — every
 * canonical link, sitemap entry, Open Graph URL, and structured-data
 * @id in this codebase reads from here, never a hardcoded domain
 * string. Set NEXT_PUBLIC_SITE_URL in production; falls back to a
 * clearly-placeholder value in development so a missing env var is
 * obvious rather than silently pointing at the wrong domain.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://moneyquest.example";
}

/**
 * The one social-share image every page falls back to. A page-level
 * `generateMetadata` that sets its own `openGraph` object must include
 * this explicitly — Next.js does not deep-merge a nested `openGraph`
 * across layout/page boundaries, so redefining `openGraph` at all
 * (even just to set a page-specific title/description) silently drops
 * the root layout's default `images` unless each page re-supplies it.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/images/money-quest/homepage-hero.webp",
  width: 800,
  height: 800,
};
