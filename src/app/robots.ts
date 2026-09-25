import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

/**
 * There is no longer an "authenticated area" to keep crawlers out of —
 * middleware.ts has no auth logic left at all after the privacy-first
 * redesign, since there's no account to authenticate. `/play/*` is
 * still excluded here, but for an entirely different, honest reason
 * than before: it's an interactive app shell with no real content of
 * its own to index (the actual educational content it renders lives
 * in the same static source the `/learn` article hub already draws
 * from), not because it contains anything private — it structurally
 * can't, by design.
 *
 * /api/ is excluded for the same reason it's excluded from the i18n
 * middleware matcher — nothing for a crawler to usefully index there.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /*/entrepreneur-quest and /*/leadership-quest are excluded for
      // the identical reason as /*/play: interactive app sections with
      // no static content of their own to index, not because they
      // contain anything private.
      disallow: ["/*/play", "/*/entrepreneur-quest", "/*/leadership-quest", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
