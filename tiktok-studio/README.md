# Money Quest TikTok Studio

Short, educational TikTok videos **for parents** (about 30-36 seconds, text only) that explain *why* a skill taught on
Money Quest matters for their child. These are not adverts. Each video answers one question:
**"Why is this knowledge or skill important for my child?"** A parent should learn something
useful even if they never visit the website.

This folder is fully separate from the website and its AI assistant. Nothing in the website
imports it, the website's build and packaging ignore it, and its scheduled workflow stores its
memory on a separate branch (`tiktok-studio-state`), so it never pushes to `main`.

## Quote series (current series)

`config.json` has `"series": "quotes"`, so the scheduled workflow produces the quote series.
The earlier parent-tips series (`curriculum/topics.json`) is kept and can be switched back with
`"series": "tips"`.

Each video is 10-15 seconds, text only, no narration:

| Scene | Seconds | Content |
|---|---|---|
| Quotation | 4.5-8.5 | One authentic quotation, author and source on screen |
| Why it matters for children | 3.5-5 | One educational connection, no exaggerated claims |
| Invitation | 3.8 | MONEY QUEST, a CTA tied to a real site section, "Link in bio", moneyquesteducation.com |

**Template:** cream, sage and soft-blue cards with slow, blurred pastel shapes; serif type for
the quotation, sans-serif for everything else; fades only (reduced-motion friendly); all text
inside TikTok's safe zone. **Music:** a very quiet piano-style bed synthesised by
`music.generate_calm` (original, so no licence to manage).

**Files**

* `curriculum/quotes.json`: the 15 entries (quotation, author, source, verification status
  and note, rights note, takeaway, CTA, site section and route, caption, hashtags, keywords,
  proposed date) plus the quotations that were rejected and why.
* `QUOTE_CALENDAR.md`: the editorial calendar, generated from the JSON and the run history.
* `studio/quotes.py`: plan, checks, renderer, calendar.

**Verification rule.** A video can only be produced when `verification` is `"verified"`,
meaning the wording was confirmed against the source text. `"pending_print_check"` entries are
held until someone checks the printed source and updates the JSON. The quotation itself is
never edited by the tool. No quoted author endorses Money Quest, and captions never suggest it.

**Adding a video**

1. Add an entry to `curriculum/quotes.json` (copy an existing one). Record the source and how
   you verified it.
2. `python -m studio quote-check` (spelling of our own text, guardrails, CTA route exists on
   the public site, reading speed, 3-5 hashtags).
3. `python -m studio quote-make --id N`, then watch `output/<run>/video.mp4` and look at
   `contact_sheet.jpg`.
4. `python -m studio quote-calendar` to refresh the calendar.
5. Publishing uses the same commands and switches as below (`approve`, `host`, `publish`).

**Reporting.** Buffer exposes post metrics through an experimental API (`python -m studio
metrics`), refreshed about daily. Average watch time, completion rate, saves, profile visits
and website clicks are only in TikTok's own analytics: export them from TikTok Studio and load
them with `python -m studio metrics-import file.csv`. Nothing is estimated or invented.

## How a video is made

```
curriculum/topics.json ──► select ──► script ──► render ──► QA ──► (approval) ──► TikTok
   30 verified topics      no repeats   timed      1080x1920   blocks on   review / drafts /
   each cites the site     rotates      scenes     MP4 + AAC   any error   direct post
                           categories
                           favours what performs (from metrics)
```

| Seconds (approx.) | Scene | Content |
|---|---|---|
| 0-3 | Hook | A real-life problem a parent recognises, in very large text |
| 3-7 | Reframe | A warm one-line reframe ("They're not careless...") |
| 7-13 | Think of it like this | An analogy from the child's world: games, sweets, sport |
| 13-22 | Try this today | A 3-step exercise, steps appearing one by one |
| 22-27 | Why it works | Why the exercise works |
| 27-32 | Tell us | A question that invites comments |
| last ~3 | Brand | "Help your child build real-life skills. Explore Money Quest. Link in bio." plus where to explore further on the site |

Scene lengths are calculated from word count (about 3.1 words per second plus a lead-in), so
videos run 30-36 seconds (QA allows 25-46). What the child learns is stated in the caption.

**Visuals:** text only, no images. Each scene is a bold brand-colour card (teal, gold, purple,
cream) with very large text that pops in word by word, highlighted key words, a push transition
between cards, a progress bar and the compass-coin brand mark. The problem text starts
appearing in the first frames.

**Music:** `studio/music.py` composes an original track for every video (numpy synthesis, no
samples), so there's no licence or commercial-use question to manage.

**Narration:** not included yet. Free, natural-sounding TTS voices often come with unclear or
non-commercial licences. To add narration, choose a voice whose licence allows commercial use
(for example a Piper voice whose model card says so, or a paid TTS provider you approve), and
the renderer can lengthen each scene to fit the audio.

## Content accuracy

* `curriculum/topics.json` was written from the website's own published content: lesson
  objectives, key concepts and parent notes in `messages/en.json`, the Brain/Emotion/Future
  Skills labs in `src/content/learning-labs.ts`, Entrepreneur Quest, Leadership Quest and the
  parent articles. Every topic lists `sources` with exact quotes.
* QA re-checks on every run that each quoted sentence **still exists** in the website source.
  If the curriculum changes, the affected video is blocked until the topic is reviewed.
* Guardrails block exaggerated claims ("studies show", "proven", "brain boost", "guarantee",
  "smarter"), outcome promises, hard-sell wording, investment advice and real currency symbols.
  The site uses fictional coins.
* Educational-psychology ideas (delayed gratification, low-stakes practice, visible progress,
  naming feelings, pausing before decisions) are written as practical habits, not as research
  findings. This matches the site's own `docs/educational-design-evidence.md`.

Categories covered: financial education, saving and spending, needs and wants, budgeting and
planning, entrepreneurship, leadership, decision-making, emotional intelligence, critical
thinking, and giving. 30 topics is 10 weeks at 3 per week. Add new topics in the same format;
`python -m studio check` validates them.

## QA (a video can't be published unless all checks pass)

Spelling · source quotes present · guardrails · exact CTA · hook length · reading speed ·
25-46 s duration · H.264/AAC 1080x1920 30 fps · every text box inside TikTok's safe zone (clear
of the top tabs, right-hand buttons and bottom caption) · minimum font size · text contrast
(white 12.4:1, gold 5.8:1 on the panel) · no blank frames · audio present and not clipping ·
contact sheet (`contact_sheet.jpg`) for a human glance.

## Commands

```bash
cd tiktok-studio
pip install -r requirements.txt          # needs ffmpeg on PATH
python -m studio check                   # content QA for all topics
python -m studio make --topic saving-why # render one video -> output/<date>-<topic>/
python -m studio make                    # render the next topic the selector picks
python -m studio approve <run>           # human approval
python -m studio buffer-setup            # find TikTok channel in Buffer + verify API schema
python -m studio host <run>              # (in Actions) public video URL via GitHub Release
python -m studio publish <run> --mode buffer-notify   # Buffer reminds you; you post
python -m studio publish <run> --mode buffer-auto     # Buffer posts (needs PUBLIC_POSTING_APPROVED)
python -m studio sync                    # Buffer status -> history
python -m studio metrics                 # views/likes/comments/shares (Buffer, experimental)
python -m studio metrics-import f.csv    # or import from a TikTok Studio export
python -m studio topics                  # what has been used
```

Each run folder contains `video.mp4`, `cover.jpg`, `caption.txt` (caption and hashtags),
`script.txt`, `contact_sheet.jpg` and `qa_report.json`.

## Publishing: why Buffer, and how it's wired

**Direct TikTok API isn't an option for public posts.** TikTok's Content Posting API audit
rejects apps whose purpose is uploading to the developer's own or team's accounts. TikTok's
review note reads: "Applications intended for personal use or internal company use are not
eligible for approval." Unaudited apps can only make private (`SELF_ONLY`) posts. So
`studio/tiktok.py` stays as an optional private/drafts path, and public publishing goes
through **Buffer**, which is already an approved TikTok partner.

**Buffer Free plan:** 3 channels, 10 scheduled posts per channel, TikTok auto-publishing and API
access (one personal API key). We schedule one post at a time, so the 10-post limit never
matters.

```
GitHub Actions (Mon/Wed/Fri)
  render + QA ──► upload video.mp4 to a public pre-release "tiktok-<run>" on this repo
             ──► Buffer API createPost(TikTok channel, caption, video URL, due in 20 min)
             ──► Buffer posts to TikTok (or sends you a phone reminder in notify mode)
Sunday: sync statuses, pull metrics (Buffer, experimental), delete hosting releases 14+ days old
```

### Switches (repository variables, all off by default)

| Variable | Values | Effect |
|---|---|---|
| `PUBLISH_MODE` | `review` (default), `buffer-notify`, `buffer-auto` | `buffer-notify`: Buffer reminds you and you tap to post. `buffer-auto`: Buffer posts by itself. |
| `AUTOMATION_ENABLED` | `true` / unset | Lets scheduled runs send videos to Buffer without a per-video `approve`. |
| `PUBLIC_POSTING_APPROVED` | `true` / unset | Required for `buffer-auto`. Without it, public posting is refused in code. |
| `BUFFER_CHANNEL_ID` | id | Only needed if Buffer has more than one TikTok channel. |

Secret: `BUFFER_API_KEY`.

### Rollout (each step tested before the next)

Tests before merging run from the development branch: changing
`tiktok-studio/test-request.json` there starts one run. That path can only do `buffer-setup`,
`review` or `buffer-notify`. Automatic posting is blocked on it.

1. **Review run (no accounts needed).** Render + QA on GitHub's servers, video attached to the
   run.
2. **Connect accounts (you).**
   - TikTok: switch the Money Quest account to a free **Business account** (TikTok app:
     Settings > Account > Switch to Business Account).
   - Buffer: at buffer.com go to Channels > Connect > TikTok. TikTok's own login page opens and
     you approve it there.
   - Install the Buffer mobile app and sign in with notifications allowed. The notification
     test needs it.
3. **API key (you).** In Buffer go to Settings > API and create a personal API key. Copy it
   straight into GitHub: repository Settings > Secrets and variables > Actions > *Secrets* tab >
   New repository secret, name `BUFFER_API_KEY`. Never put it in chat, a file or a commit.
4. **`buffer-setup` run.** Read-only. Lists your TikTok channel and prints Buffer's live API
   shape. Nothing is posted.
5. **`next-video` + `buffer-notify` run.** Tests hosting and the Buffer API end to end. Buffer
   sends a phone reminder about 20 minutes later. You post it yourself, or delete it in Buffer.
6. **Merge to main** (only when you say so). The Mon/Wed/Fri schedule then runs in review mode.
7. **First automatic post**, after you approve it: set `PUBLIC_POSTING_APPROVED=true` and run
   `next-video` + `buffer-auto` once.
8. **Automation**, after you approve it: set `PUBLISH_MODE=buffer-auto` and
   `AUTOMATION_ENABLED=true`. Three videos a week are then created and published
   automatically. Any QA failure stops that video.

Notes and known risks:
* Buffer fetches the video from the release URL, which GitHub serves via a redirect as
  `application/octet-stream`. Step 4 shows whether Buffer accepts it. If it doesn't, the
  fallback is a free Cloudflare R2 bucket or GitHub Pages; we'd only need to change `hosting.py`.
* Buffer's API docs conflict in places (one note says video isn't supported via the API, while
  the video example says it is), so step 3 checks the live schema and step 4 checks real
  behaviour.
* Buffer's post metrics are labelled experimental and refresh daily. If they're unavailable,
  export numbers from TikTok Studio and run `python -m studio metrics-import file.csv`
  (columns: `run` or `topic_id`, `views`, `likes`, `comments`, `shares`).
* Hosting releases are public (this repository is public), so a video is technically
  reachable shortly before it posts.
* Auto-publishing can't add TikTok's trending sounds. We use our own original music anyway.

## Costs

Everything is free: GitHub Actions minutes (about 2 minutes per video), GitHub release hosting,
Buffer Free, ffmpeg and Python libraries, and the site's own artwork and original music.
Nothing needs to be bought. Paid options (Buffer paid plans, premium TTS narration) need your
approval first.
