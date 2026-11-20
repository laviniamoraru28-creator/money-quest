# Money Quest: Business, Full Stack and Visual Design roles

## Status
Pilot only. Read-only, no external APIs, no child data, no new paid services, no merge/deploy automation.
This adds practical evidence-gated checks and role contracts, **not** autonomous developers or a working design-generation service.

## Ownership and duplication controls
- Business Analyst: assesses owner-submitted proposals, requires problem, evidence, benefit, effort, risk and measurable success. Existing Opportunity Prioritizer remains responsible for marketing opportunities.
- Senior Full Stack Engineer: checks that baseline engineering commands exist, and sets the change contract. Actual implementation must be explicitly assigned and independently tested. Does not replace Claude's active work.
- Visual Design Specialist: provides Explorer/Builder/Strategist design-review checklist, supported locale inventory, and limited CSS review candidates. Existing Innovation/UX and Child Experience Lab retain interaction/usability responsibilities.
- Security Sentinel and Privacy Guardian: remain independent reviewers. Their existing source heuristics are insufficient to certify security.
- Customer Support: deferred until real parent/teacher support demand is measured.
- Machine Learning, Content Creator, Scrum Master, Backend Developer: no new standalone agents; extend existing capabilities only when a measurable gap appears.

## Running the pilot
```bash
python3 -m unittest scripts.test_role_capabilities -v
python3 scripts/role_capabilities.py --out artifacts/role-capabilities/report.json
python3 scripts/role_capabilities.py --proposal proposal.json
```
Proposal JSON example:
```json
{"id":"rewards-v2","problem":"Children do not notice completion feedback","evidence":"unknown","benefit":"Clear completion feedback","effort":"Needs engineering estimate","risk":"Distracting animations","success_metric":"Moderated task completion"}
```
Unknown evidence results in `needs_evidence`, never an automatic approval.

## Next implementation gates
1. Validate overlap against current active Claude branches and GitHub issues.
2. Owner approves a concrete feature and acceptance criteria.
3. Full Stack Engineer implements it on an isolated branch, with appropriate unit, E2E, accessibility and multilingual checks.
4. Visual Design Specialist reviews real browser screenshots, not only CSS.
5. Security/Privacy review; owner explicitly approves merge and deployment.

No automated agents should infer child traits, collect identifiable child analytics, generate unreviewed images, or claim success without test evidence.
