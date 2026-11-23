# Shared brief: translating 10 new Learn articles into other languages

The English source for all 10 articles now lives in `/home/user/money-quest/messages/en.json`
under `articles.<slug>`, for these exact slugs:

- entrepreneurial-thinking-in-children
- financial-literacy-age-of-ai
- financial-literacy-send-accessible-activities
- free-financial-literacy-activities-primary-school
- free-money-lesson-plans-primary-teachers
- how-to-teach-kids-about-money
- how-to-teach-leadership-skills-to-children
- skills-for-ai-powered-future
- teaching-children-ai-money-safety
- why-critical-thinking-matters-for-children

Each entry has this shape (`ArticleLocalizedText` in `src/content/types.ts`):
```
{ "title": string, "metaDescription": string,
  "sections": [ { "heading": string, "paragraphs": string[], "list"?: string[] } ],
  "faqs": [ { "question": string, "answer": string } ] }
```

## Your task

Translate all 10 entries into natural, idiomatic prose in your assigned language — not
literal/word-for-word. Preserve exactly:
- The same number of sections, same number of paragraphs per section, same list items
  (when present), same number of FAQs, for every one of the 10 articles. Don't add,
  remove, merge, or summarize — translate faithfully and completely.
- Numbers, prices, and ages exactly as given in English.
- No new statistics, studies, or sources beyond what's already in the English text.

## Mandatory terminology table — use these EXACT terms, do not re-derive your own

Money Quest's internal age-band product names already have an established translation
in this codebase (`src/content/certificate-copy.ts`). Use the row for your language
every time "Explorer", "Builder", or "Strategist" appears — do not invent alternatives:

| Locale | Explorer (6-8) | Builder (9-11) | Strategist (12-14) |
|---|---|---|---|
| ro | Explorator | Constructor | Strateg |
| es | Explorador | Constructor | Estratega |
| fr | Explorateur | Bâtisseur | Stratège |
| de | Entdecker | Gestalter | Stratege |
| it | Esploratore | Costruttore | Stratega |
| pt | Explorador | Construtor | Estratega |
| nl | Ontdekker | Bouwer | Strateeg |
| pl | Odkrywca | Budowniczy | Strateg |

## UK-specific / acronym terms — same treatment in every language, for consistency

- **SEND**: keep the English acronym "SEND" as-is in every language (it's a specific UK
  legal/educational term, not a universal concept) — gloss it once per article, on
  first use, with a short native-language explanation in parentheses (e.g. "SEND
  (nevoi educaționale speciale și dizabilități)" in Romanian). Do not substitute a
  different national special-education term/acronym in its place.
- **AAC**: same pattern — keep "AAC" as the acronym, gloss once per article with the
  native-language expansion ("augmentative and alternative communication").
- **Key Stage 1 / Key Stage 2**: keep as the English UK term, with the age range given
  in parentheses in your language. Don't map it onto your own country's school-stage
  terminology (it isn't an exact match).
- Any sentence that explicitly flags something as "a UK-style example" / "in pounds" /
  etc. must stay flagged as UK-specific in your translation — never silently
  universalized or deleted.

## Style

Match the register already used in your language's existing live articles — warm,
practical, plain, not academic. Read `messages/<your-locale>.json` →
`articles["saving-money-for-kids"]` and `articles["needs-vs-wants"]` first, as your
tone reference.

## Output

Edit `/home/user/money-quest/messages/<your-locale>.json` directly: read the current
file, add one new key under the top-level `"articles"` object for each of the 10 slugs
above, and write the file back as valid JSON (UTF-8, your language's native
characters/diacritics included literally, never `\uXXXX`-escaped). Do not touch any
existing keys already in that file.

## Validation before you report back

- `node -e "JSON.parse(require('fs').readFileSync('messages/<locale>.json','utf8'))"`
  parses cleanly.
- For every one of the 10 slugs: your file's `sections.length`, `faqs.length`, and
  per-section `paragraphs.length`/`list.length` all exactly match `messages/en.json`.
- `git diff --stat messages/<locale>.json` shows pure additions — none of the existing
  7 article keys were touched.
- Every "Explorer"/"Builder"/"Strategist" mention uses the exact term from the table
  above, nothing else.

Do NOT touch any file outside `messages/<your-locale>.json`. Do not touch anything under
`src/app/[locale]/adventure`, `ai-quest`, `academy-certificate`, `Adventure*`/`Cinematic*`
components, `cinematic-copy.ts`, or `public/cinematic/` — those belong to a separate,
in-progress PR from another contributor.
