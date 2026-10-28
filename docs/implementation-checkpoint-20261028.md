# Expanded request checkpoint, 28 October 2026

This branch is a draft implementation, not a launch-ready release. It extends the Library request after the owner added site-wide Listen, Night view, offline download, public moderated feedback, true age differentiation, familiar fictional names, a book-like reader, a phone-style investing simulator and a modest coin reward effect.

## Implemented in this checkpoint

- Three original books, twelve external book listings, three sourced mini-biographies, eight preserved short reads.
- Illustrated paper-style book spreads, separate page-turn buttons, contents and optional chapter questions. Explorer pages have one short paragraph; other books have up to two. Not every spread has newly commissioned unique art. Six optimized WebPs are committed, including the new Brain Lab image requested by the owner.
- Site-wide Listen / Stop, scoped readers, word-preserving long-text chunking. Actual voice playback depends on browser/OS and still needs manual checking.
- Night view, synchronized with existing accessibility preferences and kept separate from progress reset. Existing Reduced Motion and Focus Mode remain.
- Opt-in offline package: generated after the real production build, covering English learning pages, bundled code/fonts, artwork and worksheets. Download is not marked complete until every listed request is cached. No APIs or external books are cached. Online reviews, external buying links and external voice services require connectivity. Offline files may be evicted by the browser. No claim of permanent or universal offline support.
- Anonymous rating totals and moderated comments. No name/email/account fields, no IP/user-agent/device identifier saved by the application. Submitted text can still contain personal information, so comments remain private until human moderation. Links, HTML, email-like strings and long phone-like number sequences are rejected. Public counts are not verified unique users or purchases. Connection logs remain a hosting matter.
- Review storage is disabled unless an absolute `MONEYQUEST_REVIEW_STORE_PATH` ending in `.json` is configured. Use a persistent private directory outside the public document root. Moderation requires `MONEYQUEST_REVIEW_MODERATION_KEY`, at least 24 bytes; generate a high-entropy key and never commit it. The owner-only `/en/reviews/moderate` page keeps it only in component memory. Actual hosting configuration requires separate approval and has not been performed.
- Review writes use an exclusive lock and atomic file replacement. A crash can leave a lock; stop the relevant app and inspect/remove the stale `.lock` through authorised maintenance before restarting. The app does not automatically steal locks. A durable filesystem backup/retention policy is still needed. Maximum 500 retained comment records; no claim of abuse-proof or one-person-one-vote ratings.
- All 22 Brain/Mind/Future Skills tasks now have different ideas, scenarios, answer wording and explanations across the three levels, in addition to the existing distinct practical tasks. Broader age/content audit remains open below.
- Fictional names simplified without changing internal character IDs or real authors/biographical names. Investing Lab uses a phone-like frame around the existing fictional price chart; simulation rules are unchanged. Coin effects only trigger on a new positive `coinsAwarded` result and respect Reduced Motion.

## Outstanding work explicitly not claimed complete

1. The owner requested all nine languages. Only English remains active while new and previously hardcoded content is awaiting translation, integration and validation. Existing nine message files are preserved. Do not activate empty or partially English pages as complete translations.
2. The owner requested genuine age-specific information everywhere. The 22 laboratory tasks are fixed. Existing world lessons, game variants, simulator, quests, investing explanations, Museum, short reads and biographies still need a section-by-section audit and any missing age-appropriate rewrites. A fixed-age book should state its target audience rather than pretend one manuscript changes into three age levels.
3. The ten-room Museum is preserved, but the full earlier desired museum experience could not be recovered: Personal Context returned unavailable. Do not claim its richer prior brief has been reconstructed.
4. Gmail account creation needs the owner’s Google verification. No address has been created or added to the website.
5. Legal drafts must be updated/reviewed before enabling public comments. Existing text saying all feedback stays on-device describes the old private-feedback form, not this new optional public review endpoint. Public comment moderation, retention and hosting logs need owner/legal review. No legal approval is claimed.
6. Final multilingual SEO, manuscript/portrait review, real-device/audio/screen-reader checks and browser execution evidence remain required. No main merge, deployment, hosting change or Godot modification has been made.

## Evidence and tests

See `child-design-evidence-20261028.md`, `library-expansion-20261028.md`, `library-artwork-prompts-20261028.md`, and the GitHub Actions run linked from the draft PR. Local checks on Node 24.22.1 have passed lint, typecheck, 23 unit/content suites and production build before the final browser additions. Re-run after subsequent edits. Five pre-existing feedback-phrasing warnings still appear in the older-content validator. No unexecuted browser test is a passing result.

Offline implementation references: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API and https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage . HTTPS/localhost is required; CacheStorage availability and eviction vary by browser. Service workers are opt-in here, not a new tracking or push-notification system.
