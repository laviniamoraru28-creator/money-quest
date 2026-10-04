class_name MentorData
extends EntryData
## MentorData — one "Meet the Mentors" entry (a real, successful person
## presented as an educational mentor — see the original brief's Section
## 10). No mentor is invented or quoted for this architecture: every field
## below stays an empty placeholder until a real, factual biography is
## approved and added as content. Biographies must stay strictly factual
## when populated — no invented quotes, ever (an original child-friendly
## paraphrase is used instead, per the brief's explicit preference). The
## first real mentors were added once explicitly supplied with name/
## skills/official source — see data/mentors/.
##
## Field shape maps directly to the brief's required mentor profile:
## who they are (title_key/summary_key, inherited), what they did
## (known_for_key), a mistake or challenge they faced
## (mistake_or_challenge_key), what skill we can learn (lesson_key), and
## a small challenge for the child (small_challenge_key) — worded as "try
## a challenge inspired by this skill," never as the real person
## personally addressing the child.

@export var known_for_key: String = ""
@export var mistake_or_challenge_key: String = ""
@export var lesson_key: String = ""
@export var small_challenge_key: String = ""

## Which Smart Skills this mentor models (shown as simple tags — see
## ProgressManager.skill_points for the same skill-id vocabulary used by
## quests).
@export var skill_ids: Array[String] = []

## A Hub zone id to travel to for "Explore this" — "" when no
## corresponding Quest-track zone is a strong enough fit (left empty
## rather than forced; see the brief's "do not force diversity/
## connections artificially").
@export var cross_link_zone_id: String = ""

## A QuestData id for "Try a challenge inspired by this skill" — "" when
## no mini-challenge has been built for this mentor yet. Reuses the
## existing QuestManager/QuestData pipeline directly; never a bespoke
## mentor-challenge system.
@export var try_quest_id: String = ""
