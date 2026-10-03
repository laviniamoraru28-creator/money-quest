# Money Quest World — Godot foundation

A **standalone Godot 4.2+ project**. It is never imported into the Next.js
website build and has no network code, no database, no authentication —
see `docs/money-quest-world-architecture.md` (at the repo root) for the
full audit, architecture rationale, and 14-stage build order this project
implements.

Money Quest World is **not** "the 30 curriculum lessons converted into a
Godot game." It is the interactive 3D world of the whole Money Quest
ecosystem: a Hub plaza connecting three Quest tracks (Money Quest /
Entrepreneur Quest / Leadership Quest) plus four supporting destinations
(Library, Museum, Mind Lab, Calm World). This phase builds that foundation
and makes it real with playable slices of all three Quest tracks and Calm
World — the Hub itself, Money Quest's Golden Vault zone (Maya's "Saving
for Something Bigger" quest), Entrepreneur Quest's Idea Lab zone ("Handle
Competition"), Leadership Quest's Leadership Academy zone ("The Big
Mistake"), and Calm World's first garden (Bubble Garden) — on architecture
meant to support everything else in
`docs/money-quest-world-architecture.md` Section 10's table without being
rebuilt.

## How to open and run

1. Install Godot **4.2 or later** (this project was written against 4.2's
   feature set; it was not opened/run in the editor as part of producing
   this work, so treat the first open as a verification step, not an
   assumption of correctness).
2. Open Godot, "Import," and select
   `godot/money-quest-game/project.godot`.
3. On first open, Godot will import `localization/translations.csv` as a
   CSV translation source automatically. If it doesn't, select the file in
   the FileSystem dock and re-import it (Import tab → CSV Translation).
4. Press F5 (or the Play button). The game boots into `MainMenu.tscn`.

## Playing the vertical slice

1. Tap/click "Start." On a first launch you'll go through
   `AvatarCreation.tscn` (pick a look — including a seated, wheelchair-
   style look — a color, and an optional accessory — glasses, a cap, a
   hearing aid, or a cane, all listed together as equally normal choices;
   all cosmetic, nothing is gated behind these choices, and none of them
   change movement speed or collision); a returning session skips
   straight to the Hub. These choices now actually show up on your 3D
   explorer in every zone — see "Avatar wiring fix" below.
2. You arrive in the **World Hub** — a plaza with a central fountain, 7
   ground paths radiating out to 7 gate-shaped portals, a few decorative
   trees, and a **Hub Guide** NPC near spawn who gives a two-line welcome
   the first time (or any time) you talk to them. Walk up to a portal and
   interact with it:
   - **Money Quest** (gold) takes you to the **Golden Vault** zone.
   - **Entrepreneur Quest** (ember) takes you to the **Idea Lab** zone.
   - **Leadership Quest** (sky) takes you to the **Leadership Academy** zone.
   - **Calm World** (soft green) takes you to the **Bubble Garden** — a
     quiet space with nothing to tap, get right, or get wrong. Seven more
     portals inside Bubble Garden lead to Calm World's other named
     gardens: Aquarium Room, Light Room, Rain Room, Underwater Room,
     Forest Walk, Music Room, and Grow-a-Garden — all 8 gardens are
     always unlocked.
   - **Library** (soft blue) takes you to a real Library zone — bookshelves
     and a Librarian who plainly says the shelves are still being prepared
     (see "Content fidelity" below for why there are no books yet).
   - **Mind Lab** (teal) takes you to a real Mind Lab zone — talk to the
     Mind Lab Guide to try "Different Explanations": a friend doesn't wave
     back, and you practice considering a few different reasons why,
     instead of assuming the worst. No "correct" answer.
   - **Museum** is the only one left showing a short "still being built"
     line — the portal, zone registration, and locking logic all already
     work for it; only its actual zone content doesn't exist yet.
3. In Golden Vault, walk up to Maya and interact with her to start her
   quest. The savings mini-game runs for 3 weeks: each week, choose to save
   the full allowance toward the sketchbook or spend a little on a treat.
   Your choices genuinely determine whether the goal is reached. The real
   explanation and quiz (from the actual website curriculum content) play
   afterward, then the reward screen, which explicitly labels earned coins
   as **virtual** (never implying real money). Golden Vault also has a
   second resident NPC, the Savings Guide — talk to them to start "What
   Does Saving Mean?": you get one coin today, and you choose to spend it
   right away or save it in your jar, with the real curriculum's quiz and
   explanation afterward. A third resident, Theo, completes the "saving"
   topic's full trilogy with "Saving vs. Spending: The Real Trade-off":
   you choose whether to spend his money today or let it slowly grow with
   interest over time, again with the real curriculum's quiz and
   explanation afterward. A second portal inside Golden Vault leads to
   **Market Town**, Money Quest's second zone — walk
   up to the Baker to start "Need It or Want It?": a bakery has only
   enough allowance for bread or a chocolate bar today, and you choose
   which, with the real curriculum's quiz and explanation afterward.
   Market Town's second resident, Leah, gives "The Grey Area": Leah's
   calculator just broke and she needs a working one for a class
   project due tomorrow, and you decide whether she borrows one or
   buys a simple replacement, with the real curriculum's quiz and
   explanation on how something can be a need in one situation and a
   want in another afterward. Market Town's third and final resident,
   Jordan, gives "Needs, Wants, and Social Pressure": Jordan sees an ad
   playing on fear of missing out even though their current thing works
   fine, and you decide whether they pause to name the feeling the ad
   is creating or ask a friend for a reality check, with the real
   curriculum's quiz and explanation on how advertising and social
   pressure are designed to make wants feel urgent afterward —
   completing the "needs_wants" topic trilogy. A second portal inside
   Market Town leads to **Guardian Gate**, Money
   Quest's third zone — talk to Zara to start "Spotting a Scam": a
   message demands you act immediately, and you choose whether to enter a
   password right away or pause and check with a trusted adult, with the
   real curriculum's quiz and explanation on spotting scam warning signs
   afterward. Guardian Gate's second resident, Grown-up, gives "Some
   Promises Are Too Good": a pop-up claims you won a free prize you
   never entered for, and you decide whether to close it right away or
   show it to another grown-up too, with the real curriculum's quiz and
   explanation on why free-prize pop-ups from strangers are a trick
   afterward. Guardian Gate's third resident, Marcus, gives "Scams
   Target Emotions, Not Logic": a message promising guaranteed fast
   money feels exciting, and you decide whether to verify it by
   contacting the real friend directly or by checking independently
   whether "guaranteed returns" are ever genuinely real, with the real
   curriculum's quiz and explanation on how scams trigger a strong
   feeling to bypass careful thinking afterward — completing the
   "scams" topic trilogy. A second portal inside Guardian Gate leads to **Sky
   Exchange**, Money Quest's fourth zone — talk to Sam to start "Cash,
   Cards, and Currencies": Sam's family is planning a trip abroad, and
   you decide whether to bring money from home or exchange some for the
   local currency first, with the real curriculum's quiz and explanation
   afterward. Sky Exchange's second resident, Omar, gives "How a Card
   Payment Actually Works": Omar taps his family's card to buy a comic,
   and you decide how to confirm the payment really went through —
   watch the screen for the green tick, or ask the cashier directly —
   with the real curriculum's quiz and explanation on payment
   confirmation afterward. Sky Exchange's third resident, Mei, gives
   "Owning a Small Piece of a Company": Mei's uncle owns shares in the
   toy company behind her favorite action figure, and when its newest
   toy sells out everywhere, you decide whether Mei asks her uncle how
   that affects his shares or works it out by watching the toy's
   popularity herself, with the real curriculum's quiz and explanation
   on what owning a share actually means afterward. Sky Exchange's
   fourth and final resident, Tomasz, gives "Locked Until 18: How a
   Junior ISA Works": now 13, Tomasz wants a new bike and remembers a
   Junior ISA his dad opened for him, and you decide whether he asks his
   dad to explain the cash-vs-stocks-and-shares difference or works it
   out himself from the account statement, with the real curriculum's
   quiz and explanation on when a Junior ISA normally unlocks
   afterward — completing all 4 real topics Sky Exchange hosts at the
   builder age band. Sky Exchange's fifth resident, Visiting Friend,
   gives "Money Looks Different Everywhere": a visiting friend shows you
   a shiny foreign coin that looks nothing like your own, and you decide
   whether to compare the two coins side by side or ask whether other
   countries' money looks different too, with the real curriculum's
   quiz and explanation on why every country makes its own money
   afterward — the first lesson to grow one of Sky Exchange's topics
   beyond its builder age band. Sky Exchange's sixth resident, Elena,
   gives "Understanding Exchange Rates": Elena is
   comparing an online price in a different currency and can't compare
   the numbers directly, and you decide whether she looks up today's
   rate to convert the price or compares the rate a few providers are
   offering, with the real curriculum's quiz and explanation on why
   exchange rates keep changing afterward — completing the "currencies"
   topic trilogy. Sky Exchange's seventh resident, Mum, gives "Money You
   Can't Hold": Mum taps a card at the shop instead of handing over
   coins, and you decide whether to ask her where the money actually
   went or watch closely the next time someone taps a card, with the
   real curriculum's quiz and explanation on what makes a card tap
   digital money afterward — the first lesson to grow "digital_money"
   beyond its builder age band. Sky Exchange's eighth
   resident, Priya, gives "Staying Safe and Aware With Digital
   Money": Priya notices she's spent more this month than expected from
   several small payments she barely registered, and you decide whether
   she sets a regular weekly time to review her wallet history or gets
   in the habit of checking each payment confirmation, with the real
   curriculum's quiz and explanation on why digital payments are easier
   to lose track of than cash afterward — completing the "digital_money"
   topic trilogy. Sky Exchange's ninth resident, Leo,
   gives "Saving vs Growing Your Money": Leo has been saving coins in a
   jar for months when his sister explains the idea of investing instead,
   and you decide whether he asks her for another example or decides his
   jar is still the right choice for now, with the real curriculum's
   quiz and explanation on how investing's value can rise or fall with
   no guarantee afterward — the first lesson to grow "investing_basics"
   beyond its builder age band. Sky Exchange's tenth resident, Jamal,
   gives "Risk, Diversification, and Time": Jamal is
   deciding, purely as a thought experiment in the Investing Lab,
   whether to put pretend money into one exciting company or spread it
   across several, and you decide which he tries, with the real
   curriculum's quiz and explanation on what makes investing different
   from gambling afterward — completing the "investing_basics" topic
   trilogy. Sky Exchange's eleventh resident, Freya,
   gives "A Special Savings Account Just for Kids (UK)": Freya's grandma
   put money into a Junior ISA for her and she wasn't sure whose money
   it really was, and you decide whether she asks Grandma why or asks
   Mum when she'll be able to use it herself, with the real curriculum's
   quiz and explanation on who a Junior ISA's money actually belongs to
   afterward — the first lesson to grow "junior_isa" beyond its builder
   age band, the last Money Quest topic untouched at every age band
   until now. Sky Exchange's twelfth and final resident, Aaliyah, gives
   "Junior ISAs: Ownership, Timing, and Changing Rules": Aaliyah, 16,
   just took over managing her own Junior ISA and looked up this year's
   £9,000 allowance, and you decide whether she checks an official
   source for the exact current figure or asks her parents if they
   remember it being different in past years, with the real curriculum's
   quiz and explanation on why that figure is current rather than
   permanent afterward — completing the "junior_isa" topic trilogy and,
   with it, **all 30 of Money Quest's real website curriculum lessons**.
   A
   second portal inside Sky Exchange leads to **Coin Cove**, Money
   Quest's fifth zone — talk to the Shopkeeper to start "What Is
   Money?": you're buying an apple and decide whether to count out
   exactly two coins or hand over a whole handful and let her take what
   she needs, with the real curriculum's quiz and explanation on what
   actually counts as money afterward. (The real lesson's story has no
   named child — it's written as "you" — so this NPC uses a generic
   role name, the same convention Market Town's Baker established.)
   Coin Cove's second resident, Amir, gives "Where Does Money Come
   From?": Amir just watched his cousin get paid for babysitting
   straight into an app, and you decide whether he earns his own money
   by doing a chore or by selling something he made, with the real
   curriculum's quiz and explanation on how money is actually earned
   afterward. Coin Cove's third and final resident, Priya, gives "Money
   as a Tool, Not a Goal": a visiting friend hands Priya a foreign note
   nobody here can use, and you decide whether she suggests keeping it
   as a souvenir or helps her friend find a currency exchange, with the
   real curriculum's quiz and explanation on why money only works
   within its own trusted system afterward — completing the full
   "money_basics" topic trilogy in one zone, the same way Golden Vault
   completed "saving." A second portal inside Coin Cove leads to
   **Horizon Peaks**, Money Quest's sixth zone — talk to Finn to start
   "Planning a Few Steps Ahead": Finn has saved enough for a small toy
   today or a bigger set in three weeks, and you decide whether he
   pictures the outcome by writing it down or by talking it through
   with a grown-up, with the real curriculum's quiz and explanation on
   why thinking ahead leads to better decisions afterward. Horizon
   Peaks' second resident, Aisha, gives "Big Decisions, Long
   Timelines": she's just been paid from her part-time job, and you
   decide whether she spends it all now or sets some aside for
   something bigger years away — both genuinely valid, since this is
   the one lesson whose own text says there's no single right answer —
   with the real curriculum's quiz and explanation on why deciding on
   purpose matters more than which option is picked afterward. Horizon
   Peaks' third and final resident, the Sticker Keeper, gives "Waiting
   Can Pay Off": you're offered one sticker now or three tomorrow if
   you wait, and you decide how to pass the time while waiting — stay
   busy with something fun, or count down the hours — with the real
   curriculum's quiz and explanation on how patience paid off
   afterward, completing the full "long_term_thinking" topic trilogy in
   one zone. (The real lesson's story has no named child, so this NPC
   uses a generic role name, the same convention Market Town's Baker
   established.) A second portal inside Horizon Peaks leads to
   **Kindness Grove**, Money Quest's seventh and final zone — talk to
   Omar to start "Giving on Purpose": Omar splits his allowance three
   ways every week (spend, save, give), and you decide whether this
   week's giving money goes to a friend who's a little short or to the
   class fundraiser, with the real curriculum's quiz and explanation on
   why planning for giving ahead of time helps afterward. This
   completes all 7 of the real website's Money Quest zones. (Omar's
   name coincidentally matches Sky Exchange's Omar — an unrelated real
   character from a different lesson, harmless the same way the earlier
   Theo/Priya coincidences were.) Kindness Grove's second resident,
   Friend, gives "The Joy of Sharing": you have five coins and your
   friend has none but wants to join a game that costs one, and you've
   already shared a coin so you both can play — the only decision left
   is who goes first — with the real curriculum's quiz and explanation
   on how a small, shared coin made a real difference afterward. (This
   lesson's own story has no named child, just "you" and "your friend,"
   so this NPC uses that role as its generic name, same as Market
   Town's Baker.) Kindness Grove's third and final resident, Sofia,
   gives "Giving Thoughtfully": Sofia wants to support a cause she
   cares about but has seen news about donations not always reaching
   who they're meant to help, and you decide whether she researches it
   by reading the organization's own report or by asking someone who's
   volunteered there, with the real curriculum's quiz and explanation
   on why researching a cause helps your generosity actually make a
   difference afterward — completing the "giving" topic trilogy, the
   4th and final single-topic zone to reach 3/3 age bands.
4. In Idea Lab, walk up to the Business Guide and interact with them to
   start "Handle Competition" — a single decision ported directly from the
   website's real Entrepreneur Quest content: a competitor undercuts your
   price, and you choose how to respond. There's no single correct
   answer — each option has its own natural-language consequence. A second
   portal inside Idea Lab leads to **Marketing Studio**, Entrepreneur
   Quest's second zone — talk to the Marketing Guide to start "Create Your
   Marketing": some customers like your product but don't understand what
   it does, and you choose how to explain it. A second portal inside
   Marketing Studio leads to **Workshop**, Entrepreneur Quest's third
   zone — talk to the Workshop Guide to start "Handle a Customer
   Problem": a customer tells you your product is too expensive, and you
   choose how to respond. Workshop's second resident, the Supplier,
   gives "Rising Material Costs": the materials you need suddenly become
   more expensive, and you choose whether to raise your price, absorb
   the cost, or look for cheaper materials — the sibling real decision
   event to the Workshop Guide's quest, both from the real website's
   "handle-a-customer-problem" stage. A third portal inside Workshop
   leads to **Office**, Entrepreneur Quest's fourth zone — talk to the
   Office Guide to start "Make a Business Decision": way more customers
   want to buy from you than you expected, and you choose whether to
   make more product, raise your price slightly, or ask extra customers
   to wait. Office's second resident, Teammate, gives "A Teammate's
   Idea": someone helping with your business wants to change the
   product, and you choose whether to hear them out, say no, or try
   their idea as a small test first — the sibling real decision event
   to the Office Guide's quest, both from the real website's
   "make-a-business-decision" stage. A second portal inside Office
   leads to **Growth Lab**, Entrepreneur Quest's fifth zone — talk to
   the Growth Guide to start "Grow Your Business": you made fewer
   sales than you hoped for this week, and you choose whether to ask
   customers why, try something new, or keep doing the same thing. A
   third portal inside Growth Lab leads to **Research Lab**,
   Entrepreneur Quest's sixth zone — talk to the Research Guide to
   start "Research Demand": they'll walk you through a real example
   business, Fresh Trout (300 interested customers, only 75 recent
   buyers, 4 competitors already selling), and you decide what that
   data tells you. Research Lab's second resident, the Test Guide,
   gives "Test the Idea": you have some starting money, and you choose
   whether to spend it all building right away or test a little first.
   A third portal inside Research Lab leads to **Main Street**,
   Entrepreneur Quest's seventh zone — talk to the Shop Manager to
   start "Not Enough Customers": hardly anyone is buying from your
   business, so you investigate a few clues, pick the likely cause
   (just a reflection — no reward either way), then choose how to
   respond: get the word out, ask customers what they want, or lower
   your price for a while. Main Street's second resident, the
   Accountant, gives "Costs Increased": your materials have suddenly
   become more expensive, and you investigate why before choosing
   whether to absorb the cost, raise your price, or look for a cheaper
   supplier. Main Street's third resident, the Support Rep, gives "A
   Negative Review": a customer left an unhappy review, and you
   investigate why before choosing whether to apologise and fix it,
   send a free replacement, or leave it and move on. Main Street's
   remaining four residents complete the real v2 Business Problems
   library: the Sales Tracker gives "Sales Are Falling," the Profit
   Analyst gives "Why Aren't We Making Money?", the Cash Flow Advisor
   gives "Profit But No Cash," and the Warehouse Keeper gives "Too Much
   Unsold Stock" — each the same investigate-a-cause-then-choose-a-
   response shape as the zone's first three quests. A second portal
   inside Main Street leads to **Supply Yard**, Entrepreneur Quest's
   eighth zone — talk to the Pricing Tester to start "The Pricing
   Experiment": you're shown 3 real price/units-sold rows (at 3, 100
   people bought; at 5, 70; at 8, only 30) and decide which price makes
   the most sense. Talk to the Supplier Scout for "Choose a Supplier":
   compare 3 suppliers' real price/delivery/minimum-order/quality
   trade-offs, then pick one. Talk to the Stock Keeper for "Managing
   Your Stock": decide how much stock to order when you're not sure how
   much you'll sell. Talk to the Bookkeeper for "Cash Flow": learn why
   profit and cash aren't the same thing, then decide how to handle a
   customer who won't pay for 30 days. A portal inside Supply Yard
   leads to **AI Workshop**, Entrepreneur Quest's ninth zone — talk to
   the Tech Advisor to start "AI Can Be Wrong": a simulated AI
   assistant (clearly labeled as not real AI) suggests lowering your
   price, but your own sales data points to a different cause, and you
   decide whether to trust it, check your own data, or ask it to
   explain. A portal inside AI Workshop leads to **Turning Point**,
   Entrepreneur Quest's tenth zone — talk to the Business Advisor for
   "Business Pivot": your business isn't growing the way you hoped, and
   you decide whether to change customers, change products, stay the
   same, or stop. Talk to the Growth Coach for "Grow or Stay Small":
   decide whether to grow your business or keep it as it is. Talk to
   the Ad Reviewer, Quality Inspector, and Sourcing Advisor for 3 short
   values-based scenarios — "The Misleading Ad," "Hiding a Problem," and
   "The Questionable Supplier" — each with no single "correct" choice,
   just real trade-offs between short-term gain and long-term trust.
   This completes all 26 of Entrepreneur Quest's real decision events.
   Back in Idea Lab, talk to the Startup Mentor to start the real
   website's own Build-Your-Business stepper — all 18 real BUILD stages
   in order, always resumable: say what problem you noticed and what
   your idea is, name your business and pick a logo (shape, color, and
   symbol, with a live preview), choose your product and customer
   categories, set how much it costs to make and what you'll charge,
   pick a marketing approach, then try the Business Simulator — split a
   starting amount across materials/packaging/advertising/savings and
   see exactly what you'd make, using the real website's own profit
   formula. 7 of the 18 stages (researching demand, testing your idea,
   marketing, handling competition, handling a customer problem,
   making a business decision, growing your business) reuse the exact
   same real decisions you may have already completed via their own
   zone NPCs above, so talking to the Startup Mentor never repeats a
   quest you've finished. Once every stage is done, you see your
   finished business as a read-only final pitch — name, logo, slogan,
   and every answer you gave, laid out exactly like the real website's
   own pitch page.
5. In Leadership Academy, walk up to Priya and interact with her to start
   "Meet Your Team" — a tap-tap matching mini-game: match each of 4 tasks
   to the teammate who's actually good at it (Nadia/Oren/Priya/Theo),
   then a short, no-wrong-answer reflection on how you're feeling about
   leading this team. Talk to Priya again to start her second quest,
   "The First Challenge" — another matching round, this time for the
   team's first real project. Talk to her a third time for "The Big
   Mistake" — ported directly from the website's real Leadership Quest
   content: Priya made a mistake and the team is watching to see how you,
   as the leader, respond. Again, no single correct answer. A second
   portal inside Leadership Academy leads to **Team Challenge**,
   Leadership Quest's second zone — talk to Theo to start "The Angry
   Customer": a customer is upset about your team's work, and you choose
   how to respond (one option even lets Priya, from the first zone, handle
   the call). A second portal inside Team Challenge leads to **Strategy
   Room**, Leadership Quest's third zone — talk to Nadia to start "The
   Better Idea": Nadia suggests a genuinely better way to do something
   you'd already planned, and you choose how to respond. A second
   portal inside Strategy Room leads to **Huddle Room**, Leadership
   Quest's fourth zone — talk to Oren to start "Everyone Has an Idea":
   Nadia and Oren can't agree on whose idea to use, and you decide how
   to settle it. Back in Team Challenge, talk to Theo again after
   finishing "The Angry Customer" to start his second quest, "The
   Missing Task": a teammate's part of the project isn't finished, and
   after hearing a few perspectives on what happened, you decide how to
   help. Talk to Theo a third time for "The Team Conflict" — a
   spot-the-problem mini-game: read a short exchange between Priya and
   Theo and flag the statements that are making things worse, then
   decide how to step in. Talk to Theo a fourth time for "The Deadline"
   — a budget-splitting mini-game: the deadline moved up, so you split
   the team's remaining 1000 minutes across 5 tasks using a +/- stepper,
   then decide how to share the new plan with the team. Back in
   Leadership Academy, talk to Priya a fourth time for "The Pressure
   Test" — a tap-select-then-tap-bucket sorting mini-game: sort 5
   problems happening at once into "Deal with first" / "Deal with next" /
   "Can wait," then reflect on how you handled the pressure. Back in
   Huddle Room, talk to Oren a second time for "The Motivation Problem" —
   another spot-the-problem round, this time spotting what's really
   draining the team's energy before deciding what to do about it. Back
   in Strategy Room, talk to Nadia a second time for "The Final
   Challenge" — Leadership Quest's capstone mission, combining a final
   matching round with two separate decision points as the team finishes
   its last big project together. This completes all 12 of Leadership
   Quest's real missions.
6. In Bubble Garden, there's nothing to do but walk around and watch the
   bubbles drift — no quest, no NPC, no choice. It's always reachable, with
   no unlock condition, and never framed as anything other than a calm
   place to visit. The same is true of all 7 other gardens reachable from
   inside it: fish circling in Aquarium Room, breathing lanterns in Light
   Room, falling raindrops in Rain Room, swaying kelp in Underwater Room,
   swaying tree canopies in Forest Walk, drifting note shapes in Music
   Room, and breathing flowers in Grow-a-Garden.
7. Walk to the portal in each zone to return to the Hub. Progress
   (completed quests, unlocked zones, skill tags, avatar choices) is saved
   to `user://progress.json` automatically.

### Controls

Three input paths all drive the same movement — no platform is a second-
class citizen:

- **Touch / mouse**: tap or click a point on the ground to walk there, tap
  an interactable to focus it, then use the bound `interact` action or the
  on-screen "Talk" button (bottom-right of the HUD) — it only appears once
  something is actually in range.
- **Keyboard**: WASD / arrow keys to move, `E` or Space to interact.
- **Gamepad**: left stick to move, face button 0 (e.g. Xbox A / PlayStation
  ✕) to interact.

Hold the right mouse button and move the mouse to rotate the desktop
camera; touch and gamepad players never need this.

## What this demonstrates (and what it deliberately doesn't yet)

See `docs/money-quest-world-architecture.md` Section 10 for the complete,
up-to-date table. In short:

| Built this phase | Not built yet (architecture-ready) |
|---|---|
| `WorldManager` + generalized `ZoneData` (`HUB`/`QUEST`/`LIBRARY`/`MUSEUM`/`MIND_LAB`/`CALM` kinds) | Library books / Museum exhibits / Mentors (zero real entries — nothing to invent yet) |
| `QuestData` + `QuestManager`, `LESSON` and `CHALLENGE` kinds (wraps existing `LessonData`, or runs a standalone situation+choice+consequence with optional multi-line intro dialogue, no content duplicated) | `BrowseZoneController` + a walkable Museum zone (no real content to drive one yet) |
| 3D `Player`/`NPC`/`Interaction`/`InteractionManager` + `CameraController` | Museum exhibits/zone, Mentors content |
| World Hub: fountain landmark, 7 paths, 7 gate-shaped portals (6 functional, 1 "coming soon"), decorative trees, Hub Guide NPC | Entrepreneur Quest's full BUILD → RUN → RESCUE & GROW track (only one representative quest is built) |
| Library zone (bookshelves + Librarian NPC, reachable from the Hub, honestly empty — see "Content fidelity" below) | Library books content |
| Mind Lab zone + "Different Explanations" quest (an original scenario — no external fact needed, never diagnostic/medical) | — |
| Golden Vault zone + Maya's quest (reuses the existing `LessonData`/`LessonManager`/mini-game/UI overlays unchanged) | — |
| Golden Vault's Savings Guide + "What Does Saving Mean?" quest (`explorer-saving-l1`, Golden Vault's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Golden Vault's Theo + "Saving vs. Spending: The Real Trade-off" quest (`strategist-saving-l1`, Golden Vault's third quest-giving NPC — completes the "saving" topic's full 3-age-band trilogy in one zone, no mini-game needed) | — |
| Market Town zone + Baker's quest (`explorer-needs_wants-l1`, reached via a portal inside Golden Vault — Money Quest's first 2-zone graph, no mini-game needed) | — |
| Market Town's Leah + "The Grey Area" quest (`builder-needs_wants-l1`, Market Town's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Market Town's Jordan + "Needs, Wants, and Social Pressure" quest (`strategist-needs_wants-l1`, Market Town's third quest-giving NPC, completing the "needs_wants" topic trilogy — no new zone needed, no mini-game needed) | — |
| Guardian Gate zone + Zara's quest (`builder-scams-l1`, "Spotting a Scam," reached via a portal inside Market Town — Money Quest's first 3-zone graph, no mini-game needed) | — |
| Guardian Gate's Grown-up + "Some Promises Are Too Good" quest (`explorer-scams-l1`, Guardian Gate's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Guardian Gate's Marcus + "Scams Target Emotions, Not Logic" quest (`strategist-scams-l1`, Guardian Gate's third quest-giving NPC, completing the "scams" topic trilogy — no new zone needed, no mini-game needed) | — |
| Sky Exchange zone + Sam's quest (`builder-currencies-l1`, "Cash, Cards, and Currencies," reached via a portal inside Guardian Gate — Money Quest's first 4-zone graph, no mini-game needed) | — |
| Sky Exchange's Omar + "How a Card Payment Actually Works" quest (`builder-digital_money-l1`, Sky Exchange's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Mei + "Owning a Small Piece of a Company" quest (`builder-investing_basics-l1`, Sky Exchange's third quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Tomasz + "Locked Until 18: How a Junior ISA Works" quest (`builder-junior_isa-l1`, Sky Exchange's fourth quest-giving NPC, completing all 4 real topics the zone hosts at the builder age band) | — |
| Sky Exchange's Visiting Friend + "Money Looks Different Everywhere" quest (`explorer-currencies-l1`, Sky Exchange's fifth quest-giving NPC, the first lesson to grow one of its 4 topics beyond builder — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Elena + "Understanding Exchange Rates" quest (`strategist-currencies-l1`, Sky Exchange's sixth quest-giving NPC, completing the "currencies" topic trilogy — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Mum + "Money You Can't Hold" quest (`explorer-digital_money-l1`, Sky Exchange's seventh quest-giving NPC, the first lesson to grow "digital_money" beyond builder — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Priya + "Staying Safe and Aware With Digital Money" quest (`strategist-digital_money-l1`, Sky Exchange's eighth quest-giving NPC, completing the "digital_money" topic trilogy — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Leo + "Saving vs Growing Your Money" quest (`explorer-investing_basics-l1`, Sky Exchange's ninth quest-giving NPC, the first lesson to grow "investing_basics" beyond builder — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Jamal + "Risk, Diversification, and Time" quest (`strategist-investing_basics-l1`, Sky Exchange's tenth quest-giving NPC, completing the "investing_basics" topic trilogy — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Freya + "A Special Savings Account Just for Kids (UK)" quest (`explorer-junior_isa-l1`, Sky Exchange's eleventh quest-giving NPC, the first lesson to grow "junior_isa" beyond builder — no new zone needed, no mini-game needed) | — |
| Sky Exchange's Aaliyah + "Junior ISAs: Ownership, Timing, and Changing Rules" quest (`strategist-junior_isa-l1`, Sky Exchange's twelfth and final quest-giving NPC, completing the "junior_isa" topic trilogy — no new zone needed, no mini-game needed) | **All 30 of Money Quest's real website curriculum lessons are now in the game** |
| Coin Cove zone + Shopkeeper's quest (`explorer-money_basics-l1`, "What Is Money?," reached via a portal inside Sky Exchange — Money Quest's first 5-zone graph, no mini-game needed) | — |
| Coin Cove's Amir + "Where Does Money Come From?" quest (`builder-money_basics-l1`, Coin Cove's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Coin Cove's Priya + "Money as a Tool, Not a Goal" quest (`strategist-money_basics-l1`, Coin Cove's third quest-giving NPC, completing the "money_basics" topic trilogy — no new zone needed, no mini-game needed) | — |
| Horizon Peaks zone + Finn's quest (`builder-long_term_thinking-l1`, "Planning a Few Steps Ahead," reached via a portal inside Coin Cove — Money Quest's first 6-zone graph, no mini-game needed) | — |
| Horizon Peaks' Aisha + "Big Decisions, Long Timelines" quest (`strategist-long_term_thinking-l1`, Horizon Peaks' second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Horizon Peaks' Sticker Keeper + "Waiting Can Pay Off" quest (`explorer-long_term_thinking-l1`, Horizon Peaks' third quest-giving NPC, completing the "long_term_thinking" topic trilogy — no new zone needed, no mini-game needed) | — |
| Kindness Grove zone + Omar's quest (`builder-giving-l1`, "Giving on Purpose," reached via a portal inside Horizon Peaks — Money Quest's 7th and final zone, no mini-game needed) | — |
| Kindness Grove's Friend + "The Joy of Sharing" quest (`explorer-giving-l1`, Kindness Grove's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Kindness Grove's Sofia + "Giving Thoughtfully" quest (`strategist-giving-l1`, Kindness Grove's third quest-giving NPC, completing the "giving" topic trilogy — no new zone needed, no mini-game needed) | — |
| Idea Lab zone + "Handle Competition" quest (ports the website's real `competitor-lower-price` decision event) | — |
| Marketing Studio zone + "Create Your Marketing" quest (ports the real `product-unclear` decision event, reached via a portal inside Idea Lab) | Entrepreneur Quest's `reflect-text`-kind stages (need a free-text input UI not built yet) |
| Workshop zone + "Handle a Customer Problem" quest (ports the real `too-expensive-feedback` decision event, reached via a portal inside Marketing Studio — Entrepreneur Quest's first 3-zone graph) | — |
| Workshop's Supplier + "Rising Material Costs" quest (ports the real `materials-cost-increase` decision event, Workshop's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Office zone + "Make a Business Decision" quest (ports the real `more-orders-than-expected` decision event, reached via a portal inside Workshop — Entrepreneur Quest's first 4-zone graph) | — |
| Office's Teammate + "A Teammate's Idea" quest (ports the real `teammate-wants-change` decision event, Office's second quest-giving NPC — no new zone needed, no mini-game needed) | — |
| Growth Lab zone + "Grow Your Business" quest (ports the real `fewer-sales-than-expected` decision event, reached via a portal inside Office — Entrepreneur Quest's first 5-zone graph) | — |
| Research Lab zone + "Research Demand"/"Test the Idea" quests (ports the real `market-detective-reflection`/`test-before-invest` decision events, reached via a portal inside Growth Lab — Entrepreneur Quest's first 6-zone graph; completes all 9 of Entrepreneur Quest's v1 decision events) | — |
| Main Street zone + "Not Enough Customers" quest (ports the real `not-enough-customers` Business Problem, reached via a portal inside Research Lab — Entrepreneur Quest's first 7-zone graph; introduced `QuestData.diagnosis_choice` for the investigate-cause-respond shape) | — |
| Main Street's Accountant + "Costs Increased" quest (ports the real `costs-increased` Business Problem, Main Street's second quest-giving NPC — no new zone needed, reuses `diagnosis_choice`) | — |
| Main Street's Support Rep + "A Negative Review" quest (ports the real `negative-review` Business Problem, Main Street's third quest-giving NPC — no new zone needed, reuses `diagnosis_choice`) | — |
| Main Street's Sales Tracker / Profit Analyst / Cash Flow Advisor / Warehouse Keeper + their 4 quests (ports the real `sales-falling`/`rising-costs-eating-profit`/`profit-but-no-cash`/`too-much-stock` Business Problems, Main Street's fourth through seventh quest-giving NPCs — completes all 7 of the v2 Business Problems library) | — |
| Supply Yard zone (4 NPCs: Pricing Tester, Supplier Scout, Stock Keeper, Bookkeeper — ports `pricing-experiment-reflection`/`choose-a-supplier`/`stock-management-scenario`/`cash-flow-decision` verbatim, reached via a second portal inside Main Street) | AI Quest Coach (explicitly not built — see the architecture doc's non-negotiables) |
| AI Workshop zone (1 NPC: Tech Advisor — ports `ai-wrong-answer` verbatim, keeping the real site's own "Simulated AI Assistant (not real AI)" framing, reached via a portal inside Supply Yard) | — |
| Turning Point zone (5 NPCs: Business Advisor, Growth Coach, Ad Reviewer, Quality Inspector, Sourcing Advisor — ports `business-pivot`/`grow-or-stay-small`/`misleading-ad`/`hiding-a-problem`/`cheap-questionable-supplier` verbatim, reached via a portal inside AI Workshop); **completes all 26 of Entrepreneur Quest's real decision events** | — |
| `BusinessProfileData`/`BusinessLogoData` + `BusinessBuilder` autoload + 6 new UI panels (`TextInputPanel`, `LogoBuilderPanel`, `CategoryPickerPanel`, `NumericInputPanel`, `SimulatorPanel`, `PitchDisplayPanel`) — ports all 18 real BUILD stages, launched/resumed via Idea Lab's new Startup Mentor NPC; the Business Simulator uses the real site's exact `runSimulator()` formula verbatim; **completes Entrepreneur Quest's full real BUILD → RUN → RESCUE & GROW track end to end** | The 5 standalone Business Challenges, the RUN/Rescue & Grow hub pages, and the separate Business Rescue scenario |
| Team Challenge zone + "The Angry Customer" quest (ports the real `angry-customer-choice` decision event, reached via a portal inside Leadership Academy, with Theo as a real-character NPC) | — |
| Strategy Room zone + "The Better Idea" quest (ports the real `better-idea-choice` decision event, reached via a portal inside Team Challenge — Leadership Quest's first 3-zone graph, with Nadia as a real-character NPC) | — |
| Huddle Room zone + "Everyone Has an Idea" quest (ports the real `everyone-has-an-idea-choice` decision event, reached via a portal inside Strategy Room — Leadership Quest's first 4-zone graph, with Oren as the giver NPC — the 4th and last of the real 4-character cast) | — |
| Team Challenge's Theo + "The Missing Task" quest (Theo's second quest, ports the real `missing-task-choice` decision event — no new zone or NPC needed; completes every `mission-choice`-shaped Leadership Quest mission) | — |
| `MATCH`/`SPOT`/`ALLOCATE`/`SORT`/`MULTI_STEP` quest kinds + `MatchPanel`/`SpotPanel`/`AllocatePanel`/`SortPanel` autoloads, each porting the real website's own mini-game component (`src/game-engine/mechanics/{Match,Spot,Allocate,Sort}Mechanic.tsx`) faithfully — tap-tap matching, toggle-select-then-submit, a fixed-step +/- stepper, and tap-select-then-tap-bucket sorting, all retry-until-correct, never drag | — |
| Priya's "Meet Your Team"/"First Challenge" quests (`MATCH`-kind) and "The Pressure Test" (`SORT`-kind) — her 1st, 2nd, and 4th quests in Leadership Academy | — |
| Theo's "The Team Conflict" (`SPOT`-kind) and "The Deadline" (`ALLOCATE`-kind) quests — his 3rd and 4th quests in Team Challenge | — |
| Nadia's "The Final Challenge" (`MULTI_STEP`-kind: a matching round + 2 decision points) — her 2nd and final quest in Strategy Room | — |
| Oren's "The Motivation Problem" (`SPOT`-kind) — his 2nd quest in Huddle Room; **completes all 12 of Leadership Quest's real missions** | Leadership Quest's Leadership Lab, Leadership Profile, and "uh-oh" unexpected events (website-only features with no Godot equivalent yet) |
| `EntryData`/`BookData`/`ExhibitData`/`MentorData`/`DictionaryTermData` schema, with 2 real Dictionary entries (`goal`, `trade-off`) reusing existing curriculum vocabulary | — |
| Calm World's all 8 named gardens (Bubble Garden, Aquarium Room, Light Room, Rain Room, Underwater Room, Forest Walk, Music Room, Grow-a-Garden) — always unlocked, no choices, all motion respects `reduced_motion` | — |
| `AvatarConfig` + `AvatarCreation.tscn`, now fully wired to `Player.tscn` (see "Avatar wiring fix" below) — 4 body presets incl. a wheelchair-style look, 4 accessories (glasses, cap, hearing aid, cane), all purely visual | — |
| Zone/quest/skill/avatar progression fields in `ProgressManager`, persisted by `SaveManager` | — |
| 4 real `AudioServer` buses (Music/SFX/Voice/Ambient) + `SettingsMenu.tscn` (reduced-motion toggle + 4 volume sliders), reachable from `MainMenu` and the in-world HUD — see "Audio + Settings screen fix" below | Read-aloud/text-to-speech (`AudioManager.speak()` is a documented no-op — no TTS engine exists, so no toggle is shown for it) |
| HUD "Talk" button, shown only when something is in interaction range | — |

## Content fidelity

Every piece of curriculum text in Maya's quest — the story, the vocabulary
(`goal`, `trade-off`), the quiz question/options/explanation, the feedback
lines, the reward message — is copied directly from the real
`messages/en.json` (`curriculum.builder-saving-l1`) and `messages/ro.json`
in the website repo, not invented for this project.

The Savings Guide's quest, also in Golden Vault, is the same: every
curriculum field (story, vocabulary `save`/`later`, quiz, feedback,
reward) is copied from the real `curriculum.explorer-saving-l1` — the
explorer-age-band version of the same "saving" topic Maya's builder-age-band
quest already covers. The only original text is the intro framing and
the choice/consequence wording turning "spend today vs. save for later"
into a concrete one-coin decision, the same discipline as every other
ported lesson.

Theo's quest, the third in Golden Vault, completes the "saving" topic's
full 3-age-band trilogy the same way: every curriculum field (story,
vocabulary `interest`/`long-term`/`opportunity cost`, quiz, feedback,
reward) is copied from the real `curriculum.strategist-saving-l1`. Theo
is the real teenager named in that lesson's own story — a coincidental
reuse of the same name already used for Team Challenge's NPC in
Leadership Quest, since each is drawn verbatim from its own real,
independent source text, not the same character appearing in two tracks.

The Baker's quest in Market Town is the same: every curriculum field
(story, vocabulary `need`/`want`, quiz, feedback, reward) is copied from
the real `curriculum.explorer-needs_wants-l1`. The only original text is
the Baker's own one-line transition ("I've got fresh bread and a giant
chocolate bar right here...") and the choice/consequence wording applying
that lesson's real need-vs-want distinction to a concrete decision —
exactly the brief's own "find the correct game mechanic for the concept"
instruction, not a rewrite of the lesson's meaning.

Leah's quest in Market Town is the same: every curriculum field (title,
learning objective, key concept, vocabulary `situation`/`essential`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.builder-needs_wants-l1`. Leah is the real child named in
that lesson's own story, and the only original text is the intro
framing and the choice/consequence wording applying the lesson's real
"it depends on the situation" concept to a concrete decision (borrow a
calculator vs. buy a simple replacement) — both equally valid ways to
meet a genuine need.

Jordan's quest in Market Town is the same: every curriculum field
(title, learning objective, key concept, vocabulary `advertising`/
`social pressure`/`urgency`, explanation, quiz, feedback, reward
message) is copied from the real `curriculum.strategist-needs_wants-l1`.
Jordan is the real teen named in that lesson's own story (they/them in
the real source text, preserved as-is), and the only original text is
the intro framing and the choice/consequence wording applying the
lesson's real "advertising makes wants feel urgent" concept to a
concrete decision (name the feeling the ad creates vs. ask a friend for
a reality check) — both equally valid ways to see past the persuasion
technique, completing the "needs_wants" topic trilogy.

Zara's quest in Guardian Gate is the same: every curriculum field (title,
learning objective, key concept, vocabulary `scam`/`urgency`/`personal
information`, explanation, quiz, feedback, reward message) is copied from
the real `curriculum.builder-scams-l1`. Zara herself is the real child
named in that lesson's own story (not invented for this project), and the
only original text is the intro framing and the choice/consequence
wording applying the lesson's real urgency-is-a-red-flag concept to a
concrete decision (enter a password right away vs. pause and check with a
trusted adult) — the same "find the correct game mechanic for the
concept" instruction as Market Town.

Grown-up's quest in Guardian Gate is the same: every curriculum field
(title, learning objective, key concept, vocabulary `trick`/`stranger`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.explorer-scams-l1`. The real lesson's story has no named
child (it's written in second person, "you," with the second character
simply "a grown-up nearby"), so the giver NPC uses that role as its
generic name, the same convention Market Town's Baker established. Since
the real quiz already tests the lesson's core "tell a grown-up, don't
click" fact directly, the only original text — the intro framing and the
choice/consequence wording — applies that same fact to a downstream
decision (close the pop-up right away vs. show it to another grown-up
too) rather than whether to click at all, so the player's choice can
never contradict the quiz's fixed correct answer.

Marcus's quest in Guardian Gate is the same: every curriculum field
(title, learning objective, key concept, vocabulary `emotional
manipulation`/`too good to be true`/`verification`, explanation, quiz,
feedback, reward message) is copied from the real
`curriculum.strategist-scams-l1`. Marcus is the real teen named in that
lesson's own story, and this completes the "scams" topic's full
3-age-band trilogy (Zara, Grown-up, Marcus) in one zone. Unlike the
other two "scams" lessons, this one's quiz tests a conceptual mechanism
(scams trigger a strong feeling to bypass careful thinking) rather than
a specific action, so the only original text — the intro framing and
the choice/consequence wording — is free to mirror the lesson's own
recommended pause-and-verify habit directly (contact the real friend
directly vs. check independently whether "guaranteed returns" are ever
real) without any risk of contradicting the quiz.

Sam's quest in Sky Exchange is the same: every curriculum field (title,
learning objective, key concept, vocabulary `currency`/`physical
money`/`digital money`, explanation, quiz, feedback, reward message) is
copied from the real `curriculum.builder-currencies-l1`. Sam is the real
child named in that lesson's own story, and the only original text is
the intro framing and the choice/consequence wording applying the
lesson's real "money from home doesn't work abroad" concept to a
concrete decision (bring the same money vs. exchange it first).

Omar's quest in Sky Exchange is the same: every curriculum field (title,
learning objective, key concept, vocabulary `contactless payment`/`PIN`/
`payment confirmation`, explanation, quiz, feedback, reward message) is
copied from the real `curriculum.builder-digital_money-l1`. Omar is the
real child named in that lesson's own story, and the only original text
is the intro framing and the choice/consequence wording applying the
lesson's real "a payment confirmation is proof it genuinely happened"
concept to a concrete decision (watch the screen for the tick vs. ask the
cashier directly) — both equally valid ways to confirm a payment, with
the quiz (not the choice) carrying the lesson's actual testable fact.

Mei's quest in Sky Exchange is the same: every curriculum field (title,
learning objective, key concept, vocabulary `share`/`stock`/`company`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.builder-investing_basics-l1`. Mei is the real child named in
that lesson's own story (her uncle owns the shares), and the only
original text is the intro framing and the choice/consequence wording
applying the lesson's real "share prices reflect how people think a
company is doing" concept to a concrete decision (ask Uncle to explain
vs. work it out herself by watching the toy's popularity) — both
equally valid, neither graded as "wrong."

Tomasz's quest in Sky Exchange is the same: every curriculum field (title,
learning objective, key concept, vocabulary `cash Junior ISA`/
`stocks-and-shares Junior ISA`/`locked until 18`, explanation, quiz,
feedback, reward message) is copied from the real
`curriculum.builder-junior_isa-l1`. Tomasz is the real child named in that
lesson's own story, and the only original text is the intro framing and
the choice/consequence wording applying the lesson's real "cash vs.
stocks-and-shares, locked until 18" facts to a concrete decision (ask Dad
to explain vs. work it out himself from the account statement) — again
both equally valid, with the quiz carrying the lesson's actual testable
fact. This completes all 4 real website topics Sky Exchange hosts at
the builder age band.

Visiting Friend's quest in Sky Exchange is the same: every curriculum
field (title, learning objective, key concept, vocabulary
`country`/`different`, explanation, quiz, feedback, reward message) is
copied from the real `curriculum.explorer-currencies-l1`. The real
lesson's story has no named child (it's written in second person,
"you," with the second character simply "a friend"), so the giver NPC
uses that role as its generic name - named "Visiting Friend" rather
than plain "Friend" to avoid reusing Kindness Grove's existing `friend`
npc_id, even though that reuse would be harmless (quest completion keys
off `quest_id`, not `npc_id`, and the two zones are never loaded
simultaneously). The only original text is the intro framing and the
choice/consequence wording applying the lesson's real "every country
makes its own money" concept to a concrete decision (compare the two
coins side by side vs. ask whether other countries' money looks
different too) - both equally valid ways to explore the same fact. This
is the first lesson to grow one of Sky Exchange's 4 topics beyond its
builder age band.

Elena's quest in Sky Exchange is the same: every curriculum field
(title, learning objective, key concept, vocabulary `exchange
rate`/`conversion`/`fluctuate`, explanation, quiz, feedback, reward
message) is copied from the real `curriculum.strategist-currencies-l1`.
Elena is the real teen named in that lesson's own story, and this
completes the "currencies" topic's full 3-age-band trilogy (Sam,
Visiting Friend, Elena) in one zone. Like Marcus's scams lesson, this
one's quiz tests a conceptual fact (exchange rates change over time)
rather than a specific action, so the only original text - the intro
framing and the choice/consequence wording - is free to mirror the
lesson's own recommended habit directly (look up today's rate vs.
compare rates across a few providers) without any risk of contradicting
the quiz.

Mum's quest in Sky Exchange is the same: every curriculum field (title,
learning objective, key concept, vocabulary `digital money`/`card`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.explorer-digital_money-l1`. The real lesson's story has no
named child (it's written in second person, "you," with the secondary
character simply "Mum" tapping her card), so the giver NPC uses that
role as its generic name, matching the real story's own wording. The
quiz tests a specific identification task (which of these is digital
money), so the only original text - the intro framing and the
choice/consequence wording - is a downstream decision (ask where the
money went vs. watch closely next time) rather than re-asking the same
classification, keeping it safely clear of contradicting the fixed
answer. This is the first lesson to grow "digital_money" beyond its
builder age band.

Priya's quest in Sky Exchange is the same: every curriculum field
(title, learning objective, key concept, vocabulary `digital
wallet`/`payment confirmation`/`phishing message`, explanation, quiz,
feedback, reward message) is copied from the real
`curriculum.strategist-digital_money-l1`. Priya is the real teen named
in that lesson's own story - her name coincidentally matches Coin
Cove's Priya (an unrelated real character from a different real source
text), harmless for the same reason as the earlier Theo/Omar
collisions (quest completion keys off `quest_id`, not `npc_id`, and the
two zones are never loaded simultaneously) - and this completes the
"digital_money" topic's full 3-age-band trilogy (Omar, Mum, Priya) in
one zone. The quiz tests a conceptual fact (digital payments lack a
felt physical action), so the only original text - the intro framing
and the choice/consequence wording - is free to mirror the lesson's own
recommended habits directly (review the wallet history weekly vs. check
each payment confirmation) without any risk of contradicting it.

Leo's quest in Sky Exchange is the same: every curriculum field (title,
learning objective, key concept, vocabulary `saving`/`investing`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.explorer-investing_basics-l1`. Leo is the real child named
in that lesson's own story; his sister explains investing but is
unnamed in the source. The quiz asks for a specific classification
(what's different about investing), so the only original text - the
intro framing and the choice/consequence wording - is a downstream
decision (ask for another example vs. decide saving is still right for
him) rather than re-testing the same classification. This is the first
lesson to grow "investing_basics" beyond its builder age band.

Jamal's quest in Sky Exchange is the same: every curriculum field
(title, learning objective, key concept, vocabulary `risk and
reward`/`diversification`/`compound growth`, explanation, quiz,
feedback, reward message) is copied from the real
`curriculum.strategist-investing_basics-l1`. Jamal is the real teen
named in that lesson's own story; his cousin, who explains
diversification, is unnamed in the source - and this completes the
"investing_basics" topic's full 3-age-band trilogy (Mei, Leo, Jamal) in
one zone. Unlike Leo's lesson, this one's real quiz tests a separate
conceptual fact (investing vs. gambling) rather than which allocation
Jamal picks, so the only original text - the intro framing and the
choice/consequence wording - is free to mirror the lesson's own real
decision directly (put it all in one company vs. spread it across
several), with neither option graded.

Freya's quest in Sky Exchange is the same: every curriculum field
(title, learning objective, key concept, vocabulary `Junior
ISA`/`UK`, explanation, quiz, feedback, reward message) is copied from
the real `curriculum.explorer-junior_isa-l1`. Freya is the real child
named in that lesson's own story. The quiz asks a specific ownership
question (whose money is it), so the only original text - the intro
framing and the choice/consequence wording - is a downstream decision
(ask Grandma why vs. ask Mum when she can use it) rather than
re-testing the same ownership fact. This is the first lesson to grow
"junior_isa" beyond its builder age band - the last Money Quest topic
to remain untouched at every age band until now.

Aaliyah's quest in Sky Exchange is the same: every curriculum field
(title, learning objective, key concept, vocabulary `ISA`/`tax
year`/`annual allowance`, explanation, quiz, feedback, reward message)
is copied from the real `curriculum.strategist-junior_isa-l1`. Aaliyah
is the real teen named in that lesson's own story, and this completes
the "junior_isa" topic's full 3-age-band trilogy (Tomasz, Freya,
Aaliyah) in one zone - the 10th and final single-topic zone/topic to
reach all 3 age bands. The quiz tests a conceptual fact (the £9,000
figure is current, not permanent), so the only original text - the
intro framing and the choice/consequence wording - is free to mirror
the lesson's own recommended habit directly (check an official source
vs. ask parents what changed before) without any risk of contradicting
it.

**With Aaliyah's quest, all 30 of Money Quest's real website curriculum
lessons are now ported into the game**, across all 7 real zones and
all 10 real topics at all 3 real age bands - every single one copying
its title, learning objective, key concept, vocabulary, explanation,
quiz, feedback, and reward message verbatim from the real website,
with only the intro framing and choice/consequence wording original to
this port, and every giver NPC either a real named character from that
lesson's own story or (when the source has none) a consistent generic
role name.

The Shopkeeper's quest in Coin Cove is the same: every curriculum field
(title, learning objective, key concept, vocabulary `money`/`trade`/
`value`, explanation, quiz, feedback, reward message) is copied from the
real `curriculum.explorer-money_basics-l1`. This lesson's own story has
no named child (it's written in second person, "you"), so unlike every
other NPC so far the giver here is not a real named character — it uses
the same generic-role-name convention Market Town's Baker established
rather than inventing a name the source material doesn't have. The only
original text is the intro framing and the choice/consequence wording
applying the lesson's real "money is traded for a value both sides agree
on" concept to a concrete decision (count out the exact coins vs. hand
over a handful and let the Shopkeeper take what's needed) — both equally
valid, with the quiz carrying the lesson's actual testable fact.

Amir's quest in Coin Cove is the same: every curriculum field (title,
learning objective, key concept, vocabulary `earn`/`digital money`/
`balance`, explanation, quiz, feedback, reward message) is copied from
the real `curriculum.builder-money_basics-l1`. Amir is the real child
named in that lesson's own story, and the only original text is the
intro framing and the choice/consequence wording applying the lesson's
real "money is earned through work, in physical or digital form" concept
to a concrete decision (do a chore vs. sell something he made) — both
equally valid ways to earn money, neither graded as "wrong."

Priya's quest in Coin Cove is the same: every curriculum field (title,
learning objective, key concept, vocabulary `currency`/`trust`/`system`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.strategist-money_basics-l1`. Priya is the real child named
in that lesson's own story — her name coincidentally matches Leadership
Academy's Priya (an unrelated real character from a different real
source text), which is harmless for the same reason the earlier Theo
coincidence was: quest-completion state keys off `quest_id`, not
`npc_id`, and the two zones are never loaded at once. The only original
text is the intro framing and the choice/consequence wording applying
the lesson's real "money only works within its own trusted system"
concept to a concrete decision (keep the foreign note as a souvenir vs.
help find a currency exchange) — both equally valid.

Finn's quest in Horizon Peaks is the same: every curriculum field (title,
learning objective, key concept, vocabulary `plan ahead`/`outcome`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.builder-long_term_thinking-l1`. Finn is the real child named
in that lesson's own story, and the only original text is the intro
framing and the choice/consequence wording applying the lesson's real
"picture the outcome before deciding" concept to a concrete decision
(write it down vs. ask a grown-up for help picturing both futures) —
both equally valid ways to think ahead, with the quiz carrying the
lesson's actual testable fact.

Aisha's quest in Horizon Peaks is the same: every curriculum field
(title, learning objective, key concept, vocabulary `long-term
consequence`/`deliberate decision`/`by default`, explanation, quiz,
feedback, reward message) is copied from the real
`curriculum.strategist-long_term_thinking-l1`. Aisha is the real teen
named in that lesson's own story. Unlike every other choice_point built
so far, this lesson's own text explicitly says there's no single right
answer to the real decision it poses (spend a paycheck now vs. save
some for later), so for once the choice_point directly mirrors that
real decision rather than using a sidestep scenario — safe to do here
specifically because the quiz tests the separate concept of
deliberateness, not which option Aisha picked, so there's no risk of
the choice contradicting the quiz's correct answer.

The Sticker Keeper's quest in Horizon Peaks is the same: every
curriculum field (title, learning objective, key concept, vocabulary
`wait`/`patient`, explanation, quiz, feedback, reward message) is
copied from the real `curriculum.explorer-long_term_thinking-l1`. This
lesson's own story has no named child (it's written in second person,
"you"), so this NPC uses the same generic-role-name convention Market
Town's Baker established. The only original text is the intro framing
and the choice/consequence wording applying the lesson's real "waiting
a little can get you more" concept to a concrete decision (keep busy
vs. count down the hours while waiting) — both lead to the real story's
own outcome (three stickers the next day), so the fixed quiz about what
happened is never contradicted by the player's choice.

Omar's quest in Kindness Grove is the same: every curriculum field
(title, learning objective, key concept, vocabulary `set aside`/`cause`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.builder-giving-l1`. Omar is the real child named in that
lesson's own story — his name coincidentally matches Sky Exchange's
Omar (an unrelated real character from a different real source text),
harmless for the same reason the earlier Theo and Priya coincidences
were. The only original text is the intro framing and the
choice/consequence wording applying the lesson's real "plan for giving
ahead of time" concept to a concrete decision (give to a friend vs. the
class fundraiser) — both equally valid, neither graded as "wrong."

Friend's quest in Kindness Grove is the same: every curriculum field
(title, learning objective, key concept, vocabulary `give`/`share`,
explanation, quiz, feedback, reward message) is copied from the real
`curriculum.explorer-giving-l1`. This lesson's own story has no named
child (second person "you" sharing with "your friend"), so this NPC
uses that role as its generic name, the same convention Market Town's
Baker established. Because the real story's fixed outcome (sharing a
coin so both can play) is exactly what the curriculum's own quiz tests,
the choice_point here is deliberately a downstream decision (who goes
first) rather than whether to share at all — the same safeguard used
for the Sticker Keeper's lesson in Horizon Peaks, so the player's
choice can never contradict the fixed quiz.

Sofia's quest in Kindness Grove is the same: every curriculum field
(title, learning objective, key concept, vocabulary `impact`/`research`/
`transparency`, explanation, quiz, feedback, reward message) is copied
from the real `curriculum.strategist-giving-l1`. Sofia is the real teen
named in that lesson's own story. The only original text is the intro
framing and the choice/consequence wording applying the lesson's real
"research a cause before giving" concept to a concrete decision (read
the organization's own report vs. ask a volunteer directly) — both
equally valid research methods, with the quiz carrying the lesson's
actual testable fact. This completes the "giving" topic trilogy, the
4th and final single-topic zone (after Golden Vault, Coin Cove, and
Horizon Peaks) to reach all 3 age bands.

Idea Lab's "Handle Competition" quest is likewise copied directly from the
real `messages/en.json`/`messages/ro.json` (`entrepreneurQuest.decisionEvents
.competitor-lower-price` and its `build.handle-competition` title/intro) —
the situation, all 3 choices, and all 3 consequences are the website's own
words, not invented for this project.

Marketing Studio's "Create Your Marketing" quest is the same: the
situation, all 3 choices, and all 3 consequences are copied verbatim from
`entrepreneurQuest.decisionEvents.product-unclear` and
`build.create-your-marketing`'s title/learnText.

Workshop's "Handle a Customer Problem" quest is the same: the situation,
all 3 choices, and all 3 consequences are copied verbatim from
`entrepreneurQuest.decisionEvents.too-expensive-feedback` and
`build.handle-a-customer-problem`'s title/learnText.

Workshop's Supplier gives "Rising Material Costs," ported the same way:
the situation, all 3 choices, and all 3 consequences are copied verbatim
from `entrepreneurQuest.decisionEvents.materials-cost-increase` - the
sibling decision event to `too-expensive-feedback` under the same real
`build.handle-a-customer-problem` stage. Since the real decision event
has no secondary character at all (it's framed in second person, as
the player's own business), "Supplier" is an invented mentor-role name
tied to the scenario's subject, the same convention every Entrepreneur
Quest giver NPC has used so far (none of the website's BUILD-stage
decisions name anyone) - only the quest's title, description, and intro
framing are original.

Office's "Make a Business Decision" quest is the same: the situation,
all 3 choices, and all 3 consequences are copied verbatim from
`entrepreneurQuest.decisionEvents.more-orders-than-expected`. Since this
is the first quest built under the real `build.make-a-business-decision`
stage, the quest's title and intro framing also reuse that stage's own
title/learnText verbatim ("Make a Business Decision" / "Good business
owners think through their choices instead of just guessing.") - the
same convention Idea Lab's and Marketing Studio's first-quest intros
used - only the quest's description and reward message are original.
Office's Teammate gives "A Teammate's Idea," ported the same way: the
situation, all 3 choices, and all 3 consequences are copied verbatim
from `entrepreneurQuest.decisionEvents.teammate-wants-change` - the
sibling decision event to `more-orders-than-expected` under the same
real `build.make-a-business-decision` stage. Since the Office Guide's
quest already used that stage's real title/learnText, "Teammate"'s
quest uses original title/description/intro/reward-message framing
instead - the same convention Workshop's Supplier established. Like
every Entrepreneur Quest giver NPC so far, "Teammate" is an invented
mentor-role name, matching the real decision text's own wording
("someone helping with your business," "your teammate").

Growth Lab's "Grow Your Business" quest is the same: the situation,
all 3 choices, and all 3 consequences are copied verbatim from
`entrepreneurQuest.decisionEvents.fewer-sales-than-expected`. This is
the only quest built under the real `build.grow-your-business` stage
(the real site itself has just one decision event here), so the
quest's title and intro also reuse that stage's own title/learnText
verbatim ("Grow Your Business" / "Sometimes things don't go as
planned. Growing a business often means trying again with something
new.") - only the description and reward message are original.

Research Lab's "Research Demand" quest ports the real
`market-detective-reflection` decision event - the situation, all 3
choices, and all 3 consequences are copied verbatim. The real website
version shows a market-data table (the fixed "Fresh Trout" scenario:
300 interested customers, 75 recent buyers, 4 competitors) above the
reflection question; Godot has no table UI, so the Research Guide
instead speaks those same real numbers as spoken dialogue lines, in
the same order and with the same values, right before the identical
real question and choices. This is a presentation-shape adaptation
only - every number and every word of the decision itself is the
website's real content, nothing invented. Research Lab's second
resident, the Test Guide, gives "Test the Idea," porting the real
`test-before-invest` decision event verbatim (a simple 2-choice
decision with no table dependency). Both quests are the only quest
under their real stage, so both reuse that stage's own title/learnText
verbatim for their title and intro.

Main Street's "Not Enough Customers" quest ports the real
`not-enough-customers` Business Problem - the situation, all 3 clues,
all 3 causes' labels and feedback, all 3 responses' labels and
consequences are copied verbatim. This is a richer real shape than any
earlier CHALLENGE quest: investigate clues, identify a likely cause
(reflective - no reward either way), then choose a response (the real,
rewarded decision). Rather than inventing a new mechanic, this added
one small field to `QuestData` (`diagnosis_choice`, see
`data/schemas/QUEST_DATA_FORMAT.md`) that reuses the exact same
`DialogueChoice`/`ChoicePanel` pipeline every other decision already
uses. The clues are spoken as `intro_dialogue` lines, also already
existing infrastructure. Even the shared UI prompts are the real
site's own words, copied verbatim: "What's the likely cause?" and
"Real businesses run into problems. Investigate each one using the
data, then decide how to respond." - both now reused by this quest and
ready for every future Business Problem quest to reuse too.

Main Street's Accountant gives "Costs Increased," ported the same way:
the situation, all 3 clues, all 3 causes' labels and feedback, and all
3 responses' labels and consequences are copied verbatim from the real
`costs-increased` Business Problem. This is Main Street's second
quest-giving NPC - the same "zone grows another resident" pattern every
other Entrepreneur Quest zone has used - and it reuses `diagnosis_choice`
exactly as the Shop Manager's quest does, no new fields or systems
needed a second time.

Main Street's Support Rep gives "A Negative Review," ported the same
way: the situation, all 3 clues, all 3 causes' labels and feedback,
and all 3 responses' labels and consequences are copied verbatim from
the real `negative-review` Business Problem. Main Street's third
quest-giving NPC, again reusing `diagnosis_choice` exactly as-is.

Main Street's remaining four residents - Sales Tracker, Profit
Analyst, Cash Flow Advisor, and Warehouse Keeper - complete the real
v2 Business Problems library: "Sales Are Falling" (`sales-falling`),
"Why Aren't We Making Money?" (`rising-costs-eating-profit`), "Profit
But No Cash" (`profit-but-no-cash`), and "Too Much Unsold Stock"
(`too-much-stock`). Each is ported exactly the same way - situation,
3 clues, 3 causes' labels/feedback, and 3 responses' labels/
consequences all copied verbatim from the real website - and each
reuses `diagnosis_choice`/`challenge_choice` as-is, with zero changes
to `QuestData` or `QuestManager`. This completes all 7 of Entrepreneur
Quest's v2 Business Problems; Main Street is now Entrepreneur Quest's
largest zone, with 7 quest-giving NPCs.

Leadership Academy's "The Big Mistake" quest is likewise copied directly
from the real `messages/en.json`/`messages/ro.json`
(`leadershipQuest.missions.big-mistake`, including its `priya`/`oren`
intro dialogue and all 4 choices/consequences for the `big-mistake-choice`
event) — Priya and Oren are two of Leadership Quest's 4 real, already-named
characters (`src/content/leadership-quest/structures.ts`), not invented
for this project.

Team Challenge's "The Angry Customer" quest is the same: Theo's intro line
and all 4 choices/consequences for `angry-customer-choice` are copied
verbatim from `leadershipQuest.missions.angry-customer` — including one
option that references Priya by name, exactly as the website's own
content does, reinforcing that Leadership Academy and Team Challenge are
one team's story, not two disconnected casts.

Strategy Room's "The Better Idea" quest is the same: Nadia's intro line
and all 4 choices/consequences for `better-idea-choice` are copied
verbatim from `leadershipQuest.missions.better-idea` — Nadia is the third
of Leadership Quest's 4 real, already-named characters to appear in
Godot, same cast as Priya and Theo, not a new invented character.

Huddle Room's "Everyone Has an Idea" quest is the same: both Nadia's and
Oren's intro lines and all 4 choices/consequences for
`everyone-has-an-idea-choice` are copied verbatim from
`leadershipQuest.missions.everyone-has-an-idea` - Oren is the 4th and
last of Leadership Quest's 4 real characters, completing the cast every
other LQ quest has drawn from.

Team Challenge's "The Missing Task" quest - Theo's second quest - is
the same: both Theo's and Priya's intro lines, the 3 "investigate"
clue texts (shown as narrator-style `intro_dialogue` lines, since the
real site's tap-to-reveal clues have no UI equivalent in Godot - the
same adaptation Entrepreneur Quest's Business Problems already used),
and all 4 choices/consequences for `missing-task-choice` are copied
verbatim from `leadershipQuest.missions.missing-task`. Since all 4 of
Leadership Quest's real characters already have their own zone by this
point, this is the first "one NPC gives a second quest" case rather
than inventing a new character - `TeamChallenge.gd` offers Theo's next
incomplete quest in a fixed order. This completes every
`mission-choice`-shaped Leadership Quest mission (5 of 12 total).

Leadership Quest's remaining 7 missions needed mechanics Godot didn't
have yet — matching, spot-the-problem, budget-splitting, and sorting —
so each was built by reading the real website's own mechanic component
first (`src/game-engine/mechanics/{Match,Spot,Allocate,Sort}Mechanic.tsx`)
and porting its exact interaction model, not inventing a new one.
"Meet Your Team" and "The First Challenge" (Priya's 1st and 2nd quests)
copy their dialogue, task labels, and task-to-character pairings
verbatim from `leadershipQuest.missions.meet-your-team`/`first-challenge`
and `LQ_MISSIONS[0].matchPairs`/`LQ_MISSIONS[1].matchPairs` in
`structures.ts`. "The Team Conflict" and "The Motivation Problem" (Theo's
3rd and Oren's 2nd quests) copy their scenario text and every spot item's
wording and `isSuspicious` flag verbatim from
`leadershipQuest.spotItems.teamConflict`/`motivationProblem` and
`LQ_TEAM_CONFLICT_SPOT_ITEM_IDS`/`LQ_MOTIVATION_SPOT_ITEM_IDS`. "The
Deadline" (Theo's 4th quest) copies its 5 task labels and every
target/tolerance verbatim from `LQ_DEADLINE_CATEGORIES` (targets and
tolerances are multiples of 100 to match `AllocatePanel`'s fixed-100
stepper, exactly as the real `AllocateMechanic`'s own `STEP_MINOR_UNITS`
requires). "The Pressure Test" (Priya's 4th quest) copies its 3 bucket
labels and every item's wording and correct bucket verbatim from
`LQ_PRESSURE_TEST_BUCKET_KEYS`/`LQ_PRESSURE_TEST_ITEMS`. "The Final
Challenge" (Nadia's 2nd and final quest) copies its dialogue, match
pairs, and both decision points' choices/consequences verbatim from
`leadershipQuest.missions.final-challenge` — its first decision point
uses the real site's own `"none"`-tag fallback situation text rather
than one of the 6 personalized variants, since those depend on the
website's own Leadership Profile archetype tracking
(`computeLeadershipProfile`/`reflectionHistory`), which has no Godot
equivalent at all; using the honest fallback is a documented
simplification, never fabricated content. **This completes all 12 of
Leadership Quest's real missions.**

Entrepreneur Quest's last 10 real decision events were ported the same
way, across 3 new zones, with no new quest kinds needed — every one of
these decisions is a single CHALLENGE, simpler than the Business
Problems' investigate/diagnose/respond shape. Supply Yard's Pricing
Tester gives "The Pricing Experiment" (`pricing-experiment-reflection`):
the real website shows 3 pre-authored price/units-sold rows in a table
(at 3, 100 bought; at 5, 70; at 8, only 30) — Godot has no table UI, so
those same 3 real rows are spoken as `intro_dialogue` lines instead, the
same adaptation Research Lab's Fresh Trout data already used — then the
real 3 reflection choices/consequences are copied verbatim. The Supplier
Scout's "Choose a Supplier" (`choose-a-supplier`) narrates each real
supplier's actual price/delivery/minimum-order/quality level
(`EQ_SUPPLIER_OPTIONS`) as dialogue instead of a table, then the real 3
choices/consequences are copied verbatim. The Stock Keeper's "Managing
Your Stock" (`stock-management-scenario`) and the Bookkeeper's "Cash
Flow" (`cash-flow-decision`, including the real restaurant-order
scenario's own numbers — 2000/30 days/600 — spoken as plain numbers
since this project's virtual economy has no real-currency formatting to
apply to them) are both copied verbatim the same way.

AI Workshop's Tech Advisor gives "AI Can Be Wrong" (`ai-wrong-answer`),
copied directly from `entrepreneurQuest.aiLab.wrongAnswer` — the AI's
suggestion and the real data that contradicts it are both spoken as
`intro_dialogue` lines, keeping the real site's own "Simulated AI
Assistant (not real AI)" label intact; this is pre-written dialogue
about a fictional in-story tool, never an actual AI integration.

Turning Point's Business Advisor gives "Business Pivot"
(`business-pivot`) — the real site's situation text references
`{businessName}`, the child's own persisted company name from the
website's BUILD flow; Godot's CHALLENGE quests have no such persisted
identity, so it's spoken generically as "your business" instead, an
honest simplification, not fabricated content. The Growth Coach's "Grow
or Stay Small" (`grow-or-stay-small`) is copied verbatim with no
adaptation needed. The Ad Reviewer, Quality Inspector, and Sourcing
Advisor each give one of the real website's 3 Business Ethics scenarios
verbatim — "The Misleading Ad" (`misleading-ad`), "Hiding a Problem"
(`hiding-a-problem`), and "The Questionable Supplier"
(`cheap-questionable-supplier`) — kept as 3 separate NPCs/quests rather
than one multi-part quest, the same "one NPC per decision" shape every
other Entrepreneur Quest zone uses. **This completes all 26 of
Entrepreneur Quest's real decision events.** What's left in
Entrepreneur Quest is no longer decision events: the 18 BUILD stages'
own non-decision mechanics, the 5 standalone Challenges, the RUN/Rescue
& Grow hub pages, and the separate Business Rescue scenario (which
reuses 3 Business Problems against its own fixed company and
local-stats model) — each a UI shape this architecture doesn't fit, not
a content gap.

The Dictionary's 2 entries (`goal`, `trade-off`) aren't new content at
all — they point at `builder-saving-l1`'s own existing vocabulary
translation keys verbatim (see `data/schemas/ENTRY_DATA_FORMAT.md`'s rule
on this). Library and Museum have zero entries: no book, author,
historical story, or mentor biography is invented for this project, so
both stay empty until something real and verifiable is approved. Calm
World's 8 gardens and Mind Lab's scenario need no real-world fact to be
honest — a bubble is just a bubble — which is why they could be built now
while Library/Museum couldn't.

The Library's walkable zone is the same discipline applied to a physical
space rather than a data entry: the room, shelves, and Librarian are real
and built, but the Librarian's own line says plainly that there's nothing
to browse yet rather than ever implying otherwise. No book or author
appears anywhere in this project.

Mind Lab's "Different Explanations" scenario is original content, not
ported from the website (there's no existing Mind Lab curriculum to port
from) — but unlike a book, author, or historical story, it makes no claim
that needs an external source to verify: "a situation can have more than
one explanation" is a standard, well-established social-emotional-learning
idea, not a fact about the real world. Every one of its 4 choices gets an
equally validating consequence — there is no "correct" explanation, no
score, and nothing in its copy frames the experience as treatment,
therapy, or diagnosis.

The only new content anywhere in this project is UI chrome (menu/Hub/
portal/avatar-creation/zone-guide labels), the savings mini-game's own
week-prompt text (always original to that lesson's design), and the
"Business Guide" NPC's name — a generic role, not a named person, since
Entrepreneur Quest's real content has no fixed mentor character the way
Money Quest's curriculum already has Maya and Leadership Quest already has
its 4 named characters.

## Avatar wiring fix

A real gap, not a content choice, was found and fixed this phase:
`AvatarConfig` (body preset, outfit color, accessory) was being saved and
loaded correctly by `SaveManager`, but `Player.tscn`'s visual was a single
hardcoded-color capsule that never read it — every choice made in
`AvatarCreation.tscn` was invisible in the actual game. `Player.gd` now
applies the saved config every time a zone's `Player` node is
instantiated: `outfit_color` sets the body's material, `body_preset_id`
sets its shape, `accessory_id` shows one attachment.

At the same time, the preset and accessory lists grew to match the
project brief's explicit instruction to offer mobility aids, hearing
devices, and glasses as normal customization options, not a separate
category: `body_preset_id` now includes `preset-d`, a seated,
wheelchair-style silhouette, and `accessory_id` now includes
`hearing_aid` and `cane` alongside the existing `glasses` and `cap`. All
four presets and five accessory options (including "none") are listed
together in one unlabeled dropdown each in `AvatarCreation.tscn` — there
is no separate "accessibility" menu. Every option is purely visual:
`Player.gd` never changes `SPEED`, the `CollisionShape3D`, or interaction
range based on preset or accessory, so no customization choice carries a
gameplay cost or benefit.

## Audio + Settings screen fix

Two more real gaps, found while scoping audio architecture and fixed the
same way as the avatar wiring gap above:

- `AudioManager.gd` set `music_player.bus = "Music"` and
  `sfx_player.bus = "SFX"`, but no bus layout existed anywhere in the
  project — those buses didn't exist, so both players were silently
  falling back to `Master`, and there was no way to control music/SFX
  volume independently even once real audio assets arrive.
  `default_bus_layout.tres` now defines 4 real buses (Music, SFX, Voice,
  Ambient), `Settings.gd` holds one volume field per bus (0.0–1.0 linear,
  persisted by `SaveManager`), and `AudioManager.gd` applies each to the
  real `AudioServer` bus (with a clean mute at 0, not `linear_to_db(0)`'s
  `-inf`). Still inaudible today since zero audio assets exist — but the
  volume control itself is real, not a placeholder.
- There was no Settings UI anywhere in the project — `Settings.reduced_motion`
  could only ever be set by editing or loading a save file, never toggled
  by the child actually playing the game. `SettingsMenu.tscn` (a reusable
  overlay, reachable from a new button on `MainMenu` and a new gear-style
  button in the in-world `HUD`) now exposes a reduced-motion toggle plus
  the 4 volume sliders above.

Read-aloud was deliberately NOT added as a Settings toggle: there is no
text-to-speech engine anywhere in this project (per the brief's "do not
make AI voice generation a dependency"), so `AudioManager.speak()` stays
a documented no-op. Offering a UI control for something with nothing real
behind it would break this project's own honesty discipline — the same
reason the Library's shelves say plainly that they're empty rather than
pretending to have books.

## Project structure

See `docs/money-quest-world-architecture.md` Section 11 for the full
rationale. Quick map:

- `autoload/` — global singletons: `Localization`, `Settings` (now with 4
  volume fields), `GameState`, `ProgressManager`, `SaveManager`,
  `AudioManager` (now applies real `AudioServer` bus volume),
  `WorldManager`, `QuestManager`. `DialogueBox`/`ChoicePanel`/
  `RewardPopup` are also autoloads (scene-based) — see `project.godot`'s
  own comment on why.
- `scripts/core/` — the reusable lesson data model (`LessonData`,
  `DialogueLine`, `DialogueChoice`, `ChoiceOption`, `ConsequenceEffect`,
  `VocabTerm`), `LessonManager`, `Interaction`, `InteractionManager`,
  `MiniGameBase`, `VirtualMoney`.
- `scripts/world/` — `ZoneData`, `PortalInteraction`.
- `scripts/quests/` — `QuestData`.
- `scripts/player/` — `Player` (3D), `CameraController`, `AvatarConfig`.
- `scripts/characters/` — `NPC` (3D).
- `scripts/minigames/` — concrete mini-games extending `MiniGameBase`
  (currently one: `SavingsAllocationMiniGame`).
- `scripts/library/` — `EntryData`/`BookData`/`ExhibitData`/`MentorData`/
  `DictionaryTermData` (Library/Museum/Dictionary schema).
- `scenes/world/hub/WorldHub.tscn` — the Hub plaza.
- `scenes/world/zones/golden_vault/GoldenVault.tscn` — Money Quest's first
  zone; now with 3 resident NPCs, Maya, the Savings Guide, and Theo.
- `scenes/world/zones/market_town/MarketTown.tscn` — Money Quest's second
  zone, reached via a portal inside Golden Vault.
- `scenes/world/zones/guardian_gate/GuardianGate.tscn` — Money Quest's
  third zone, reached via a portal inside Market Town.
- `scenes/world/zones/sky_exchange/SkyExchange.tscn` — Money Quest's
  fourth zone, reached via a portal inside Guardian Gate.
- `scenes/world/zones/coin_cove/CoinCove.tscn` — Money Quest's fifth
  zone, reached via a portal inside Sky Exchange.
- `scenes/world/zones/horizon_peaks/HorizonPeaks.tscn` — Money Quest's
  sixth zone, reached via a portal inside Coin Cove.
- `scenes/world/zones/kindness_grove/KindnessGrove.tscn` — Money Quest's
  seventh and final zone, reached via a portal inside Horizon Peaks.
- `scenes/world/zones/idea_lab/IdeaLab.tscn` — Entrepreneur Quest's first
  zone.
- `scenes/world/zones/marketing_studio/MarketingStudio.tscn` —
  Entrepreneur Quest's second zone, reached via a portal inside Idea Lab.
- `scenes/world/zones/workshop/Workshop.tscn` — Entrepreneur Quest's
  third zone, reached via a portal inside Marketing Studio.
- `scenes/world/zones/office/Office.tscn` — Entrepreneur Quest's fourth
  zone, reached via a portal inside Workshop.
- `scenes/world/zones/growth_lab/GrowthLab.tscn` — Entrepreneur Quest's
  fifth zone, reached via a portal inside Office.
- `scenes/world/zones/research_lab/ResearchLab.tscn` — Entrepreneur
  Quest's sixth zone, reached via a portal inside Growth Lab.
- `scenes/world/zones/main_street/MainStreet.tscn` — Entrepreneur
  Quest's seventh zone, reached via a portal inside Research Lab.
- `scenes/world/zones/leadership_academy/LeadershipAcademy.tscn` —
  Leadership Quest's first zone.
- `scenes/world/zones/team_challenge/TeamChallenge.tscn` — Leadership
  Quest's second zone, reached via a portal inside Leadership Academy.
- `scenes/world/zones/strategy_room/StrategyRoom.tscn` — Leadership
  Quest's third zone, reached via a portal inside Team Challenge.
- `scenes/world/zones/calm_world/` — Calm World's 8 gardens:
  `BubbleGarden.tscn` (reachable from the Hub) plus `AquariumRoom.tscn`,
  `LightRoom.tscn`, `RainRoom.tscn`, `UnderwaterRoom.tscn`,
  `ForestWalk.tscn`, `MusicRoom.tscn`, and `GrowAGarden.tscn` (each
  reached via a portal placed inside Bubble Garden).
- `scenes/world/zones/library/Library.tscn` — the Library zone, honestly
  empty of real books.
- `scenes/world/zones/mind_lab/MindLab.tscn` — Mind Lab's first zone and
  quest.
- `scenes/world/Main.tscn` — the persistent root: a `ZoneContainer`
  `WorldManager` swaps zone scenes into, plus the always-present `HUD`.
- `scenes/player/` — `Player.tscn`, `CameraController.tscn`,
  `AvatarCreation.tscn`.
- `scenes/characters/NPC.tscn`.
- `scenes/quests/builder_saving_l1/` — Maya's quest's mini-game stage.
- `scenes/ui/` — `DialogueBox`, `ChoicePanel`, `RewardPopup`, `HUD` (now
  with a Settings button and a mobile "Talk" button).
- `scenes/menus/` — `MainMenu.tscn` (now with a Settings button),
  `SettingsMenu.tscn` (reduced-motion toggle + 4 volume sliders,
  reachable from both `MainMenu` and `HUD`).
- `default_bus_layout.tres` — the 4 real audio buses (Music, SFX, Voice,
  Ambient) referenced in `project.godot`'s `[audio]` section.
- `data/zones/`, `data/quests/`, `data/lessons/` — content `.tres` files.
- `data/dictionary/` — 2 real `DictionaryTermData` entries.
- `data/library/`, `data/museum/`, `data/avatars/` — reserved, empty.
- `data/schemas/` — `LESSON_DATA_FORMAT.md`, `QUEST_DATA_FORMAT.md`,
  `ZONE_DATA_FORMAT.md`, `ENTRY_DATA_FORMAT.md`: how to add new content
  without touching core scripts.
- `localization/translations.csv` — all UI/dialogue/quiz text, 9 locale
  columns (`en`/`ro` populated; `es/fr/de/it/pt/nl/pl` columns exist but
  are empty — flagged, not silently faked).

## Known limitations (stated plainly)

- Hand-authored `.tscn`/`.tres` files were not opened in the Godot editor
  as part of this work (no Godot editor was available in this
  environment). They follow Godot 4's documented text-format conventions,
  but the first real open in the editor is the actual verification step —
  treat it as such, not as already-proven.
- No art or audio assets are included — visuals are flat-color primitive
  meshes (capsules, boxes), matching the brief's own instruction not to
  invent visual direction decisions beyond what's needed to demonstrate
  the architecture. The 4 audio buses and their volume sliders are real
  and already wired to `AudioServer`, but silent until real `.ogg` files
  are dropped into `assets/audio/` and referenced from `AudioManager.gd`.
  Read-aloud/text-to-speech has no engine wired in at all — not even a
  silent placeholder bus — since one would require either an offline
  voice model or a paid API, both out of scope per the brief.
- All 30 of Money Quest's real website curriculum lessons are now wired
  up as Quests. **All 26 of Entrepreneur Quest's real decision events
  are now ported** (its v1 set, its v2 Business Problems, the v2 RUN
  set, the AI Business Lab's one decision event, and the Rescue & Grow
  set), **and all 18 of its real BUILD stages are now ported too** —
  the real website's Build-Your-Business stepper, via a new
  `BusinessProfileData`/`BusinessBuilder` persistent-state system and 6
  new UI panels (text input, logo builder, category picker, numeric
  stepper, Business Simulator, final pitch display) — launched/resumed
  through Idea Lab's new Startup Mentor NPC. This completes
  Entrepreneur Quest's full real BUILD → RUN → RESCUE & GROW track end
  to end; only the 5 standalone Business Challenges, the RUN/Rescue &
  Grow hub pages, and the separate Business Rescue scenario remain
  unbuilt, each a UI shape this architecture doesn't fit (a standalone
  quiz list, a dashboard page with no new decision content of its own,
  a second company's own local-stats model) rather than a content gap.
  **All 12 of Leadership Quest's real missions are now ported**, using
  5 new quest kinds (`MATCH`/`SPOT`/`ALLOCATE`/`SORT`/`MULTI_STEP`) and
  4 new autoloaded mini-game panels that port the real website's own
  mechanic components faithfully — see
  `docs/money-quest-world-architecture.md` Section 10's status table
  and Section 12's narrative for the full account. The Business
  Simulator's result math is an exact, verbatim port of the real
  website's own `runSimulator()` formula
  (`src/lib/entrepreneur-quest/state.ts`); the final pitch display
  deliberately omits the real site's running `reputationOutOf5` line,
  since Godot's CHALLENGE quests pay a flat reward rather than
  accumulating that stat the way the website's `BusinessProfile`
  does — an honest gap, not a fabricated number.
  See Section 12 also for the development order for the remaining
  Challenge/hub content, the 17 games, and the 4 simulator
  scenarios.
- Museum is the only Hub portal still reachable-but-"coming soon" — the
  portal, zone registration, and locking logic all already work for it;
  only its actual zone content doesn't exist yet, by design, per the
  brief's explicit "do not build all of this content at once." The
  Library's portal is functional and its zone is real, but it has zero
  real book entries for the same reason Museum has zero exhibits: no
  book, historical story, or mentor biography may be invented — see
  `data/schemas/ENTRY_DATA_FORMAT.md`. Mind Lab and all 8 of Calm World's
  named gardens are fully built, since neither needed a real-world fact
  to verify before it could be written honestly.
