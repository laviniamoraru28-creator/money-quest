# Seobility homepage SEO audit, 2026-11-21

Source: user-supplied 12-page Seobility SEO Check PDF, URL https://moneyquesteducation.com/en, dated 2026-11-21. Baseline overall score reported by user: 75%.

## Measured observations
- Metadata 98%; page quality 48%; page structure 100%; links 72%; server 0%; external factors 3%.
- HTML response time 1.64 s in this single synthetic check; 367.80 kB HTML; 297 visible words.
- HTTP response has `X-Powered-By: Next.js`, `Cache-Control: private, no-cache, no-store`, gzip, HTTP/2, status 200.
- Seobility flags www/non-www canonical host handling. **Verify live redirects before changing hosting, DNS, or routing.**
- Hreflang alternatives for nine locales plus x-default appear in the HTTP Link response header; absence in HTML alone does not prove missing hreflang.
- Three level thumbnails have empty alt. In current homepage source, these are adjacent to descriptive age-band headings and labels; empty alt is intentional for decorative/redundant artwork. Preserve accessible names of the linked cards.
- Homepage heading hierarchy passes Seobility's check. Do not insert 800 words merely to satisfy a heuristic; keep child-facing landing page concise.
- robots.txt disallows play and quest paths. Audit search-intent and child-safety implications before allowing indexing.
- One backlink from one referring domain reported; not independently validated. Do not buy links or invent endorsements.

## Safe code change in this branch
- Set `poweredByHeader: false` in Next.js configuration. This removes an unnecessary technology-disclosure header after the next deployment. It does not itself improve Core Web Vitals.

## Verification and follow-up (not implemented)
1. Confirm that http://, https://www., and http://www. redirect in one permanent hop to https://moneyquesteducation.com/en for that path, preserving other routes and query strings. Make changes at the actual Namecheap/LiteSpeed ingress only after confirming current behavior.
2. Run PageSpeed Insights mobile and desktop three times, plus collect Google Search Console Core Web Vitals. Distinguish TTFB from LCP/INP/CLS before changing caching. The existing private/no-store header may reflect user-dependent content; do not override globally without checking personalized content and safety.
3. Validate localized canonical and hreflang via rendered responses, including self-references, reciprocal links, and x-default.
4. Review indexing decisions for public educational landing pages versus interactive child-facing quests, and ensure sitemap and robots agree.
5. Measure organic clicks, impressions, indexed URLs, and queries in Search Console before rewriting homepage copy. Improve relevant parent/teacher resource pages rather than bloating the child-facing homepage.
6. After deployment, verify `X-Powered-By` is absent and rerun the same Seobility URL. Do not claim score improvement without a new measurement.

## Guardrails
No production deployment, no DNS/Namecheap changes, no redirects guessed, no blanket robots edits, no tracking changes, no child data collection, no claims of successful CI until GitHub checks are observed.
