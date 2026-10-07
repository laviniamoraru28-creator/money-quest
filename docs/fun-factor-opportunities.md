# Money Quest World — fun-factor opportunities

A record of small, reusable ways to make the world feel like a joyful
children's adventure rather than a lesson platform in 3D. Gathered while
auditing the existing activities (all 30 Money Quest lessons, the Hub's
interaction cards, the Leadership mini-games, the Golden Vault slice).
**Nothing here is implemented yet** — each item names the existing system it
would build on, so it can be picked up later without new architecture.

Guiding rules for every item: harmless and kind (never laughing *at* the
child), short, optional, Reduced-Motion aware, never blocking progress,
readable without sound, and cheap to run.

## What the audit found

- Every lesson follows the same rhythm: intro lines → one choice → an
  explanation → a quiz → a reward. Clear, but the world itself never
  *responds*: the NPC stands still while the lesson happens around them.
- The best moments already in the game are the ones where something happens
  in the world: coins dropping into the Golden Vault jar, the vault adding an
  interest coin, Hub landmarks "reacting" when approached (AmbientDirector
  reactions).
- Wrong answers are already gentle (retry with kind feedback) — a good base
  for playful, non-punishing reactions.

## Opportunities

### NPC reactions and expressive animation (CharacterRig, NPC)
- **Answer reactions:** the NPC who asked a quiz question nods and gives a
  little fist pump on a correct answer; scratches their head with a "Hmm,
  let's look again" on a retry. Built on `CharacterRig` (new one-shot
  gestures beside `wave_once()`), triggered from `LessonManager`.
- **Celebration hop:** quest-givers do a small jump-and-clap when their
  lesson's reward appears (`RewardPopup.celebrate`).
- **Idle personalities:** per-NPC idle "quirks" chosen from the id — a
  shopkeeper who polishes the counter, a guide who checks a pocket watch,
  a child who bounces on their toes. Same deterministic-by-id approach as
  `CharacterLook.for_npc`.
- **Sleepy NPC:** an NPC nobody has visited for a while yawns and stretches
  when the player arrives.

### Playful sound (AudioManager / SoundSynth)
- **Coin "plinks" with pitch steps** — each coin collected in a row is a note
  higher, so collecting three plays a tiny tune.
- **Footstep surfaces:** soft wood thuds on the vault's step, splashes near
  the Hub fountain (by checking the floor under the player).
- **Character "voices":** a short gibberish chirp per NPC when they start
  talking (pitch from their id), like many friendly adventure games — always
  with the text on screen.
- **Squeaky surprises:** a rubber-duck squeak when walking into the Calm
  World frog, a "boing" from a bouncy prop.

### Small visual surprises and interactive objects (WorldInteractable, ActivityStation)
- **Things that respond to bumping:** coin towers that wobble and settle when
  the player walks into them; chests that pop their lid open a crack and
  shut; bushes that rustle. (Visual only — `AmbientPart`-style one-shots.)
- **Clickable flavour props** with one-line jokes or facts: the vault door
  ("It's locked — savings are safe in here!"), the Hub notice board, the
  market stall scales that tip when you put a coin on them.
- **The vault wheel** spins faster for a moment when the child saves coins
  (an `AmbientDirector` "spin" reaction already exists — just wire it).

### Collectibles and discoveries (Collectible, ProgressManager activities)
- **One hidden golden coin per zone**, tucked somewhere that rewards looking
  around (behind a bench, on a balcony) — a gentle "collect them all" across
  the world, shown as a count in the help panel. `Collectible` already
  remembers what was found.
- **Coin-shaped stickers / stamps** for a sticker album page (a cosmetic
  reward, no money value), one per discovery.
- **Lore notes:** tiny "Did you know?" scrolls on shelves (Museum, Library)
  that open the existing card panels.

### Celebration moments (RewardPopup, AmbientDirector)
- **World celebrations:** when a zone's last quest is done, the room itself
  celebrates — banners ripple, lanterns glow brighter, confetti from the
  ceiling — once, briefly.
- **Level-up fanfare in the world:** the player character does a happy spin
  and a ring of light rises from the floor (not only a panel).
- **Streak praise:** three correct first-try answers in a row → the guide
  says "You're on fire! (Not really — that would be dangerous.)".

### Environmental storytelling (ZoneDressing subclasses)
- **Before / after:** the Golden Vault's jar stays full after the activity;
  the same idea everywhere — Market Town's stall gets new stock after a
  shopping lesson, the Kindness Grove plants a new flower after a giving
  lesson. The world remembers what the child did.
- **Signs of other visitors:** footprints, a forgotten scarf on a bench, a
  half-built sandcastle of coins — small props that suggest a lived-in world.

### Secrets and easter eggs (safe, optional)
- **A secret wave:** stand still in front of the Hub Guide for 10 seconds and
  they do a silly dance.
- **The tiny vault:** a miniature vault door in a corner of the Golden Vault
  with a single coin inside — "The smallest savings account in the world."
- **Fountain wish:** throwing a coin into the Hub fountain (an interaction)
  makes the water sparkle and the guide remarks that wishes are free, but
  saving makes them happen.

### Child-friendly rewards (cosmetics, progression)
- **Avatar cosmetics** earned by playing (hats, scarves, a piggy-bank
  backpack) — the avatar system already supports accessories.
- **A trophy shelf** in a personal room or the Hub showing badges as 3D
  objects (the Golden Coin Badge as a real coin on a stand).
- **Pet companion** unlocked at a level: a small creature that follows the
  player and reacts to discoveries (would reuse `AmbientCreatures` motion).

### The world reacting to the player
- **NPCs turn and watch** a player who runs past quickly; birds take off
  when the player walks through the Hub's flower beds.
- **Footprint trail** on soft ground (sand, grass) that fades after a few
  seconds.
- **Weather moments** in the Hub (a short sun shower with a rainbow) that
  happen after a milestone — purely visual, Reduced-Motion aware.

## Suggested first picks (smallest effort, biggest joy)

1. NPC answer reactions (nod / head-scratch) — one rig gesture + one hook.
2. Coin plinks that rise in pitch + per-NPC talk chirps — sound only.
3. One hidden golden coin per zone — `Collectible` already exists.
4. Vault wheel spin and room celebration on completion — existing
   `AmbientDirector` reactions.
5. Bump-reactive props (wobbling coin towers) in dressed zones.

## Implemented in the character & world phase

- **NPC answer reactions:** the NPC who asked nods happily at a right answer and scratches their head thoughtfully at a retry (`NPC._on_answer_checked`). The player's own character reacts too.
- **Coin plinks that rise in pitch** when coins are found one after another (`Collectible`).
- **The tiny vault:** a secret curiosity hidden in a corner of the Golden Vault.
- **Things that respond:** curiosity props (a savings jar, scales, a basket) bounce, tip or wobble when looked at (`CuriosityProp`).
- **Small celebrations:** a happy little jump and a short confetti burst when a mission step is done. Reduced Motion gets the text and chime only.
- **The world noticing you:** stay near someone for a while and they give a two-handed hello. NPCs glance at birds, leaves and glints nearby (`ZoneLife`).

Still open from the list above: per-NPC talk chirps, hidden golden coins in other zones, world celebrations when a zone is finished, a trophy shelf and a pet companion.
