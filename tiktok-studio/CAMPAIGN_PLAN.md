# Money Quest Academy: TikTok campaign plan (version 2)

Status: **proposal for review**. The live schedule still runs the approved quote series until this is approved.

## 1. Audit (16 November 2026)

| Area | Finding |
|---|---|
| Main branch | TikTok Studio is merged and live. It only touches `tiktok-studio/` and one workflow. |
| Open pull requests | Seven, all for the website (#12, #21, #24, #25, #45, #49, #59). None touch the studio. |
| Quotation calendar | `curriculum/quotes.json`: 54 quotations, all marked verified, none awaiting verification. 51 were matched word for word against Project Gutenberg texts; Dewey (1897), Clear and Kahneman were confirmed from transcriptions or the author's own published text. 13 rejected quotations are recorded with reasons. |
| Templates | `studio/quotes.py` (pastel quote template with question hook and word-by-word text) and the earlier `studio/render.py` (parent tips). |
| Publishing | Buffer reminders on Monday, Wednesday and Friday at 19:30 UK time; the owner posts in TikTok. Automatic public posting is blocked. Skip dates: 25 December, 1 January. |
| Sent so far | One quote video (Franklin, 16 November) plus two earlier test reminders. Buffer cannot tell us whether a reminder was posted in TikTok. |
| First video | Quotation first, no hook, 12 seconds. Owner-reported: under 100 views, no likes. One video is too little to judge the format or the account. |
| Brand name | The website calls itself "Money Quest". The pilots use "Money Quest Academy" as requested; the live series still says "Money Quest". This needs one decision. |

### Opportunities

1. The first video opened on a 1758 quotation. A viewer had no reason to stay. (Already changed for the live series: a question now comes first.)
2. Every video had the same shape and the same ending. Nothing asked the viewer to answer, save or try anything.
3. No practical action: parents learned an idea but not what to do tonight.
4. Three months of one format gives no way to learn what works.
5. No measurement loop.

## 2. Structure of every video

| Time | Part | Rule |
|---|---|---|
| 0-2 s | Hook | A question, a relatable moment or a concrete prompt. Nine words at most. No logo screen, no long quotation. |
| 2-7 s | Value | The verified quotation (exact wording, author and source on screen) or one idea in plain words. One idea per screen. |
| 7-12 s | Practical takeaway | One thing a parent can do today. |
| last 2 s | Engagement | One closing question or a natural prompt, varied between videos, with a small brand line. |

Simple videos run 10-15 seconds. Activities with three steps run to about 17. Quotations longer than about 25 words keep their exact wording and simply take longer; nothing is paraphrased as a quotation.

## 3. Four content categories

| Category | Id prefix | What it is | Starting share |
|---|---|---|---|
| Quotation | MQ-Q | A verified quotation plus an action | 40% |
| Interactive question | MQ-I | A question parents can ask their child, with no wrong answer | 25% |
| Activity | MQ-A | A money activity in two or three steps | 25% |
| Common mistake | MQ-M | A well-meant habit and what to try instead | 10% |

These shares are a starting point for testing, not proven proportions. Quotation text always comes from `curriculum/quotes.json`. Everything else must cite published Money Quest content, and the checks confirm the cited sentence is still on the site.

Tone rules, enforced where possible by the checks: no exaggerated claims about development or outcomes, no shame about spending or about having little money, "no wrong answer" framing for children's choices, examples that work for any budget (50p, £1, £5).

## 4. Design

Same identity: sage, cream, soft coral and pastel blue; serif for quotations, sans-serif elsewhere. New in version 2:

- The composition changes every 2-3 seconds, one idea per screen.
- Simple flat icons drawn by the studio itself (jar, coins, bag, price tags, bulb, heart, question, tick, cross, target, list). No stock or generated artwork.
- Option cards for interactive questions and "Step 1 of 3" chips for activities.
- Gentle motion only: word-by-word text, a slow icon float, short crossfades. No flashing.
- Music: the same very quiet, original piano-style bed, levelled to one loudness.
- Faceless: no presenters or characters.

## 5. Quality checks (`python -m studio short-check`, `short-make`)

A video is rejected if any of these fail: spelling of our own text; guardrails against overclaims, hard selling and financial advice; quotation scenes reference a verified entry; non-quotation ideas cite text that exists on the site; the linked site section exists; reading speed per screen; at most 16 words per screen; a practical takeaway and a closing scene are present; no hook, takeaway or close repeated across videos; 1080 x 1920, H.264 and AAC; total length; every text box inside TikTok's safe zone; no overlapping elements; minimum text size; contrast; audio present and not clipping. A frame from every scene is saved to a contact sheet for a human look.

Not automated: grammar beyond spelling, and whether the music sounds pleasant. Those need a person.

## 6. Measurement

`python -m studio metrics` stores what Buffer returns and keeps dated snapshots, so results can be compared at 48 hours and at 7 days. `python -m studio report` writes `reports/WEEKLY_REPORT.md`; the Sunday run saves it next to the studio's history on the `tiktok-studio-state` branch.

| Metric | Source | Status |
|---|---|---|
| Views, likes, comments, shares | Buffer API (experimental) | Automatic if Buffer returns them; not yet seen working on this account |
| Saves, average watch time, completion rate, profile visits, website clicks | TikTok analytics only | Unavailable automatically. Read them in TikTok Studio > Analytics, or import a CSV with `metrics-import` |

The report names the best and weakest videos, hooks and categories, and makes no recommendation until 10 videos have measured results.

## 7. Controlled experiments for the first 10 version 2 videos

One variable changes at a time; the rest of the template stays fixed.

| Test | Compare | Held constant |
|---|---|---|
| A | Question hook vs statement hook | Category (quotation), length |
| B | Quotation vs activity | Question hook, similar length |
| C | Closing question vs "save this" prompt | Category (activity) |
| D | About 12 seconds vs about 17 seconds | Category (activity), hook style |
| E | With icon motion vs without | Same script, posted two weeks apart |

Each comparison needs at least two videos per side before it counts, read at 7 days. With three videos a week, tests A to D fit in the first ten videos; E follows. Results go in the weekly report. Views on a new account vary a lot from video to video, so small differences will be treated as noise.

## 8. What needs approval

1. The version 2 template and the three pilots.
2. The revised calendar in `CAMPAIGN_CALENDAR_PROPOSAL.md`.
3. Brand line: "Money Quest" or "Money Quest Academy".
4. Whether already-approved quote videos on the live schedule (18 and 20 November) stay as they are.

After approval: script the remaining videos in batches, switch the scheduled run to the revised calendar, and keep the 35 unplaced quotations as a library.
