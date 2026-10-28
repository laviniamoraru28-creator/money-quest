# Library expansion and Brain Lab artwork

## Scope and branch

Built from `review/website-completion-20261027` at `082014f6a35fed68771fab00dc8ec19958ca250c`, preserving Claude’s review fixes and CI trigger. The new PR targets that review branch, not main. CI now accepts PRs targeting either the delivery or review branch. Nothing is deployed automatically.

## Implemented Library shelves

- Initial three original Money Quest fictional books, 20 chapters in total: **The Little Compass and the Money Choices** (Explorer, eight chapters), **The Garden Everyone Could Enter** (Builder, six chapters), **The Market Town Notebook** (Strategist, six chapters). These are short chapter books available in full as accessible HTML, not full-length commercial volumes or PDFs. The shared reader offers optional speech, larger text, chapter contents, constructive answer-specific feedback, optional activities, Back/Next, and optional local completion. Questions never lock navigation. Only the read marker is persisted; answers and chapter location are not saved. Existing progress reset clears the shared discovery store.
- Twelve published books by other authors. Each has author/publisher attribution, an attributed age guide, three brief editorial ideas, a discussion prompt and an external buying/details link for grown-ups. Topic filtering is local and keyboard operable. No affiliate parameters, price claims, cover scraping, full-text uploads or advertising embeds.
- Three playful mini-biographies: Mark Zuckerberg, Ada Lovelace and Madam C. J. Walker. Factual prose is separated from invented visual jokes, and each profile links its factual source. The profiles acknowledge collaboration and responsibility rather than treating fame or wealth as proof of goodness. Ada’s original short biography remains available as a separate quick read; the new profile adds a portrait and a different discussion activity.
- All eight existing three-page short reads and their routes/progress remain intact, including the George Stephenson and Ada Lovelace introductions.
- Six new Library detail routes have canonicals, social metadata and sitemap entries. The sitemap now has 41 URLs, up from 35.

## Source and rights notes

The catalogue is an introduction based on publisher/author descriptions, not a claim that every page of the books has been read or independently reviewed. Ages are attributed guidance and do not measure individual reading ability. No free full-text access has been verified for these twelve works; do not label the links “read free”. Families can ask their local library about borrowing, without a promise of local availability.

Sources checked 28 October 2026:

| Book | Source and access |
| --- | --- |
| Money for Beginners, Matthew Oldham and Eddie Reynolds | https://usborne.com/us/money-for-beginners-9781805070139 |
| The Lemonade War, Jacqueline Davies | https://www.jacquelinedavies.net/the-lemonade-wars |
| Sofia Valdez, Future Prez, Andrea Beaty | https://www.abramsbooks.com/product/sofia-valdez-future-prez_9781419737046/ |
| What Do You Do With an Idea?, Kobi Yamada | https://www.penguinrandomhouse.com/books/832674/what-do-you-do-with-an-idea-by-kobi-yamada/ |
| Understanding Business, Lara Bryan and Rose Hall | Publisher listing: https://usborne.com/us/books/series/for-beginners ; working UK purchase/details page: https://www.eden.co.uk/christian-books/christian-books-for-children/educational-books/understanding-business/ |
| Understanding AI, Rachel Firth and Rose Hall | https://usborne.com/us/understanding-ai-9781836050988 |

The indexed Usborne direct Business product URL returned 404 when opened. The implementation uses the working UK bookseller page instead of shipping that known-broken link. Some other catalogue destinations are US editions; the UI explicitly asks grown-ups to check edition and delivery options.

Biography sources:

- Mark: https://about.fb.com/news/2009/05/facebook-and-think-computer-corporation-resolve-trademark-dispute/ . An official company account, not an independent full biography. The profile uses historical facts, avoids current office-holder claims and does not encourage children to sign up.
- Ada: https://collection.sciencemuseumgroup.org.uk/people/cp38764 . The accompanying activity is our own symbolic-instructions exercise, not a reconstruction of her algorithm.
- Walker: https://www.nps.gov/articles/two-american-entrepreneurs-madam-c-j-walker-and-j-c-penney-teaching-with-historic-places.htm . The brush joke is labelled imaginary. No unsupported “first millionaire” claim.

## Education and accessibility

MoneyHelper’s age guide supports discussing needs/wants and saving with younger children and choices around age 7–8: https://www.moneyhelper.org.uk/en/family-and-care/talk-money/talk-learn-do/learning-about-money-by-age . This supports topic selection, not a proven reading level or a claim that these books improve outcomes. See `educational-design-evidence.md` for the existing evidence and limitations behind clear instructions, optional speech, short steps and constructive feedback.

Original stories use fictional examples rather than asking for family finances. They do not assume pocket money, equate wealth with effort, require spoken answers or encourage unsupervised trading. The Strategist example explicitly excludes labour from its simplified cash calculation, distinguishes revenue/profit/loss and labels break-even assumptions. The leadership story offers drawing, pointing, AAC and quiet roles.

Native controls, focus transfer after chapter changes, no timers, no auto-playing sound or animation, no account, and optional local completion support autonomy. Actual voice playback, child comprehension and assistive-technology usability still require human review.

## Artwork and scope limits

Five new generated scenes produce six committed optimized WebPs: one Explorer cover, three portraits, and Brain Lab plus its thumbnail. All generator prompts and the rejected/corrected Ada variant are documented in `library-artwork-prompts-20261028.md`. The new Brain Lab image appears in the section, homepage tile and share metadata. Existing Brain Lab files remain intact. Two other book covers reuse approved world art. There are not individual illustrations for all 20 chapters.

English remains the only active launch language under the owner’s earlier requirement. No new language was selected in the follow-up conversation; this PR does not pretend new books are translated.

The ten-room Museum implementation is preserved. The owner recalled a richer prior Museum concept, but Personal Context retrieval returned “unavailable” and the repository does not contain the complete earlier brief. This PR does not claim to have reconstructed or implemented that missing concept. Obtain that brief before redesigning Museum.

## Verification record

Local verification on Node 24.22.1: lint, TypeScript, all 21 unit/content suites and production build. The existing feedback validator still prints five pre-existing phrasing warnings in older games; these are not new failures. Browser tests added for all 20 chapters, feedback/retry, free chapter navigation, blocked storage, completion/reload, topic filtering, external destinations, decoded artwork, all three biography pages, mobile overflow and WCAG scans. Execution evidence and any fixes are recorded in the PR and its GitHub Actions run; test source alone is not proof of passing. No local browser or real-device result is claimed here.

Publication requires editorial approval of the manuscripts and portraits, appropriate manual QA and a separately approved staging update. No merge, deployment, Namecheap setting change or Godot modification is included.


## Expanded subject coverage after owner clarification

The external catalogue now has 12 titles. Additional verified entries cover Brain Lab / neuroscience and learning (The Brain Book, Liam Drew), everyday finance for ages 6–9 (Why Money Matters, Deborah Meaden), money habits and choices (Dosh, Rashmi Sirdeshpande), emotions (The Great Big Book of Feelings, Mary Hoffman), adolescent wellbeing (Looking After Your Mental Health, Alice James and Louie Stowell), and digital safety (Staying Safe Online, Louie Stowell). Original Money Quest fiction currently covers money choices, leadership and enterprise; this is not a claim that original books already cover every website subject.

Additional sources/access pages:
- https://www.penguinrandomhouse.com/books/669236/the-brain-book-by-liam-drew/ (publisher age 7–9).
- https://collins.co.uk/products/9780008520908 (publisher age 6–9).
- https://www.hachette.co.uk/titles/rashmi-sirdeshpande/dosh/9781526362759/ (review on publisher page recommends 9+; official sample link, not free full book).
- https://www.quarto.com/books/9781847807588/the-great-big-book-of-feelings ; age source https://www.booktrust.org.uk/book-recommendations/bookfinder/the-great-big-book-of-feelings/ (interest 4+, reading 7+).
- https://usborne.com/row/quicklinks/quicklink/13234-looking-after-your-mental-health (publisher age 11+); working purchase page https://www.hive.co.uk/product/louie-stowell/looking-after-your-mental-health/21613498 . Some editions credit additional contributors; listing follows the displayed core authors and illustrator, not a claim of exhaustive edition credits.
- https://usborne.com/row/staying-safe-online-9781409597810 (publisher age 11+).

Dosh is an age-appropriate conversation starter for money habits and feelings, not an adult behavioural-finance textbook. Older-teen wellbeing/safety titles are labelled for grown-up preview because their descriptions include sensitive adolescent subjects. No diagnostic or treatment claim is made.

## Site-wide Listen control

At the owner’s request, the English read-aloud buttons now show only Listen / Stop. A page-level control in the shared locale layout covers all English pages, including Leadership, enterprise, worlds and laboratories. It reads visible main content, excluding navigation, hidden content and form values. It never starts automatically and stops when the route or main content changes. Existing scoped guide/chapter/lesson readers remain available. Long text is split into word-preserving chunks. The website does not send audio requests to a new service; installed voices and any voice network use depend on browser/OS. On unsupported browsers, the page control remains disabled. Real voice playback still needs manual validation.

## Expanded collection

The collection now has ten original short chapter books and ten mini-biographies. Seven additional Explorer stories bring the chapter count to 62. They reuse existing world/section art, not bespoke illustrations for every scene. Seven new biographies use accurately labelled thematic images rather than presenting these images as portraits. Sources and source-check dates appear on each biography page. All content is original or paraphrased; full external books are not hosted. Nine-language translation remains in progress, with English the only active site locale in this checkpoint.
