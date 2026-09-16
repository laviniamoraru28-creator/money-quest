# Money Quest — Legal Review Checklist

**This document does not constitute legal advice, and nothing in this codebase should be described to users, regulators, or partners as "GDPR compliant," "COPPA compliant," or "compliant with the UK Children's Code."** Compliance is a legal determination made by qualified counsel reviewing the actual product, its actual jurisdiction(s) of operation, and its actual operating practices — not something a codebase can certify about itself. What follows is a working list of the areas this implementation has been built with those frameworks *in mind*, alongside a list of what still needs professional legal review before any public launch.

This list was produced by cross-referencing what is actually implemented (see `data-lifecycle-and-privacy.md`) against the general shape of the relevant frameworks. It is not exhaustive, and the frameworks themselves change over time.

---

## Frameworks considered

- **UK GDPR** and the **Data Protection Act 2018** — general data protection principles, and the additional care GDPR requires for children's data specifically (recital 38).
- **UK Children's Code** (ICO Age Appropriate Design Code) — 15 standards for online services likely to be accessed by children, covering things like data minimisation, default privacy settings, profiling, nudge techniques, and more.
- **COPPA** (US, Children's Online Privacy Protection Act / Rule) — where applicable, e.g. if the product is offered to US users or otherwise falls under FTC jurisdiction; COPPA's "verifiable parental consent" requirement in particular.
- General child-safety-by-design principles reflected in things like the EU's Better Internet for Kids initiative and similar frameworks in other jurisdictions this product may operate in.

---

## Areas requiring professional legal review before launch

### 1. Verifiable parental consent (COPPA, if applicable)
This product's signup flow verifies that *a* Supabase Auth account with a valid email exists, and that the account holder self-identifies as the child's parent/guardian. **This is not, on its own, "verifiable parental consent" in the COPPA sense** — COPPA specifies particular acceptable methods (e.g. a signed consent form, a credit-card transaction, a phone/video call, government ID verification) and self-identification alone typically does not meet that bar. **Needs review:** whether the current signup flow needs a stronger verification step, and if so, which COPPA-acceptable method fits the product.

### 2. Age verification of the account holder
Nothing in this codebase verifies that the person creating the parent account is actually an adult. **Needs review:** whether this is acceptable as-is (common in this product category, but not risk-free) or requires an explicit age-attestation/verification step at signup.

### 3. UK Children's Code — full 15-standard mapping
This document (§1-6 above) maps the standards most directly reflected in engineering choices already made (data minimisation, transparency, no profiling for ads, no nudge techniques toward less-private settings). It does **not** constitute a complete standard-by-standard compliance review. **Needs review:** a full mapping against all 15 standards by someone qualified to assess it, including standards this document doesn't address in depth (e.g. "Transparency" — whether the actual privacy notice language shown to users, not just the underlying data practices, meets the Code's "clear, age-appropriate" bar for each age band).

### 4. Privacy notice and Terms of Service content and enforceability
The in-app Privacy and Terms pages (`/privacy`, and any Terms page) contain product-team-written explanatory copy, not lawyer-drafted legal text. **Needs review:** the actual wording, for legal sufficiency, enforceability, and accuracy against what the system actually does (cross-referenced against `data-lifecycle-and-privacy.md`, which should itself be kept in sync with the code as it evolves).

### 5. Lawful basis for each category of processing (UK GDPR Article 6, and Article 9 if any special category data is ever involved)
This implementation has not assigned or documented a specific GDPR lawful basis (consent, legitimate interests, contract, etc.) per category of data processed. **Needs review:** determining and documenting the correct lawful basis for each processing activity, particularly the AI Coach's processing of child-submitted text via a third-party provider.

### 6. Data Protection Impact Assessment (DPIA)
A DPIA is very likely required (UK GDPR Article 35, and the Children's Code expects one for most services in scope) given this is a service likely to be accessed by children and involves some degree of automated processing (the AI Coach, the recommendation/skill-analysis logic). **Needs review:** a formal DPIA has not been conducted as part of this implementation work — `data-lifecycle-and-privacy.md` may serve as useful input to one, but is not a substitute for it.

### 7. Sub-processor agreements and international data transfers
This product relies on Supabase (database/auth hosting) and an AI model provider as sub-processors. **Needs review:** confirming appropriate Data Processing Agreements are in place with each, confirming which regions data is actually stored/processed in, and confirming appropriate safeguards (e.g. UK International Data Transfer Agreement / Standard Contractual Clauses) for any transfer outside the UK/adequate jurisdictions.

### 8. AI provider's own data handling and training-data practices
This implementation controls what Money Quest itself stores (§3 of the lifecycle doc), but does not control the AI provider's own retention/training practices for API traffic. **Needs review:** confirming the AI provider's data-processing terms are appropriate for a child-directed product specifically (not all providers' standard commercial terms are), and whether any additional contractual terms or technical measures (e.g. a zero-data-retention agreement) are needed.

### 9. Breach notification procedures
No formal incident-response or breach-notification procedure exists in this codebase (this is an organisational/process artifact, not something engineering alone produces). **Needs review:** establishing a procedure that meets UK GDPR's 72-hour notification requirement to the ICO where applicable, and any US state-level requirements if operating there.

### 10. Data retention periods — legal sufficiency, not just technical existence
§6-7 of the lifecycle document describes what retention mechanism exists technically. **Needs review:** whether the specific periods chosen (e.g. 12 months for the AI Coach log) are legally appropriate and documented in the privacy notice, and whether gameplay/progress data's indefinite retention (until account deletion) needs a defined maximum period regardless of account activity.

### 11. Children's Code "detrimental use of data" and profiling standard, specifically for the AI Coach and recommendation engine
The Parent Dashboard's skill analysis and "recommended next activity" logic (`src/lib/domain/progress-analysis.ts`) is rule-based, not a black-box model, and is shown only to the child's own parent — but it is still a form of profiling a child's behaviour. **Needs review:** whether this specific feature needs additional Children's Code-specific treatment beyond what's already true of it (no advertising use, no cross-child comparison, parent-only visibility).

### 12. Advertising model review against the Children's Code
The product architecture states advertising is parent-facing only and never targets children — **Needs review:** if/when an actual ad implementation is built, confirming the specific ad network/partner chosen doesn't itself profile the child (e.g. via any tracking pixel that could fire on a page a child is using) even if the ad creative itself is only shown to parents.

### 13. Cross-jurisdictional operation
If Money Quest is offered outside the UK/US, **needs review:** which additional child-privacy frameworks apply (e.g. GDPR-K equivalents in other EU states, Australia's Privacy Act amendments for children, etc.) and whether this implementation's approach (built primarily with UK GDPR/Children's Code and COPPA in mind) is sufficient or needs jurisdiction-specific additions.

### 14. Accessibility and inclusive-design legal requirements
Not strictly a child-privacy topic, but relevant to a product for children: **needs review** of applicable accessibility legal requirements (e.g. UK Public Sector Bodies Accessibility Regulations if any part of this is publicly funded, or general consumer-protection expectations) beyond the WCAG-informed engineering practices already followed throughout this build.

---

## What this checklist is *not*

It is not a substitute for legal counsel, not a guarantee that addressing every item above results in compliance, and not a claim that the current implementation is deficient in any specific way beyond what's stated — only that these are the areas where a qualified professional, not an engineering process, needs to make the actual determination.
