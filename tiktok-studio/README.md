# Money Quest TikTok Studio

Short, educational TikTok videos **for parents** that explain *why* a skill taught on
Money Quest matters for their child. These are not adverts. Each video answers one question:
**"Why is this knowledge or skill important for my child?"** A parent should learn something
useful even if they never visit the website.

This folder is fully separate from the website and its AI assistant. Nothing in the website
imports it, the website's build and packaging ignore it, and its scheduled workflow stores its
memory on a separate branch (`tiktok-studio-state`), so it never pushes to `main`.

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
| 0-3 | Hook | A question or surprising statement |
| 3-7 | What children learn | The learning objective, in plain words |
| 7-12 | Why it matters | Why the skill matters, with an everyday example |
| 12-16 | Try this at home | One practical insight for parents |
| last ~3 | Brand | "Help your child build real-life skills. Explore Money Quest. Link in bio." plus where to explore further on the site |

Scene lengths are calculated from word count (about 3.6 words per second plus a lead-in), so the
total adapts but always stays within 10-20 seconds.

**Visuals:** Money Quest's own artwork from `public/images/money-quest/` (worlds, sections and
book covers, all in the locked 3D style), shown as a framed card with a slow zoom over a blurred,
darkened version of the same image. Large animated text, gold highlights, crossfades, a progress
bar and the compass-coin brand mark. There are no avatars or talking characters. The guide girl
and puppy only appear as still artwork.

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
10-20 s duration · H.264/AAC 1080x1920 30 fps · every text box inside TikTok's safe zone (clear
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
python -m studio publish <run> --mode drafts            # send to your TikTok inbox
python -m studio publish <run> --mode direct            # post (SELF_ONLY until app audit)
python -m studio status <run>
python -m studio metrics                 # pull views/likes/comments/shares
python -m studio topics                  # what has been used
```

Each run folder contains `video.mp4`, `cover.jpg`, `caption.txt` (caption and hashtags),
`script.txt`, `contact_sheet.jpg` and `qa_report.json`.

## Scheduling and publishing (`.github/workflows/tiktok-studio.yml`)

* **Mon/Wed/Fri 17:41 UTC:** pick the next topic, render it, run QA, then publish only if
  authorised (see below). Otherwise the video is attached to the workflow run as an artifact
  for review.
* **Sunday:** refresh metrics. Topic choice then favours categories with higher engagement
  (likes + comments + shares per view, weighted 0.7-1.3x so no category is ever dropped).
* Scheduled runs only fire once the workflow is on the default branch (`main`).
* The selector never repeats a topic that was approved, sent to drafts or published.

### Rollout (nothing is fully automatic until every step is tested)

1. **Approve the sample.** Review `output/2026-11-15-saving-why/`.
2. **Review-mode test.** Merge, then run the workflow manually with `publish_mode = review`.
   Check that the artifact appears and the `tiktok-studio-state` branch is created.
3. **TikTok developer app (free).** At developers.tiktok.com create an app, add *Login Kit*
   and *Content Posting API*, and request the scopes `user.info.basic, video.upload,
   video.publish, video.list`. Set a redirect URI you control (your website URL works for
   copying the `code`). Then:
   ```bash
   export TIKTOK_CLIENT_KEY=... TIKTOK_CLIENT_SECRET=... TIKTOK_REDIRECT_URI=...
   python -m studio auth-url        # open, log in as the Money Quest account, approve
   python -m studio auth-code CODE  # prints the refresh token
   ```
   Save `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` and `TIKTOK_REFRESH_TOKEN` as **repository
   secrets**. Never commit them.
4. **Drafts test.** Run the workflow manually with `publish_mode = drafts`. The video lands in
   your TikTok inbox, and you post it from the app. This needs no app audit.
5. **Direct test.** Run with `publish_mode = direct` (`SELF_ONLY`). The post appears privately
   on your profile. Run `metrics` after a day.
6. **App audit.** TikTok only allows public direct posts from audited apps. Submit the app for
   review. Until it's approved, use `drafts`.
7. **Turn on automation** (only after steps 2-5 succeed and you authorise it). Set the
   repository **variables** `TIKTOK_AUTOMATION_APPROVED=true`, `TIKTOK_PUBLISH_MODE=drafts`
   (or `direct` after the audit) and `TIKTOK_PRIVACY=PUBLIC_TO_EVERYONE` (direct only).

Posts are marked as promoting your own brand (`brand_organic_toggle`), which is TikTok's
required disclosure for this kind of content. TikTok's refresh tokens last about a year. The
workflow warns when TikTok issues a new one.

## Costs

Everything here is free: GitHub Actions minutes (about 1-2 minutes per video), ffmpeg, Python
libraries, the TikTok developer APIs, and the site's own artwork and original music. Nothing
needs to be bought. Optional paid add-ons (premium TTS narration, extra artwork) need your
approval first.
