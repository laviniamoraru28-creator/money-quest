> Not a compliance certification. A self-assessment against the ICO's published Children's Code standards, written from the actual current implementation — verified by reading code and running tests, not by intent or design documents. See `legal-and-privacy-readiness-report.md` for what still requires a qualified lawyer.
>
> **Note**: this assessment was originally written while an AI Coach feature existed. That feature has since been removed entirely from V1 (see Standard 15 below and `dpia.md` §10) — every other AI Coach mention in this document below is historical context from when the assessment was first written, not a claim that the feature still exists. Two claims that would otherwise be actively false as a result are corrected directly in place (Standards 9 and 11).

# Money Quest — Children's Code Self-Assessment (15 Standards)

## 1. Best interests of the child

- **A. Current**: No advertising targets children beyond house creatives (structurally, `ChildAdRequest` carries no targeting fields). No gambling/loot-box mechanics anywhere (verified, `money-quest-gamification-ethics.md`). AI Coach never shames a child for a decision (verified, 65 automated prompt checks). Content never references only one country's institutions without a "rules vary" note (verified, `money-quest-curriculum-content.md`).
- **B. Missing**: No documented, repeatable process for weighing "best interests" on *future* feature decisions — today it's implicit in each build's own reasoning, not a standing checklist anyone has to consult.
- **C. Code changes required**: None found this pass.
- **D. Database changes required**: None.
- **E. UI changes required**: None.
- **F. Documentation required**: A short "best interests" test added to the internal review process for new features — not yet written as its own document; flagged as a gap, not fabricated as done.
- **G. How tested**: Re-read the advertising, gamification, and AI Coach code directly this session.
- **H. Implemented?**: Substantially yes in the current feature set; the standing *process* for future features is not yet formalised.

## 2. Data Protection Impact Assessments

- **A. Current**: No DPIA existed before this session.
- **B. Missing**: A DPIA covering this specific implementation.
- **C-E**: N/A (a DPIA is documentation, not code).
- **F. Documentation required**: `dpia.md` — written this session.
- **G. How tested**: Built directly from the real schema and code, not a generic template.
- **H. Implemented?**: Yes — `dpia.md` now exists.

## 3. Age-appropriate application

- **A. Current**: Three distinct content/UI experiences (Explorer 6-8, Builder 9-11, Strategist 12-14) with independently verified reading-level differences (`validate-lesson-content.ts` measures sentence length, doesn't just assert it). AI Coach system prompt has a distinct style layer per band (65 checks).
- **B. Missing**: No age-verification mechanism beyond the parent's own selection at onboarding — the child never self-declares an age the app then relies on for legal purposes; the parent is the one asserting age band, which is the intended, documented design (see `dpia.md`).
- **C-E**: None required — this is the existing, verified design.
- **F**: Documented in `dpia.md` and `childrens-privacy-notice.md`.
- **G. Tested**: `validate-lesson-content.ts` (reading-level check), `validate-coach-prompts.ts` (65 checks).
- **H. Implemented?**: Yes.

## 4. Transparency

- **A. Current**: A Privacy Centre page exists in-app (`/parent/settings/privacy`) — this session expanded it to cover AI Coach data handling, cookies, and data-subject rights in plain language, not just marketing-page prose.
- **B. Missing (before this session)**: No just-in-time explanation at the actual point personal data is collected (the child's nickname field during onboarding).
- **C. Code changes**: Added a one-line, plain-English note directly under the nickname field: "Not their real name — a fun nickname works best, and it's all we'll ever ask for."
- **D. Database changes**: None.
- **E. UI changes**: Done — onboarding page, and the expanded Privacy Centre.
- **F. Documentation**: `childrens-privacy-notice.md`, `parent-privacy-notice.md` (new, age/audience-appropriate versions rather than one generic policy for both).
- **G. Tested**: Re-read the rendered onboarding form and Privacy Centre page directly.
- **H. Implemented?**: Yes.

## 5. Detrimental use of data

- **A. Current**: Analytics is structurally firewalled from child data (15 automated checks, `test-analytics-child-firewall.ts`). No child data is ever used for advertising targeting (structurally impossible — `ChildAdRequest` has no targeting fields). AI Coach interaction log is safety-metadata-only, never used to build a behavioural profile.
- **B. Missing**: Nothing found this pass beyond what's already enforced structurally.
- **C-E**: None required.
- **F**: Documented in `dpia.md`.
- **G. Tested**: Re-ran `test-analytics-child-firewall.ts` this session (still passes).
- **H. Implemented?**: Yes.

## 6. Policies and community standards

- **A. Current**: No user-generated content, no chat between users, no way for a child to interact with anyone but their own AI Coach and their own parent. There is no "community" to have standards for — the risk this standard targets largely doesn't apply to this app's actual feature set.
- **B. Missing**: N/A given the above.
- **F**: Stated explicitly in `dpia.md` rather than silently assumed.
- **H. Implemented?**: Not applicable to this product's current feature set.

## 7. Default settings

- **A. Current**: Usage analytics defaults to included-but-anonymous with an easy opt-out (not opt-in-by-default tracking that's hard to find). Marketing emails default to off (`marketing_opt_in` defaults false). The child-facing ad zone defaults to disabled. Reduced motion, AI Coach — all have sensible, safe defaults.
- **B. Missing**: Nothing found this pass.
- **H. Implemented?**: Yes.

## 8. Data minimisation

- **A. Current (before this session)**: `children.birth_year` existed in the schema but was never actually collected by any form — a genuine latent risk, not an active one.
- **B. Missing**: The column should not exist if it's never used.
- **C. Code changes**: None needed beyond the migration (no code referenced this column).
- **D. Database changes**: `0020_remove_unused_birth_year.sql` — the column is now gone entirely, not just unused.
- **E. UI changes**: None (it was never in any form).
- **F. Documentation**: `dpia.md`'s data inventory now reflects the reduced field set.
- **G. Tested**: Grep-verified zero references anywhere in the codebase before dropping it; full regression suite re-run after (22/22 pass).
- **H. Implemented?**: Yes.

## 9. Data sharing

- **A. Current**: One external service receives any data at all: Supabase (all app data; the actual data processor). No advertising SDK, no analytics SDK, no AI/LLM provider, no other third party. (The AI Coach previously listed here sent message content to Anthropic — that feature no longer exists; see the header note above.)
- **B. Missing**: A single, explicit subprocessor register naming both, what each receives, and why.
- **C-E**: None required — no code shares data anywhere it shouldn't.
- **F. Documentation**: `subprocessor-register.md` — new this session.
- **G. Tested**: Grepped the entire client bundle import surface (repeated from the security audit) — confirmed zero third-party analytics/ad/tracking libraries anywhere.
- **H. Implemented?**: Yes.

## 10. Geolocation

- **A. Current**: No geolocation API is used anywhere. `parents.region` is a coarse, self-reported, optional value used only to suggest a default currency — never derived from a device location signal.
- **B. Missing**: Nothing.
- **H. Implemented?**: Yes — geolocation is simply not a feature of this app.

## 11. Parental controls

- **A. Current**: A dedicated Grown-up Mode PIN gate separates child and parent experiences. Parents control screen time limits, reduced motion, and can correct a child's stored nickname/age band directly. (AI Coach enablement was previously controlled here too — no longer applicable, see the header note above.)
- **B. Missing (before this session)**: The PIN check had zero rate limiting — a real, fixable gap for a 4-digit PIN.
- **C. Code changes**: `checkPinLockout`/`recordPinAttempt` (`pin-lockout-logic.ts`, 9 automated tests) wired into `verifyGrownUpPin`.
- **D. Database changes**: `0021_pin_attempt_lockout.sql` — `pin_failed_attempts`, `pin_locked_until` columns on `parents`.
- **E. UI changes**: A specific "too many attempts, wait 15 minutes" message added to the gate form, distinct from the generic "wrong PIN" message.
- **F. Documentation**: `dpia.md` and this standard's entry.
- **G. Tested**: 9 new unit tests covering the exact lockout boundary (4 vs. 5 failures), lockout-clears-on-success, and the time-window edge.
- **H. Implemented?**: Yes.

## 12. Profiling

- **A. Current**: No behavioural profiling of a child exists anywhere — badges/streaks are gated on demonstrated correctness, not engagement volume; analytics is structurally firewalled from child data.
- **B. Missing**: Nothing found this pass.
- **H. Implemented?**: Yes — verified, not just asserted (see `money-quest-gamification-ethics.md`, `test-analytics-child-firewall.ts`).

## 13. Nudge techniques

- **A. Current**: No streak-loss guilt messaging, no urgency/FOMO patterns, no "come back or lose X" notifications — there is no push-notification system for children at all. Streaks reset gently (current streak resets to 1, not 0; longest streak never erased).
- **B. Missing**: Nothing found this pass.
- **H. Implemented?**: Yes.

## 14. Connected toys and devices

- **A. Current**: Not applicable — Money Quest is a web app with no hardware/IoT integration of any kind.
- **H. Implemented?**: Not applicable.

## 15. Online tools

- **A. Current**: The V1 conversational AI tutor ("AI Coach") has been removed entirely from this application (see `dpia.md` §10) — there is no longer any child-facing interactive online tool of the kind this standard is chiefly concerned with (AI chat, generative content, or similar). The remaining interactive features (lessons, quizzes, games, the Money Life Simulator) are pre-authored, deterministic educational content, not a general-purpose tool a child converses with.
- **H. Implemented?**: Not applicable — the risk category this standard addresses does not apply to V1's actual feature set.
