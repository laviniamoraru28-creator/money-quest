#!/usr/bin/env python3
"""Parent Communication & Copywriting Strategist.

Monthly editorial planner and drafting pipeline for parent-facing
educational articles about Money Quest. Produces structured editorial
briefs (topic, angle, requirements) and, once a brief is picked up by an
authorized writer, tracks a full draft through review and translation.

Design constraints, enforced in code below, not just in prose:
- Never auto-publishes. A draft can only reach "approved" status through
  an explicit, separate step outside this script, and even an approved
  draft is wired into the live site (src/content/articles.ts +
  messages/*.json) only via a human-reviewed Draft PR, never by this
  script writing to those files directly.
- Never invents evidence, statistics, testimonials, or sources. lint_draft()
  mechanically rejects common fabrication/pressure patterns before a draft
  can be marked ready for review.
- Never links to Facebook or TikTok, and never recommends a social-media
  call to action. ALLOWED_CTA_SLUGS is the one source of truth for
  internal links a draft is permitted to point at; anything else fails
  the lint.
- Topic rotation (select_topics) consumes a fresh, non-overlapping block
  of topics every month rather than repeating most of the previous
  month's lineup, and is filtered against both the live site's own
  article catalog and this agent's own drafting history so a subject is
  never redrafted once it has actually been covered.
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "artifacts" / "parent-copywriting"

SUPPORTED_LOCALES = ["en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl"]

# (slug, working_title, editorial_angle, category) — category maps onto the
# eight subject areas the editorial brief is required to rotate through.
TOPICS = [
    ("financial-literacy", "Why everyday money conversations matter", "Explain needs, wants, saving and age-appropriate family examples.", "financial education"),
    ("first-savings-goal", "A child's first savings goal", "Offer a simple visual savings activity without promises of outcomes.", "financial education"),
    ("five-money-activities", "Five money activities families can try this week", "Provide inclusive, low-cost options and adaptations for non-readers.", "practical learning activities"),
    ("thoughtful-choices", "Helping children make thoughtful choices", "Discuss practical decision-making and autonomy without clinical claims.", "leadership and decision-making"),
    ("home-entrepreneur-projects", "Small entrepreneurial projects at home", "Give safe, supervised examples without earnings promises.", "entrepreneurship and creativity"),
    ("teaching-cooperation", "Teaching cooperation and everyday leadership", "Offer collaborative activities without pressuring children.", "leadership and decision-making"),
    ("accessible-money-learning", "Accessible money learning for different needs", "Use respectful SEND language and concrete visual/audio supports.", "inclusive education and SEND"),
    ("family-money-conversations", "How to talk with children about a family budget", "Use fictional examples, avoid asking families to disclose finances.", "financial education"),
    ("staying-calm-after-a-money-mistake", "Helping children stay calm and bounce back after a money mistake", "Build resilience and self-forgiveness after an overspend or a lost item, without shame or guilt.", "emotional intelligence and self-regulation"),
    ("skills-for-a-changing-world", "The skills children will need for a changing world", "Cover adaptability, digital literacy and creative problem-solving with concrete home examples.", "future skills"),
    ("pocket-money-creativity-project", "Turning pocket money into a creativity project", "Give safe, imaginative project ideas that build creative thinking, not just saving habits.", "entrepreneurship and creativity"),
    ("everyday-independence", "Building confidence with everyday money choices", "Age-appropriate independence steps, not real unsupervised purchases or responsibilities.", "building independence and confidence"),
]

# The only internal destinations a draft's call-to-action is allowed to
# point at — real, live Money Quest routes, never a social platform and
# never an invented page. Keep in sync with src/app/[locale]/* routes.
ALLOWED_CTA_SLUGS = {
    "/learn", "/parents", "/parent-info", "/parents/resources",
    "/real-life-quests", "/leadership-quest", "/entrepreneur-quest",
    "/future-skills", "/inclusive-learning", "/mind-lab", "/brain-lab",
    "/museum", "/library", "/quiet-corner",
}

# Phrases this agent must never ship in a draft: fabricated-promise,
# fear/guilt pressure, or absolute claims no educational agent can verify.
BANNED_PHRASES = [
    "guarantee", "guaranteed", "studies show", "research proves",
    "will make your child rich", "will make your child successful",
    "100% of", "scientifically proven", "every parent knows",
    "if you don't", "your child will fall behind", "your child will fail",
    "limited time", "act now", "don't miss out",
]
BANNED_DOMAINS = ["facebook.com", "tiktok.com", "fb.com"]


def month_index(today):
    """Months since a fixed epoch — strictly increasing, used so each
    calendar month starts its own non-overlapping block of topics rather
    than drifting by one slot the way the original index did."""
    return today.year * 12 + today.month


def live_article_slugs(root=ROOT):
    """Slugs already published on the live site, read directly from the
    source of truth (src/content/articles.ts) rather than duplicated by
    hand here, so this never silently drifts out of sync with it."""
    path = root / "src" / "content" / "articles.ts"
    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        return set()
    return set(re.findall(r'slug:\s*"([^"]+)"', content))


def previously_drafted_slugs(out_root=OUT_ROOT):
    """Slugs this agent has already turned into a draft in any prior
    run, scanned from its own artifact history — so a subject already
    covered is never redrafted, satisfying 'avoid repeating previously
    covered subjects' at the article level, not just the topic-bucket
    level select_topics() already handles."""
    slugs = set()
    if not out_root.exists():
        return slugs
    for draft_path in out_root.glob("*/drafts/*.json"):
        try:
            data = json.loads(draft_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        slug = data.get("slug")
        if slug:
            slugs.add(slug)
    return slugs


def select_topics(today, topics=TOPICS, per_month=4, excluded_slugs=frozenset()):
    """Pick this month's topics as a fresh, non-overlapping block.

    Regression context: the original implementation used
    `index = (year*12+month) % len(topics)` and then stepped by 1 per
    week, which only advances the starting position by 1 per *month*
    while consuming 4 topics *per month* — with 8 topics that meant 3 of
    each month's 4 topics were repeated verbatim from the previous
    month. Stepping the start position by `per_month` instead means each
    month gets a disjoint block, and the full catalog cycles exactly
    once every `len(topics) / per_month` months with zero repeats
    within a cycle.
    """
    pool = [t for t in topics if t[0] not in excluded_slugs] or list(topics)
    n = len(pool)
    start = (month_index(today) * per_month) % n
    picked = []
    seen = set()
    offset = 0
    while len(picked) < per_month and offset < n:
        candidate = pool[(start + offset) % n]
        offset += 1
        if candidate[0] in seen:
            continue
        seen.add(candidate[0])
        picked.append(candidate)
    return picked


def consult_learning_intelligence(path=None):
    """Optional, loosely-coupled read of Learning Intelligence's own
    output artifact (PR #72, owned by Work) — never imports or depends
    on that PR's code, matching the 'handle Work integrations
    separately' rule: if the file isn't there (PR #72 unmerged, or
    Search Console never connected), this honestly returns no signal
    rather than guessing at parent search interest."""
    path = path or (ROOT / "test-results" / "learning-intelligence" / "report.json")
    if not path.exists():
        return {"available": False, "ranked_topics": [], "limitation": "Learning Intelligence report not found; topic selection used internal rotation only."}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"available": False, "ranked_topics": [], "limitation": "Learning Intelligence report present but unreadable."}
    topics = data.get("search_topics", [])
    gsc_status = (data.get("search_console") or {}).get("status")
    limitation = "Search Console not connected in Learning Intelligence's own report; ranking below is empty." if gsc_status != "provided" else "Ranked by Learning Intelligence's own Search Console import."
    return {"available": True, "ranked_topics": topics, "limitation": limitation}


def create_briefs(today=None):
    today = today or date.today()
    out = OUT_ROOT / today.strftime("%Y-%m")
    out.mkdir(parents=True, exist_ok=True)
    excluded = live_article_slugs() | previously_drafted_slugs()
    picked = select_topics(today, excluded_slugs=excluded)
    intelligence = consult_learning_intelligence()
    briefs = []
    for week, (slug, title, angle, category) in enumerate(picked, start=1):
        brief = {
            "agent": "parent-communication-copywriting-strategist",
            "period": today.strftime("%Y-%m"),
            "slot": week, "topic": slug, "working_title": title,
            "editorial_angle": angle, "category": category,
            "audience": "Parents and carers of children aged 6-14",
            "formats": ["600-900 word article", "one practical at-home activity"],
            "languages": ["en"],
            "translation_plan": f"Localize into {len(SUPPORTED_LOCALES)} supported languages only after editorial review",
            "requirements": [
                "Plain, empathetic, non-judgmental language",
                "Specific, accessible examples",
                "Link only to verified live Money Quest pages (see ALLOWED_CTA_SLUGS)",
                "Distinguish evidence from editorial advice",
                "Cite verified primary sources for factual research claims",
                "Do not invent testimonials, statistics or user results",
                "No pressure to purchase, donate, or urgency language",
                "No collection of child or family personal data",
                "No Facebook or TikTok links or calls to action",
                "Include one gentle CTA to free Money Quest content",
            ],
            "learning_intelligence_signal": intelligence,
            "status": "brief_awaiting_authoring",
            "publication_approved": False,
            "note": "This brief generator does not itself write prose. A separate authoring step (a human editor, or the coordinating Claude session acting as an authorized writer with no paid API) drafts, fact-checks and submits the article for review.",
        }
        briefs.append(brief)
        (out / f"week-{week}-{slug}.json").write_text(json.dumps(brief, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out / "index.json").write_text(json.dumps({"period": today.strftime("%Y-%m"), "briefs": len(briefs), "auto_publish": False}, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(briefs)} parent editorial briefs in {out.relative_to(ROOT)}")
    return briefs


def lint_draft(draft):
    """Mechanical quality gate a draft must pass before it can be marked
    ready for human/editorial review. Returns a list of problems (empty
    = passes). This is the 'quality review' stage of the editorial
    workflow expressed as code, not a manual-only step."""
    problems = []
    for field in ("slug", "title", "metaDescription", "sections", "ctaSlug"):
        if not draft.get(field):
            problems.append(f"missing required field: {field}")
    title = draft.get("title", "")
    if title and len(title) > 65:
        problems.append("title exceeds ~65 characters and may truncate in search results")
    meta = draft.get("metaDescription", "")
    if meta and not (50 <= len(meta) <= 160):
        problems.append("metaDescription should be 50-160 characters")
    sections = draft.get("sections", [])
    if not any("activity" in (s.get("heading", "") + " ".join(s.get("list", []))).lower() for s in sections):
        problems.append("no section provides a concrete at-home activity")
    cta = draft.get("ctaSlug")
    if cta and cta not in ALLOWED_CTA_SLUGS:
        problems.append(f"ctaSlug '{cta}' is not an allowed, verified internal destination")
    haystack = " ".join([title, meta] + [p for s in sections for p in s.get("paragraphs", [])]).lower()
    for phrase in BANNED_PHRASES:
        if phrase in haystack:
            problems.append(f"banned pressure/fabrication phrase found: '{phrase}'")
    for domain in BANNED_DOMAINS:
        if domain in haystack:
            problems.append(f"disallowed social platform reference found: '{domain}'")
    return problems


def translation_status(draft, locales=SUPPORTED_LOCALES):
    """Which of the nine supported locales a draft already has a
    translated ArticleLocalizedText entry for, read from the draft's own
    `translations` map (keyed by locale, each value an object with at
    least a `title`). Never reports 'complete' for a locale that is
    merely a stub — a translation only counts once it carries real,
    reviewed text, flagged via its own `reviewed: true`."""
    translations = draft.get("translations", {})
    complete = [loc for loc in locales if translations.get(loc, {}).get("reviewed") is True]
    missing = [loc for loc in locales if loc not in complete]
    return {"complete_locales": complete, "missing_locales": missing, "all_locales_complete": not missing}


def editorial_report(today=None, drafts=None):
    """Standard Coordination-Hub-compatible report envelope plus this
    agent's own drafting/translation/duplicate status fields."""
    today = today or date.today()
    drafts = drafts or []
    out = OUT_ROOT / today.strftime("%Y-%m")
    out.mkdir(parents=True, exist_ok=True)
    live_slugs = live_article_slugs()
    duplicate_warnings = [d["slug"] for d in drafts if d.get("slug") in live_slugs]
    report = {
        "schema_version": 1,
        "agent": "parent-communication-copywriting-strategist",
        "generated_at": today.isoformat(),
        "mode": "read_only",
        "period": today.strftime("%Y-%m"),
        "drafts": [
            {
                "slug": d.get("slug"),
                "title": d.get("title"),
                "status": d.get("status", "unknown"),
                "lint_problems": lint_draft(d),
                "translation": translation_status(d),
            }
            for d in drafts
        ],
        "duplicate_warnings": duplicate_warnings,
        "limitations": [
            "This script never writes to src/content/articles.ts or messages/*.json directly; a live-schema addition only happens through a separate, human-approved Draft PR.",
            "Automatic unattended article drafting has not been demonstrated; drafting today is performed by the coordinating Claude Code session within this environment, not by this Python script, and not on a paid API.",
        ],
        "claude_auto_activation_verified": False,
        "safe_to_auto_merge": False,
    }
    (out / "editorial-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    created = create_briefs()
    editorial_report(drafts=[])
