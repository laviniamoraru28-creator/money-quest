# Money Quest World — Completion Checklist and Decision Log

Persistent record for the autonomous completion mission (started 2026-10-20).
Status words: **verified-auto** (an automated test ran and its log was read),
**verified-manual** (gameplay inspected), **implemented** (code written, not yet
run), **open**, **blocked** (needs the owner). Nothing is marked verified unless
a log or screenshot from an actual run backs it.

## 0. Safety state

- Branch `claude/focused-ritchie-gnnyag`, HEAD `b72f381`; 72 uncommitted changes
  preserved. Full backup of all uncommitted work (tracked patch + 20 untracked
  files + scratch save) taken 2026-10-20 in the session scratchpad
  `backup-20261020/`. No commit, push, stash, reset or branch change made.
- Owner decisions 2026-10-20: edit/test only inside this repo (no other
  `C:\MoneyQuest\` path, no real saves, no Time Vault data); Godot may use only
  the scratch project's own user folder (`app_userdata/MQ Visual Test Scratch`);
  SavePolicy for the performance pilot = `record`.

## 1. Baseline

| Item | Status | Evidence |
|---|---|---|
| Godot 4.7.2.stable (build `ed1daf0bf001b61586d9930840f2f1394092c079`), renderer `gl_compatibility` (desktop and mobile) | verified (binary + `project.godot`) | exe SHA-256 `ab1824f8…b22424` |
| Headless regression subset on a fresh scratch copy (15 suites: compat check 696 loads, runtime, reduced-motion cards, money-life core/timevault/migrate, dialogue, nav graph, quests, answers, inventory, avatar flow ×4, old-save discovery) | **verified-auto: all pass, 0 script errors** (baseline before fixes) | `scratchpad/base_headless.out`, logs `scratchpad/base/b_*.log` |
| Same suite after fixes F1+F2 | verified-auto: all pass except one flaky `answers` run (2 timing fails); `answers` rerun twice → 23/23 both | `fix_headless.out`, `base/f_*.log`, `base/f_answers_r1/r2.log` |
| Known flaky test | `_answers.gd` lesson-completion timing (passes on rerun) | noted, not a game defect |
| Remaining `ERROR:` lines | only from the first `--import` (translations not yet generated) and the compat checker's raw load of `translations.csv` — test/import artefacts, not game defects | `base/f_check.log`, `base/b_imp.log` |
| Windowed input/visual regression (`scratchpad/windowed_suite.sh`, prefix `w21`, run 2026-10-21 on `mq-b20261020` = repo state except scratch project name, owner-approved, machine free) | **verified-auto: 75/75 runs pass, 0 fails, 0 script errors** — keyboard, mouse, gamepad, touch; Reduced Motion (6 motion checks, 0% motion), no-text mode, UI scale, read-aloud; new player + resume, menus, dialogue lessons, navigation, landmarks, zones, Money Life, Time Vault model, Market/Library/Business purposes, B1 quests, save migration, avatar flow; compat 702 loads / 0 fails. `answers` was cut off by the suite's 180 s limit (7 checks); rerun alone windowed → **24/24, exit 0, 300 s** | `scratchpad/windowed_w21.out`, `base/w21_*.log`, `base/w21_answers_rerun.log` |
| Screenshots from the windowed run | taken by the tests, **not yet inspected by eye** (visual checks: Calm World contrast, avatar looks) | `scratchpad/` shot folders with prefix `w21` |

## 2. Fixes made in this mission

| # | Change | Files | Status |
|---|---|---|---|
| F1 | Content loaders also accept exported `*.tres.remap` names | `autoload/WorldManager.gd`, `QuestManager.gd`, `LibraryManager.gd`, `MuseumManager.gd`, `MindLabManager.gd` | **verified-auto in an exported build**: with the fix 54 zones / 89 quests / 8 books / 5 mentors / 16 exhibits / 7 Mind Lab entries register (`scratchpad/exports/smoke_check.log`); the same export *without* the fix registers **0 of each** (`smoke_check_nofix.log`) — a critical release bug, now fixed |
| F2 | Physical-key labels only query the keyboard layout on desktop display servers; removes ~6,900 `ERROR: Not supported by this display server` lines per headless run, and the same spam on phone/web builds | `autoload/InputHints.gd` | verified-auto (headless errors 2,875 → 0 in `runtime`); windowed key labels to re-check |
| D2 | **English-only initial release** (owner decision 2026-10-21, replacing the earlier en+ro choice): `SELECTABLE_LOCALES = ["en"]`; a save holding another language opens in English without touching the rest of the save; translation files and localization system unchanged; no selector added (the game never had one) | `autoload/Localization.gd`, `autoload/SaveManager.gd`, `README.md` | **verified-auto** (`scratchpad/base/h_d2d3*.log`): only "en" selectable; all 9 translation files still configured; real game path (two processes): a Polish save opens in English, file byte-identical after start-up, progress (xp/coins) loaded; mid-session reloads change nothing on disk but the language; English text shows |
| D3 | "Ask a grown-up" confirmation before Library "Read more" / Museum "Learn more" open a website; same URLs; "Not now" is the focused default; question read aloud when narration is on; closing the card cancels it; no networking or data collection added | new `scripts/ui/GrownUpGate.gd`; `scenes/ui/BookCardPanel.gd`, `scenes/ui/ExhibitCardPanel.gd`; `localization/translations.csv` (+3 keys appended in all 9 languages, existing 2,743 lines byte-identical) | **verified-auto headless** (22 checks, both cards): question appears under the button in English, "Not now" focused, ≥60 px buttons, read aloud with narration on, "Not now" closes it, closing the card cancels it, URL unchanged; "Open the website" deliberately never pressed in tests (it would open a real browser). Full headless suite still all-pass (`g_headless.out`). **Not yet seen in a window** |
| F3 | Windows Desktop export preset (export path passed on the command line, nothing written into the repo) | `export_presets.cfg` | verified-auto: headless `--export-debug` and `--export-release` both exit 0 with 0 errors / 0 warnings |

## 3. Feature audit (requirements vs. source)

| Area | Source status | Verification |
|---|---|---|
| World Hub, 7 portals, return paths | implemented (README §What this demonstrates) | to verify (nav tests) |
| Money Quest: 30 lessons, 7 zones | implemented | to verify (quests test) |
| Entrepreneur Quest: 26 decision events, 18 BUILD stages, simulator | implemented; 5 standalone Business Challenges, RUN/Rescue hub pages, Business Rescue scenario not built (documented as not fitting) | to verify |
| Leadership Quest: 12 missions | implemented; Leadership Lab/Profile/"uh-oh" events not built | to verify |
| Library: 8 books | implemented; Leadership & Mind Lab shelves "coming soon"; 2 mentor `source_url` empty (no network to verify) | to verify |
| Museum: 10 rooms, 16 exhibits | implemented | to verify |
| Mind Lab: 10 rooms | implemented; non-en/ro translations model-made, need native review | to verify |
| Calm World: 9 spaces | implemented; contrast/readability to re-check | to verify |
| Avatar: female-presenting looks | available through neutral customisation (long/ponytail/braids/bun hair, dress outfit); no gendered preset by design | to verify visually |
| Read-aloud | implemented via OS text-to-speech (`AudioManager._speak`, `DisplayServer.tts_*`); README "no TTS" note is outdated | to verify on this machine |
| Audio files | none shipped (0 `.ogg/.wav/.mp3`); sound comes from the procedural `SoundSynth` set (documented as a placeholder sound set) | acceptable for now; real audio would be new content |
| Translations | 2,742 keys. en and ro complete (the 3 empty cells are deliberate plural forms). es/fr/de/it/pt/nl/pl each **~2,050 empty (~75%)** — falls back to English, by the project's documented "en/ro populated" convention | **owner decision D2** |
| Network / privacy | no HTTP, sockets or JS bridge anywhere in game code; data stays in local `user://progress.json`. Only exit: Library "Read more" and Museum "Learn more" call `OS.shell_open(source_url)` immediately, with no grown-up check | **owner decision D3** |
| Unfinished markers | none in game logic; "coming soon" only on the empty Leadership & Mind Lab bookshelf sections (documented) | — |
| Reduced Motion | implemented project-wide | to verify (`_p4` motion test) |

## 4. Export / release

| Item | Status |
|---|---|
| `export_presets.cfg` | created (Windows Desktop, x86_64) |
| Export templates | installed 2026-10-20 (owner approved): official `Godot_v4.7.2-stable_export_templates.tpz` from the GitHub 4.7.2-stable release, SHA-512 checked OK against the release's `SHA512-SUMS.txt`; only `version.txt` + the 4 Windows x86_64 templates extracted to `%APPDATA%\Godot\export_templates\4.7.2.stable\` |
| Windows test exports | built in the scratchpad (`exports/debug`, `exports/release`, ~106–112 MB each incl. 2.8 MB `.pck`) from a scratch copy whose project name is `MQ Visual Test Scratch`, so the test builds only ever use the scratch save folder |
| Exported release — headless startup | verified-auto: boots its main menu, 600 frames, exit 0, 0 errors/warnings (`exports/smoke_release.log`). **Not yet verified: rendering, input, navigation, save behaviour** — needs the windowed check |
| Note on command-line scenes | official templates refuse a scene path on the command line (security default), so export checks use a separate check build whose main scene is the check |
| Final deliverable build | open: re-export from a clean copy (without the scratch `_exportcheck` files) once the game work is finished; release builds for distribution must use the real project name |
| Android / iOS / Web | blocked: no Java/Android SDK, no Mac; Web untested |

## 4b. Browser release readiness (read-only assessment 2026-10-21)

Target: moneyquesteducation.com, in-browser, no install, no account. Nothing built, deployed or changed on the website yet.

| # | Item | Class | Status |
|---|---|---|---|
| W1 | Web preset (single-threaded `nothreads`, adaptive canvas, on-screen keyboard enabled) added to `export_presets.cfg`; web templates installed from the verified download; local release + debug builds export with 0 errors/0 warnings. Size: 42.6 MB raw (`index.wasm` 39.5 MB, `index.pck` 2.8 MB), ≈11.6 MB gzip | critical | **done (local)** 2026-10-21 |
| W1b | Headless Edge 155 (real GPU via ANGLE/D3D11, WebGL2): boots with no console errors/exceptions; main menu, avatar creation (incl. ponytail + dress look), entry into the World Hub all render; 60 fps (rAF avg 16.6 ms, max 17.6 ms) on this laptop; **save survives a page reload** (avatar step skipped after reload); Edge processes ≈1.0–1.16 GB total | — | verified-auto (headless, desktop GPU only); evidence `scratchpad/web/run_*` |
| W1d | **All 54 zones in the browser** (separate check build `web/check_tour`, scratch-only main scene `_webtour.gd`; tested build `release4` untouched): every zone loads with the player present, 0 console errors/warnings; desktop iGPU 52.8–60 fps (lowest Market Town 52.8, 277 draws, one 202 ms first-visit hitch; World Hub 58.7; Sky Exchange 59.8); slowest loads Calm World rooms ≈2.6–3.0 s on this laptop (likely several times longer on phones) | — | verified-auto (headless Edge, desktop GPU) |
| W1c | Chrome not installed on this PC — only Edge (same Chromium engine) tested | gap | open |
| W2a | Hosting: **play.moneyquesteducation.com**, private staging, own document root; owner did the cPanel steps and uploaded `release4` (ZIP sha256 `f56dd712…e33148`). Checked without credentials 2026-10-21: every path 401 (Basic realm "Money Quest World Testing"), `.htaccess` 403, http→https 301, TLS 1.3, certificate valid to 2027-05-07, headers `no-cache` / `noindex, nofollow` / `nosniff`; main site unchanged and does not link to it. **Authenticated check 2026-10-22 13:50** (owner ran `scratchpad/staging/verify_staging.ps1`, password typed hidden in a console, not recorded; result `scratchpad/staging/verify_result.txt`): all 9 files **SHA-256 identical to release4**; MIME types correct (`text/html`, `text/javascript`, `application/wasm`, `application/octet-stream`, `image/png`); `Cache-Control: no-cache` on all; gzip on `.html` and all `.js`. **`index.wasm` (39.5 MB) and `index.pck` (2.8 MB) are NOT compressed** → ≈42 MB download instead of ≈12 MB (see W2b) | critical | **deployed and verified (staging)**: integrity, MIME, cache PASS; compression of 2 files open |
| W2b | Compression of `index.wasm` / `index.pck` — LiteSpeed ignores the `.htaccess` DEFLATE rule for these two (type list or size limit; server config not visible). Owner wants it solved before public release **without rebuilding or changing the game**. Proposal prepared, not applied (owner approval needed): serve pre-made gzip copies (`index.wasm.gz` 10.1 MB, `index.pck.gz` 1.4 MB; both decompress to the exact release4 bytes) via an added `.htaccess` block; stage A in a separate `/gztest/` folder, stage B at the root only if A passes; rollback = remove the block and the two `.gz` files. Files in `scratchpad/staging/gz-proposal/`. **Stage A approved and done 2026-10-22:** ZIP (sha256 `33a558f8…877dfdda1`, 12 entries all under `gztest/`) uploaded to the home folder and extracted into the staging folder → only `/gztest/` added, root untouched. Owner PC browser test of `/gztest/`: game loads and plays — PASS. Technical check (`verify_gzip.ps1 -Folder gztest`, v2, result `verify_gzip_v2_result_gztest.txt`): **OVERALL PASS** — all 9 files plain = release4; gzip-only requests decode to release4; browser-like requests get `index.wasm`/`index.pck` as gzip (`application/wasm` / `application/octet-stream`, `Vary: Accept-Encoding`, decode once to release4) and the small text files as server Brotli. (v1 run marked the 4 Brotli text files FAIL only because PowerShell 5.1 cannot decode Brotli — checker limitation, not a server fault.) Cosmetic: `Vary` appears twice on the two big files. Stage B (root) **approved 2026-10-22** with conditions: back up the root `.htaccess` first, add only the tested block, keep auth/routing/security rules, no game file changes, full verification after, rollback ready, main site/Git/production untouched; P30 timing of `/gztest/` vs root still to do. **Stage B done 2026-10-22:** owner downloaded the root `.htaccess` backup (`Downloads\htaccess (2)`, 1,237 B, sha256 `139ab366…d643802c`; second copy `scratchpad/staging/stageB/root-htaccess-backup-20261022.txt`) — password section, security headers, MIME types, deflate rule and https redirect all present; copied the two verified `.gz` files from `gztest/` to the root (check: identical to Stage A, `ffa4b293…` 10,084,286 B and `af77a546…` 1,401,153 B); appended only the tested 14-line block (`# Money Quest: serve…` … `# Money Quest: end`) at the end of the root `.htaccess`. Right after saving (no login): every path 401 with the realm, `.htaccess` 403, http→https 301, no 500 errors, main site unchanged (307 → `/en`). Authenticated check 15:47 (`verify_gzip.ps1 -Root`, result `verify_gzip_v2_result_root.txt`): **OVERALL PASS** — 9/9 files = release4 plain and after one decompression; `index.wasm`/`index.pck` served gzip with `application/wasm` / `application/octet-stream` and `Vary: Accept-Encoding`; text files Brotli from the server. Download ≈11.5 MB instead of ≈42 MB. Owner: game works on the laptop and on the Huawei P30 after the change (overall impression, not itemised). Rollback ready: remove the block (or restore the backup) and delete the two root `.gz` files. Incident: a script bug (`-Folder ""` dropped by `powershell.exe -File`, so no hidden prompt) led to the old staging password being typed at a normal prompt and shown in a terminal tab; the owner changed the password the same day (new one works); script fixed (`-Root` switch); removing the old line from PowerShell's history file is recommended. Leftovers: `/gztest/` (delete before public release); `Vary` duplicated on the two big files (cosmetic) | performance (owner: before public release) | **DONE — Stage A and Stage B PASS** |
| W2 | Website routing: decided — static subdomain, so no site code change (`src/middleware.ts` untouched) | — | **done** |
| W2c | **Slow loading investigated 2026-10-22** (fixed by W2b Stage B; P30 itemised timing still to record) (read-only; owner ran `scratchpad/staging/perf/measure_staging.ps1`, password hidden/not recorded; result `measure_result.txt`; local browser runs `scratchpad/web/loadperf/run_*`). **Main bottleneck: server delivery rate ≈1.0–1.9 MB/s vs the owner's line 5.7–8.7 MB/s (Cloudflare reference), with 42 MB uncompressed.** Root `index.wasm` 37.7 MB in 33.7 s / 19.6 s; `/gztest/` gzip 9.6 MB in 9.7 s / 6.0 s (≈70 % less download time); `index.pck` 2.1–2.5 s → 1.4 s. Server response (TTFB) ≈0.2 s. 4 parallel range requests = 1.60 MB/s aggregate → not a per-connection limit; account/server-wide cap (CloudLinux/CageFS present; I/O limit suspected, not visible to us — owner can check cPanel Resource Usage). Progress bar **accurate** (counts received bytes vs true sizes; rose at exactly the throttled rate in simulation). After the bar is full, WebAssembly compile + engine start take **4.4–5.4 s on this laptop** (unchanged by gzip; phones likely several times longer — to time on the P30). Simulated first visit at 1.25 MB/s: original 37.5 s, gzip 14.2 s to engine start. Caching works: `Last-Modified` present (no ETag), repeat visits get **304 in 0.2 s**, no re-download. Recommendation: Stage B gzip at the root (approved 2026-10-22); later, if still slow, CDN/static host (separate plan); smaller engine build only with a rebuild (out of scope) | performance | measured; Stage B in progress |
| W3 | iPhone/iPad Safari cannot be tested here (no Apple device); support must not be claimed until tested on a real device | critical | open |
| W4 | Windowed regression and A1 pilot (see §1 and §5) | critical | **done 2026-10-21** (visual inspection of screenshots still open, not blocking) |
| W5 | Phone/tablet performance and memory unknown (heaviest rooms ~240 draw calls / ~400k primitives on desktop); test on the owner's Android phone at least | critical | open |
| W6 | Browser saves (`user://` → IndexedDB) and their persistence untested; Safari can evict site data after ~7 days unused, private mode does not persist | critical (verify + tell parents) | open |
| W7 | On-screen keyboard for the Business Builder free-text stages untested on mobile browsers | critical if it blocks progress | open |
| W8 | Privacy notices are drafts for an old account model; a game-specific notice (no account, progress only in this browser) is needed | critical (owner/legal) | open |
| W9 | Portrait phones: upright phone showed a thin 16:9 band with ~10 px text. **Fixed (owner-approved 2026-10-21):** new autoload `scenes/ui/RotateHint.gd` (+1 line in `project.godot`, +1 key `rotate_hint.message`) shows "Turn your device sideways" with a phone picture only on an upright touch screen; covers and blocks taps, pauses/changes nothing, hides on rotation; Reduced Motion = still picture; read aloud when narration is on | was critical | **verified-auto**: native unit test 11/11; full headless suite all-pass; web build in headless Edge with touch emulation — phone upright shows hint (text fully visible after two layout fixes), animated frames differ, Reduced Motion frames byte-identical, taps blocked, rotating back restores the exact avatar screen (hairstyle 7 kept), tablet upright shows hint, tall desktop window without touch shows no hint; 0 console errors. Limitation: hint is drawn inside the 16:9 game area (black bars above/below), text ≈26 px on a 390-px-wide phone. **Real-phone check pending** |
| W9c | Short landscape phones: Settings switches look ~20 px — touch-size check on a real phone | verify | open |
| W9b | Touch input works in emulation (taps open menus); audio is pre-built `AudioStreamWAV` (compatible with the web's Sample playback mode) — still to be heard on a device | verify | open |
| W10 | Audio and read-aloud on the web need a first tap (browser rule); speech voices vary by device | verify | open |
| W11 | 7 incomplete languages, real audio assets, fullscreen button, offline/PWA, quality settings | can wait | — |

## 5. Performance verification (spec v2, Parts 1–3)

- Stage 2 files created in the scratchpad; identity values approved; runner
  configured with SavePolicy `record`. Partial assumptions R4, R10, R11, R16,
  R17, R18 remain unresolved and documented in the spec.
- **A1 pilot run 2026-10-21 (owner-approved, machine free): PASS.** Runner exit
  0; exe, engine hash, harness files and 711-file manifest all equal the
  approved values before and after; 5/5 visits, `measurement_complete=1`,
  `config_status=verified`, `valid=1`, 0 stray input events; save
  `absent` → recorded `52686d87…6d0281` (scratch folder only). Laptop
  (Ryzen 7 7730U, vsync off): World Hub load 71 ms, p50 1.7–1.9 ms, p99 ≈3.3 ms;
  Golden Vault 451 ms, 1.3 / 2.6 ms; Sky Exchange 256 ms, 1.5–1.7 / 3.0 ms;
  Kindness Grove 241 ms, 1.4–1.5 / 2.6 ms; one 48 ms frame in the first World
  Hub walk (not repeated); memory 75–100 MB peak, 0 orphan nodes. One engine
  warning ("Target and up vectors are colinear", `WorldInteractable.gd:125`) —
  harmless, tidy later. Evidence `scratchpad/perf/perf_A_1.{log,class.txt,errors.txt}`.
- Note: any later change to the game changes the scratch-copy manifest, so the
  pilot snapshot (`mq-test`) is kept separate from the baseline copy
  (`mq-b20261020`); re-approval of the manifest hash is needed if the pilot is
  to measure a newer build.

## 6. Decisions needing the owner

1. ~~Permission to download the export templates~~ — granted and done 2026-10-20.
3. **D2 — decided 2026-10-21: English-only initial release** (see §2).
4. **D3 — decided 2026-10-21: add the "Ask a grown-up" confirmation** (see §2).
2. ~~A1 pilot and windowed regression~~ — run and accepted by the owner as test
   evidence 2026-10-22. Still open, not blocking: eye-check of the screenshots
   (Calm World contrast, avatar looks).

## 7. Release status (2026-10-22)

**Verdict: NOT READY for public release.** Staging stays private.

Completed (evidence above): headless suite; Windows export (F1 proof);
web build in headless Edge incl. all 54 zones, reload-save and rotate hint;
staging deployed behind a password with HTTPS and no-index headers; main site
unchanged; **windowed regression 75/75; A1 pilot PASS**.

Remaining release blockers, in order:

| # | Blocker | Who | Done when |
|---|---|---|---|
| R1 | Deployed files = release4; `.wasm` type; cache | owner ran the check 2026-10-22 | **DONE — PASS** (9/9 identical, MIME and cache correct) |
| R1b | Compression of `index.wasm` / `index.pck` (W2b) | owner approves the staged plan | both served gzip, decompressing to the exact release4 bytes, game loads on PC and P30 — **DONE 2026-10-22: Stage A (`/gztest/`) and Stage B (root) PASS** |
| R2 | Huawei P30 structured test (W5, W6, W7, W9, W9b, W9c, W10, D3 real "open") | owner on the phone | every MUST item PASS — **2026-10-22: functional must-pass items 5, 8, 9, 12, 13, 15 PASS (owner-confirmed); item 1 (load time) and the should-items not yet reported** (see "Huawei P30 manual tests" below) |
| R3 | Fix anything R1/R2 find → rebuild → retest → re-upload | each step owner-approved | — |
| R4 | Privacy notice: contact, log retention, where it is shown, final wording (W8) | owner decides / supplies | notice approved and placed |
| R5 | iOS (W3): test on a real device, or launch stating iOS is not yet supported | owner decision | decision recorded |
| R6 | Commit the release state to Git | owner approval | release build made from a committed state |
| R7 | Go-live: remove password, switch caching, link from main site | separate owner approval | — |

### Status update 2026-10-22 (after Stage B)

Still **NOT READY**. Done since the table was written: R1, R1b. Owner reports the
game "appears to work correctly" on the laptop and the Huawei P30 — recorded as an
overall impression; the 15 P30 items (R2) are **not yet individually documented**.
Open, in the shortest safe order: R2 (itemised P30 sheet, ≈25 min) → R4 (privacy
facts from the owner) → R5 (iOS decision) → R6 (commit, owner approval) → go-live
prep (delete `/gztest/`, caching decision, privacy page upload) → R7 (remove
password, link from the main site — separate approval). R3 only if R2 finds a
must-pass failure.

### Huawei P30 manual tests (owner-confirmed, 2026-10-22)

Owner ran these on the Huawei P30 against the staging root after Stage B and reported
the results; they are **user-confirmed manual tests** (no logs or screenshots on file).
The owner's report numbered them 5–10; the original checklist number is given too.

| Original # | Test | Result |
|---|---|---|
| 5 | Avatar creation and entering the World Hub with touch only | **PASS (owner-confirmed)** |
| 8 | Complete a lesson and receive virtual money | **PASS (owner-confirmed)** |
| 9 | Business Builder: on-screen keyboard appears, text typed, can continue (W7) | **PASS (owner-confirmed)** |
| 12 | Progress kept after completely closing the browser (W6) | **PASS (owner-confirmed)** |
| 13 | Progress kept after restarting the phone (W6) | **PASS (owner-confirmed)** |
| 15 | 20 minutes of play with no crash or reload | **PASS (owner-confirmed)** |

Not yet reported — **not verified**, not marked PASS:

| Original # | Test | Class |
|---|---|---|
| 1 | Load time: login → full bar → game appears (target ≤ 30 s) | must-pass (was) — only an overall "loads fine" impression so far |
| 2 | Rotate hint upright / sideways, state kept (W9) | should |
| 3 | Sound after the first tap (W9b) | should |
| 4 | Settings toggles easy to tap (W9c) | should |
| 6 | Smoothness in World Hub, Market Town, Sky Exchange (W5) | should |
| 7 | Calm World room loads ≤ 10 s (W5) | should |
| 10 | Read-aloud speaks (W10) | should |
| 11 | "Read more" → grown-up question → "Open the website" really opens the site (D3) | should |
| 14 | Reduced Motion on the phone | should |

## 8. Privacy audit (read-only, 2026-10-22)

### 8a. Game — play.moneyquesteducation.com (release4 + staging hosting)

Method: searched all game scripts/scenes for network, JS-bridge, browser-open,
device-ID and permission APIs; read `SaveManager.gd` and Business Builder; searched
the exported `index.html` / `index.js` / `index.pck` for trackers, cookies, storage
and URLs; loaded release4 in a clean headless Edge profile and recorded every
request, cookie and storage area; checked live staging response headers.

| Principle | Result | Evidence |
|---|---|---|
| No accounts / registration | **verified** | no sign-in, account or networking code in the game |
| No children's names, emails or contact details collected | **verified, with note** | the game never asks for a real name, email, address, phone or photo; avatar = visual choices only; `age_band` is a fixed internal default. Note: Business Builder has 11 free-text fields (problem, idea ≤200 chars, business name ≤40 with the hint "Use a fun made-up name … not your real full name", slogan ≤60, product description, why-choose-us, next step, profit plan …) — a child *could* type something personal; it stays on the device |
| No analytics or advertising trackers | **verified** | none in game code, page or engine; browser run: the only origin contacted is the game's own; 0 cookies (page and hosting: `Set-Cookie` none); no localStorage/sessionStorage; no service worker |
| No personalised advertising | **verified** | no advertising at all |
| Progress stored locally | **verified** | single `user://progress.json` in the browser's IndexedDB (`/userfs`) |
| No progress/profile sent to our server | **verified** | after downloading its own files the game sends no requests; the only outbound code is `OS.shell_open` for the 16 Library/Museum source URLs behind the "Ask a grown-up" gate |

Processed automatically, not by the game: hosting access logs (IP, time, file,
user agent, referrer, status — retention set by the host, **not yet verified**;
cPanel → Metrics → Raw Access / AWStats); browser cache of the game files; speech
service of the chosen voice when read-aloud is used; the outside site if a grown-up
opens a link. Present but never called: the standard Godot web modules for
WebSocket/WebRTC/HTTP/microphone (no game code uses them; audio input not enabled).

**Read-aloud and typed text:** automatic narration is off by default; the Listen
control (button, L, gamepad X) speaks on request even when it is off. The Web voice
is the first one the browser lists for English; the Godot web engine exposes only
voice name and language (not whether a voice is local or online). Typed Business
Builder text is **never** spoken automatically and the text-entry panels' own
Listen reads only the prompt and built-in suggestions; it **can** be spoken when
Listen is pressed on the **logo/slogan panel** (`LogoBuilderPanel`, no
`listen_text()` → generic reader includes the slogan `LineEdit`) and the **final
pitch panel** (`PitchDisplayPanel`, labels show the typed answers). With an online
voice (e.g. Google voices in Chrome) that text would go to the voice provider.
Options assessed 2026-10-22 — no change made, owner decision pending.

### 8b. Main website — moneyquesteducation.com (separate audit, code + live, read-only)

Code: the middleware states the privacy-first redesign removed accounts, sessions
and the Grown-up Mode gate; no auth library, no Supabase client, no database
(`database.types.ts` keeps only `AgeBand`), the only API route is `/api/health`;
feedback and play features store data in the visitor's own `localStorage` only;
no external scripts. (A comment in `src/i18n/navigation.ts` still mentions an
"authenticated app" — stale, not code.) Live: `/en/login`, `/signin`, `/sign-in`,
`/signup`, `/dashboard`, `/account`, `/api/auth/session` all **404**; homepage loads
only its own origin, no tracker tags. One cookie: `NEXT_LOCALE=en` (language
preference set by next-intl, 1 year, host-only for moneyquesteducation.com, so it
is not sent to `play.`). Not audited: the main site's own privacy page wording and
its server-log settings.

## 9. Release5 — Read-Aloud privacy (Option A) (2026-10-22 … 2026-10-26)

**Decision (owner, 2026-10-22): Option A, before public launch** — typed Business
Builder answers are never handed to text-to-speech; Read-Aloud stays for lessons,
instructions, labels and built-in picture suggestions; a typed answer is spoken as
"your own words". Options B (local voices only), C (bundled speech engine), D
(pre-recorded audio) and E (disclose only) were assessed and not chosen.

Changes (4 files): `autoload/BusinessBuilder.gd` (+`is_built_in_answer()`,
`spoken_answer()`), `scenes/ui/LogoBuilderPanel.gd` (+`listen_text()`: typed slogan
→ "your own words"), `scenes/ui/PitchDisplayPanel.gd` (+`listen_text()`: typed
answers → "your own words"; the screen still shows the child's words),
`localization/translations.csv` (+`narration.own_words` = "your own words", English
only; existing lines byte-identical).

| Test (owner-approved 1–5) | Result |
|---|---|
| Privacy test `_ownwords` (21 checks) added to the headless suite | **21/21** native and **21/21** inside the web build (Edge) |
| Full headless suite, fresh copy `mq-r5` | **20/20 suites pass**, 0 script errors (compat 706 loads; the 2 `ERROR` lines are the checker's deliberate raw load of `translations.csv`) |
| Windowed regression | **81/81 runs pass**, 0 fails, 0 script errors — pass counts identical to release4; `answers` now 24/24 with a 420 s limit |
| All 18 Business Builder stages (`_bb18`) | **6 runs pass** (keyboard typed / pictures, mouse typed, touch typed / pictures, gamepad pictures; read-aloud on and off): all stages + pitch complete, answers saved, **0 typed answers among 163–189 spoken lines per run**, "your own words" on logo + pitch, built-in answers and suggestions still read, lessons still narrated |
| Release5 web export (clean copy, real project name) | 0 errors, 0 warnings |
| Edge (headless, real GPU) on release5 | boot 0 console errors, 60 fps; **save survives reload** (IndexedDB `progress.json` identical before/after); **rotate hint** phone/tablet/Reduced Motion/tall desktop as release4, state kept; **54/54 zones** (check build) with release4-equal fps, draws and load times |

Test-code issues found and fixed during the run (not game defects): simulator step
must place all coins ("the rest" button); grid focus rule; one wrong expected count.
Note: a JS exception (`currentTime` of null) appears only after the browser privacy
test's own `quit()` (engine audio shutting down); never in normal play.

Release5 hashes: `index.pck` b92ac729…cc555 (2,802,104 B), `index.html` 89f0dce3…9921e;
`index.wasm`, `index.js`, worklets and icons identical to release4.

**Permanent backups (2026-10-26):** `C:\MoneyQuest\release-backups\release5`
(export, `SHA256SUMS-export.txt`, all test reports/logs/screenshots, test sources,
`README.md`, `MANIFEST.sha256` — 169 files) and `C:\MoneyQuest\release-backups\release4`
(export, staging ZIP, `.htaccess` backups and Stage A/B evidence, load measurement,
2026-10-20 source backup, `ROLLBACK.md`, `MANIFEST.sha256` — 68 files). Browser test
profiles were not copied. No passwords stored.

**Deployment status: release5 built and tested locally only. Private staging still
serves release4 (+ gzip, Stage B).** Release5 staging deployment needs separate
owner approval. Still NOT READY for public release (privacy.html facts, iOS wording,
go-live steps).
