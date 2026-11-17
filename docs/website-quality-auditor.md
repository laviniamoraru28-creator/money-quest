# Money Quest website audit

## Run it from GitHub

1. Open [Actions → Website completion quality](https://github.com/laviniamoraru28-creator/money-quest/actions/workflows/website-quality.yml).
2. Select **Run workflow**, choose the branch to test, and select **Run workflow** again.
3. Open the run. Read its summary, then download **money-quest-audit** from **Artifacts**.
4. Unzip it and open `audit-report.md`. Keep the `evidence` folder next to the report so screenshot links work.

Pull requests reuse the existing essential checks. They also collect content findings and sample browser health across the nine locales. The schedule fires every Monday at 05:23 UTC, but a "Check monthly schedule window" step only lets the broad audit actually run on the first Monday of the month (day of month 1–7) — every other Monday ends there as a quick, cheap, green no-op, visible in the Actions history but doing none of the real work. The broad audit adds iPad page checks, link checks on three pages per language and two Lighthouse lab samples. Manual runs always use the broad profile regardless of the date. The schedule uses the default branch. Review the run result even when the job is red, since failed checks still produce a report when the runner has time to finish.

## Coverage

| Area | Existing checks reused | Additional audit |
| --- | --- | --- |
| Learning | Three age paths, lesson and activity order, level changes, answer shuffling, progress and rewards | Duplicate prompts and lesson activities, missing lesson entries and invalid choice mappings for choice-based games |
| Languages | Nine locale routes, message validation, switcher, unexpected English and speech helpers | Page and asset health for each locale, exact long-text matches to English, missing or byte-identical comic files |
| Explorer comics | All 90 lesson-language cases (ten topics × nine locales), including expected locale paths and narration | File inventory and aspect ratio and clipping checks on the first comic per enabled locale |
| Accessibility | Axe, keyboard navigation, accessible controls, read aloud, reduced motion, Focus Mode and Night View | Lighthouse accessibility sample and page overflow in Chromium and broad iPad checks |
| Navigation | Home, lesson navigation, settings, viewport single-row tests and browser journeys | Sampled internal links and visible asset errors, document status, wrong locale redirects and JavaScript errors |
| Certificates | Eligibility, browser download, and 27 localized PDF rendering and A4 print-boundary checks | Result included in the owner report |
| Performance and SEO | Existing metadata and SEO checks | Lighthouse for English home and Romanian play, including performance, accessibility, SEO, LCP, CLS and TBT |

Review the **Skipped and unverified** section for coverage gaps. OCR and lesson translation accuracy, real voice and screen-reader behavior, actual printing, and the educational value of activities still require human review. Asset hashes catch copies of the same file. An image with different bytes but the wrong text or illustration can still pass the hash check.

## Findings and history

The reporter uses the last complete scheduled result that GitHub still has cached as its comparison. The first run, or a run after cache eviction, labels findings as awaiting a baseline. A finding stays known while its stable test or content identifier is in the comparison. A previously resolved finding can count as new if it returns. Profile-specific checks only appear when that profile runs. Lighthouse deltas compare the same two URLs with earlier broad lab samples and are informational. A transient slowdown does not change the workflow result.

Browser assertions and failed workflow stages use the existing CI failure behavior. Editorial findings request review in the report and do not edit content. The workflow creates zero GitHub issues. It uses read-only repository permissions, the test build runs on loopback, and the checkout flag remains paused.

## Runner usage

The audit extends one existing Linux job. npm downloads and the scheduled browser install can use caches. Playwright uses two workers and the job has a 55-minute ceiling. Estimate 15–35 runner minutes for the one scheduled broad run that actually executes each month (the first Monday); the other three or four Mondays each cost under a minute, since the "Check monthly schedule window" step ends the run right after checkout. A manual dispatch always runs the full broad profile regardless of date. This is an estimate before measuring a complete hosted run. The additional workload on pull requests is the static content pass and 55 sampled Chromium cases, including the desktop-only link check. Audit artifacts expire after 35 days, comfortably covering the monthly cadence with a buffer. GitHub's [billing documentation](https://docs.github.com/en/actions/concepts/billing-and-usage) covers standard hosted runners for public repositories.

## Example

See [example report](website-quality-audit-example.md) for the format and a local content audit.
