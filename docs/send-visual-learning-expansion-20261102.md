# Inclusive Learning / Learn with pictures expansion
Status: proposed implementation plan, not completed interactive lessons.
Owner feedback: only a few lessons, difficult to understand. Target is a usable visual learning sequence rather than another text-heavy guide.

## Existing code audit (main, 2026-11-02)
- `src/app/[locale]/inclusive-learning/page.tsx`: four support-instruction cards, one `MoneyExamples` component, and links to other learning spaces.
- `src/components/MoneyExamples.tsx`: five illustrated examples (coin, note, account balance, card, phone), one fixed two-choice question; does not progress through independent lessons.
- `src/content/inclusive-learning-copy.ts` and `src/content/money-examples-copy.ts`: nine-locale strings exist. Translation availability is not the same as functional usability.
- This area needs both learning content and task flow, not just additional explanatory paragraphs.

## Learning architecture: 3 modules, scaffolded tasks
### A. Money and everyday choices
1. Identify coin, banknote, account balance, card, phone. Explicitly distinguish money from tools for paying.
2. Sort 'money', 'ways to pay', 'not money' with picture choices including leaf, stone, toy.
3. Match coin values to pictures, start with two choices, then three.
4. Needs and wants: choose from illustrated real-life scenes.
5. Save or spend: simple goal and two pictured choices.
6. Shopping: choose an item within a visual coin budget.
7. Safety: never share a card PIN; ask a trusted adult.
### B. Entrepreneurship
1. What is a shop or service? Choose picture.
2. Match customer request to item.
3. Make a tiny picture-based stall.
4. Pick a price label.
5. Identify supplies needed.
6. Practise a greeting using a choice board or AAC.
7. Hear feedback, choose one improvement.
### C. Leadership and teamwork
1. Recognize helping, listening, taking turns.
2. Choose a helpful action in a two-picture scenario.
3. Identify emotions in context without requiring eye-contact interpretation.
4. Ask for help using words, symbols or AAC.
5. Fix an accidental mistake.
6. Share a task with a teammate.
7. Choose a fair solution to a simple disagreement.

## Mandatory activity pattern
One task per screen, large illustration, maximum one short instruction at a time, modelled example before independent attempt. Controls: Listen, Show again, Next, Back, Break. Use two clear answer cards initially, increase to 3–4 only when appropriate. No timers, no mandatory speech, no penalty animations or forced repetition. Positive, specific feedback and visible progress. Child can point, touch, use keyboard, switch or AAC with adult support. Offer simpler and harder task variants based on support needs rather than diagnosis or age alone.
Use consistent pictograms, photograph/illustration distinctions and clear labels. Ensure no wrong conceptual imagery: cards/phones are payment tools, not currency. Audio and text must describe exactly the same content. Reduced Motion, high contrast, focus mode, minimum 44px targets, semantic headings, keyboard focus, screen-reader announcements, no autoplay audio.
Do not claim clinical therapy or guaranteed learning outcomes.

## Build milestones and acceptance
1. Build a reusable data-driven visual-task renderer with localized prompts, model example, choices, correct answer, explanation, image references and speech text.
2. Implement first three Money tasks with complete EN/RO translations and suitable pictures; test with a novice adult and, with consent, children with diverse communication preferences.
3. Expand all 21 tasks and localize ES/FR/DE/IT/PT/NL/PL with editorial review. Avoid publishing half-English screens as fully translated.
4. Test on phone, keyboard, screen reader, reduced motion and offline PWA. Check instructions and images align for every task.
5. Only then promote to main, build Namecheap ZIP, verify deployed locale and function.

## Educational rationale
Use explicit modelling, gradual prompting and feedback, multiple means of engagement and expression, predictable navigation and flexible response modes. Design should support diverse SEND learners without treating SEND as a single ability level. Avoid unsupported claims about efficacy.
