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
