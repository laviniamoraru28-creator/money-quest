# Locale-aware learning money: rollout checklist

The supported regional locale mapping is en-GB GBP, ro-RO RON, es-ES EUR, fr-FR EUR, de-DE EUR, it-IT EUR, pt-PT EUR, nl-NL EUR, pl-PL PLN. This is a locale convention, not a geolocation or live FX rate.

Implemented on this branch: central `formatLearningMoney` and the example account balance on Inclusive Learning. **Not yet implemented across the entire site.**

Next work, mandatory before claiming full coverage:
1. Search all `messages/*.json`, `src/content/*`, UI components, interactive games, simulators, authored books, quizzes, examples and downloadable PDF/ZIP sources for GBP, £, pound(s), pence, UK coin denominations and illustrative numeric prices.
2. Convert examples **semantically**: replace currency, denominations, arithmetic and accompanying imagery together. Never replace symbols blindly. A UK £1 coin cannot be described as a Romanian 1-leu coin if the image still depicts a pound.
3. Change first question in Money Personality from a £10 banknote to the appropriate local currency banknote for each locale, and review all follow-on questions/options.
4. Distinguish **nominal localization** (e.g., £10 to 10 lei in a fictional example) from exchange conversion. For price realism choose age-appropriate local prices and recalculate answer keys, budgets and savings.
5. Update visual assets, alt text, spoken narration, age-specific content and downloadable materials. Validate all nine languages and numerical answer keys.
6. Do not automatically localize historical facts or explicit cross-currency lessons. Such content must retain the actual source currency with explanation.
7. Do not change live Stripe pricing by locale without an explicit commerce plan and verified checkout/settlement.
8. Add automated checks for unexpected £/GBP in non-English instructional content and render tests for each locale.

This branch is a first technical step, not launch-ready multilingual currency support.
