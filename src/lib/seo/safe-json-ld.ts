/**
 * Safely serializes a value for injection into a <script type="application/
 * ld+json"> tag via dangerouslySetInnerHTML. Plain JSON.stringify() does
 * NOT escape `<`, so a value containing the literal sequence `</script>`
 * would close the script tag early and let whatever follows it be parsed
 * as raw HTML — a classic stored-XSS vector.
 *
 * Found during a security audit: every current call site (structured
 * data built from src/content/articles.ts) uses fully static,
 * developer-authored content, so this specific instance was not
 * exploitable by an external attacker TODAY. It was fixed anyway,
 * because the unsafe pattern itself — not today's data — is what
 * matters: the moment any part of that content pipeline becomes
 * dynamic (a CMS-driven article, a title pulled from a less-trusted
 * source), the exact same code would become a real stored-XSS hole
 * with no visible change at the call site. Fixing the primitive once,
 * here, means every current and future caller is safe by construction.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
