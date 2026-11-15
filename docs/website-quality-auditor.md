# Money Quest website audit

## Run it from GitHub

1. Open [Actions → Website completion quality](https://github.com/laviniamoraru28-creator/money-quest/actions/workflows/website-quality.yml).
2. Select **Run workflow**, choose the branch to test, and select **Run workflow** again.
3. Open the run. Read its summary, then download **money-quest-audit** from **Artifacts**.
4. Unzip it and open `audit-report.md`. Keep the `evidence` folder next to the report so screenshot links work.

Pull requests reuse the existing essential checks. They also collect content findings and sample browser health across the nine locales. Monday at 05:23 UTC, the broad audit adds iPad page checks and two Lighthouse lab samples. Manual runs use the broad profile. The schedule uses the default branch. Review the run result even when the job is red, since failed checks still produce a report when the runner has time to finish.

## Coverage

| Area | Existing checks reused | Additional audit |
| --- | --- | --- |
| Learning | Three age paths, lesson and activity order, level changes, answer shuffling, progress and rewards | Duplicate prompts and lesson activities, missing lesson entries and invalid choice mappings for choice-based games |
| Languages | Nine locale routes, message validation, switcher, unexpected English and speech helpers | Page and asset health for each locale, exact long-text matches to English, missing or byte-identical comic files |
| Explorer comics | Ten English comics on the base release. The existing comic suite expands to 90 lesson-language cases in [PR #58](https://github.com/laviniamoraru28-creator/money-quest/pull/58), including expected locale paths and narration | File inventory and aspect ratio and clipping checks on the first comic per enabled locale |
| Accessibility | Axe, keyboard navigation, accessible controls, read aloud, reduced motion, Focus Mode and Night View | Lighthouse accessibility sample and page overflow in Chromium and broad iPad checks |
| Navigation | Home, lesson navigation, settings, viewport single-row tests and browser journeys | Sampled English homepage links and visible asset errors, document status, wrong locale redirects and JavaScript errors |
| Certificates | Eligibility, browser download, and 27 localized PDF rendering and A4 print-boundary checks | Result included in the owner report |
| Performance and SEO | Existing metadata and SEO checks | Lighthouse for English home and Romanian play, including performance, accessibility, SEO, LCP, CLS and TBT |

Review the **Skipped and unverified** section for coverage gaps. At the start of this work, the localized comic suite and eight localized image sets lived on PR #58. The auditor discovers the existing suite when that change lands. OCR and lesson translation accuracy, real voice and screen-reader behavior, actual printing, and the educational value of activities still require human review. Asset hashes catch copies of the same file. An image with different bytes but the wrong text or illustration can still pass the hash check.

## Findings and history

The reporter uses the last complete scheduled result that GitHub still has cached as its comparison. The first run, or a run after cache eviction, labels findings as awaiting a baseline. A finding stays known while its stable test or content identifier is in the comparison. A previously resolved finding can count as new if it returns. Profile-specific checks only appear when that profile runs. Lighthouse deltas compare the same two URLs with earlier broad lab samples and are informational. A transient slowdown does not change the workflow result.

Browser assertions and failed workflow stages use the existing CI failure behavior. Editorial findings request review in the report and do not edit content. The workflow creates zero GitHub issues. It uses read-only repository permissions, the test build runs on loopback, and the checkout flag remains paused.

## Runner usage

The audit extends one existing Linux job. npm downloads and the scheduled browser install can use caches. Playwright uses two workers and the job has a 55-minute ceiling. Estimate 15–35 runner minutes for a typical scheduled or manual run, or 60–175 minutes for four to five scheduled runs per month. This is an estimate before measuring a complete hosted run. The additional workload on pull requests is the static content pass and 55 sampled Chromium cases, including the desktop-only link check. Audit artifacts expire after 14 days. GitHub's [billing documentation](https://docs.github.com/en/actions/concepts/billing-and-usage) covers standard hosted runners for public repositories.

## Example

See [example report](website-quality-audit-example.md) for the format and a local content audit.
