# Quiet corner implementation checkpoint, 29 October 2026

Scope: website feature branch only. No main changes, deployment, hosting changes or Godot edits.

## Implemented

- Free `/en/quiet-corner`, visible break link in the global reading toolbar and learning laboratories.
- Three original photorealistic AI-generated still images: Max resting beside a rainy window, ocean and garden. Clearly identified as generated images, not videos.
- Images start still. Optional slow 36-second photo zoom, explicit stop, system and website reduced-motion support, hide-picture option. No animated dog anatomy or simulated video claim.
- Independent optional rain-like filtered noise or an original slow instrumental melody, synthesized locally with Web Audio. Default silent, 20% initial app volume, adjustable volume, soft onset, no audio downloads or external players.
- Stop-all control. Sound stops on navigation, page hide, backgrounding, switching sound, communication cards and read-aloud. Resuming a page never automatically resumes sound. Pending audio starts cannot restart after cancellation.
- Three communication cards (break, quiet, help), simple SVG symbols, enlarged dialog with keyboard focus and Escape/close. No saved selections or messages sent.
- No accounts, ads, scores, time limits, paid links or emotion/health tracking in this feature. It does not claim to treat a condition or make every child calm.
- Complete feature copy in EN/RO/ES/FR/DE/IT/PT/NL/PL. This does not activate incomplete site-wide locales. Existing three educational levels remain unchanged; this optional break has no age score or challenge.
- English canonical/social metadata and sitemap entry. Existing offline manifest discovers the route and three local images; synthesized sound needs no network after the page is cached.

## Validation

Node 24.22.1: 27/27 unit suites passed, including audio disposal/cancellation/failure/volume and nine-language copy checks. Lint, TypeScript and production build passed. Browser tests added for 320px layout, images, WCAG checks, reduced motion, communication keyboard flow, unsupported audio and audio cleanup. CI browser results must be recorded after the feature commit; added tests are not a passing-browser claim.

## Remaining

Three real silent Pexels videos are now integrated in an optional, initially closed video panel: ocean water, rain on a window and aquarium fish. Source/author/licence URLs, original and processed hashes, duration/codec and transformations are recorded in `docs/quiet-media-manifest.json`. Together they add 1,984,251 bytes. An original instrumental melody is now synthesized locally from a 48-second score. Optional recorded nature tracks or additional music choices remain future additions; the melody is not a human instrumental recording. Broader book/biography/site/PDF translation and live commerce work remain pending. No promise is made to restore an unfinished lesson answer after navigating away; completed progress follows the existing device-only storage.

## Artwork provenance

Built-in image generation, 29 October 2026. Final optimized assets are stored in `public/images/money-quest/quiet/`; source PNGs were inspected when generated. Dimensions and SHA-256 hashes appear in `docs/artwork-manifest.json`.

Prompt briefs: photorealistic natural pet photography of a golden retriever puppy sleeping on an oatmeal blanket by a rainy window; realistic small coastal waves on an empty sandy beach; a realistic green garden with a grassy clearing and soft daylight. All requested no people, text, logos, watermarks, illustration or CGI. No existing character artwork was replaced.

Design references reviewed: W3C Pause Stop Hide https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide ; Audio Control https://www.w3.org/WAI/WCAG21/Understanding/audio-control ; National Autistic Society sensory differences https://www.autism.org.uk/advice-and-guidance/about-autism/sensory-processing . These inform user choice and controls, not therapeutic efficacy.


## Real video follow-up

The three videos are served from the application origin, with no remote player, tracking embed or runtime Pexels requests. They load only after Watch video. Native playback/seek controls remain available; repeat is unchecked by default. Reduced motion keeps the preview still and disables playback. Stop-all, cards, speech, closing the panel, backgrounding and navigation stop video; changing settings does not restart it. Each silent clip has a translated visual description. Video controls, descriptions and credits have complete feature copy in all nine languages, without activating incomplete site locales.

MP4 paths bypass locale redirection. The opt-in offline manifest now includes the local MP4s, and the service worker supports single byte ranges (including suffix and open-ended requests) for cached playback and seeking. Unit tests exercise the actual service worker and reject invalid ranges. Browser regression coverage includes all three clips, no initial media requests, no external requests, reduced motion, repeat, failed media, offline playback and byte-range responses. Local lint, TypeScript and all 27 unit suites passed. The video follow-up still requires its exact CI browser result before being called browser-verified.


## Original music follow-up

`src/lib/audio/quiet-music.ts` contains an original 48-second score with sixteen sparse melody notes and four accompanying chords. It uses sine fundamentals and a quiet second harmonic, soft attacks and releases, and no sampled or externally sourced music. The score repeats while the child chooses to keep sound playing. Default remains silence and 20% app volume. Rain-like ambience remains a separate choice. The translated melody label is present in all nine feature languages.

The Web Audio clock schedules notes; a once-per-second timer queues only the next whole cycle near its boundary. Delayed timers skip the missed gap rather than play a burst of old notes. Each completed voice disconnects its nodes; stop cancels scheduling and closes the context, including on navigation, hidden pages, speech or communication cards. No new audio file, account, SDK, network call or child data is introduced. This is an optional sound choice, not a treatment or a claim that every child will find it calming.

Regression checks cover varied pitches, bounded note durations, future cycle scheduling, delayed ticks, timer cancellation, stale queued callbacks and a volume change during startup. Browser checks exercise real Web Audio output with an analyser and keyboard volume control, without claiming a physical-device listening session or a clinical/user evaluation. Exact CI result must be recorded in the PR after this follow-up.
