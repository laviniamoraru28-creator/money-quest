# Shared brief: expanding priority-12 SEO drafts into full Money Quest Learn articles

You are writing ONE full English article for the Money Quest `/learn` section — a free
financial-literacy site for children, parents and teachers. Your source material is a
short (346-720 word) editorial draft already in this repo under
`content/seo-drafts/priority-12/`. Your job is to expand it into a genuinely comprehensive,
high-quality guide — not pad it with filler. Quality over word count: aim for roughly
1,000-1,600 words **when the topic genuinely supports that length**; a shorter, tighter
article that covers its topic honestly is better than a bloated one.

## Output format (write EXACTLY this JSON shape, one file per article)

```json
{
  "slug": "<given-slug>",
  "targetKeywords": ["...", "..."],
  "audience": ["parents"] | ["teachers"] | ["parents","teachers"] | add "families" where natural,
  "relatedSlugs": ["<2 real existing slugs>"],
  "publishedDate": "2026-11-23",
  "updatedDate": "2026-11-23",
  "title": "<<=60 chars, matches real content>",
  "metaDescription": "<50-160 chars, genuine summary, not a keyword list>",
  "sections": [
    { "heading": "...", "paragraphs": ["...", "..."], "list": ["...", "..."] }
  ],
  "faqs": [ { "question": "...", "answer": "..." } ]
}
```

**Schema rule that matters**: `paragraphs` is a REQUIRED array on every section, even if
that section is list-only. If a section has no body paragraphs, use `"paragraphs": []`
— never omit the key. (A prior pass broke the site's test suite by omitting it on two
list-only sections, so double check this before you finish.)

## Content rules (non-negotiable)

1. **No invented statistics, research findings, quotations, or citations.** Only cite
   sources that genuinely exist and genuinely support the claim you're attaching them to.
   Approved source list — cite ONLY from this list, and only when a claim actually needs
   external support (most of the article should be practical guidance, not citations):
   - Money and Pensions Service: https://maps.org.uk/en/our-work/children-and-young-people
   - Education Endowment Foundation (Metacognition and self-regulation):
     https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation
   - UNESCO (Guidance for generative AI in education and research) — only for AI-related
     articles: https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research
   - UK DfE, UNICEF, OECD, FCA, or genuine peer-reviewed research — only if you are certain
     the source and claim are real; when in doubt, leave the claim out rather than cite
     something you're not sure of.
   Put any citations in a final "Editorial references" section's paragraphs (plain text
   mentioning the source name; do not fabricate a separate schema field for this).
2. **Distinguish research findings from practical recommendations.** Say "research on
   X suggests..." only when you're citing a real source for it; say "many
   parents/teachers find..." or "a practical approach is..." for everything else.
3. **SEND / accessibility**: every article needs at least one paragraph of concrete
   accessibility/SEND adaptation (not a token sentence) — e.g. AAC alternatives, reduced
   sensory load, extra processing time, non-verbal ways to demonstrate understanding.
   - Keep "SEND" as the English acronym (it's a specific UK legal/educational term),
     glossed once per article on first use, e.g. "SEND (special educational needs and
     disabilities)". Do not invent or substitute a different-language clinical term for
     it — that mapping gets done consistently later, in translation.
   - Same treatment for "AAC": keep as "AAC", glossed once per article as "augmentative
     and alternative communication".
4. **UK-specific items must be explicitly flagged**, not presented as universal: £
   amounts, "Key Stage 1 / Key Stage 2" (glossed with the rough age range in
   parentheses), or UK institutions. A sentence like "This is a UK-style example in
   pounds" should appear wherever you use one. Never silently universalize these.
5. **Realistic examples only** — fictional names/amounts are fine and expected (this
   keeps real family finances private), but the numbers and scenarios must be plausible,
   not absurd.
6. **"How to check understanding" guidance** — every article needs a concrete,
   non-generic section or paragraph on how a parent/teacher can tell the child actually
   understood the idea (not just "ask them if they get it").
7. **Natural internal links via `relatedSlugs` only** — pick exactly 2 real slugs from
   this existing live set, whichever are genuinely most relevant to THIS article's topic:
   `saving-money-for-kids, budgeting-for-kids, needs-vs-wants, money-games-for-kids,
   money-worksheets, currency-education, naming-big-feelings-about-money`, plus the other
   9 new articles in this same batch (ask me the batch list if unsure — otherwise stick to
   the 7 listed here, which is always safe). Do not invent a `ctaSlug` field or any other
   CTA mechanism — the site's existing single bottom-of-page CTA is handled automatically
   by the page template; you don't need to do anything for it.
8. **Avoid repeating another article's sections.** If your topic is adjacent to a
   sibling article in this same batch (e.g. the two AI-safety articles, or the two
   primary-school-activities articles), differentiate explicitly — add one sentence
   making clear how this article's angle differs, and don't restate the sibling's
   examples.
9. **No banned pressure/urgency language** ("don't miss out", "limited time", "act now"),
   no fabricated Money Quest outcome claims, no social-media platform references.
10. **Age-band names**: if you refer to Money Quest's own internal age bands, the English
    names are exactly "Explorer" (6-8), "Builder" (9-11), "Strategist" (12-14) — these are
    proper product names, used as-is. (Translators will map these to each locale's
    already-established equivalent later — you don't need to worry about that in English.)

## Style

Warm, practical, plain language — not academic, not salesy. Write for a tired parent or
a busy teacher who wants something they can actually use this week. Model tone on the
site's existing live articles if you want a reference (ask to read
`messages/en.json` → `articles["saving-money-for-kids"]` or `articles["needs-vs-wants"]`
for the existing register).

## Validation before you report back

- Confirm your JSON parses (`node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"`).
- Confirm every section has both `heading` and `paragraphs` keys (paragraphs may be `[]`).
- Confirm you used exactly 2 `relatedSlugs`, both real.
- Confirm title ≤ 60 chars, metaDescription 50-160 chars.
- Re-read your own citations list and confirm every one is from the approved list above
  and genuinely supports the sentence it's attached to.

Write your output file(s) to the exact path(s) you were given in your task prompt.
