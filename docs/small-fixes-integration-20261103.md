# Existing website fixes combined

Combines the previously requested corrections from PRs #17, #18, #19, #22 and #23 on the tested Learn with Pictures removal branch (#28). No new features.

- Requested Romanian homepage and SEO wording.
- Money Personality prompts use a £10 banknote, with clearer Romanian questions, answers and selected result copy. Answer ordering and scoring are unchanged.
- Removes the unwanted caption under the welcome image while retaining narration.
- Visible localized footer feedback/reviews link with a decorative star. It opens the existing moderated public reviews page, rather than the old device-local feedback form. The browser moderation journey starts through this footer link.
- Night View uses the same inline alignment, icon gap and 48px minimum height as Listen.
- Keeps the two retired Explorer links and route out of the homepage/sitemap, retaining Inclusive Learning and SEND support.

Compared decoded JSON before integration: 64 intended message values change across nine locales. All other values, including newer certificate strings, are preserved. Original JSON formatting is retained. Main is not overwritten with the old branches' full files.

Validation: TypeScript, ESLint and all 49 unit suites pass. Production build and complete browser CI are recorded separately when complete. No hosting change or commerce activation.
