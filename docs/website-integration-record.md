# Website integration record

Date: 27 October 2026. Work branch: `feature/website-completion-20261027`.

## Source state reviewed

- `main`: `468bdee32c356053e977c740bc4900b7fa63f888`.
- `feature/inclusive-future-skills`: `78c1f789b4366dabd544156cf74e5ed43a309ab8`.
- `feature/museum-library`: `307c0eb34a839220080f0d94874778abe6208c52`.
- Additional existing website work: `claude/launch-readiness-implementation`, `7f7ad70350f49ae29fcdf9988d66df0b97acf673`.

The requested feature branches diverged independently from main. Their homepage conflict was resolved by preserving both sections. Claude's website changes were imported selectively from its diff against main: web source, messages, engine tests, browser tests and relevant deployment/privacy documentation. No Godot file or Godot architecture document was imported or edited. This is intentionally not a merge of Claude's entire branch, which also contains a large separate Godot project.

Retained work includes Entrepreneur Quest, Leadership Quest, Real Life Quests, answer-order randomisation, accessible result announcements, previously unrendered lesson guidance and the dependency/async-params security migration to Next.js 15.5.28 and next-intl 4.14.9. Existing translation content remains in the repository; English is the only active launch locale. Legacy locale URLs temporarily redirect to the same English path and preserve queries. This permits a future multilingual release without deleting translations.

## New and improved experiences

- Seven world cards and overviews use consistent new character art.
- Lesson illustrations share the appropriate world artwork. Existing artwork is retained in the repository.
- The authored girl-and-puppy guide introduces worlds and activities, supports optional speech and can be hidden. Focus Mode hides decorative guide images. It is not a chatbot.
- Coin Cove and money-basics lessons include cash/account/payment-tool exploration and a retryable question. The same visual activity supports Inclusive Learning.
- Museum: 10 existing rooms retained and revised. Library: 8 existing books retained, expanded into 24 short pages.
- All discovery entries have three optional practical challenges, explanatory feedback and robust local progress handling.
- New Brain Lab: 6 tasks. New Mind Lab: 8 tasks. Future Skills: 8 introductory tasks, linking to retained deeper entrepreneurial, leadership and real-life experiences.
- Inclusive Learning: step-based access instructions, communication choices and an untimed picture activity. This is not yet a complete bespoke SEND curriculum.
- Keyboard skip link, stronger small-text contrast, synchronized accessibility settings, Escape/outside-click dismissal and content-safe settings placement.
- Read-aloud support is checked after mount to avoid server/client mismatch and stops on navigation. No automatic speech.
- Namecheap packaging includes all public assets and worksheets. Build-time canonical domain is explicit. A working default also prevents `.example` metadata.

## Data and safety

New progress keys are `money-quest-discovery-v1` (string discovery IDs) and `moneyquest_labs_v1` (task/level practice IDs). Both stay in the browser and tolerate inaccessible storage. No name, birth date, voice or free-text disclosure is requested. Existing accessibility preferences stay in their existing key. There is no new tracking, advertising, account, paid API, AI companion or deployment.

## Release boundaries

The new GitHub workflow builds and tests only this feature branch. It does not deploy. Merging to main and publishing to Namecheap require owner approval. The Namecheap build workflow assembles an artifact; it is not a deployment workflow.

Automated checks do not replace manual screen-reader, speech voice, real-device, keyboard, zoom and educational usability checks. Read the final QA record for actual run results rather than interpreting test source as a passing run.
